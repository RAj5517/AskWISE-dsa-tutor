from pathlib import Path
from fastapi import APIRouter, HTTPException
from dotenv import load_dotenv
from db.supabase_client import supabase
from core.concept_graph import get_weakness_chain

load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env")

router = APIRouter()


@router.get("/progress/{email:path}")
async def get_progress(email: str):
    """
    Return a student's full progress snapshot for the Dashboard.
    Used by Dashboard.jsx — falls back to Supabase directly if this endpoint is down.
    """
    res = supabase.table("students").select("*").eq("email", email).maybe_single().execute()
    student = res.data

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    mastery_data = student.get("mastery_data") or {}

    # Recalculate weakness chain fresh (reflects any mastery updates from sessions)
    weakness_chain = get_weakness_chain(mastery_data, threshold=40)

    # Derive weak topics inline
    weak_topics = [t for t, s in mastery_data.items() if s < 40]

    # Write recalculated values back to DB so they stay in sync (best-effort)
    try:
        supabase.table("students").update({
            "weakness_chain": weakness_chain,
            "weak_topics":    weak_topics,
        }).eq("email", email).execute()
    except Exception as e:
        print(f"[progress] weakness_chain sync failed (non-fatal): {e}")

    return {
        "email":           student.get("email"),
        "name":            student.get("name"),
        "semester":        student.get("semester"),
        "experience":      student.get("experience"),
        "goal":            student.get("goal"),
        "xp":              student.get("xp", 0),
        "streak":          student.get("streak", 0),
        "mastery":         mastery_data,
        "weak_topics":     weak_topics,
        "weakness_chain":  weakness_chain,
        "topics_covered":  student.get("topics_covered") or [],
        # recent_interactions can be added later when interaction logging is built
        "recent_interactions": [],
    }
