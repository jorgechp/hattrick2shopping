from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import Optional

MAX_SKILL = 20
MIN_SKILL = 0
MAX_AGE = 50
MIN_AGE = 15
MAX_TSI = 500_000
MIN_PRICE = 500
MAX_TRANSFERS_PER_BATCH = 25

VALID_SPECIALTIES = {"", "head", "powerful", "resilient", "unpredictable", "quick", "technical"}
VALID_CATEGORIES = {"", "goalkeeper", "defender", "winger", "midfielder", "forward"}


class TransferIn(BaseModel):
    playerId: Optional[str] = None
    name: str
    href: Optional[str] = None
    ageYears: Optional[int] = None
    ageDays: Optional[int] = None
    tsi: Optional[int] = None
    salary: Optional[int] = None
    category: Optional[str] = None
    specialty: Optional[str] = None
    currentBid: Optional[float] = None
    deadline: Optional[str] = None
    views: Optional[int] = None
    bids: Optional[int] = None
    skills: Optional[dict] = None
    owner: Optional[str] = None
    url: Optional[str] = None
    captured_at: Optional[str] = None

    @field_validator("ageYears")
    @classmethod
    def age_in_range(cls, v):
        if v is not None and (v < MIN_AGE or v > MAX_AGE):
            raise ValueError(f"ageYears must be between {MIN_AGE} and {MAX_AGE}")
        return v

    @field_validator("ageDays")
    @classmethod
    def age_days_in_range(cls, v):
        if v is not None and (v < 0 or v > 111):
            raise ValueError("ageDays must be between 0 and 111")
        return v

    @field_validator("tsi")
    @classmethod
    def tsi_in_range(cls, v):
        if v is not None and (v < 0 or v > MAX_TSI):
            raise ValueError(f"tsi must be between 0 and {MAX_TSI}")
        return v

    @field_validator("currentBid")
    @classmethod
    def price_in_range(cls, v):
        if v is not None and v < 0:
            raise ValueError("currentBid cannot be negative")
        return v

    @field_validator("specialty")
    @classmethod
    def specialty_valid(cls, v):
        return v

    @field_validator("category")
    @classmethod
    def category_valid(cls, v):
        return v

    @field_validator("skills")
    @classmethod
    def skills_in_range(cls, v):
        if v:
            for key, val in v.items():
                if not isinstance(val, (int, float)) or val < MIN_SKILL or val > MAX_SKILL:
                    raise ValueError(f"skill {key} must be between {MIN_SKILL} and {MAX_SKILL}")
        return v


class BatchTransferIn(BaseModel):
    transfers: list[TransferIn]
    nonce: Optional[str] = None
    counter: Optional[int] = None
    session_id: Optional[str] = None
    contributor_id: Optional[str] = None

    @field_validator("transfers")
    @classmethod
    def batch_size_limit(cls, v):
        if len(v) > MAX_TRANSFERS_PER_BATCH:
            raise ValueError(f"batch size exceeds maximum of {MAX_TRANSFERS_PER_BATCH}")
        return v


class TransferOut(BaseModel):
    id: int
    player_id: int
    player_name: Optional[str] = None
    price: Optional[float] = None
    player_skills: Optional[dict] = None
    player_age_years: Optional[int] = None
    player_age_days: Optional[int] = None
    tsi: Optional[int] = None
    salary: Optional[int] = None
    category: Optional[str] = None
    specialty: Optional[str] = None
    deadline: Optional[str] = None
    views: Optional[int] = None
    bids: Optional[int] = None
    owner: Optional[str] = None
    source_url: Optional[str] = None
    captured_at: datetime

    model_config = {"from_attributes": True}
