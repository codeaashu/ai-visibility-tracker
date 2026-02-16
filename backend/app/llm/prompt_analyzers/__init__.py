from importlib import import_module

from app.models import Company, MonitoredPrompt, MonitoredPromptRun


def get_analyzer(*, analyzer_type: str, provider: str):
    module = import_module(f"app.llm.prompt_analyzers.{provider}_{analyzer_type}")
    return module.analyze_prompt


def analyze_prompt(
    prompt: MonitoredPrompt, company: Company, *, analyzer_type: str, provider: str
) -> MonitoredPromptRun:
    analyzer = get_analyzer(analyzer_type=analyzer_type, provider=provider)
    return analyzer(prompt, company)
