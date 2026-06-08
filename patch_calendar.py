path = r'C:/Users/KimRipia/Downloads/timetracker_23/timetracker/index.html'
with open(path, 'r', encoding='utf-8') as f:
    html = f.read()

# ── 1. CSS for calendar ───────────────────────────────────────────────────────
cal_css = """
.cal-wrap{position:relative;}
.cal-trigger{width:100%;padding:5px 7px;border:1px solid var(--border);border-radius:4px;font-size:11px;background:var(--surface);color:var(--text);text-align:left;cursor:pointer;display:flex;align-items:center;gap:5px;}
.cal-trigger:hover{border-color:var(--accent);}
.cal-trigger-icon{font-size:12px;flex-shrink:0;}
.cal-popup{display:none;position:absolute;left:0;right:0;z-index:2000;background:var(--surface);border:1px solid var(--accent);border-radius:7px;padding:8px;box-shadow:0 6px 20px rgba(0,0,0,0.4);backdrop-filter:blur(10px);}
.cal-popup.open{display:block;}
.cal-nav{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;}
.cal-nav-btn{background:none;border:none;cursor:pointer;color:var(--accent);font-size:16px;padding:0 4px;line-height:1;}
.cal-nav-btn:hover{color:var(--text);}
.cal-nav-lbl{font-size:10px;font-weight:700;color:var(--text);}
.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:2px;}
.cal-hdr{font-size:8px;text-align:center;color:var(--muted);padding:2px 0;font-weight:700;}
.cal-day{font-size:9px;text-align:center;padding:4px 1px;cursor:pointer;border-radius:3px;color:var(--text);border:1px solid transparent;}
.cal-day:hover{background:var(--accent);color:#fff;}
.cal-day.cal-today{border-color:var(--accent);font-weight:700;}
.cal-day.cal-sel{background:var(--accent);color:#fff;}
.cal-day.cal-dim{color:var(--muted);opacity:0.35;cursor:default;}
.cal-today-btn{width:100%;margin-top:6px;padding:3px;background:none;border:1px solid var(--border);border-radius:4px;font-size:9px;color:var(--muted);cursor:pointer;}
.cal-today-btn:hover{border-color:var(--accent);color:var(--text);}"""

html = html.replace('.panel{display:none;}', '.panel{display:none;}' + cal_css)

# ── 2. Replace date input with calendar trigger + hidden input ────────────────
html = html.replace(
    '<div class="field"><label>Date</label><input id="date" type="date"></div>',
    '''<div class="field"><label>Date</label><div class="cal-wrap"><button type="button" class="cal-trigger" id="cal-trigger" onclick="window.toggleCal()"><span class="cal-trigger-icon">📅</span><span id="cal-trigger-text">Today</span></button><input type="hidden" id="date"><div id="cal-popup" class="cal-popup"><div class="cal-nav"><button type="button" class="cal-nav-btn" onclick="window.calNav(-1)">&#8249;</button><span class="cal-nav-lbl" id="cal-nav-lbl"></span><button type="button" class="cal-nav-btn" onclick="window.calNav(1)">&#8250;</button></div><div class="cal-grid" id="cal-grid"></div><button type="button" class="cal-today-btn" onclick="window.calPickToday()">Jump to today</button></div></div></div>'''
)

