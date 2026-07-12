# Hattrick2Shopping

Capture, analyze and predict Hattrick transfer prices using machine learning.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Firefox Extension                                  │
│  (content-script → background → POST)              │
│  ┌──────────────┐    ┌──────────────┐              │
│  │ hattrick.org │───→│  background  │──┐           │
│  │ content.js   │    │  service     │  │           │
│  └──────────────┘    └──────────────┘  │           │
│       ┌────────────────────────────────┘           │
└───────┼─────────────────────────────────────────────┘
        │ POST /api/transfers/batch
        │ + PoW proof + heartbeat + contributor_id
        ▼
┌─────────────────────────────────────────────────────┐
│  Backend (FastAPI + PostgreSQL)                     │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐ │
│  │   API    │→ │ Services │→ │  ML (RandomForest) │ │
│  │  Routes  │  │          │  │  auto-train 24h    │ │
│  └──────────┘  └──────────┘  └───────────────────┘ │
│       │                                              │
│       ▼                                              │
│  ┌──────────┐                                        │
│  │PostgreSQL│                                        │
│  └──────────┘                                        │
└─────────────────────────────────────────────────────┘
        │ REST API
        ▼
┌─────────────────────────────────────────────────────┐
│  Frontend (React + Vite + Tailwind)                 │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐ │
│  │Dashboard │  │Transfers │  │   Predictor        │ │
│  │  stats   │  │  table   │  │   + training age   │ │
│  └──────────┘  └──────────┘  └───────────────────┘ │
└─────────────────────────────────────────────────────┘
```

## Components

| Folder | Technology | Purpose |
|--------|------------|---------|
| `backend/` | Python FastAPI + scikit-learn + PostgreSQL | REST API, ML model, auto-training |
| `frontend/` | React + Vite + Tailwind | Dashboard, transfers table, predictor |
| `extensions/firefox/` | Manifest V3 | Captures data from hattrick.org |

## Quick start (Docker)

```bash
docker compose up -d
```

This starts:
- **PostgreSQL 16** on `localhost:5432`
- **Backend** on `http://localhost:8000`
- **Frontend** on `http://localhost:80`

### Environment variables (`.env` in `backend/`)

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql+asyncpg://hattrick:hattrick@localhost:5432/hattrick2shopping` | Database connection |
| `ML_MODEL_PATH` | `models/` | Directory for trained models |
| `WRITE_API_KEY` | *(empty)* | If set, protects write endpoints |
| `RATE_LIMIT_PER_MINUTE` | `15/minute` | Rate limit for `/api/transfers/batch` |

## Firefox Extension

1. Open `about:debugging#/runtime/this-firefox`
2. "Load Temporary Add-on" → select `extensions/firefox/manifest.json`
3. Open a transfers page on Hattrick
4. Automatic capture sends data to the backend

If you configured `WRITE_API_KEY`, enter it in the extension popup (the "API Key" field).

## Security

The `POST /api/transfers/batch` endpoint applies three checks before accepting data:

1. **Proof-of-Work** — SHA-256 with configurable difficulty (~65k hashes per batch)
2. **Heartbeat** — The extension must be sending signals every 30s from `hattrick.org`
3. **API Key** — Optional, via `X-API-Key` header

Additionally: strict range validation (skills 1–20, age 15–50, TSI ≤ 500k, price ≥ €500), 25 transfers per batch limit, IP rate limiting.

## Development

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Project structure

```
hattrick2shopping/
├── backend/
│   ├── app/
│   │   ├── api/          → routes.py
│   │   ├── ml/           → predictor.py, benchmark.py
│   │   ├── models/       → player.py, transfer.py
│   │   ├── schemas/      → Pydantic models
│   │   ├── services/     → transfer_service, ml_service
│   │   ├── challenge.py  → PoW generation & verification
│   │   ├── heartbeat.py  → Session heartbeat tracking
│   │   ├── security.py   → API key, rate limiter
│   │   ├── scheduler.py  → Auto-train loop
│   │   ├── database.py   → SQLAlchemy async engine
│   │   └── main.py       → FastAPI app
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/   → RandomBanner, etc.
│   │   ├── i18n/         → translations (8 languages)
│   │   ├── pages/        → Dashboard, Transfers, Predictor, etc.
│   │   └── App.tsx
│   ├── public/
│   │   ├── banners/      → Seasonal images (WebP)
│   │   └── logo/         → isotipo.webp, logo.webp
│   ├── Dockerfile
│   └── nginx.conf
├── extensions/firefox/
│   ├── content-script.js → DOM scraper + PoW solver + heartbeat
│   ├── background.js     → Relay to backend
│   └── popup/            → Settings UI
├── docker-compose.yml
└── README.en.md
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.12, FastAPI, SQLAlchemy async, asyncpg |
| ML | scikit-learn (RandomForestRegressor), pandas, numpy |
| Frontend | React 18, Vite, Tailwind CSS, Recharts |
| Database | PostgreSQL 16 |
| Extension | Firefox Manifest V3, Web Crypto API |
| Infra | Docker, docker-compose, Cloudflare Pages |

## License

GNU GPLv3
