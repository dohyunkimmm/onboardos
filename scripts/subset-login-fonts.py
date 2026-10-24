"""Create a tiny login-only subset from the bundled Pretendard outlines.
Modified font names use ToolFlow UI; the original Pretendard/OFL notice remains.
"""
from pathlib import Path
from html import unescape
import re
from fontTools import subset
from fontTools.ttLib import TTFont

root=Path(__file__).resolve().parents[1]
html=(root/'index.html').read_text()
chunk=html[html.index('<!-- 가상 Google'):html.index('<main')]
text=unescape(re.sub(r'<[^>]+>','',chunk))
wanted={ord(c) for c in text}|set(range(32,127))
out=root/'fonts/login'
out.mkdir(parents=True,exist_ok=True)
for part in [86,87,88,89,90,91]:
    src=root/f'fonts/pretendard/PretendardVariable.subset.{part}.woff2'
    font=TTFont(src)
    available=set(font.getBestCmap())&wanted
    options=subset.Options()
    options.parse_opts(['--layout-features=*','--name-IDs=*','--name-languages=*'])
    cutter=subset.Subsetter(options=options)
    cutter.populate(unicodes=available)
    cutter.subset(font)
    for record in font['name'].names:
        value=None
        if record.nameID in [1,4,16,18,21]:
            value='ToolFlow UI'
        elif record.nameID in [6,25]:
            value='ToolFlowUI'
        elif record.nameID==3:
            value=f'ToolFlowUI-Login-{part}'
        elif record.nameID>=256 and 'Pretendard' in record.toUnicode():
            value=record.toUnicode().replace('Pretendard','ToolFlowUI')
        if value is not None:
            record.string=value.encode(record.getEncoding())
    font.flavor='woff2'
    target=out/f'ToolFlowUI.{part}.woff2'
    font.save(target)
    print(f'{target.relative_to(root)}: {target.stat().st_size} bytes, {len(available)} characters')
