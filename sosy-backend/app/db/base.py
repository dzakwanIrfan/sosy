from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Local Database Engine (Read/Write)
local_engine = create_engine(
    settings.LOCAL_DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300
)

LocalSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=local_engine)

# WordPress Database Engine (Read Only)
wp_engine = create_engine(
    settings.WP_DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300
)

WPSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=wp_engine)

# Base class for models
Base = declarative_base()

# Dependency untuk local database
def get_local_db():
    db = LocalSessionLocal()
    try:
        yield db
    finally:
        db.close()

# Dependency untuk WordPress database
def get_wp_db():
    db = WPSessionLocal()
    try:
        yield db
    finally:
        db.close()