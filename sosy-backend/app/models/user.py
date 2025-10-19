from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text
from sqlalchemy.sql import func
from app.db.base import Base

class User(Base):
    """Local User Model untuk authentication"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class WordPressUser(Base):
    """WordPress User Model (Read Only)"""
    __tablename__ = "wprq_users"
    
    ID = Column(Integer, primary_key=True)
    user_login = Column(String(60), nullable=False)
    user_pass = Column(String(255), nullable=False)
    user_nicename = Column(String(50), nullable=False)
    user_email = Column(String(100), nullable=False)
    user_url = Column(String(100))
    user_registered = Column(DateTime)
    user_activation_key = Column(String(255))
    user_status = Column(Integer, default=0)
    display_name = Column(String(250))
    
    # Karena ini read-only, kita set metadata untuk tidak melakukan create table
    __table_args__ = {'extend_existing': True}