# AskWISE — Personalized DSA Tutor

AskWISE is an AI-powered tutoring app that gives CS students personalized feedback on their DSA code submissions. It uses a Python-first pipeline to detect topics, identify prerequisite gaps, and count past mistakes — then sends all that pre-computed context to Gemini in a single API call.

## Features

- 🧠 **Personalized explanations** — tailored to each student's mastery profile and weak topics
- 🔍 **Concept graph traversal** — identifies root prerequisite gaps, not just surface errors
- 📊 **Mastery tracking** — updates per topic after every submission (+8 correct / -12 wrong)
- 🎯 **Three modes** — Code Review, Ask Concept, Practice  
- 📈 **Graph visualizer** — animated BFS/DFS/tree traversal for visual problems
- ✨ **Rich markdown rendering** — VS Code-themed syntax highlighting in explanations

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React + Vite + Tailwind + shadcn/ui |
| Backend | FastAPI + Python |
| Database | Supabase (PostgreSQL) |
| AI | Google Gemini API (gemini-2.5-flash) |

## Getting Started

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
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

## Environment Variables

**backend/.env**
```
GEMINI_API_KEY=...            # from aistudio.google.com
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
```

**frontend/.env**
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_BACKEND_URL=http://localhost:8000
```

## Project Structure

```
AskWISE/
├── backend/
│   ├── main.py               # FastAPI entrypoint
│   ├── requirements.txt
│   ├── routes/
│   │   ├── session.py        # core submission pipeline
│   │   ├── onboarding.py
│   │   └── progress.py
│   ├── core/
│   │   ├── concept_graph.py  # DSA prerequisite graph + topic detection
│   │   ├── prompt_builder.py # Gemini prompt construction
│   │   ├── mastery.py        # mastery update logic
│   │   └── question_bank.py
│   └── db/
│       └── supabase_client.py
└── frontend/
    └── src/
        ├── pages/            # Session, Dashboard, Onboarding, Landing
        └── components/       # GraphVisualizer, UI components
```
