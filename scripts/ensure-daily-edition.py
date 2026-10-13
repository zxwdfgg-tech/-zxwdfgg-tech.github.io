#!/usr/bin/env python3
"""Publish an explicitly labelled daily technical review when the news pipeline has no edition.
Use only standard-library modules; preserve existing real news, editions, and site configuration.
"""
import html
import json
import re
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

TOPICS = [
 ("液冷CDU：压差报警如何排查","一次侧、二次侧与泵组运行边界",[
  ("先认清两侧","CDU通过换热器连接设施冷却水与IT液冷回路；两侧介质和压力控制不可混为一谈。"),
  ("读懂压差","供回水压差是判断流量条件的线索，但不能仅凭压差直接断定流量达标。"),
  ("检查顺序","先核实传感器与设定值，再看阀位、滤网、泵状态、旁通及换热工况。"),
  ("泄漏处置","告警时先定位一次侧还是二次侧，按现场应急预案隔离，避免盲目停泵。"),
  ("运行记录","同步记录温度、压力、流量、阀位和告警前后变化，便于识别趋势。"),
  ("核心判断","不能只看单一告警值；要把流量、温差、压差与IT热负载联系起来。")]),
 ("双路供电：A/B真能独立吗","识别共因故障比只看两条线路更重要",[
  ("物理隔离","核查双路电缆、母线、配电柜及末端PDU是否存在同一故障点。"),
  ("上级电源","不同柜号不代表不同供电来源，要沿单线图向上追溯。"),
  ("切换逻辑","理解ATS与ST​S的设备边界，避免把切换装置当作冗余电源。"),
  ("负载分配","双电源IT设备应验证单路失效时另一侧有足够承载能力。"),
  ("巡检证据","核对标签、实际回路、保护整定与运维图纸是否一致。"),
  ("关键提醒","冗余不只在数量，更在于单点故障是否真正被消除。")]),
 ("电池监控：单体异常怎么看","内阻、温度和电压必须结合分析",[
  ("电压不是全部","单体浮充电压正常，不一定代表电池实际容量足够。"),
  ("温度影响","局部过热会影响寿命和安全，先核对环境与连接状态。"),
  ("趋势优先","单次内阻值不足以下定论，应结合基线和同组变化。"),
  ("连接检查","电池端子松动与接触不良可能造成温升及异常压降。"),
  ("放电核验","容量需要按厂家及现场条件进行规范测试，不建议随意深度放电。"),
  ("安全底线","触及电池组前遵守直流电与短路防护、隔离及授权要求。")]),
 ("热通道封闭：温度高不等于冷量不够","先查气流组织，再判断制冷能力",[
  ("回风与送风","冷热气流混合会降低冷却利用率，温度点位要有代表性。"),
  ("盲板缺失","机柜未封堵空间可能造成热空气回流，优先排查泄漏路径。"),
  ("机柜负载","重点看高密度机柜进风温度，别只看机房平均温度。"),
  ("压差配合","风量与通道压差需结合设备要求调整，过大也可能带来问题。"),
  ("报警追因","空调、风机、控制阀和传感器要交叉核查。"),
  ("结论","先解决短路风与旁通风，再评估新增制冷投资。")]),
 ("柴油发电机：启动成功不等于带载成功","从启动、励磁到ATS恢复的完整链路",[
  ("启动链路","核查蓄电池、电启动回路、燃油及控制器启动许可。"),
  ("电压建立","启动后还要确认频率、电压和稳定性符合现场切换条件。"),
  ("ATS条件","ATS要核对双路电压检测、延时和联锁逻辑。"),
  ("带载风险","突加负载可能导致转速或电压波动，需匹配机组能力。"),
  ("故障留痕","记录启动时间、输出参数、报警及恢复过程。"),
  ("测试边界","带载试验按批准方案执行，不在业务高风险时段随意切换。")]),
 ("漏水检测：误报和真实渗漏怎么分","把告警位置映射到物理管线",[
  ("定位先行","根据漏水绳/探头分区信息确认现场位置。"),
  ("现场核查","留意冷凝水、接头、阀门和地面积水等不同来源。"),
  ("误报因素","探头污染、线缆受潮或安装位置不当都值得排查。"),
  ("隔离原则","不确定漏点时避免扩大停水范围，按应急分级执行。"),
  ("保护设备","水与电气设备邻近时，优先落实触电和设备安全措施。"),
  ("复位要求","先消除原因、确认环境恢复，再按规程复位告警。")]),
 ("PDU支路：电流正常也要查这些","谐波、温升和连接可靠性不可忽视",[
  ("负载计算","按支路额定、连续负载工况和允许裕量核查。"),
  ("相位分配","三相负荷应结合实测电流平衡，不凭插座数量平均。"),
  ("红外测温","比对同类连接点温度，排查松动与接触电阻变化。"),
  ("保护配合","支路断路器选型与上级保护选择性应综合校核。"),
  ("告警记录","记录峰值电流、异常时间与新增负载操作。"),
  ("维护要求","严禁带电随意插拔不适用的高负载连接器。")]),
 ("UPS静态旁路：切过去并非万事大吉","输入条件、同步窗口和负载风险",[
  ("电源条件","旁路输入的质量直接影响旁路供电时的负载风险。"),
  ("同步状态","逆变与旁路同步条件不满足可能影响切换策略。"),
  ("告警区分","静态旁路、维修旁路和逆变供电是不同运行状态。"),
  ("过载逻辑","过载、故障及保护动作可能触发旁路，必须追根因。"),
  ("单点分析","评估旁路路径自身是否存在共同故障点。"),
  ("处置原则","依厂家程序及已批准操作票执行，避免盲目切换。")]),
 ("机柜接地：别把N线当PE线","保护接地与电位连接的不同作用",[
  ("基础概念","PE用于保护接地，N用于工作回路，不能在末端随意混接。"),
  ("连接质量","接地连续性需要实测，不能只靠肉眼看线鼻子。"),
  ("等电位","机柜、桥架及设备外壳按设计要求建立电位连接。"),
  ("漏电排查","绝缘异常与残余电流告警应分层确认真实回路。"),
  ("施工复核","新增设备需核对PE截面、接线和标识。"),
  ("安全提醒","任何保护接地变更应由具备资质人员按规程进行。")]),
 ("制冷阀门：开度100%还是不降温","从控制信号到水力条件逐项排查",[
  ("控制需求","先确认设定值、实际温度和控制器输出是否合理。"),
  ("执行机构","阀门反馈开度不一定代表阀芯真实到位。"),
  ("水力条件","水压差不足、滤网堵塞都会影响换热流量。"),
  ("温差证据","结合供回水温差、流量、负载与盘管状态判断。"),
  ("故障边界","区分自控故障、机械卡滞与冷源不足。"),
  ("记录闭环","处理后复测温度趋势，而不是只清除报警。")]),
 ("监控告警：一条离线消息如何定位","将网络故障与设备故障分开",[
  ("先看范围","同一交换机下多个点位离线，优先看公共通信链路。"),
  ("设备状态","现场检查电源、运行灯和本地面板状态。"),
  ("网络链路","按物理端口、交换机、地址、路由和平台逐层确认。"),
  ("协议检查","核对Modbus、SNMP等采集参数及轮询状态。"),
  ("时间对齐","将监控告警时间与网络日志、设备事件记录对齐。"),
  ("重要区分","采集离线不等于供电失效，也不能忽视真实隐患。")]),
 ("精密空调：频繁启停的排查顺序","温控、传感、控制回路与负载波动",[
  ("温控逻辑","先确认回差、设定值与控制参数是否合适。"),
  ("感测位置","探头靠近送风口可能造成错误的运行反馈。"),
  ("冷量匹配","检查机房热负载变化及制冷设备最小运行条件。"),
  ("执行元件","风机、压缩机、阀门及联锁故障均可能参与。"),
  ("历史趋势","查看启停周期与报警时序，避免仅凭瞬间温度判断。"),
  ("优化目标","以设备安全、稳定温控及运行效率综合权衡。")]),
 ("电能质量：三相电流平衡还不够","关注谐波、中性线与瞬态事件",[
  ("测量口径","区分有效值、电流基波和谐波含量。"),
  ("中性线风险","非线性单相负载可能引起中性线谐波电流。"),
  ("相间对比","三相电流接近不等于三相电压质量完全一致。"),
  ("瞬态事件","短时电压暂降可能影响敏感设备，应查事件记录。"),
  ("测试工具","按需要使用电能质量分析仪，不凭普通钳表断言谐波。"),
  ("工程启示","电压、电流、功率因数、谐波和事件需联动分析。")]),
 ("柴油供油：油箱有油仍可能启动失败","低液位以外的系统性原因",[
  ("供油路径","核查油路阀位、滤芯、管路与供油泵工作状态。"),
  ("空气进入","油路进气可能影响建立正常供油压力。"),
  ("油品条件","关注油品状态、储存与污染风险。"),
  ("启动许可","同时检查紧急停机、控制电源与故障闭锁。"),
  ("测试规程","排查中避免非授权反复启动造成附加风险。"),
  ("排障闭环","保存实际油压、故障代码及维修复测结果。")]),
 ("母线测温：温升到底说明什么","环境温度、负荷与接头状态综合看",[
  ("相对温差","比较相似位置、相似负荷下的温度，更有价值。"),
  ("负荷关联","电流变化会影响发热，记录测量时实际负荷。"),
  ("接触故障","局部异常温升需排查压接、连接面与紧固状态。"),
  ("测量误差","红外测温受发射率、反光和视角影响。"),
  ("检修措施","需要停电紧固时执行安全隔离及验电流程。"),
  ("趋势留档","关注持续升温趋势，不能仅看一次温度数值。")]),
 ("设备容量：kW和kVA别混淆","功率因数与可用容量的工程意义",[
  ("有功功率","kW对应实际有功负载，热设计还需看能量转换。"),
  ("视在功率","kVA与电压、电流有关，不能直接视为相同kW。"),
  ("功率因数","实际设备与运行状态影响kW/kVA关系。"),
  ("余量判断","容量核算还应考虑峰值、电机启动与冗余要求。"),
  ("系统链路","UPS、电缆、断路器与末端配电应协同校核。"),
  ("操作提醒","不要仅用铭牌一个数字判断整个供电链路可用性。")]),
 ("消防联动：一条告警会影响多少系统","识别火灾报警和设备联锁边界",[
  ("信号区分","探测器报警、确认火警与联动执行不是同一事件。"),
  ("控制对象","不同设计可能联动风阀、排风、空调或相关设备。"),
  ("供电影响","核对关键负载供电策略，切勿自行改动联动逻辑。"),
  ("核查步骤","从报警点、联动输出到实际设备反馈逐环确认。"),
  ("演练管理","联动测试须经审批，避免误触发影响业务。"),
  ("记录追踪","保存事件链、复位条件及整改验证材料。")]),
 ("发电机并机：同步条件看什么","频率、相位、电压与负荷分担",[
  ("电压条件","待并机组与母线电压需要满足同步允许范围。"),
  ("频率匹配","并机时关注频率差、相位差及同步控制器状态。"),
  ("负荷分担","有功与无功负荷分担依赖调速和励磁控制协调。"),
  ("保护边界","不同步并机具有严重风险，应依赖设计保护联锁。"),
  ("观察重点","投入后记录电压、频率、功率与告警变化。"),
  ("安全要求","现场并机操作和测试仅能按批准的专业方案实施。")]),
 ("桥架与线缆：为什么分层敷设","散热、电磁兼容与维护安全",[
  ("线缆分类","强弱电、动力与通信线路按设计要求分别敷设。"),
  ("散热条件","线缆集中敷设应校核环境温度与载流量修正。"),
  ("弯曲半径","电缆敷设不得小于厂家与标准规定的最小半径。"),
  ("支撑与保护","核查桥架固定、边缘保护、防火封堵和标识。"),
  ("维护空间","保留检修路径，避免新增电缆妨碍其他系统。"),
  ("现场复查","图纸与实际线路保持一致，便于故障定位。")]),
 ("能耗指标：PUE不等于机房全部","理解边界、计量点与工况变化",[
  ("概念边界","PUE是数据中心总能耗与IT设备能耗之比。"),
  ("计量口径","统计边界不一致时，不同站点的数据不可简单横比。"),
  ("季节影响","气候、IT负载与冷却模式都会影响PUE。"),
  ("瞬时与年度","瞬时读数不等于年度表现，应明确统计周期。"),
  ("运维价值","除PUE外，还应关注可靠性、用水和容量利用率。"),
  ("判断原则","优化能耗不能以牺牲关键业务的可靠性为代价。")])
]

