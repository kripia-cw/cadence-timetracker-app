import re
path = r'C:/Users/KimRipia/Downloads/timetracker_23/timetracker/index.html'
with open(path, 'r', encoding='utf-8') as f:
    html = f.read()

# Find the broken calPick line and show it
m = re.search(r"h \+= '<div class=.*?calPick.*?</div>';", html)
if m:
    print("Found broken line:", repr(m.group(0)))
    # Replace with template literal version (no quoting conflict)
    fixed = "h += `<div class=\"${cls}\" onclick=\"window.calPick('${ds}')\">${d}</div>`;"
    html = html[:m.start()] + fixed + html[m.end():]
    print("Replaced with:", fixed)
else:
    print("Not found - searching for calPick in JS context...")
    for i, line in enumerate(html.split('\n')):
        if 'calPick(' in line and 'h +=' in line:
            print(f"Line {i+1}:", repr(line[:120]))

with open(path, 'w', encoding='utf-8') as f:
    f.write(html)

# Verify syntax
scripts = re.findall(r'<script>(.*?)</script>', html, re.DOTALL)
import subprocess
with open(r'C:/Users/KimRipia/Downloads/timetracker_23/timetracker/_check.js', 'w', encoding='utf-8') as f:
    f.write(scripts[0])
result = subprocess.run(['node', '-e',
    'try{new Function(require("fs").readFileSync("_check.js","utf8"));console.log("JS OK")}catch(e){console.log("ERR:",e.message)}'],
    capture_output=True, text=True,
    cwd=r'C:/Users/KimRipia/Downloads/timetracker_23/timetracker')
print(result.stdout.strip())
