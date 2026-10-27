#!/usr/bin/env python3
"""同步 Bilibili 公开视频元数据，不下载视频/封面，不声称已核实故障结论。
运行：python3 chengyang/sync_bilibili.py
可选环境变量：BILI_UID、BILI_SESSDATA、BILI_MAX_PAGES、BILI_DELAY_SECONDS。
无凭据时尽力使用公开接口。接口阻断时安全失败，绝不覆盖已有数据。
"""
from __future__ import annotations
import datetime
import hashlib
import html
import json
import os
import random
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "videos.json"
UID = str(os.environ.get("BILI_UID", "1985127693"))
SESSDATA = os.environ.get("BILI_SESSDATA", "")
MAX_PAGES = int(os.environ.get("BILI_MAX_PAGES", "100"))
DELAY = float(os.environ.get("BILI_DELAY_SECONDS", "1.4"))
OWNER_URL = "https://space.bilibili.com/" + UID + "/video"
MIXIN_TABLE = [
    46,47,18,2,53,8,23,32,15,50,10,31,58,3,45,35,27,43,5,49,
    33,9,42,19,29,28,14,39,12,38,41,13,37,48,7,16,24,55,40,61,
    26,17,0,1,60,51,30,4,22,25,54,21,56,59,6,63,57,62,11,36,20,34,44,52
]

def get_json(url: str) -> dict:
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36",
        "Referer": OWNER_URL,
        "Accept": "application/json,text/plain,*/*",
        "Accept-Language": "zh-CN,zh;q=0.9",
    }
    if SESSDATA:
        headers["Cookie"] = "SESSDATA=" + SESSDATA
    error = None
    for trial in range(3):
        try:
            request = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(request, timeout=25) as response:
                value = json.loads(response.read().decode("utf-8"))
            if not isinstance(value, dict) or value.get("code") != 0:
                raise RuntimeError("接口返回异常 code=" + str(value.get("code")) + " " + str(value.get("message", ""))[:120])
            return value.get("data", {})
        except (urllib.error.HTTPError, urllib.error.URLError, RuntimeError, ValueError, TimeoutError) as ex:
            error = ex
            if trial < 2:
                time.sleep(3 + trial * 4 + random.random())
    raise RuntimeError("无法读取公开接口：" + str(error)) from error

def wbi_key() -> str:
    data = get_json("https://api.bilibili.com/x/web-interface/nav")
    img = data.get("wbi_img") or {}
    first = (img.get("img_url") or "").rsplit("/", 1)[-1].split(".")[0]
    second = (img.get("sub_url") or "").rsplit("/", 1)[-1].split(".")[0]
    raw = first + second
    if not raw:
        raise RuntimeError("未取得WBI签名信息")
    return "".join(raw[i] for i in MIXIN_TABLE if len(raw) > i)[:32]

def signed_url(page: int, key: str) -> str:
    params = {
        "mid": UID, "pn": page, "ps": 50, "tid": 0,
        "keyword": "", "order": "pubdate", "order_avoided": "true",
        "wts": int(time.time())
    }
    safe = {k: re.sub(r"[!'()*]", "", str(v)) for k, v in params.items()}
    query = urllib.parse.urlencode(sorted(safe.items()))
    safe["w_rid"] = hashlib.md5((query + key).encode("utf-8")).hexdigest()
    return "https://api.bilibili.com/x/space/wbi/arc/search?" + urllib.parse.urlencode(sorted(safe.items()))

def classify(title: str) -> str:
    t = title.lower()
    if re.search(r"充电桩|充电枪|充不了电", t):
        return "充电桩"
    if re.search(r"跳闸|漏保跳|总闸|空开跳|断路器跳|电闸跳", t):
        return "跳闸保护"
    if re.search(r"零线|中性线|零地|断零|接地异常|地线", t):
        return "零线接地"
    if re.search(r"触电|电人|漏电|外壳带电|麻手", t):
        return "漏电触电"
    if re.search(r"电压|欠压|过压|电压低|三相不平衡", t):
        return "电压异常"
    if re.search(r"电机|电动机|接触器|变频器|水泵|设备|控制柜|电焊机", t):
        return "电机设备"
    if re.search(r"万用表|电笔|钳表|测量|测试仪|摇表|兆欧表", t):
        return "仪表测量"
    if re.search(r"插座|灯|照明|开关|电线不通|没电|断电", t):
        return "插座照明"
    return "综合疑难"

def from_platform(v: dict) -> dict | None:
    bvid = str(v.get("bvid") or "")
    if not re.fullmatch(r"BV[a-zA-Z0-9]{8,16}", bvid):
        return None
    title = re.sub(r"<[^>]*>", "", html.unescape(str(v.get("title") or ""))).strip()
    if not title:
        return None
    timestamp = v.get("created") or v.get("pubdate") or 0
    date = datetime.datetime.fromtimestamp(int(timestamp),datetime.timezone.utc).strftime("%Y-%m-%d") if timestamp else ""
    return {
        "id": bvid, "title": title, "date": date,
        "category": classify(title), "equipment": "按标题待细分",
        "tags": [], "platform": "bilibili",
        "url": "https://www.bilibili.com/video/" + bvid + "/",
        "status": "公开元数据·按标题自动分类，未观看核实"
    }

def main() -> int:
    # 现有人工核验记录优先；自动记录按ID去重，不冲掉手工分类。
    current = json.loads(OUT.read_text(encoding="utf-8")) if OUT.exists() else {}
    existing = list(current.get("items") or [])
    verified = {str(x.get("id")): x for x in existing if "已核对" in str(x.get("status", ""))}
    key = wbi_key()
    retrieved = []
    expected_count = None
    for pn in range(1, MAX_PAGES + 1):
        if pn > 1:
            time.sleep(DELAY + random.random() * 0.8)
        data = get_json(signed_url(pn, key))
        container = data.get("list") or {}
        part = container.get("vlist") or []
        if expected_count is None:
            expected_count = int((data.get("page") or {}).get("count") or 0)
            print("平台报告视频数:", expected_count)
        if not part:
            break
        for raw in part:
            item = from_platform(raw)
            if item:
                retrieved.append(item)
        print("第", pn, "页，当前", len(retrieved), "条", flush=True)
        if expected_count and len(retrieved) >= expected_count:
            break
    if not retrieved:
        raise RuntimeError("未能取得有效视频，保留已有文件")
    merged = {}
    # 不删除原有已核验条目：UP主若下架视频，来源链接也要人工检查才能决定移除。
    for x in retrieved:
        merged[x["id"]] = x
    for x in existing:
        if str(x.get("id")) not in merged:
            merged[str(x.get("id"))] = x
    merged.update(verified)
    items = sorted(merged.values(), key=lambda x: str(x.get("date","")), reverse=True)
    result = {
        "updated": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d"),
        "owner": current.get("owner","城阳电工电路"),
        "owner_url": OWNER_URL,
        "notes": "非官方学习索引。仅整理可访问的公开视频元数据，不下载视频；自动分类基于标题，仅供检索。平台公开列表可能不含全部历史作品。",
        "platform_reported_count": expected_count,
        "platform_fetched_count": len({x["id"] for x in retrieved}),
        "items": items
    }
    tmp = OUT.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    tmp.replace(OUT)
    print("成功更新目录；索引总计", len(items), "条；不代表已逐一观看或核实")
    return 0

if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as error:
        print("同步失败，已保留原目录：", error, file=sys.stderr)
        sys.exit(1)
