from typing import Optional, List, Dict
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
from app.models.personality_test import TQBUser, TQBUserAnswer, TGEAnswer, TGEQuestion

class CRUDPersonalityTest:
    def check_user_has_test(
        self, 
        db: Session, 
        wp_user_id: int
    ) -> Optional[Dict]:
        """
        Check if WordPress user has completed personality test
        Returns the latest completed test
        """
        latest_test = db.query(TQBUser).filter(
            and_(
                TQBUser.wp_user_id == wp_user_id,
                TQBUser.completed_quiz == True,
                TQBUser.wp_user_id != 0
            )
        ).order_by(desc(TQBUser.date_finished)).first()
        
        if not latest_test:
            return None
        
        # Count total answers
        total_answers = db.query(TQBUserAnswer).filter(
            TQBUserAnswer.user_id == latest_test.id
        ).count()
        
        return {
            'has_completed': True,
            'latest_test_id': latest_test.id,
            'date_finished': latest_test.date_finished,
            'total_answers': total_answers
        }
    
    def get_user_personality_test(
        self, 
        db: Session, 
        wp_user_id: int
    ) -> Optional[Dict]:
        """
        Get complete personality test result for a WordPress user
        Returns the latest completed test with all answers
        """
        # Get latest completed test
        latest_test = db.query(TQBUser).filter(
            and_(
                TQBUser.wp_user_id == wp_user_id,
                TQBUser.completed_quiz == True,
                TQBUser.wp_user_id != 0
            )
        ).order_by(desc(TQBUser.date_finished)).first()
        
        if not latest_test:
            return None
        
        # Get all user answers with question and answer details
        user_answers = db.query(
            TQBUserAnswer.question_id,
            TQBUserAnswer.answer_id,
            TQBUserAnswer.answer_text.label('custom_answer_text'),
            TGEQuestion.text.label('question_text'),
            TGEQuestion.description.label('question_description'),
            TGEAnswer.text.label('answer_text'),
            TGEAnswer.points.label('answer_points'),
            TGEAnswer.feedback.label('answer_feedback')
        ).join(
            TGEQuestion,
            TQBUserAnswer.question_id == TGEQuestion.id
        ).join(
            TGEAnswer,
            TQBUserAnswer.answer_id == TGEAnswer.id
        ).filter(
            TQBUserAnswer.user_id == latest_test.id
        ).order_by(TQBUserAnswer.question_id).all()
        
        # Calculate total points
        total_points = sum([ans.answer_points or 0 for ans in user_answers])
        
        # Format answers
        formatted_answers = []
        for ans in user_answers:
            formatted_answers.append({
                'question_id': ans.question_id,
                'question_text': ans.question_text,
                'question_description': ans.question_description,
                'answer_id': ans.answer_id,
                'answer_text': ans.answer_text,
                'answer_points': ans.answer_points,
                'answer_feedback': ans.answer_feedback,
                'custom_answer_text': ans.custom_answer_text
            })
        
        return {
            'quiz_id': latest_test.quiz_id,
            'date_started': latest_test.date_started,
            'date_finished': latest_test.date_finished,
            'total_points': total_points,
            'answers': formatted_answers
        }
    
    def get_test_by_tqb_user_id(
        self, 
        db: Session, 
        tqb_user_id: int
    ) -> Optional[Dict]:
        """
        Get personality test by TQB User ID (alternative method)
        """
        test = db.query(TQBUser).filter(
            and_(
                TQBUser.id == tqb_user_id,
                TQBUser.completed_quiz == True
            )
        ).first()
        
        if not test:
            return None
        
        # Get all user answers
        user_answers = db.query(
            TQBUserAnswer.question_id,
            TQBUserAnswer.answer_id,
            TQBUserAnswer.answer_text.label('custom_answer_text'),
            TGEQuestion.text.label('question_text'),
            TGEQuestion.description.label('question_description'),
            TGEAnswer.text.label('answer_text'),
            TGEAnswer.points.label('answer_points'),
            TGEAnswer.feedback.label('answer_feedback')
        ).join(
            TGEQuestion,
            TQBUserAnswer.question_id == TGEQuestion.id
        ).join(
            TGEAnswer,
            TQBUserAnswer.answer_id == TGEAnswer.id
        ).filter(
            TQBUserAnswer.user_id == tqb_user_id
        ).order_by(TQBUserAnswer.question_id).all()
        
        # Calculate total points
        total_points = sum([ans.answer_points or 0 for ans in user_answers])
        
        # Format answers
        formatted_answers = []
        for ans in user_answers:
            formatted_answers.append({
                'question_id': ans.question_id,
                'question_text': ans.question_text,
                'question_description': ans.question_description,
                'answer_id': ans.answer_id,
                'answer_text': ans.answer_text,
                'answer_points': ans.answer_points,
                'answer_feedback': ans.answer_feedback,
                'custom_answer_text': ans.custom_answer_text
            })
        
        return {
            'quiz_id': test.quiz_id,
            'date_started': test.date_started,
            'date_finished': test.date_finished,
            'total_points': total_points,
            'answers': formatted_answers
        }

personality_test = CRUDPersonalityTest()