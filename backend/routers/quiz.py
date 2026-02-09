from fastapi import APIRouter, HTTPException

from schemas import (
    QuizGenerateFromContentRequest,
    QuizGenerateFromAIRequest,
    QuizGenerateResponse,
)
import routers

router = APIRouter()


def _generate_quiz(prompt: str) -> list[dict]:
    """Call Gemini and parse/validate the quiz output."""
    main_mod = routers.quiz_gen_main
    raw_json = main_mod.call_gemini(prompt)
    quiz = main_mod.parse_and_validate_quiz(raw_json)
    return [q.model_dump(by_alias=True) for q in quiz.questions]


@router.post("/generate-from-content", response_model=QuizGenerateResponse)
async def generate_from_content(req: QuizGenerateFromContentRequest):
    """Generate a quiz from user-provided markdown content."""
    try:
        main_mod = routers.quiz_gen_main
        models_mod = routers.quiz_gen_models

        gen_request = models_mod.QuizGenerationRequest(
            mode=models_mod.QuestionMode(req.mode),
            num_mcq=req.num_mcq,
            num_subjective=req.num_subjective,
            num_bcq=req.num_bcq,
        )

        prompt = main_mod.build_prompt_from_markdown(req.markdown_content, gen_request)
        questions = _generate_quiz(prompt)
        return QuizGenerateResponse(questions=questions)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quiz generation failed: {e}")


@router.post("/generate-from-ai", response_model=QuizGenerateResponse)
async def generate_from_ai(req: QuizGenerateFromAIRequest):
    """Generate a quiz from a topic using AI knowledge."""
    try:
        main_mod = routers.quiz_gen_main
        models_mod = routers.quiz_gen_models

        gen_request = models_mod.QuizGenerationRequest(
            mode=models_mod.QuestionMode(req.mode),
            num_mcq=req.num_mcq,
            num_subjective=req.num_subjective,
            num_bcq=req.num_bcq,
        )

        prompt = main_mod.build_prompt_for_ai(
            topic=req.topic,
            sub_topic=req.sub_topic,
            todo_instructions=req.todo or None,
            to_avoid_instructions=req.to_avoid or None,
            request=gen_request,
        )
        questions = _generate_quiz(prompt)
        return QuizGenerateResponse(questions=questions)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quiz generation failed: {e}")
