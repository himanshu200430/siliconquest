"""
Step 6: Simulated Detection Test
Generates 20 realistic camera variants for each card (downscaled to 640px, perspective tilt,
lighting variation, blur, JPEG compression noise).
Runs detection against cards.v1.mind using MindAR 1.2.5 Controller in headless Edge.
Records per card: hit rate, average detection latency, and false match confusion pairs.
"""

import os
import sys
import cv2
import json
import time
import random
import numpy as np
import subprocess
import http.server
import threading

PORT = 8993
DIRECTORY = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
VARIANTS_DIR = os.path.join(DIRECTORY, "scripts", "detection", "simulated_variants")
os.makedirs(VARIANTS_DIR, exist_ok=True)

# Load cards.json and targetMap.json
with open(os.path.join(DIRECTORY, "scripts", "cards.json"), "r", encoding="utf-8") as f:
    cards = json.load(f)

with open(os.path.join(DIRECTORY, "client", "src", "data", "targetMap.json"), "r", encoding="utf-8") as f:
    target_map = json.load(f)

card_id_to_index = {item["id"]: int(idx) for idx, item in target_map.items()}

# Progress and result storage
simulation_finished = threading.Event()
simulation_result_data = None
simulation_progress = {"current": 0, "total": len(cards), "cardName": ""}

# 1. Custom HTTP Server with POST report handler
class SimulationHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def log_message(self, format, *args):
        pass  # Suppress request spam

    def do_POST(self):
        global simulation_result_data, simulation_progress
        if self.path == "/report_progress":
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length)
            try:
                progress = json.loads(body.decode("utf-8"))
                simulation_progress = progress
                print(f"[{progress['current']:2d}/{progress['total']}] Testing {progress['cardName']}... (Hit rate: {progress.get('hitRate', 0):.0f}%, Latency: {progress.get('latency', 0):.0f}ms)")
            except Exception as e:
                pass
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"OK")
        elif self.path == "/report_results":
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length)
            try:
                simulation_result_data = json.loads(body.decode("utf-8"))
                simulation_finished.set()
            except Exception as e:
                print("Error parsing report_results:", e)
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"OK")
        else:
            self.send_response(404)
            self.end_headers()

def run_server():
    server = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), SimulationHandler)
    server.serve_forever()

server_thread = threading.Thread(target=run_server, daemon=True)
server_thread.start()
print(f"Server running on http://127.0.0.1:{PORT}")

# 2. Generate 20 camera variants for cards
def generate_variants_for_card(card, num_variants=20):
    slug = os.path.basename(card["image"])
    src_path = os.path.join(DIRECTORY, "client", "public", "cards", slug)
    if not os.path.exists(src_path):
        return []
    
    src_img = cv2.imread(src_path)
    h, w = src_img.shape[:2]
    variants = []
    
    target_w = 640
    target_h = int(h * (target_w / w))
    resized = cv2.resize(src_img, (target_w, target_h), interpolation=cv2.INTER_AREA)
    
    for i in range(num_variants):
        v_name = f"{card['id']}_v{i:02d}.jpg"
        v_path = os.path.join(VARIANTS_DIR, v_name)
        
        # If already generated, reuse
        if not os.path.exists(v_path):
            pad = 50
            canvas_w = target_w + 2 * pad
            canvas_h = target_h + 2 * pad
            canvas = np.full((canvas_h, canvas_w, 3), 128, dtype=np.uint8)
            canvas[pad:pad + target_h, pad:pad + target_w] = resized
            
            # Perspective tilt up to 25 degrees (approx max delta ~ 40px)
            tilt_max = 40
            dx1, dy1 = random.randint(-tilt_max, tilt_max), random.randint(-tilt_max, tilt_max)
            dx2, dy2 = random.randint(-tilt_max, tilt_max), random.randint(-tilt_max, tilt_max)
            dx3, dy3 = random.randint(-tilt_max, tilt_max), random.randint(-tilt_max, tilt_max)
            dx4, dy4 = random.randint(-tilt_max, tilt_max), random.randint(-tilt_max, tilt_max)
            
            pts1 = np.float32([[pad, pad], [pad + target_w, pad], [pad + target_w, pad + target_h], [pad, pad + target_h]])
            pts2 = np.float32([[pad + dx1, pad + dy1], [pad + target_w + dx2, pad + dy2], [pad + target_w + dx3, pad + target_h + dy3], [pad + dx4, pad + target_h + dy4]])
            
            M = cv2.getPerspectiveTransform(pts1, pts2)
            warped = cv2.warpPerspective(canvas, M, (canvas_w, canvas_h), borderValue=(128, 128, 128))
            
            # Lighting variation
            alpha = random.uniform(0.8, 1.2)
            beta = random.randint(-15, 15)
            adjusted = cv2.convertScaleAbs(warped, alpha=alpha, beta=beta)
            
            # Slight blur
            if random.random() > 0.4:
                adjusted = cv2.GaussianBlur(adjusted, (3, 3), 0)
                
            # JPEG compression noise
            quality = random.randint(60, 85)
            _, encimg = cv2.imencode('.jpg', adjusted, [int(cv2.IMWRITE_JPEG_QUALITY), quality])
            final_img = cv2.imdecode(encimg, 1)
            cv2.imwrite(v_path, final_img)
            
        variants.append({
            "variantName": v_name,
            "url": f"/scripts/detection/simulated_variants/{v_name}"
        })
        
    return variants

