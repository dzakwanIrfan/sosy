from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, Float, JSON, BigInteger, ForeignKey
from sqlalchemy.sql import func
from app.db.base import Base

class UserProfile(Base):
    """Extended user profile for SOSY matching"""
    __tablename__ = "user_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    wp_user_id = Column(BigInteger, unique=True, index=True, nullable=False)
    
    # Social Energy (from personality test or manual input)
    social_energy = Column(String(20))  # introvert, ambivert, extrovert
    
    # Conversation Style
    conversation_style = Column(String(20))  # deep, casual
    
    # Social Goal
    social_goal = Column(String(50))  # relationship, friendship, networking
    
    # Group Size Preference
    group_size_preference = Column(Integer)  # 4 or 6
    
    # Gender Preference
    gender = Column(String(20))  # male, female, other
    gender_preference = Column(String(20))  # same, mixed, open
    
    # Interests (JSON array)
    activity_types = Column(JSON)  # ["coffee_talk", "hiking", "gaming"]
    discussion_topics = Column(JSON)  # ["wellness", "travel", "tech"]
    
    # Life Context
    life_stage = Column(String(50))  # student, professional, parent, retired
    
    # Cultural Background
    cultural_background = Column(String(100))
    
    # Financial Comfort
    price_tier = Column(String(20))  # on_budget, medium, exclusive
    
    # Reliability Score (0-100)
    reliability_score = Column(Float, default=100.0)
    attendance_rate = Column(Float, default=100.0)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class MatchingSession(Base):
    """Matching session for an event"""
    __tablename__ = "matching_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(BigInteger, nullable=False, index=True)
    event_name = Column(String(255))
    
    # Session info
    session_date = Column(DateTime(timezone=True))
    status = Column(String(20), default='pending')  # pending, completed, cancelled
    
    # Matching parameters
    target_group_size = Column(Integer)  # 4 or 6
    conversation_style = Column(String(20))  # deep or casual
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class MatchingGroup(Base):
    """Matched groups from matching algorithm"""
    __tablename__ = "matching_groups"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey('matching_sessions.id'), nullable=False)
    
    group_number = Column(Integer)
    group_size = Column(Integer)
    
    # Matching quality
    average_match_score = Column(Float)
    
    # Group composition
    members_data = Column(JSON)  # Array of user IDs and their roles
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class UserMatchScore(Base):
    """Individual match scores between users"""
    __tablename__ = "user_match_scores"
    
    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey('matching_groups.id'), nullable=False)
    
    user1_id = Column(BigInteger, nullable=False)
    user2_id = Column(BigInteger, nullable=False)
    
    # Individual criteria scores
    social_energy_score = Column(Float, default=0.0)
    conversation_style_score = Column(Float, default=0.0)
    social_goal_score = Column(Float, default=0.0)
    group_size_score = Column(Float, default=0.0)
    gender_comfort_score = Column(Float, default=0.0)
    interest_score = Column(Float, default=0.0)
    life_context_score = Column(Float, default=0.0)
    cultural_score = Column(Float, default=0.0)
    financial_score = Column(Float, default=0.0)
    reliability_score = Column(Float, default=0.0)
    
    # Overall match score (0-100)
    total_match_score = Column(Float)
    matching_criteria_count = Column(Integer)  # How many criteria matched
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class EnergyFeedback(Base):
    """Post-meeting energy feedback"""
    __tablename__ = "energy_feedbacks"
    
    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey('matching_groups.id'), nullable=False)
    
    user_id = Column(BigInteger, nullable=False)
    rated_user_id = Column(BigInteger, nullable=False)
    
    # Energy impact: energized, neutral, drained
    energy_impact = Column(String(20))
    rating = Column(Integer)  # 1-5 stars
    
    feedback_text = Column(Text)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())