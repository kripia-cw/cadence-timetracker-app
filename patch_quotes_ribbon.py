path = r'C:/Users/KimRipia/Downloads/timetracker_23/timetracker/index.html'
with open(path, 'r', encoding='utf-8') as f:
    html = f.read()

# ── 1. Replace ribbon CSS ─────────────────────────────────────────────────────
old_ribbon_css = (
    '.ribbon{background:rgba(0,0,0,0.22);backdrop-filter:blur(4px);padding:12px 16px;border-radius:0 0 6px 6px;cursor:pointer;user-select:none;}'
    '.ribbon:hover{background:rgba(0,0,0,0.54);}'
    '.ribbon-quote{font-size:15px;font-style:italic;color:#fff;line-height:1.55;text-align:center;text-shadow:0 1px 4px rgba(0,0,0,0.7);}'
    '.ribbon-author{font-size:11px;color:rgba(255,255,255,0.8);text-align:center;margin-top:6px;}'
    '.ribbon-hint{font-size:8px;color:rgba(255,255,255,0.32);text-align:center;margin-top:3px;}'
)
new_ribbon_css = (
    '.ribbon{background:rgba(0,0,0,0.22);backdrop-filter:blur(4px);border-radius:0 0 6px 6px;user-select:none;display:flex;align-items:stretch;}'
    '.ribbon-prev{width:20%;display:flex;align-items:center;justify-content:center;cursor:pointer;border-right:1px solid rgba(255,255,255,0.08);flex-shrink:0;}'
    '.ribbon-prev:hover{background:rgba(255,255,255,0.07);border-radius:0 0 0 6px;}'
    '.ribbon-next{flex:1;padding:12px 14px 10px;cursor:pointer;}'
    '.ribbon-next:hover{background:rgba(255,255,255,0.05);border-radius:0 0 6px 0;}'
    # CSS chevron — wide/obtuse angle using two rotated bars
    '.chev{display:inline-block;position:relative;width:14px;height:9px;}'
    '.chev::before,.chev::after{content:"";position:absolute;left:0;width:100%;height:2.5px;background:rgba(255,255,255,0.65);border-radius:2px;}'
    '.chev-left::before{top:0;transform-origin:0% 50%;transform:rotate(-32deg);}'
    '.chev-left::after{bottom:0;transform-origin:0% 50%;transform:rotate(32deg);}'
    '.chev-right::before{top:0;transform-origin:100% 50%;transform:rotate(32deg);}'
    '.chev-right::after{bottom:0;transform-origin:100% 50%;transform:rotate(-32deg);}'
    '.ribbon-quote{font-size:15px;font-style:italic;color:#fff;line-height:1.55;text-align:center;text-shadow:0 1px 4px rgba(0,0,0,0.7);}'
    '.ribbon-author{font-size:11px;color:rgba(255,255,255,0.8);text-align:center;margin-top:6px;}'
    '.ribbon-hint{font-size:8px;color:rgba(255,255,255,0.28);text-align:center;margin-top:3px;}'
)
html = html.replace(old_ribbon_css, new_ribbon_css)

# ── 2. Replace ribbon HTML ────────────────────────────────────────────────────
old_ribbon_html = (
    '<div class="ribbon" onclick="window.nextQuote()">\n'
    '      <div class="ribbon-quote" id="quote-text"></div>\n'
    '      <div class="ribbon-author" id="quote-author"></div>\n'
    '      <div class="ribbon-hint">click for next</div>\n'
    '    </div>'
)
new_ribbon_html = (
    '<div class="ribbon">'
    '<div class="ribbon-prev" onclick="window.prevQuote()" title="Previous quote"><span class="chev chev-left"></span></div>'
    '<div class="ribbon-next" onclick="window.nextQuote()">'
    '<div class="ribbon-quote" id="quote-text"></div>'
    '<div class="ribbon-author" id="quote-author"></div>'
    '<div class="ribbon-hint">tap for next</div>'
    '</div>'
    '</div>'
)
html = html.replace(old_ribbon_html, new_ribbon_html)

# ── 3. Change initQuote from weekly to daily rotation ────────────────────────
html = html.replace(
    """function initQuote() {
  const saved = localStorage.getItem('tt_qidx');
  const savedWeek = localStorage.getItem('tt_qweek');
  const now = new Date();
  const curWeek = now.getFullYear() * 100 + getWeekNum(now);
  if (saved !== null && parseInt(savedWeek) === curWeek) {
    quoteIdx = parseInt(saved);
  } else {
    quoteIdx = curWeek % QUOTES.length;
    localStorage.setItem('tt_qidx', quoteIdx);
    localStorage.setItem('tt_qweek', curWeek);
  }
  renderQuote();
}""",
    """function initQuote() {
  const saved = localStorage.getItem('tt_qidx');
  const savedDay = localStorage.getItem('tt_qday');
  const now = new Date();
  const curDay = now.getFullYear() * 10000 + (now.getMonth()+1) * 100 + now.getDate();
  if (saved !== null && parseInt(savedDay) === curDay) {
    quoteIdx = parseInt(saved);
  } else {
    quoteIdx = curDay % QUOTES.length;
    localStorage.setItem('tt_qidx', quoteIdx);
    localStorage.setItem('tt_qday', curDay);
  }
  renderQuote();
}"""
)

# ── 4. Add prevQuote alongside nextQuote ─────────────────────────────────────
html = html.replace(
    """window.nextQuote = function() {
  quoteIdx = (quoteIdx + 1) % QUOTES.length;
  localStorage.setItem('tt_qidx', quoteIdx);""",
    """window.prevQuote = function() {
  quoteIdx = (quoteIdx - 1 + QUOTES.length) % QUOTES.length;
  localStorage.setItem('tt_qidx', quoteIdx);
  renderQuote();
};
window.nextQuote = function() {
  quoteIdx = (quoteIdx + 1) % QUOTES.length;
  localStorage.setItem('tt_qidx', quoteIdx);"""
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(html)

# Verify
import re, subprocess
scripts = re.findall(r'<script>(.*?)</script>', html, re.DOTALL)
with open(r'C:/Users/KimRipia/Downloads/timetracker_23/timetracker/_check.js', 'w', encoding='utf-8') as f:
    f.write(scripts[0])
result = subprocess.run(['node', '-e',
    'try{new Function(require("fs").readFileSync("_check.js","utf8"));console.log("JS OK")}catch(e){console.log("ERR:",e.message)}'],
    capture_output=True, text=True,
    cwd=r'C:/Users/KimRipia/Downloads/timetracker_23/timetracker')
print(result.stdout.strip())
print("daily:", 'tt_qday' in html)
print("prevQuote:", 'window.prevQuote' in html)
print("chev CSS:", 'chev-left' in html)
print("ribbon flex:", 'ribbon-prev' in html)
