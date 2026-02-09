import json
import tempfile
from pathlib import Path

from fastapi import APIRouter, HTTPException

from schemas import EvaluateRequest, EvaluateResponse, EvaluationResultItem
import routers

router = APIRouter()


@router.post("/submit", response_model=EvaluateResponse)
async def evaluate_submission(req: EvaluateRequest):
    """Evaluate a user's quiz answers using Gemini."""
    try:
        evaluate_quiz = routers.quiz_eval_evaluator.evaluate_quiz
        ContentInputs = routers.quiz_eval_models.ContentInputs
        prompt_template_path = routers.QUIZ_EVAL_DIR / "prompt_template.md"

        # Write quiz JSON, user answers, and optional notes to temp files
        quiz_tmp = tempfile.NamedTemporaryFile(
            mode="w", suffix=".json", delete=False, encoding="utf-8"
        )
        quiz_tmp.write(json.dumps(req.quiz_json, ensure_ascii=False, indent=2))
        quiz_tmp.close()

        answers_tmp = tempfile.NamedTemporaryFile(
            mode="w", suffix=".json", delete=False, encoding="utf-8"
        )
        answers_tmp.write(json.dumps(req.user_answers_json, ensure_ascii=False, indent=2))
        answers_tmp.close()

        notes_path = None
        notes_tmp = None
        if req.notes_markdown:
            notes_tmp = tempfile.NamedTemporaryFile(
                mode="w", suffix=".md", delete=False, encoding="utf-8"
            )
            notes_tmp.write(req.notes_markdown)
            notes_tmp.close()
            notes_path = Path(notes_tmp.name)

        try:
            content_inputs = ContentInputs(
                quiz_json_path=Path(quiz_tmp.name),
                user_answers_json_path=Path(answers_tmp.name),
                notes_markdown_path=notes_path,
            )

            result = evaluate_quiz(
                inputs=content_inputs,
                prompt_template_path=prompt_template_path,
            )

            return EvaluateResponse(
                results=[
                    EvaluationResultItem(
                        question_number=item.question_number,
                        score=item.score,
                    )
                    for item in result.results
                ]
            )
        finally:
            Path(quiz_tmp.name).unlink(missing_ok=True)
            Path(answers_tmp.name).unlink(missing_ok=True)
            if notes_tmp:
                Path(notes_tmp.name).unlink(missing_ok=True)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {e}")