# Generate simulation HTML test runner
def create_simulation_html(test_cards):
    test_data = []
    for c in test_cards:
        expected_idx = card_id_to_index[c["id"]]
        variants = generate_variants_for_card(c, num_variants=20)
        test_data.append({
            "cardId": c["id"],
            "name": c["name"],
            "tier": c["tier"],
            "expectedIndex": expected_idx,
            "variants": variants
        })
        
    test_json = json.dumps(test_data)
    
    html = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Simulated Detection Test</title>
  <script src="/scripts/msgpack.min.js"></script>
  <script src="/scripts/mindar-image-standalone.prod.js"></script>
</head>
<body>
<div id="status">Initializing...</div>
<div id="output"></div>
<script>
  async function runSimulation() {{
    const status = document.getElementById('status');
    const output = document.getElementById('output');
    try {{
      status.innerText = "Initializing MindAR Controller...";
      const controller = new window.MINDAR.IMAGE.Controller({{
        inputWidth: 700,
        inputHeight: 900,
        maxTrack: 1,
        warmupTolerance: 2,
        missTolerance: 8
      }});

      status.innerText = "Loading cards.v1.mind...";
      await controller.addImageTargets("/client/public/ar-targets/cards.v1.mind");

      const testData = {test_json};
      const results = [];
      const allCandidateIndexes = Array.from({{ length: 99 }}, (_, i) => i);

      for (let i = 0; i < testData.length; i++) {{
        const item = testData[i];
        status.innerText = "Testing card " + (i + 1) + "/" + testData.length + ": " + item.name;
        
        let hits = 0;
        let falseMatches = 0;
        let wrongMatchedIds = [];
        let totalLatencyMs = 0;

        for (let j = 0; j < item.variants.length; j++) {{
          const variant = item.variants[j];
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = variant.url;
          await new Promise((res, rej) => {{
            img.onload = res;
            img.onerror = () => rej(new Error("Failed to load: " + variant.url));
          }});

          const t0 = performance.now();
          const matchResult = await controller._detectAndMatch(img, allCandidateIndexes);
          const t1 = performance.now();
          const latency = t1 - t0;
          totalLatencyMs += latency;

          if (matchResult && matchResult.targetIndex === item.expectedIndex) {{
            hits++;
          }} else if (matchResult && matchResult.targetIndex !== -1) {{
            falseMatches++;
            wrongMatchedIds.push(matchResult.targetIndex);
          }}
        }}

        const hitRate = (hits / item.variants.length) * 100;
        const avgLatency = totalLatencyMs / item.variants.length;

        const cardResult = {{
          cardId: item.cardId,
          name: item.name,
          tier: item.tier,
          expectedIndex: item.expectedIndex,
          totalVariants: item.variants.length,
          hits: hits,
          hitRatePct: hitRate,
          avgLatencyMs: Math.round(avgLatency),
          falseMatches: falseMatches,
          wrongMatchedIndexes: wrongMatchedIds
        }};
        results.push(cardResult);

        // Report progress to Python
        fetch("/report_progress", {{
          method: "POST",
          headers: {{ "Content-Type": "application/json" }},
          body: JSON.stringify({{
            current: i + 1,
            total: testData.length,
            cardName: item.name,
            hitRate: hitRate,
            latency: avgLatency
          }})
        }}).catch(() => {{}});
      }}

      // Report final results
      await fetch("/report_results", {{
        method: "POST",
        headers: {{ "Content-Type": "application/json" }},
        body: JSON.stringify({{
          success: true,
          results: results
        }})
      }});
      status.innerText = "Simulation Complete";
    }} catch (err) {{
      await fetch("/report_results", {{
        method: "POST",
        headers: {{ "Content-Type": "application/json" }},
        body: JSON.stringify({{
          success: false,
          error: err.message + "\\nSTACK:\\n" + err.stack
        }})
      }});
      status.innerText = "Error: " + err.message;
    }}
  }}
  window.addEventListener('load', runSimulation);
