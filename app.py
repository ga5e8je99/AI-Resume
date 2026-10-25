import os
import sys
import subprocess
import shutil
import urllib.request
import tarfile
import time

print("=" * 60, flush=True)
print("🚀 Starting JobMatch AI Production Server on Hugging Face Spaces", flush=True)
print("=" * 60, flush=True)

NODE_VERSION = "v20.18.0"
NODE_DIR = os.path.abspath(".node")

def ensure_node():
    """Ensure Node.js v20+ is available on PATH."""
    node_bin = shutil.which("node")
    if node_bin:
        try:
            ver = subprocess.run(["node", "-v"], capture_output=True, text=True, check=True).stdout.strip()
            print(f"✅ Found existing Node.js: {ver} at {node_bin}", flush=True)
            return
        except Exception:
            pass

    print(f"📦 Installing portable Node.js {NODE_VERSION} (Linux x64)...", flush=True)
    tar_url = f"https://nodejs.org/dist/{NODE_VERSION}/node-{NODE_VERSION}-linux-x64.tar.xz"
    tar_path = "/tmp/node.tar.xz"
    
    try:
        urllib.request.urlretrieve(tar_url, tar_path)
        os.makedirs(NODE_DIR, exist_ok=True)
        subprocess.run(["tar", "-xJf", tar_path, "-C", NODE_DIR, "--strip-components=1"], check=True)
        print("✅ Node.js extracted successfully.", flush=True)
    except Exception as e:
        print(f"❌ Failed to download/extract Node.js: {e}", flush=True)
        sys.exit(1)

    node_bin_dir = os.path.join(NODE_DIR, "bin")
    os.environ["PATH"] = f"{node_bin_dir}:" + os.environ.get("PATH", "")
    
    ver = subprocess.run(["node", "-v"], capture_output=True, text=True).stdout.strip()
    npm_ver = subprocess.run(["npm", "-v"], capture_output=True, text=True).stdout.strip()
    print(f"✅ Active Node.js: {ver} | npm: {npm_ver}", flush=True)

# 1. Setup Node runtime
ensure_node()

# 2. Install npm dependencies if needed
if not os.path.exists("node_modules"):
    print("📦 Installing npm dependencies (npm ci)...", flush=True)
    subprocess.run(["npm", "ci", "--prefer-offline", "--no-audit"], check=True)
    print("✅ Dependencies installed successfully.", flush=True)
else:
    print("✅ node_modules found.", flush=True)

# 3. Build Next.js application if .next does not exist
if not os.path.exists(".next"):
    print("⚙️ Building Next.js production bundle (npm run build)...", flush=True)
    env = os.environ.copy()
    env["NEXT_TELEMETRY_DISABLED"] = "1"
    env["NODE_ENV"] = "production"
    subprocess.run(["npm", "run", "build"], env=env, check=True)
    print("✅ Next.js build completed successfully.", flush=True)
else:
    print("✅ .next build directory found.", flush=True)

# 4. Launch Next.js production server on port 7860
PORT = os.environ.get("PORT", "7860")
HOST = "0.0.0.0"

print(f"🌐 Launching Next.js server on http://{HOST}:{PORT}...", flush=True)
env = os.environ.copy()
env["PORT"] = str(PORT)
env["HOSTNAME"] = HOST
env["NODE_ENV"] = "production"
env["NEXT_TELEMETRY_DISABLED"] = "1"

# Run next start on port 7860 and stream logs
proc = subprocess.Popen(
    ["npm", "run", "start", "--", "-p", str(PORT)],
    env=env,
    stdout=sys.stdout,
    stderr=sys.stderr
)

# Keep the parent Python process alive while Next.js runs
try:
    proc.wait()
except KeyboardInterrupt:
    print("Shutting down...", flush=True)
    proc.terminate()
