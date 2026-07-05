# Hattrick2Shopping 🏟️⚡

Captura, analiza y predice precios de transferencias de Hattrick mediante machine learning.

## Arquitectura

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
        │ API REST
        ▼
┌─────────────────────────────────────────────────────┐
│  Frontend (React + Vite + Tailwind)                 │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐ │
│  │Dashboard │  │Transfers │  │   Predictor        │ │
│  │  stats   │  │  table   │  │   + training age   │ │
│  └──────────┘  └──────────┘  └───────────────────┘ │
└─────────────────────────────────────────────────────┘
```

## Componentes

| Carpeta | Tecnología | Propósito |
|---------|------------|-----------|
| `backend/` | Python FastAPI + scikit-learn + PostgreSQL | API REST, ML model, auto-training |
| `frontend/` | React + Vite + Tailwind | Dashboard, transfers table, predictor |
| `extensions/firefox/` | Manifest V3 | Captura datos desde hattrick.org |

## Quick start (Docker)

```bash
docker compose up -d
```

Esto levanta:
- **PostgreSQL 16** en `localhost:5432`
- **Backend** en `http://localhost:8000`
- **Frontend** en `http://localhost:80`

### Variables de entorno (`.env` en `backend/`)

| Variable | Default | Descripción |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql+asyncpg://hattrick:hattrick@localhost:5432/hattrick2shopping` | Conexión a BD |
| `ML_MODEL_PATH` | `models/` | Directorio para modelos entrenados |
| `WRITE_API_KEY` | *(vacío)* | Si se define, protege endpoints de escritura |
| `RATE_LIMIT_PER_MINUTE` | `15/minute` | Rate limit para `/api/transfers/batch` |

## Extensión Firefox

1. Abre `about:debugging#/runtime/this-firefox`
2. "Cargar complemento temporal" → selecciona `extensions/firefox/manifest.json`
3. Abre una página de transferencias en Hattrick
4. La captura automática envía los datos al backend

Si configuraste `WRITE_API_KEY`, introdúcela en el popup de la extensión (campo "API Key").

## Seguridad

El endpoint `POST /api/transfers/batch` aplica tres verificaciones antes de aceptar datos:

1. **Proof-of-Work** — SHA-256 con dificultad configurable (~65k hashes por batch)
2. **Heartbeat** — La extensión debe estar emitiendo señales cada 30s desde `hattrick.org`
3. **API Key** — Opcional, vía header `X-API-Key`

Además: validación estricta de rangos (skills 1–20, edad 15–50, TSI ≤ 500k, precio ≥ 500€), límite de 25 transfers por batch, rate limiting por IP.

## Desarrollo

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

### Estructura del proyecto

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
└── .github/workflows/    → Deploy frontend to Pages
```

## Tecnologías

| Capa | Tecnología |
|------|-----------|
| Backend | Python 3.12, FastAPI, SQLAlchemy async, asyncpg |
| ML | scikit-learn (RandomForestRegressor), pandas, numpy |
| Frontend | React 18, Vite, Tailwind CSS, Recharts |
| BD | PostgreSQL 16 |
| Extensión | Firefox Manifest V3, Web Crypto API |
| Infra | Docker, docker-compose, GitHub Pages |

## Licencia

MIT
