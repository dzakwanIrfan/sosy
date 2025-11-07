from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Path, Body
from sqlalchemy.orm import Session
from app.db.base import get_local_db, get_wp_db
from app.crud.matching import matching
from app.crud.event import event
from app.crud.personality_test import personality_test
from app.schemas.matching import (
    UserProfile, UserProfileCreate, UserProfileUpdate,
    MatchingSession, MatchingSessionCreate,
    MatchingGroup, MatchingResult, GroupMember,
    EnergyFeedbackCreate, EnergyFeedback,
    MatchScoreDetail
)
from app.api.deps import get_current_active_user

router = APIRouter()

# ==================== User Profile Endpoints ====================

@router.post("/profiles", response_model=UserProfile)
def create_user_profile(
    profile_in: UserProfileCreate,
    db: Session = Depends(get_local_db),
    current_user = Depends(get_current_active_user)
):
    """
    Create a new user profile for matching
    """
    # Check if profile already exists
    existing = matching.get_user_profile(db, profile_in.wp_user_id)
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Profile already exists for this user"
        )
    
    profile = matching.create_user_profile(db, profile_in)
    return profile

@router.get("/profiles/{wp_user_id}", response_model=UserProfile)
def get_user_profile(
    wp_user_id: int = Path(..., description="WordPress User ID"),
    db: Session = Depends(get_local_db),
    current_user = Depends(get_current_active_user)
):
    """
    Get user profile by WordPress user ID
    """
    profile = matching.get_user_profile(db, wp_user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found")
    return profile

@router.put("/profiles/{wp_user_id}", response_model=UserProfile)
def update_user_profile(
    wp_user_id: int = Path(..., description="WordPress User ID"),
    profile_in: UserProfileUpdate = Body(...),
    db: Session = Depends(get_local_db),
    current_user = Depends(get_current_active_user)
):
    """
    Update user profile
    """
    profile = matching.update_user_profile(db, wp_user_id, profile_in)
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found")
    return profile

# ==================== Matching Endpoints ====================

@router.post("/events/{event_id}/match", response_model=MatchingResult)
def create_matching_for_event(
    event_id: int = Path(..., description="Event ID"),
    target_group_size: int = Query(4, description="4 for deep, 6 for casual"),
    conversation_style: str = Query("deep", regex="^(deep|casual)$"),
    wp_db: Session = Depends(get_wp_db),
    local_db: Session = Depends(get_local_db),
    current_user = Depends(get_current_active_user)
):
    """
    Create matching groups for an event based on buyers
    
    This will:
    1. Get all buyers for the event
    2. Gather their personality test data (if available)
    3. Get/create their matching profiles
    4. Run the matching algorithm
    5. Return matched groups
    """
    # Validate conversation style and group size alignment
    if conversation_style == "deep" and target_group_size != 4:
        raise HTTPException(
            status_code=400,
            detail="Deep conversation style requires 4-person groups"
        )
    elif conversation_style == "casual" and target_group_size != 6:
        raise HTTPException(
            status_code=400,
            detail="Casual conversation style requires 6-person groups"
        )
    
    # Get event buyers
    buyers = event.get_event_buyers(wp_db, event_id)
    
    if not buyers:
        raise HTTPException(
            status_code=404,
            detail="No buyers found for this event"
        )
    
    if len(buyers) < target_group_size:
        raise HTTPException(
            status_code=400,
            detail=f"Not enough buyers ({len(buyers)}) for group size {target_group_size}"
        )
    
    # Prepare user profiles for matching
    user_profiles = []
    
    for buyer in buyers:
        user_id = buyer['user_id']
        
        # Try to get existing profile
        profile = matching.get_user_profile(local_db, user_id)
        
        profile_data = {
            'user_id': user_id,
            'username': buyer['user_login'],
            'email': buyer['user_email'],
            'display_name': buyer['display_name'],
            'has_personality_test': buyer['has_personality_test']
        }
        
        # If user has personality test, extract relevant data
        if buyer['has_personality_test']:
            try:
                test_result = personality_test.get_user_personality_test(
                    wp_db, user_id
                )
                
                if test_result:
                    # Map personality test results to profile attributes
                    # This is a simplified mapping - adjust based on your actual test structure
                    profile_data.update(
                        _extract_profile_from_test(test_result)
                    )
            except Exception as e:
                print(f"Error getting personality test for user {user_id}: {e}")
        
        # If profile exists, merge with existing data
        if profile:
            # Keep existing profile data, only update from test if available
            profile_dict = {
                'user_id': user_id,
                'username': buyer['user_login'],
                'email': buyer['user_email'],
                'display_name': buyer['display_name'],
                'social_energy': profile.social_energy,
                'conversation_style': profile.conversation_style,
                'social_goal': profile.social_goal,
                'group_size_preference': profile.group_size_preference,
                'gender': profile.gender,
                'gender_preference': profile.gender_preference,
                'activity_types': profile.activity_types,
                'discussion_topics': profile.discussion_topics,
                'life_stage': profile.life_stage,
                'cultural_background': profile.cultural_background,
                'price_tier': profile.price_tier,
                'reliability_score': profile.reliability_score,
                'attendance_rate': profile.attendance_rate
            }
            # Update with new data from test if available
            profile_dict.update({k: v for k, v in profile_data.items() 
                               if v is not None and k not in ['user_id', 'username', 'email', 'display_name', 'has_personality_test']})
        else:
            profile_dict = profile_data
        
        user_profiles.append(profile_dict)
    
    # Run matching algorithm
    session, groups = matching.create_matching_groups(
        local_db,
        event_id,
        target_group_size,
        conversation_style,
        user_profiles
    )
    
    # Format response
    formatted_groups = []
    for group in groups:
        members = []
        for member_data in group.members_data:
            # Find match score for this member
            member_profile = next(
                (p for p in user_profiles if p['user_id'] == member_data['user_id']),
                {}
            )
            
            members.append(GroupMember(
                user_id=member_data['user_id'],
                username=member_data.get('username', ''),
                email=member_data.get('email', ''),
                display_name=member_data.get('display_name', ''),
                social_energy=member_data.get('social_energy'),
                match_score=None,  # Individual score to group
                has_personality_test=member_profile.get('has_personality_test', False)
            ))
        
        formatted_groups.append(MatchingGroup(
            id=group.id,
            session_id=group.session_id,
            group_number=group.group_number,
            group_size=group.group_size,
            average_match_score=group.average_match_score,
            members=members,
            created_at=group.created_at
        ))
    
    # Calculate statistics
    total_users = len(user_profiles)
    matched_users = sum(len(g.members) for g in formatted_groups)
    unmatched_users = total_users - matched_users
    avg_score = (
        sum(g.average_match_score for g in formatted_groups) / len(formatted_groups)
        if formatted_groups else 0
    )
    
    return MatchingResult(
        session=session,
        groups=formatted_groups,
        total_users=total_users,
        matched_users=matched_users,
        unmatched_users=unmatched_users,
        average_group_score=avg_score
    )

@router.get("/sessions/{session_id}", response_model=MatchingResult)
def get_matching_session_result(
    session_id: int = Path(..., description="Matching Session ID"),
    db: Session = Depends(get_local_db),
    wp_db: Session = Depends(get_wp_db),
    current_user = Depends(get_current_active_user)
):
    """
    Get matching session results by session ID
    """
    session = matching.get_matching_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Matching session not found")
    
    groups = matching.get_matching_groups(db, session_id)
    
    # Get buyer data to enrich member info
    buyers = event.get_event_buyers(wp_db, session.event_id)
    buyer_map = {b['user_id']: b for b in buyers}
    
    formatted_groups = []
    total_matched = 0
    
    for group in groups:
        members = []
        for member_data in group.members_data:
            buyer = buyer_map.get(member_data['user_id'], {})
            members.append(GroupMember(
                user_id=member_data['user_id'],
                username=member_data.get('username', ''),
                email=member_data.get('email', ''),
                display_name=member_data.get('display_name', ''),
                social_energy=member_data.get('social_energy'),
                match_score=None,
                has_personality_test=buyer.get('has_personality_test', False)
            ))
            total_matched += 1
        
        formatted_groups.append(MatchingGroup(
            id=group.id,
            session_id=group.session_id,
            group_number=group.group_number,
            group_size=group.group_size,
            average_match_score=group.average_match_score,
            members=members,
            created_at=group.created_at
        ))
    
    avg_score = (
        sum(g.average_match_score for g in formatted_groups) / len(formatted_groups)
        if formatted_groups else 0
    )
    
    return MatchingResult(
        session=session,
        groups=formatted_groups,
        total_users=len(buyers),
        matched_users=total_matched,
        unmatched_users=len(buyers) - total_matched,
        average_group_score=avg_score
    )

@router.get("/groups/{group_id}/scores", response_model=List[MatchScoreDetail])
def get_group_match_scores(
    group_id: int = Path(..., description="Group ID"),
    db: Session = Depends(get_local_db),
    wp_db: Session = Depends(get_wp_db),
    current_user = Depends(get_current_active_user)
):
    """
    Get detailed match scores for all pairs in a group
    """
    scores = matching.get_user_match_scores(db, group_id)
    
    if not scores:
        raise HTTPException(
            status_code=404,
            detail="No match scores found for this group"
        )
    
    # Get user names
    from app.crud.user import wp_user
    
    result = []
    for score in scores:
        user1 = wp_user.get(wp_db, score.user1_id)
        user2 = wp_user.get(wp_db, score.user2_id)
        
        result.append(MatchScoreDetail(
            user1_id=score.user1_id,
            user1_name=user1.display_name if user1 else f"User {score.user1_id}",
            user2_id=score.user2_id,
            user2_name=user2.display_name if user2 else f"User {score.user2_id}",
            social_energy_score=score.social_energy_score,
            conversation_style_score=score.conversation_style_score,
            social_goal_score=score.social_goal_score,
            group_size_score=score.group_size_score,
            gender_comfort_score=score.gender_comfort_score,
            interest_score=score.interest_score,
            life_context_score=score.life_context_score,
            cultural_score=score.cultural_score,
            financial_score=score.financial_score,
            reliability_score=score.reliability_score,
            total_match_score=score.total_match_score,
            matching_criteria_count=score.matching_criteria_count
        ))
    
    return result

@router.get("/events/{event_id}/sessions", response_model=List[MatchingSession])
def get_event_matching_sessions(
    event_id: int = Path(..., description="Event ID"),
    db: Session = Depends(get_local_db),
    current_user = Depends(get_current_active_user)
):
    """
    Get all matching sessions for an event
    """
    sessions = matching.get_event_matching_sessions(db, event_id)
    return sessions

# ==================== Energy Feedback Endpoints ====================

@router.post("/feedback", response_model=EnergyFeedback)
def create_energy_feedback(
    feedback_in: EnergyFeedbackCreate,
    db: Session = Depends(get_local_db),
    current_user = Depends(get_current_active_user)
):
    """
    Submit energy feedback after a meeting
    This helps improve future matching by learning who energizes who
    """
    feedback = matching.create_energy_feedback(db, feedback_in)
    return feedback

# ==================== Helper Functions ====================

def _extract_profile_from_test(test_result: dict) -> dict:
    """
    Extract matching profile attributes from personality test results
    This is a simplified version - adjust based on your actual test structure
    """
    profile = {}
    
    # Example: Extract social energy from test results
    # You'll need to adjust this based on your actual personality test questions
    total_points = test_result.get('total_points', 0)
    
    # Map points to social energy (example thresholds)
    if total_points < 30:
        profile['social_energy'] = 'introvert'
    elif total_points < 70:
        profile['social_energy'] = 'ambivert'
    else:
        profile['social_energy'] = 'extrovert'
    
    # You can add more sophisticated mapping based on specific questions
    # For example, if you have questions about conversation preferences:
    answers = test_result.get('answers', [])
    
    for answer in answers:
        question_text = answer.get('question_text', '').lower()
        answer_text = answer.get('answer_text', '').lower()
        
        # Example: Detect conversation style from answers
        if 'conversation' in question_text or 'discussion' in question_text:
            if 'deep' in answer_text or 'meaningful' in answer_text:
                profile['conversation_style'] = 'deep'
            elif 'casual' in answer_text or 'light' in answer_text:
                profile['conversation_style'] = 'casual'
        
        # Example: Detect social goal
        if 'goal' in question_text or 'looking for' in question_text:
            if 'relationship' in answer_text:
                profile['social_goal'] = 'relationship'
            elif 'friend' in answer_text:
                profile['social_goal'] = 'friendship'
            elif 'network' in answer_text or 'professional' in answer_text:
                profile['social_goal'] = 'networking'
        
        # Example: Detect group size preference
        if 'group size' in question_text or 'prefer' in question_text:
            if '4' in answer_text or 'small' in answer_text or 'intimate' in answer_text:
                profile['group_size_preference'] = 4
            elif '6' in answer_text or 'larger' in answer_text:
                profile['group_size_preference'] = 6
    
    return profile