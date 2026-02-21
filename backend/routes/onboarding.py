from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from db.supabase_client import supabase
from core.concept_graph import get_weakness_chain

router = APIRouter()


class OnboardingRequest(BaseModel):
    email: str
    name: str
    semester: int
    experience: str
    goal: str
    daily_time: str
    topics_covered: list[str]
    comfort_ratings: dict[str, int]          # topic_key -> seeded score (10/35/65)
    diagnostic_results: dict[str, bool]      # topic_key -> True=correct, False=wrong
    misconceptions: Optional[dict[str, str]] = {}


@router.post("/onboarding")
async def save_onboarding(req: OnboardingRequest):
    # 1. Start with comfort_ratings as base mastery
    mastery_data = dict(req.comfort_ratings)

    # 2. Diagnostic wrong answers cap mastery at 25
    for topic, correct in req.diagnostic_results.items():
        if not correct and topic in mastery_data:
            mastery_data[topic] = min(mastery_data[topic], 25)

    # 3. Derive weak topics (mastery < 40, consistent with session.py and question_bank.py)
    weak_topics = [t for t, score in mastery_data.items() if score < 40]

    # 4. Use concept graph to order weakness chain by what blocks the most
    weakness_chain = get_weakness_chain(mastery_data, threshold=40)

    # 5. Upsert into students table
    payload = {
        "email":           req.email,
        "name":            req.name,
        "semester":        req.semester,
        "experience":      req.experience,
        "goal":            req.goal,
        "daily_time":      req.daily_time,
        "topics_covered":  req.topics_covered,
        "weak_topics":     weak_topics,
        "mastery_data":    mastery_data,
        "misconceptions":  req.misconceptions or {},
        "weakness_chain":  weakness_chain,
        "onboarding_done": True,
        "xp":              0,
        "streak":          0,
    }

    result = supabase.table("students").upsert(payload).execute()

    if hasattr(result, "error") and result.error:
        return {"success": False, "error": str(result.error)}

    return {
        "success":       True,
        "weak_topics":   weak_topics,
        "weakness_chain": weakness_chain,
        "mastery":       mastery_data,
    }
