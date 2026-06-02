from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from backend.db.database import Base

class GameHistory(Base):
    __tablename__ = "games"

    id = Column(Integer, primary_key=True, index=True)
    pgn = Column(String)
    result = Column(String) # '1-0', '0-1', '1/2-1/2'
    created_at = Column(DateTime, default=datetime.utcnow)

class AIStats(Base):
    __tablename__ = "ai_stats"
    
    id = Column(Integer, primary_key=True, index=True)
    elo = Column(Integer, default=1200)
    games_played = Column(Integer, default=0)
    win_rate = Column(Float, default=0.0)
    checkpoint_version = Column(Integer, default=1)
