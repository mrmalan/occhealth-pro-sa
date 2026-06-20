#!/usr/bin/env python3
"""deploy.py — commit and push occhealth-pro-sa to GitHub
Usage: python3 deploy.py "feat: your message here"
"""
import subprocess, sys, os

def run(cmd):
    r = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if r.returncode != 0:
        print(f"ERROR: {cmd}\n{r.stderr}")
        sys.exit(1)
    return r.stdout.strip()

msg = sys.argv[1] if len(sys.argv) > 1 else "chore: update"
os.chdir(os.path.dirname(os.path.abspath(__file__)))

print("Building...")
run("npm run build")
print("✓ Build clean")

run("git add -A")
result = subprocess.run("git diff --cached --quiet", shell=True)
if result.returncode == 0:
    print("Nothing to commit")
    sys.exit(0)

run(f'git commit -m "{msg}"')
run("git push origin main")
print(f"✓ Deployed: {msg}")
