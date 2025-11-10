from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

# ==================== Personality Test Schemas ====================

class QuestionAnswer(BaseModel):
    question_number: int
    question_text: str
    answer: str
    answer_value: Any

class PersonalityTestSubmission(BaseModel):
    answers: Dict[str, Any] = Field(..., description="Q1-Q15 answers")

class PersonalityTestResult(BaseModel):
    id: int
    user_id: int
    test_date: datetime
    
    # Raw scores
    e_raw: float
    o_raw: float
    s_raw: float
    a_raw: float
    c_raw: float
    l_raw: int
    
    # Normalized scores
    e_normalized: float
    o_normalized: float
    s_normalized: float
    a_normalized: float
    c_normalized: float
    l_normalized: float
    
    # Profile
    profile_score: float
    archetype: str
    archetype_symbol: str
    archetype_description: Optional[str] = None
    
    # Context
    relationship_status: Optional[str]
    looking_for: Optional[str]
    gender_comfort: Optional[str]
    
    # Full answers
    answers: Dict[str, Any]
    
    created_at: datetime
    
    class Config:
        from_attributes = True

class PersonalityTestList(BaseModel):
    id: int
    user_id: int
    test_date: datetime
    archetype: str
    archetype_symbol: str
    profile_score: float
    created_at: datetime
    
    class Config:
        from_attributes = True

# ==================== Matching Schemas ====================

class MatchingSessionCreate(BaseModel):
    session_name: str
    participant_user_ids: List[int] = Field(..., description="List of user IDs to include in matching")
    min_match_threshold: float = Field(70.0, ge=0, le=100, description="Minimum match % (default: 70)")
    # REMOVED: target_group_size - sistem yang tentukan otomatis

class MatchingParticipant(BaseModel):
    user_id: int
    username: str
    full_name: Optional[str]
    archetype: str
    archetype_symbol: str
    profile_score: float
    
    class Config:
        from_attributes = True

class MatchScoreDetail(BaseModel):
    user1_id: int
    user1_name: str
    user2_id: int
    user2_name: str
    e_diff: float
    o_diff: float
    s_diff: float
    a_diff: float
    trait_similarity: float
    lifestyle_bonus: float
    comfort_bonus: float
    serendipity_bonus: float
    total_match_score: float
    meets_threshold: bool

class MatchingTableResult(BaseModel):
    table_number: int
    table_size: int
    average_match_score: float
    members: List[MatchingParticipant]
    pairwise_scores: List[MatchScoreDetail]

class MatchingSessionResult(BaseModel):
    id: int
    session_name: str
    created_by: int
    creator_name: str
    status: str
    total_participants: int
    total_tables: int
    average_match_score: Optional[float]
    min_match_threshold: float
    tables: List[MatchingTableResult]
    unmatched_participants: List[MatchingParticipant]
    created_at: datetime
    completed_at: Optional[datetime]
    # NEW: Algorithm insights
    optimal_size_used: int = Field(description="Size yang paling banyak digunakan (3/4/5)")
    size_distribution: Dict[int, int] = Field(description="Distribusi ukuran grup {3: 2, 5: 1}")
    
    class Config:
        from_attributes = True

class MatchingSessionSummary(BaseModel):
    id: int
    session_name: str
    created_by: int
    creator_name: str
    status: str
    total_participants: int
    total_tables: int
    average_match_score: Optional[float]
    created_at: datetime
    completed_at: Optional[datetime]
    
    class Config:
        from_attributes = True