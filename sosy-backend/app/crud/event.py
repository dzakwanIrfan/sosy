from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from app.models.event import WordPressPost, WooCommerceOrderItem, WooCommerceOrder
from app.models.user import WordPressUser

class CRUDEvent:
    def get_events(
        self,
        db: Session,
        skip: int = 0,
        limit: int = 10,
        search: Optional[str] = None,
        sort_by: str = "post_date",
        sort_order: str = "desc"
    ) -> Tuple[List[WordPressPost], int]:
        """
        Get published products (events) with pagination and search
        """
        query = db.query(WordPressPost).filter(
            and_(
                WordPressPost.post_status == 'publish',
                WordPressPost.post_type == 'product'
            )
        )
        
        # Search filter
        if search:
            search_filter = or_(
                WordPressPost.post_title.ilike(f"%{search}%"),
                WordPressPost.post_content.ilike(f"%{search}%"),
                WordPressPost.post_excerpt.ilike(f"%{search}%")
            )
            query = query.filter(search_filter)
        
        # Count total
        total_count = query.count()
        
        # Sorting
        if hasattr(WordPressPost, sort_by):
            order_column = getattr(WordPressPost, sort_by)
            if sort_order == "desc":
                query = query.order_by(order_column.desc())
            else:
                query = query.order_by(order_column.asc())
        
        # Pagination
        events = query.offset(skip).limit(limit).all()
        
        return events, total_count
    
    def get_event_by_id(self, db: Session, event_id: int) -> Optional[WordPressPost]:
        """
        Get single event by ID
        """
        return db.query(WordPressPost).filter(
            and_(
                WordPressPost.ID == event_id,
                WordPressPost.post_status == 'publish',
                WordPressPost.post_type == 'product'
            )
        ).first()
    
    def get_event_buyers(
        self,
        db: Session,
        event_id: int
    ) -> List[dict]:
        """
        Get buyers for specific event
        """
        # First, get the event
        event = self.get_event_by_id(db, event_id)
        if not event:
            return []
        
        # Query to join all tables and get buyers
        query = db.query(
            WordPressUser.ID.label('user_id'),
            WordPressUser.user_login,
            WordPressUser.user_email,
            WordPressUser.display_name,
            WooCommerceOrder.id.label('order_id'),
            WooCommerceOrder.status.label('order_status'),
            WooCommerceOrder.total_amount,
            WooCommerceOrder.payment_method_title,
            WooCommerceOrder.date_created_gmt.label('date_created')
        ).join(
            WooCommerceOrder,
            WordPressUser.ID == WooCommerceOrder.customer_id
        ).join(
            WooCommerceOrderItem,
            WooCommerceOrder.id == WooCommerceOrderItem.order_id
        ).filter(
            and_(
                WooCommerceOrderItem.order_item_name == event.post_title,
                or_(
                    WooCommerceOrder.status == 'wc-processing',
                    WooCommerceOrder.status == 'wc-completed'
                )
            )
        ).distinct()
        
        buyers = query.all()
        
        # Convert to list of dicts
        result = []
        for buyer in buyers:
            result.append({
                'user_id': buyer.user_id,
                'user_login': buyer.user_login,
                'user_email': buyer.user_email,
                'display_name': buyer.display_name,
                'order_id': buyer.order_id,
                'order_status': buyer.order_status,
                'total_amount': float(buyer.total_amount) if buyer.total_amount else None,
                'payment_method_title': buyer.payment_method_title,
                'date_created': buyer.date_created
            })
        
        return result

event = CRUDEvent()