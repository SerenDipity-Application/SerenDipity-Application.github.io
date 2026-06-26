# ── Stage 1: Build React frontend ──────────────────────────────────────
FROM node:20-alpine AS frontend
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY vite.config.js index.html ./
COPY src/ src/
COPY public/ public/
RUN npm run build
# Built files are now at /app/backend/static/

# ── Stage 2: Python backend ────────────────────────────────────────────
FROM python:3.12-slim AS backend
WORKDIR /app

# Runtime dep for asyncpg (PostgreSQL driver)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /usr/local/bin/

# Install Python dependencies (layer caching)
COPY backend/pyproject.toml ./
RUN uv sync --no-dev

# Copy backend source
COPY backend/ ./

# Copy built frontend from stage 1
COPY --from=frontend /app/backend/static ./static

# Create non-root user
RUN useradd -m -u 1000 app && chown -R app:app /app
USER app

EXPOSE 8080
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
