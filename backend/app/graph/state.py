
from typing import Any, TypedDict


class VerificationState(TypedDict, total=False):
    claims: list[dict[str, Any]]
    results: list[dict[str, Any]]
    limitations: list[str]