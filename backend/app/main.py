import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import Base, engine
from app.core.exceptions import AppError, app_error_handler, general_error_handler

# Import models so Base.metadata knows about them
from app.bookmarks.models import Bookmark  # noqa: F401
from app.ai.models import AiSummary  # noqa: F401

# Import routers
from app.stories.router import router as stories_router
from app.bookmarks.router import router as bookmarks_router
from app.ai.router import router as ai_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info(f"Backend server running on port {settings.port}")
    yield
    # Shutdown
    await engine.dispose()


app = FastAPI(
    title="Smart HN Reader API",
    description="AI-powered Hacker News client",
    lifespan=lifespan,
)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers
app.add_exception_handler(AppError, app_error_handler)
app.add_exception_handler(Exception, general_error_handler)

# Routers
app.include_router(stories_router)
app.include_router(bookmarks_router)
app.include_router(ai_router)


@app.get("/api/health")
async def health():
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}
