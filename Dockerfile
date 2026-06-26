# ── Base image with Python dependencies only ────────────────────────────
# Source code is mounted at /app at runtime — no rebuild needed.
# venv lives at /opt/venv so the volume mount doesn't shadow it.

FROM python:3.12-slim

# Runtime deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /usr/local/bin/

# ── Install Python deps to /opt/venv (outside /app mount) ─────────────
WORKDIR /build
COPY backend/pyproject.toml backend/uv.lock ./
RUN uv sync --no-dev --frozen
# Move venv out of mount path
RUN mv .venv /opt/venv
ENV VIRTUAL_ENV=/opt/venv
ENV PATH="/opt/venv/bin:$PATH"

WORKDIR /app
EXPOSE 8080
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
