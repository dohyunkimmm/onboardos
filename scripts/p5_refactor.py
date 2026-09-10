from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen
import json
import re
import shutil

FONT_CSS_URL = 'https://raw.githubusercontent.com/orioncactus/pretendard/v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.css'
FONT_LICENSE_URL = 'https://raw.githubusercontent.com/orioncactus/pretendard/v1.3.9/LICENSE'


def read(path):
    return Path(path).read_text(encoding='utf-8')


def write(path, content):
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content, encoding='utf-8')


def replace_once(path, old, new):
    text = read(path)
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f'{path}: expected exactly one match, found {count}: {old[:100]}')
    write(path, text.replace(old, new, 1))


def fetch_bytes(url):
    request = Request(url, headers={'User-Agent': 'onboardos-p5-vendor/1.0'})
    with urlopen(request, timeout=30) as response:
        return response.read()


def vendor_pretendard():
    css = fetch_bytes(FONT_CSS_URL).decode('utf-8')
    refs = sorted(set(
        raw.strip().strip('"\'')
        for raw in re.findall(r'url\(([^)]+)\)', css)
        if raw.strip().strip('"\'').lower().endswith('.woff2')
    ))
    if not refs:
        raise RuntimeError('Pretendard CSS did not contain WOFF2 references')

    font_dir = Path('fonts/pretendard')
    shutil.rmtree(font_dir, ignore_errors=True)
    font_dir.mkdir(parents=True, exist_ok=True)

    def download(ref):
        source = urljoin(FONT_CSS_URL, ref)
        name = Path(urlparse(source).path).name
        data = fetch_bytes(source)
        if not data.startswith(b'wOF2'):
            raise RuntimeError(f'{name} is not a WOFF2 file')
        (font_dir / name).write_bytes(data)
        return ref, name, len(data)

    with ThreadPoolExecutor(max_workers=8) as pool:
        downloaded = list(pool.map(download, refs))

    for ref, name, _size in downloaded:
        css = css.replace(ref, f'./pretendard/{name}')
    write('fonts/pretendard.css', css)
    Path('fonts/PRETENDARD-LICENSE.txt').write_bytes(fetch_bytes(FONT_LICENSE_URL))
    print(f'Vendored Pretendard: {len(downloaded)} WOFF2 files, {sum(size for _, _, size in downloaded)} bytes')


def update_existing_files():
    replace_once(
        'index.html',
        '<link crossorigin="" href="https://cdn.jsdelivr.net" rel="preconnect"/>\n<link as="style" crossorigin="" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" id="brandFontStylesheet" media="print" rel="stylesheet"/>',
        '<link as="style" href="fonts/pretendard.css" id="brandFontStylesheet" media="print" rel="stylesheet"/>'
    )
    replace_once(
        'app.js',
        'function setRole(key){\n  currentRole = key;',
        "function setRole(key){\n  currentRole = roles[key] ? key : 'office';\n  activateRoleState(currentRole);\n  key = currentRole;"
    )
    replace_once(
        'app.js',
        "  requestState = {};\n  cancelledHistory = {};\n  cancelledTickets = {};\n  ticketSeq = 1041;\n  selectedFilter = 'all';\n  selectedRequestItem = null;\n  drawerMode = 'user';\n  adminStatusFilter = 'all';\n  supportRequestContext = null;\n  currentRole = 'office';\n  clearSession();",
        "  requestStateByRole = {};\n  cancelledHistoryByRole = {};\n  cancelledTicketsByRole = {};\n  currentRole = 'office';\n  activateRoleState(currentRole);\n  ticketSeq = 1041;\n  selectedFilter = 'all';\n  selectedRequestItem = null;\n  drawerMode = 'user';\n  adminStatusFilter = 'all';\n  supportRequestContext = null;\n  clearSession();"
    )
    replace_once(
        'app.js',
        '// Never make the prototype unusable because a third-party font CDN is slow.',
        '// Never make the prototype unusable if the optional self-hosted brand font is delayed.'
    )
    replace_once(
        'scripts/serve.js',
        "'.svg':'image/svg+xml','.png':'image/png','.json':'application/json; charset=utf-8'",
        "'.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2','.json':'application/json; charset=utf-8'"
    )

    config = json.loads(read('vercel.json'))
    found = False
    for rule in config.get('headers', []):
        for header in rule.get('headers', []):
            if header.get('key', '').lower() == 'content-security-policy':
                old = header['value']
                header['value'] = old.replace(' https://cdn.jsdelivr.net', '')
                if header['value'] == old:
                    raise RuntimeError('vercel.json CSP did not contain jsDelivr')
                found = True
    if not found:
        raise RuntimeError('Content-Security-Policy header not found')
    write('vercel.json', json.dumps(config, ensure_ascii=False, indent=2) + '\n')


def main():
    vendor_pretendard()
    update_existing_files()
    print('P5 binary/runtime refactor staged successfully')


if __name__ == '__main__':
    main()
