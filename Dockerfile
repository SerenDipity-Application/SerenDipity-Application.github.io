# ── Base image with Python dependencies only ────────────────────────────
# Source code is mounted at /app at runtime — no rebuild needed.
# venv lives at /opt/venv so the volume mount doesn't shadow it.
#
# NOTE: uv uses UV_PROJECT_ENVIRONMENT to create the venv directly at the
# final location. DO NOT mv the venv after uv sync — that would break the
# shebangs in all console scripts (uvicorn, etc.) by leaving them pointing
# to the pre-move interpreter path.

FROM python:3.12-slim

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /usr/local/bin/

# ── Install Python deps to /opt/venv (outside /app mount) ─────────────
ENV UV_PROJECT_ENVIRONMENT=/opt/venv
ENV VIRTUAL_ENV=/opt/venv

WORKDIR /build
COPY backend/pyproject.toml backend/uv.lock ./
RUN uv sync --no-dev --frozen --no-install-project

ENV PATH="/opt/venv/bin:$PATH"

WORKDIR /app
EXPOSE 8080
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
