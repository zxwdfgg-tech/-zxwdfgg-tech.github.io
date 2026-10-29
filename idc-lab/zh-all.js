/* 中文显示层：只处理可见界面与矢量图文字，不改变实训判定逻辑。 */
(() => {
  'use strict';
  const terms = [
    [/(\d+(?:\.\d+)?)\s*°C/g, '$1摄氏度'],
    [/(\d+(?:\.\d+)?)\s*mm²/g, '$1平方毫米'],
    [/mm²/g, '平方毫米'],
    [/(\d+(?:\.\d+)?)\s*(kWh|kVA|kvar|kW|kV|kA|Ah|Hz|W|V|A|U)(?=$|[^A-Za-z])/gi,
      (_, amount, unit) => amount + ({
        kwh:'千瓦时',kva:'千伏安',kvar:'千乏',kw:'千瓦',kv:'千伏',
        ka:'千安',ah:'安时',hz:'赫兹',w:'瓦',v:'伏',a:'安',u:'机架单位'
      }[unit.toLowerCase()] || '计量单位')],
    [/\bPUE(?=\d)/g, '电能使用效率'],
    [/\bA\/B双路/g, '甲、乙双路'],
    [/\bI\s*>/g, '电流整定大于'],
    [/\bt(?=\s*\()/g, '时间'],
    [/\bSI\b/g, '标准反时限'],

    [/\bCold\s+Aisle\b/gi, '冷通道'],
    [/\bHot\s+Aisle\b/gi, '热通道'],
    [/\bNODE[- ]?(\d+)\b/gi, '计算节点$1'],
    [/\bDC[- ]?0*(\d+)\b/g, (_, n) => '第' + Number(n) + '关'],
    [/\bMCC[- ]?(\d+)\b/gi, '电动机控制柜$1'],
    [/\bTR[- ]?(\d+)\b/gi, '变压器$1'],
    [/\bR(\d+)\b/g, '机柜$1'],
    [/\b8[- ]GPU\b/gi, '八卡图形计算服务器'],
    [/\bN\s*\+\s*1\b/gi, '冗余一台'],
    [/\bIEC\s*SI\b/gi, '国际标准反时限'],
    [/\b[Aa]\s*\/\s*[Bb]\b/g, '甲、乙双路'],
    [/\bL\/h\b/gi, '升每小时'],
    [/\bmm\s*²\b/gi, '平方毫米'],
    [/\bmm2\b/gi, '平方毫米'],
    [/\bkWh\b/gi, '千瓦时'],
    [/\bkVA\b/gi, '千伏安'],
    [/\bkvar\b/gi, '千乏'],
    [/\bkW\b/gi, '千瓦'],
    [/\bkV\b/gi, '千伏'],
    [/\bkA\b/gi, '千安'],
    [/\bAh\b/gi, '安时'],
    [/\bHz\b/gi, '赫兹'],
    [/\bIcu\b/gi, '极限短路分断能力'],
    [/\bTMS\b/gi, '时间倍率'],
    [/\bIDMT\b/gi, '反时限'],
    [/\bMCCB\b/gi, '塑壳断路器'],
    [/\bACB\b/gi, '框架断路器'],
    [/\bCRAH\b/gi, '机房空气处理机'],
    [/\bDCIM\b/gi, '数据中心基础设施监控系统'],
    [/\bPUE\b/gi, '电能使用效率'],
    [/\bPDU\b/gi, '机柜配电单元'],
    [/\bPPE\b/gi, '个人防护用品'],
    [/\bEPO\b/gi, '紧急断电'],
    [/\bLOTO\b/gi, '上锁挂牌'],
    [/\bLED\b/gi, '状态指示灯'],
    [/\bUPS\b/gi, '不间断电源'],
    [/\bATS\b/gi, '自动转换开关'],
    [/\bMCC\b/gi, '电动机控制中心'],
    [/\bGPU\b/gi, '图形计算卡'],
    [/\bIT\b/g, '信息技术'],
    [/\bAI\b/g, '人工智能'],
    [/\bCAP\b/gi, '无功补偿'],
    [/\bHTML\b/gi, '网页'],
    [/\bSI\b/g, '标准反时限'],
    [/\bAC\b/g, '交流'],
    [/\bDC\b/g, '直流'],
    [/\b([0-9]+(?:\.[0-9]+)?)\s*A\b/g, '$1安'],
    [/\b([0-9]+(?:\.[0-9]+)?)\s*V\b/g, '$1伏'],
    [/\b([0-9]+(?:\.[0-9]+)?)\s*W\b/g, '$1瓦'],
    [/\b([0-9]+(?:\.[0-9]+)?)\s*U\b/g, '$1机架单位'],
    [/\bmin\b/gi, '分钟'],
    [/\bA\b/g, '甲'],
    [/\bB\b/g, '乙'],
    [/\bU\b/g, '机架单位'],
    [/\bV\b/g, '伏'],
    [/\bW\b/g, '瓦'],
    [/\bI\s*>/g, '电流整定大于'],
    [/\bI\b/g, '电流'],
    [/\bN\b/g, '标准冗余'],
    [/\bR\b/g, '机柜'],
    [/\bh\b/g, '小时'],
    [/\bm\b/g, '米'],
    [/\bT\b/g, '时间'],
  ];
  function convert(input) {
    if (!/[A-Za-z]/.test(input)) return input;
    let out = input;
    for (const [pattern, replacement] of terms) out = out.replace(pattern, replacement);
    // 不显示残留英文：特殊型号未在术语库内时使用显式中文复核标记。
    out = out.replace(/\b[A-Za-z][A-Za-z0-9_-]*\b/g, '待核对标识');
    out = out.replace(/(冷通道)\s*\1/g, '$1').replace(/(热通道)\s*\1/g, '$1');
    return out;
  }
  const excluded = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'CODE', 'PRE']);
  const ATTRS = ['alt', 'aria-label', 'title', 'placeholder'];
  function translateElement(root) {
    if (!root || root.nodeType !== 1) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!n.parentElement || excluded.has(n.parentElement.tagName) ||
          n.parentElement.closest('script,style,noscript,textarea,code,pre')) continue;
      nodes.push(n);
    }
    for (const n of nodes) {
      const value = convert(n.nodeValue);
      if (value !== n.nodeValue) n.nodeValue = value;
    }
    const elements = [root, ...root.querySelectorAll('*')];
    for (const el of elements) {
      if (excluded.has(el.tagName)) continue;
      for (const attr of ATTRS) {
        if (!el.hasAttribute(attr)) continue;
        const old = el.getAttribute(attr);
        const next = convert(old);
        if (old !== next) el.setAttribute(attr, next);
      }
    }
  }
  function audit() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const leftovers = [];
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!n.parentElement || n.parentElement.closest('script,style,noscript,textarea,code,pre')) continue;
      if (/[A-Za-z]/.test(n.nodeValue)) leftovers.push(n.nodeValue.trim());
    }
    return leftovers;
  }
  let queued = false;
  function queueTranslate() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      translateElement(document.body);
    });
  }
  function start() {
    translateElement(document.body);
    const observer = new MutationObserver(queueTranslate);
    observer.observe(document.body, {
      subtree: true, childList: true, characterData: true
    });
    window.检查全中文 = audit;
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();