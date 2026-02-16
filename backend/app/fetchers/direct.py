from time import sleep

import requests

from app.fetchers.fetch_status import FetchStatus, is_fetch_successful


def fetch(url: str, attempts: int = 3) -> tuple[FetchStatus, str | None]:
    for _ in range(attempts):
        response = requests.get(url)
        state = is_fetch_successful(response)
        if state == FetchStatus.SUCCESS:
            return FetchStatus.SUCCESS, response.text
        if state == FetchStatus.CLOUDFLARE_CHALLENGE:
            return FetchStatus.CLOUDFLARE_CHALLENGE, None
        if state == FetchStatus.PERMISSION_DENIED:
            return FetchStatus.PERMISSION_DENIED, None
        sleep(1)
    return FetchStatus.FAILURE, None
