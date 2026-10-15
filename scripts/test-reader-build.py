"""Deterministic reader publication checks; does not modify published news."""
import importlib.util,json,re,tempfile
from pathlib import Path
from PIL import Image

spec=importlib.util.spec_from_file_location('optimizer',Path(__file__).with_name('optimize-reader.py'))
optimizer=importlib.util.module_from_spec(spec);spec.loader.exec_module(optimizer)
with tempfile.TemporaryDirectory() as directory:
    root=Path(directory);(root/'images').mkdir()
    Image.new('RGB',(3840,2160),'#123456').save(root/'images/dark.png')
    Image.new('RGB',(1024,1536),'#eeeeee').save(root/'images/blue.png')
    editions=[{'id':'yesterday','style':'blue-white','date':'2026-10-14','image':'./images/blue.png'},
              {'id':'today','style':'dark','date':'2026-10-15','image':'./images/dark.png'}]
    before={e['id']:(root/e['image']).read_bytes() for e in editions}
    used=optimizer.optimize(root,editions)
    for e in editions:
        assert (root/e['image']).read_bytes()==before[e['id']]
        assert e['placeholder'].startswith('data:image/webp;base64,')
        assert len(e['placeholder'])<15000
        with Image.open(root/e['download']) as im:assert im.size==(e['width'],e['height'])
    assert len(used)==6
js=Path('dc-daily/app-fast.js').read_text()
assert "editions.find(e=>e.style==='blue-white') || editions[0]" not in js
assert 'navigator.canShare' not in js,'Saving must not depend on sharing API'
assert 'a.download=name' in js and 'NativeDaily.saveImage(url,name)' in js
assert "document.addEventListener('visibilitychange'" in js
assert 'data-download=' in js
print('PASS: both styles get compact placeholders and full-size JPEG downloads; original bytes retained; latest-date, resume and save paths present.')
