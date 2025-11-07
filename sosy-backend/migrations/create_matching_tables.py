from app.db.base import Base, local_engine
from app.models.matching import (
    UserProfile, MatchingSession, MatchingGroup,
    UserMatchScore, EnergyFeedback
)

def create_tables():
    """Create all matching-related tables"""
    print("Creating matching tables...")
    Base.metadata.create_all(bind=local_engine, tables=[
        UserProfile.__table__,
        MatchingSession.__table__,
        MatchingGroup.__table__,
        UserMatchScore.__table__,
        EnergyFeedback.__table__
    ])
    print("Matching tables created successfully!")

if __name__ == "__main__":
    create_tables()