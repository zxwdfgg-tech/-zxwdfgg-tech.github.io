"""Create a self-contained public Pages copy. No credentials are used or stored."""
import concurrent.futures
import hashlib
import html
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
import importlib.util
_spec=importlib.util.spec_from_file_location("reader_optimizer",Path(__file__).with_name("optimize-reader.py"))
_optimizer=importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_optimizer)

ORIGIN = 'https://dc-daily-xiaowei.zxwdfgg.chatgpt.site'
AGENT = 'Mozilla/5.0'

def fetch(path):
    url = urllib.parse.urljoin(ORIGIN, path)
    if urllib.parse.urlparse(url).netloc != urllib.parse.urlparse(ORIGIN).netloc:
        raise ValueError('Unexpected asset origin')
    last = None
    for attempt in range(4):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': AGENT})
            with urllib.request.urlopen(req, timeout=50) as response:
                if urllib.parse.urlparse(response.url).netloc != urllib.parse.urlparse(ORIGIN).netloc:
                    raise ValueError('Unexpected asset redirect')
                return response.read()
        except Exception as error:
            last = error
            if attempt < 3:
                time.sleep(attempt + 1)
    raise last

def image_type(raw):
    if raw.startswith(b'\x89PNG\r\n\x1a\n'): return '.png'
    if raw.startswith(b'\xff\xd8\xff'): return '.jpg'
    if raw[:4] == b'RIFF' and raw[8:12] == b'WEBP': return '.webp'
    raise ValueError('Asset is not a supported image')

def build(destination):
    target = Path(destination).resolve()
    target.mkdir(parents=True, exist_ok=True)
    assets = target / 'images'
    assets.mkdir(exist_ok=True)
    editions = json.loads(fetch('/api/editions'))['editions']
    config = json.loads(fetch('/api/config'))
    if not editions: raise ValueError('No editions to publish')
    previous = {}
    if (target / 'manifest.json').exists():
        try: previous = json.loads((target / 'manifest.json').read_text())
        except (ValueError, OSError): pass
    paths = sorted({e[k] for e in editions for k in ('image','thumbnail')})

    def mirror(path):
        known = previous.get(path)
        if known and re.fullmatch(r'images/[a-f0-9]{24}\.(png|jpg|webp)', known['file']):
            cached = target / known['file']
            if cached.is_file() and hashlib.sha256(cached.read_bytes()).hexdigest() == known['sha256']:
                return path, known
        raw = fetch(path)
        ext = image_type(raw)
        digest = hashlib.sha256(raw).hexdigest()
        local = f'images/{digest[:24]}{ext}'
        (target / local).write_bytes(raw)
        return path, {'file': local, 'sha256': digest, 'bytes': len(raw)}

    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        manifest = dict(pool.map(mirror, paths))
    for e in editions:
        e['image'] = './' + manifest[e['image']]['file']
        e['thumbnail'] = './' + manifest[e['thumbnail']]['file']
    used = {v['file'] for v in manifest.values()}
    used.update(_optimizer.optimize(target, editions))
    for local in assets.iterdir():
        if local.is_file() and f'images/{local.name}' not in used: local.unlink()
    editions.sort(key=lambda e:(e['date'],e.get('updatedAt','')), reverse=True)
    data = {'editions': editions, 'config': config, 'syncedAt': datetime.now(timezone.utc).isoformat()}
    body = fetch('/share/index.html').decode('utf-8')
    css = fetch('/share/styles.css')
    js = Path('dc-daily/app-fast.js').read_bytes()
    (target/'sw.js').write_bytes(Path('dc-daily/sw.js').read_bytes())
    latest = editions[0]
    poster = '<button class="poster-button" data-action="open-latest" aria-label="查看高清资讯原图"><img src="' + html.escape(latest.get('placeholder') or latest['thumbnail'],quote=True) + '" alt="' + html.escape(latest['title'],quote=True) + '" fetchpriority="high"></button>'
    body = body.replace('<!--LATEST-->', poster)
    body = body.replace('正在读取最新资讯…', html.escape(latest['title']))
    body = body.replace('<p id="latest-summary"></p>', '<p id="latest-summary">' + html.escape(latest['summary']) + '</p>')
    body = body.replace('<time id="latest-date"></time>', '<time id="latest-date">' + html.escape(latest['date'].replace('-','.')) + '</time>')
    body = body.replace('<strong id="edition-count">—</strong>', '<strong id="edition-count">' + str(len(editions)) + '</strong>')
    # Render immediately from a small recent bootstrap; fetch the complete archive in the background.
    recent=[e for style in ['blue-white','dark'] for e in [x for x in editions if x.get('style')==style][:4]]
    recent.sort(key=lambda e:(e['date'],e.get('updatedAt','')),reverse=True)
    initial={'editions':recent,'config':config,'bootstrap':True,'counts':{'total':len(editions),**{s:sum(e.get('style')==s for e in editions) for s in ['blue-white','dark']}}}
    serial = json.dumps(initial, ensure_ascii=False, separators=(',',':')).replace('<','\\u003c').replace('>','\\u003e').replace('&','\\u0026')
    body = re.sub(r'(<script id="initial-data" type="application/json">).*?(</script>)', lambda m:m[1]+serial+m[2], body, flags=re.S)
    body = body.replace('./styles.css', './styles.css?v=' + hashlib.sha256(css).hexdigest()[:12])
    body = body.replace('./app.js', './app.js?v=' + hashlib.sha256(js).hexdigest()[:12])
    fixes=Path('dc-daily/reader-fixes.css').read_bytes()
    body=body.replace('</head>','<link rel="stylesheet" href="./reader-fixes.css?v='+hashlib.sha256(fixes).hexdigest()[:12]+'"></head>')
    (target/'reader-fixes.css').write_bytes(fixes)
    body=body.replace('保存图片 ↓','保存高清图 ↓')
    switches='<div id="latest-switch" class="latest-switch">'
    for style,label in [('blue-white','蓝白竖版'),('dark','深色横版')]:
        record=next((e for e in editions if e.get('style')==style),None)
        if record: switches+='<button data-hero-style="'+style+'" class="'+('active' if latest['style']==style else '')+'">'+label+' <time>'+record['date'][5:].replace('-','月')+'日</time></button>'
    switches+='<button data-action="refresh-now" class="refresh-now">刷新 ↻</button></div>'
    body=body.replace('<section class="latest-section" id="today">','<section class="latest-section" id="today">'+switches)
    (target/'index.html').write_text(body,encoding='utf-8')
    (target/'data.json').write_text(json.dumps(data, ensure_ascii=False),encoding='utf-8')
    (target/'manifest.json').write_text(json.dumps(manifest),encoding='utf-8')
    (target/'styles.css').write_bytes(css)
    (target/'app.js').write_bytes(js)
    (target/'favicon.svg').write_bytes(fetch('/favicon.svg'))
    print(json.dumps({'success':True,'editions':len(editions),'blue_white':sum(e.get('style')=='blue-white' for e in editions),'dark':sum(e.get('style')=='dark' for e in editions),'latest':latest['date'],'images':len(used),'self_contained':True}))

if __name__ == '__main__':
    build(sys.argv[1] if len(sys.argv)>1 else 'daily-cache')


