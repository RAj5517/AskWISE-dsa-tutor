import os
import json
import re
from pathlib import Path
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import google.generativeai as genai
from dotenv import load_dotenv

from db.supabase_client import supabase
from core.concept_graph import get_root_gaps, get_weakness_chain, get_bfs_learning_path, detect_topic, count_mistakes
from core.mastery import calculate_mastery
from core.question_bank import get_question
from core.prompt_builder import (
    build_unified_prompt,
    build_concept_prompt,
)

load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env")

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-2.5-flash")

router = APIRouter()


# ── Request shape ─────────────────────────────────────────────────────────────

class SessionRequest(BaseModel):
    student_email: str
    mode: str                          # "code" | "concept" | "practice"
    question: Optional[str] = ""
    student_code: Optional[str] = ""
    whats_wrong: Optional[str] = ""
    topic: Optional[str] = ""          # practice mode: selected topic
    phase: Optional[str] = "submit"    # practice: "question" | "submit"


# ── Helpers ───────────────────────────────────────────────────────────────────

def _fetch_student(email: str) -> dict:
    """Fetch student row from Supabase. Returns empty dict if not found."""
    try:
        res = supabase.table("students").select("*").eq("email", email).limit(1).execute()
        data = res.data[0] if res.data else {}
        print(f"[session] fetched student for {email}: name={data.get('name')}, "
              f"mastery_keys={list((data.get('mastery_data') or {}).keys())[:5]}")
        return data
    except Exception as e:
        print(f"[session] _fetch_student ERROR for {email}: {e}")
        return {}


def _call_gemini(prompt: str) -> str:
    """Call Gemini and return raw text. Raises HTTPException on quota/API errors."""
    try:
        response = model.generate_content(prompt)
        text = response.text  # may be None if blocked by safety filters
        if not text:
            # Check why it was blocked
            finish = getattr(response.candidates[0], 'finish_reason', 'UNKNOWN') if response.candidates else 'NO_CANDIDATES'
            print(f"[session] Gemini returned empty — finish_reason={finish}")
            raise HTTPException(status_code=422, detail=f"AI refused to process this content (finish_reason={finish}). Try rephrasing.")
        return text.strip()
    except HTTPException:
        raise  # re-raise our own
    except Exception as e:
        error_msg = str(e)
        print(f"[session] Gemini error ({type(e).__name__}): {error_msg[:500]}")
        if "429" in error_msg or "ResourceExhausted" in error_msg or "quota" in error_msg.lower():
            raise HTTPException(status_code=503, detail="AI quota exceeded — please wait a moment and try again.")
        raise HTTPException(status_code=502, detail=f"AI service error: {error_msg[:200]}")


def _fetch_interactions(email: str) -> list:
    """Fetch recent interactions for mistake counting. Returns empty list on error."""
    try:
        res = supabase.table("interactions") \
            .select("topic_category,is_correct") \
            .eq("student_email", email) \
            .limit(50) \
            .execute()
        return res.data or []
    except Exception as e:
        print(f"[session] _fetch_interactions error (non-fatal): {e}")
        return []



def _clean_viz(viz) -> dict | None:
    """Validate and clean the optional visualization object from Gemini.
    Returns None if missing, not a dict, or lacks required fields.
    Strips the RULES meta-key Gemini may echo back from the prompt template."""
    if not viz or not isinstance(viz, dict):
        return None
    viz.pop("RULES", None)  # strip prompt template instructions if echoed
    if not viz.get("nodes") or not viz.get("edges"):
        return None
    return viz


def _parse_json_response(raw: str) -> dict:
    """Robustly parse JSON from Gemini's response, stripping any markdown fences."""
    cleaned = re.sub(r"^```(?:json)?\s*", "", raw.strip(), flags=re.MULTILINE)
    cleaned = re.sub(r"\s*```$", "", cleaned.strip(), flags=re.MULTILINE)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except Exception:
                pass
        return {}


def _update_mastery_in_db(email: str, topic: str, student: dict, was_correct: bool, confidence: str):
    """Recalculate mastery for topic and write update + XP to Supabase."""
    mastery_data = dict(student.get("mastery_data") or {})
    current = mastery_data.get(topic, 35)
    new_score = calculate_mastery(current, was_correct, confidence)
    mastery_data[topic] = new_score

    weak_topics = [t for t, s in mastery_data.items() if s < 40]
    weakness_chain = get_weakness_chain(mastery_data)

    supabase.table("students").update({
        "mastery_data":   mastery_data,
        "weak_topics":    weak_topics,
        "weakness_chain": weakness_chain,
        "xp":             (student.get("xp") or 0) + 10,
    }).eq("email", email).execute()

    return mastery_data, new_score


