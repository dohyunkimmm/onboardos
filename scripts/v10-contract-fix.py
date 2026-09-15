from pathlib import Path

path = Path('login-font-lock.css')
text = path.read_text()
marker = '/* v10 V3/V4 contract compatibility */'
if marker not in text:
    text += '''

/* v10 V3/V4 contract compatibility */
body:not(.login-open) .card:focus-within{
  transition:none;
  border-color:rgba(196,181,253,.40);
  box-shadow:0 0 0 3px rgba(196,181,253,.14),0 18px 46px -34px rgba(0,0,0,.92),0 1px 0 rgba(255,255,255,.035) inset;
}
body:not(.login-open) .filter-chip.active{
  background:linear-gradient(135deg,rgba(99,102,241,.20),rgba(168,85,247,.14));
  border-color:rgba(196,181,253,.28);
  color:#E9E5FF;
  box-shadow:0 8px 20px -18px rgba(196,181,253,.8);
}
'''
    path.write_text(text)
print('v10 V3/V4 compatibility applied')
