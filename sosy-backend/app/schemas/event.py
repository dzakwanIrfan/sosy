from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, EmailStr

# Event Schemas
class EventBase(BaseModel):
    post_title: str
    post_content: Optional[str] = None
    post_excerpt: Optional[str] = None
    post_date: Optional[datetime] = None

class Event(EventBase):
    ID: int
    post_status: str
    post_type: str
    post_modified: Optional[datetime] = None

    class Config:
        from_attributes = True

class EventListResponse(BaseModel):
    data: List[Event]
    total: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_prev: bool

# Event Buyer Schemas
class EventBuyerBase(BaseModel):
    user_id: int
    user_login: str
    user_email: str
    display_name: Optional[str] = None

class EventBuyer(EventBuyerBase):
    order_id: int
    order_status: str
    total_amount: Optional[float] = None
    payment_method_title: Optional[str] = None
    date_created: Optional[datetime] = None
    has_personality_test: bool = False  

    class Config:
        from_attributes = True

class EventDetailResponse(BaseModel):
    event: Event
    buyers: List[EventBuyer]
    total_buyers: int