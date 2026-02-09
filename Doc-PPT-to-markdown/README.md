# File to Markdown Converter

A Python program that converts Word documents (.docx), PDF files (.pdf), and PowerPoint presentations (.ppt, .pptx) to Markdown format.

## Features

- **Word Documents (.docx)**: Converts text, headings, lists, and tables to Markdown
- **PDF Files (.pdf)**: Extracts text content and converts to Markdown with page separators
- **PowerPoint Presentations (.ppt, .pptx)**: Converts slides with titles, bullet points, and text content

## Installation

1. Install Python 3.7 or higher

2. Install required dependencies:
```bash
pip install -r requirements.txt
```

Or install individually:
```bash
pip install python-docx PyMuPDF python-pptx
```

## Usage

### Command Line

Basic usage (outputs to `input_file.md`):
```bash
python file_to_markdown.py document.docx
```

Specify output file:
```bash
python file_to_markdown.py presentation.pdf -o output.md
```

### Python API

You can also use the converter as a Python module:

```python
from file_to_markdown import convert_file_to_markdown

# Convert a file (outputs to input_file.md)
convert_file_to_markdown('document.docx')

# Convert with custom output file
convert_file_to_markdown('presentation.pdf', 'output.md')
```

## Supported File Formats

- **.docx** - Microsoft Word documents
- **.pdf** - PDF documents
- **.ppt** - Legacy Microsoft PowerPoint presentations (requires Microsoft PowerPoint and pywin32)
- **.pptx** - Microsoft PowerPoint presentations

## Notes

- The converter preserves basic formatting like headings, lists, and tables
- Complex formatting (colors, fonts, images) may not be fully preserved
- PDF conversion extracts text only (no images or complex layouts)
- PowerPoint conversion preserves slide structure and bullet points

## Requirements

- Python 3.7+
- python-docx
- PyMuPDF (fitz)
- python-pptx
- pywin32 (for .ppt support on Windows with Microsoft PowerPoint installed)