def esc(s):
    return html.escape(str(s), quote=True)

def topic_for(day):
    return TOPICS[(day.day - 13) % len(TOPICS)]

def chunks(s, width):
    # Simple width guard for dense Han text; SVG text elements do not wrap.
    return [s[i:i+width] for i in range(0, len(s), width)]

def svg_for(day, style):
    title, subtitle, points = topic_for(day)
    portrait = style == 'blue-white'
    w,h=(1280,1920) if portrait else (1920,1080)
    navy='#102B56'; white='#FFFFFF'; gold='#F4C655'
    pieces=[f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">',
            f'<rect width="{w}" height="{h}" fill="{"#F4F8FD" if portrait else "#081C36"}"/>',
            f'<rect width="{w}" height="{335 if portrait else 215}" fill="{navy if portrait else "#0E315A"}"/>']
    def label(x,y,s,size,color,weight=400):
        pieces.append(f'<text x="{x}" y="{y}" font-size="{size}" fill="{color}" font-weight="{weight}" font-family="Noto Sans CJK SC,Microsoft YaHei,Arial,sans-serif">{esc(s)}</text>')
    label(65,85,"数据中心每日资讯  /  DATA CENTER DAILY",40 if portrait else 38,white,700)
    label(65,145,day.strftime('%Y.%m.%d')+"  ·  运维知识复盘",29, gold,700)
    label(65,225 if portrait else 193,title,57 if portrait else 52,white,800)
    if portrait:
        label(65,296,subtitle,29,'#DAE8FA')
        for i,(head,body) in enumerate(points):
            y=360+i*234
            pieces.append(f'<rect x="47" y="{y}" rx="18" width="1186" height="213" fill="#FFFFFF" stroke="#D7E4F0" stroke-width="2"/>')
            pieces.append(f'<rect x="47" y="{y}" rx="8" width="12" height="213" fill="#1478CC"/>')
            label(82,y+65,f'{i+1:02d}  {head}',36,navy,700)
            for j,line in enumerate(chunks(body,36)[:3]):
                label(84,y+119+j*43,line,29,'#374A64')
        label(65,1853,'技术学习内容 · 非当日突发新闻｜实际操作请以现场规程为准',24,'#4B6585')
    else:
        label(1100,140,subtitle,28,'#D1E9FF')
        for i,(head,body) in enumerate(points):
            col=i%3; row=i//3; x=45+col*630; y=245+row*350
            pieces.append(f'<rect x="{x}" y="{y}" rx="24" width="605" height="322" fill="#123359" stroke="#28547F" stroke-width="2"/>')
            label(x+24,y+65,f'{i+1:02d}  {head}',31,gold,700)
            for j,line in enumerate(chunks(body,23)[:5]):
                label(x+26,y+123+j*40,line,26,'#E3F0FC')
        label(52,1015,'技术学习内容 · 非当日突发新闻｜实际操作请以现场规程为准',26,'#BED2E8')
    pieces.append('</svg>')
    return '\n'.join(pieces)

