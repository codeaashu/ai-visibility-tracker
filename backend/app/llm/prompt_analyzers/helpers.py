from urllib.parse import urlparse


def normalize_domain(domain: str):
    if "://" in domain:
        domain = urlparse(domain).netloc
    domain = domain.lower()
    if domain.startswith("www."):
        return domain[4:]
    return domain
