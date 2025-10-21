from typing import Optional, List, Any
from datetime import datetime
from pydantic import BaseModel

# Question & Answer Schemas
class QuestionBase(BaseModel):
    id: int
    text: str
    description: Optional[str] = None
    
    class Config:
        from_attributes = True

class AnswerBase(BaseModel):
    id: int
    text: str
    points: Optional[int] = None
    feedback: Optional[str] = None
    
    class Config:
        from_attributes = True

# User Answer Schema
class UserAnswerDetail(BaseModel):
    question_id: int
    question_text: str
    question_description: Optional[str] = None
    answer_id: int
    answer_text: str
    answer_points: Optional[int] = None
    answer_feedback: Optional[str] = None
    custom_answer_text: Optional[str] = None  # From answer_text column if filled
    
    class Config:
        from_attributes = True

# Personality Test Result
class PersonalityTestResult(BaseModel):
    quiz_id: int
    date_started: Optional[datetime] = None
    date_finished: Optional[datetime] = None
    total_points: int
    answers: List[UserAnswerDetail]
    
    class Config:
        from_attributes = True

# Check if user has completed test
class PersonalityTestStatus(BaseModel):
    has_completed: bool
    latest_test_id: Optional[int] = None
    date_finished: Optional[datetime] = None
    total_answers: int
    
    class Config:
        from_attributes = True