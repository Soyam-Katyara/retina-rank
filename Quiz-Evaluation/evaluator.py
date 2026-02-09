from __future__ import annotations

import json
import os
from pathlib import Path
from typing import List

from dotenv import load_dotenv
from google import genai

from models import ContentInputs, EvaluationItem, EvaluationResult


def _load_env_key(env_var: str = "GEMINI_API_KEY") -> str:
    """
    Load Gemini API key from .env or environment.
    """
    load_dotenv()
    api_key = os.getenv(env_var)
    if not api_key:
        raise RuntimeError(f"{env_var} is not set. Please set it in your .env file.")
    return api_key


def _read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _build_prompt_from_template(
    template_path: Path,
    quiz_json: str,
    user_answers_json: str,
    notes_markdown: str | None,
) -> List[dict]:
    """
    Builds a messages-style input for Gemini: a single user message containing
    the markdown prompt plus the concrete input data.
    """
    template = template_path.read_text(encoding="utf-8")

    # Append the concrete input section to the template.
    input_block_lines = [
        "",
        "### Concrete Input Data",
        "",
        "```json",
        "QUIZ_JSON:",
        quiz_json,
        "```",
        "",
        "```json",
        "USER_ANSWERS_JSON:",
        user_answers_json,
        "```",
    ]

    if notes_markdown is not None:
        input_block_lines.extend(
            [
                "",
                "```markdown",
                "NOTES_MARKDOWN:",
                notes_markdown,
                "```",
            ]
        )

    full_prompt = template + "\n" + "\n".join(input_block_lines)

    # Gemini 3 Pro Preview (google-genai) uses a list of messages.
    # We send a single user message with the full markdown prompt + data.
    return [
        {
            "role": "user",
            "parts": [
                {
                    "text": full_prompt,
                }
            ],
        }
    ]


def evaluate_quiz(
    inputs: ContentInputs,
    prompt_template_path: Path | None = None,
    model_name: str = "gemini-2.5-flash-lite",
) -> EvaluationResult:
    """
    Evaluate the user's quiz attempt using Gemini 3 Pro Preview.

    - Reads the quiz JSON, user answers JSON, and optional notes markdown.
    - Builds a strict markdown prompt that requires ONLY the requested JSON output.
    - Calls Gemini and parses/validates the response into `EvaluationResult`.
    """
    api_key = _load_env_key()

    client = genai.Client(api_key=api_key)

    quiz_json_str = _read_text(inputs.quiz_json_path)
    user_answers_json_str = _read_text(inputs.user_answers_json_path)

    notes_md_str: str | None = None
    if inputs.notes_markdown_path is not None and inputs.notes_markdown_path.exists():
        notes_md_str = _read_text(inputs.notes_markdown_path)

    if prompt_template_path is None:
        prompt_template_path = Path("prompt_template.md")

    messages = _build_prompt_from_template(
        template_path=prompt_template_path,
        quiz_json=quiz_json_str,
        user_answers_json=user_answers_json_str,
        notes_markdown=notes_md_str,
    )

    # Call Gemini 3 Pro Preview.
    # Some versions of the google-genai SDK do not support `generation_config`
    # as a keyword here, so we rely on the prompt to enforce JSON-only output.
    response = client.models.generate_content(
        model=model_name,
        contents=messages,
    )

    # Extract text from the response. For google-genai, the response has .text.
    raw_text = getattr(response, "text", None)
    if raw_text is None:
        raise RuntimeError("Gemini response did not contain text.")

    # The prompt requires a bare JSON array; still, models often wrap it in
    # ```json fences or add stray text. We try to robustly extract the array.
    raw_text = raw_text.strip()

    def _extract_json_array(text: str) -> str:
        # If fenced with ```json ... ``` take inner part.
        if text.startswith("```"):
            # Remove leading ``` or ```json
            first_newline = text.find("\n")
            if first_newline != -1:
                inner = text[first_newline + 1 :]
            else:
                inner = text
            # Remove a trailing ``` if present
            end_fence = inner.rfind("```")
            if end_fence != -1:
                inner = inner[:end_fence]
            text = inner.strip()

        # As a final fallback, grab from the first '[' to the last ']'
        if "[" in text and "]" in text:
            start = text.find("[")
            end = text.rfind("]") + 1
            candidate = text[start:end].strip()
            return candidate

        return text

    json_candidate = _extract_json_array(raw_text)

    try:
        parsed = json.loads(json_candidate)
    except json.JSONDecodeError as e:
        raise RuntimeError(
            f"Failed to parse Gemini JSON output: {e}\nRaw: {raw_text}\nCandidate: {json_candidate}"
        ) from e

    if not isinstance(parsed, list):
        raise RuntimeError("Gemini output must be a JSON array of objects.")

    # Validate and normalize into Pydantic models.
    items: List[EvaluationItem] = []
    for obj in parsed:
        if not isinstance(obj, dict):
            raise RuntimeError("Each element in the array must be an object.")
        # Only keep the allowed keys and enforce types.
        cleaned = {
            "question_number": obj.get("question_number"),
            "score": obj.get("score"),
        }
        item = EvaluationItem(**cleaned)
        items.append(item)

    return EvaluationResult(results=items)


def save_evaluation_to_file(result: EvaluationResult, output_path: Path) -> None:
    """
    Persist the evaluation result as a JSON array of {question_number, score}.

    This writes exactly the structure you requested, without extra fields.
    """
    array_payload = [
        {
            "question_number": item.question_number,
            "score": item.score,
        }
        for item in result.results
    ]
    output_path.write_text(json.dumps(array_payload, indent=2), encoding="utf-8")

