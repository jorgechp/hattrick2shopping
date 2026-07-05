from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base


class Player(Base):
    __tablename__ = "players"

    id = Column(Integer, primary_key=True)
    hattrick_id = Column(Integer, unique=True, nullable=True)
    name = Column(String(255), nullable=False)
    age_years = Column(Integer, nullable=True)
    age_days = Column(Integer, nullable=True)
    category = Column(String(50), nullable=True)
    specialty = Column(String(50), nullable=True)
    skills = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    transfers = relationship("Transfer", back_populates="player")
