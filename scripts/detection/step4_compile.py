"""
Step 4: Compile MindAR 1.2.5 Targets
Compiles all 99 cards from client/public/cards-compile/ into client/public/ar-targets/cards.v1.mind.
Extracts target data, feature points, coordinates, and tracking scale points.
Generates client/src/data/targetMap.json.
"""

import http.server
import socketserver
import threading
import subprocess
import json
import time
import os
import sys
import base64
import msgpack

PORT = 8991
DIRECTORY = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
BATCH_SIZE = 11

# Load targetMap / cards.json
with open(os.path.join(DIRECTORY, "scripts", "cards.json"), "r", encoding="utf-8") as f:
    cards = json.load(f)

print(f"Loaded {len(cards)} cards from cards.json")

# Start HTTP server
class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def log_message(self, format, *args):
        pass

def run_server():
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        httpd.serve_forever()

server_thread = threading.Thread(target=run_server, daemon=True)
server_thread.start()
print(f"HTTP server running on http://127.0.0.1:{PORT}")

def create_compiler_html(batch_cards, batch_index):
    card_paths_json = json.dumps([f"/client/public/cards-compile/{os.path.basename(c['image'])}" for c in batch_cards])
    card_ids_json = json.dumps([c['id'] for c in batch_cards])
    
    html = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Batch Compiler {batch_index}</title>
  <script src="/scripts/msgpack.min.js"></script>
  <script src="/scripts/mindar-image-standalone.prod.js"></script>
</head>
<body>
<div id="status">Starting...</div>
<div id="output"></div>
<script>
  async function run() {{
    const status = document.getElementById('status');
    const output = document.getElementById('output');
    try {{
      const cardPaths = {card_paths_json};
      const cardIds = {card_ids_json};
      
      status.innerText = "Loading " + cardPaths.length + " card images...";
      const images = [];
      for (let i = 0; i < cardPaths.length; i++) {{
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = cardPaths[i];
        await new Promise((res, rej) => {{
          img.onload = res;
          img.onerror = () => rej(new Error("Failed loading image: " + cardPaths[i]));
        }});
        images.push(img);
      }}

      status.innerText = "Compiling images...";
      const compiler = new window.MINDAR.IMAGE.Compiler();
      await compiler.compileImageTargets(images, (progress) => {{
        status.innerText = "Progress: " + progress.toFixed(1) + "%";
      }});

      status.innerText = "Extracting data...";
      const rawData = compiler.data;
      const targetDataList = [];
      const statsList = [];

      for (let i = 0; i < rawData.length; i++) {{
        const target = rawData[i];
        let totalFeaturePoints = 0;
        let trackingScalePoints = [];
        let allPointsList = [];

        if (target.trackingData) {{
          target.trackingData.forEach(scaleData => {{
            const count = scaleData.points ? scaleData.points.length : 0;
            totalFeaturePoints += count;
            trackingScalePoints.push({{ scale: scaleData.scale, count }});
            if (scaleData.points) {{
              scaleData.points.forEach(pt => {{
                allPointsList.push({{ x: pt.x, y: pt.y, scale: scaleData.scale }});
              }});
            }}
          }});
        }}
        
        const matchingPoints = target.matchingData ? target.matchingData.length : 0;

        statsList.push({{
          cardId: cardIds[i],
          image: cardPaths[i],
          targetWidth: target.targetImage.width,
          targetHeight: target.targetImage.height,
          totalFeaturePoints,
          trackingScalePoints,
          matchingPoints,
          points: allPointsList
        }});

        targetDataList.push({{
          targetImage: {{
            width: target.targetImage.width,
            height: target.targetImage.height
          }},
          trackingData: target.trackingData,
          matchingData: target.matchingData
        }});
      }}

      // Pack targetDataList
      const packed = window.msgpack.encode({{
        v: 2,
        dataList: targetDataList
      }});

      // Convert Uint8Array to base64
      let binary = '';
      const bytes = new Uint8Array(packed);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {{
        binary += String.fromCharCode(bytes[i]);
      }}
      const b64Data = window.btoa(binary);

      output.innerText = JSON.stringify({{
        success: true,
        stats: statsList,
        b64Data: b64Data
      }});
      status.innerText = "Done";
    }} catch (err) {{
      output.innerText = JSON.stringify({{
        success: false,
        error: err.message
      }});
      status.innerText = "Error: " + err.message;
    }}
  }}
  window.addEventListener('load', run);
