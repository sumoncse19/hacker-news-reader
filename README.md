# Smart Hacker News Reader

A Hacker News client with AI-powered discussion summaries. Built with React, FastAPI, PostgreSQL, and Gemini/Groq AI.

## Live Demo

- **App**: https://hacker-news-reader-tau.vercel.app/
- **API**: https://hacker-news-reader-api.onrender.com/api
- **Demo Video**: https://www.loom.com/share/1fab83352b6940239b1441a3161d3792

> Note: Render free tier backend spins down after 15 min of inactivity. First request after idle takes ~30s to cold start.

## Quick Start

```bash
# 1. Clone the repo
git clone <repo-url>
cd smart-hn-reader

# 2. Set up environment variables
cp .env.example .env
# Edit .env and add your API keys

# 3. Start everything
docker-compose up
```

The app will be available at:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **API Docs (Swagger)**: http://localhost:5000/docs

### Getting API Keys

- **Gemini** (primary): https://aistudio.google.com/apikey — free, no billing required
- **Groq** (fallback): https://console.groq.com/keys — free, no billing required

Both are optional but at least one is needed for AI summaries. If Gemini hits rate limits, the app automatically falls back to Groq.

## Features

1. **HN Feed** — Browse top, new, and best stories with pagination
2. **Story Detail** — Full threaded/nested comment tree with collapse/expand
3. **Bookmarking** — Save/remove stories to PostgreSQL, search across bookmarks
4. **AI Summary** — One-click discussion summary with key points, sentiment analysis, and a short summary

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│   Frontend   │────▶│   Backend   │────▶│  PostgreSQL   │
│  React/Vite  │     │   FastAPI   │     │              │
│  port 3000   │     │  port 5000  │     │  port 5432   │
└─────────────┘     └──────┬──────┘     └──────────────┘
                           │
                    ┌──────┴──────┐
                    │  External   │
                    │  APIs       │
                    ├─────────────┤
                    │ HN Firebase │  Story IDs + details
                    │ HN Algolia  │  Comment trees (1 request)
                    │ Gemini AI   │  Discussion summaries
                    │ Groq AI     │  Fallback summaries
                    └─────────────┘
```

### Tech Stack

| Component     | Choice                         | Why                                                         |
| ------------- | ------------------------------ | ----------------------------------------------------------- |
| Frontend      | React 18 + TypeScript + Vite 7 | Fast build, no SSR needed for this app                      |
| Styling       | Tailwind CSS v4                | Utility-first, functional and clean                         |
| State         | TanStack Query                 | Built-in caching, loading/error states, pagination          |
| Backend       | FastAPI + Python 3.12          | Async-first, auto-generated Swagger docs, Pydantic schemas  |
| ORM           | SQLAlchemy 2.0 (async)         | Mature, async support with asyncpg, mapped columns          |
| Database      | PostgreSQL                     | Robust, supports ILIKE for bookmark search                  |
| AI (primary)  | Gemini 2.5 Flash               | Free tier, fast, good quality                               |
| AI (fallback) | Groq (Llama 3.1 8B)            | Free, auto-fallback when Gemini rate-limited                |
| Infra         | Docker Compose                 | 3 services, one command to start                            |

### Backend Architecture — Domain-Based Modules

The backend follows a **domain-based architecture** where each feature is a self-contained module with its own router, service, schemas, and models:

```
app/
├── main.py                 # FastAPI app, lifespan, middleware, exception handlers
├── core/                   # Shared infrastructure
│   ├── config.py           # Settings(BaseSettings) — env vars via pydantic-settings
│   ├── database.py         # SQLAlchemy engine, async session, SessionDep alias
│   └── exceptions.py       # Custom errors (NotFoundError, AiServiceError, etc.)
├── stories/                # Domain: HN stories & comments
│   ├── router.py           # GET /stories, /stories/:id, /stories/:id/comments
│   ├── schemas.py          # Story, Comment, StoriesResponse (Pydantic)
│   └── service.py          # Firebase + Algolia API, in-memory cache
├── bookmarks/              # Domain: bookmark CRUD + search
│   ├── models.py           # SQLAlchemy Bookmark model
│   ├── router.py           # GET/POST/DELETE /bookmarks, /bookmarks/check
│   ├── schemas.py          # BookmarkCreate, BookmarkResponse (Pydantic)
│   └── service.py          # DB operations (create, delete, search, batch check)
├── ai/                     # Domain: AI-powered summaries
│   ├── models.py           # SQLAlchemy AiSummary model
│   ├── router.py           # POST /stories/:id/summarize
│   ├── schemas.py          # AiSummaryResponse (Pydantic)
│   └── service.py          # Gemini + Groq, prompt engineering, DB caching
└── utils/                  # Shared utilities
    ├── cache.py            # In-memory TTL cache
    └── html.py             # HTML tag stripping, entity decoding
