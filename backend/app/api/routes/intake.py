
import os
import io
import re
import ipaddress
import socket
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from pypdf import PdfReader
from docx import Document
from PIL import Image
import pytesseract


router = APIRouter(
    prefix="/api/intake",
    tags=["Intake"]
)

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
MAX_TEXT_LENGTH = 50000
REQUEST_TIMEOUT = 15


class TextRequest(BaseModel):
    text: str


class URLRequest(BaseModel):
    url: str


def validate_text(text: str) -> str:
    """Validate and clean extracted text."""
    if not isinstance(text, str):
        raise HTTPException(
            status_code=400,
            detail="Invalid text content."
        )

    text = re.sub(r"\s+", " ", text).strip()

    if not text:
        raise HTTPException(
            status_code=400,
            detail="No text content provided."
        )

    if len(text) > MAX_TEXT_LENGTH:
        raise HTTPException(
            status_code=413,
            detail="Text exceeds the 50,000 character limit."
        )

    return text


def validate_public_url(url: str):
    """Validate URL format and block local/private network hosts."""
    parsed = urlparse(url)

    if parsed.scheme not in ("http", "https") or not parsed.hostname:
        raise HTTPException(
            status_code=400,
            detail="Please provide a valid HTTP or HTTPS URL."
        )

    if parsed.username or parsed.password:
        raise HTTPException(
            status_code=400,
            detail="URLs containing login credentials are not allowed."
        )

    hostname = parsed.hostname.lower().rstrip(".")

    if hostname == "localhost" or hostname.endswith(
        (".localhost", ".local", ".internal")
    ):
        raise HTTPException(
            status_code=400,
            detail="This URL is not allowed."
        )

    try:
        ip_addresses = socket.getaddrinfo(
            hostname,
            None,
            type=socket.SOCK_STREAM
        )

        for result in ip_addresses:
            address = ipaddress.ip_address(result[4][0])

            if not address.is_global:
                raise HTTPException(
                    status_code=400,
                    detail="Private or local network URLs are not allowed."
                )

    except socket.gaierror:
        raise HTTPException(
            status_code=400,
            detail="The URL hostname could not be resolved."
        )

    return parsed


@router.post("/text")
async def intake_text(request: TextRequest):
    """Accept text entered by the user."""
    text = validate_text(request.text)

    return {
        "message": "Text received successfully",
        "extracted_text": text,
        "content": text,
        "source_type": "text"
    }


