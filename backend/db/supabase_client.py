from supabase import create_client, Client
from dotenv import load_dotenv
from pathlib import Path
import os

# Always resolve .env relative to this file's location (backend/.env)
# so uvicorn's --reload subprocess finds it regardless of CWD
load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env")

SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY: str = os.getenv("SUPABASE_SERVICE_KEY", "")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env")

# Service key bypasses Row Level Security — safe for backend use only
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