</script>
</body>
</html>
"""
    html_path = os.path.join(DIRECTORY, "scripts", "detection", "run_simulation.html")
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html)
    return html_path

def main():
    print("Generating variants and building test harness...")
    create_simulation_html(cards)
    
    edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
    url = f"http://127.0.0.1:{PORT}/scripts/detection/run_simulation.html"
    
    print(f"\nLaunching headless Edge to run simulated detection across all {len(cards)} cards...")
    print(f"Total evaluations: {len(cards)} cards x 20 variants = {len(cards)*20} controller._detectAndMatch runs\n")
    
    cmd = [
        edge_path,
        "--headless=new",
        "--use-gl=angle",
        "--use-angle=swiftshader",
        url
    ]
    
    t0 = time.time()
    browser_proc = subprocess.Popen(cmd)
    
    # Wait for completion via threading.Event
    finished = simulation_finished.wait(timeout=900)  # up to 15 minutes
    elapsed = time.time() - t0
    
    try:
        browser_proc.kill()
    except Exception:
        pass
        
    if not finished:
        print(f"Error: Simulation timed out after {elapsed:.1f} seconds.")
        sys.exit(1)
        
    data = simulation_result_data
    if not data or not data.get("success"):
        print("Simulation error:", data.get("error") if data else "No data received")
        sys.exit(1)
        
    results = data["results"]
    results.sort(key=lambda x: x["hitRatePct"])
    
    avg_hit_rate = sum(x["hitRatePct"] for x in results) / len(results)
    avg_latency = sum(x["avgLatencyMs"] for x in results) / len(results)
    
    print(f"\n================== STEP 6 SIMULATION RESULTS ==================")
    print(f"Total cards tested: {len(results)}")
    print(f"Overall average hit rate: {avg_hit_rate:.1f}%")
    print(f"Average detection latency: {avg_latency:.1f} ms")
    print(f"Elapsed test time: {elapsed:.1f} s")
    
    print("\n--- WEAKEST 10 CARDS BY SIMULATED HIT RATE ---")
    for idx, c in enumerate(results[:10], 1):
        print(f"{idx:2d}. {c['name']} ({c['cardId']}, {c['tier']}): {c['hitRatePct']}% hit rate ({c['hits']}/{c['totalVariants']}), latency: {c['avgLatencyMs']}ms")
        
    print("\n--- HIGHEST 10 CARDS BY SIMULATED HIT RATE ---")
    for idx, c in enumerate(results[-10:], 1):
        print(f"{idx:2d}. {c['name']} ({c['cardId']}, {c['tier']}): {c['hitRatePct']}% hit rate ({c['hits']}/{c['totalVariants']}), latency: {c['avgLatencyMs']}ms")
        
    # Check for confusion pairs
    confusions = [c for c in results if c["falseMatches"] > 0]
    print(f"\n--- FALSE MATCHES / CONFUSIONS DETECTED: {len(confusions)} ---")
    for c in confusions:
        print(f"Card {c['name']} ({c['cardId']}) triggered false match on target index: {c['wrongMatchedIndexes']}")
        
    print("===============================================================\n")
    
    out_path = os.path.join(DIRECTORY, "scripts", "detection", "simulation_results_v1.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    print(f"Saved complete simulation report to {out_path}")

if __name__ == "__main__":
    main()
