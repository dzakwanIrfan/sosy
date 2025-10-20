from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.base import get_local_db
from app.crud.user import user
from app.schemas.user import User, UserCreate, UserUpdate, UserListResponse
from app.api.deps import get_current_active_user, get_current_superuser

router = APIRouter()

@router.get("/", response_model=UserListResponse)
def read_users(
    db: Session = Depends(get_local_db),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search by username, email, or full name"),
    sort_by: Optional[str] = Query("created_at", description="Sort by field"),
    sort_order: Optional[str] = Query("desc", regex="^(asc|desc)$", description="Sort order"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    is_superuser: Optional[bool] = Query(None, description="Filter by superuser status"),
    current_user: User = Depends(get_current_superuser)
):
    """
    Retrieve users with pagination, search, sorting, and filtering (Admin only)
    """
    # Calculate skip
    skip = (page - 1) * page_size
    
    # Validate sort_by field
    valid_sort_fields = ["id", "username", "email", "full_name", "is_active", "is_superuser", "created_at", "updated_at"]
    if sort_by not in valid_sort_fields:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid sort field. Must be one of: {', '.join(valid_sort_fields)}"
        )
    
    users, total_count = user.get_multi(
        db=db,
        skip=skip,
        limit=page_size,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
        is_active=is_active,
        is_superuser=is_superuser
    )
    
    # Calculate pagination info
    total_pages = (total_count + page_size - 1) // page_size
    has_next = page < total_pages
    has_prev = page > 1
    
    return UserListResponse(
        data=users,
        total=total_count,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        has_next=has_next,
        has_prev=has_prev
    )

@router.post("/", response_model=User)
def create_user(
    *,
    db: Session = Depends(get_local_db),
    user_in: UserCreate,
    current_user: User = Depends(get_current_superuser)
):
    """
    Create new user (Admin only)
    """
    # Check if user already exists
    if user.get_by_username(db, username=user_in.username):
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system."
        )
    if user.get_by_email(db, email=user_in.email):
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system."
        )
    
    created_user = user.create(db, obj_in=user_in)
    return created_user

@router.put("/{user_id}", response_model=User)
def update_user(
    *,
    db: Session = Depends(get_local_db),
    user_id: int,
    user_in: UserUpdate,
    current_user: User = Depends(get_current_superuser)
):
    """
    Update a user (Admin only)
    """
    db_user = user.get(db, id=user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    updated_user = user.update(db, db_obj=db_user, obj_in=user_in)
    return updated_user

@router.get("/{user_id}", response_model=User)
def read_user_by_id(
    user_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_local_db)
):
    """
    Get a specific user by ID
    """
    db_user = user.get(db, id=user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Users can only see their own profile unless they're superuser
    if db_user.id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    
    return db_user

@router.delete("/{user_id}")
def delete_user(
    *,
    db: Session = Depends(get_local_db),
    user_id: int,
    current_user: User = Depends(get_current_superuser)
):
    """
    Delete a user (Admin only)
    """
    db_user = user.get(db, id=user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.delete(db, id=user_id)
    return {"message": "User deleted successfully"}

@router.get("/me/", response_model=User)
def read_user_me(current_user: User = Depends(get_current_active_user)):
    """
    Get current user profile
    """
    return current_user

@router.put("/me/", response_model=User)
def update_user_me(
    *,
    db: Session = Depends(get_local_db),
    user_in: UserUpdate,
    current_user: User = Depends(get_current_active_user)
):
    """
    Update own user profile
    """
    updated_user = user.update(db, db_obj=current_user, obj_in=user_in)
    return updated_user