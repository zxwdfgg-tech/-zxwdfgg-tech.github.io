#!/usr/bin/env python3
"""Fail the build if the public archive lacks today's complete two-style edition."""
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path
import sys

root=Path(sys.argv[1])
today=datetime.now(timezone(timedelta(hours=8))).date().isoformat()
data=json.loads((root/'data.json').read_text(encoding='utf8'))
status={}
for style in ('blue-white','dark'):
    matches=[e for e in data['editions'] if e.get('date')==today and e.get('style')==style]
    if not matches:
        raise RuntimeError(f"Missing {today} {style} edition")
    e=matches[0]
    f=root/e['image'].removeprefix('./')
    if not f.is_file() or f.stat().st_size < 200:
        raise RuntimeError(f"Missing or empty infographic: {f}")
    raw=f.read_bytes()
    raster=(raw.startswith(b'\x89PNG\r\n\x1a\n') or raw.startswith(b'\xff\xd8\xff') or (raw[:4]==b'RIFF' and raw[8:12]==b'WEBP'))
    if not raster:
        raise RuntimeError(f"Refuse simplified text-card replacement for {style}: {f}")
    status[style]={'title':e.get('title'),'kind':e.get('kind','upstream'),'image':e['image'],'bytes':f.stat().st_size}
body=(root/'index.html').read_text(encoding='utf8')
if today not in body:
    raise RuntimeError(f"Homepage does not contain edition for {today}")
print(json.dumps({'verified_public_build_date':today,'both_styles_complete':True,'styles':status},ensure_ascii=False))
