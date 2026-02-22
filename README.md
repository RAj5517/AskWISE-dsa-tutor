# AskWISE — Personalized DSA Tutor

> *"LeetCode tells you what to solve. AskWISE tells you why you're failing and what to fix first."*

AskWISE is an AI-powered tutoring platform that gives CS students personalized feedback on their DSA code submissions. Unlike platforms that treat every student identically, AskWISE uses a prerequisite knowledge graph to identify the **root cause** of a student's struggles — not just the surface error — and adapts every session to their specific knowledge gaps.

The system runs a **Python-first pipeline** to detect topics, trace prerequisite gaps, and count past mistakes — then sends all that pre-computed context to Gemini in a single API call. Gemini's only job is to explain what the system already figured out.

---

## Features

- 🧠 **Personalized explanations** — tailored to each student's mastery profile, weak topics, and past misconceptions
- 🔍 **Concept graph traversal** — identifies root prerequisite gaps, not just surface errors
- 📊 **Mastery tracking** — updates per topic after every submission (+8 correct / −12 wrong, confidence-weighted)
- 🎯 **Three modes** — Code Review, Ask Concept, Practice
- 📈 **Graph visualizer** — animated BFS/DFS/tree traversal for visual problems
- ✨ **Rich markdown rendering** — VS Code-themed syntax highlighting in explanations
- 🔥 **XP + Streak system** — tiered rewards (20 XP for overcoming prerequisite gaps, 10 standard, 3 for attempt)
- 🗺️ **BFS learning path** — always computes your optimal next study topic from the concept graph
- 🎓 **Adaptive difficulty** — questions auto-select easy/medium/hard based on your mastery score

---

## How It Works

```
Student submits code
        ↓
Python (zero API cost):
  detect_topic()        → keyword + TF-IDF classification
  get_root_gaps()       → concept graph prerequisite analysis
  count_mistakes()      → interaction history from DB
        ↓
Single Gemini call — receives fully pre-computed context
        ↓
Structured 5-section response:
  ## What You Got Wrong
  ## Why This Happens       ← starts from ROOT GAP, not surface topic
  ## Your Fixed Code        ← every changed line has inline comment
  ## Line by Line
  ## Try This Next          ← adaptive difficulty follow-up
        ↓
Mastery score updated, XP awarded, weakness chain recomputed
```

---

## DSA Concept Graph

At the core of AskWISE is a Directed Acyclic Graph (DAG) of 16 DSA topics encoding prerequisite relationships:

```
arrays ──── hashing, two_pointers, sliding_window, binary_search, sorting, stacks, linked_lists, heaps
recursion ── trees ── bst
                   └─ graphs ── bfs_dfs ── (also needs stacks + queues)
linked_lists ──── queues
dp ── (needs recursion + arrays + hashing)
```

