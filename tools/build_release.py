#!/usr/bin/env python3
"""Build the dependency-free offline HTML and ZIP, using the standard library."""
from pathlib import Path
import html
import re
import zipfile
import hashlib
import argparse

ROOT = Path(__file__).resolve().parents[1]

def inline(text):
    text = html.escape(text)
    text = re.sub(r'`([^`]+)`', r'<code>\1</code>', text)
    text = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', text)
    text = re.sub(r'(https://[^\s<]+)', r'<a href="\1" target="_blank" rel="noopener">\1</a>', text)
    return text

def render_markdown(text):
    lines = text.splitlines()
    out, toc = [], []
    i, heading = 0, 0
    while i < len(lines):
        line = lines[i]
        if not line.strip():
            i += 1
            continue
        if line.startswith('```'):
            code = []
            i += 1
            while i < len(lines) and not lines[i].startswith('```'):
                code.append(lines[i])
                i += 1
            out.append('<pre><code>' + html.escape('\n'.join(code)) + '</code></pre>')
            i += 1
            continue
        if line.startswith('#'):
            level = len(line) - len(line.lstrip('#'))
            title = line[level:].strip()
            heading += 1
            key = f'section-{heading}'
            out.append(f'<h{level} id="{key}">{inline(title)}</h{level}>')
            if level == 2:
                toc.append(f'<a href="#{key}">{inline(title)}</a>')
            i += 1
            continue
        if line.startswith('|'):
            rows = []
            while i < len(lines) and lines[i].startswith('|'):
                row = [s.strip() for s in lines[i].strip('|').split('|')]
                if not all(re.fullmatch(r':?-+:?', s) for s in row):
                    rows.append(row)
                i += 1
            table = '<div class="table-wrap"><table><thead><tr>'
            table += ''.join('<th>' + inline(c) + '</th>' for c in rows[0])
            table += '</tr></thead><tbody>'
            for row in rows[1:]:
                table += '<tr>' + ''.join('<td>' + inline(c) + '</td>' for c in row) + '</tr>'
            out.append(table + '</tbody></table></div>')
            continue
        if re.match(r'^(- |\d+\. )', line):
            ordered = bool(re.match(r'^\d+\. ', line))
            tag = 'ol' if ordered else 'ul'
            items = []
            while i < len(lines) and re.match(r'^(\d+\. |\- )', lines[i]):
                items.append('<li>' + inline(re.sub(r'^(\d+\. |\- )', '', lines[i])) + '</li>')
                i += 1
            out.append(f'<{tag}>' + ''.join(items) + f'</{tag}>')
            continue
        paragraph = [line]
        i += 1
        while i < len(lines) and lines[i].strip() and not re.match(r'^(#|\||```|- |\d+\. )', lines[i]):
            paragraph.append(lines[i])
            i += 1
        out.append('<p>' + inline(' '.join(paragraph)) + '</p>')
    return '\n'.join(out), ''.join(toc)

