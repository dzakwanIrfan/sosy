from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_, asc, desc, func
from app.models.user import User, WordPressUser
from app.schemas.user import UserCreate, UserUpdate

class CRUDUser:
    def get(self, db: Session, id: int) -> Optional[User]:
        return db.query(User).filter(User.id == id).first()
    
    def get_by_username(self, db: Session, username: str) -> Optional[User]:
        return db.query(User).filter(User.username == username).first()
    
    def get_by_email(self, db: Session, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email).first()
    
    def get_multi(
        self, 
        db: Session, 
        skip: int = 0, 
        limit: int = 100,
        search: Optional[str] = None,
        sort_by: Optional[str] = None,
        sort_order: Optional[str] = "asc",
        is_active: Optional[bool] = None,
        is_superuser: Optional[bool] = None
    ) -> Tuple[List[User], int]:
        """
        Get multiple users with advanced filtering, searching, sorting, and pagination
        Returns tuple of (users, total_count)
        """
        query = db.query(User)
        
        # Apply filters
        if is_active is not None:
            query = query.filter(User.is_active == is_active)
        
        if is_superuser is not None:
            query = query.filter(User.is_superuser == is_superuser)
        
        # Apply search
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    User.username.ilike(search_term),
                    User.email.ilike(search_term),
                    User.full_name.ilike(search_term)
                )
            )
        
        # Get total count before pagination
        total_count = query.count()
        
        # Apply sorting
        if sort_by:
            column = getattr(User, sort_by, None)
            if column:
                if sort_order.lower() == "desc":
                    query = query.order_by(desc(column))
                else:
                    query = query.order_by(asc(column))
        else:
            # Default sort by created_at desc
            query = query.order_by(desc(User.created_at))
        
        # Apply pagination
        users = query.offset(skip).limit(limit).all()
        
        return users, total_count
    
    def create(self, db: Session, obj_in: UserCreate) -> User:
        from app.core.security import get_password_hash
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
        from app.core.security import verify_password
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
    
    def get_multi(
        self, 
        db: Session, 
        skip: int = 0, 
        limit: int = 100,
        search: Optional[str] = None,
        sort_by: Optional[str] = None,
        sort_order: Optional[str] = "asc"
    ) -> Tuple[List[WordPressUser], int]:
        """
        Get multiple WordPress users with advanced filtering, searching, sorting, and pagination
        Returns tuple of (users, total_count)
        """
        query = db.query(WordPressUser)
        
        # Apply search
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    WordPressUser.user_login.ilike(search_term),
                    WordPressUser.user_email.ilike(search_term),
                    WordPressUser.display_name.ilike(search_term),
                    WordPressUser.user_nicename.ilike(search_term)
                )
            )
        
        # Get total count before pagination
        total_count = query.count()
        
        # Apply sorting
        if sort_by:
            column = getattr(WordPressUser, sort_by, None)
            if column:
                if sort_order.lower() == "desc":
                    query = query.order_by(desc(column))
                else:
                    query = query.order_by(asc(column))
        else:
            # Default sort by user_registered desc
            query = query.order_by(desc(WordPressUser.user_registered))
        
        # Apply pagination
        users = query.offset(skip).limit(limit).all()
        
        return users, total_count
    
    def search(self, db: Session, search_term: str, skip: int = 0, limit: int = 100) -> List[WordPressUser]:
        users, _ = self.get_multi(db, skip=skip, limit=limit, search=search_term)
        return users

user = CRUDUser()
wp_user = CRUDWordPressUser()