```

**Key patterns:**
- `SessionDep = Annotated[AsyncSession, Depends(get_db)]` — clean dependency injection (from FastAPI official template)
- Each domain owns its models, schemas, service, and router — no shared `models.py` or `schemas.py`
- `core/exceptions.py` defines custom errors with global exception handlers
- Stories domain has no `models.py` (no DB table — proxies HN API with in-memory cache)

### API Endpoints

| Method | Endpoint                     | Description                                            |
| ------ | ---------------------------- | ------------------------------------------------------ |
| GET    | `/api/stories`               | Fetch stories (`?type=top\|new\|best&page=1&limit=30`) |
| GET    | `/api/stories/:id`           | Single story details                                   |
| GET    | `/api/stories/:id/comments`  | Threaded comment tree                                  |
| GET    | `/api/bookmarks`             | List bookmarks (`?search=query&page=1`)                |
| POST   | `/api/bookmarks`             | Save a bookmark                                        |
| DELETE | `/api/bookmarks/:hnStoryId`  | Remove a bookmark                                      |
| GET    | `/api/bookmarks/check`       | Check bookmark status (`?ids=1,2,3`)                   |
| POST   | `/api/stories/:id/summarize` | Generate AI summary (`?force=true` to regenerate)      |
| GET    | `/docs`                      | Swagger UI (auto-generated by FastAPI)                  |

### Database Schema

**Bookmark** (`bookmarks` table) — stores saved stories with metadata (title, author, points, comment count, URL). Unique constraint on `hn_story_id` prevents duplicates.

**AiSummary** (`ai_summaries` table) — caches AI-generated summaries per story (key points as PostgreSQL array, sentiment, summary text, comment count at generation time).

Tables are auto-created on startup via `Base.metadata.create_all()` in the FastAPI lifespan handler.

### Dual HN API Strategy

The official HN Firebase API requires fetching each comment individually (N+1 problem). For a story with 200 comments, that's 200+ HTTP requests.

**Solution**: Use Firebase API for story feeds (top/new/best — the only source for ranked lists) and Algolia HN API for comment trees (returns the entire threaded tree in one request). Firebase recursive fetching is kept as a fallback if Algolia is unavailable.

### AI Fallback Strategy

Gemini 2.5 Flash is the primary AI provider. If it fails (rate limit, timeout), the service automatically falls back to Groq (Llama 3.1 8B). Both return structured JSON. Summaries are cached in the database — subsequent requests return instantly without hitting any AI API.

## Tradeoffs

| Decision                                 | Tradeoff                                                                                        |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------- |
| FastAPI over Express/NestJS              | Python async ecosystem is mature. Auto-generated Swagger docs. Pydantic validation built-in     |
| Domain-based modules over layered        | Each feature is self-contained. Easy to find and modify related code during live interviews      |
| SQLAlchemy 2.0 async over sync           | Non-blocking DB calls. Uses asyncpg for native PostgreSQL async support                         |
| Proxy HN API through backend             | Adds latency but solves CORS, enables batching and caching                                      |
| Algolia for comments instead of Firebase | Not the "official" API, but eliminates N+1 problem (1 request vs 200+)                          |
| In-memory cache for HN data              | Lost on restart. Redis would be better for production but overkill here                         |
| ILIKE for bookmark search                | Simpler than full-text search (tsvector). Fine for a personal bookmark list                     |
| Gemini + Groq dual provider              | Redundancy for rate limits. Both are free tier                                                  |
| AI summary caching in DB                 | Stale if new comments arrive, but avoids redundant LLM calls. "Re-summarize" button covers this |
| Auto-create tables via metadata          | Simple for assessment. Production would use Alembic migrations                                   |

## Assumptions

- Single user (no auth) — per requirements
- Comment depth is unlimited via Algolia (Firebase fallback limits to 3 levels, 50 root comments)
- AI summaries use the top ~4000 characters of formatted comments to stay within token limits
- Bookmark search is case-insensitive on title field only

## What I'd Improve With More Time

- **SSE/streaming for AI summaries** — stream as generated instead of waiting for full response
- **Alembic migrations** — proper schema versioning instead of auto-create
- **Redis cache** — replace in-memory cache, survives restarts
- **PostgreSQL full-text search** — tsvector/tsquery for better bookmark search relevance
- **Infinite scroll** — replace pagination with intersection observer
- **Comment sorting** — by newest, oldest, most replies
- **Dark mode** — Tailwind makes this easy with dark: variants
- **E2E tests** — Playwright for critical flows
- **Rate limiting** — protect the AI endpoint (FastAPI SlowAPI middleware)
- **Stale summary detection** — compare current vs cached comment count, prompt to re-summarize

## Local Development

```bash
# Start only Postgres in Docker
make db

# Run backend + frontend dev servers with hot reload
make dev

# Or run them separately
make dev-backend    # http://localhost:5000 (uvicorn --reload)
make dev-frontend   # http://localhost:5173 (vite)

# Install dependencies
make install        # pip install + npm install
```

## Project Structure

```
├── docker-compose.yml
├── .env.example
├── Makefile
├── README.md
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py              # FastAPI app entry
│       ├── core/
│       │   ├── config.py        # Settings (pydantic-settings)
│       │   ├── database.py      # SQLAlchemy async engine + SessionDep
│       │   └── exceptions.py    # Custom errors + handlers
│       ├── stories/
│       │   ├── router.py        # HN feed endpoints
│       │   ├── schemas.py       # Story, Comment schemas
│       │   └── service.py       # Firebase + Algolia API
│       ├── bookmarks/
│       │   ├── models.py        # Bookmark SQLAlchemy model
│       │   ├── router.py        # Bookmark CRUD endpoints
│       │   ├── schemas.py       # Bookmark request/response schemas
│       │   └── service.py       # DB operations
│       ├── ai/
│       │   ├── models.py        # AiSummary SQLAlchemy model
│       │   ├── router.py        # Summarize endpoint
│       │   ├── schemas.py       # Summary response schema
│       │   └── service.py       # Gemini + Groq with fallback
│       └── utils/
│           ├── cache.py         # In-memory TTL cache
│           └── html.py          # HTML sanitization
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    └── src/
        ├── App.tsx
        ├── main.tsx
        ├── api/                 # API client functions
        ├── components/
        │   ├── layout/          # Header, ErrorBoundary
        │   ├── stories/         # StoryList, StoryItem, FeedTabs
        │   ├── comments/        # CommentTree, CommentItem
        │   └── ai/              # SummarizeButton, SummaryCard
        ├── pages/               # FeedPage, StoryPage, BookmarksPage
        ├── hooks/               # TanStack Query hooks
        └── types/index.ts
```
