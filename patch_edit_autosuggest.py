path = r'C:/Users/KimRipia/Downloads/timetracker_23/timetracker/index.html'
with open(path, 'r', encoding='utf-8') as f:
    html = f.read()

# ── 1. Add oninput to desc field and id to Add entry button ─────────────────
html = html.replace(
    '<div class="field"><label>Description</label><input id="desc" type="text" placeholder="What did you work on?"></div>',
    '<div class="field"><label>Description</label><input id="desc" type="text" placeholder="What did you work on?" oninput="window.autoSuggest(this.value)" autocomplete="off"></div>'
)
html = html.replace(
    '<button class="btn" onclick="window.addEntry()">Add entry</button>',
    '<button id="add-btn" class="btn" onclick="window.addEntry()">Add entry</button>'
)

# ── 2. Add .edit-btn CSS (insert after .del rule) ───────────────────────────
html = html.replace(
    '.del{background:none;border:none;cursor:pointer;color:var(--border);font-size:11px;padding:0;flex-shrink:0;}',
    '.del{background:none;border:none;cursor:pointer;color:var(--border);font-size:11px;padding:0;flex-shrink:0;}.edit-btn{background:none;border:none;cursor:pointer;color:var(--muted);font-size:12px;padding:0 3px;flex-shrink:0;line-height:1;}.edit-btn:hover{color:var(--accent);}'
)

# ── 3. Add editingId variable alongside existing state vars ──────────────────
html = html.replace(
    "let activeChip = 'all', ren = {}, pinned = true, activeReport = 'summary', quoteIdx = null;",
    "let activeChip = 'all', ren = {}, pinned = true, activeReport = 'summary', quoteIdx = null, editingId = null;"
)

# ── 4. Modify addEntry to handle edit mode ───────────────────────────────────
old_add = """window.addEntry = function() {
  const desc=document.getElementById('desc').value.trim(),cat=document.getElementById('cat-sel').value,proj=document.getElementById('project').value,
    date=document.getElementById('date').value,start=document.getElementById('start').value,end=document.getElementById('end').value,
    t1=document.getElementById('tag1').value,t2=document.getElementById('tag2').value,st=document.getElementById('status');
  if(!desc||!date||!start||!end){st.textContent='Need description, date, start & end.';return;}
  const sm=mins(start),em=mins(end);
  if(sm<0||em<0){st.textContent='Use HH:MM e.g. 09:00';return;}
  if(em-sm<=0){st.textContent='End must be after start.';return;}
  E.unshift({id:Date.now(),desc,cat,proj,date,start,end,dur:em-sm,tags:[t1,t2].filter(Boolean)});
  sv();
  document.getElementById('desc').value='';document.getElementById('end').value='';
  document.getElementById('start').value=end;document.getElementById('tag1').value='';document.getElementById('tag2').value='';
  st.textContent='Saved!';setTimeout(()=>st.textContent='',2000);
  render();
};"""

new_add = """window.addEntry = function() {
  const desc=document.getElementById('desc').value.trim(),cat=document.getElementById('cat-sel').value,proj=document.getElementById('project').value,
    date=document.getElementById('date').value,start=document.getElementById('start').value,end=document.getElementById('end').value,
    t1=document.getElementById('tag1').value,t2=document.getElementById('tag2').value,st=document.getElementById('status');
  if(!desc||!date||!start||!end){st.textContent='Need description, date, start & end.';return;}
  const sm=mins(start),em=mins(end);
  if(sm<0||em<0){st.textContent='Use HH:MM e.g. 09:00';return;}
  if(em-sm<=0){st.textContent='End must be after start.';return;}
  const tags=[t1,t2].filter(Boolean);
  if(editingId!==null){
    const idx=E.findIndex(x=>x.id===editingId);
    if(idx!==-1) E[idx]={...E[idx],desc,cat,proj,date,start,end,dur:em-sm,tags};
    editingId=null;
    document.getElementById('add-btn').textContent='Add entry';
  } else {
    E.unshift({id:Date.now(),desc,cat,proj,date,start,end,dur:em-sm,tags});
  }
  sv();
  document.getElementById('desc').value='';document.getElementById('end').value='';
  document.getElementById('start').value=end;document.getElementById('tag1').value='';document.getElementById('tag2').value='';
  document.getElementById('cat-sel').value='';document.getElementById('project').value='';
  st.textContent='Saved!';setTimeout(()=>st.textContent='',2000);
  render();
};"""

html = html.replace(old_add, new_add)

# ── 5. Add editEntry + autoSuggest functions after del function ───────────────
old_del = "window.del = function(id) { if(confirm('Delete?')){E=E.filter(e=>e.id!==id);sv();render();} };"
new_del = """window.del = function(id) { if(confirm('Delete?')){E=E.filter(e=>e.id!==id);sv();render();} };

window.editEntry = function(id) {
  const e=E.find(x=>x.id===id); if(!e) return;
  editingId=id;
  document.getElementById('desc').value=e.desc;
  document.getElementById('date').value=e.date;
  document.getElementById('start').value=e.start;
  document.getElementById('end').value=e.end;
  document.getElementById('cat-sel').value=e.cat||'';
  window.filterProjects();
  document.getElementById('project').value=e.proj||'';
  document.getElementById('tag1').value=(e.tags&&e.tags[0])||'';
  document.getElementById('tag2').value=(e.tags&&e.tags[1])||'';
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
  document.querySelector('[onclick*="showTab(\\'log\\'"]') && document.querySelector('[onclick*="showTab(\\'log\\'"]').classList.add('active');
  document.getElementById('tab-log').classList.add('active');
  document.getElementById('add-btn').textContent='Save changes';
  document.getElementById('status').textContent='Editing — update fields and save.';
  document.getElementById('desc').focus();
};

window.autoSuggest = function(val) {
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

html = html.replace(old_del, new_del)

# ── 6. Add edit button to entries renderer ───────────────────────────────────
html = html.replace(
    '<button class="del" onclick="window.del(${e.id})">&#10005;</button>',
    '<button class="edit-btn" onclick="window.editEntry(${e.id})" title="Edit">✎</button><button class="del" onclick="window.del(${e.id})">&#10005;</button>'
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(html)

# Verify
print("autoSuggest added:", 'window.autoSuggest' in html)
print("editEntry added:", 'window.editEntry' in html)
print("editingId added:", 'editingId' in html)
print("edit-btn CSS added:", 'edit-btn' in html)
print("oninput on desc:", 'oninput="window.autoSuggest' in html)
print("id on add-btn:", 'id="add-btn"' in html)