STYLE = '    *{box-sizing:border-box}html{scroll-behavior:smooth}body{font-family:Tahoma,"Segoe UI",sans-serif;margin:0;background:#f4f7f8;color:#183441;line-height:1.9;font-size:16px}header{background:#0b202e;color:#f3f9fb;padding:38px max(24px,calc((100% - 1120px)/2))}header b{font:800 28px "Segoe UI",sans-serif;letter-spacing:4px}header p{color:#b8d2dc;margin:10px 0 20px}header a{display:inline-block;padding:10px 18px;background:#79e0ec;color:#0a2532;text-decoration:none;border-radius:4px;font-weight:bold}.layout{max-width:1180px;margin:auto;display:grid;grid-template-columns:215px minmax(0,1fr);gap:36px;padding:35px 24px}nav{position:sticky;top:24px;align-self:start;font-size:13px}nav strong{font-size:15px}nav a{display:block;padding:7px 0;color:#497382;text-decoration:none;border-bottom:1px solid #d8e3e8}main{min-width:0}h1{font-size:30px;line-height:1.5;margin-top:0}h2{font-size:23px;margin-top:40px;padding-bottom:10px;border-bottom:2px solid #97c6d0;scroll-margin-top:25px}p{margin:15px 0}a{color:#1c7088;overflow-wrap:anywhere}.table-wrap{overflow:auto;margin:20px 0;border:1px solid #c8dbe2;background:white}table{border-collapse:collapse;width:100%;font-size:14px;line-height:1.8}td,th{padding:11px 13px;text-align:left;border-bottom:1px solid #d9e4e9;vertical-align:top;min-width:90px}th{background:#133444;color:white;font-weight:normal}tr:nth-child(even){background:#f0f7f9}code{background:#dfebf0;padding:2px 5px;font-size:14px}pre{overflow:auto;padding:20px;background:#dfebf0}li{padding:4px 0}.quickstart{background:#e3f4f6;border-left:4px solid #268b9d;padding:18px 22px;margin:0 0 32px}.quickstart h2{margin:0;border:0;padding:0;font-size:22px}.note{font-size:14px;color:#507384}footer{padding:24px;text-align:center;color:#607f8c;font-size:13px}@media(max-width:800px){.layout{display:block;padding:24px 18px}nav{position:static;margin-bottom:30px;display:flex;flex-wrap:wrap;gap:6px 14px}nav strong{width:100%}nav a{font-size:12px;padding:3px 0}h1{font-size:25px}h2{font-size:21px}}@media print{header,nav,.play-link{display:none}.layout{display:block;padding:0;max-width:none}body{background:white;font-size:11pt}h2{break-after:avoid}table{font-size:9pt}tr{break-inside:avoid}a{color:inherit}.table-wrap{overflow:visible}h1{font-size:22pt}}\n    '

