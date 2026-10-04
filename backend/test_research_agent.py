
from app.services.research_agent import research_claims

try:
    result = research_claims(["The Sun is a star."], max_results=3)

    print(result.model_dump_json(indent=2))

except Exception as error:
    print("Research Agent test failed:")
    print(repr(error))