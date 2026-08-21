import os
import sys
import subprocess
import shutil

def run_command(args, cwd=None, shell=False):
    """Utility to run a command and stream the output to console."""
    print(f"Running: {' '.join(args)} in Cwd={cwd or '.'}")
    process = subprocess.Popen(args, cwd=cwd, shell=shell, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    while True:
        output = process.stdout.readline()
        if output == '' and process.poll() is not None:
            break
        if output:
            print(output.strip())
    rc = process.poll()
    if rc != 0:
        print(f"Command failed with exit code: {rc}")
        return False
    return True

def main():
    print("====================================================================")
    print("    Starting APEX INTELLIGENCE Prototype Bootstrapper")
    print("====================================================================")
    
    # 1. Install Backend dependencies
    print("\n[Step 1/4] Installing Python backend dependencies...")
    if not run_command([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"]):
        print("Backend installation failed. Please verify Python/pip settings.")
        sys.exit(1)
        
    # 2. Install Frontend Node modules
    print("\n[Step 2/4] Verifying frontend package dependencies...")
    frontend_dir = os.path.abspath("frontend")
    node_modules_dir = os.path.join(frontend_dir, "node_modules")
    
    if not os.path.exists(node_modules_dir):
        print("node_modules folder not found in frontend. Running 'npm install'...")
        # Use shell=True for windows npm resolution
        is_windows = sys.platform.startswith('win')
        if not run_command(["npm", "install"], cwd=frontend_dir, shell=is_windows):
            print("Frontend npm installation failed. Please verify Node/npm are on your PATH.")
            sys.exit(1)
    else:
        print("Frontend node_modules already present.")

    # 3. Build React Frontend assets
    print("\n[Step 3/4] Compiling React frontend production assets...")
    is_windows = sys.platform.startswith('win')
    if not run_command(["npm", "run", "build"], cwd=frontend_dir, shell=is_windows):
        print("Frontend compilation build failed.")
        sys.exit(1)
        
    # 4. Start FastAPI server
    print("\n[Step 4/4] Starting FastAPI backend on http://127.0.0.1:8000 ...")
    try:
        # We start uvicorn directly
        subprocess.run([sys.executable, "-m", "uvicorn", "backend.main:app", "--host", "127.0.0.1", "--port", "8000"], check=True)
    except KeyboardInterrupt:
        print("\nPipeline server stopped by user.")
    except Exception as e:
        print(f"\nServer crashed: {str(e)}")

if __name__ == "__main__":
    main()