# ── 3. Add calendar JS before afs() function ─────────────────────────────────
cal_js = """
// ── Calendar picker ──────────────────────────────────────────────────────────
let calView = new Date();

function calFmt(d) {
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}

function calLabel(dateStr) {
  if (!dateStr) return 'Select date';
  const d = new Date(dateStr + 'T00:00:00');
  const today = calFmt(new Date());
  if (dateStr === today) return 'Today — ' + d.toLocaleDateString('en-NZ',{weekday:'short',day:'numeric',month:'short'});
  return d.toLocaleDateString('en-NZ',{weekday:'short',day:'numeric',month:'short',year:'numeric'});
}

function calRender() {
  const today = calFmt(new Date());
  const sel = document.getElementById('date').value;
  const yr = calView.getFullYear(), mo = calView.getMonth();
  document.getElementById('cal-nav-lbl').textContent =
    new Date(yr,mo,1).toLocaleDateString('en-NZ',{month:'long',year:'numeric'});
  const first = new Date(yr, mo, 1);
  const last = new Date(yr, mo+1, 0);
  const startDay = (first.getDay() + 6) % 7; // Mon=0
  const hdrs = ['Mo','Tu','We','Th','Fr','Sa','Su'];
  let h = hdrs.map(d=>'<div class="cal-hdr">'+d+'</div>').join('');
  for (let i=0;i<startDay;i++) h += '<div class="cal-day cal-dim"></div>';
  for (let d=1;d<=last.getDate();d++) {
    const ds = yr+'-'+String(mo+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
    let cls = 'cal-day';
    if (ds===today) cls+=' cal-today';
    if (ds===sel) cls+=' cal-sel';
    h += '<div class="'+cls+'" onclick="window.calPick(\''+ds+'\')">'+d+'</div>';
  }
  document.getElementById('cal-grid').innerHTML = h;
}

window.toggleCal = function() {
  const p = document.getElementById('cal-popup');
  if (p.classList.contains('open')) { p.classList.remove('open'); return; }
  const sel = document.getElementById('date').value;
  calView = sel ? new Date(sel+'T00:00:00') : new Date();
  calRender();
  p.classList.add('open');
};

window.calNav = function(dir) {
  calView = new Date(calView.getFullYear(), calView.getMonth()+dir, 1);
  calRender();
};

window.calPick = function(ds) {
  document.getElementById('date').value = ds;
  document.getElementById('cal-trigger-text').textContent = calLabel(ds);
  document.getElementById('cal-popup').classList.remove('open');
  afs();
};

window.calPickToday = function() { window.calPick(calFmt(new Date())); };

// Close on outside click
document.addEventListener('click', function(e) {
  if (!e.target.closest('.cal-wrap')) {
    const p = document.getElementById('cal-popup');
    if (p) p.classList.remove('open');
  }
});

// Init to today
(function() {
  const today = calFmt(new Date());
  document.getElementById('date').value = today;
  document.getElementById('cal-trigger-text').textContent = calLabel(today);
})();

"""

html = html.replace('function afs()', cal_js + 'function afs()')

# ── 4. In editEntry, update trigger text when filling date ───────────────────
html = html.replace(
    "  document.getElementById('date').value=e.date;\n  document.getElementById('start').value=e.start;",
    "  window.calPick(e.date);\n  document.getElementById('start').value=e.start;"
)

# ── 5. Restore update-in-place for editEntry (no duplicate) ──────────────────
# Find current addEntry save line and add editingId support back
html = html.replace(
    "  const tags=[t1,t2].filter(Boolean);\n  E.unshift({id:Date.now(),desc,cat,proj,date,start,end,dur:em-sm,tags});",
    """  const tags=[t1,t2].filter(Boolean);
  if(editingId!==null){
    const idx=E.findIndex(x=>x.id===editingId);
    if(idx!==-1) E[idx]={...E[idx],desc,cat,proj,date,start,end,dur:em-sm,tags};
    editingId=null;
    document.getElementById('add-btn').textContent='Add entry';
  } else {
    E.unshift({id:Date.now(),desc,cat,proj,date,start,end,dur:em-sm,tags});
  }"""
)

# editEntry should set editingId
html = html.replace(
    "window.editEntry = function(id) {\n  const e=E.find(x=>x.id===id); if(!e) return;",
    "window.editEntry = function(id) {\n  const e=E.find(x=>x.id===id); if(!e) return;\n  editingId=id;"
)
html = html.replace(
    "  document.getElementById('add-btn').textContent='Add entry';\n  document.getElementById('status').textContent='Fields loaded — edit and add.';",
    "  document.getElementById('add-btn').textContent='Save changes';\n  document.getElementById('status').textContent='Editing — update fields and save.';"
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(html)

# Verify syntax
import re, subprocess
scripts = re.findall(r'<script>(.*?)</script>', html, re.DOTALL)
result = subprocess.run(['node', '-e',
    'try{new Function(require("fs").readFileSync("_check.js","utf8"));console.log("OK")}catch(e){console.log("ERR",e.message)}'],
    capture_output=True, text=True, cwd=r'C:/Users/KimRipia/Downloads/timetracker_23/timetracker')
with open('C:/Users/KimRipia/Downloads/timetracker_23/timetracker/_check.js','w',encoding='utf-8') as f:
    f.write(scripts[0])
result2 = subprocess.run(['node','-e',
    'try{new Function(require("fs").readFileSync("_check.js","utf8"));console.log("JS OK")}catch(e){console.log("ERR:",e.message)}'],
    capture_output=True, text=True, cwd=r'C:/Users/KimRipia/Downloads/timetracker_23/timetracker')
print(result2.stdout.strip())
print("cal HTML:", 'cal-popup' in html)
print("cal JS:", 'calRender' in html)
print("defaults today:", 'calFmt(new Date())' in html)
print("edit in-place:", 'editingId!==null' in html)
