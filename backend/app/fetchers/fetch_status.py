from enum import Enum

from requests import Response


class FetchStatus(Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    SUCCESS = "success"
    FAILURE = "failure"
    CLOUDFLARE_CHALLENGE = "cloudflare_challenge"
    PERMISSION_DENIED = "permission_denied"


def is_fetch_successful(response: Response) -> FetchStatus:
    if response.status_code == 403:
        if response.headers.get("cf-mitigated") == "challenge":
            return FetchStatus.CLOUDFLARE_CHALLENGE
        return FetchStatus.PERMISSION_DENIED

    if response.status_code != 200:
        return FetchStatus.FAILURE

    if not response.text:
        return FetchStatus.FAILURE

    return FetchStatus.SUCCESS
