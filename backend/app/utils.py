import hashlib
import re
import unicodedata
from urllib.parse import ParseResult, parse_qsl, urlencode, urlparse


def calculate_hash(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()


def canonicalize_title(title: str) -> str:
    title = unicodedata.normalize("NFKC", title.lower())
    if "|" in title:
        title = title.split("|")[0]
    title = re.sub(r"[\s\n\.,\-!]+", " ", title)
    title = title.strip()
    return title


def normalize_netloc(parsed: ParseResult):
    # drops www, drops port if default for scheme
    username = parsed.username
    password = parsed.password
    domain = parsed.hostname
    if domain is None:
        return None
    port = parsed.port
    if domain.startswith("www."):
        domain = domain[4:]
    if port is not None and (
        parsed.scheme == "https" and port == 443 or parsed.scheme == "http" and port == 80
    ):
        port = None
    netloc = domain
    if port is not None:
        netloc += f":{port}"
    if username is not None or password is not None:
        netloc = f"{username}:{password}@{netloc}"
    return netloc


# https://github.com/newhouse/url-tracking-stripper
# https://github.com/col1010/tracklessURL
tracker_params = [
    "utm_source",
    "utm_medium",
    "utm_term",
    "utm_campaign",
    "utm_content",
    "utm_name",
    "utm_cid",
    "utm_reader",
    "utm_viz_id",
    "utm_pubreferrer",
    "utm_swu",
    "gclid",
    "fbclid",
    "igshid",
    "_hsenc",
    "_hsmi",
    "mc_cid",
    "mc_eid",
    "ref",
    "trackingId",
    "share_id",
    "msclkid",
]


def drop_tracking_params(query: str):
    # drops tracking params
    if not query:
        return query
    params = parse_qsl(query)
    params = [param for param in params if param[0] not in tracker_params]
    return urlencode(params)


def canonicalize_url(url: str) -> str | None:
    try:
        url = unicodedata.normalize("NFKC", url).strip()
        parsed = urlparse(url)
        netloc = normalize_netloc(parsed)
        if netloc is None:
            return None
        parsed = parsed._replace(netloc=netloc)
        parsed = parsed._replace(fragment="")
        parsed = parsed._replace(query=drop_tracking_params(parsed.query))
        return parsed.geturl()
    except Exception:
        return None
