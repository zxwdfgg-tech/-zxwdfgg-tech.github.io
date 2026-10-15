"""Create cached reading-size assets, keeping all original downloads intact."""
import base64, hashlib, io, json
from pathlib import Path
from PIL import Image, ImageOps

def optimize(target, editions):
    used=set()
    latest_by_style={style:max((e for e in editions if e.get('style')==style),key=lambda e:(e['date'],e.get('updatedAt','')),default=None) for style in ['blue-white','dark']}
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
            # Full pixel dimensions and a lighter save-to-gallery copy; retain the PNG original.
            name=f'images/{identity}-download-v2.jpg';out=target/name
            if not out.exists(): im.save(out,'JPEG',quality=96,subsampling=0,optimize=True)
            variants['download']='./'+name;variants['downloadBytes']=out.stat().st_size;used.add(name)
            if e is latest_by_style.get(e.get('style')):
                pic=im.copy();pic.thumbnail((192,288));buf=io.BytesIO();pic.save(buf,'WEBP',quality=45,method=6)
                e['placeholder']='data:image/webp;base64,'+base64.b64encode(buf.getvalue()).decode()
        e.update(variants)
    return used

