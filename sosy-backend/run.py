import os
import sys
import subprocess

# Set encoding
os.environ['PYTHONIOENCODING'] = 'utf-8'

def main():
    print("SOSY Backend API")
    print("=" * 50)
    
    # Get arguments
    host = sys.argv[1] if len(sys.argv) > 1 else "0.0.0.0"
    port = sys.argv[2] if len(sys.argv) > 2 else "8000"
    
    print(f"Starting server at http://{host}:{port}")
    print(f"API Docs: http://{host}:{port}/docs")
    print("Press Ctrl+C to stop")
    print("=" * 50)
    
    try:
        subprocess.run([
            "uvicorn",
            "app.main:app",
            f"--host={host}",
            f"--port={port}",
            "--reload"
        ])
    except KeyboardInterrupt:
        print("\nServer stopped")
    except FileNotFoundError:
        print("Error: uvicorn not found. Install with: pip install uvicorn")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()