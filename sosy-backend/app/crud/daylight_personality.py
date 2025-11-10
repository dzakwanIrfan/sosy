from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from app.models.daylight_personality import (
    DaylightPersonalityTest, DaylightMatchingSession, 
    DaylightMatchingParticipant, DaylightMatchingTable, 
    DaylightMatchingScore
)
from app.models.user import User
from app.schemas.daylight_personality import PersonalityTestSubmission
import math
import random

class CRUDDaylightPersonality:
    
    def calculate_personality_scores(self, answers: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate personality scores from questionnaire answers"""
        
        # Initialize raw scores
        e_raw = 0.0  # Energy
        o_raw = 0.0  # Openness
        s_raw = 0.0  # Structure
        a_raw = 0.0  # Affect
        c_raw = 0.0  # Comfort
        l_raw = 1    # Lifestyle tier
        
        # Q1: Meeting new people -> E
        if answers.get('q1') == 'A':
            e_raw += 10
        elif answers.get('q1') == 'B':
            e_raw -= 10
        
        # Q2: Recharge style -> E
        if answers.get('q2') == 'A':
            e_raw += 10
        elif answers.get('q2') == 'B':
            e_raw -= 10
        
        # Q3: Conversation type -> O
        if answers.get('q3') == 'A':
            o_raw -= 10  # Light = practical
        elif answers.get('q3') == 'B':
            o_raw += 10  # Deep = abstract
        
        # Q4: Plans change -> S
        if answers.get('q4') == 'A':
            s_raw += 10  # Flexible
        elif answers.get('q4') == 'B':
            s_raw -= 10  # Structured
        
        # Q5: Friend problem response -> A
        if answers.get('q5') == 'A':
            a_raw += 10  # Feeling
        elif answers.get('q5') == 'B':
            a_raw -= 10  # Thinking
        
        # Q6-Q7: Context (no scoring)
        relationship_status = answers.get('q6')
        looking_for = answers.get('q7')
        
        # Q8: Gender comfort -> C
        if answers.get('q8') == 'A':
            c_raw += 10
        elif answers.get('q8') == 'B':
            c_raw += 2
        elif answers.get('q8') == 'C':
            c_raw += 6
        
        # Q9: Venue spend -> L
        if answers.get('q9') == 'A':
            l_raw = 1
        elif answers.get('q9') == 'B':
            l_raw = 2
        elif answers.get('q9') == 'C':
            l_raw = 3
        
        # Q10: Weekend activity -> E, O
        if answers.get('q10') == 'A':  # Reading/journaling
            e_raw -= 5
            o_raw += 5
        elif answers.get('q10') == 'B':  # Outdoor
            e_raw += 5
            o_raw += 5
        elif answers.get('q10') == 'C':  # Cafe/art
            e_raw += 3
            o_raw += 5
        elif answers.get('q10') == 'D':  # Workout
            e_raw += 0
            o_raw -= 2
        
        # Q11: Music vibe -> O
        if answers.get('q11') == 'A':  # Jazz/lofi
            o_raw += 6
        elif answers.get('q11') == 'B':  # Pop/R&B
            o_raw += 2
        elif answers.get('q11') == 'C':  # Indie
            o_raw += 6
        elif answers.get('q11') == 'D':  # EDM
            o_raw -= 2
        
        # Q12: Movie genre -> A
        if answers.get('q12') == 'A':  # Romance/Drama
            a_raw += 6
        elif answers.get('q12') == 'B':  # Comedy
            a_raw += 2
        elif answers.get('q12') == 'C':  # Thriller
            a_raw -= 2
        elif answers.get('q12') == 'D':  # Documentary
            a_raw -= 6
        
        # Q13: Meet strangers -> C
        if answers.get('q13') == 'A':  # Excited
            c_raw += 10
        elif answers.get('q13') == 'B':  # Nervous but try
            c_raw += 5
        elif answers.get('q13') == 'C':  # Prefer small
            c_raw += 2
        
        # Q14: Communication style -> E
        if answers.get('q14') == 'A':  # Talkative
            e_raw += 8
        elif answers.get('q14') == 'B':  # Balanced
            e_raw += 4
        elif answers.get('q14') == 'C':  # Reserved
            e_raw -= 8
        
        # Q15: Ideal connection -> A, O
        if answers.get('q15') == 'A':  # Playful
            a_raw += 3
            o_raw -= 2
        elif answers.get('q15') == 'B':  # Deep
            a_raw += 8
            o_raw += 6
        elif answers.get('q15') == 'C':  # Inspiring
            a_raw += 4
            o_raw += 8
        elif answers.get('q15') == 'D':  # Calm
            a_raw += 6
            o_raw += 2
        
        # Clamp raw scores to -10..+10
        e_raw = max(-10, min(10, e_raw))
        o_raw = max(-10, min(10, o_raw))
        s_raw = max(-10, min(10, s_raw))
        a_raw = max(-10, min(10, a_raw))
        c_raw = max(0, min(20, c_raw))  # C can go 0-20
        
        # Normalize to 0-100
        e_normalized = ((e_raw + 10) / 20) * 100
        o_normalized = ((o_raw + 10) / 20) * 100
        s_normalized = ((s_raw + 10) / 20) * 100
        a_normalized = ((a_raw + 10) / 20) * 100
        c_normalized = (c_raw / 20) * 100
        l_normalized = ((l_raw - 1) / 2) * 100
        
        # Calculate profile score (weighted)
        profile_score = (
            0.25 * e_normalized +
            0.20 * o_normalized +
            0.15 * s_normalized +
            0.15 * a_normalized +
            0.10 * l_normalized +
            0.10 * c_normalized
        )
        profile_score = max(0, min(100, profile_score))
        
        # Determine archetype
        archetype, symbol = self._determine_archetype(e_raw, o_raw, s_raw, a_raw)
        
        return {
            'e_raw': e_raw,
            'o_raw': o_raw,
            's_raw': s_raw,
            'a_raw': a_raw,
            'c_raw': c_raw,
            'l_raw': l_raw,
            'e_normalized': e_normalized,
            'o_normalized': o_normalized,
            's_normalized': s_normalized,
            'a_normalized': a_normalized,
            'c_normalized': c_normalized,
            'l_normalized': l_normalized,
            'profile_score': profile_score,
            'archetype': archetype,
            'archetype_symbol': symbol,
            'relationship_status': relationship_status,
            'looking_for': looking_for,
            'gender_comfort': answers.get('q8')
        }
    
    def _determine_archetype(self, e_raw: float, o_raw: float, s_raw: float, a_raw: float) -> Tuple[str, str]:
        """Determine personality archetype based on traits"""
        
        # Flags
        e_hi = e_raw >= 5
        e_lo = e_raw <= -5
        o_hi = o_raw >= 5
        o_lo = o_raw <= -5
        s_flex = s_raw >= 5
        s_struct = s_raw <= -5
        a_feel = a_raw >= 5
        a_think = a_raw <= -5
        
        # Archetype rules (first match wins)
        if e_hi and a_feel and (o_hi or s_flex):
            return "Bright Morning", "☀️"
        
        if e_lo and a_feel and (s_struct or o_hi):
            return "Calm Dawn", "🟫"
        
        if e_hi and a_think and s_struct:
            return "Bold Noon", "☀️"
        
        if e_hi and a_feel and o_hi and s_flex:
            return "Golden Hour", "🎁"
        
        if e_lo and a_think and (o_hi or s_struct):
            return "Quiet Dusk", "🌙"
        
        if e_lo and a_feel and o_hi and s_flex:
            return "Cloudy Day", "☁️"
        
        if a_feel and s_struct and (e_lo or abs(e_raw) < 5):
            return "Serene Drizzle", "🌧️"
        
        if e_hi and a_think and (o_lo or s_struct):
            return "Blazing Noon", "🔥"
        
        if e_lo and o_hi and (a_think or abs(a_raw) < 5):
            return "Starry Night", "⭐"
        
        # Default: Perfect Day
        return "Perfect Day", "🌈"
    
    def create_or_update_test(
        self, 
        db: Session, 
        user_id: int, 
        submission: PersonalityTestSubmission
    ) -> DaylightPersonalityTest:
        """Create or update personality test for user"""
        
        # Calculate scores
        scores = self.calculate_personality_scores(submission.answers)
        
        # Check if user already has a test
        existing_test = db.query(DaylightPersonalityTest).filter(
            DaylightPersonalityTest.user_id == user_id
        ).order_by(desc(DaylightPersonalityTest.test_date)).first()
        
        if existing_test:
            # Update existing
            for key, value in scores.items():
                setattr(existing_test, key, value)
            existing_test.answers = submission.answers
            existing_test.test_date = func.now()
            db.commit()
            db.refresh(existing_test)
            return existing_test
        else:
            # Create new
            test = DaylightPersonalityTest(
                user_id=user_id,
                answers=submission.answers,
                **scores
            )
            db.add(test)
            db.commit()
            db.refresh(test)
            return test
    
    def get_user_latest_test(
        self, 
        db: Session, 
        user_id: int
    ) -> Optional[DaylightPersonalityTest]:
        """Get user's latest personality test"""
        return db.query(DaylightPersonalityTest).filter(
            DaylightPersonalityTest.user_id == user_id
        ).order_by(desc(DaylightPersonalityTest.test_date)).first()
    
    def get_all_tests(
        self, 
        db: Session, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[DaylightPersonalityTest]:
        """Get all personality tests"""
        return db.query(DaylightPersonalityTest).order_by(
            desc(DaylightPersonalityTest.test_date)
        ).offset(skip).limit(limit).all()
    
    def calculate_match_score(
        self,
        test1: DaylightPersonalityTest,
        test2: DaylightPersonalityTest
    ) -> Dict[str, Any]:
        """Calculate match score between two users using Daylight algorithm"""
        
        # Trait vector [E, O, S, A]
        v1 = [test1.e_raw, test1.o_raw, test1.s_raw, test1.a_raw]
        v2 = [test2.e_raw, test2.o_raw, test2.s_raw, test2.a_raw]
        
        # Cosine similarity
        dot_product = sum(a * b for a, b in zip(v1, v2))
        magnitude1 = math.sqrt(sum(a * a for a in v1))
        magnitude2 = math.sqrt(sum(b * b for b in v2))
        
        if magnitude1 == 0 or magnitude2 == 0:
            cos_similarity = 0
        else:
            cos_similarity = dot_product / (magnitude1 * magnitude2)
        
        # Map -1..+1 to 0..100
        cos_normalized = ((cos_similarity + 1) / 2) * 100
        
        # Lifestyle bonus (L_bonus)
        l_gap = abs(test1.l_normalized - test2.l_normalized)
        l_bonus = max(0, 20 - l_gap)
        
        # Comfort bonus (C_bonus)
        c_min = min(test1.c_normalized, test2.c_normalized)
        c_bonus = 0.2 * c_min
        
        # Serendipity - tidak digunakan untuk consistency
        serendipity = 0
        
        # Final match score (sesuai formula)
        match_score = 0.70 * cos_normalized + 0.15 * l_bonus + 0.15 * c_bonus
        match_score = max(0, min(100, match_score))
        
        return {
            'e_diff': abs(test1.e_raw - test2.e_raw),
            'o_diff': abs(test1.o_raw - test2.o_raw),
            's_diff': abs(test1.s_raw - test2.s_raw),
            'a_diff': abs(test1.a_raw - test2.a_raw),
            'trait_similarity': cos_normalized,
            'lifestyle_bonus': l_bonus,
            'comfort_bonus': c_bonus,
            'serendipity_bonus': serendipity,
            'total_match_score': match_score,
            'meets_threshold': match_score >= 70.0
        }
    
    def create_matching_session(
        self,
        db: Session,
        session_name: str,
        created_by: int,
        participant_user_ids: List[int],
        min_match_threshold: float = 70.0
    ) -> DaylightMatchingSession:
        """
        Create a new matching session and run the SMART matching algorithm
        Sistem otomatis menentukan ukuran grup optimal (3-5 orang)
        """
        
        # Create session
        session = DaylightMatchingSession(
            session_name=session_name,
            created_by=created_by,
            min_group_size=3,
            max_group_size=5,
            min_match_threshold=min_match_threshold,
            status='processing'
        )
        db.add(session)
        db.flush()
        
        # Get personality tests for participants
        participants_data = []
        for user_id in participant_user_ids:
            test = self.get_user_latest_test(db, user_id)
            if not test:
                continue
            
            # Add participant
            participant = DaylightMatchingParticipant(
                session_id=session.id,
                user_id=user_id,
                personality_test_id=test.id
            )
            db.add(participant)
            
            participants_data.append({
                'user_id': user_id,
                'test': test
            })
        
        session.total_participants = len(participants_data)
        
        if len(participants_data) < 3:
            session.status = 'failed'
            db.commit()
            db.refresh(session)
            return session
        
        # Run ENHANCED matching algorithm dengan multi-tier strategy
        tables = self._run_enhanced_matching_algorithm(
            db, session, participants_data, min_match_threshold
        )
        
        session.total_tables = len(tables)
        session.status = 'completed'
        session.completed_at = func.now()
        
        # Calculate average match score
        if tables:
            avg_score = sum(t.average_match_score for t in tables) / len(tables)
            session.average_match_score = avg_score
        
        db.commit()
        db.refresh(session)
        return session
    
    def _run_enhanced_matching_algorithm(
        self,
        db: Session,
        session: DaylightMatchingSession,
        participants_data: List[Dict],
        threshold: float
    ) -> List[DaylightMatchingTable]:
        """
        ENHANCED Multi-Tier Matching Algorithm:
        
        Tier 1: Try with target threshold (70%)
        Tier 2: Lower threshold progressively (65%, 60%, 55%, 50%)
        Tier 3: Form groups from remaining users with ANY positive compatibility
        Tier 4: Force group remaining users if >= 3 people left
        """
        
        print(f"\n🎯 ENHANCED Multi-Tier Matching Algorithm")
        print(f"Total Participants: {len(participants_data)}")
        print(f"Target Threshold: {threshold}%")
        
        all_tables = []
        remaining_indices = list(range(len(participants_data)))
        table_number = 1
        
        # Calculate match matrix for ALL pairs once
        match_matrix = {}
        for i, p1 in enumerate(participants_data):
            for j, p2 in enumerate(participants_data):
                if i >= j:
                    continue
                score_data = self.calculate_match_score(p1['test'], p2['test'])
                match_matrix[(i, j)] = score_data
        
        # TIER 1-2: Try multiple thresholds (70% -> 65% -> 60% -> 55% -> 50%)
        thresholds_to_try = [threshold, 65.0, 60.0, 55.0, 50.0]
        
        for current_threshold in thresholds_to_try:
            if len(remaining_indices) < 3:
                break
            
            print(f"\n🔍 TIER {thresholds_to_try.index(current_threshold) + 1}: Threshold {current_threshold}%")
            
            tables_this_tier = self._form_groups_with_threshold(
                db, session, participants_data, remaining_indices,
                match_matrix, current_threshold, table_number
            )
            
            # Update remaining and table number
            for table in tables_this_tier:
                all_tables.append(table)
                table_number += 1
                
                # Remove matched users from remaining
                for member_data in table.members_data:
                    user_id = member_data['user_id']
                    idx = next((i for i, p in enumerate(participants_data) if p['user_id'] == user_id), None)
                    if idx is not None and idx in remaining_indices:
                        remaining_indices.remove(idx)
            
            if tables_this_tier:
                print(f"✅ Formed {len(tables_this_tier)} group(s) at {current_threshold}%")
        
        # TIER 3: Try to form groups from remaining with ANY positive score
        if len(remaining_indices) >= 3:
            print(f"\n🔍 TIER 3: Form groups with ANY positive compatibility")
            print(f"Remaining users: {len(remaining_indices)}")
            
            tables_tier3 = self._form_groups_any_positive(
                db, session, participants_data, remaining_indices,
                match_matrix, table_number
            )
            
            for table in tables_tier3:
                all_tables.append(table)
                table_number += 1
                
                # Remove matched users
                for member_data in table.members_data:
                    user_id = member_data['user_id']
                    idx = next((i for i, p in enumerate(participants_data) if p['user_id'] == user_id), None)
                    if idx is not None and idx in remaining_indices:
                        remaining_indices.remove(idx)
            
            if tables_tier3:
                print(f"✅ Formed {len(tables_tier3)} group(s) with positive scores")
        
        # TIER 4: FORCE group remaining users if still >= 3
        if len(remaining_indices) >= 3:
            print(f"\n🔍 TIER 4: FORCE grouping remaining {len(remaining_indices)} user(s)")
            
            force_table = self._force_group_remaining(
                db, session, participants_data, remaining_indices,
                match_matrix, table_number
            )
            
            if force_table:
                all_tables.append(force_table)
                print(f"✅ Forced 1 group with {force_table.table_size} people")
        
        print(f"\n✨ Final Result: {len(all_tables)} table(s) created")
        print(f"📊 Matched: {sum(t.table_size for t in all_tables)} / {len(participants_data)} users")
        
        return all_tables
    
    def _form_groups_with_threshold(
        self,
        db: Session,
        session: DaylightMatchingSession,
        participants_data: List[Dict],
        available_indices: List[int],
        match_matrix: Dict,
        threshold: float,
        start_table_number: int
    ) -> List[DaylightMatchingTable]:
        """Form groups with specific threshold"""
        
        tables = []
        used_indices = set()
        table_number = start_table_number
        
        while True:
            current_available = [i for i in available_indices if i not in used_indices]
            
            if len(current_available) < 3:
                break
            
            # Determine possible sizes (prefer 5 > 4 > 3)
            possible_sizes = []
            if len(current_available) >= 5:
                possible_sizes = [5, 4, 3]
            elif len(current_available) >= 4:
                possible_sizes = [4, 3]
            else:
                possible_sizes = [3]
            
            best_group = None
            best_score = -1
            
            # Try each size
            for target_size in possible_sizes:
                # Try multiple seed points
                for seed_idx in current_available[:min(8, len(current_available))]:
                    group = [seed_idx]
                    candidates = [i for i in current_available if i != seed_idx]
                    
                    # Greedy add
                    while len(group) < target_size and candidates:
                        best_next = None
                        best_next_score = -1
                        
                        for candidate in candidates:
                            # Calculate average with current group
                            scores = []
                            for member in group:
                                pair = tuple(sorted([member, candidate]))
                                if pair in match_matrix:
                                    scores.append(match_matrix[pair]['total_match_score'])
                            
                            if scores:
                                avg = sum(scores) / len(scores)
                                if avg >= threshold and avg > best_next_score:
                                    best_next_score = avg
                                    best_next = candidate
                        
                        if best_next is not None:
                            group.append(best_next)
                            candidates.remove(best_next)
                        else:
                            break
                    
                    # Validate group
                    if len(group) >= 3:
                        group_scores = []
                        for i in range(len(group)):
                            for j in range(i + 1, len(group)):
                                pair = tuple(sorted([group[i], group[j]]))
                                if pair in match_matrix:
                                    group_scores.append(match_matrix[pair]['total_match_score'])
                        
                        if group_scores:
                            avg_score = sum(group_scores) / len(group_scores)
                            
                            if avg_score >= threshold:
                                # Prefer size 5, then 4, then 3
                                size_bonus = (len(group) - 3) * 5
                                weighted_score = avg_score + size_bonus
                                
                                if weighted_score > best_score:
                                    best_score = avg_score
                                    best_group = group
            
            # Create table if found
            if best_group:
                table = self._create_table(
                    db, session, participants_data, best_group,
                    match_matrix, table_number
                )
                tables.append(table)
                table_number += 1
                used_indices.update(best_group)
            else:
                break
        
        return tables
    
    def _form_groups_any_positive(
        self,
        db: Session,
        session: DaylightMatchingSession,
        participants_data: List[Dict],
        available_indices: List[int],
        match_matrix: Dict,
        start_table_number: int
    ) -> List[DaylightMatchingTable]:
        """Form groups with ANY positive compatibility (no threshold)"""
        
        tables = []
        used_indices = set()
        table_number = start_table_number
        
        while True:
            current_available = [i for i in available_indices if i not in used_indices]
            
            if len(current_available) < 3:
                break
            
            # Determine possible sizes
            possible_sizes = []
            if len(current_available) >= 5:
                possible_sizes = [5, 4, 3]
            elif len(current_available) >= 4:
                possible_sizes = [4, 3]
            else:
                possible_sizes = [3]
            
            best_group = None
            best_score = -1
            
            for target_size in possible_sizes:
                for seed_idx in current_available[:min(10, len(current_available))]:
                    group = [seed_idx]
                    candidates = [i for i in current_available if i != seed_idx]
                    
                    while len(group) < target_size and candidates:
                        best_next = None
                        best_next_score = -1
                        
                        for candidate in candidates:
                            scores = []
                            for member in group:
                                pair = tuple(sorted([member, candidate]))
                                if pair in match_matrix:
                                    scores.append(match_matrix[pair]['total_match_score'])
                            
                            if scores:
                                avg = sum(scores) / len(scores)
                                # Accept ANY positive score
                                if avg > 0 and avg > best_next_score:
                                    best_next_score = avg
                                    best_next = candidate
                        
                        if best_next is not None:
                            group.append(best_next)
                            candidates.remove(best_next)
                        else:
                            break
                    
                    if len(group) >= 3:
                        group_scores = []
                        for i in range(len(group)):
                            for j in range(i + 1, len(group)):
                                pair = tuple(sorted([group[i], group[j]]))
                                if pair in match_matrix:
                                    group_scores.append(match_matrix[pair]['total_match_score'])
                        
                        if group_scores:
                            avg_score = sum(group_scores) / len(group_scores)
                            
                            if avg_score > 0:  # ANY positive
                                size_bonus = (len(group) - 3) * 3
                                weighted_score = avg_score + size_bonus
                                
                                if weighted_score > best_score:
                                    best_score = avg_score
                                    best_group = group
            
            if best_group:
                table = self._create_table(
                    db, session, participants_data, best_group,
                    match_matrix, table_number
                )
                tables.append(table)
                table_number += 1
                used_indices.update(best_group)
            else:
                break
        
        return tables
    
    def _force_group_remaining(
        self,
        db: Session,
        session: DaylightMatchingSession,
        participants_data: List[Dict],
        remaining_indices: List[int],
        match_matrix: Dict,
        table_number: int
    ) -> Optional[DaylightMatchingTable]:
        """FORCE group remaining users regardless of compatibility"""
        
        if len(remaining_indices) < 3:
            return None
        
        # Take up to 5 remaining users
        force_group = remaining_indices[:min(5, len(remaining_indices))]
        
        # Calculate average (even if low)
        group_scores = []
        for i in range(len(force_group)):
            for j in range(i + 1, len(force_group)):
                pair = tuple(sorted([force_group[i], force_group[j]]))
                if pair in match_matrix:
                    group_scores.append(match_matrix[pair]['total_match_score'])
        
        avg_score = sum(group_scores) / len(group_scores) if group_scores else 30.0
        
        return self._create_table(
            db, session, participants_data, force_group,
            match_matrix, table_number
        )
    
    def _create_table(
        self,
        db: Session,
        session: DaylightMatchingSession,
        participants_data: List[Dict],
        group_indices: List[int],
        match_matrix: Dict,
        table_number: int
    ) -> DaylightMatchingTable:
        """Create a matching table and save scores"""
        
        # Prepare members data
        members_data = []
        for idx in group_indices:
            p = participants_data[idx]
            user = db.query(User).filter(User.id == p['user_id']).first()
            members_data.append({
                'user_id': p['user_id'],
                'username': user.username if user else '',
                'full_name': user.full_name if user else '',
                'archetype': p['test'].archetype,
                'archetype_symbol': p['test'].archetype_symbol,
                'profile_score': p['test'].profile_score
            })
        
        # Calculate average score
        group_scores = []
        for i in range(len(group_indices)):
            for j in range(i + 1, len(group_indices)):
                pair = tuple(sorted([group_indices[i], group_indices[j]]))
                if pair in match_matrix:
                    group_scores.append(match_matrix[pair]['total_match_score'])
        
        avg_score = sum(group_scores) / len(group_scores) if group_scores else 30.0
        
        # Create table
        table = DaylightMatchingTable(
            session_id=session.id,
            table_number=table_number,
            table_size=len(group_indices),
            average_match_score=avg_score,
            members_data=members_data
        )
        db.add(table)
        db.flush()
        
        # Save pairwise scores
        for i in range(len(group_indices)):
            for j in range(i + 1, len(group_indices)):
                idx1, idx2 = group_indices[i], group_indices[j]
                p1 = participants_data[idx1]
                p2 = participants_data[idx2]
                
                pair = tuple(sorted([idx1, idx2]))
                if pair in match_matrix:
                    score_data = match_matrix[pair]
                    
                    score = DaylightMatchingScore(
                        table_id=table.id,
                        user1_id=p1['user_id'],
                        user2_id=p2['user_id'],
                        **score_data
                    )
                    db.add(score)
        
        return table
    
    def get_matching_session(
        self, 
        db: Session, 
        session_id: int
    ) -> Optional[DaylightMatchingSession]:
        """Get matching session by ID"""
        return db.query(DaylightMatchingSession).filter(
            DaylightMatchingSession.id == session_id
        ).first()
    
    def get_all_matching_sessions(
        self, 
        db: Session, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[DaylightMatchingSession]:
        """Get all matching sessions"""
        return db.query(DaylightMatchingSession).order_by(
            desc(DaylightMatchingSession.created_at)
        ).offset(skip).limit(limit).all()

daylight_personality = CRUDDaylightPersonality()