</script>
</body>
</html>
"""
    html_path = os.path.join(DIRECTORY, "scripts", "detection", f"compile_v1_batch_{batch_index}.html")
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html)
    return html_path

batches = [cards[i:i + BATCH_SIZE] for i in range(0, len(cards), BATCH_SIZE)]
print(f"Divided into {len(batches)} batches of {BATCH_SIZE} cards each.")

all_targets = []
all_stats = []

edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

for b_idx, batch in enumerate(batches):
    print(f"\n==========================================")
    print(f"Compiling Batch {b_idx + 1} / {len(batches)} ({len(batch)} cards)...")
    batch_cards_names = [c["name"] for c in batch]
    print(f"Cards: {', '.join(batch_cards_names)}")
    
    html_file = create_compiler_html(batch, b_idx)
    url = f"http://127.0.0.1:{PORT}/scripts/detection/compile_v1_batch_{b_idx}.html"
    
    cmd = [
        edge_path,
        "--headless=new",
        "--dump-dom",
        "--virtual-time-budget=60000",
        url
    ]
    
    t0 = time.time()
    res = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=120)
    elapsed = time.time() - t0
    
    dom = res.stdout
    if '<div id="output">' not in dom:
        print(f"Error: No output div found in DOM for batch {b_idx}")
        print("DOM output snippet:", dom[:500])
        sys.exit(1)
        
    start_tag = '<div id="output">'
    end_tag = '</div>'
    out_start = dom.find(start_tag) + len(start_tag)
    out_end = dom.find(end_tag, out_start)
    json_str = dom[out_start:out_end].strip()
    
    try:
        data = json.loads(json_str)
    except Exception as e:
        print(f"Failed to parse JSON for batch {b_idx}: {e}")
        print("Raw output:", json_str[:500])
        sys.exit(1)
        
    if not data.get("success"):
        print(f"Compilation error in batch {b_idx}: {data.get('error')}")
        sys.exit(1)
        
    all_stats.extend(data["stats"])
    b64_data = data["b64Data"]
    mind_bytes = base64.b64decode(b64_data)
    batch_unpacked = msgpack.unpackb(mind_bytes, raw=False)
    all_targets.extend(batch_unpacked["dataList"])
    
    print(f"Batch {b_idx + 1} completed in {elapsed:.1f}s. Loaded {len(batch_unpacked['dataList'])} targets.")

print(f"\n==========================================")
print(f"Total targets compiled: {len(all_targets)} / 99")

# Pack combined cards.v1.mind
combined_data = {
    "v": 2,
    "dataList": all_targets
}
v1_bytes = msgpack.packb(combined_data, use_bin_type=True)
v1_path = os.path.join(DIRECTORY, "client", "public", "ar-targets", "cards.v1.mind")
with open(v1_path, "wb") as f:
    f.write(v1_bytes)
    
file_size_mb = len(v1_bytes) / 1024 / 1024
print(f"SUCCESS! Wrote cards.v1.mind: {len(v1_bytes):,} bytes ({file_size_mb:.2f} MB)")

# Also save copy as cards.mind for active scene consumption
default_mind_path = os.path.join(DIRECTORY, "client", "public", "ar-targets", "cards.mind")
with open(default_mind_path, "wb") as f:
    f.write(v1_bytes)
print(f"Updated active cards.mind with v1 compiled targets.")

# Save targetMap.json (mapping targetIndex 0..98 to cardId)
target_map = {}
for idx, card in enumerate(cards):
    target_map[str(idx)] = {
        "id": card["id"],
        "name": card["name"],
        "series": card.get("series", ""),
        "tier": card["tier"],
        "value": card["value"],
        "image": f"/cards/{os.path.basename(card['image'])}"
    }

target_map_path = os.path.join(DIRECTORY, "client", "src", "data", "targetMap.json")
with open(target_map_path, "w", encoding="utf-8") as f:
    json.dump(target_map, f, indent=2)
print(f"Saved targetMap.json with {len(target_map)} targets.")

# Save feature audit stats for Step 5
stats_path = os.path.join(DIRECTORY, "scripts", "detection", "feature_audit_v1.json")
with open(stats_path, "w", encoding="utf-8") as f:
    json.dump(all_stats, f, indent=2)
print(f"Saved feature audit stats to {stats_path}")
