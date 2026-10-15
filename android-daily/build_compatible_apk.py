"""Package daily news using the original NiuGe WebView APK container."""
from pathlib import Path
import hashlib
import json
import struct
import subprocess
import zipfile
import zlib

ROOT=Path(__file__).resolve().parent
PACKAGE='cn.zhangxiaowei.dcdaily'
TITLE='数据中心每日资讯'
OUTPUT='DataCenterDaily_v1.3.apk'


def chunks(data,start=8):
    while start<len(data):
        kind,header,size=struct.unpack_from('<HHI',data,start)
        assert size>=header and start+size<=len(data)
        yield start,kind,header,size
        start+=size


def patch_manifest(data):
    body=[]
    strings=[]
    for offset,kind,header,size in chunks(data):
        part=bytearray(data[offset:offset+size])
        if kind==1:
            count,styles,flags,start,_=struct.unpack_from('<IIIII',part,8)
            assert styles==0 and not flags&0x100
            for index in range(count):
                position=start+struct.unpack_from('<I',part,header+4*index)[0]
                length=struct.unpack_from('<H',part,position)[0]
                assert length<0x8000
                strings.append(part[position+2:position+2+length*2].decode('utf-16le'))
            replacements={
                'com.niuge.zuiwen':PACKAGE,
                '.MainActivity':'com.niuge.zuiwen.MainActivity',
                'android.permission.VIBRATE':'android.permission.INTERNET',
                '1.0':'1.3',
            }
            strings=[replacements.get(s,s) for s in strings]
            label=len(strings)
            strings.append(TITLE)
            offsets=[]
            raw=bytearray()
            for text in strings:
                encoded=text.encode('utf-16le')
                offsets.append(len(raw))
                raw.extend(struct.pack('<H',len(encoded)//2)+encoded+b'\0\0')
            raw.extend(b'\0'*((-len(raw))%4))
            start=28+4*len(strings)
            body.append(struct.pack('<HHIIIIII',1,28,start+len(raw),len(strings),0,0,start,0)
                +struct.pack('<'+'I'*len(strings),*offsets)+raw)
        else:
            if kind==0x102:
                _,_,start,attr_size,count,*_=struct.unpack_from('<IIHHHHHH',part,16)
                for index in range(count):
                    position=16+start+index*attr_size
                    _,name,_,_,_,value_type,value=struct.unpack_from('<IIIHBBI',part,position)
                    if strings[name]=='versionCode':
                        struct.pack_into('<I',part,position+16,4)
                    elif strings[name]=='label':
                        struct.pack_into('<I',part,position+8,label)
                        part[position+15]=3
                        struct.pack_into('<I',part,position+16,label)
            body.append(bytes(part))
    result=b''.join(body)
    return struct.pack('<HHI',3,8,len(result)+8)+result


def patch_resource_package(data):
    # Keep the original resource pools, type tables, IDs, offsets and layouts.
    result=bytearray(data)
    for offset,kind,header,size in chunks(data,12):
        if kind==0x200:
            name=PACKAGE.encode('utf-16le')
            result[offset+12:offset+268]=name+b'\0'*(256-len(name))
    return bytes(result)


def patch_resume(data):
    # Only replace an existing equal-length JavaScript literal; DEX layout stays unchanged.
    original=b'window.onAppResume&&onAppResume()'
    # This prefix also keeps the DEX string-ID pool in its required lexical order.
    replacement=b'window.onAppR=location.reload()'.ljust(len(original),b' ')
    assert data.count(original)==1
    result=bytearray(data.replace(original,replacement))
    result[12:32]=hashlib.sha1(result[32:]).digest()
    struct.pack_into('<I',result,8,zlib.adler32(result[12:])&0xffffffff)
    count,offset=struct.unpack_from('<II',result,56)
    strings=[]
    for index in range(count):
        position=struct.unpack_from('<I',result,offset+4*index)[0]
        while result[position]&0x80:position+=1
        position+=1
        end=result.index(0,position)
        strings.append(bytes(result[position:end]).decode('utf-8'))
    assert strings==sorted(strings),'DEX string IDs must remain sorted'
    return bytes(result)


def build():
    build=ROOT/'build'
    build.mkdir(exist_ok=True)
    with zipfile.ZipFile(ROOT/'template/base.apk') as archive:
        entries={name:archive.read(name) for name in archive.namelist()
            if not name.startswith(('assets/','META-INF/'))}
    entries['AndroidManifest.xml']=patch_manifest(entries['AndroidManifest.xml'])
    entries['resources.arsc']=patch_resource_package(entries['resources.arsc'])
    original_dex=entries['classes.dex']
    entries['classes.dex']=(ROOT/'native/classes.dex').read_bytes()
    for file in sorted((ROOT/'assets').rglob('*')):
        if file.is_file():entries['assets/'+str(file.relative_to(ROOT/'assets'))]=file.read_bytes()
    for file in sorted((ROOT/'icons').rglob('*.png')):
        entries[str(file.relative_to(ROOT/'icons'))]=file.read_bytes()
    unsigned=build/'unsigned.apk'
    with zipfile.ZipFile(unsigned,'w') as archive:
        for name,data in entries.items():
            info=zipfile.ZipInfo(name,(2026,10,13,0,0,0))
            info.compress_type=zipfile.ZIP_STORED
            padding=(-(archive.fp.tell()+30+len(name.encode())+4))%4
            info.extra=struct.pack('<HH',0xffff,padding)+b'\0'*padding
            archive.writestr(info,data)
    output=ROOT/OUTPUT
    signer=['java','-cp',str(ROOT/'tools/apksigner/*'),'com.android.apksigner.ApkSignerTool']
    subprocess.run(signer+['sign','--key',str(ROOT/'signing/release.pk8'),'--cert',str(ROOT/'signing/release.pem'),
        '--v1-signing-enabled','true','--v2-signing-enabled','true','--v3-signing-enabled','true',
        '--out',str(output),str(unsigned)],check=True)
    verification=subprocess.check_output(signer+['verify','--verbose','--print-certs',str(output)],text=True)
    (build/'signature-verification.txt').write_text(verification)
    with zipfile.ZipFile(output) as archive:
        assert archive.testzip() is None
        dex=archive.read('classes.dex')
        assert dex[12:32]==hashlib.sha1(dex[32:]).digest()
        assert struct.unpack_from('<I',dex,8)[0]==zlib.adler32(dex[12:])&0xffffffff
        assert len(dex)>1000
        assert archive.read('assets/index.html')==(ROOT/'assets/index.html').read_bytes()
        raw=output.read_bytes()
        for info in archive.infolist():
            if info.compress_type==zipfile.ZIP_STORED:
                name_size,extra_size=struct.unpack_from('<HH',raw,info.header_offset+26)
                assert (info.header_offset+30+name_size+extra_size)%4==0
    report={'output':str(output),'package':PACKAGE,'version':'1.3','versionCode':4,
        'container':'original NiuGe v1.0 Android WebView host','native_activity':'com.niuge.zuiwen.MainActivity',
        'min_sdk':21,'target_sdk':34,'template_bytes':(ROOT/'template/base.apk').stat().st_size,
        'template_sha256':hashlib.sha256((ROOT/'template/base.apk').read_bytes()).hexdigest(),
        'dex_structure_preserved':False,'resource_pool_structure_preserved':True,
        'refresh_on_foreground':False,'background_content_check':True,'native_save':True,'pinch_zoom':True,'signature_verified':True,'physical_device_tested':False,
        'bytes':output.stat().st_size,'sha256':hashlib.sha256(output.read_bytes()).hexdigest()}
    (build/'build-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
    print(verification)
    print(json.dumps(report,ensure_ascii=False))


if __name__=='__main__':build()
