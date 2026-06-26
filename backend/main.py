import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from database import init_db
from api.auth import router as auth_router
from api.users import router as users_router
from api.dms import router as dms_router
from api.notifications import router as notifications_router

STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(STATIC_DIR, exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="SerenDipity API", lifespan=lifespan)

# ── API routes ───────────────────────────────────
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(dms_router)
app.include_router(notifications_router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}


# ── Serve React SPA (only when frontend is built) ─
if os.path.isdir(STATIC_DIR) and os.path.isfile(os.path.join(STATIC_DIR, "index.html")):
    # Static assets (JS bundles, CSS, images in /assets/)
    assets_dir = os.path.join(STATIC_DIR, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    # Root-level static files
    ROOT_FILES = ["logo.jpg", "logo-star.png", "intro-bg.jpg", "manifest.json", "favicon.ico"]
    for filename in ROOT_FILES:
        file_path = os.path.join(STATIC_DIR, filename)
        if os.path.isfile(file_path):
            @app.get(f"/{filename}")
            async def _static(file_path=file_path):
                return FileResponse(file_path)

    # SPA fallback — serve index.html for all unmatched routes
    @app.get("/{full_path:path}")
    async def spa(full_path: str = ""):
        target = os.path.join(STATIC_DIR, full_path)
        if full_path and os.path.isfile(target):
            return FileResponse(target)
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
