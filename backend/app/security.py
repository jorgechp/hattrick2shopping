from fastapi import Header, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.config import settings

limiter = Limiter(key_func=get_remote_address)


async def verify_write_api_key(x_api_key: str = Header("")):
    if settings.write_api_key and x_api_key != settings.write_api_key:
        raise HTTPException(status_code=403, detail="Invalid API key")


def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"