def main(dst):
    target=Path(dst)
    target.mkdir(parents=True,exist_ok=True)
    images=target/'images'
    images.mkdir(exist_ok=True)
    jfile=target/'data.json'
    page=target/'index.html'
    if not jfile.exists() or not page.exists():
        raise RuntimeError('No last-good site cache: refuse to overwrite public archive')
    data=json.loads(jfile.read_text(encoding='utf8'))
    if not isinstance(data.get('editions'),list):
        raise RuntimeError('Unexpected editions schema: refuse destructive update')
    archive=target/'offline-editions.json'
    old=json.loads(archive.read_text(encoding='utf8')) if archive.exists() else []
    now=datetime.now(timezone(timedelta(hours=8)))
    today=now.date()
    entries=data['editions']
    origin_keys={(v.get('date'),v.get('style')) for v in entries}
    local=[]
    # Preserve last 30 dated offline editions; replace them whenever genuine news exists.
    days={datetime.fromisoformat(v['date']).date() for v in old if re.fullmatch(r'\d{4}-\d{2}-\d{2}',v.get('date',''))}
    days.add(today)
    for d in sorted(days,reverse=True):
        if (today-d).days>29 or d>today:
            continue
        for style in ['blue-white','dark']:
            if (d.isoformat(),style) in origin_keys:
                continue
            suffix='blue' if style=='blue-white' else 'dark'
            name=f'{d.isoformat()}-{suffix}.svg'
            (images/name).write_text(svg_for(d,style),encoding='utf8')
            title,sub,_=topic_for(d)
            local.append({
                'id':f'offline-{d.isoformat()}-{suffix}',
                'date':d.isoformat(), 'style':style,
                'title':f'【知识复盘】{title}',
                'summary':sub+'。本期为专业技术复盘，不是当日新闻。',
                'topic':title, 'image':'./images/'+name,
                'thumbnail':'./images/'+name, 'sources':[],
                'kind':'technical-review', 'is_fallback':True
            })
    data['editions']=sorted(entries+local,key=lambda v:v.get('date',''),reverse=True)
    archive.write_text(json.dumps(local,ensure_ascii=False),encoding='utf8')
    jfile.write_text(json.dumps(data,ensure_ascii=False),encoding='utf8')
    body=page.read_text(encoding='utf8')
    serial=json.dumps(data,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c').replace('>','\\u003e').replace('&','\\u0026')
    body,n=re.subn(r'(<script id="initial-data" type="application/json">).*?(</script>)',lambda m:m[1]+serial+m[2],body,flags=re.S)
    if n!=1:
        raise RuntimeError('Cannot safely update initial-data HTML: abort deployment')
    latest=next((v for v in data['editions'] if v.get('style')=='blue-white'),data['editions'][0])
    # Pre-rendered hero used before JavaScript; live app will also read embedded initial-data.
    hero=f'<button class="poster-button" data-action="open-latest" aria-label="查看高清资讯原图"><img src="{esc(latest["image"])}" alt="{esc(latest["title"])}" fetchpriority="high"></button>'
    body=re.sub(r'<button class="poster-button" data-action="open-latest".*?</button>',lambda m:hero,body,count=1,flags=re.S)
    body=re.sub(r'(<time id="latest-date">).*?(</time>)',lambda m:m[1]+esc(latest['date'].replace('-','.'))+m[2],body,count=1,flags=re.S)
    body=re.sub(r'(<p id="latest-summary">).*?(</p>)',lambda m:m[1]+esc(latest['summary'])+m[2],body,count=1,flags=re.S)
    body=re.sub(r'(<strong id="edition-count">).*?(</strong>)',lambda m:m[1]+str(len(data['editions']))+m[2],body,count=1,flags=re.S)
    page.write_text(body,encoding='utf8')
    print(json.dumps({'date':today.isoformat(),'total':len(data['editions']),'offline_today':sum(v['date']==today.isoformat() for v in local),'origin_today':sum(v.get('date')==today.isoformat() for v in entries)},ensure_ascii=False))

if __name__=='__main__':
    main(sys.argv[1] if len(sys.argv)>1 else 'daily-cache')
