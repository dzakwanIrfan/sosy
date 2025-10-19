import os
from pathlib import Path

def create_directory_structure():
    """Create proper directory structure"""
    
    # Directories to create
    directories = [
        "app",
        "app/api",
        "app/api/v1", 
        "app/api/v1/endpoints",
        "app/api/auth",
        "app/core",
        "app/models",
        "app/schemas",
        "app/crud", 
        "app/db",
        "app/utils"
    ]
    
    # Create directories
    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)
        print(f"Created directory: {directory}")
    
    # Create __init__.py files
    init_files = [
        "app/__init__.py",
        "app/api/__init__.py", 
        "app/api/v1/__init__.py",
        "app/api/v1/endpoints/__init__.py",
        "app/api/auth/__init__.py",
        "app/core/__init__.py",
        "app/models/__init__.py",
        "app/schemas/__init__.py",
        "app/crud/__init__.py",
        "app/db/__init__.py",
        "app/utils/__init__.py"
    ]
    
    for init_file in init_files:
        Path(init_file).touch()
        print(f"Created file: {init_file}")
    
    print("\n✅ Directory structure created successfully!")

def check_current_structure():
    """Check current directory structure"""
    print("Current directory structure:")
    print("=" * 50)
    
    for root, dirs, files in os.walk("app"):
        level = root.replace("app", "").count(os.sep)
        indent = " " * 2 * level
        print(f"{indent}{os.path.basename(root)}/")
        subindent = " " * 2 * (level + 1)
        for file in files:
            print(f"{subindent}{file}")

if __name__ == "__main__":
    print("🔧 Fixing directory structure...")
    check_current_structure()
    print("\n" + "=" * 50)
    create_directory_structure()
    print("\n" + "=" * 50)
    check_current_structure()