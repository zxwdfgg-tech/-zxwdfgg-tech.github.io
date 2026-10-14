"""Verify the actual deployed edition IDs/assets against this build, including older editions before scheduled publication."""
import json,time,urllib.request,urllib.parse,hashlib
from pathlib import Path
BASE='https://zxwdfgg-tech.github.io/-zxwdfgg-tech.github.io/dc-daily/'
root=Path('daily-cache');expected=json.loads((root/'data.json').read_text())
def get(path,n):
 url=urllib.parse.urljoin(BASE,path)+f'?buildcheck={time.time_ns()}-{n}'
 with urllib.request.urlopen(urllib.request.Request(url,headers={'Cache-Control':'no-cache'}),timeout=30) as r:return r.read()
for n in range(6):
 try:
  data=json.loads(get('data.json',n))
  assert data==expected,'CDN data has not reached the new build'
  for style in ('blue-white','dark'):
   e=next(e for e in data['editions'] if e['style']==style)
   for field in ('image','thumbnail','preview'):
    path=e[field];assert hashlib.sha256(get(path,n)).digest()==hashlib.sha256((root/path.removeprefix('./')).read_bytes()).digest(),field+' differs'
  for name in ('app.js','sw.js'):
   assert get(name,n)==(root/name).read_bytes(),name+' not updated'
  assert b'data:image/webp;base64,' in get('index.html',n)
  print(json.dumps({'public_pages_verified':True,'editions':len(data['editions']),'optimized_reader':True}));break
 except Exception as e:
  if n==5:raise
  print('Waiting for CDN:',str(e),flush=True);time.sleep(6)
