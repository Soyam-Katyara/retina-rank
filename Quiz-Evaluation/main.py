from __future__ import annotations

import argparse
from pathlib import Path

from models import ContentInputs
from evaluator import evaluate_quiz, save_evaluation_to_file


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Evaluate a user's quiz attempt using Gemini 3 Pro Preview."
    )

    parser.add_argument(
        "--quiz-json",
        type=Path,
        required=True,
        help="Path to the generated quiz JSON file.",
    )
    parser.add_argument(
        "--user-answers-json",
        type=Path,
        required=True,
        help="Path to the user's answers JSON file.",
    )
    parser.add_argument(
        "--notes-markdown",
        type=Path,
        required=False,
        help="Path to the markdown notes/content file (only if quiz was generated from content).",
    )
    parser.add_argument(
        "--output-json",
        type=Path,
        required=True,
        help="Path where the evaluation JSON file will be written.",
    )

    return parser.parse_args()


def main() -> None:
    args = parse_args()

    content_inputs = ContentInputs(
        notes_markdown_path=args.notes_markdown,
        quiz_json_path=args.quiz_json,
        user_answers_json_path=args.user_answers_json,
    )

    result = evaluate_quiz(inputs=content_inputs)
    save_evaluation_to_file(result=result, output_path=args.output_json)


if __name__ == "__main__":
    main()

