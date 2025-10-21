from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.orm import Session
from app.db.base import get_wp_db
from app.crud.personality_test import personality_test
from app.schemas.personality_test import PersonalityTestResult, PersonalityTestStatus
from app.api.deps import get_current_active_user

router = APIRouter()

@router.get("/status/{wp_user_id}", response_model=PersonalityTestStatus)
def check_personality_test_status(
    wp_user_id: int = Path(..., description="WordPress User ID"),
    db: Session = Depends(get_wp_db),
    current_user = Depends(get_current_active_user)
):
    """
    Check if a WordPress user has completed personality test
    """
    status = personality_test.check_user_has_test(db, wp_user_id=wp_user_id)
    
    if not status:
        return PersonalityTestStatus(
            has_completed=False,
            latest_test_id=None,
            date_finished=None,
            total_answers=0
        )
    
    return PersonalityTestStatus(**status)

@router.get("/{wp_user_id}", response_model=PersonalityTestResult)
def get_personality_test_result(
    wp_user_id: int = Path(..., description="WordPress User ID"),
    db: Session = Depends(get_wp_db),
    current_user = Depends(get_current_active_user)
):
    """
    Get complete personality test result for a WordPress user
    Returns the latest completed test
    """
    result = personality_test.get_user_personality_test(db, wp_user_id=wp_user_id)
    
    if not result:
        raise HTTPException(
            status_code=404, 
            detail="Personality test not found or not completed for this user"
        )
    
    return PersonalityTestResult(**result)

@router.get("/by-tqb-id/{tqb_user_id}", response_model=PersonalityTestResult)
def get_personality_test_by_tqb_id(
    tqb_user_id: int = Path(..., description="TQB User ID"),
    db: Session = Depends(get_wp_db),
    current_user = Depends(get_current_active_user)
):
    """
    Get personality test result by TQB User ID
    """
    result = personality_test.get_test_by_tqb_user_id(db, tqb_user_id=tqb_user_id)
    
    if not result:
        raise HTTPException(
            status_code=404, 
            detail="Personality test not found or not completed"
        )
    
    return PersonalityTestResult(**result)