from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(dotenv_path=Path(__file__).resolve().parent / ".env")

app = FastAPI(title="AskWise API", version="1.0.0")

# ── CORS — allow frontend on any port ────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # tighten this for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
from routes.onboarding import router as onboarding_router   # Step 5 ✅
from routes.session    import router as session_router      # Step 6 ✅
from routes.progress   import router as progress_router     # Step 7 ✅

app.include_router(onboarding_router, prefix="/api")
app.include_router(session_router,    prefix="/api")
app.include_router(progress_router,   prefix="/api")


@app.get("/")
def root():
    return {"status": "AskWise backend running ✅"}


@app.get("/health")
def health():
    return {"status": "ok"}
