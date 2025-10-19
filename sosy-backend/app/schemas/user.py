from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr

# Local User Schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = None
    is_superuser: Optional[bool] = None

class UserInDB(UserBase):
    id: int
    is_active: bool
    is_superuser: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class User(UserInDB):
    pass

# WordPress User Schemas
class WordPressUserBase(BaseModel):
    user_login: str
    user_nicename: str
    user_email: str
    display_name: Optional[str] = None
    user_url: Optional[str] = None

class WordPressUser(WordPressUserBase):
    ID: int
    user_registered: Optional[datetime] = None
    user_status: int

    class Config:
        from_attributes = True

# Auth Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str