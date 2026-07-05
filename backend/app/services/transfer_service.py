from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.player import Player
from app.models.transfer import Transfer
from app.schemas.transfer import TransferIn


async def _resolve_player(session: AsyncSession, t: TransferIn) -> Player:
    """Find existing player or create new one, handling duplicates by keeping the most recently updated record."""
    player = None

    if t.playerId:
        result = await session.execute(
            select(Player).where(Player.hattrick_id == int(t.playerId))
            .order_by(desc(Player.updated_at))
        )
        rows = result.scalars().all()
        if len(rows) > 1:
            for p in rows[1:]:
                await session.delete(p)
            await session.flush()
        if rows:
            player = rows[0]

    if not player:
        result = await session.execute(
            select(Player).where(Player.name == t.name)
            .order_by(desc(Player.updated_at))
        )
        rows = result.scalars().all()
        if len(rows) > 1:
            for p in rows[1:]:
                await session.delete(p)
            await session.flush()
        if rows:
            player = rows[0]

    if not player:
        player = Player(
            name=t.name,
            hattrick_id=int(t.playerId) if t.playerId else None,
            age_years=t.ageYears,
            age_days=t.ageDays,
            category=t.category,
            specialty=t.specialty,
            skills=t.skills,
        )
        session.add(player)
        await session.flush()
    else:
        if t.ageYears is not None:
            player.age_years = t.ageYears
        if t.ageDays is not None:
            player.age_days = t.ageDays
        if t.category:
            player.category = t.category
        if t.specialty:
            player.specialty = t.specialty
        if t.skills:
            player.skills = t.skills
        if t.playerId:
            player.hattrick_id = int(t.playerId)

    return player


async def process_transfers(
    session: AsyncSession,
    transfers: list[TransferIn],
    contributor_id: str | None = None,
) -> int:
    count = 0
    for t in transfers:
        player = await _resolve_player(session, t)

        deadline_filter = [Transfer.deadline == t.deadline] if t.deadline else []
        existing = await session.execute(
            select(Transfer).where(
                Transfer.player_id == player.id,
                *deadline_filter,
            )
            .order_by(desc(Transfer.captured_at))
            .limit(1)
        )
        existing_transfer = existing.scalar_one_or_none()

        if existing_transfer:
            existing_transfer.price = t.currentBid
            existing_transfer.deadline = t.deadline
            existing_transfer.tsi = t.tsi
            existing_transfer.salary = t.salary
            existing_transfer.views = t.views
            existing_transfer.bids = t.bids
            existing_transfer.owner = t.owner
            existing_transfer.source_url = t.url
            existing_transfer.skills_at_transfer = t.skills
            if contributor_id:
                existing_transfer.contributor_id = contributor_id
        else:
            transfer = Transfer(
                player_id=player.id,
                price=t.currentBid,
                deadline=t.deadline,
                tsi=t.tsi,
                salary=t.salary,
                views=t.views,
                bids=t.bids,
                owner=t.owner,
                source_url=t.url,
                skills_at_transfer=t.skills,
                contributor_id=contributor_id,
            )
            session.add(transfer)

        count += 1

    await session.commit()
    return count


async def get_recent_transfers(session: AsyncSession, limit: int = 500, skip: int = 0):
    result = await session.execute(
        select(Transfer)
        .options(joinedload(Transfer.player))
        .order_by(desc(Transfer.captured_at))
        .offset(skip)
        .limit(limit)
    )
    return result.unique().scalars().all()
