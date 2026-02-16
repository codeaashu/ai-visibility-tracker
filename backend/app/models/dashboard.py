from __future__ import annotations

from typing import Literal

from pydantic import BaseModel


class ShareOfVoiceItem(BaseModel):
    domain: str
    count: int
    type: Literal["company", "competitor", "other"]


class DashboardStats(BaseModel):
    ai_visibility_score: float
    website_citation_share: float
    total_runs: int
    share_of_voice: list[ShareOfVoiceItem]
