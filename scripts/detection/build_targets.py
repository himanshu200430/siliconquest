"""
Complete Pipeline Runner: build_targets.py
Invoked via `npm run build:targets`.
Reproducibly executes:
1. Step 2: Extraction & Verification from PDF
2. Step 3: Tight Artwork Cropping & Logo Inpainting
3. Step 4: MindAR 1.2.5 Target Compilation
4. Step 5: Feature Audit & Coverage Analysis
"""

import subprocess
import sys
import os

SCRIPTS_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(SCRIPTS_DIR, "..", ".."))

def run_step(step_name, script_path):
    print(f"\n========================================================")
    print(f"🚀 RUNNING: {step_name}")
    print(f"========================================================")
    res = subprocess.run([sys.executable, script_path], cwd=ROOT_DIR)
    if res.returncode != 0:
        print(f"❌ ERROR: {step_name} failed with exit code {res.returncode}")
        sys.exit(res.returncode)
    print(f"✅ COMPLETED: {step_name}\n")

def main():
    print("========================================================")
    print("   SILICONQUEST AR TARGET DETECTION COMPILATION PIPELINE")
    print("========================================================")
    
    run_step("Step 2: Extract & Verify from PDF", os.path.join(SCRIPTS_DIR, "step2_extract.py"))
    run_step("Step 3: Crop Artwork & Inpaint Logo", os.path.join(SCRIPTS_DIR, "step3_build_compile_images.py"))
    run_step("Step 4: Compile MindAR 1.2.5 Targets", os.path.join(SCRIPTS_DIR, "step4_compile.py"))
    run_step("Step 5: Feature Audit & Spatial Coverage", os.path.join(SCRIPTS_DIR, "step5_audit.py"))
    
    print("========================================================")
    print("🎉 ALL TARGETS BUILT & VERIFIED SUCCESSFULLY!")
    print("Combined target file: client/public/ar-targets/cards.v1.mind")
    print("Active target map: client/src/data/targetMap.json")
    print("Audit report: scripts/detection/audit_report_v1.json")
    print("========================================================")

if __name__ == "__main__":
    main()
