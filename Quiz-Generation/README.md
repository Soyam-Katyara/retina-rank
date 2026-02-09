## Quiz Generator with Gemini 3 Pro Preview

This project generates a quiz JSON file from a markdown file of notes using the Gemini 3 Pro Preview model, with Pydantic enforcing consistent input and output schemas.

### Setup

- Create and activate a virtual environment (optional but recommended).
- Install dependencies:

```bash
pip install -r requirements.txt
```

- Configure your Gemini API key as an environment variable (recommended via a `.env` file in this directory):

```bash
echo "GEMINI_API_KEY=your_gemini_api_key_here" > .env
```

Ensure that `.env` is **not** committed to version control.

### Usage

Prepare a markdown file with your notes, for example `notes.md`, then run:

```bash
python main.py \
  --markdown-path /absolute/path/to/notes.md \
  --mode mixed \
  --num-mcq 5 \
  --num-subjective 5 \
  --output-path quiz.json
```

Valid `--mode` values:

- `only_mcq` with `--num-mcq` > 0
- `only_subjective` with `--num-subjective` > 0
- `mixed` with at least one of `--num-mcq` or `--num-subjective` > 0

The script calls the Gemini 3 Pro Preview API, validates the model output with Pydantic, and saves a JSON file that:

- For MCQs: includes `"Question number"`, `"Question"`, `"Question type"`, `"Option 1"`, `"Option 2"`, `"Option 3"`, `"Option 4"`.
- For Subjective questions: includes `"Question number"`, `"Question"`, `"Question type"`.

No extra fields are included in the output JSON.

