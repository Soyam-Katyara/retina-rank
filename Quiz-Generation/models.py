from enum import Enum
from pathlib import Path
from typing import List, Literal, Optional, Union

from pydantic import BaseModel, Field, field_validator, model_validator


class QuestionMode(str, Enum):
    ONLY_MCQ = "only_mcq"
    ONLY_SUBJECTIVE = "only_subjective"
    MIXED = "mixed"


class QuizGenerationRequest(BaseModel):
    """
    Configuration for how many questions of each type to generate.

    This is intentionally independent of where the quiz content comes from
    (user markdown vs. AI topic), so it can be reused for both modes.
    """

    mode: QuestionMode = Field(..., description="Type of quiz to generate.")
    num_mcq: int = Field(0, ge=0, description="Number of MCQ questions to generate.")
    num_subjective: int = Field(0, ge=0, description="Number of subjective questions to generate.")
    num_bcq: int = Field(0, ge=0, description="Number of BCQ (True/False) questions to generate.")

    @model_validator(mode="after")
    def validate_counts_for_mode(self) -> "QuizGenerationRequest":
        if self.mode == QuestionMode.ONLY_MCQ:
            if self.num_mcq <= 0:
                raise ValueError("For mode 'only_mcq', 'num_mcq' must be > 0.")
            self.num_subjective = 0
            self.num_bcq = 0
        elif self.mode == QuestionMode.ONLY_SUBJECTIVE:
            if self.num_subjective <= 0:
                raise ValueError("For mode 'only_subjective', 'num_subjective' must be > 0.")
            self.num_mcq = 0
            self.num_bcq = 0
        elif self.mode == QuestionMode.MIXED:
            if self.num_mcq <= 0 and self.num_subjective <= 0 and self.num_bcq <= 0:
                raise ValueError(
                    "For mode 'mixed', at least one of 'num_mcq', 'num_subjective', or 'num_bcq' must be > 0."
                )
        return self


class BaseQuestion(BaseModel):
    question_number: int = Field(..., alias="Question number")
    question: str = Field(..., alias="Question")
    question_type: Literal["MCQ", "Subjective", "BCQ"] = Field(..., alias="Question type")


class MCQQuestion(BaseQuestion):
    question_type: Literal["MCQ"] = Field("MCQ", alias="Question type")
    option_1: str = Field(..., alias="Option 1")
    option_2: str = Field(..., alias="Option 2")
    option_3: str = Field(..., alias="Option 3")
    option_4: str = Field(..., alias="Option 4")


class SubjectiveQuestion(BaseQuestion):
    question_type: Literal["Subjective"] = Field("Subjective", alias="Question type")


class BCQQuestion(BaseQuestion):
    question_type: Literal["BCQ"] = Field("BCQ", alias="Question type")
    option_1: str = Field(..., alias="Option 1")
    option_2: str = Field(..., alias="Option 2")


QuizQuestion = Union[MCQQuestion, SubjectiveQuestion, BCQQuestion]


class Quiz(BaseModel):
    questions: List[QuizQuestion]

    @field_validator("questions")
    @classmethod
    def validate_question_numbers(cls, v: List[QuizQuestion]) -> List[QuizQuestion]:
        numbers = [q.question_number for q in v]
        if len(set(numbers)) != len(numbers):
            raise ValueError("Question numbers must be unique.")
        return v

