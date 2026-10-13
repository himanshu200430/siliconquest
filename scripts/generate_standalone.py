import os

with open("scripts/mindar-image-aframe.prod.js", "rb") as f:
    orig_bytes = f.read()

pos_split = 1752326
base_bytes = orig_bytes[:pos_split]

# 1. Replace Xc (which calls requestAnimationFrame via $T) with immediate Promise
xc_target = b'function Xc(){return new Promise(n=>$T(()=>n()))}'
xc_repl   = b'function Xc(){return Promise.resolve()}'
base_bytes = base_bytes.replace(xc_target, xc_repl)

# 2. Extract worker code and inline it into W_
with open("scripts/worker.js", "r", encoding="utf-8") as f:
    worker_code = f.read()

base_part = base_bytes.decode("utf-8")

idx = base_part.rfind("function W_")
end = base_part.find("class ZI extends E_", idx)

new_w = """function W_(){
  this.onmessage = null;
  this.postMessage = function(msg) {
    if (msg.type === "compile") {
      const _workerSelf = this;
      function postMessage(res) {
        if (_workerSelf.onmessage) _workerSelf.onmessage({ data: res });
      }
      (function(){
""" + worker_code + """
        if (typeof onmessage === "function") {
          onmessage({ data: msg });
        }
      })();
    }
  };
}"""

fixed = base_part[:idx] + new_w + base_part[end:] + "window.mindarEncode = I_; window.mindarDecode = L_; window.MINDAR_READY=true;})();"

with open("scripts/mindar-image-standalone.prod.js", "w", encoding="utf-8") as f:
    f.write(fixed)

print("Generated clean mindar-image-standalone.prod.js with synchronous Xc and W_!")
