import tempfile
from pathlib import Path

from fastapi import APIRouter, HTTPException, UploadFile, File

from schemas import ConvertResponse
import routers

router = APIRouter()

SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".pptx", ".ppt"}


@router.post("/upload", response_model=ConvertResponse)
async def convert_file(file: UploadFile = File(...)):
    """Upload a PDF, DOCX, PPTX, or PPT file and convert it to markdown."""

    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided.")

    ext = Path(file.filename).suffix.lower()
    if ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {ext}. Supported: {', '.join(SUPPORTED_EXTENSIONS)}",
        )

    content = await file.read()
    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
        tmp.write(content)
        tmp_path = Path(tmp.name)

    try:
        converter = routers.doc_converter

        if ext == ".pdf":
            markdown = converter.convert_pdf_to_markdown(str(tmp_path))
        elif ext == ".docx":
            markdown = converter.convert_docx_to_markdown(str(tmp_path))
        elif ext == ".pptx":
            markdown = converter.convert_pptx_to_markdown(str(tmp_path))
        elif ext == ".ppt":
            markdown = converter.convert_ppt_to_markdown(str(tmp_path))
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported extension: {ext}")

        return ConvertResponse(markdown=markdown)

    except ImportError as e:
        raise HTTPException(status_code=500, detail=f"Missing dependency: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Conversion error: {e}")
    finally:
        tmp_path.unlink(missing_ok=True)
