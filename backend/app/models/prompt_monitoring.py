import datetime

from pydantic import BaseModel


class PromptMonitoringItem(BaseModel):
    id: int
    prompt: str
    prompt_type: str
    is_active: bool
    created_at: datetime.datetime
    openai_last_result: bool | None
    gemini_last_result: bool | None
    visibility: float
