from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from db.database import Base


class TrainingCycle(Base):
    __tablename__ = "training_cycles"

    id = Column(Integer, primary_key=True)
    cycle_number = Column(Integer)
    total_loss = Column(Float, default=0.0)
    policy_loss = Column(Float, default=0.0)
    value_loss = Column(Float, default=0.0)
    elo = Column(Integer, default=800)
    buffer_size = Column(Integer, default=0)
    games_in_cycle = Column(Integer, default=0)
    wins = Column(Integer, default=0)
    draws = Column(Integer, default=0)
    losses = Column(Integer, default=0)
    status = Column(String, default="idle")
    checkpoint_time = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)


class SelfPlayGame(Base):
    __tablename__ = "self_play_games"

    id = Column(Integer, primary_key=True)
    cycle_number = Column(Integer)
    game_number = Column(Integer)
    moves = Column(Integer)
    result = Column(String)  # "1-0", "0-1", "1/2-1/2"
    time_seconds = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)


class MoveHeatmapData(Base):
    __tablename__ = "move_heatmap"

    id = Column(Integer, primary_key=True)
    square_index = Column(Integer)  # 0-63
    visit_count = Column(Integer, default=0)
    # Accumulates across all games


class TrainingLogLine(Base):
    __tablename__ = "training_log_lines"

    id = Column(Integer, primary_key=True)
    cycle_number = Column(Integer, nullable=True)
    message = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)
