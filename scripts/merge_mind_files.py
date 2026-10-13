import msgpack
import json
import os
import sys

DIRECTORY = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
scripts_dir = os.path.join(DIRECTORY, "scripts")

all_targets = []
total_batches = 9

print("Merging 9 batches into a single MindAR target file...")

for i in range(total_batches):
    batch_file = os.path.join(scripts_dir, f"batch_{i}.mind")
    if not os.path.exists(batch_file):
        print(f"Error: missing {batch_file}")
        sys.exit(1)
        
    with open(batch_file, "rb") as f:
        batch_bytes = f.read()
        
    data = msgpack.unpackb(batch_bytes, raw=False)
    batch_targets = data.get("dataList", [])
    print(f"Batch {i + 1}/9: loaded {len(batch_targets)} targets from {batch_file}")
    all_targets.extend(batch_targets)

print(f"\nTotal targets merged: {len(all_targets)}")
if len(all_targets) != 99:
    print(f"Warning: Expected 99 targets, got {len(all_targets)}")

# Pack combined object
combined_data = {
    "v": 2,
    "dataList": all_targets
}

packed_bytes = msgpack.packb(combined_data, use_bin_type=True)
print(f"Packed combined mind file size: {len(packed_bytes):,} bytes ({len(packed_bytes) / 1024 / 1024:.2f} MB)")

# Save to client/public/ar-targets/cards.mind
output_dir = os.path.join(DIRECTORY, "client", "public", "ar-targets")
os.makedirs(output_dir, exist_ok=True)
output_path = os.path.join(output_dir, "cards.mind")

with open(output_path, "wb") as f:
    f.write(packed_bytes)

print(f"SUCCESS! Wrote combined .mind file to: {output_path}")

# Verify file can be unpacked back
with open(output_path, "rb") as f:
    verify_data = msgpack.unpackb(f.read(), raw=False)

assert verify_data["v"] == 2
assert len(verify_data["dataList"]) == 99
print("Verification passed: cards.mind is fully valid with 99 targets and v=2!")