def _log_interaction(email: str, req: SessionRequest, classification: dict, tutor_result: dict):
    """Write interaction record to interactions table (best-effort, never crashes session)."""
    try:
        supabase.table("interactions").insert({
            "student_email":    email,
            "mode":             req.mode,
            "question":         req.question or "",
            "student_code":     req.student_code or "",
            "whats_wrong":      req.whats_wrong or "",
            "topic_category":   classification.get("topic_category", ""),
            "is_correct":       classification.get("is_correct", False),
            "explanation":      tutor_result.get("explanation", ""),
            "corrected_code":   tutor_result.get("corrected_code"),
            "follow_up_question": tutor_result.get("follow_up_question", ""),
            "difficulty":       "easy",
        }).execute()
    except Exception as e:
        print(f"[session] interaction log failed (non-fatal): {e}")


# ── Main endpoint ─────────────────────────────────────────────────────────────

@router.post("/session")
async def session(req: SessionRequest):
    student = _fetch_student(req.student_email)

    # ── Practice: fetch question only ────────────────────────────────────────
    if req.mode == "practice" and req.phase == "question":
        mastery_data  = student.get("mastery_data") or {}
        mastery_score = mastery_data.get(req.topic, 35)
        question = get_question(req.topic, mastery_score)
        return {"question": question}

    # ── Concept mode (single Gemini call) ────────────────────────────────────
    if req.mode == "concept":
        prompt = build_concept_prompt(req.question, student)
        raw    = _call_gemini(prompt)
        result = _parse_json_response(raw)
        return {
            "explanation":        result.get("explanation", raw),
            "corrected_code":     None,
            "follow_up_question": result.get("follow_up_question", ""),
            "xp_earned":          5,
            "mode":               "concept",
        }

    # ── Code mode + Practice submit (Python-first pipeline, 1 Gemini call) ──────
    problem     = req.question or ""
    code        = req.student_code or ""
    whats_wrong = req.whats_wrong or ""

    # Step 1 — TF-IDF + Naive Bayes topic detection (trains once on startup, ~1ms per call)
    if req.mode == "practice":
        topic_key, topic_confidence = req.topic, 1.0
    else:
        topic_key, topic_confidence = detect_topic(problem, code)
    print(f"[session] detected topic: {topic_key} (confidence={topic_confidence:.0%})")

    # Step 2 — run concept graph in Python (no API)
    weak_topics    = student.get("weak_topics") or []
    prereq_gaps    = get_root_gaps(topic_key, weak_topics)

    # Step 3 — count past mistakes from interactions table (DB, no API)
    interactions   = _fetch_interactions(req.student_email)
    mistake_count  = count_mistakes(interactions, topic_key)

    # Step 4 — pull misconceptions from profile
    profile_misconceptions = student.get("misconceptions") or {}
    misconception_list = list(profile_misconceptions.values()) if isinstance(profile_misconceptions, dict) \
                         else list(profile_misconceptions)

    # Step 4b — BFS learning path (pure graph algorithm, zero API cost)
    mastery_data_now = student.get("mastery_data") or {}
    learning_path = get_bfs_learning_path(topic_key, mastery_data_now, threshold=40)

    print(f"[session] prereq_gaps={prereq_gaps}, mistakes={mistake_count}, topic={topic_key}")

    # Step 5 — ONE Gemini call with everything pre-computed
    unified_prompt = build_unified_prompt(
        student_code     = code,
        problem_statement= problem,
        whats_wrong      = whats_wrong,
        student_profile  = student,
        topic            = topic_key,
        prereq_gaps      = prereq_gaps,
        mistake_count    = mistake_count,
        misconceptions   = misconception_list,
    )
    raw    = _call_gemini(unified_prompt)
    result = _parse_json_response(raw)

    is_correct     = result.get("is_correct", False)
    confidence     = result.get("confidence", "medium")   # use Gemini's own assessment
    topic_category = topic_key
    root_gaps      = prereq_gaps

    # Tiered XP: harder problems (root gaps exist) + correct = more rewarding
    has_gaps = len(prereq_gaps) > 0
    if is_correct and has_gaps:
        xp_earned = 20   # correct answer despite prerequisite gaps — big reward
    elif is_correct:
        xp_earned = 10   # correct, standard
    else:
        xp_earned = 3    # wrong, small XP for attempting

    # Persist mastery update
    mastery_data, new_score = _update_mastery_in_db(
        req.student_email, topic_key, student, is_correct, confidence
    )

    # Log interaction (best-effort)
    _log_interaction(req.student_email, req, result, result)

    return {
        "explanation":         result.get("explanation", raw),
        "corrected_code":      result.get("corrected_code"),
        "follow_up_question":  result.get("follow_up_question", ""),
        "topic_category":      topic_category,
        "topic_confidence":    topic_confidence,           # TF-IDF NB confidence score
        "is_correct":          is_correct,
        "root_gaps":           root_gaps,
        "learning_path":       learning_path,             # BFS-ordered study path
        "mastery":             mastery_data,
        "updated_topic_score": new_score,
        "xp_earned":           xp_earned,
        "mode":                req.mode,
        "visualization":       _clean_viz(result.get("visualization")),
    }
