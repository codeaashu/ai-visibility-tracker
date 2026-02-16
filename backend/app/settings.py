from typing import Any

from pydantic import Field
from pydantic.networks import AnyUrl
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # FastAPI
    project_name: str = "AiCMO"
    api_v1_str: str = "/api/v1"
    secure_cookie: bool = True

    # App Config
    monitoring_channel_gemini: str = "api"  # set to empty string to disable
    monitoring_channel_openai: str = "api"
    api_monitoring_model_gemini: str = "gemini-2.5-flash"
    api_monitoring_model_openai: str = "gpt-4o-search-preview"

    # Connections
    db_dsn: AnyUrl = "sqlite:///.data/main.db?timeout=20"  # type: ignore
    # Prefer using rabbitmq + valkey for production
    celery_broker: AnyUrl = "sqla+sqlite:///.data/celery.db"  # type: ignore
    celery_backend: AnyUrl = "db+sqlite:///.data/celery.db"  # type: ignore
    sqlalchemy_echo: bool = False

    openai_api_key: str = ""
    # Gemini API key, created in AI Studio. To use it instead of
    # service account credentials, use "gemini" provider name instead of "vertex_ai".
    # Note: api prompt analyzers don't support Gemini API key yet.
    gemini_api_key: str = ""
    vertex_location: str = "us-central1"
    vertex_credentials_path: str = ""

    # Used to extract data from website and comparing customer website vs competitor
    semi_smart_provider: str = "vertex_ai"
    semi_smart_model: str = "gemini-2.5-flash"
    semi_smart_api_base: str | None = None

    # Used to generate prompts to monitor, and generate recommendations. Aka Smart
    smart_provider: str = "vertex_ai"
    smart_model: str = "gemini-2.5-pro"
    smart_api_base: str | None = None

    google_client_id: str = ""
    google_client_secret: str = ""
    frontend_url: AnyUrl = "http://localhost:8081"  # type: ignore
    cors_origins: str = ""

    # enable for cheaper/faster local experiments
    litellm_cache: bool = False
    litellm_completion_timeout: int = 600
    litellm_max_retries: int = 3

    # Used to fetch webpages
    fetcher: str = "direct"
    fetcher_settings: dict[str, Any] = Field(default_factory=dict)

    # Celery
    celery_result_expires: int = 86400
    celery_max_retries: int = 5
    task_mode: str = "celery"  # celery|inline
    cron_secret: str = ""

    schedule_trigger_prompt_monitoring: str = "* * * * *"

    license_type: str = "ce"

    model_config = SettingsConfigDict(
        extra="ignore",
        env_prefix="AC_",  # aka AiCMO
        env_file=[".env", ".env.local"],
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


settings = Settings()  # type: ignore
