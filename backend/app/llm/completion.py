import json
from datetime import UTC, datetime
from enum import StrEnum
from pathlib import Path

import litellm
from litellm.types.utils import ModelResponse
from pydantic import BaseModel

from app.models.llm_costs import LLMCost
from app.settings import settings


class PromptType(StrEnum):
    COMPANY_CRAWL = "company_crawl"
    PROMPT_SUGGESTIONS = "prompt_suggestions"
    COMPETITOR_SUGGESTIONS = "competitor_suggestions"
    RECOMMENDATION = "recommendation"


def _get_auth_by_provider(provider: str) -> dict[str, str]:
    if provider == "openai":
        return {"api_key": settings.openai_api_key}
    if provider == "gemini":
        return {"api_key": settings.gemini_api_key}
    if provider == "vertex_ai":
        credentials = Path(settings.vertex_credentials_path).read_text()
        data = json.loads(credentials)
        return {
            "vertex_location": settings.vertex_location,
            "vertex_project": data["project_id"],
            "vertex_credentials": credentials,
        }
    raise ValueError(f"Unknown provider: {provider}")


def _get_completion_params_by_provider(provider: str):
    if provider == "openai":
        return {
            "temperature": 0,
        }
    if provider == "vertex_ai":
        return {
            "top_p": 0.95,
            "temperature": 1,
            # "reasoning_effort": "disable",
        }
    raise ValueError(f"Unknown provider: {provider}")


def _get_litellm_params(prompt_type: PromptType):
    if prompt_type == PromptType.COMPANY_CRAWL:
        provider = settings.semi_smart_provider
        model = settings.semi_smart_model
        api_base = settings.semi_smart_api_base
    elif prompt_type in (
        PromptType.PROMPT_SUGGESTIONS,
        PromptType.COMPETITOR_SUGGESTIONS,
        PromptType.RECOMMENDATION,
    ):
        provider = settings.smart_provider
        model = settings.smart_model
        api_base = settings.smart_api_base
    else:
        raise ValueError(f"Unknown prompt type: {prompt_type}")
    params = {
        **_get_auth_by_provider(provider),
        **_get_completion_params_by_provider(provider),
        "model": f"{provider}/{model}",
        "caching": settings.litellm_cache,
        "timeout": settings.litellm_completion_timeout,
        "max_retries": settings.litellm_max_retries,
    }
    if api_base:
        params["api_base"] = api_base
    return params


def _get_litellm_cost(
    response: ModelResponse, prompt_type: PromptType, model: str
) -> LLMCost | None:
    is_cached_locally = response._hidden_params.get("cache_hit", False)
    if is_cached_locally:
        return None
    cost = litellm.completion_cost(  # type: ignore
        completion_response=response,
    )
    tokens_in = response.usage.prompt_tokens  # type: ignore
    tokens_out = response.usage.completion_tokens  # type: ignore
    date_rounded = datetime.now(UTC).replace(minute=0, second=0, microsecond=0)

    return LLMCost(
        model=model,
        call_type=prompt_type.value,
        date=date_rounded,
        cost=int(cost * 1e10),
        tokens_in=tokens_in,
        tokens_out=tokens_out,
        call_count=1,
    )


def get_completion[T: BaseModel](
    prompt_type: PromptType,
    prompt: str,
    response_schema: type[T],
    allow_search_tools: bool = False,
) -> tuple[T, LLMCost | None]:
    params = _get_litellm_params(prompt_type)
    params["response_format"] = response_schema
    if allow_search_tools:
        params["web_search_options"] = {"search_context_size": "medium"}
    response = litellm.completion(
        messages=[
            {
                "role": "user",
                "content": prompt,
            }
        ],
        **params,
    )
    assert isinstance(response, ModelResponse)
    cost = _get_litellm_cost(response, prompt_type, params["model"])
    response_content = response.choices[0].message.content  # type: ignore
    assert response_content is not None
    return response_schema.model_validate(json.loads(response_content)), cost
