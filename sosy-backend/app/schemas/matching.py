from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

# User Profile Schemas
class UserProfileBase(BaseModel):
    wp_user_id: int
    social_energy: Optional[str] = None
    conversation_style: Optional[str] = None
    social_goal: Optional[str] = None
    group_size_preference: Optional[int] = None
    gender: Optional[str] = None
    gender_preference: Optional[str] = None
    activity_types: Optional[List[str]] = None
    discussion_topics: Optional[List[str]] = None
    life_stage: Optional[str] = None
    cultural_background: Optional[str] = None
    price_tier: Optional[str] = None

class UserProfileCreate(UserProfileBase):
    pass

class UserProfileUpdate(BaseModel):
    social_energy: Optional[str] = None
    conversation_style: Optional[str] = None
    social_goal: Optional[str] = None
    group_size_preference: Optional[int] = None
    gender: Optional[str] = None
    gender_preference: Optional[str] = None
    activity_types: Optional[List[str]] = None
    discussion_topics: Optional[List[str]] = None
    life_stage: Optional[str] = None
    cultural_background: Optional[str] = None
    price_tier: Optional[str] = None
    reliability_score: Optional[float] = None
    attendance_rate: Optional[float] = None

class UserProfile(UserProfileBase):
    id: int
    reliability_score: float
    attendance_rate: float
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Matching Session Schemas
class MatchingSessionCreate(BaseModel):
    event_id: int
    target_group_size: int = Field(..., description="4 for deep, 6 for casual")
    conversation_style: str = Field(..., description="deep or casual")

class MatchingSession(BaseModel):
    id: int
    event_id: int
    event_name: Optional[str]
    session_date: Optional[datetime]
    status: str
    target_group_size: int
    conversation_style: str
    created_at: datetime

    class Config:
        from_attributes = True

# Matching Group Schemas
class GroupMember(BaseModel):
    user_id: int
    username: str
    email: str
    display_name: Optional[str]
    social_energy: Optional[str]
    match_score: Optional[float]
    has_personality_test: bool

class MatchingGroup(BaseModel):
    id: int
    session_id: int
    group_number: int
    group_size: int
    average_match_score: float
    members: List[GroupMember]
    created_at: datetime

    class Config:
        from_attributes = True

# Match Score Detail
class MatchScoreDetail(BaseModel):
    user1_id: int
    user1_name: str
    user2_id: int
    user2_name: str
    social_energy_score: float
    conversation_style_score: float
    social_goal_score: float
    group_size_score: float
    gender_comfort_score: float
    interest_score: float
    life_context_score: float
    cultural_score: float
    financial_score: float
    reliability_score: float
    total_match_score: float
    matching_criteria_count: int

# Matching Result
class MatchingResult(BaseModel):
    session: MatchingSession
    groups: List[MatchingGroup]
    total_users: int
    matched_users: int
    unmatched_users: int
    average_group_score: float

# Energy Feedback
class EnergyFeedbackCreate(BaseModel):
    group_id: int
    user_id: int
    rated_user_id: int
    energy_impact: str = Field(..., description="energized, neutral, or drained")
    rating: int = Field(..., ge=1, le=5)
    feedback_text: Optional[str] = None

class EnergyFeedback(BaseModel):
    id: int
    group_id: int
    user_id: int
    rated_user_id: int
    energy_impact: str
    rating: int
    feedback_text: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True