from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base


class Transfer(Base):
    __tablename__ = "transfers"

    id = Column(Integer, primary_key=True)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    price = Column(Float, nullable=True)
    deadline = Column(String, nullable=True)
    tsi = Column(Integer, nullable=True)
    salary = Column(Integer, nullable=True)
    views = Column(Integer, nullable=True)
    bids = Column(Integer, nullable=True)
    owner = Column(String, nullable=True)
    source_url = Column(String(500), nullable=True)
    captured_at = Column(DateTime, default=datetime.utcnow)
    skills_at_transfer = Column(JSON, nullable=True)
    contributor_id = Column(String(50), nullable=True, index=True)

    player = relationship("Player", back_populates="transfers")