`get_weakness_chain()` sorts weak topics by how many other topics they block — so the most foundational gaps are fixed first.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + Tailwind CSS + shadcn/ui |
| Backend | FastAPI + Python + Uvicorn |
| Database | Supabase (PostgreSQL + Auth) |
| AI | Google Gemini API (`gemini-2.5-flash`) |
| ML (planned) | scikit-learn — TF-IDF + Naive Bayes topic classifier |
| Deployment | Render (backend) + Vercel (frontend) |

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Google AI Studio](https://aistudio.google.com) API key (free)

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
source .venv/bin/activate     # Mac/Linux
pip install -r requirements.txt
cp .env.example .env          # fill in your keys
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env          # fill in your keys
npm run dev
```

---

## Environment Variables

### `backend/.env`

```env
GEMINI_API_KEY=...            # from aistudio.google.com — free tier available
SUPABASE_URL=...              # Project Settings → API → Project URL
SUPABASE_SERVICE_KEY=...      # Project Settings → API → Legacy Keys → service_role (eyJ...)
```

### `frontend/.env`

```env
VITE_SUPABASE_URL=...         # same as backend SUPABASE_URL
VITE_SUPABASE_ANON_KEY=...    # Project Settings → API → Publishable Key (sb_publishable_...)
VITE_BACKEND_URL=http://localhost:8000
```

> ⚠️ **Supabase Key Note:** The Python `supabase` client currently requires the legacy JWT service_role key (`eyJ...`) found under **Project Settings → API → Legacy anon, service_role API keys**. The frontend uses the new publishable key format (`sb_publishable_...`).

---

## Project Structure

```
AskWISE/
├── backend/
│   ├── main.py                   # FastAPI entrypoint, router registration, CORS
│   ├── requirements.txt
│   ├── .env.example
│   ├── routes/
│   │   ├── session.py            # Core submission pipeline — topic detection, Gemini call, mastery update
│   │   ├── onboarding.py         # Student profile creation, mastery seeding from diagnostic
│   │   └── progress.py           # Dashboard data, weakness chain sync
│   ├── core/
│   │   ├── concept_graph.py      # DSA prerequisite graph, topic detection, BFS path, weakness chain
│   │   ├── prompt_builder.py     # Gemini prompt construction (unified + concept + classifier)
│   │   ├── mastery.py            # Mastery score engine with confidence multipliers
│   │   └── question_bank.py      # 16-topic question bank, 3 difficulty tiers each
│   └── db/
│       └── supabase_client.py    # Supabase client initialization
└── frontend/
    └── src/
        ├── pages/
        │   ├── Landing.jsx        # Auth + Google OAuth
        │   ├── Onboarding.jsx     # 5-step setup flow
        │   ├── Session.jsx        # Main tutoring interface
        │   └── Dashboard.jsx      # Progress, mastery bars, XP, streak
        └── components/
            ├── GraphVisualizer.jsx # Animated BFS/DFS/tree traversal
            └── ui/                 # shadcn/ui components
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/onboarding` | Save student profile, seed mastery from diagnostic |
| `POST` | `/session` | Main pipeline — code review, concept question, practice |
| `GET` | `/progress/{email}` | Fetch full student progress snapshot for dashboard |

### Session Request Body

```json
{
  "student_email": "student@example.com",
  "mode": "code",
  "question": "Write a function to detect a cycle in a linked list",
  "student_code": "def has_cycle(head): ...",
  "whats_wrong": "My solution loops forever",
  "topic": "",
  "phase": "submit"
}
```

### Session Response

```json
{
  "explanation": "## What You Got Wrong\n...",
  "corrected_code": "def has_cycle(head): ...",
  "follow_up_question": "Now find where the cycle begins...",
  "topic_category": "linked_lists",
  "is_correct": false,
  "root_gaps": ["arrays"],
  "mastery": { "linked_lists": 23, "arrays": 60 },
  "updated_topic_score": 23,
  "xp_earned": 3,
  "visualization": { "type": "linked_list", "nodes": [1,2,3,4], "edges": [[1,2],[2,3],[3,4],[4,2]] }
}
```

---

## Supabase Schema

```sql
-- Students table
CREATE TABLE students (
  email           text PRIMARY KEY,
  name            text,
  semester        integer,
  experience      text,
  goal            text,
  daily_time      text,
  topics_covered  text[],
  mastery_data    jsonb,        -- { "recursion": 45, "arrays": 70, ... }
  weak_topics     text[],
  weakness_chain  jsonb,        -- ordered list of weak topics by blocking count
  misconceptions  jsonb,
  onboarding_done boolean DEFAULT false,
  xp              integer DEFAULT 0,
  streak          integer DEFAULT 0
);

-- Interactions table
CREATE TABLE interactions (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_email       text REFERENCES students(email),
  mode                text,
  question            text,
  student_code        text,
  whats_wrong         text,
  topic_category      text,
  is_correct          boolean,
  explanation         text,
  corrected_code      text,
  follow_up_question  text,
  difficulty          text,
  created_at          timestamptz DEFAULT now()
);
```

---

## Mastery Score Logic

```
Correct answer:   +8  × confidence_multiplier
Wrong answer:     −12 × confidence_multiplier

confidence_multiplier:
  high   → 1.4x  (student was certain)
  medium → 1.0x  (standard)
  low    → 0.6x  (student was guessing)

Score clamped to [0, 100]

Difficulty tiers:
  mastery < 40   → easy questions
  mastery 40–70  → medium questions
  mastery > 70   → hard questions
```

The asymmetry (+8 / −12) is intentional — a student must demonstrate consistent understanding to improve, not just get lucky on one attempt.

---

## Future Roadmap

### Phase 1 — ML Migration (Month 1–3)
| Current | Replacement |
|---|---|
| Keyword `if/else` topic detection | TF-IDF + Naive Bayes classifier (scikit-learn) |
| Static concept graph | Dynamic curriculum graph per institution |
| Fixed mastery formula | Spaced repetition (Ebbinghaus forgetting curve) |
| Hardcoded XP | Reinforcement learning reward system |

### Phase 2 — Teacher Dashboard (Month 3–6)
- Batch-level heatmap — see which concepts are failing across the entire class
- Assignment integration — teachers upload problems, students submit on platform
- Plagiarism detection — cosine similarity on student code submissions
- Automated placement readiness reports

### Phase 3 — Cross-Subject Expansion (Month 6–12)
- Same architecture works for DBMS, Operating Systems, Mathematics, GATE prep
- Any institution uploads their own curriculum graph — zero engineering effort required

---

## Why Not Just Use ChatGPT?

| | ChatGPT | AskWISE |
|---|---|---|
| Memory across sessions | ❌ None | ✅ Full mastery history |
| Knows your weak topics | ❌ No | ✅ Yes — concept graph |
| Adaptive difficulty | ❌ No | ✅ Easy/medium/hard by mastery |
| Root cause analysis | ❌ Guesses | ✅ Prerequisite graph traversal |
| Teacher analytics | ❌ No | ✅ Batch dashboard (Phase 2) |
| Structured feedback | ❌ Freeform | ✅ 5 mandatory sections |

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push and open a Pull Request

---

<p align="center">Built with ❤️ at SpeedRun 2026 AI Hackathon</p>