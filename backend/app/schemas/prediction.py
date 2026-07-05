from pydantic import BaseModel
from typing import Optional


class PredictRequest(BaseModel):
    skills: dict
    age: Optional[int] = 20
    ageDays: Optional[int] = 0
    tsi: Optional[int] = 0
    specialty: Optional[str] = None
    category: Optional[str] = None
    trained_skill: Optional[str] = None
    skill_growth_per_year: Optional[float] = None


class PredictResponse(BaseModel):
    price: float
    ci_lower: float
    ci_upper: float
    trained: bool


class ProjectionPoint(BaseModel):
    age: float
    price: float
    ci_lower: float
    ci_upper: float


class ScenarioProjection(BaseModel):
    scenario: str
    label: str
    color: str
    points: list[ProjectionPoint]


class ProjectionResponse(BaseModel):
    projection: list[ProjectionPoint] = []
    scenarios: list[ScenarioProjection] = []
    trained: bool


class TrainResponse(BaseModel):
    samples: int
    features: list[str]
    rmse_log: float
    rmse_euro: float
