import json
import logging
from pathlib import Path

import requests
from google import genai
from google.genai.types import (
    Candidate,
    GenerateContentConfig,
    GoogleSearch,
    HttpOptions,
    ThinkingConfig,
    Tool,
)
from google.oauth2 import service_account

from app.models import Company, MonitoredPrompt, MonitoredPromptRun
from app.settings import settings

from .helpers import normalize_domain

logger = logging.getLogger(__name__)


def _get_gemini_client():
    credentials = service_account.Credentials.from_service_account_file(
        settings.vertex_credentials_path,
        scopes=[
            "https://www.googleapis.com/auth/generative-language",
            "https://www.googleapis.com/auth/cloud-platform",
        ],
    )
    project = json.loads(Path(settings.vertex_credentials_path).read_text())["project_id"]
    return genai.Client(
        http_options=HttpOptions(api_version="v1"),
        vertexai=True,
        project=project,
        location=settings.vertex_location,
        credentials=credentials,
    )


def _gemini_grounded_completion(prompt: str) -> tuple[Candidate, str]:
    config = GenerateContentConfig(
        tools=[Tool(google_search=GoogleSearch())],
        thinking_config=ThinkingConfig(
            thinking_budget=2048,
            include_thoughts=True,
        ),
    )
    response = _get_gemini_client().models.generate_content(
        model=settings.api_monitoring_model_gemini,
        contents=prompt,
        config=config,
    )
    return response.candidates[0], response.text  # type: ignore


def _resolve_redirect_uri(uri: str):
    logger.info(f"Resolving redirect URI: {uri}")
    max_attempts = 3
    for attempt in range(max_attempts):
        try:
            response = requests.head(uri, allow_redirects=True, timeout=10)
            logger.info(f"Resolved redirect URI: {uri} => {response.url}")
            return response.url
        except requests.RequestException as e:
            logger.warning(
                f"Failed to resolve redirect URI: {uri} (attempt {attempt + 1}/{max_attempts}): {e}"
            )
    logger.warning(f"Failed to resolve redirect URI: {uri} after {max_attempts} attempts")
    return uri


def analyze_prompt(prompt: MonitoredPrompt, company: Company) -> MonitoredPromptRun:
    result, text = _gemini_grounded_completion(prompt.prompt)
    data = result.model_dump()  # type: ignore
    data["text"] = text
    brand_names = [company.name, company.name.replace(" ", "")]
    if company.name_aliases:
        brand_names.extend(json.loads(company.name_aliases))
    brand_mentioned = any(name.lower() in text.lower() for name in brand_names)
    domain_normalized = normalize_domain(company.website)
    company_domain_rank = None
    mentioned_pages = []
    for idx, chunk in enumerate(data["grounding_metadata"]["grounding_chunks"]):
        # endswith to handle e.g. blog.example.com
        if normalize_domain(chunk["web"]["domain"]).endswith(domain_normalized):
            if not company_domain_rank:
                company_domain_rank = idx + 1
        redirect_uri = chunk["web"]["uri"]
        logger.info(f"Resolving redirect URI: {redirect_uri}")
        # Gemini returns redirect URI via vertexaisearch.cloud.google.com,
        # not the actual page
        resolved = _resolve_redirect_uri(redirect_uri)
        if resolved != redirect_uri:
            mentioned_pages.append(resolved)
    domains = [x["web"]["domain"] for x in data["grounding_metadata"]["grounding_chunks"]]
    assert prompt.id is not None
    return MonitoredPromptRun(
        monitored_prompt_id=prompt.id,
        llm_provider="gemini",
        llm_model=settings.api_monitoring_model_gemini,
        raw_response=json.dumps(data),
        top_domain=domains[0] if domains else None,
        brand_mentioned=brand_mentioned,
        company_domain_rank=company_domain_rank,
        mentioned_pages=json.dumps(mentioned_pages) if mentioned_pages else None,
    )
