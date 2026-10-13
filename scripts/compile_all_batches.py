import http.server
import socketserver
import threading
import subprocess
import json
import time
import os
import sys

PORT = 8999
DIRECTORY = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

# Load cards.json
with open(os.path.join(DIRECTORY, "scripts", "cards.json"), "r", encoding="utf-8") as f:
    cards = json.load(f)

print(f"Loaded {len(cards)} cards from cards.json")

# Start HTTP server
class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def log_message(self, format, *args):
        pass # Suppress logging

def run_server():
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        httpd.serve_forever()

server_thread = threading.Thread(target=run_server, daemon=True)
server_thread.start()
print(f"HTTP server running on http://127.0.0.1:{PORT}")

# HTML template for compilation batch
def create_compiler_html(batch_cards, batch_index):
    card_paths_json = json.dumps([f"/client/public{c['image']}" for c in batch_cards])
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
      const rawData = compiler.data; // Array of target objects
      const targetDataList = [];
      const statsList = [];

      for (let i = 0; i < rawData.length; i++) {{
        const target = rawData[i];
        let totalFeaturePoints = 0;
        let trackingScalePoints = [];
        if (target.trackingData) {{
          target.trackingData.forEach(scaleData => {{
            const count = scaleData.points ? scaleData.points.length : 0;
            totalFeaturePoints += count;
            trackingScalePoints.push({{ scale: scaleData.scale, count }});
          }});
        }}
        
        const matchingPoints = target.matchingData ? target.matchingData.length : 0;

        statsList.push({{
          cardId: cardIds[i],
          image: cardPaths[i],
          totalFeaturePoints,
          trackingScalePoints,
          matchingPoints
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

      // Encode targets using window.mindarEncode or msgpack
      const encodedBuffer = window.mindarEncode({{
        v: 2,
        dataList: targetDataList
      }});

      // Convert Uint8Array to base64 for transmission
      let binary = '';
      const bytes = new Uint8Array(encodedBuffer);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {{
        binary += String.fromCharCode(bytes[i]);
      }}
      const b64Data = window.btoa(binary);

      output.innerText = JSON.stringify({{
        success: true,
        batchIndex: {batch_index},
        numTargets: targetDataList.length,
        statsList,
        b64DataLength: b64Data.length,
        b64Data
      }});
      status.innerText = "DONE!";
    }} catch (err) {{
      status.innerText = "FAILED: " + err.message;
      output.innerText = JSON.stringify({{
        success: false,
        error: err.stack || err.message
      }});
    }}
  }}
  window.onload = run;
</script>
</body>
</html>
"""
    file_path = os.path.join(DIRECTORY, "scripts", f"compile_batch_{batch_index}.html")
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(html)
    return file_path

# Batch configuration: Compile in chunks of 11 cards (9 batches total = 99 cards)
BATCH_SIZE = 11
batches = [cards[i:i + BATCH_SIZE] for i in range(0, len(cards), BATCH_SIZE)]
print(f"Divided into {len(batches)} batches of {BATCH_SIZE} cards each.")

all_target_data_lists = []
all_stats_list = []

edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

for b_idx, batch in enumerate(batches):
    print(f"\n==========================================")
    print(f"Compiling Batch {b_idx + 1} / {len(batches)} ({len(batch)} cards)...")
    batch_cards_names = [c["name"] for c in batch]
    print(f"Cards: {', '.join(batch_cards_names)}")
    
    html_file = create_compiler_html(batch, b_idx)
    url = f"http://127.0.0.1:{PORT}/scripts/compile_batch_{b_idx}.html"
    
    cmd = [
        edge_path,
        "--headless=new",
        "--dump-dom",
        "--virtual-time-budget=60000",
        url
    ]
    
    t0 = time.time()
    res = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
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
        
    b64_data = data["b64Data"]
    import base64
    mind_bytes = base64.b64decode(b64_data)
    
    # Save batch mind file
    batch_mind_path = os.path.join(DIRECTORY, "scripts", f"batch_{b_idx}.mind")
    with open(batch_mind_path, "wb") as f:
        f.write(mind_bytes)
        
    print(f"Batch {b_idx + 1} completed in {elapsed:.1f}s. Saved {batch_mind_path} ({len(mind_bytes)} bytes)")
    
    # Also decode using python msgpack or collect stats
    all_stats_list.extend(data["statsList"])
    
print("\n==========================================")
print("All 9 batches successfully compiled!")

# Save tracking & matching statistics report
stats_path = os.path.join(DIRECTORY, "scripts", "compiler_stats.json")
with open(stats_path, "w", encoding="utf-8") as f:
    json.dump(all_stats_list, f, indent=2)

print(f"Saved feature point stats to {stats_path}")
