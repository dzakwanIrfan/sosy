import sys
import getpass
import os
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, text
from app.db.base import LocalSessionLocal, local_engine
from app.crud.user import user
from app.schemas.user import UserCreate
from app.models.user import User
from app.db.base import Base

# Set encoding untuk Windows
os.environ['PYTHONIOENCODING'] = 'utf-8'

def test_db_connection():
    """Test database connection"""
    try:
        with local_engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("[SUCCESS] Database connection successful")
            return True
    except Exception as e:
        print(f"[FAILED] Database connection failed: {e}")
        return False

def create_tables():
    """Create tables if they don't exist"""
    try:
        Base.metadata.create_all(bind=local_engine)
        print("[SUCCESS] Tables created/verified successfully")
        return True
    except Exception as e:
        print(f"[FAILED] Error creating tables: {e}")
        return False

def validate_password(password: str) -> bool:
    """Validate password requirements"""
    if len(password) < 6:
        print("[ERROR] Password must be at least 6 characters long")
        return False
    
    if len(password.encode('utf-8')) > 72:
        print("[WARNING] Password will be truncated to 72 bytes for bcrypt compatibility")
        
    return True

def create_superuser():
    print("=== Creating superuser for SOSY Backend ===")
    
    # Test database connection first
    if not test_db_connection():
        print("Please check your database configuration in .env file")
        return False
    
    # Create tables
    if not create_tables():
        print("Failed to create database tables")
        return False
    
    db = LocalSessionLocal()
    
    try:
        # Get user input
        print("\nEnter superuser details:")
        username = input("Username (default: admin): ").strip() or "admin"
        email = input("Email (default: admin@sosy.com): ").strip() or "admin@sosy.com"
        full_name = input("Full Name (default: System Administrator): ").strip() or "System Administrator"
        
        # Get password securely dengan validasi
        while True:
            password = getpass.getpass("Password (min 6 chars): ").strip()
            
            if not validate_password(password):
                continue
            
            confirm_password = getpass.getpass("Confirm Password: ").strip()
            if password != confirm_password:
                print("[ERROR] Passwords don't match. Please try again.")
                continue
            break
        
        # Check if user already exists
        existing_user = user.get_by_username(db, username=username)
        if existing_user:
            print(f"[FAILED] User '{username}' already exists!")
            return False
        
        existing_email = user.get_by_email(db, email=email)
        if existing_email:
            print(f"[FAILED] Email '{email}' already exists!")
            return False
        
        # Create superuser
        user_in = UserCreate(
            username=username,
            email=email,
            password=password,
            full_name=full_name
        )
        
        created_user = user.create(db, obj_in=user_in)
        
        # Make user superuser
        created_user.is_superuser = True
        created_user.is_active = True
        db.commit()
        
        print(f"[SUCCESS] Superuser '{created_user.username}' created successfully!")
        print(f"   Email: {created_user.email}")
        print(f"   Full Name: {created_user.full_name}")
        print(f"   ID: {created_user.id}")
        
        return True
        
    except Exception as e:
        print(f"[FAILED] Error creating superuser: {e}")
        print(f"[DEBUG] Error details: {type(e).__name__}: {str(e)}")
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    try:
        success = create_superuser()
        if success:
            print("\n=== Setup complete! ===")
            print("You can now start the FastAPI server:")
            print("uvicorn app.main:app --reload --host 0.0.0.0 --port 8000")
            print("\nLogin credentials:")
            print("Username: admin")
            print("Password: [your password]")
        else:
            print("\n[FAILED] Setup failed. Please check the errors above.")
            sys.exit(1)
    except KeyboardInterrupt:
        print("\n\nSetup cancelled by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\n[FAILED] Unexpected error: {e}")
        sys.exit(1)