path = r'C:/Users/KimRipia/Downloads/timetracker_23/timetracker/index.html'
with open(path, 'r', encoding='utf-8') as f:
    html = f.read()

# ── 1. Reduce select opacity per theme (inputs stay as-is) ───────────────────
# Add separate select rules with lower opacity after each combined rule

replacements = [
    # space: selects 0.75 → 0.52
    ('body.space .field input,body.space .field select{background:rgba(15,10,45,0.75);border-color:rgba(100,80,200,0.45);color:#d8d8ff;}',
     'body.space .field input{background:rgba(15,10,45,0.75);border-color:rgba(100,80,200,0.45);color:#d8d8ff;}body.space .field select{background:rgba(15,10,45,0.50);border-color:rgba(100,80,200,0.38);color:#d8d8ff;}'),
    # sakura: selects 0.60 → 0.42
    ('body.sakura .field input,body.sakura .field select{background:rgba(255,240,248,0.60);border-color:rgba(200,130,160,0.50);color:#2d1420;}',
     'body.sakura .field input{background:rgba(255,240,248,0.60);border-color:rgba(200,130,160,0.50);color:#2d1420;}body.sakura .field select{background:rgba(255,240,248,0.40);border-color:rgba(200,130,160,0.38);color:#2d1420;}'),
    # woodland: selects 0.88 → 0.55
    ('body.woodland .field input,body.woodland .field select{background:rgba(18,50,22,0.88);border-color:rgba(80,165,80,0.55);color:#e8f8e4;}',
     'body.woodland .field input{background:rgba(18,50,22,0.88);border-color:rgba(80,165,80,0.55);color:#e8f8e4;}body.woodland .field select{background:rgba(18,50,22,0.55);border-color:rgba(80,165,80,0.42);color:#e8f8e4;}'),
    # aurora: selects 0.90 → 0.55
    ('body.aurora .field input,body.aurora .field select{background:rgba(6,20,38,0.90);border-color:rgba(0,200,155,0.48);color:#e0f8f4;}',
     'body.aurora .field input{background:rgba(6,20,38,0.90);border-color:rgba(0,200,155,0.48);color:#e0f8f4;}body.aurora .field select{background:rgba(6,20,38,0.55);border-color:rgba(0,200,155,0.35);color:#e0f8f4;}'),
    # castle: selects 0.88 → 0.55
    ('body.castle .field input,body.castle .field select{background:rgba(40,18,8,0.88);border-color:rgba(200,120,30,0.55);color:#ffe8c8;}',
     'body.castle .field input{background:rgba(40,18,8,0.88);border-color:rgba(200,120,30,0.55);color:#ffe8c8;}body.castle .field select{background:rgba(40,18,8,0.55);border-color:rgba(200,120,30,0.40);color:#ffe8c8;}'),
]

for old, new in replacements:
    if old in html:
        html = html.replace(old, new)
        print("Fixed:", old[:50])
    else:
        print("NOT FOUND:", old[:50])

# ── 2. Put Start and End side by side ────────────────────────────────────────
old_startend = (
    '<div class="field"><label>Start</label>'
    '<input id="start" type="text" placeholder="09:00" maxlength="5" oninput="window.fmtT(this)"></div>\n'
    '      <div class="field"><label>End</label>'
    '<input id="end" type="text" placeholder="10:30" maxlength="5" oninput="window.fmtT(this)"></div>'
)
new_startend = (
    '<div style="display:flex;gap:6px;">'
    '<div class="field" style="flex:1;"><label>Start</label>'
    '<input id="start" type="text" placeholder="09:00" maxlength="5" oninput="window.fmtT(this)"></div>'
    '<div class="field" style="flex:1;"><label>End</label>'
    '<input id="end" type="text" placeholder="10:30" maxlength="5" oninput="window.fmtT(this)"></div>'
    '</div>'
)

if old_startend in html:
    html = html.replace(old_startend, new_startend)
    print("Start/End side by side: done")
else:
    print("Start/End pattern not found — trying flexible match...")
    import re
    m = re.search(
        r'<div class="field"><label>Start</label>.*?fmtT\(this\)"></div>\s*'
        r'<div class="field"><label>End</label>.*?fmtT\(this\)"></div>',
        html, re.DOTALL
    )
    if m:
        html = html[:m.start()] + new_startend + html[m.end():]
        print("Start/End side by side: done (regex)")
    else:
        print("Still not found")

with open(path, 'w', encoding='utf-8') as f:
    f.write(html)

# Syntax check
import re as re2, subprocess
scripts = re2.findall(r'<script>(.*?)</script>', html, re2.DOTALL)
with open(r'C:/Users/KimRipia/Downloads/timetracker_23/timetracker/_check.js', 'w', encoding='utf-8') as f:
    f.write(scripts[0])
result = subprocess.run(['node', '-e',
    'try{new Function(require("fs").readFileSync("_check.js","utf8"));console.log("JS OK")}catch(e){console.log("ERR:",e.message)}'],
    capture_output=True, text=True,
    cwd=r'C:/Users/KimRipia/Downloads/timetracker_23/timetracker')
print(result.stdout.strip())
