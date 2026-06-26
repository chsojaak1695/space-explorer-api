# 🌌 Space Explorer Dashboard API

> **CAPS Operations Committee — Interim Recruitment Task**  
> *Engineered to the standards of MIT CSAIL & Stanford HAI research infrastructure*

A production-grade REST API that wraps NASA's open data platform — APOD, Mars Rover Photos, and Near Earth Objects — with a full Favorites CRUD system, Redis caching, and a background scheduler.

---

## Table of Contents

- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Caching & Rate Limiting Strategy](#caching--rate-limiting-strategy)
- [Background Job](#background-job)
- [Running Tests](#running-tests)
- [Project Structure](#project-structure)
- [AI Usage Disclosure](#ai-usage-disclosure)

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                    HTTP Client                        │
└─────────────────────┬────────────────────────────────┘
                      │
           Express + Rate Limiter
                      │
        ┌─────────────▼──────────────┐
        │        API Router           │
        │  /apod  /mars  /neo  /favs │
        └─────────────┬──────────────┘
                      │
        ┌─────────────▼──────────────┐
        │       Controllers           │
        │  (validate → delegate)      │
        └─────────────┬──────────────┘
                      │
        ┌─────────────▼──────────────┐
        │         Services            │◄──── Redis Cache (TTL)
        │  (business logic + cache)   │
        └──────┬──────────┬──────────┘
               │          │
     ┌─────────▼──┐  ┌────▼────────┐
     │  NASA API  │  │  MongoDB    │
     │  (axios)   │  │  (Mongoose) │
     └────────────┘  └─────────────┘
```

**Pattern:** MVC with a Service layer  
**Cache priority:** Redis → MongoDB persistent cache → NASA API  
**Stack:** Node.js · Express · MongoDB (Mongoose) · Redis · node-cron

---

## Quick Start

### Prerequisites
- Node.js ≥ 18
- MongoDB (local or Atlas)
- Redis (local or Redis Cloud)
- NASA API key from [api.nasa.gov](https://api.nasa.gov) *(free, instant)*

### Installation

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd space-explorer-api

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your NASA_API_KEY, MONGO_URI, REDIS_URL

# 4. Start development server
npm run dev

# 5. Visit API docs
open http://localhost:5000/api-docs
```

### Docker (optional)

```bash
# Start MongoDB + Redis via Docker Compose
docker compose up -d mongo redis

# Then run the API
npm run dev
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | HTTP server port |
| `NODE_ENV` | `development` | Environment |
| `NASA_API_KEY` | `DEMO_KEY` | Get free key at api.nasa.gov |
| `MONGO_URI` | `mongodb://localhost:27017/space_explorer` | MongoDB connection string |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection string |
| `APOD_CACHE_TTL` | `86400` | APOD Redis TTL (seconds) |
| `MARS_CACHE_TTL` | `3600` | Mars photos Redis TTL (seconds) |
| `NEO_CACHE_TTL` | `3600` | NEO feed Redis TTL (seconds) |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate limit window (15 min) |
| `RATE_LIMIT_MAX` | `100` | Max requests per window |

> ⚠️ Never commit `.env`. Only `.env.example` is committed.

---

## API Reference

Interactive docs available at **`/api-docs`** (Swagger UI).

### Base URL
```
http://localhost:5000/api/v1
```

### Endpoints

#### APOD
| Method | Path | Description |
|---|---|---|
| `GET` | `/apod` | Today's APOD, or by `?date=YYYY-MM-DD`, or random `?count=N` |

#### Mars Rover Photos
| Method | Path | Description |
|---|---|---|
| `GET` | `/mars/photos` | Photos by `?rover=&sol=` or `?earth_date=&camera=&page=` |
| `GET` | `/mars/manifests/:rover` | Mission manifest for a rover |

#### Near Earth Objects
| Method | Path | Description |
|---|---|---|
| `GET` | `/neo/feed` | Feed by `?start_date=&end_date=` (max 7-day range) |
| `GET` | `/neo/:asteroidId` | Single asteroid by NASA ID |

#### Favorites
| Method | Path | Description |
|---|---|---|
| `GET` | `/favorites` | List all (`?type=apod&search=nebula&page=1`) |
| `POST` | `/favorites` | Create a favorite |
| `GET` | `/favorites/:id` | Get by MongoDB ID |
| `PATCH` | `/favorites/:id` | Update `notes`, `tags`, or `title` |
| `DELETE` | `/favorites/:id` | Delete |

#### Health
| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Service health check |

### Example Requests

```bash
# Today's APOD
curl http://localhost:5000/api/v1/apod

# APOD for a specific date
curl http://localhost:5000/api/v1/apod?date=2024-01-01

# Mars Curiosity photos on sol 1000
curl "http://localhost:5000/api/v1/mars/photos?rover=curiosity&sol=1000"

# Mars photos by Earth date with camera filter
curl "http://localhost:5000/api/v1/mars/photos?rover=perseverance&earth_date=2023-06-10&camera=NAVCAM_LEFT"

# NEO feed for 3-day window
curl "http://localhost:5000/api/v1/neo/feed?start_date=2024-03-01&end_date=2024-03-03"

# Create a favorite
curl -X POST http://localhost:5000/api/v1/favorites \
  -H "Content-Type: application/json" \
  -d '{"type":"apod","nasaId":"2024-03-15","title":"Pillars of Creation","tags":["nebula","hubble"]}'

# Update favorite notes
curl -X PATCH http://localhost:5000/api/v1/favorites/<id> \
  -H "Content-Type: application/json" \
  -d '{"notes":"Stunning image of stellar nursery in Eagle Nebula","tags":["nebula","jwst"]}'
```

---

## Caching & Rate Limiting Strategy

### Caching (Redis + MongoDB dual-layer)

| Layer | Technology | Purpose |
|---|---|---|
| L1 | **Redis** | Fast in-memory, TTL-based |
| L2 | **MongoDB** | Persistent across Redis restarts |
| L3 | **NASA API** | Source of truth |

**TTL Rationale:**
- **APOD (24h):** NASA publishes exactly one APOD per day. A 24-hour TTL matches the publication cadence perfectly.
- **Mars photos (1h):** Mars rover data rarely changes post-ingestion but rover operations can cause late uploads.
- **NEO feed (1h):** Orbital data updates periodically but near-term approach data is stable within hours.
- **Empty Mars sol (15min):** A sol with no photos is a valid state but may get late uploads — shorter TTL allows rechecking.

**Trade-off under time pressure:** Chose Redis over Memcached for its richer data types and the ability to use `GET/SET` with atomic TTL. Skipped distributed locking (cache stampede protection) — acceptable for a single-instance deployment but would need a `SETNX`-based mutex pattern at scale.

### Rate Limiting

- **100 requests / 15 minutes per IP** on all `/api/*` routes
- Health check (`/health`) is exempt — allows load balancer probes
- Returns `429 Too Many Requests` with a clear retry message
- NASA's own rate limit (1,000/hour for registered keys) is caught and surfaced as a `429` to the client

---

## Background Job

The APOD scheduler (`src/jobs/apodScheduler.js`) runs at **00:05 UTC daily** using `node-cron`.

**Restart safety:** On every server start, `fetchTodayApod()` is called immediately before the cron is registered. This means:
- If the server restarts at 00:03 UTC (before the scheduled run), startup pre-warm covers the gap.
- If the server restarts at 12:00 UTC (APOD already cached), the MongoDB layer has it and Redis is re-warmed from Mongo.
- The job never crashes the server on NASA API failure — it logs the error and waits for the next scheduled run.

---

## Running Tests

```bash
# Run all tests
npm test

# With coverage report
npm run test:coverage
```

Tests cover:
- ✅ NEO date range validation (>7 days, invalid dates, future dates)
- ✅ Mars rover and camera validation (invalid rover, missing sol/date, empty results)
- ✅ Favorites CRUD (create, read, update, delete, 404/409 error cases)
- ✅ All services mocked — no real NASA API calls during testing

---

## Project Structure

```
space-explorer-api/
├── src/
│   ├── config/
│   │   ├── db.js            # MongoDB connection
│   │   ├── redis.js         # Redis client + cache helpers
│   │   ├── nasaClient.js    # Axios client with error interceptors
│   │   └── swagger.js       # OpenAPI spec
│   ├── controllers/         # Thin HTTP layer — validate → delegate to service
│   ├── services/            # Business logic + caching
│   │   ├── apodService.js
│   │   ├── marsService.js
│   │   ├── neoService.js
│   │   └── favoritesService.js
│   ├── models/
│   │   ├── Favorite.js      # Mongoose schema with text index
│   │   └── ApodCache.js     # Persistent APOD cache
│   ├── routes/              # Express routers with Swagger JSDoc
│   ├── middleware/
│   │   ├── errorHandler.js  # Centralized error normalization
│   │   └── rateLimiter.js   # express-rate-limit config
│   ├── jobs/
│   │   └── apodScheduler.js # node-cron daily APOD job
│   ├── utils/
│   │   └── logger.js        # Winston structured logger
│   ├── app.js               # Express app setup
│   └── server.js            # Entry point + graceful shutdown
├── tests/
│   ├── neo.test.js
│   ├── mars.test.js
│   └── favorites.test.js
├── .env.example
├── package.json
└── README.md
```

---

## AI Usage Disclosure

> In compliance with the CAPS AI Usage Disclosure Requirement.

**Tool used:** Claude (Anthropic) — claude-sonnet-4-6  
**Usage:** Code generation, architecture decisions, documentation  
**Workflow:**
1. PDF task requirements analyzed by Claude
2. Stack selection confirmed by developer (MERN + Redis)
3. Full codebase generated via Claude with developer-guided iteration
4. All generated code reviewed and understood by the developer

**What was AI-assisted:** All source files in this repository were generated with Claude assistance. Architecture decisions (dual-layer caching, edge case handling, graceful shutdown, background job restart safety) were co-designed between developer and AI.

**AI interaction log:** See `AI_INTERACTION_LOG.md` in this repository.
