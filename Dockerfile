# ── Base image with Python dependencies only ────────────────────────────
# Source code is mounted at runtime — no rebuild needed after code changes.

FROM python:3.12-slim

WORKDIR /app

# Runtime dep for asyncpg
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /usr/local/bin/

# Install Python deps (this layer is cached as long as pyproject.toml doesn't change)
COPY backend/pyproject.toml backend/uv.lock ./
RUN uv sync --no-dev --frozen

EXPOSE 8080
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
