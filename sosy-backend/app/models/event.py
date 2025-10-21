from sqlalchemy import Column, Integer, String, DateTime, Text, Numeric, BigInteger
from app.db.base import Base

class WordPressPost(Base):
    """WordPress Post Model - untuk event/product"""
    __tablename__ = "wprq_posts"
    
    ID = Column(BigInteger, primary_key=True)
    post_title = Column(Text, nullable=False)
    post_content = Column(Text)
    post_excerpt = Column(Text)
    post_status = Column(String(20), default='publish')
    post_type = Column(String(20), default='post')
    post_date = Column(DateTime)
    post_modified = Column(DateTime)
    
    __table_args__ = {'extend_existing': True}

class WooCommerceOrderItem(Base):
    """WooCommerce Order Items Model"""
    __tablename__ = "wprq_woocommerce_order_items"
    
    order_item_id = Column(BigInteger, primary_key=True)
    order_item_name = Column(Text, nullable=False)
    order_item_type = Column(String(200))
    order_id = Column(BigInteger, nullable=False)
    
    __table_args__ = {'extend_existing': True}

class WooCommerceOrder(Base):
    """WooCommerce Orders Model"""
    __tablename__ = "wprq_wc_orders"
    
    id = Column(BigInteger, primary_key=True)
    status = Column(String(20))
    currency = Column(String(10))
    total_amount = Column(Numeric(10, 2))
    customer_id = Column(BigInteger)
    billing_email = Column(String(320))
    payment_method = Column(String(100))
    payment_method_title = Column(Text)
    date_created_gmt = Column(DateTime)
    
    __table_args__ = {'extend_existing': True}