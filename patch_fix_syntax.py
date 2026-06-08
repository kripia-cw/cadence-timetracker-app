path = r'C:/Users/KimRipia/Downloads/timetracker_23/timetracker/index.html'
with open(path, 'r', encoding='utf-8') as f:
    html = f.read()

# Remove the stale leftover fragment from the old autoSuggest that didn't get cleaned up
stale = """  words.forEach(w => {
    if (LEARN[w]) Object.entries(LEARN[w]).forEach(([key, n]) => { scores[key] = (scores[key] || 0) + n; });
  });
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (!ranked.length || ranked[0][1] < 1) return; // nothing learned yet
  const [bestCat, bestProj] = ranked[0][0].split('::');
  if (!catSel.value) { catSel.value = bestCat; window.filterProjects(); }
  if (bestProj && !projSel.value) projSel.value = bestProj;
};"""

if stale in html:
    html = html.replace(stale, '')
    print("Stale fragment removed")
else:
    print("Stale fragment not found — searching for it...")
    # Try to find it with flexible whitespace
    import re
    m = re.search(r'ranked\[0\]\[1\] < 1\) return;.*?projSel\.value = bestProj;\s*\};', html, re.DOTALL)
    if m:
        print("Found via regex:", repr(html[m.start()-50:m.start()]))
        html = html[:m.start()] + html[m.end():]
        print("Removed via regex")
    else:
        print("Still not found")

with open(path, 'w', encoding='utf-8') as f:
    f.write(html)

# Re-check JS
import re, subprocess
scripts = re.findall(r'<script>(.*?)</script>', html, re.DOTALL)
with open('C:/Users/KimRipia/Downloads/timetracker_23/timetracker/_check.js', 'w', encoding='utf-8') as f:
    f.write(scripts[0])
result = subprocess.run(['node', '--input-type=commonjs'],
    input=scripts[0], capture_output=True, text=True, encoding='utf-8')
if result.returncode == 0:
    print("JS syntax OK")
else:
    # Show first error
    lines = result.stderr.strip().split('\n')
    print("Syntax error:", '\n'.join(lines[:6]))
