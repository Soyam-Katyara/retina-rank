import json
import os
from pathlib import Path

from dotenv import load_dotenv
from google import genai
from google.genai.types import GenerateContentConfig

from models import MCQQuestion, BCQQuestion, Quiz, QuizGenerationRequest, QuestionMode, SubjectiveQuestion


PROJECT_ROOT = Path(__file__).resolve().parent
PROMPT_PATH = PROJECT_ROOT / "prompt.md"
PROMPT_AI_PATH = PROJECT_ROOT / "prompt_ai.md"


def _load_template(path: Path) -> str:
    with path.open("r", encoding="utf-8") as f:
        return f.read()


def build_prompt_from_markdown(markdown_content: str, request: QuizGenerationRequest) -> str:
    """
    Build the prompt for mode 1 – generate with user's markdown content.
    """
    template = _load_template(PROMPT_PATH)
    return (
        template.replace("{{CONTENT}}", markdown_content)
        .replace("{{MODE}}", request.mode.value)
        .replace("{{NUM_MCQ}}", str(request.num_mcq))
        .replace("{{NUM_SUBJECTIVE}}", str(request.num_subjective))
        .replace("{{NUM_BCQ}}", str(request.num_bcq))
    )


def build_prompt_for_ai(
    *,
    topic: str,
    sub_topic: str,
    todo_instructions: str | None,
    to_avoid_instructions: str | None,
    request: QuizGenerationRequest,
) -> str:
    """
    Build the prompt for mode 2 – generate with AI based on topic/sub-topic.
    """
    template = _load_template(PROMPT_AI_PATH)
    return (
        template.replace("{{TOPIC}}", topic)
        .replace("{{SUB_TOPIC}}", sub_topic)
        .replace("{{TODO}}", todo_instructions or "")
        .replace("{{TO_AVOID}}", to_avoid_instructions or "")
        .replace("{{MODE}}", request.mode.value)
        .replace("{{NUM_MCQ}}", str(request.num_mcq))
        .replace("{{NUM_SUBJECTIVE}}", str(request.num_subjective))
        .replace("{{NUM_BCQ}}", str(request.num_bcq))
    )


def load_markdown(path: Path) -> str:
    with path.open("r", encoding="utf-8") as f:
        return f.read()


def get_gemini_client() -> genai.Client:
    # Load environment variables from a .env file located at the project root,
    # while still allowing overrides from the real environment.
    load_dotenv(dotenv_path=PROJECT_ROOT / ".env")
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not set. Please configure it in your environment or .env file.")
    return genai.Client(api_key=api_key)


def call_gemini(prompt: str) -> str:
    client = get_gemini_client()

    response = client.models.generate_content(
        model="gemini-2.5-flash-lite",
        contents=prompt,
        config=GenerateContentConfig(
            temperature=0.2,
            response_mime_type="application/json",
        ),
    )

    # The SDK exposes the main text output as .text
    return response.text


def parse_and_validate_quiz(json_text: str) -> Quiz:
    raw = json.loads(json_text)

    if not isinstance(raw, list):
        raise ValueError("Model output must be a JSON array.")

    questions = []
    for item in raw:
        if not isinstance(item, dict):
            raise ValueError("Each quiz item must be a JSON object.")

        # Decide which question type based on Question type field or presence of options
        q_type = item.get("Question type", "")
        if q_type == "BCQ":
            q = BCQQuestion.model_validate(item)
        elif q_type == "MCQ" or "Option 3" in item or "Option 4" in item:
            q = MCQQuestion.model_validate(item)
        else:
            q = SubjectiveQuestion.model_validate(item)
        questions.append(q)

    return Quiz(questions=questions)


def save_quiz_to_file(quiz: Quiz, output_path: Path) -> None:
    # Dump as a plain JSON array of question objects, with the exact field names (aliases)
    data = [q.model_dump(by_alias=True) for q in quiz.questions]
    with output_path.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def main() -> None:
    import argparse

    parser = argparse.ArgumentParser(description="Generate a quiz JSON file using Gemini 3 Pro Preview.")
    parser.add_argument(
        "--source",
        type=str,
        choices=["user_content", "ai"],
        default="user_content",
        help=(
            "Source of quiz content: "
            "'user_content' uses a markdown file provided by the user (mode 1), "
            "'ai' generates questions directly from a topic/sub-topic (mode 2)."
        ),
    )
    parser.add_argument(
        "--markdown-path",
        type=Path,
        required=False,
        help="Path to the markdown file containing the user's notes (used when --source=user_content).",
    )
    parser.add_argument(
        "--topic",
        type=str,
        required=False,
        help="Topic for the quiz (mandatory when --source=ai).",
    )
    parser.add_argument(
        "--sub-topic",
        type=str,
        required=False,
        help="Sub topic for the quiz (mandatory when --source=ai).",
    )
    parser.add_argument(
        "--todo-instructions",
        type=str,
        required=False,
        default="",
        help='Optional "to do" task instructions for the AI mode.',
    )
    parser.add_argument(
        "--to-avoid-instructions",
        type=str,
        required=False,
        default="",
        help='Optional "to avoid" task instructions for the AI mode.',
    )
    parser.add_argument(
        "--mode",
        type=str,
        choices=[m.value for m in QuestionMode],
        required=True,
        help="Quiz mode: 'only_mcq', 'only_subjective', or 'mixed'.",
    )
    parser.add_argument(
        "--num-mcq",
        type=int,
        default=0,
        help="Number of MCQ questions (used for 'only_mcq' or 'mixed' modes).",
    )
    parser.add_argument(
        "--num-subjective",
        type=int,
        default=0,
        help="Number of subjective questions (used for 'only_subjective' or 'mixed' modes).",
    )
    parser.add_argument(
        "--output-path",
        type=Path,
        default=Path("quiz.json"),
        help="Path to the output JSON file.",
    )

    args = parser.parse_args()

    request = QuizGenerationRequest(
        mode=QuestionMode(args.mode),
        num_mcq=args.num_mcq,
        num_subjective=args.num_subjective,
    )

    # Decide which mode we are running: mode 1 (user markdown) or mode 2 (AI topic).
    if args.source == "user_content":
        if args.markdown_path is None:
            parser.error("--markdown-path is required when --source=user_content.")
        markdown_content = load_markdown(args.markdown_path)
        prompt = build_prompt_from_markdown(markdown_content, request)
    else:
        # AI-based generation requires topic and sub-topic.
        if not args.topic or not args.sub_topic:
            parser.error("--topic and --sub-topic are required when --source=ai.")
        prompt = build_prompt_for_ai(
            topic=args.topic,
            sub_topic=args.sub_topic,
            todo_instructions=args.todo_instructions,
            to_avoid_instructions=args.to_avoid_instructions,
            request=request,
        )

    raw_json = call_gemini(prompt)
    quiz = parse_and_validate_quiz(raw_json)

    save_quiz_to_file(quiz, args.output_path)
    print(f"Quiz JSON saved to: {args.output_path}")


if __name__ == "__main__":
    main()

