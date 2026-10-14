"""Create cached reading-size assets, keeping all original downloads intact."""
import base64, hashlib, io, json
from pathlib import Path
from PIL import Image, ImageOps

def optimize(target, editions):
    used=set()
    for e in editions:
        original=target/e['image'].removeprefix('./')
        identity=hashlib.sha256(original.read_bytes()).hexdigest()[:24]
        variants={}
        with Image.open(original) as source:
            im=ImageOps.exif_transpose(source).convert('RGB')
            e['width'],e['height']=im.size
            for field,limit,quality in [('thumbnail',480,72),('preview',1600,88)]:
                name=f'images/{identity}-{field}-v1.webp'
                out=target/name
                if not out.exists():
                    pic=im.copy();pic.thumbnail((limit,limit*2))
                    pic.save(out,'WEBP',quality=quality,method=6)
                variants[field]='./'+name;used.add(name)
            if e is next((x for x in editions if x.get('style')=='blue-white'),None):
                pic=im.copy();pic.thumbnail((320,480));buf=io.BytesIO();pic.save(buf,'WEBP',quality=60,method=6)
                e['placeholder']='data:image/webp;base64,'+base64.b64encode(buf.getvalue()).decode()
        e.update(variants)
    return used
