path = r'C:/Users/KimRipia/Downloads/timetracker_23/timetracker/index.html'
with open(path, 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Make sakura inputs/selects more transparent (0.90 -> 0.60)
html = html.replace(
    'body.sakura .field input,body.sakura .field select{background:rgba(255,240,248,0.90);border-color:rgba(200,130,160,0.65);color:#2d1420;}',
    'body.sakura .field input,body.sakura .field select{background:rgba(255,240,248,0.60);border-color:rgba(200,130,160,0.50);color:#2d1420;}'
)

# 2. Simplify editEntry - just pre-fill, no update-in-place (duplicate is fine)
import re
old_edit = re.search(r'window\.editEntry = function\(id\) \{.*?\};', html, re.DOTALL)
if old_edit:
    new_edit = """window.editEntry = function(id) {
  const e=E.find(x=>x.id===id); if(!e) return;
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
  document.querySelectorAll('.tab')[0].classList.add('active');
  document.getElementById('tab-log').classList.add('active');
  document.getElementById('add-btn').textContent='Add entry';
  document.getElementById('status').textContent='Fields loaded — edit and add.';
  document.getElementById('desc').focus();
};"""
    html = html[:old_edit.start()] + new_edit + html[old_edit.end():]
    print("editEntry simplified")
else:
    print("editEntry NOT FOUND")

# 3. Also simplify addEntry - remove the editingId update-in-place block since we don't need it
html = html.replace(
    """  const tags=[t1,t2].filter(Boolean);
  if(editingId!==null){
    const idx=E.findIndex(x=>x.id===editingId);
    if(idx!==-1) E[idx]={...E[idx],desc,cat,proj,date,start,end,dur:em-sm,tags};
    editingId=null;
    document.getElementById('add-btn').textContent='Add entry';
  } else {
    E.unshift({id:Date.now(),desc,cat,proj,date,start,end,dur:em-sm,tags});
  }""",
    "  const tags=[t1,t2].filter(Boolean);\n  E.unshift({id:Date.now(),desc,cat,proj,date,start,end,dur:em-sm,tags});"
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(html)

print("sakura transparent:", 'rgba(255,240,248,0.60)' in html)
print("editingId block removed:", 'editingId!==null' not in html)
