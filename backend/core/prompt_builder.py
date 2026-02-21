"""
prompt_builder.py  — Lean 2-stage Gemini pipeline

Stage 1 (Classifier): TINY prompt — code + complaint only. No profile.
                       Fast JSON classification in ~0.5s.

Stage 2 (Tutor):      Profile + classification results + structured format.
                       Produces sectioned markdown that maps directly to
                       the Session output panel.
"""


def _profile_summary(profile: dict) -> str:
    name       = profile.get("name", "the student")
    goal       = profile.get("goal", "general improvement")
    mastery    = profile.get("mastery_data") or {}
    weak       = profile.get("weak_topics") or []
    misconceptions = profile.get("misconceptions") or {}

    mastery_lines = "\n".join(
        f"  {topic}: {score}%"
        for topic, score in sorted(mastery.items(), key=lambda x: x[1])
        if score < 75          # only show weak/medium for brevity
    ) or "  (no mastery data)"

    misconception_lines = "\n".join(
        f"  {topic}: {note}" for topic, note in misconceptions.items()
    ) or "  (none)"

    weak_str = ", ".join(weak) if weak else "none"

    return (
        f"Student: {name} | Goal: {goal}\n"
        f"Weak areas: {weak_str}\n"
        f"Mastery (weak only):\n{mastery_lines}\n"
        f"Past misconceptions:\n{misconception_lines}"
    )


# ── Stage 1: Lean Classifier ──────────────────────────────────────────────────
# Fast — no profile, just code + complaint. Under 300 tokens total.

def build_classifier_prompt(
    student_code: str,
    problem_statement: str,
    whats_wrong: str,
    student_profile: dict,   # kept for signature compat, not used in Stage 1
) -> str:
    """Kept for backward compat — use build_unified_prompt instead."""
    complaint_line = f"\nStudent says: {whats_wrong}" if whats_wrong.strip() else ""
    problem_line   = f"\nProblem: {problem_statement}" if problem_statement.strip() else ""
    return f"""Output ONLY valid JSON. No explanation. No markdown fences.
{problem_line}{complaint_line}

Student code:
{student_code or "(no code provided)"}

{{
  "topic_category": "<DSA concept>",
  "confidence": "high|medium|low",
  "is_correct": true|false,
  "misconceptions": ["<specific bug>"],
  "error_summary": "<one sentence: the main bug>"
}}"""


# ── Unified prompt (Python pre-computes context, one LLM call) ────────────────

def build_unified_prompt(
    student_code: str,
    problem_statement: str,
    whats_wrong: str,
    student_profile: dict,
    topic: str = "general",
    prereq_gaps: list = None,
    mistake_count: int = 0,
    misconceptions: list = None,
) -> str:
    """
    Single Gemini call with ALL context pre-computed by Python:
      - topic:         from detect_topic() — keyword match, zero API cost
      - prereq_gaps:   from get_root_gaps() — concept graph, pure Python
      - mistake_count: from count_mistakes() — DB query
      - misconceptions: from student profile

    Gemini's only job: explain clearly using the context we hand it.
    """
    prereq_gaps   = prereq_gaps   or []
    misconceptions = misconceptions or []

    name     = student_profile.get("name") or "the student"
    goal     = student_profile.get("goal") or "improve at DSA"
    mastery  = student_profile.get("mastery_data") or {}
    weak     = student_profile.get("weak_topics") or []

    # Build compact mastery table (only weak topics)
    mastery_lines = "\n".join(
        f"  {t}: {s}%" for t, s in sorted(mastery.items(), key=lambda x: x[1]) if s < 75
    ) or "  (no data)"

    root_gap_str   = prereq_gaps[0] if prereq_gaps else topic
    difficulty     = "easier (they have root gaps)" if prereq_gaps else "similar"
    misconception  = misconceptions[0] if misconceptions else "none identified yet"
    complaint_line = f"\nStudent's complaint: {whats_wrong}" if whats_wrong.strip() else ""
    problem_line   = f"\nProblem: {problem_statement}" if problem_statement.strip() else ""
    mistake_str    = f"{mistake_count} previous failed attempt(s)" if mistake_count > 0 else "first attempt"

    return f"""You are AskWise, a personalized DSA tutor.

STUDENT PROFILE:
  Name: {name} | Goal: {goal}
  Weak areas: {", ".join(weak) or "none recorded"}
  Mastery (weak topics only):
{mastery_lines}

PRE-COMPUTED CONTEXT (our system already calculated this — trust it):
  Topic detected: {topic}
  Root prerequisite gaps: {prereq_gaps if prereq_gaps else "none — topic itself is the gap"}
  Mistake history on this topic: {mistake_str}
  Known misconception: {misconception}
{problem_line}{complaint_line}

Student's code:
```
{student_code or "(no code provided)"}
```

INSTRUCTIONS — write the explanation using EXACTLY THESE 5 SECTIONS:

## What You Got Wrong
[One sentence. Name the exact error. Address {name} directly.]

## Why This Happens
[2-3 sentences. Start explaining from {root_gap_str} — that is {name}'s confirmed root gap, not the surface topic. Connect it to the bug.]

## Your Fixed Code
```python
[Full corrected code. EVERY changed line MUST have an inline comment explaining WHY.]
```

## Line by Line
[Walk through each fix with line numbers and the reason for each change.]

## Try This Next
[One follow-up problem at {difficulty} difficulty, targeting {root_gap_str}.]

Output ONLY valid JSON — no text before or after:
{{
  "is_correct": true or false,
  "explanation": "<all 5 sections joined as one string, keep the ## headers>",
  "corrected_code": "<corrected python string, or null if code was already correct>",
  "follow_up_question": "<the Try This Next problem as a plain string>",
  "visualization": {{
    "RULES": "Include this field ONLY if the problem involves a graph, tree, BFS, DFS, or linked list. Otherwise output null.",
    "type": "<'graph' | 'tree' | 'linked_list'>",
    "nodes": [0, 1, 2, 3],
    "edges": [[0,1], [0,2], [1,3]],
    "traversal_order": [0, 1, 3, 2],
    "highlight": [3]
  }}
}}

VISUALIZATION RULES:
- Output visualization for: graph traversal, BFS, DFS, binary trees, linked lists
- Set visualization to null for: arrays, strings, hashmaps, DP, factorial, sorting
- nodes: list of integer IDs from the actual problem
- edges: list of [source, target] pairs from the actual problem
- traversal_order: the order nodes are visited in the correct algorithm
- highlight: nodes that relate to the bug or the key insight to fix""" 



