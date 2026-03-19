# Smart Hacker News Reader

A Hacker News client with AI-powered discussion summaries. Built with React, Express, PostgreSQL, and Gemini/Groq AI.

## Live Demo

- **App**: https://smart-hn-reader.vercel.app
- **API**: https://hacker-news-reader-api.onrender.com/api

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
│  React/Vite  │     │  Express/TS │     │              │
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

| Component | Choice | Why |
|---|---|---|
| Frontend | React 18 + TypeScript + Vite 7 | Fast build, no SSR needed for this app |
| Styling | Tailwind CSS v4 | Utility-first, functional and clean |
| State | TanStack Query | Built-in caching, loading/error states, pagination |
| Backend | Express 5 + TypeScript | Lightweight, universally understood |
| ORM | Prisma 7 | Type-safe queries, easy migrations |
| Database | PostgreSQL | Robust, supports ILIKE for bookmark search |
| AI (primary) | Gemini 2.5 Flash | Free tier, fast, good quality |
| AI (fallback) | Groq (Llama 3.1 8B) | Free, auto-fallback when Gemini rate-limited |
| Infra | Docker Compose | 3 services, one command to start |

### API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/stories` | Fetch stories (`?type=top\|new\|best&page=1&limit=30`) |
| GET | `/api/stories/:id` | Single story details |
| GET | `/api/stories/:id/comments` | Threaded comment tree |
| GET | `/api/bookmarks` | List bookmarks (`?search=query&page=1`) |
| POST | `/api/bookmarks` | Save a bookmark |
| DELETE | `/api/bookmarks/:hnStoryId` | Remove a bookmark |
| GET | `/api/bookmarks/check` | Check bookmark status (`?ids=1,2,3`) |
| POST | `/api/stories/:id/summarize` | Generate AI summary (`?force=true` to regenerate) |

### Database Schema

**Bookmark** — stores saved stories with metadata (title, author, points, comment count, URL)

**AiSummary** — caches AI-generated summaries per story (key points, sentiment, summary text, comment count at generation time)

### Dual HN API Strategy

The official HN Firebase API requires fetching each comment individually (N+1 problem). For a story with 200 comments, that's 200+ HTTP requests.

**Solution**: Use Firebase API for story feeds (top/new/best — the only source for ranked lists) and Algolia HN API for comment trees (returns the entire threaded tree in one request). Firebase recursive fetching is kept as a fallback if Algolia is unavailable.

### AI Fallback Strategy

Gemini 2.5 Flash is the primary AI provider. If it fails (rate limit, timeout), the service automatically falls back to Groq (Llama 3.1 8B). Both use JSON mode for guaranteed valid responses. Summaries are cached in the database — subsequent requests return instantly without hitting any AI API.

## Tradeoffs

| Decision | Tradeoff |
|---|---|
| Proxy HN API through backend | Adds latency but solves CORS, enables batching and caching |
| Algolia for comments instead of Firebase | Not the "official" API, but eliminates N+1 problem (1 request vs 200+) |
| In-memory cache for HN data | Lost on restart. Redis would be better for production but overkill here |
| ILIKE for bookmark search | Simpler than full-text search (tsvector). Fine for a personal bookmark list |
| Gemini + Groq dual provider | Redundancy for rate limits. Both are free tier |
| AI summary caching in DB | Stale if new comments arrive, but avoids redundant LLM calls. "Re-summarize" button covers this |
| tsx runtime instead of compiled JS | Simplifies Prisma v7 ESM/CJS compatibility. Acceptable for this scope |

## Assumptions

- Single user (no auth) — per requirements
- Comment depth is unlimited via Algolia (Firebase fallback limits to 3 levels, 50 root comments)
- AI summaries use the top ~4000 characters of formatted comments to stay within token limits
- Bookmark search is case-insensitive on title field only

## What I'd Improve With More Time

- **SSE/streaming for AI summaries** — stream as generated instead of waiting for full response
- **Redis cache** — replace in-memory cache, survives restarts
- **PostgreSQL full-text search** — tsvector/tsquery for better bookmark search relevance
- **Infinite scroll** — replace pagination with intersection observer
- **Comment sorting** — by newest, oldest, most replies
- **Dark mode** — Tailwind makes this easy with dark: variants
- **E2E tests** — Playwright for critical flows
- **Rate limiting** — protect the AI endpoint
- **Stale summary detection** — compare current vs cached comment count, prompt to re-summarize

## Local Development

```bash
# Start only Postgres in Docker
make db

# Run backend + frontend dev servers with hot reload
make dev

# Or run them separately
make dev-backend    # http://localhost:5000
make dev-frontend   # http://localhost:5173
```

## Project Structure

```
├── docker-compose.yml
├── .env.example
├── Makefile
├── backend/
│   ├── Dockerfile
│   ├── prisma/schema.prisma
│   └── src/
│       ├── index.ts            # Express app entry
│       ├── config.ts           # Environment config
│       ├── lib/prisma.ts       # Prisma client singleton
│       ├── routes/
│       │   ├── stories.ts      # HN feed endpoints
│       │   ├── bookmarks.ts    # Bookmark CRUD
│       │   └── ai.ts           # AI summary endpoint
│       ├── services/
│       │   ├── hn.service.ts   # HN API (Firebase + Algolia)
│       │   ├── bookmark.service.ts
│       │   └── ai.service.ts   # Gemini + Groq with fallback
│       ├── utils/
│       │   ├── errors.ts       # Custom error classes
│       │   ├── html.ts         # HTML sanitization
│       │   └── logger.ts       # Structured logging
│       └── types/index.ts
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    └── src/
        ├── App.tsx
        ├── main.tsx
        ├── api/                # API client functions
        ├── components/
        │   ├── layout/         # Header, ErrorBoundary
        │   ├── stories/        # StoryItem, FeedTabs
        │   ├── comments/       # CommentTree, CommentItem
        │   └── ai/             # SummarizeButton, SummaryCard
        ├── pages/              # FeedPage, StoryPage, BookmarksPage
        ├── hooks/              # TanStack Query hooks
        └── types/index.ts
```
