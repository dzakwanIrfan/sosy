from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.user import User, WordPressUser
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash, verify_password

class CRUDUser:
    def get(self, db: Session, id: int) -> Optional[User]:
        return db.query(User).filter(User.id == id).first()
    
    def get_by_username(self, db: Session, username: str) -> Optional[User]:
        return db.query(User).filter(User.username == username).first()
    
    def get_by_email(self, db: Session, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email).first()
    
    def get_multi(self, db: Session, skip: int = 0, limit: int = 100) -> List[User]:
        return db.query(User).offset(skip).limit(limit).all()
    
    def create(self, db: Session, obj_in: UserCreate) -> User:
        hashed_password = get_password_hash(obj_in.password)
        db_obj = User(
            username=obj_in.username,
            email=obj_in.email,
            hashed_password=hashed_password,
            full_name=obj_in.full_name
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def update(self, db: Session, db_obj: User, obj_in: UserUpdate) -> User:
        update_data = obj_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def delete(self, db: Session, id: int) -> Optional[User]:
        obj = db.query(User).get(id)
        if obj:
            db.delete(obj)
            db.commit()
        return obj
    
    def authenticate(self, db: Session, username: str, password: str) -> Optional[User]:
        user = self.get_by_username(db, username=username)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user

class CRUDWordPressUser:
    def get(self, db: Session, id: int) -> Optional[WordPressUser]:
        return db.query(WordPressUser).filter(WordPressUser.ID == id).first()
    
    def get_by_login(self, db: Session, user_login: str) -> Optional[WordPressUser]:
        return db.query(WordPressUser).filter(WordPressUser.user_login == user_login).first()
    
    def get_by_email(self, db: Session, email: str) -> Optional[WordPressUser]:
        return db.query(WordPressUser).filter(WordPressUser.user_email == email).first()
    
    def get_multi(self, db: Session, skip: int = 0, limit: int = 100) -> List[WordPressUser]:
        return db.query(WordPressUser).offset(skip).limit(limit).all()
    
    def search(self, db: Session, search_term: str, skip: int = 0, limit: int = 100) -> List[WordPressUser]:
        return db.query(WordPressUser).filter(
            or_(
                WordPressUser.user_login.contains(search_term),
                WordPressUser.user_email.contains(search_term),
                WordPressUser.display_name.contains(search_term)
            )
        ).offset(skip).limit(limit).all()

user = CRUDUser()
wp_user = CRUDWordPressUser()