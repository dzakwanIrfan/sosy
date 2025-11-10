from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Path, Query
from sqlalchemy.orm import Session
from app.db.base import get_local_db
from app.crud.daylight_personality import daylight_personality
from app.schemas.daylight_personality import (
    PersonalityTestSubmission, PersonalityTestResult, PersonalityTestList,
    MatchingSessionCreate, MatchingSessionResult, MatchingSessionSummary,
    MatchingParticipant, MatchingTableResult, MatchScoreDetail
)
from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.daylight_personality import (
    DaylightMatchingTable, DaylightMatchingScore
)

router = APIRouter()

# ==================== Personality Test Endpoints ====================

@router.post("/test", response_model=PersonalityTestResult)
def submit_personality_test(
    submission: PersonalityTestSubmission,
    db: Session = Depends(get_local_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Submit or update personality test (Daylight Assessment)
    
    User can take the test multiple times - latest result will be used for matching
    """
    test = daylight_personality.create_or_update_test(
        db, current_user.id, submission
    )
    
    # Add archetype description
    archetype_descriptions = {
        "Bright Morning": "You bring fresh energy wherever you go. The kind of person who starts the conversation — and the laughter.",
        "Calm Dawn": "You move at your own rhythm. People feel comfortable around you — grounded, kind, quietly confident.",
        "Bold Noon": "The go-getter of every table. You lead naturally, keep things on track, and turn ideas into plans.",
        "Golden Hour": "You light up rooms with your stories and laughter. Effortlessly social, you make everyone feel seen.",
        "Quiet Dusk": "You're the thinker who listens before you speak — insightful, calm, and full of perspective.",
        "Cloudy Day": "You see beauty in small moments. Often reserved, but when you open up, your words hit deep.",
        "Serene Drizzle": "You don't chase attention — you create peace. You're the steady soul who listens and understands.",
        "Blazing Noon": "You bring heat and direction. When others hesitate, you move — pure action and confidence.",
        "Starry Night": "You live in ideas and imagination. You connect through stories, purpose, and shared curiosity.",
        "Perfect Day": "You flow between energies with grace — social when needed, quiet when it counts. You're harmony itself."
    }
    
    result = PersonalityTestResult.from_orm(test)
    result.archetype_description = archetype_descriptions.get(test.archetype, "")
    
    return result

@router.get("/test/me", response_model=Optional[PersonalityTestResult])
def get_my_personality_test(
    db: Session = Depends(get_local_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get my latest personality test result"""
    test = daylight_personality.get_user_latest_test(db, current_user.id)
    
    if not test:
        return None
    
    archetype_descriptions = {
        "Bright Morning": "You bring fresh energy wherever you go. The kind of person who starts the conversation — and the laughter.",
        "Calm Dawn": "You move at your own rhythm. People feel comfortable around you — grounded, kind, quietly confident.",
        "Bold Noon": "The go-getter of every table. You lead naturally, keep things on track, and turn ideas into plans.",
        "Golden Hour": "You light up rooms with your stories and laughter. Effortlessly social, you make everyone feel seen.",
        "Quiet Dusk": "You're the thinker who listens before you speak — insightful, calm, and full of perspective.",
        "Cloudy Day": "You see beauty in small moments. Often reserved, but when you open up, your words hit deep.",
        "Serene Drizzle": "You don't chase attention — you create peace. You're the steady soul who listens and understands.",
        "Blazing Noon": "You bring heat and direction. When others hesitate, you move — pure action and confidence.",
        "Starry Night": "You live in ideas and imagination. You connect through stories, purpose, and shared curiosity.",
        "Perfect Day": "You flow between energies with grace — social when needed, quiet when it counts. You're harmony itself."
    }
    
    result = PersonalityTestResult.from_orm(test)
    result.archetype_description = archetype_descriptions.get(test.archetype, "")
    
    return result

@router.get("/test/user/{user_id}", response_model=Optional[PersonalityTestResult])
def get_user_personality_test(
    user_id: int = Path(..., description="User ID"),
    db: Session = Depends(get_local_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get specific user's latest personality test result"""
    test = daylight_personality.get_user_latest_test(db, user_id)
    
    if not test:
        raise HTTPException(status_code=404, detail="User has not taken the test yet")
    
    return PersonalityTestResult.from_orm(test)

@router.get("/tests", response_model=List[PersonalityTestList])
def get_all_personality_tests(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_local_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all personality tests (for simulation)"""
    tests = daylight_personality.get_all_tests(db, skip, limit)
    return [PersonalityTestList.from_orm(t) for t in tests]

# ==================== Matching Endpoints ====================

@router.post("/matching", response_model=MatchingSessionResult)
def create_matching_session(
    session_data: MatchingSessionCreate,
    db: Session = Depends(get_local_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new matching session and run SMART matching algorithm
    
    ✨ SMART Algorithm Features:
    - Automatically determines optimal group size (3-5 people)
    - Prioritizes match quality over fixed group size
    - Flexible threshold with adaptive matching
    - Ensures everyone gets matched when possible
    
    Rules:
    - ≥70% match → Excellent compatibility ✅
    - 60-69% → Good compatibility 👍
    - 50-59% → Fair compatibility 🤝
    - Minimum group: 3 people
    - Maximum group: 5 people (ideal)
    """
    
    # Validate participant count
    if len(session_data.participant_user_ids) < 3:
        raise HTTPException(
            status_code=400,
            detail="Need at least 3 participants for matching"
        )
    
    # Check all participants have taken the test
    for user_id in session_data.participant_user_ids:
        test = daylight_personality.get_user_latest_test(db, user_id)
        if not test:
            user = db.query(User).filter(User.id == user_id).first()
            raise HTTPException(
                status_code=400,
                detail=f"User {user.username if user else user_id} has not taken personality test"
            )
    
    # Create session with SMART algorithm
    session = daylight_personality.create_matching_session(
        db,
        session_data.session_name,
        current_user.id,
        session_data.participant_user_ids,
        session_data.min_match_threshold
    )
    
    # Build result
    return build_matching_session_result(db, session)

@router.get("/matching/{session_id}", response_model=MatchingSessionResult)
def get_matching_session_result(
    session_id: int = Path(..., description="Matching Session ID"),
    db: Session = Depends(get_local_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get matching session results"""
    session = daylight_personality.get_matching_session(db, session_id)
    
    if not session:
        raise HTTPException(status_code=404, detail="Matching session not found")
    
    return build_matching_session_result(db, session)

@router.get("/matching", response_model=List[MatchingSessionSummary])
def get_all_matching_sessions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_local_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all matching sessions (summary)"""
    sessions = daylight_personality.get_all_matching_sessions(db, skip, limit)
    
    results = []
    for session in sessions:
        creator = db.query(User).filter(User.id == session.created_by).first()
        results.append(MatchingSessionSummary(
            id=session.id,
            session_name=session.session_name,
            created_by=session.created_by,
            creator_name=creator.username if creator else "Unknown",
            status=session.status,
            total_participants=session.total_participants,
            total_tables=session.total_tables,
            average_match_score=session.average_match_score,
            created_at=session.created_at,
            completed_at=session.completed_at
        ))
    
    return results

# ==================== Helper Functions ====================

def build_matching_session_result(db: Session, session) -> MatchingSessionResult:
    """Build detailed matching session result"""
    
    # Get creator
    creator = db.query(User).filter(User.id == session.created_by).first()
    
    # Get all participants
    all_participants = []
    matched_user_ids = set()
    
    for participant in session.participants:
        user = db.query(User).filter(User.id == participant.user_id).first()
        test = participant.personality_test
        
        all_participants.append(MatchingParticipant(
            user_id=user.id,
            username=user.username,
            full_name=user.full_name,
            archetype=test.archetype,
            archetype_symbol=test.archetype_symbol,
            profile_score=test.profile_score
        ))
    
    # Get all tables with detailed information
    tables = db.query(DaylightMatchingTable).filter(
        DaylightMatchingTable.session_id == session.id
    ).order_by(DaylightMatchingTable.table_number).all()
    
    formatted_tables = []
    size_distribution = {}
    
    for table in tables:
        # Track size distribution
        size_distribution[table.table_size] = size_distribution.get(table.table_size, 0) + 1
        
        # Get members
        members = []
        for member_data in table.members_data:
            matched_user_ids.add(member_data['user_id'])
            members.append(MatchingParticipant(
                user_id=member_data['user_id'],
                username=member_data.get('username', ''),
                full_name=member_data.get('full_name', ''),
                archetype=member_data['archetype'],
                archetype_symbol=member_data['archetype_symbol'],
                profile_score=member_data['profile_score']
            ))
        
        # Get pairwise scores
        scores = db.query(DaylightMatchingScore).filter(
            DaylightMatchingScore.table_id == table.id
        ).all()
        
        pairwise_scores = []
        for score in scores:
            user1 = db.query(User).filter(User.id == score.user1_id).first()
            user2 = db.query(User).filter(User.id == score.user2_id).first()
            
            pairwise_scores.append(MatchScoreDetail(
                user1_id=score.user1_id,
                user1_name=user1.full_name or user1.username if user1 else f"User {score.user1_id}",
                user2_id=score.user2_id,
                user2_name=user2.full_name or user2.username if user2 else f"User {score.user2_id}",
                e_diff=score.e_diff,
                o_diff=score.o_diff,
                s_diff=score.s_diff,
                a_diff=score.a_diff,
                trait_similarity=score.trait_similarity,
                lifestyle_bonus=score.lifestyle_bonus,
                comfort_bonus=score.comfort_bonus,
                serendipity_bonus=score.serendipity_bonus,
                total_match_score=score.total_match_score,
                meets_threshold=score.meets_threshold
            ))
        
        formatted_tables.append(MatchingTableResult(
            table_number=table.table_number,
            table_size=table.table_size,
            average_match_score=table.average_match_score,
            members=members,
            pairwise_scores=pairwise_scores
        ))
    
    # Get unmatched participants
    all_participant_ids = {p.user_id for p in all_participants}
    unmatched_ids = all_participant_ids - matched_user_ids
    unmatched_participants = [p for p in all_participants if p.user_id in unmatched_ids]
    
    # Determine most used size
    optimal_size_used = max(size_distribution, key=size_distribution.get) if size_distribution else 5
    
    return MatchingSessionResult(
        id=session.id,
        session_name=session.session_name,
        created_by=session.created_by,
        creator_name=creator.username if creator else "Unknown",
        status=session.status,
        total_participants=session.total_participants,
        total_tables=session.total_tables,
        average_match_score=session.average_match_score,
        min_match_threshold=session.min_match_threshold,
        tables=formatted_tables,
        unmatched_participants=unmatched_participants,
        created_at=session.created_at,
        completed_at=session.completed_at,
        optimal_size_used=optimal_size_used,
        size_distribution=size_distribution
    )