from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.base import get_wp_db
from app.crud.user import wp_user
from app.schemas.user import WordPressUser
from app.api.deps import get_current_active_user

router = APIRouter()

@router.get("/", response_model=List[WordPressUser])
def read_wp_users(
    db: Session = Depends(get_wp_db),
    skip: int = 0,
    limit: int = 100,
    search: str = Query(None, description="Search by username, email, or display name"),
    current_user = Depends(get_current_active_user)
):
    """
    Retrieve WordPress users
    """
    if search:
        users = wp_user.search(db, search_term=search, skip=skip, limit=limit)
    else:
        users = wp_user.get_multi(db, skip=skip, limit=limit)
    return users

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