def document(body, toc, title, subtitle, quick):
    return (
        '<!doctype html><html lang="th"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1">'
        '<title>' + html.escape(title) + '</title><style>' + STYLE + '</style></head>'
        '<body><header><b>IRON TIDE II</b><p>' + html.escape(subtitle) + '</p>'
        '<a class="play-link" href="START_GAME.html">เปิดเกม →</a> '
        '<a class="play-link" href="MANUAL_TH.html">คู่มือเกม</a> '
        '<a class="play-link" href="DEPLOY_GITHUB_TH.html">ขึ้น GitHub / ออนไลน์</a>'
        '</header><div class="layout"><nav><strong>สารบัญ</strong>' + toc
        + '</nav><main><section class="quickstart">' + quick + '</section>'
        + body + '</main></div><footer>IRON TIDE II · เกมต้นแบบอิสระ · เวอร์ชัน 2.0 · 2026</footer></body></html>'
    )

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output-dir', type=Path, default=ROOT / 'release')
    args = parser.parse_args()
    outdir = args.output_dir.resolve()
    outdir.mkdir(parents=True, exist_ok=True)

    entry = (ROOT / 'dist/index.html').read_text(encoding='utf-8')
    css = (ROOT / 'dist/style.css').read_text(encoding='utf-8')
    entry = entry.replace('<link rel="stylesheet" href="style.css">', '<style>\n' + css + '\n</style>')
    scripts = ['config.js', 'js/engine.js', 'js/renderer.js', 'js/audio.js', 'js/network.js', 'js/game.js']
    for name in scripts:
        source = (ROOT / 'dist' / name).read_text(encoding='utf-8')
        tag = '<script src="' + name + '"></script>'
        if tag not in entry:
            raise ValueError('Missing script reference: ' + name)
        if '</script' in source.lower():
            raise ValueError('Unexpected inline-script terminator: ' + name)
        entry = entry.replace(tag, '<script>\n' + source + '\n</script>')
    if re.search(r'<script[^>]+src=', entry) or re.search(r'<link[^>]+stylesheet', entry):
        raise ValueError('Standalone HTML still has external dependencies')
    (ROOT / 'START_GAME.html').write_text(entry, encoding='utf-8')

    manuals = [
        ('docs/SYSTEM_DESIGN_TH.md', 'MANUAL_TH.html', 'คู่มือเกมและการออกแบบระบบ',
         '<h2>เข้าเล่นทันที</h2><ol><li>แยก ZIP แล้วเข้าโฟลเดอร์ IRON_TIDE</li>'
         '<li>เปิด <strong>START_GAME.html</strong></li><li>เลือกเรือ → เริ่มภารกิจ → เข้าปฏิบัติการ</li>'
         '<li>WASD ขับเรือ · Q โซนาร์ · L ล็อก · G ปืน · M จรวด · T ตอร์ปิโด</li></ol>'
         '<p>เล่นคนเดียวออฟไลน์ได้ พันธมิตร AI ควบคุมตัวเอง '
         'เล่นกับเพื่อนอ่าน <a href="DEPLOY_GITHUB_TH.html">คู่มือเปิดห้องออนไลน์</a></p>'),
        ('docs/DEPLOY_GITHUB_TH.md', 'DEPLOY_GITHUB_TH.html', 'ขึ้น GitHub Pages และเปิดห้องออนไลน์',
         '<h2>หน้าเกม + เซิร์ฟเวอร์ห้อง</h2><p>อัปโหลดซอร์สขึ้น GitHub Pages '
         'แล้วเชื่อมกับเซิร์ฟเวอร์ Node.js HTTPS ที่คุณเปิดไว้ '
         'ยังไม่มีบริการออนไลน์ deploy ให้โดยอัตโนมัติ '
         'เริ่มจากลองบนเครื่องและทำตามขั้นตอนด้านล่างได้เลย</p>')
    ]
    for source, dest, title, quick in manuals:
        body, toc = render_markdown((ROOT / source).read_text(encoding='utf-8'))
        (ROOT / dest).write_text(document(body, toc, title,
            title + ' · เวอร์ชัน 2.0', quick), encoding='utf-8')

    root_files = [
        'START_GAME.html', 'START_SERVER.bat', 'README_TH.txt', 'README.md',
        'MANUAL_TH.html', 'DEPLOY_GITHUB_TH.html', 'package.json', 'Dockerfile',
        'render.yaml', '.dockerignore', '.gitignore'
    ]
    files = [ROOT / name for name in root_files]
    for folder in ['dist', 'server', 'docs', 'tests', 'tools', '.github']:
        files.extend(p for p in (ROOT / folder).rglob('*')
                     if p.is_file() and '__pycache__' not in p.parts and p.suffix != '.pyc')
    for file in files:
        if not file.is_file():
            raise FileNotFoundError(file)
    archive = outdir / 'IRON_TIDE_Battleship_Game.zip'
    with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for file in sorted(files):
            z.write(file, 'IRON_TIDE/' + file.relative_to(ROOT).as_posix())
    with zipfile.ZipFile(archive) as z:
        assert z.testzip() is None
        required = [
            'START_GAME.html', 'START_SERVER.bat', 'DEPLOY_GITHUB_TH.html',
            'dist/index.html', 'dist/config.js', 'dist/js/network.js',
            'dist/js/audio.js', 'server/server.cjs', '.github/workflows/pages.yml',
            'docs/VALIDATION.md', 'package.json'
        ]
        assert all('IRON_TIDE/' + path in z.namelist() for path in required)
        assert len(z.namelist()) == len(files)
        assert not any('/.git/' in path or '/.openai/' in path for path in z.namelist())
    print('Built:', archive)
    print('Files:', len(files), '| Bytes:', archive.stat().st_size)
    print('SHA256:', hashlib.sha256(archive.read_bytes()).hexdigest())

if __name__ == '__main__':
    main()
