from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.base import get_wp_db
from app.crud.user import wp_user
from app.schemas.user import WordPressUser, WordPressUserListResponse
from app.api.deps import get_current_active_user

router = APIRouter()

@router.get("/", response_model=WordPressUserListResponse)
def read_wp_users(
    db: Session = Depends(get_wp_db),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search by username, email, or display name"),
    sort_by: Optional[str] = Query("user_registered", description="Sort by field"),
    sort_order: Optional[str] = Query("desc", regex="^(asc|desc)$", description="Sort order"),
    current_user = Depends(get_current_active_user)
):
    """
    Retrieve WordPress users with pagination, search, and sorting
    """
    # Calculate skip
    skip = (page - 1) * page_size
    
    # Validate sort_by field
    valid_sort_fields = ["ID", "user_login", "user_email", "display_name", "user_registered", "user_status"]
    if sort_by not in valid_sort_fields:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid sort field. Must be one of: {', '.join(valid_sort_fields)}"
        )
    
    users, total_count = wp_user.get_multi(
        db=db,
        skip=skip,
        limit=page_size,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order
    )
    
    # Calculate pagination info
    total_pages = (total_count + page_size - 1) // page_size
    has_next = page < total_pages
    has_prev = page > 1
    
    return WordPressUserListResponse(
        data=users,
        total=total_count,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        has_next=has_next,
        has_prev=has_prev
    )

@router.get("/{user_id}", response_model=WordPressUser)
def read_wp_user(
    user_id: int,
    db: Session = Depends(get_wp_db),
    current_user = Depends(get_current_active_user)
):
    """
    Get a specific WordPress user by ID
    """
    db_user = wp_user.get(db, id=user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="WordPress user not found")
    return db_user

@router.get("/login/{user_login}", response_model=WordPressUser)
def read_wp_user_by_login(
    user_login: str,
    db: Session = Depends(get_wp_db),
    current_user = Depends(get_current_active_user)
):
    """
    Get a WordPress user by login username
    """
    db_user = wp_user.get_by_login(db, user_login=user_login)
    if not db_user:
        raise HTTPException(status_code=404, detail="WordPress user not found")
    return db_user