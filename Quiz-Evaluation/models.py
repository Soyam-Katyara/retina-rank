from __future__ import annotations

from pathlib import Path
from typing import List, Optional

from pydantic import BaseModel, Field


class QuizQuestion(BaseModel):
    question_number: int = Field(..., description="1-based index of the question")
    # You can extend this model with more fields if needed (e.g., text, options, correct_answer, etc.)


class Quiz(BaseModel):
    questions: List[QuizQuestion]


class UserAnswer(BaseModel):
    question_number: int
    answer: str


class UserAnswers(BaseModel):
    answers: List[UserAnswer]


class EvaluationItem(BaseModel):
    question_number: int = Field(..., description="Question number (int)")
    score: float = Field(..., description="Score for this question (float)")


class EvaluationResult(BaseModel):
    """
    IMPORTANT: This is the ONLY output structure we allow from Gemini.
    It must be a JSON array of {question_number:int, score:float}.
    """

    results: List[EvaluationItem]


class ContentInputs(BaseModel):
    """
    Represents the different possible input sources, depending on how the quiz was generated.
    Exactly one of the two scenarios will be used at runtime:

    1) Quiz generated from content:
       - notes_markdown_path is provided
       - quiz_json_path is provided
       - user_answers_json_path is provided

    2) Quiz generated with AI (no notes/content):
       - quiz_json_path is provided
       - user_answers_json_path is provided
    """

    notes_markdown_path: Optional[Path] = None
    quiz_json_path: Path
    user_answers_json_path: Path

