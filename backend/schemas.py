from pydantic import BaseModel
from typing import List, Optional


class ConvertResponse(BaseModel):
    markdown: str


class QuizGenerateFromContentRequest(BaseModel):
    markdown_content: str
    mode: str  # "only_mcq", "only_subjective", "mixed"
    num_mcq: int = 0
    num_subjective: int = 0
    num_bcq: int = 0


class QuizGenerateFromAIRequest(BaseModel):
    topic: str
    sub_topic: str
    todo: Optional[str] = None
    to_avoid: Optional[str] = None
    mode: str
    num_mcq: int = 0
    num_subjective: int = 0
    num_bcq: int = 0


class QuizGenerateResponse(BaseModel):
    questions: List[dict]


class EvaluateRequest(BaseModel):
    quiz_json: List[dict]
    user_answers_json: List[dict]
    notes_markdown: Optional[str] = None


class EvaluationResultItem(BaseModel):
    question_number: int
    score: float


class EvaluateResponse(BaseModel):
    results: List[EvaluationResultItem]
