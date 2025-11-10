from sqlalchemy import Column, Integer, String, DateTime, Float, JSON, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class DaylightPersonalityTest(Base):
    """Daylight Personality Test Results"""
    __tablename__ = "daylight_personality_tests"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    test_date = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Raw trait scores (-10 to +10)
    e_raw = Column(Float, nullable=False, comment='Energy: Extrovert(+) to Introvert(-)')
    o_raw = Column(Float, nullable=False, comment='Openness: Abstract(+) to Practical(-)')
    s_raw = Column(Float, nullable=False, comment='Structure: Flexible(+) to Structured(-)')
    a_raw = Column(Float, nullable=False, comment='Affect: Feeling(+) to Thinking(-)')
    c_raw = Column(Float, nullable=False, comment='Comfort with strangers')
    l_raw = Column(Integer, nullable=False, comment='Lifestyle tier: 1,2,3')
    
    # Normalized scores (0-100)
    e_normalized = Column(Float, nullable=False)
    o_normalized = Column(Float, nullable=False)
    s_normalized = Column(Float, nullable=False)
    a_normalized = Column(Float, nullable=False)
    c_normalized = Column(Float, nullable=False)
    l_normalized = Column(Float, nullable=False)
    
    # Profile score and archetype
    profile_score = Column(Float, nullable=False, comment='Weighted score 0-100')
    archetype = Column(String(50), nullable=False, index=True, comment='Day archetype')
    archetype_symbol = Column(String(10), nullable=False)
    
    # Context data
    relationship_status = Column(String(50), nullable=True)
    looking_for = Column(String(100), nullable=True)
    gender_comfort = Column(String(50), nullable=True)
    
    # All answers as JSON
    answers = Column(JSON, nullable=False, comment='All Q&A responses')
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationship
    user = relationship("User", backref="daylight_tests")


class DaylightMatchingSession(Base):
    """Daylight Matching Session"""
    __tablename__ = "daylight_matching_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    session_name = Column(String(255), nullable=False)
    created_by = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    
    # REMOVED: target_group_size - sistem yang tentukan
    min_group_size = Column(Integer, nullable=False, server_default='3', comment='Minimum: 3 people')
    max_group_size = Column(Integer, nullable=False, server_default='5', comment='Maximum: 5 people')
    
    # Matching parameters
    min_match_threshold = Column(Float, nullable=False, server_default='70.0', comment='Minimum 70% match')
    
    # Status
    status = Column(String(20), nullable=False, server_default='pending', index=True)
    total_participants = Column(Integer, nullable=False, server_default='0')
    total_tables = Column(Integer, nullable=False, server_default='0')
    average_match_score = Column(Float, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    creator = relationship("User", backref="created_matching_sessions")
    participants = relationship("DaylightMatchingParticipant", back_populates="session", cascade="all, delete-orphan")
    tables = relationship("DaylightMatchingTable", back_populates="session", cascade="all, delete-orphan")


class DaylightMatchingParticipant(Base):
    """Participants in a matching session"""
    __tablename__ = "daylight_matching_participants"
    __table_args__ = (
        UniqueConstraint('session_id', 'user_id', name='uq_session_user'),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey('daylight_matching_sessions.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    personality_test_id = Column(Integer, ForeignKey('daylight_personality_tests.id', ondelete='CASCADE'), nullable=False)
    added_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    session = relationship("DaylightMatchingSession", back_populates="participants")
    user = relationship("User")
    personality_test = relationship("DaylightPersonalityTest")


class DaylightMatchingTable(Base):
    """Matched tables/groups"""
    __tablename__ = "daylight_matching_tables"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey('daylight_matching_sessions.id', ondelete='CASCADE'), nullable=False, index=True)
    table_number = Column(Integer, nullable=False)
    table_size = Column(Integer, nullable=False)
    average_match_score = Column(Float, nullable=False)
    members_data = Column(JSON, nullable=False, comment='Array of user data with personality info')
    match_matrix = Column(JSON, nullable=True, comment='Pairwise match scores')
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    session = relationship("DaylightMatchingSession", back_populates="tables")
    match_scores = relationship("DaylightMatchingScore", back_populates="table", cascade="all, delete-orphan")


class DaylightMatchingScore(Base):
    """Pairwise match scores"""
    __tablename__ = "daylight_matching_scores"
    
    id = Column(Integer, primary_key=True, index=True)
    table_id = Column(Integer, ForeignKey('daylight_matching_tables.id', ondelete='CASCADE'), nullable=False, index=True)
    user1_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    user2_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    
    # Trait differences
    e_diff = Column(Float, nullable=False)
    o_diff = Column(Float, nullable=False)
    s_diff = Column(Float, nullable=False)
    a_diff = Column(Float, nullable=False)
    
    # Score components
    trait_similarity = Column(Float, nullable=False, comment='Cosine similarity')
    lifestyle_bonus = Column(Float, nullable=False, comment='L_bonus')
    comfort_bonus = Column(Float, nullable=False, comment='C_bonus')
    serendipity_bonus = Column(Float, nullable=False, server_default='0.0', comment='±5')
    
    # Final score
    total_match_score = Column(Float, nullable=False, comment='0-100')
    meets_threshold = Column(Boolean, nullable=False, comment='>= 70%')
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    table = relationship("DaylightMatchingTable", back_populates="match_scores")
    user1 = relationship("User", foreign_keys=[user1_id])
    user2 = relationship("User", foreign_keys=[user2_id])