@router.post("/url")
async def intake_url(request: URLRequest):
    """Extract readable text from a public webpage."""
    url = request.url.strip()
    parsed = validate_public_url(url)

    try:
        # Disable automatic redirects to avoid unsafe redirect targets.
        response = requests.get(
            url,
            timeout=REQUEST_TIMEOUT,
            headers={
                "User-Agent": (
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/130.0.0.0 Safari/537.36"
                ),
                "Accept": "text/html,application/xhtml+xml"
            },
            allow_redirects=False,
            stream=True
        )

        if response.is_redirect or response.is_permanent_redirect:
            response.close()
            raise HTTPException(
                status_code=400,
                detail=(
                    "The webpage redirected the request. "
                    "Please use the final destination URL."
                )
            )

        response.raise_for_status()

        content_type = response.headers.get(
            "content-type", ""
        ).lower()

        if "text/html" not in content_type:
            response.close()
            raise HTTPException(
                status_code=415,
                detail="The URL does not point to an HTML webpage."
            )

        content_length = response.headers.get("content-length")

        if content_length:
            try:
                if int(content_length) > MAX_FILE_SIZE:
                    response.close()
                    raise HTTPException(
                        status_code=413,
                        detail="Webpage is too large to process."
                    )
            except ValueError:
                pass

        chunks = []
        total_size = 0

        for chunk in response.iter_content(chunk_size=8192):
            if not chunk:
                continue

            total_size += len(chunk)

            if total_size > MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=413,
                    detail="Webpage is too large to process."
                )

            chunks.append(chunk)

        html_content = b"".join(chunks)
        response.close()

    except HTTPException:
        raise

    except requests.RequestException as exc:
        print(f"URL fetch error for {url}: {exc}")
        raise HTTPException(
            status_code=400,
            detail="Unable to retrieve the webpage."
        )

    except Exception as exc:
        print(f"Unexpected URL extraction error: {exc}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while extracting the webpage."
        )

    # Decode HTML using its declared encoding when available.
    try:
        html_text = html_content.decode(
            response.encoding or "utf-8",
            errors="replace"
        )
    except (LookupError, AttributeError):
        html_text = html_content.decode(
            "utf-8",
            errors="replace"
        )

    soup = BeautifulSoup(html_text, "html.parser")

    # Remove elements that usually contain non-content text.
    for element in soup([
        "script",
        "style",
        "nav",
        "footer",
        "header",
        "noscript",
        "svg",
        "iframe",
        "form"
    ]):
        element.decompose()

    # Prefer article/main content when available.
    content_element = (
        soup.find("article")
        or soup.find("main")
        or soup.find(attrs={"role": "main"})
        or soup.body
        or soup
    )

    extracted = content_element.get_text(
        separator=" ",
        strip=True
    )

    extracted = re.sub(r"\s+", " ", extracted).strip()

    print(
        f"URL: {url} | "
        f"HTTP: {response.status_code} | "
        f"HTML bytes: {len(html_content)} | "
        f"Extracted characters: {len(extracted)}"
    )

    if not extracted:
        raise HTTPException(
            status_code=422,
            detail=(
                "The webpage returned no readable text. "
                "It may require JavaScript rendering or block automated access."
            )
        )

    extracted = validate_text(extracted)

    return {
        "message": "Webpage text extracted successfully",
        "extracted_text": extracted,
        "content": extracted,
        "source_type": "url",
        "source_url": url
    }


def extract_pdf(file_bytes: bytes) -> str:
    """Extract text from a PDF file."""
    pdf = PdfReader(io.BytesIO(file_bytes))

    text_parts = []

    for page in pdf.pages:
        text_parts.append(page.extract_text() or "")

    return "\n".join(text_parts)


def extract_docx(file_bytes: bytes) -> str:
    """Extract text from a DOCX file."""
    document = Document(io.BytesIO(file_bytes))

    return "\n".join(
        paragraph.text
        for paragraph in document.paragraphs
    )


def extract_image(file_bytes: bytes) -> str:
    """Extract text from an image using OCR."""
    image = Image.open(io.BytesIO(file_bytes))
    image.verify()

    image = Image.open(io.BytesIO(file_bytes))
    return pytesseract.image_to_string(image)


@router.post("/file")
async def intake_file(file: UploadFile = File(...)):
    """Extract text from supported document and image files."""
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No file selected."
        )

    extension = os.path.splitext(file.filename)[1].lower()

    supported_extensions = {
        ".pdf",
        ".docx",
        ".txt",
        ".png",
        ".jpg",
        ".jpeg",
        ".webp"
    }

    if extension not in supported_extensions:
        raise HTTPException(
            status_code=415,
            detail="Unsupported file type."
        )

    file_bytes = await file.read(MAX_FILE_SIZE + 1)

    if not file_bytes:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is empty."
        )

    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="File size must be 10 MB or less."
        )

    try:
        if extension == ".pdf":
            extracted = extract_pdf(file_bytes)

        elif extension == ".docx":
            extracted = extract_docx(file_bytes)

        elif extension == ".txt":
            extracted = file_bytes.decode("utf-8-sig")

        else:
            extracted = extract_image(file_bytes)

    except Exception as exc:
        print(f"File extraction error: {exc}")
        raise HTTPException(
            status_code=422,
            detail="Could not extract text from this file."
        )

    extracted = validate_text(extracted)

    return {
        "message": "File text extracted successfully",
        "extracted_text": extracted,
        "content": extracted,
        "source_type": "file",
        "filename": file.filename
    }