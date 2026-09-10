from pathlib import Path
p = Path('index.html')
s = p.read_text(encoding='utf-8')
old = ' aria-haspopup="menu"'
if s.count(old) != 1:
    raise SystemExit(f'expected one aria-haspopup menu attribute, found {s.count(old)}')
p.write_text(s.replace(old, '', 1), encoding='utf-8')
