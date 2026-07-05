import json
import logging

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session, async_session
from app.schemas.transfer import BatchTransferIn, TransferOut
from app.schemas.prediction import (
    PredictRequest, PredictResponse,
    ProjectionResponse, ProjectionPoint,
    TrainResponse,
)
from app.services.transfer_service import process_transfers, get_recent_transfers
from app.services.ml_service import train_from_db, get_predictor_status
from app.ml.predictor import predictor, encode_features, ALL_FEATURES, SKILL_KEYS
from app.models.transfer import Transfer
from app.ml.benchmark import run_benchmark
from app.config import settings
from app.security import verify_write_api_key, limiter
from app.challenge import generate_challenge, consume_challenge, verify_pow
from app.heartbeat import record_heartbeat, verify_session

logger = logging.getLogger("app.api")

router = APIRouter(prefix="/api", tags=["transfers"])


@router.get("/health")
async def health():
    status = get_predictor_status()
    return {"status": "ok", "app": "hattrick2shopping", "ml": status}


@router.get("/challenge")
async def get_challenge():
    return generate_challenge()


@router.post("/heartbeat")
async def heartbeat(request: Request):
    body = await request.json()
    sid = body.get("session_id", "")
    url = body.get("url", "")
    logger.info("Heartbeat session=%s url=%s", sid, url)
    record_heartbeat(
        session_id=sid,
        url=url,
        contributor_id=body.get("contributor_id"),
    )
    return {"ok": True}


@router.post("/transfers/batch")
@limiter.limit(settings.rate_limit_per_minute)
async def create_transfers_batch(
    request: Request,
    session: AsyncSession = Depends(get_session),
    _api_key: None = Depends(verify_write_api_key),
):
    raw = await request.body()
    body = json.loads(raw)

    try:
        payload = BatchTransferIn(**body)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))

    if not payload.session_id or not payload.nonce or payload.counter is None:
        raise HTTPException(status_code=403, detail="Missing PoW proof")

    if not verify_session(payload.session_id):
        logger.warning("Session check failed for %s", payload.session_id)
        raise HTTPException(status_code=403, detail="No active session — heartbeat required")

    challenge = consume_challenge(payload.nonce)
    if not challenge:
        raise HTTPException(status_code=403, detail="Invalid or expired challenge")

    transfers_raw = json.dumps(body["transfers"], separators=(",", ":"), ensure_ascii=False)
    if not verify_pow(payload.nonce, payload.counter, transfers_raw, challenge["difficulty"]):
        logger.warning("PoW verification FAILED for nonce=%s counter=%s transfers_len=%d",
                       payload.nonce, payload.counter, len(body["transfers"]))
        raise HTTPException(status_code=403, detail="Invalid PoW proof")

    count = await process_transfers(
        session, payload.transfers, contributor_id=payload.contributor_id,
    )
    return {"received": count}


@router.get("/transfers/count")
async def transfer_count(session: AsyncSession = Depends(get_session)):
    from sqlalchemy import func
    result = await session.execute(select(func.count(Transfer.id)))
    return {"count": result.scalar() or 0}


@router.get("/transfers", response_model=list[TransferOut])
async def list_transfers(
    limit: int = 500,
    skip: int = 0,
    session: AsyncSession = Depends(get_session),
):
    transfers = await get_recent_transfers(session, limit=limit, skip=skip)
    result = []
    for t in transfers:
        transfer_out = TransferOut(
            id=t.id,
            player_id=t.player_id,
            player_name=t.player.name if t.player else None,
            price=t.price,
            player_skills=t.skills_at_transfer,
            tsi=t.tsi,
            salary=t.salary,
            deadline=t.deadline,
            views=t.views,
            bids=t.bids,
            owner=t.owner,
            source_url=t.source_url,
            captured_at=t.captured_at,
        )
        if t.player:
            transfer_out.player_age_years = t.player.age_years
            transfer_out.player_age_days = t.player.age_days
            transfer_out.category = t.player.category
            transfer_out.specialty = t.player.specialty
        result.append(transfer_out)
    return result


@router.post("/predict/train")
@limiter.limit("3/minute")
async def train_model(
    request: Request,
    session: AsyncSession = Depends(get_session),
    _api_key: None = Depends(verify_write_api_key),
):
    result = await train_from_db(session)
    return result


@router.post("/predict", response_model=PredictResponse)
@limiter.limit("30/minute")
async def predict_price(request: Request, req: PredictRequest):
    if not predictor.is_trained():
        return PredictResponse(price=0, ci_lower=0, ci_upper=0, trained=False)

    features = encode_features(
        skills=req.skills,
        age=req.age + (req.ageDays or 0) / 365.0,
        tsi=req.tsi,
        specialty=req.specialty,
        category=req.category,
        bids=req.bids,
        hours_until_deadline=req.hours_until_deadline,
    )
    result = predictor.predict(features)
    return PredictResponse(**result, trained=True)


@router.post("/predict/projection", response_model=ProjectionResponse)
@limiter.limit("15/minute")
async def project_price(request: Request, req: PredictRequest):
    if not predictor.is_trained():
        return ProjectionResponse(projection=[], scenarios=[], trained=False)

    features = encode_features(
        skills=req.skills,
        age=req.age + (req.ageDays or 0) / 365.0,
        tsi=req.tsi,
        specialty=req.specialty,
        category=req.category,
        bids=req.bids,
        hours_until_deadline=req.hours_until_deadline,
    )

    if req.trained_skill and req.trained_skill in SKILL_KEYS and req.skill_growth_per_year is not None:
        scenarios = predictor.project_with_training(
            base_features=features,
            from_age=req.age or 20,
            trained_skill=req.trained_skill,
            growth_per_year=req.skill_growth_per_year,
            to_age=22,
            age_days=req.ageDays or 0,
        )
        projection = predictor.project_over_age(
            base_features=features,
            from_age=req.age or 20,
            to_age=22,
            age_days=req.ageDays or 0,
        )
        return ProjectionResponse(
            projection=projection,
            scenarios=scenarios,
            trained=True,
        )

    projection = predictor.project_over_age(
        base_features=features,
        from_age=req.age or 20,
        to_age=22,
        age_days=req.ageDays or 0,
    )
    return ProjectionResponse(projection=projection, scenarios=[], trained=True)


@router.get("/predict/info")
async def model_info():
    return predictor.get_info()


@router.post("/predict/benchmark")
@limiter.limit("2/minute")
async def benchmark_models(
    request: Request,
    session: AsyncSession = Depends(get_session),
    _api_key: None = Depends(verify_write_api_key),
):
    from app.services.ml_service import load_training_data
    import pandas as pd
    import numpy as np

    records = await load_training_data(session)
    if not records:
        return {"error": "No training data available"}

    df = pd.DataFrame(records)
    if "price" not in df.columns or df["price"].isna().all():
        return {"error": "No prices in training data"}

    df = df.dropna(subset=["price"])
    df["price"] = df["price"].clip(lower=1000)
    log_price = np.log(df["price"])

    feature_cols = [c for c in ALL_FEATURES if c in df.columns]
    if not feature_cols:
        return {"error": "No feature columns found"}

    X = df[feature_cols].fillna(0).values
    y = log_price.values

    return run_benchmark(X, y)


@router.get("/data/quality")
async def data_quality():
    from app.scheduler import get_cached_quality

    cached = get_cached_quality()
    if cached is not None:
        return cached

    try:
        async with async_session() as session:
            from app.services.quality_service import get_quality_report
            report = await get_quality_report(session)
            return report
    except Exception as e:
        return {"error": str(e), "samples": 0}
