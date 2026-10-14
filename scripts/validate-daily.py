"""Validate the latest real edition in each style without inventing today's news."""
import json,sys
from pathlib import Path
from datetime import datetime,timedelta,timezone
root=Path(sys.argv[1]);data=json.loads((root/'data.json').read_text());today=datetime.now(timezone(timedelta(hours=8))).date().isoformat()
report={}
for style in ('blue-white','dark'):
 entries=sorted((e for e in data['editions'] if e.get('style')==style),key=lambda e:e['date'],reverse=True)
 if not entries:raise RuntimeError('Missing style '+style)
 e=entries[0]
 if e['date']>today:raise RuntimeError('Future-dated edition')
 for field in ('image','thumbnail','preview'):
  p=root/e[field].removeprefix('./');raw=p.read_bytes()
  if len(raw)<200 or not(raw.startswith(b'\x89PNG') or raw.startswith(b'\xff\xd8\xff') or (raw[:4]==b'RIFF' and raw[8:12]==b'WEBP')):raise RuntimeError('Invalid raster '+str(p))
 report[style]={'id':e['id'],'date':e['date'],'image':e['image'],'preview':e['preview']}
body=(root/'index.html').read_text()
if 'data:image/webp;base64,' not in body:raise RuntimeError('Missing instant cover')
if not (root/'sw.js').exists():raise RuntimeError('Missing image cache worker')
print(json.dumps({'verified_build':True,'latest_styles':report,'today':today},ensure_ascii=False))
