import asyncio
import logging

from app.database import async_session
from app.services.ml_service import train_from_db
from app.services.quality_service import get_quality_report

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(levelname)s: %(message)s")
TRAIN_INTERVAL_SECONDS = 86400  # 24h

cached_quality: dict | None = None


async def _run_training():
    async with async_session() as session:
        result = await train_from_db(session)
        samples = result.get("samples", 0)
        logger.info(f"Auto-train: done — {samples} samples")
        return result


async def _run_quality():
    global cached_quality
    async with async_session() as session:
        cached_quality = await get_quality_report(session)
        logger.info(f"Auto-quality: analyzed {cached_quality.get('samples', 0)} records")
        return cached_quality


async def auto_train_loop():
    await asyncio.sleep(10)
    logger.info("Auto-train: initial run...")
    try:
        await _run_training()
    except Exception as e:
        logger.warning(f"Auto-train: initial training failed — {e}")
    try:
        await _run_quality()
    except Exception as e:
        logger.warning(f"Auto-quality: initial analysis failed — {e}")

    while True:
        await asyncio.sleep(TRAIN_INTERVAL_SECONDS)
        logger.info("Auto-train: scheduled run...")
        try:
            await _run_training()
        except Exception as e:
            logger.warning(f"Auto-train: failed — {e}")
        try:
            await _run_quality()
        except Exception as e:
            logger.warning(f"Auto-quality: failed — {e}")


def get_cached_quality() -> dict | None:
    return cached_quality
