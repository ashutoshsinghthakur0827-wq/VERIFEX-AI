
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from groq import APIConnectionError, APIStatusError, RateLimitError

from app.services.claim_analysis import analyze_claims

router = APIRouter(
    prefix="/api/claims",
    tags=["Claim Analysis"]
)


class ClaimAnalysisRequest(BaseModel):
    content: str = Field(min_length=1, max_length=20000)


@router.post("/analyze")
def analyze_claims_endpoint(request: ClaimAnalysisRequest):
    try:
        result = analyze_claims(request.content)

        return {
            "message": "Claim analysis completed.",
            "analysis": result.model_dump()
        }

    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc)
        ) from exc

    except RateLimitError as exc:
        raise HTTPException(
            status_code=429,
            detail="AI provider rate limit reached. Try again later."
        ) from exc

    except APIConnectionError as exc:
        raise HTTPException(
            status_code=503,
            detail="Could not connect to the AI provider."
        ) from exc

    except APIStatusError as exc:
        raise HTTPException(
            status_code=502,
            detail="AI provider returned an error."
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="Claim analysis failed."
        ) from exc