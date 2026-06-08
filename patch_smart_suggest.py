path = r'C:/Users/KimRipia/Downloads/timetracker_23/timetracker/index.html'
with open(path, 'r', encoding='utf-8') as f:
    html = f.read()

# ── 1. Add LEARN to state declarations ───────────────────────────────────────
html = html.replace(
    "let E = JSON.parse(localStorage.getItem('tt_e') || '[]');",
    "let E = JSON.parse(localStorage.getItem('tt_e') || '[]');\nlet LEARN = JSON.parse(localStorage.getItem('tt_learn') || '{}');"
)

# ── 2. Replace the entire broken autoSuggest with the smart learning version ─
old_suggest = """window.autoSuggest = function(val) {
  val=(val||'').toLowerCase().trim();
  if(val.length<3) return;
  const catSel=document.getElementById('cat-sel'),projSel=document.getElementById('project');
  if(catSel.value&&projSel.value) return; // don't override manual picks
  const words=val.split(/\\s+/).filter(w=>w.length>2);
  // 1. Project keyword match
  const projMatch=P.find(p=>{const n=p.name.toLowerCase();return words.some(w=>n.includes(w)||w.includes(n.split(' ')[0]));});
  // 2. Category keyword match
  const catMatch=C.find(c=>{if(c==='Break')return false;const n=c.toLowerCase();return words.some(w=>n.includes(w)||w.includes(n.split(/[\\s&]/)[0]));});
  // 3. History match — most recent entry sharing a keyword
  const hist=E.find(e=>e.desc&&words.some(w=>e.desc.toLowerCase().includes(w)));
  if(projMatch&&!projSel.value){
    if(!catSel.value){catSel.value=projMatch.cat;window.filterProjects();}
    projSel.value=projMatch.name;
  } else if(catMatch&&!catSel.value){
    catSel.value=catMatch;window.filterProjects();
  } else if(hist){
    if(hist.cat&&!catSel.value){catSel.value=hist.cat;window.filterProjects();}
    if(hist.proj&&!projSel.value) projSel.value=hist.proj;
    if(hist.tags&&hist.tags[0]&&!document.getElementById('tag1').value) document.getElementById('tag1').value=hist.tags[0];
    if(hist.tags&&hist.tags[1]&&!document.getElementById('tag2').value) document.getElementById('tag2').value=hist.tags[1];
  }
};"""

new_suggest = """// ── Smart learning auto-suggest ──────────────────────────────────────────────
const STOP = new Set(['the','and','for','are','but','not','you','all','can','had','was','one','our','out','day','get','has','him','his','how','its','let','may','new','now','off','too','use','way','who','any','did','man','put','say','she','him','than','that','them','then','they','this','two','with','from','have','been','will','what','when','your','said','each','just','into','over','very','well','back','also','some','more','been','done','going','doing','made','make','take','having','other','about','after','does','here','most','only','same','were','there','these','those','their','which','would','could','should','today','daily','week','meeting','session','time','work','task','call','chat','check','update','review','catch','follow','prep']);

function extractWords(text) {
  return (text.toLowerCase().match(/\b[a-z]{3,}\b/g) || []).filter(w => !STOP.has(w));
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

// Seed LEARN from all existing entries on first run
(function seedLearn() {
  if (Object.keys(LEARN).length === 0 && E.length > 0) {
    E.forEach(e => { if (e.cat) learnFromEntry(e.desc, e.cat, e.proj); });
  }
})();

window.autoSuggest = function(val) {
  val = (val || '').trim();
  if (val.length < 4) return;
  const catSel = document.getElementById('cat-sel'), projSel = document.getElementById('project');
  if (catSel.value && projSel.value) return;
  const words = extractWords(val);
  if (!words.length) return;
  // Score each cat::proj by how many learned keywords match
  const scores = {};
  words.forEach(w => {
    if (LEARN[w]) Object.entries(LEARN[w]).forEach(([key, n]) => { scores[key] = (scores[key] || 0) + n; });
  });
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (!ranked.length || ranked[0][1] < 1) return; // nothing learned yet
  const [bestCat, bestProj] = ranked[0][0].split('::');
  if (!catSel.value) { catSel.value = bestCat; window.filterProjects(); }
  if (bestProj && !projSel.value) projSel.value = bestProj;
};"""

html = html.replace(old_suggest, new_suggest)

# ── 3. Call learnFromEntry when an entry is saved in addEntry ────────────────
html = html.replace(
    "  E.unshift({id:Date.now(),desc,cat,proj,date,start,end,dur:em-sm,tags});\n  sv();",
    "  E.unshift({id:Date.now(),desc,cat,proj,date,start,end,dur:em-sm,tags});\n  learnFromEntry(desc, cat, proj);\n  sv();"
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(html)

print("LEARN var added:", "let LEARN" in html)
print("learnFromEntry added:", "learnFromEntry" in html)
print("STOP words added:", "const STOP" in html)
print("seed on load added:", "seedLearn" in html)
print("called on save:", "learnFromEntry(desc" in html)
print("old suggest gone:", "words.some(w=>n.includes(w)" not in html)
