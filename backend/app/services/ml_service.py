from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.player import Player
from app.models.transfer import Transfer
from app.ml.predictor import predictor, encode_features, SKILL_KEYS


async def load_training_data(session: AsyncSession) -> list[dict]:
    result = await session.execute(
        select(Transfer)
        .options(joinedload(Transfer.player))
        .where(Transfer.price.isnot(None))
    )
    transfers = result.unique().scalars().all()

    records = []
    for t in transfers:
        if not t.player:
            continue
        skills = t.skills_at_transfer or {}
        if isinstance(skills, str):
            import json
            try:
                skills = json.loads(skills)
            except (json.JSONDecodeError, TypeError):
                skills = {}
        age = t.player.age_years or 20
        age_days = t.player.age_days or 0
        row = encode_features(
            skills=skills,
            age=age + age_days / 365.0,
            tsi=t.tsi,
            specialty=t.player.specialty,
            category=t.player.category,
        )
        row["price"] = t.price
        records.append(row)

    return records


async def train_from_db(session: AsyncSession) -> dict:
    records = await load_training_data(session)
    return predictor.train(records)


def get_predictor_status():
    return {"trained": predictor.is_trained()}
