#!/usr/bin/env python3
"""Confirm CDN-served Pages content, not just a successful GitHub Action."""
import json
import time
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone

BASE='https://zxwdfgg-tech.github.io/-zxwdfgg-tech.github.io/dc-daily/'
TODAY=datetime.now(timezone(timedelta(hours=8))).date().isoformat()

def get(path, n):
    url=urllib.parse.urljoin(BASE,path)+f'?buildcheck={n}'
    req=urllib.request.Request(url,headers={'User-Agent':'Daily-Pages-Validator/1.0','Cache-Control':'no-cache'})
    with urllib.request.urlopen(req,timeout=25) as r:
        if r.status!=200:
            raise RuntimeError(f'{url} returned HTTP {r.status}')
        return r.read()

last=None
for n in range(1,7):
    try:
        blob=get('data.json',n)
        payload=json.loads(blob)
        report={}
        for style in ('blue-white','dark'):
            available=[x for x in payload.get('editions',[]) if x.get('date')==TODAY and x.get('style')==style]
            if not available:
                raise RuntimeError(f'Missing CDN data for {TODAY} {style}')
            first=available[0]
            path=first['image']
            sample=get(path,n)[:200]
            if not (sample.startswith(b'\x89PNG') or sample.startswith(b'\xff\xd8\xff') or sample[:4]==b'RIFF' or b'<svg' in sample):
                raise RuntimeError(f'Bad image response for {style}')
            report[style]={'title':first.get('title'),'image':path,'kind':first.get('kind','upstream')}
        home=get('index.html',n)
        if TODAY.encode() not in home:
            raise RuntimeError('Published homepage does not contain current date')
        print(json.dumps({'public_pages_verified':True,'date':TODAY,'styles':report},ensure_ascii=False))
        break
    except Exception as ex:
        last=ex
        print(f'Public verification attempt {n}/6: {ex}',flush=True)
        if n!=6: time.sleep(6)
else:
    raise RuntimeError(f'Public Pages daily edition verification failed: {last}')
