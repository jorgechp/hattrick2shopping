import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.api.routes import router
from app.challenge import cleanup_challenges
from app.database import init_db
from app.heartbeat import cleanup_sessions
from app.scheduler import auto_train_loop
from app.security import limiter


async def cleanup_loop():
    while True:
        await asyncio.sleep(60)
        cleanup_challenges()
        cleanup_sessions()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    train_task = asyncio.create_task(auto_train_loop())
    cleanup_task = asyncio.create_task(cleanup_loop())
    yield
    train_task.cancel()
    cleanup_task.cancel()
    try:
        await train_task
    except asyncio.CancelledError:
        pass
    try:
        await cleanup_task
    except asyncio.CancelledError:
        pass


app = FastAPI(title="Hattrick2Shopping API", version="0.1.0", lifespan=lifespan)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
