from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.base import get_wp_db
from app.crud.event import event
from app.schemas.event import EventListResponse, Event, EventDetailResponse, EventBuyer
from app.api.deps import get_current_active_user

router = APIRouter()

@router.get("/", response_model=EventListResponse)
def read_events(
    db: Session = Depends(get_wp_db),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search by title, content, or excerpt"),
    sort_by: Optional[str] = Query("post_date", description="Sort by field"),
    sort_order: Optional[str] = Query("desc", regex="^(asc|desc)$", description="Sort order"),
    post_status: Optional[str] = Query(None, description="Filter by post status"),
    current_user = Depends(get_current_active_user)
):
    """
    Retrieve events (products) with pagination and search
    """
    # Calculate skip
    skip = (page - 1) * page_size
    
    # Validate sort_by field
    valid_sort_fields = ["ID", "post_title", "post_date", "post_modified", "post_status"]
    if sort_by not in valid_sort_fields:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid sort field. Must be one of: {', '.join(valid_sort_fields)}"
        )
    
    events, total_count = event.get_events(
        db=db,
        skip=skip,
        limit=page_size,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
        post_status=post_status
    )
    
    # Calculate pagination info
    total_pages = (total_count + page_size - 1) // page_size
    has_next = page < total_pages
    has_prev = page > 1
    
    return EventListResponse(
        data=events,
        total=total_count,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        has_next=has_next,
        has_prev=has_prev
    )

@router.get("/{event_id}", response_model=EventDetailResponse)
def read_event_detail(
    event_id: int,
    db: Session = Depends(get_wp_db),
    current_user = Depends(get_current_active_user)
):
    """
    Get event detail with list of buyers who have purchased the event
    """
    # Get event
    db_event = event.get_event_by_id(db, event_id=event_id)
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Get buyers
    buyers_data = event.get_event_buyers(db, event_id=event_id)
    
    # Convert to EventBuyer schema
    buyers = [EventBuyer(**buyer) for buyer in buyers_data]
    
    return EventDetailResponse(
        event=db_event,
        buyers=buyers,
        total_buyers=len(buyers)
    )