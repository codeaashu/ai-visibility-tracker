FROM ghcr.io/astral-sh/uv:python3.13-bookworm-slim

ARG USERNAME=ac
ARG USER_UID=999
ARG USER_GID=$USER_UID

WORKDIR /app

ENV UV_COMPILE_BYTECODE=1

COPY backend/entrypoint.sh ./entrypoint.sh
COPY backend/alembic.ini ./alembic.ini

# Note: This Dockerfile assumes it will be built from the project root with:
# docker build -f backend/Dockerfile -t backend .
COPY backend/pyproject.toml backend/uv.lock ./
COPY backend/app ./app/

RUN uv sync --locked --no-install-project --no-dev

RUN groupadd --gid $USER_GID $USERNAME \
    && useradd --uid $USER_UID --gid $USER_GID -m $USERNAME

USER $USERNAME

ENTRYPOINT []
ENV PYTHONDONTWRITEBYTECODE=1
ENV PATH="/app/.venv/bin:$PATH"

EXPOSE 8000
CMD ["bash", "./entrypoint.sh"]
