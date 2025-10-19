from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.db.base import get_local_db
from app.crud.user import user
from app.core.security import create_access_token
from app.core.config import settings
from app.schemas.user import Token
from app.api.deps import get_current_active_user

router = APIRouter()

@router.post("/login", response_model=Token)
def login_for_access_token(
    db: Session = Depends(get_local_db),
    form_data: OAuth2PasswordRequestForm = Depends()
):
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    authenticated_user = user.authenticate(
        db, username=form_data.username, password=form_data.password
    )
    if not authenticated_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    elif not authenticated_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": create_access_token(
            data={"sub": authenticated_user.username}, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }

@router.post("/test-token")
def test_token(current_user = Depends(get_current_active_user)):
    """
    Test access token
    """
    return current_user