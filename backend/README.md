
@'
# Verifex AI — Backend

AI-Powered Multi-Agent Claim Verification System

## Overview

The Verifex AI backend is developed using Python and FastAPI. It coordinates multiple AI agents to analyze claims, research relevant information, evaluate evidence, verify findings, and generate structured investigation reports.

## Features

- Claim Analysis Agent: Extracts verifiable claims from text and documents.
- Research Agent: Retrieves relevant information from accessible sources.
- Evidence Agent: Identifies supporting, contradicting, and contextual evidence.
- Source Analysis: Evaluates source reliability and limitations.
- Verification Agent: Assesses evidence, confidence, and uncertainty.
- Report Agent: Prepares structured investigation reports.
- REST API: Connects the backend to the frontend.
- PDF Reporting: Supports report export when configured.

## Technology Stack

- Python
- FastAPI
- Uvicorn
- Pydantic
- LangChain
- Groq API
- ChromaDB (if configured)
- Firebase Authentication (if configured)

## Installation

### 1. Navigate to the backend

```bash
cd backend
```

### 2. Create a virtual environment

Windows:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment variables

Create a `.env` file and add the variables required by your application.

Example:

```env
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile
```

Never commit API keys or secrets to GitHub.

## Run the Backend

From the backend directory:

```bash
python -m uvicorn app.main:app --reload
```

The API should be available at:

http://127.0.0.1:8000

If port 8000 is already in use:

```bash
python -m uvicorn app.main:app --reload --port 8001
```

## API Documentation

When the server is running, open:

- Swagger UI: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc

## Verification Endpoint

```http
POST /api/verification/analyze
```

This endpoint accepts claims and their associated evidence for preliminary verification. Check the live API documentation for the exact request and response schemas.

## Investigation Workflow

```text
User Input
    |
    v
Claim Analysis Agent
    |
    v
Research Agent
    |
    v
Evidence Agent
    |
    v
Source Analysis
    |
    v
Verification Agent
    |
    v
Report Agent
    |
    v
Investigation Report
```

## Testing

Run the configured test suite, if available:

```bash
pytest
```

You can also test API endpoints using Swagger UI at `/docs`.

## Common Issues

### Module not found

```bash
pip install -r requirements.txt
```

Ensure your virtual environment is activated.

### Port already in use

Run the server on another port, such as 8001, or stop the process using port 8000.

### API key error

Check that your `.env` file contains valid credentials and that your application loads the file.

### Insufficient evidence

Check that evidence excerpts are included in the verification request and passed through the verification graph. A successful API response does not guarantee that sufficient evidence was found.

### Too many claims

If the backend accepts a maximum of 10 claims per request, split larger sets into batches of 10 or fewer.

## Security

- Keep `.env` out of version control.
- Never expose API keys in frontend code.
- Validate incoming requests.
- Restrict CORS to trusted origins.
- Review AI-generated findings and source limitations.

## Disclaimer

Verifex AI provides preliminary AI-assisted claim verification. It does not guarantee the truth or falsity of a claim. Review original sources and use human judgment before relying on its findings.

## Project Information

**Project:** Verifex AI  
**Backend:** Python, FastAPI  
**Purpose:** Multi-agent AI-powered claim verification and investigation reporting
'@ | Set-Content -Encoding UTF8 README.md