from typing import List, Optional, Dict, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, func
from app.models.matching import (
    UserProfile, MatchingSession, MatchingGroup, 
    UserMatchScore, EnergyFeedback
)
from app.schemas.matching import (
    UserProfileCreate, UserProfileUpdate,
    MatchingSessionCreate, EnergyFeedbackCreate
)
import math
from collections import defaultdict

class CRUDMatching:
    
    # ==================== User Profile CRUD ====================
    
    def get_user_profile(self, db: Session, wp_user_id: int) -> Optional[UserProfile]:
        """Get user profile by WordPress user ID"""
        return db.query(UserProfile).filter(
            UserProfile.wp_user_id == wp_user_id
        ).first()
    
    def create_user_profile(
        self, 
        db: Session, 
        profile_in: UserProfileCreate
    ) -> UserProfile:
        """Create user profile"""
        db_profile = UserProfile(**profile_in.dict())
        db.add(db_profile)
        db.commit()
        db.refresh(db_profile)
        return db_profile
    
    def update_user_profile(
        self,
        db: Session,
        wp_user_id: int,
        profile_in: UserProfileUpdate
    ) -> Optional[UserProfile]:
        """Update user profile"""
        db_profile = self.get_user_profile(db, wp_user_id)
        if not db_profile:
            return None
        
        update_data = profile_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_profile, field, value)
        
        db.commit()
        db.refresh(db_profile)
        return db_profile
    
    def create_or_update_profile(
        self,
        db: Session,
        wp_user_id: int,
        profile_data: Dict
    ) -> UserProfile:
        """Create or update user profile"""
        db_profile = self.get_user_profile(db, wp_user_id)
        
        if db_profile:
            for field, value in profile_data.items():
                setattr(db_profile, field, value)
        else:
            db_profile = UserProfile(wp_user_id=wp_user_id, **profile_data)
            db.add(db_profile)
        
        db.commit()
        db.refresh(db_profile)
        return db_profile
    
    # ==================== Matching Algorithm ====================
    
    def calculate_match_score(
        self,
        user1_profile: Dict,
        user2_profile: Dict,
        target_group_size: int,
        conversation_style: str
    ) -> Dict:
        """
        Calculate match score between two users based on SOSY formula
        Returns dict with individual scores and total
        """
        scores = {
            'social_energy_score': 0.0,
            'conversation_style_score': 0.0,
            'social_goal_score': 0.0,
            'group_size_score': 0.0,
            'gender_comfort_score': 0.0,
            'interest_score': 0.0,
            'life_context_score': 0.0,
            'cultural_score': 0.0,
            'financial_score': 0.0,
            'reliability_score': 0.0,
            'matching_criteria_count': 0
        }
        
        # 1. Social Energy Balance (will be calculated at group level)
        # For now, just check if they're compatible
        if user1_profile.get('social_energy') and user2_profile.get('social_energy'):
            scores['social_energy_score'] = 1.0
            scores['matching_criteria_count'] += 1
        
        # 2. Conversation Style (HARD FILTER)
        user1_style = user1_profile.get('conversation_style')
        user2_style = user2_profile.get('conversation_style')
        
        if user1_style and user2_style:
            if user1_style == user2_style == conversation_style:
                scores['conversation_style_score'] = 1.0
                scores['matching_criteria_count'] += 1
            else:
                # Hard filter - return 0 for all if mismatched
                return {**scores, 'total_match_score': 0.0}
        
        # 3. Social Goal
        user1_goal = user1_profile.get('social_goal')
        user2_goal = user2_profile.get('social_goal')
        
        if user1_goal and user2_goal:
            if user1_goal == user2_goal:
                scores['social_goal_score'] = 1.0
                scores['matching_criteria_count'] += 1
            else:
                scores['social_goal_score'] = 0.3  # Penalty but not zero
        
        # 4. Group Size Comfort
        user1_size = user1_profile.get('group_size_preference')
        user2_size = user2_profile.get('group_size_preference')
        
        if user1_size and user2_size:
            if user1_size == user2_size == target_group_size:
                scores['group_size_score'] = 1.0
                scores['matching_criteria_count'] += 1
            else:
                scores['group_size_score'] = 0.0
        
        # 5. Gender Comfort (STRICT)
        user1_gender = user1_profile.get('gender')
        user2_gender = user2_profile.get('gender')
        user1_pref = user1_profile.get('gender_preference')
        user2_pref = user2_profile.get('gender_preference')
        
        if user1_gender and user2_gender and user1_pref and user2_pref:
            gender_compatible = True
            
            # Check user1's preference
            if user1_pref == 'same' and user1_gender != user2_gender:
                gender_compatible = False
            elif user1_pref == 'mixed':
                # Mixed is OK
                pass
            
            # Check user2's preference
            if user2_pref == 'same' and user1_gender != user2_gender:
                gender_compatible = False
            elif user2_pref == 'mixed':
                # Mixed is OK
                pass
            
            if gender_compatible:
                scores['gender_comfort_score'] = 1.0
                scores['matching_criteria_count'] += 1
            else:
                scores['gender_comfort_score'] = 0.0
        
        # 6. Interest Cluster
        user1_activities = set(user1_profile.get('activity_types') or [])
        user2_activities = set(user2_profile.get('activity_types') or [])
        user1_topics = set(user1_profile.get('discussion_topics') or [])
        user2_topics = set(user2_profile.get('discussion_topics') or [])
        
        if user1_activities and user2_activities:
            activity_overlap = len(user1_activities & user2_activities)
            activity_total = len(user1_activities | user2_activities)
            
            if activity_total > 0:
                activity_score = activity_overlap / activity_total
                
                # Bonus for topic overlap
                if user1_topics and user2_topics:
                    topic_overlap = len(user1_topics & user2_topics)
                    topic_total = len(user1_topics | user2_topics)
                    if topic_total > 0:
                        topic_score = topic_overlap / topic_total
                        scores['interest_score'] = (activity_score * 0.6 + topic_score * 0.4)
                    else:
                        scores['interest_score'] = activity_score
                else:
                    scores['interest_score'] = activity_score
                
                if scores['interest_score'] > 0.3:
                    scores['matching_criteria_count'] += 1
        
        # 7. Life Context
        user1_life = user1_profile.get('life_stage')
        user2_life = user2_profile.get('life_stage')
        
        if user1_life and user2_life:
            if user1_life == user2_life:
                scores['life_context_score'] = 1.0
                scores['matching_criteria_count'] += 1
            else:
                # Adjacent contexts can still work
                scores['life_context_score'] = 0.5
        
        # 8. Cultural Background
        user1_culture = user1_profile.get('cultural_background')
        user2_culture = user2_profile.get('cultural_background')
        
        if user1_culture and user2_culture:
            if user1_culture == user2_culture:
                scores['cultural_score'] = 0.7  # 70% same culture
                scores['matching_criteria_count'] += 1
            else:
                scores['cultural_score'] = 0.3  # 30% diversity
        
        # 9. Financial Comfort (STRICT)
        user1_price = user1_profile.get('price_tier')
        user2_price = user2_profile.get('price_tier')
        
        if user1_price and user2_price:
            if user1_price == user2_price:
                scores['financial_score'] = 1.0
                scores['matching_criteria_count'] += 1
            else:
                scores['financial_score'] = 0.0
        
        # 10. Reliability & Social Trust
        user1_reliability = user1_profile.get('reliability_score', 100.0)
        user2_reliability = user2_profile.get('reliability_score', 100.0)
        
        reliability_diff = abs(user1_reliability - user2_reliability)
        
        if reliability_diff <= 10:
            scores['reliability_score'] = 1.0
            scores['matching_criteria_count'] += 1
        elif reliability_diff <= 20:
            scores['reliability_score'] = 0.7
        elif reliability_diff <= 30:
            scores['reliability_score'] = 0.4
        else:
            scores['reliability_score'] = 0.2
        
        # Calculate total score (average of all criteria)
        total_criteria = 10  # Total number of criteria
        total_score = sum([
            scores['social_energy_score'],
            scores['conversation_style_score'],
            scores['social_goal_score'],
            scores['group_size_score'],
            scores['gender_comfort_score'],
            scores['interest_score'],
            scores['life_context_score'],
            scores['cultural_score'],
            scores['financial_score'],
            scores['reliability_score']
        ])
        
        scores['total_match_score'] = (total_score / total_criteria) * 100
        
        return scores
    
    def validate_group_composition(
        self,
        group_profiles: List[Dict],
        target_group_size: int
    ) -> bool:
        """
        Validate if group composition meets SOSY criteria
        Especially for social energy balance
        """
        if len(group_profiles) != target_group_size:
            return False
        
        # Count social energy types
        energy_count = defaultdict(int)
        for profile in group_profiles:
            energy = profile.get('social_energy')
            if energy:
                energy_count[energy] += 1
        
        # Validate based on group size
        if target_group_size == 4:
            # 4-person: 2 introverts + 1 ambivert + 1 extrovert
            if (energy_count.get('introvert', 0) == 2 and
                energy_count.get('ambivert', 0) == 1 and
                energy_count.get('extrovert', 0) == 1):
                return True
        elif target_group_size == 6:
            # 6-person: 2 extroverts + 2 ambiverts + 2 introverts
            if (energy_count.get('introvert', 0) == 2 and
                energy_count.get('ambivert', 0) == 2 and
                energy_count.get('extrovert', 0) == 2):
                return True
        
        # If we don't have perfect energy balance, still allow if reasonable
        # (not all users may have energy data)
        return True
    
    def create_matching_groups(
        self,
        db: Session,
        event_id: int,
        target_group_size: int,
        conversation_style: str,
        user_profiles: List[Dict]
    ) -> Tuple[MatchingSession, List[MatchingGroup]]:
        """
        Main matching algorithm
        Creates groups based on compatibility scores
        """
        # Create matching session
        from app.crud.event import event as event_crud
        from app.db.base import get_wp_db
        
        wp_db = next(get_wp_db())
        event_obj = event_crud.get_event_by_id(wp_db, event_id)
        
        session = MatchingSession(
            event_id=event_id,
            event_name=event_obj.post_title if event_obj else None,
            target_group_size=target_group_size,
            conversation_style=conversation_style,
            status='pending'
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        
        # Filter users by conversation style (hard filter)
        filtered_users = [
            u for u in user_profiles 
            if u.get('conversation_style') == conversation_style or 
            not u.get('conversation_style')  # Include users without preference
        ]
        
        # Filter by group size preference
        filtered_users = [
            u for u in filtered_users
            if u.get('group_size_preference') == target_group_size or
            not u.get('group_size_preference')
        ]
        
        if len(filtered_users) < target_group_size:
            # Not enough users for even one group
            session.status = 'completed'
            db.commit()
            return session, []
        
        # Calculate pairwise match scores
        match_matrix = {}
        for i, user1 in enumerate(filtered_users):
            for j, user2 in enumerate(filtered_users):
                if i >= j:
                    continue
                
                score_data = self.calculate_match_score(
                    user1, user2, target_group_size, conversation_style
                )
                
                # Only consider if minimum 3 criteria match
                if score_data['matching_criteria_count'] >= 3:
                    match_matrix[(i, j)] = score_data['total_match_score']
        
        # Greedy grouping algorithm
        matched_groups = []
        used_indices = set()
        group_number = 1
        
        while len(used_indices) < len(filtered_users):
            available_indices = [i for i in range(len(filtered_users)) if i not in used_indices]
            
            if len(available_indices) < target_group_size:
                break  # Not enough people for another group
            
            # Find best group starting with highest average compatibility
            best_group = None
            best_score = -1
            
            # Try different combinations (simplified greedy approach)
            for seed_idx in available_indices:
                current_group = [seed_idx]
                current_available = [i for i in available_indices if i != seed_idx]
                
                # Add users one by one based on average score with current group
                while len(current_group) < target_group_size and current_available:
                    best_next = None
                    best_next_score = -1
                    
                    for candidate_idx in current_available:
                        # Calculate average score with all in current group
                        scores = []
                        for group_idx in current_group:
                            pair = tuple(sorted([group_idx, candidate_idx]))
                            if pair in match_matrix:
                                scores.append(match_matrix[pair])
                        
                        if scores:
                            avg_score = sum(scores) / len(scores)
                            if avg_score > best_next_score:
                                best_next_score = avg_score
                                best_next = candidate_idx
                    
                    if best_next is not None:
                        current_group.append(best_next)
                        current_available.remove(best_next)
                    else:
                        break
                
                # Check if this group is complete and better than previous best
                if len(current_group) == target_group_size:
                    # Calculate average group score
                    group_scores = []
                    for i in range(len(current_group)):
                        for j in range(i + 1, len(current_group)):
                            pair = tuple(sorted([current_group[i], current_group[j]]))
                            if pair in match_matrix:
                                group_scores.append(match_matrix[pair])
                    
                    if group_scores:
                        avg_group_score = sum(group_scores) / len(group_scores)
                        
                        # Validate group composition
                        group_profiles = [filtered_users[idx] for idx in current_group]
                        if self.validate_group_composition(group_profiles, target_group_size):
                            if avg_group_score > best_score:
                                best_score = avg_group_score
                                best_group = current_group
            
            if best_group:
                # Create the group
                members_data = []
                for idx in best_group:
                    user = filtered_users[idx]
                    members_data.append({
                        'user_id': user['user_id'],
                        'username': user.get('username', ''),
                        'email': user.get('email', ''),
                        'display_name': user.get('display_name', ''),
                        'social_energy': user.get('social_energy')
                    })
                    used_indices.add(idx)
                
                group = MatchingGroup(
                    session_id=session.id,
                    group_number=group_number,
                    group_size=target_group_size,
                    average_match_score=best_score,
                    members_data=members_data
                )
                db.add(group)
                db.commit()
                db.refresh(group)
                
                # Save individual match scores
                for i in range(len(best_group)):
                    for j in range(i + 1, len(best_group)):
                        idx1, idx2 = best_group[i], best_group[j]
                        user1, user2 = filtered_users[idx1], filtered_users[idx2]
                        
                        score_data = self.calculate_match_score(
                            user1, user2, target_group_size, conversation_style
                        )
                        
                        match_score = UserMatchScore(
                            group_id=group.id,
                            user1_id=user1['user_id'],
                            user2_id=user2['user_id'],
                            **score_data
                        )
                        db.add(match_score)
                
                matched_groups.append(group)
                group_number += 1
            else:
                break
        
        db.commit()
        
        # Update session status
        session.status = 'completed'
        db.commit()
        
        return session, matched_groups
    
    # ==================== Query Methods ====================
    
    def get_matching_session(
        self, 
        db: Session, 
        session_id: int
    ) -> Optional[MatchingSession]:
        """Get matching session by ID"""
        return db.query(MatchingSession).filter(
            MatchingSession.id == session_id
        ).first()
    
    def get_matching_groups(
        self,
        db: Session,
        session_id: int
    ) -> List[MatchingGroup]:
        """Get all groups for a session"""
        return db.query(MatchingGroup).filter(
            MatchingGroup.session_id == session_id
        ).order_by(MatchingGroup.group_number).all()
    
    def get_user_match_scores(
        self,
        db: Session,
        group_id: int
    ) -> List[UserMatchScore]:
        """Get all match scores for a group"""
        return db.query(UserMatchScore).filter(
            UserMatchScore.group_id == group_id
        ).all()
    
    def get_event_matching_sessions(
        self,
        db: Session,
        event_id: int
    ) -> List[MatchingSession]:
        """Get all matching sessions for an event"""
        return db.query(MatchingSession).filter(
            MatchingSession.event_id == event_id
        ).order_by(desc(MatchingSession.created_at)).all()
    
    # ==================== Energy Feedback ====================
    
    def create_energy_feedback(
        self,
        db: Session,
        feedback_in: EnergyFeedbackCreate
    ) -> EnergyFeedback:
        """Create energy feedback after meeting"""
        feedback = EnergyFeedback(**feedback_in.dict())
        db.add(feedback)
        db.commit()
        db.refresh(feedback)
        
        # Update user reliability score based on feedback
        self._update_reliability_from_feedback(db, feedback)
        
        return feedback
    
    def _update_reliability_from_feedback(
        self,
        db: Session,
        feedback: EnergyFeedback
    ):
        """Update user reliability score based on energy feedback"""
        # Get rated user's profile
        profile = self.get_user_profile(db, feedback.rated_user_id)
        if not profile:
            return
        
        # Calculate new reliability based on energy impact and rating
        energy_weight = {
            'energized': 1.0,
            'neutral': 0.7,
            'drained': 0.3
        }
        
        weight = energy_weight.get(feedback.energy_impact, 0.7)
        rating_score = (feedback.rating / 5.0) * weight * 100
        
        # Moving average with previous score (80% old, 20% new)
        new_score = (profile.reliability_score * 0.8) + (rating_score * 0.2)
        profile.reliability_score = max(0, min(100, new_score))
        
        db.commit()

matching = CRUDMatching()