# ── Stage 2: Structured Tutor ─────────────────────────────────────────────────

def build_tutor_prompt(
    student_code: str,
    problem_statement: str,
    whats_wrong: str,
    student_profile: dict,
    topic_category: str,
    root_gaps: list[str],
    detected_misconceptions: list[str],
    is_correct: bool,
) -> str:
    profile_str   = _profile_summary(student_profile)
    name          = student_profile.get("name", "the student")
    root_gap_str  = root_gaps[0] if root_gaps else topic_category
    difficulty    = "easier" if len(root_gaps) > 0 else "similar"
    status        = "CORRECT (but improvable)" if is_correct else "BUGGY"
    misconception = detected_misconceptions[0] if detected_misconceptions else "see error summary"
    complaint_line = f"\nStudent's complaint: {whats_wrong}" if whats_wrong.strip() else ""
    problem_line   = f"\nProblem: {problem_statement}" if problem_statement.strip() else ""

    return f"""You are AskWise, a DSA tutor. Use the student's profile to personalize every sentence.

{profile_str}

Topic: {topic_category} | Code status: {status}
Root gap to address first: {root_gap_str}
Specific misconception: {misconception}
{problem_line}{complaint_line}

Student's code:
```
{student_code or "(no code provided)"}
```

YOUR RESPONSE MUST USE EXACTLY THIS FORMAT (all 5 sections, in order):

## What You Got Wrong
[One clear sentence naming the specific error — be direct, address {name} by name]

## Why This Happens
[2-3 sentences explaining the concept behind the error. Start from {root_gap_str} because that is {name}'s root gap. Connect it to the bug they made.]

## Your Fixed Code
```python
[Full corrected code — EVERY changed line must have an inline comment explaining WHY]
```

## Line by Line
[Walk through each change you made and why. Reference the line numbers.]

## Try This Next
[One follow-up problem at {difficulty} difficulty that targets {root_gap_str}]

Output ONLY valid JSON with these exact keys. No extra text before or after.
{{
  "explanation": "<## What You Got Wrong\\n...\\n\\n## Why This Happens\\n...\\n\\n## Why This Matters\\n...>",
  "corrected_code": "<corrected python code string, or null if already correct>",
  "follow_up_question": "<the Try This Next problem as a single string>"
}}"""


# ── Concept mode ──────────────────────────────────────────────────────────────

def build_concept_prompt(
    concept_question: str,
    student_profile: dict,
) -> str:
    profile_str = _profile_summary(student_profile)
    name = student_profile.get("name", "the student")
    weak = student_profile.get("weak_topics") or []
    weak_str = ", ".join(weak) if weak else "none"

    return f"""You are AskWise, a DSA tutor. Answer this concept question, personalized to the student.

{profile_str}

Question: {concept_question}

Structure your answer with EXACTLY these sections:

## Answer
[Direct answer in 2-3 sentences. Address {name} by name.]

## Example
[Code example if relevant, with inline comments]

## Connection to Your Weak Areas
[How this concept relates to their weak areas: {weak_str}. Skip if unrelated.]

## Try This
[One follow-up question to test understanding]

Output ONLY valid JSON:
{{
  "explanation": "<your full formatted answer with the section headers>",
  "corrected_code": null,
  "follow_up_question": "<the Try This question as a string>"
}}"""
