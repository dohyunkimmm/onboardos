from pathlib import Path

path = Path('experience-refinement.css')
css = path.read_text(encoding='utf-8')
old_desktop = '  border-radius:22px;\n  background:\n    radial-gradient(76% 110% at 100% 0%,rgba(124,58,237,.11),transparent 62%),'
new_desktop = '  border-radius:26px;\n  background:\n    radial-gradient(76% 110% at 100% 0%,rgba(124,58,237,.11),transparent 62%),'
old_mobile = '  body:not(.login-open) .action-modal{border-radius:19px;}'
new_mobile = '  body:not(.login-open) .action-modal{border-radius:24px;}'
if old_desktop not in css:
    raise SystemExit('desktop v14 modal radius target not found')
if old_mobile not in css:
    raise SystemExit('mobile v14 modal radius target not found')
css = css.replace(old_desktop, new_desktop, 1).replace(old_mobile, new_mobile, 1)
path.write_text(css, encoding='utf-8')
print('patched v14 request/action modal radius contract')
