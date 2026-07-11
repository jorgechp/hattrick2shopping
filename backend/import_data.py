"""
Import data from a JSON or binary (.pickle.gz) export file.

Usage:
    python import_data.py <file> [--rewrite]

Modes:
    --append   (default) Add data without deleting existing records
    --rewrite  Truncate all tables before importing
"""

import argparse
import gzip
import json
import os
import pickle
import sys
from datetime import datetime

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://hattrick:hattrick@localhost:5432/hattrick2shopping",
)


def parse_args():
    parser = argparse.ArgumentParser(description="Import data into Hattrick2Shopping database")
    parser.add_argument("file", help="Path to JSON or .pickle.gz export file")
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--rewrite", action="store_true", help="Truncate tables before importing")
    mode.add_argument("--append", action="store_true", default=True, help="Add data without deleting (default)")
    return parser.parse_args()


def load_export(filepath: str) -> dict:
    if filepath.endswith(".pickle.gz"):
        with gzip.open(filepath, "rb") as f:
            return pickle.load(f)
    else:
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)


def import_data(session: Session, data: dict, rewrite: bool):
    from app.models.player import Player
    from app.models.transfer import Transfer

    if rewrite:
        print("Truncating existing data...")
        session.execute(text("TRUNCATE TABLE transfers RESTART IDENTITY CASCADE"))
        session.execute(text("TRUNCATE TABLE players RESTART IDENTITY CASCADE"))
        session.commit()
        print("Tables truncated.")

    players_data = data.get("players", [])
    total_players = len(players_data)
    total_transfers = sum(len(p.get("transfers", [])) for p in players_data)
    print(f"Importing {total_players} players and {total_transfers} transfers...")

    now = datetime.utcnow()
    imported_players = 0
    imported_transfers = 0
    skipped_players = 0
    skipped_transfers = 0

    for pdata in players_data:
        name = pdata.get("name", "")
        hattrick_id = pdata.get("hattrick_id")

        existing = None
        if hattrick_id is not None:
            existing = session.execute(
                text("SELECT id FROM players WHERE hattrick_id = :hid"),
                {"hid": hattrick_id},
            ).scalar()
        if not existing and name:
            existing = session.execute(
                text("SELECT id FROM players WHERE name = :name"),
                {"name": name},
            ).scalar()

        if existing:
            if rewrite:
                player = session.get(Player, existing)
                for key in ("hattrick_id", "age_years", "age_days", "category", "specialty", "skills"):
                    val = pdata.get(key)
                    if val is not None:
                        setattr(player, key, val)
                player.updated_at = now
                session.flush()
                imported_players += 1
            else:
                skipped_players += 1
                continue
        else:
            player = Player(
                hattrick_id=hattrick_id,
                name=name,
                age_years=pdata.get("age_years"),
                age_days=pdata.get("age_days"),
                category=pdata.get("category"),
                specialty=pdata.get("specialty"),
                skills=pdata.get("skills"),
                created_at=now,
                updated_at=now,
            )
            session.add(player)
            session.flush()
            imported_players += 1

        player_id = player.id

        for tdata in pdata.get("transfers", []):
            player_id_from_data = tdata.get("player_id")

            existing_t = session.execute(
                text(
                    "SELECT id FROM transfers WHERE player_id = :pid AND deadline = :deadline"
                ),
                {
                    "pid": player_id,
                    "deadline": tdata.get("deadline"),
                },
            ).scalar()

            if existing_t:
                if rewrite:
                    transfer = session.get(Transfer, existing_t)
                    for key in ("price", "tsi", "salary", "views", "bids", "owner",
                                "source_url", "skills_at_transfer", "contributor_id"):
                        val = tdata.get(key)
                        if val is not None:
                            setattr(transfer, key, val)
                    session.flush()
                    imported_transfers += 1
                else:
                    skipped_transfers += 1
                    continue
            else:
                transfer = Transfer(
                    player_id=player_id,
                    price=tdata.get("price"),
                    deadline=tdata.get("deadline"),
                    tsi=tdata.get("tsi"),
                    salary=tdata.get("salary"),
                    views=tdata.get("views"),
                    bids=tdata.get("bids"),
                    owner=tdata.get("owner"),
                    source_url=tdata.get("source_url"),
                    captured_at=now,
                    skills_at_transfer=tdata.get("skills_at_transfer"),
                    contributor_id=tdata.get("contributor_id"),
                )
                session.add(transfer)
                imported_transfers += 1

        if imported_players % 100 == 0:
            session.flush()

    session.commit()

    print(f"\nDone.")
    print(f"  Players:   {imported_players} imported, {skipped_players} skipped")
    print(f"  Transfers: {imported_transfers} imported, {skipped_transfers} skipped")


def main():
    args = parse_args()
    filepath = args.file

    if not os.path.isfile(filepath):
        print(f"Error: file not found: {filepath}", file=sys.stderr)
        sys.exit(1)

    print(f"Loading export from {filepath}...")
    data = load_export(filepath)
    print(f"Export date: {data.get('exported_at', 'unknown')}")
    print(f"Players in file: {len(data.get('players', []))}")

    url = os.environ.get(
        "DATABASE_URL",
        "postgresql://hattrick:hattrick@localhost:5432/hattrick2shopping",
    )
    if url.startswith("postgresql+asyncpg"):
        url = url.replace("postgresql+asyncpg", "postgresql", 1)
    elif url.startswith("postgres+asyncpg"):
        url = url.replace("postgres+asyncpg", "postgres", 1)
    elif url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)

    print(f"Connecting to database...")
    engine = create_engine(url)
    SessionLocal = sessionmaker(bind=engine)

    with SessionLocal() as session:
        import_data(session, data, rewrite=args.rewrite)

    print("Done.")


if __name__ == "__main__":
    main()
