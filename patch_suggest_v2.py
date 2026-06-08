path = r'C:/Users/KimRipia/Downloads/timetracker_23/timetracker/index.html'
with open(path, 'r', encoding='utf-8') as f:
    html = f.read()

import re

# ── 1. Add CSS for suggestion dropdown ───────────────────────────────────────
old_panel_css = '.panel{display:none;}'
new_panel_css = '''.panel{display:none;}
.suggest-box{position:absolute;left:0;right:0;top:calc(100% + 2px);z-index:9999;background:var(--surface);border:1px solid var(--accent);border-radius:5px;box-shadow:0 4px 14px rgba(0,0,0,0.35);overflow:hidden;backdrop-filter:blur(8px);}
.suggest-item{padding:6px 10px;cursor:pointer;font-size:10px;color:var(--text);display:flex;align-items:center;gap:5px;border-bottom:1px solid var(--border);}
.suggest-item:last-child{border-bottom:none;}
.suggest-item:hover{background:var(--accent);color:#fff;}
.suggest-cat{font-weight:700;}
.suggest-proj{opacity:0.75;font-size:9px;}'''
html = html.replace(old_panel_css, new_panel_css)

# ── 2. Replace the entire autoSuggest + helpers block ────────────────────────
old_block = re.search(
    r'// ── Smart learning auto-suggest.*?window\.autoSuggest = function\(val\) \{.*?\};',
    html, re.DOTALL
)

new_block = """// ── Smart learning auto-suggest ──────────────────────────────────────────────
const STOP = new Set(['the','and','for','are','but','not','you','all','can','had','was','one','our','out','day','get','has','him','his','how','its','let','may','new','now','off','too','use','way','who','any','did','man','put','say','she','than','that','them','then','they','this','two','with','from','have','been','will','what','when','your','said','each','just','into','over','very','well','back','also','some','more','done','going','doing','made','make','take','having','other','about','after','does','here','most','only','same','were','there','these','those','their','which','would','could','should','today','daily','week','meeting','session','time','work','task','call','chat','check','update','review','catch','follow','prep','stand','sync','weekly','monthly','plan','plans','planning']);

function extractWords(text) {
  return (text.toLowerCase().match(/\\b[a-z]{3,}\\b/g) || []).filter(w => !STOP.has(w));
}

function learnFromEntry(desc, cat, proj) {
  if (!desc || !cat) return;
  const key = cat + (proj ? '::' + proj : '');
  extractWords(desc).forEach(w => {
    if (!LEARN[w]) LEARN[w] = {};
    LEARN[w][key] = (LEARN[w][key] || 0) + 1;
  });
  localStorage.setItem('tt_learn', JSON.stringify(LEARN));
}

(function seedLearn() {
  if (Object.keys(LEARN).length === 0 && E.length > 0) {
    E.forEach(e => { if (e.cat) learnFromEntry(e.desc, e.cat, e.proj); });
  }
})();

function hideSuggestions() {
  const b = document.getElementById('suggest-box');
  if (b) b.remove();
}

function showSuggestions(candidates) {
  hideSuggestions();
  if (!candidates.length) return;
  const wrap = document.getElementById('desc').closest('.field');
  wrap.style.position = 'relative';
  const box = document.createElement('div');
  box.id = 'suggest-box';
  box.className = 'suggest-box';
  candidates.slice(0, 6).forEach(([key]) => {
    const [cat, proj] = key.split('::');
    const item = document.createElement('div');
    item.className = 'suggest-item';
    item.innerHTML = '<span class="suggest-cat">' + cat + '</span>' + (proj ? '<span class="suggest-proj">› ' + proj + '</span>' : '');
    item.onmousedown = (ev) => {
      ev.preventDefault();
      document.getElementById('cat-sel').value = cat;
      window.filterProjects();
      if (proj) document.getElementById('project').value = proj;
      hideSuggestions();
    };
    box.appendChild(item);
  });
  wrap.appendChild(box);
}

window.autoSuggest = function(val) {
  val = (val || '').trim();
  hideSuggestions();
  if (val.length < 3) return;
  const catSel = document.getElementById('cat-sel'), projSel = document.getElementById('project');
  if (catSel.value && projSel.value) return;
  const words = extractWords(val);
  const scores = {};

  // 1. Learned history — weighted higher
  words.forEach(w => {
    if (LEARN[w]) Object.entries(LEARN[w]).forEach(([key, n]) => {
      scores[key] = (scores[key] || 0) + n * 3;
    });
  });

  // 2. Category name match — whole words only
  C.forEach(c => {
    if (c === 'Break') return;
    const cw = extractWords(c);
    const hits = words.filter(w => cw.includes(w)).length;
    if (!hits) return;
    const projs = P.filter(p => p.cat === c);
    if (projs.length) {
      projs.forEach(p => {
        const pw = extractWords(p.name);
        const phits = words.filter(w => pw.includes(w)).length;
        scores[c + '::' + p.name] = (scores[c + '::' + p.name] || 0) + hits + phits;
      });
    } else {
      scores[c] = (scores[c] || 0) + hits;
    }
  });

  // 3. Project name match — whole words only
  P.forEach(p => {
    const pw = extractWords(p.name);
    const hits = words.filter(w => pw.includes(w)).length;
    if (hits) scores[p.cat + '::' + p.name] = (scores[p.cat + '::' + p.name] || 0) + hits;
  });

  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]).filter(([, s]) => s >= 1);
  if (!ranked.length) return;

  if (ranked.length === 1) {
    // Only one option — auto-fill silently
    const [bestCat, bestProj] = ranked[0][0].split('::');
    if (!catSel.value) { catSel.value = bestCat; window.filterProjects(); }
    if (bestProj && !projSel.value) projSel.value = bestProj;
  } else {
    // Multiple options — show picker
    showSuggestions(ranked);
  }
};

document.addEventListener('click', e => {
  if (!e.target.closest('#suggest-box') && !e.target.closest('#desc')) hideSuggestions();
});"""

if old_block:
    html = html[:old_block.start()] + new_block + html[old_block.end():]
    print("Block replaced")
else:
    print("ERROR: block not found")

with open(path, 'w', encoding='utf-8') as f:
    f.write(html)

print("suggest-box CSS:", '.suggest-box' in html)
print("showSuggestions:", 'showSuggestions' in html)
print("category name match:", 'cw = extractWords(c)' in html)
print("project name match:", 'pw = extractWords(p.name)' in html)
print("multiple picker:", 'Multiple options' in html)
