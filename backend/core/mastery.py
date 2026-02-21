def calculate_mastery(current_score: int, was_correct: bool, confidence: str = "medium") -> int:
    """
    Update a topic's mastery score after an interaction.

    Confidence modifiers (from Claude's Stage 1 classification):
        high   → bigger swing (student was very sure either way)
        medium → standard swing
        low    → smaller swing (student was guessing)

    Returns new score clamped to [0, 100].
    """
    confidence_multiplier = {
        "high":   1.4,
        "medium": 1.0,
        "low":    0.6,
    }.get(confidence, 1.0)

    if was_correct:
        delta = round(8 * confidence_multiplier)
    else:
        delta = round(-12 * confidence_multiplier)

    new_score = current_score + delta
    return max(0, min(100, new_score))


def get_weakness_summary(mastery_data: dict[str, int], threshold: int = 40) -> dict:
    """
    Return a breakdown of topic strength for use in prompts.
    """
    strong  = {k: v for k, v in mastery_data.items() if v >= 65}
    medium  = {k: v for k, v in mastery_data.items() if 40 <= v < 65}
    weak    = {k: v for k, v in mastery_data.items() if v < threshold}

    return {
        "strong": strong,
        "medium": medium,
        "weak":   weak,
    }
