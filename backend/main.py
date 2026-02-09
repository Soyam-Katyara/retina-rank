import importlib.util
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Resolve project paths
PROJECT_ROOT = Path(__file__).resolve().parent.parent

# Load .env files early so GEMINI_API_KEY is available for all modules
load_dotenv(dotenv_path=Path(__file__).resolve().parent / ".env")
load_dotenv(dotenv_path=PROJECT_ROOT / "Quiz-Generation" / ".env", override=False)
load_dotenv(dotenv_path=PROJECT_ROOT / "Quiz-Evaluation" / ".env", override=False)
QUIZ_GEN_DIR = PROJECT_ROOT / "Quiz-Generation"
QUIZ_EVAL_DIR = PROJECT_ROOT / "Quiz-Evaluation"
DOC_CONVERT_DIR = PROJECT_ROOT / "Doc-PPT-to-markdown"


def _import_module_from_path(module_name: str, file_path: Path):
    """Import a Python module from an absolute file path with a unique module name."""
    spec = importlib.util.spec_from_file_location(module_name, str(file_path))
    mod = importlib.util.module_from_spec(spec)
    sys.modules[module_name] = mod
    spec.loader.exec_module(mod)
    return mod


# Import Quiz-Generation modules under unique names.
# Quiz-Generation/main.py does `from models import ...`, so `models` must temporarily
# point to the quiz generation models while loading it.
quiz_gen_models = _import_module_from_path("quiz_gen_models", QUIZ_GEN_DIR / "models.py")
sys.modules["models"] = quiz_gen_models
quiz_gen_main = _import_module_from_path("quiz_gen_main", QUIZ_GEN_DIR / "main.py")

# Import Quiz-Evaluation modules (they also have models.py).
quiz_eval_models = _import_module_from_path("quiz_eval_models", QUIZ_EVAL_DIR / "models.py")
sys.modules["models"] = quiz_eval_models
quiz_eval_evaluator = _import_module_from_path("quiz_eval_evaluator", QUIZ_EVAL_DIR / "evaluator.py")

# Clean up the temporary `models` alias
sys.modules.pop("models", None)

# Import doc converter — no naming conflicts
sys.path.insert(0, str(DOC_CONVERT_DIR))
import file_to_markdown as doc_converter  # noqa: E402

# Store module references on the routers package so router files can access them
import routers as _routers_pkg  # noqa: E402

_routers_pkg.quiz_gen_main = quiz_gen_main
_routers_pkg.quiz_gen_models = quiz_gen_models
_routers_pkg.quiz_eval_evaluator = quiz_eval_evaluator
_routers_pkg.quiz_eval_models = quiz_eval_models
_routers_pkg.doc_converter = doc_converter
_routers_pkg.QUIZ_EVAL_DIR = QUIZ_EVAL_DIR

from routers import convert, quiz, evaluate  # noqa: E402

app = FastAPI(title="Quiz Platform API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(convert.router, prefix="/api/convert", tags=["convert"])
app.include_router(quiz.router, prefix="/api/quiz", tags=["quiz"])
app.include_router(evaluate.router, prefix="/api/evaluate", tags=["evaluate"])


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}
