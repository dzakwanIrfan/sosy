from sqlalchemy import Column, Integer, String, DateTime, Text, BigInteger, Boolean
from sqlalchemy.dialects.postgresql import JSON
from app.db.base import Base

class TQBUser(Base):
    """Table Quiz Builder Users - tracking quiz completion"""
    __tablename__ = "wprq_tqb_users"
    
    id = Column(BigInteger, primary_key=True)
    random_identifier = Column(String(255))
    date_started = Column(DateTime)
    date_finished = Column(DateTime)
    social_badge_link = Column(Text)
    email = Column(String(320))
    points = Column(Integer)
    quiz_id = Column(BigInteger)
    completed_quiz = Column(Boolean, default=False)
    ignore_user = Column(Boolean, default=False)
    wp_user_id = Column(BigInteger)  # FK to wprq_users
    object_id = Column(BigInteger)
    
    __table_args__ = {'extend_existing': True}

class TQBUserAnswer(Base):
    """User's answers to personality test questions"""
    __tablename__ = "wprq_tqb_user_answers"
    
    id = Column(BigInteger, primary_key=True)
    user_id = Column(BigInteger)  # FK to wprq_tqb_users
    question_id = Column(BigInteger)  # FK to wprq_tge_questions
    answer_id = Column(BigInteger)  # FK to wprq_tge_answers
    quiz_id = Column(BigInteger)
    answer_text = Column(Text)
    
    __table_args__ = {'extend_existing': True}

class TGEAnswer(Base):
    """Available answers for quiz questions"""
    __tablename__ = "wprq_tge_answers"
    
    id = Column(BigInteger, primary_key=True)
    question_id = Column(BigInteger)  # FK to wprq_tge_questions
    next_question_id = Column(BigInteger)
    quiz_id = Column(BigInteger)
    order = Column(Integer)
    text = Column(Text)
    image = Column(String(500))
    points = Column(Integer)
    is_right = Column(Boolean, default=False)
    tags = Column(Text)
    result_id = Column(BigInteger)
    feedback = Column(Text)
    
    __table_args__ = {'extend_existing': True}

class TGEQuestion(Base):
    """Personality test questions"""
    __tablename__ = "wprq_tge_questions"
    
    id = Column(BigInteger, primary_key=True)
    quiz_id = Column(BigInteger)
    start = Column(Boolean, default=False)
    q_type = Column(Integer)
    text = Column(Text)
    views = Column(Integer)
    image = Column(String(500))
    description = Column(Text)
    settings = Column(JSON)
    display_settings = Column(JSON)
    next_question_id = Column(BigInteger)
    previous_question_id = Column(BigInteger)
    position = Column(JSON)
    
    __table_args__ = {'extend_existing': True}