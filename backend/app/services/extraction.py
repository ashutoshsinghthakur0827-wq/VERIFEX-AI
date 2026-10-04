
import pytesseract
import fitz
from PIL import Image
from pathlib import Path

# Use your confirmed Tesseract installation
pytesseract.pytesseract.tesseract_cmd = (
    r"C:\Program Files\Tesseract-OCR\tesseract.exe"
)

MAX_PDF_PAGES = 100


def extract_pdf(file_path: str) -> str:
    """Extract selectable text from a PDF."""
    text_parts = []

    with fitz.open(file_path) as pdf:
        if len(pdf) > MAX_PDF_PAGES:
            raise ValueError("PDF exceeds the 100-page limit.")

        for page in pdf:
            text_parts.append(page.get_text())

    extracted_text = "\n".join(text_parts).strip()

    if not extracted_text:
        return (
            "No selectable text found in this PDF. "
            "It may be a scanned document; try uploading it "
            "as an image or use OCR processing."
        )

    return extracted_text


def extract_image(file_path: str) -> str:
    """Extract text from an image using Tesseract OCR."""
    with Image.open(file_path) as image:
        image = image.convert("RGB")
        text = pytesseract.image_to_string(image)

    return text.strip() or "No readable text found in this image."


def extract_file(file_path: str, extension: str) -> str:
    extension = extension.lower()

    if extension == ".pdf":
        return extract_pdf(file_path)

    if extension in [".png", ".jpg", ".jpeg", ".webp", ".tif", ".tiff"]:
        return extract_image(file_path)

    raise ValueError("Unsupported file type.")