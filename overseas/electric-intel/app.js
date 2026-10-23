(function(){
"use strict";
var sourceData=[].concat(
  Array.isArray(window.POWER_ARCHIVE)?window.POWER_ARCHIVE:[],
  Array.isArray(window.POWER_EXPANSION)?window.POWER_EXPANSION:[],
  Array.isArray(window.POWER_PROVINCE_RECORDS)?window.POWER_PROVINCE_RECORDS:[]
);
var meta=window.POWER_META||{};
var PROVINCES=["北京","天津","河北","山西","内蒙古","辽宁","吉林","黑龙江","上海","江苏","浙江","安徽","福建","江西","山东","河南","湖北","湖南","广东","广西","海南","重庆","四川","贵州","云南","西藏","陕西","甘肃","青海","宁夏","新疆"];
var CITY_MAP={广州:"广东",深圳:"广东",东莞:"广东",佛山:"广东",珠海:"广东",江门:"广东",汕头:"广东",中山:"广东",惠州:"广东",湛江:"广东",肇庆:"广东",韶关:"广东",西安:"陕西",渭南:"陕西",咸阳:"陕西",榆林:"陕西",宝鸡:"陕西",汉中:"陕西",延安:"陕西",安康:"陕西",商洛:"陕西",铜川:"陕西",南京:"江苏",无锡:"江苏",苏州:"江苏",南通:"江苏",常州:"江苏",盐城:"江苏",杭州:"浙江",宁波:"浙江",绍兴:"浙江",温州:"浙江",济南:"山东",青岛:"山东",淄博:"山东",烟台:"山东",郑州:"河南",洛阳:"河南",武汉:"湖北",宜昌:"湖北",长沙:"湖南",成都:"四川",绵阳:"四川",重庆:"重庆",福州:"福建",厦门:"福建",合肥:"安徽",南昌:"江西",昆明:"云南",贵阳:"贵州",南宁:"广西",海口:"海南",兰州:"甘肃",西宁:"青海",银川:"宁夏",乌鲁木齐:"新疆",沈阳:"辽宁",大连:"辽宁",长春:"吉林",哈尔滨:"黑龙江",石家庄:"河北",太原:"山西",呼和浩特:"内蒙古"};
var HOT=["陕西","广东","江苏","山东","浙江","河南","河北"];
var END_BY_URL={
 "https://www.bidding.csg.cn/zbgg/1200446722.jhtml":"2026-11-16",
 "https://ecp.cgnpc.com.cn/Details.html?dataId=bbf3c0e849e042459392b379c4fb343b&detailId=dcab0ec7f578417daf47981f2765f0ee":"2026-10-26",
 "https://bid.powerchina.cn/notice/detail?id=2409553941":"2026-10-25"
};
var EL=function(id){return document.getElementById(id)};
function esc(value){return String(value===null||value===undefined?"":value).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function safeLink(url){return /^https:\/\/[^\s<>"']+$/i.test(String(url||""))?url:""}
function provinceOf(x){
 var text=String(x.province||x.region||"");
 if(PROVINCES.indexOf(text)>=0)return text;
 if(CITY_MAP[text])return CITY_MAP[text];
 if(/南方五省|跨省|多省/.test(text))return "跨省";
 if(/海外|圭亚那|柬埔寨/.test(text))return "海外";
 if(/全国/.test(text))return "全国";
 for(var i=0;i<PROVINCES.length;i++){if(text.indexOf(PROVINCES[i])>=0)return PROVINCES[i]}
 for(var city in CITY_MAP){if(text.indexOf(city)>=0)return CITY_MAP[city]}
 return "跨省";
}
function ownerOf(x){return x.owner||(x.type==="统计发布"||x.cat==="电力数据"?"国家能源局":"南方电网")}
function sourceType(x){
 var u=String(x.url||"");
 if(/bidding\.csg\.cn|chnenergybidding\.com\.cn|ecp\.cgnpc\.com\.cn|bid\.powerchina\.cn|ec\.powerchina\.cn|nea\.gov\.cn/.test(u))return "官方来源";
 if(/cnstock\.com|finance\.sina\.com/.test(u))return "企业披露转载";
 return "第三方来源";
}

var AWARDEES={
 E112:"广东明阳电气股份有限公司",E113:"深圳市深鹏达电网科技有限公司",E119:"顺特电气设备有限公司",E120:"中电普瑞电力工程有限公司",E121:"西安华谱电力设备制造有限公司",E124:"常州思源东芝变压器有限公司",E128:"武汉高德红外股份有限公司",E129:"南京市明正宏电子技术有限公司",E130:"江苏安靠智电股份有限公司",E131:"广东新亚光电缆股份有限公司",E132:"珠海优特电力科技股份有限公司",
 N053:"国能（北京）电气技术有限公司",N051:"北京金风慧能技术有限公司",N048:"竹海电线电缆有限公司",N049:"天津市万博线缆有限公司",N050:"杭州建普科技有限公司",N046:"北京华电森源电气有限公司",N041:"许继电气股份有限公司",N042:"许昌电科储能技术有限公司",N039:"宁波东方电缆股份有限公司",N037:"特变电工衡阳变压器有限公司",N038:"天津智储能源科技有限公司",N035:"北京赛诺智能科技有限公司",N034:"青岛特锐德电气股份有限公司",N033:"江西电缆有限责任公司",N032:"扬州德云电气设备集团有限公司",N030:"特变电工股份有限公司",N029:"上海起帆电缆股份有限公司",N024:"江苏中超电缆股份有限公司",N025:"中天科技海缆股份有限公司",N026:"河南通达电缆股份有限公司"
};
var CANDIDATE_NAMES={E114:"广东正超电气",E115:"广东金晖隆电气",E116:"南方电网电力科技股份有限公司",N052:"河南森源电气"};
var NAMED_BUYERS={E111:"广州供电局",E112:"深圳供电局",N038:"天津国电电力海晶新能源有限公司",N052:"国能宁夏煤业",N059:"中广核贝谷科技"};
function makeParties(x){
 var supplier=AWARDEES[x.id]||"",role=supplier?"中标单位":"";
 if(x.type==="中标标包"&&x.status==="正式中标"){supplier=String(x.title||"").split("｜")[0].trim();role="中标单位"}
 if(x.type==="省级标包"){var m=x.title.match(/｜(北京科锐|和顺电气|威胜信息)\s/);if(m){supplier=m[1];role="中标／预中标披露企业"}}
 if(x.owner==="国家电网"&&x.type==="公告"&&/平高电气中标/.test(x.title)){supplier="平高电气";role="企业中标披露"}
 if(x.owner==="国家电网"&&x.type==="公告"&&/中国西电中标/.test(x.title)){supplier="中国西电";role="企业中标披露"}
 if(CANDIDATE_NAMES[x.id]){supplier=CANDIDATE_NAMES[x.id];role="第一候选单位"}
 if(supplier&&/候选/.test(x.status)&&role!=="第一候选单位")role="候选单位（非正式中标）";
 return {buyer:NAMED_BUYERS[x.id]||x.owner,exactBuyer:!!NAMED_BUYERS[x.id],supplier:supplier,role:role};
}
function partiesHTML(x){
 var p=x.party;
 return '<div class="supplier-box"><div class="field-inline"><em>采购单位</em><b>'+esc(p.buyer)+(p.exactBuyer?'':'（采购体系）')+'</b></div><div class="field-inline"><em>'+esc(p.role||"中标单位")+'</em><b'+(p.supplier?'':' class="unknown"')+'>'+esc(p.supplier||"未明确披露")+'</b></div></div>';
}

var rows=sourceData.map(function(x){
 var y=Object.assign({},x);
 y.owner=ownerOf(x);y.province=provinceOf(x);y.level=x.level||"A";
 y.sourceType=sourceType(x);y.party=makeParties(y);
 y.sourceKey=safeLink(x.url)||"record:"+x.id;
 y.deadline=END_BY_URL[x.url]||"";
 y.hay=[y.id,y.title,y.summary,y.analysis,y.cat,y.owner,y.region,y.province,y.status,y.type,y.source,y.sourceType,y.date,y.party.buyer,y.party.supplier].join(" ").toLowerCase();
 return y;
}).sort(function(a,b){return b.date.localeCompare(a.date)||(a.id.localeCompare(b.id))});
var byId={};rows.forEach(function(x){byId[x.id]=x});
var distinctSource=new Set(rows.map(function(r){return r.sourceKey})).size;
var sourceGroup={};rows.forEach(function(r){(sourceGroup[r.sourceKey]||(sourceGroup[r.sourceKey]=[])).push(r)});
var provinceCount={};rows.forEach(function(x){provinceCount[x.province]=(provinceCount[x.province]||0)+1});
var brands=Array.from(new Set(rows.map(function(r){return r.owner}))).sort(function(a,b){return a.localeCompare(b,"zh")});
var catList=Array.from(new Set(rows.map(function(r){return r.cat}))).sort(function(a,b){return a.localeCompare(b,"zh")});
var types=Array.from(new Set(rows.map(function(r){return r.type}))).sort(function(a,b){return a.localeCompare(b,"zh")});
var statuses=Array.from(new Set(rows.map(function(r){return r.status}))).sort(function(a,b){return a.localeCompare(b,"zh")});
var VALUES={owner:brands,province:HOT.concat(PROVINCES.filter(function(p){return HOT.indexOf(p)===-1}),["跨省","全国","海外"]),cat:catList,status:statuses,type:types,year:["2026","2025"],sourceType:["官方来源","企业披露转载","第三方来源"]};
var state={q:"",owner:"",province:"",cat:"",status:"",type:"",year:"",sourceType:"",start:"",end:"",sort:"new",mode:"items",searchMode:"project",savedOnly:false,page:1,detail:{},sourceKey:""};
var saved=[];
try{saved=JSON.parse(localStorage.getItem("power-intel-favorites-v2")||"[]");if(!Array.isArray(saved))saved=[]}catch(e){saved=[]}
function persistSaved(){try{localStorage.setItem("power-intel-favorites-v2",JSON.stringify(saved))}catch(e){}}
var toDisplay=30;
function toast(msg){var e=EL("toast");e.textContent=msg;e.style.display="block";clearTimeout(toast.timer);toast.timer=setTimeout(function(){e.style.display="none"},2800)}
function copyText(text){if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(function(){toast("已复制到剪贴板")}).catch(function(){manualCopy(text)})}else manualCopy(text)}
function manualCopy(text){var el=document.createElement("textarea");el.value=text;document.body.appendChild(el);el.select();var ok=false;try{ok=document.execCommand("copy")}catch(e){}el.remove();if(ok)toast("已复制到剪贴板");else window.prompt("长按复制：",text)}
function readQuery(){
 var p=new URLSearchParams(location.search);
 ["q","owner","province","cat","status","type","year","sourceType","start","end","sort","sourceKey","searchMode"].forEach(function(k){if(p.has(k))state[k]=p.get(k)||""});
 if(["items","sources","insights","saved"].indexOf(p.get("mode"))>=0)state.mode=p.get("mode");
 if(["new","old","title"].indexOf(state.sort)<0)state.sort="new";
 if(["project","buyer","supplier","notice"].indexOf(state.searchMode)<0)state.searchMode="project";
}
function writeQuery(){
 var p=new URLSearchParams();
 ["q","owner","province","cat","status","type","year","sourceType","start","end","sort","mode","sourceKey","searchMode"].forEach(function(k){if(state[k]&&state[k]!=="new"&&state[k]!=="items")p.set(k,state[k])});
 try{history.replaceState(null,"",location.pathname+(p.toString()?"?"+p.toString():""))}catch(e){}
}
function optionList(values){
 return '<option value="">全部</option>'+values.map(function(v){return '<option value="'+esc(v)+'">'+esc(v)+'</option>'}).join("");
}
function buildFilters(){
 ["owner","province","cat","status","type","year","sourceType"].forEach(function(k){var el=EL("filter-"+k);el.innerHTML=optionList(VALUES[k]);el.value=state[k]||""});
 EL("filter-sort").value=state.sort;
 EL("filter-start").value=state.start;
 EL("filter-end").value=state.end;
 EL("search").value=state.q;
}
function setFilter(k,v){state[k]=v;state.page=1;state.detail={};writeQuery();render()}
function buildProvinceChips(){
 var list=["",...HOT],e=EL("province-tabs");
 e.innerHTML=list.map(function(p){return '<button type="button" data-province="'+esc(p)+'" class="quick-btn'+(state.province===p?" active":"")+'" aria-pressed="'+String(state.province===p)+'">'+(p?esc(p)+" · "+(provinceCount[p]||0):"全部地区")+'</button>'}).join("");
}
function filteredRows(){
 var terms=state.q.toLowerCase().trim().split(/\s+/).filter(Boolean);
 var s=rows.filter(function(r){
  if(state.sourceKey&&r.sourceKey!==state.sourceKey)return false;
  if(state.searchMode==="supplier"&&!r.party.supplier)return false;
  if(state.searchMode==="notice"&&r.type!=="公告")return false;
  if(state.owner&&r.owner!==state.owner)return false;
  if(state.province&&r.province!==state.province)return false;
  if(state.cat&&r.cat!==state.cat)return false;
  if(state.status&&r.status!==state.status)return false;
  if(state.type&&r.type!==state.type)return false;
  if(state.year&&String(r.year)!==state.year)return false;
  if(state.sourceType&&r.sourceType!==state.sourceType)return false;
  if(state.start&&r.date<state.start)return false;
  if(state.end&&r.date>state.end)return false;
  if((state.mode==="saved"||state.savedOnly)&&saved.indexOf(r.id)<0)return false;
  var text=r.hay;
  if(state.searchMode==="supplier")text=(r.party.supplier+" "+r.party.role).toLowerCase();
  if(state.searchMode==="buyer")text=(r.party.buyer+" "+r.owner).toLowerCase();
  return terms.every(function(t){return text.indexOf(t)>=0});
 });
 if(state.sort==="old")s.reverse();
 if(state.sort==="title")s.sort(function(a,b){return a.title.localeCompare(b.title,"zh")});
 return s;
}
function statusBadge(x){
 var c="blue";
 if(/中标|成交/.test(x.status))c=/候选|预中标/.test(x.status)?"amber":"green";
 if(/招标中|采购进行中/.test(x.status))c="amber";
 if(x.type==="品类索引")c="blue";
 return '<span class="flag '+c+'">'+esc(x.type==="品类索引"?"品类索引":x.status)+'</span>';
}
function infoBadge(x){return '<span class="flag">'+esc(x.sourceType)+'</span>'}
function shareLink(x){return location.origin+location.pathname+"#"+encodeURIComponent(x.id)}
function rowCard(x,grouped){
 var related=sourceGroup[x.sourceKey]?sourceGroup[x.sourceKey].length:1;
 var isSaved=saved.indexOf(x.id)>=0;
 var marked=state.detail[x.id];
 var result='<article class="record" id="'+esc(x.id)+'">';
 result+='<div class="record-top"><div class="record-meta">'+statusBadge(x)+' '+infoBadge(x)+' <span class="dot"></span> <time datetime="'+esc(x.date)+'">'+esc(x.date)+'</time></div><button type="button" class="linkbutton ghost" data-action="favorite" data-id="'+esc(x.id)+'" aria-label="'+(isSaved?"取消收藏":"收藏情报")+'">'+(isSaved?"★ 已收藏":"☆ 收藏")+'</button></div>';
 result+='<h3>'+esc(x.title)+'</h3>';
 result+='<p class="excerpt">'+esc(x.summary)+'</p>';
 result+=partiesHTML(x);
 result+='<div class="meta-pills"><span>'+esc(x.owner)+'</span><span>地区 · '+esc(x.province)+'</span><span>'+esc(x.cat)+'</span><span>'+esc(x.type)+'</span></div>';
 result+='<div class="record-actions"><a href="'+esc(safeLink(x.url)||"#")+'" target="_blank" rel="noopener noreferrer">↗ 查看原始来源</a><button type="button" class="linkbutton" data-action="detail" data-id="'+esc(x.id)+'">'+(marked?"收起详情 ↑":"分析详情 ↓")+'</button>';
 if(related>1)result+='<button type="button" class="linkbutton ghost" data-action="source" data-id="'+esc(x.id)+'">同源 '+related+' 条</button>';
 result+='<button type="button" class="linkbutton ghost pushright" data-action="share" data-id="'+esc(x.id)+'">复制链接</button></div>';
 if(marked){
  result+='<section class="details"><dl><dt>公告日期</dt><dd>'+esc(x.date)+'</dd><dt>项目年度</dt><dd>'+esc(x.projectYear||x.year)+'</dd><dt>采购体系</dt><dd>'+esc(x.owner)+'</dd><dt>项目地区</dt><dd>'+esc(x.region||x.province)+'</dd><dt>专业解读</dt><dd>'+esc(x.analysis||"请打开公告核实技术条件、投标资格及后续更正。")+'</dd>';
  result+='<dt>证据口径</dt><dd>'+esc(x.sourceType)+'；归档证据等级 '+esc(x.level)+'。部分媒体转载未逐项回访原文，不视为已核验的实时项目。</dd>';
  result+='<dt>截止日期</dt><dd>'+(x.deadline?esc(x.deadline)+"（来自已整理的公告，须核对后续更正）":"未单独提取，点击来源核对")+'</dd><dt>原始链接</dt><dd><a href="'+esc(safeLink(x.url)||"#")+'" target="_blank" rel="noopener noreferrer">'+esc(x.url)+'</a></dd></dl>';
  if(related>1&&!grouped)result+='<div class="attached"><h4>同一来源还整理了 '+(related-1)+' 条索引（不代表独立采购）</h4>'+sourceGroup[x.sourceKey].filter(function(y){return y.id!==x.id}).slice(0,6).map(function(y){return '<button type="button" data-action="jump" data-id="'+esc(y.id)+'">'+esc(y.title)+'</button>'}).join("")+'</div>';
  result+='</section>';
 }
 result+='</article>';return result;
}
function sourceCard(group){
 var rep=group[0],isOpen=state.detail["g-"+rep.id],totalAll=(sourceGroup[rep.sourceKey]||[]).length;
 var output='<article class="record" id="group-'+esc(rep.id)+'"><div class="record-top"><div class="record-meta"><span class="flag blue">同源合并</span>'+infoBadge(rep)+'<span class="dot"></span>'+esc(rep.date)+'</div><span class="flag">'+group.length+' 条匹配</span></div><h3>'+esc(rep.title)+'</h3>';
 output+='<p class="excerpt">本来源收录 '+totalAll+' 条结构化记录；其中 '+group.length+' 条符合当前筛选。以下记录可能是同一公告中的物资品类或供应商标包，不是多个独立项目。</p>';
 output+=partiesHTML(rep);
 output+='<div class="meta-pills"><span>'+esc(rep.owner)+'</span><span>'+esc(rep.province)+'</span><span>共用一个原始链接</span></div>';
 output+='<div class="record-actions"><a href="'+esc(safeLink(rep.url)||"#")+'" target="_blank" rel="noopener noreferrer">↗ 原公告 / 披露</a><button type="button" class="linkbutton" data-action="group" data-id="'+esc(rep.id)+'">'+(isOpen?"收起合并明细 ↑":"查看合并明细 ↓")+'</button><button type="button" class="linkbutton ghost pushright" data-action="share" data-id="'+esc(rep.id)+'">复制链接</button></div>';
 if(isOpen)output+='<div class="attached"><h4>同源记录 · '+group.length+'条</h4>'+group.map(function(x){return '<button type="button" data-action="read" data-id="'+esc(x.id)+'">'+esc(x.title)+'　· '+esc(x.status)+'</button>'}).join("")+'</div>';
 return output+'</article>';
}
function statPanel(items){
 if(!items.length)return '<div class="empty"><strong>当前没有匹配记录</strong>请清空筛选后重试。</div>';
 function chart(key,limit,title){
  var m={};items.forEach(function(r){var k=r[key]||"未分类";m[k]=(m[k]||0)+1});
  var list=Object.keys(m).sort(function(a,b){return m[b]-m[a]}).slice(0,limit);
  var max=m[list[0]]||1;
  return '<section class="insight"><h3>'+esc(title)+'</h3>'+list.map(function(k){return '<div class="bar-line"><span>'+esc(k)+'</span><span class="bar-bg"><span class="bar-fg" style="width:'+Math.max(2,Math.round(m[k]/max*100))+'%;display:block"></span></span><b>'+m[k]+'</b></div>'}).join("")+'</section>';
 }
 return '<div class="insight"><h3>统计口径说明</h3><p class="excerpt">以下是当前筛选的结构化记录分布，不是官方招标项目总量、真实行业市场份额或订单金额。框架公告拆分的物资和标包会分别参与计数。</p></div>'+chart("owner",9,"采购主体分布")+chart("province",10,"地区索引分布")+chart("cat",10,"设备与行业品类")+chart("status",10,"公告状态分布");
}
function renderSearchTabs(){
 var hints={project:"搜索设备、项目名称或招标关键词…",buyer:"输入采购集团、供电局或采购单位…",supplier:"输入中标单位、供应商或候选企业…",notice:"输入公告标题或设备关键词…"};
 EL("search").placeholder=hints[state.searchMode]||hints.project;
 Array.prototype.forEach.call(EL("search-tabs").querySelectorAll("[data-search-mode]"),function(b){var active=b.getAttribute("data-search-mode")===state.searchMode;b.classList.toggle("active",active);b.setAttribute("aria-pressed",String(active))});
}
function render(){
 buildProvinceChips();
 var list=filteredRows();
 var grouped=[];
 if(state.mode==="sources"){
  var bucket={};
  list.forEach(function(r){(bucket[r.sourceKey]||(bucket[r.sourceKey]=[])).push(r)});
  grouped=Object.keys(bucket).map(function(k){return bucket[k]});
  grouped.sort(function(a,b){return b[0].date.localeCompare(a[0].date)});
  if(state.sort==="old")grouped.reverse();
 }
 var resultCount=state.mode==="sources"?grouped.length:list.length;
 EL("source-pin").hidden=!state.sourceKey;
 EL("result-title").textContent=state.mode==="sources"?"公告原文合并":state.searchMode==="supplier"?"中标单位检索":state.searchMode==="buyer"?"采购单位检索":state.searchMode==="notice"?"公开公告检索":"最新招投标信息";
 renderSearchTabs();
 EL("result-desc").textContent=state.mode==="sources"?("找到 "+resultCount+" 个不同来源 · 对应 "+list.length+" 条结构化记录"):("找到 "+resultCount+" 条索引 · 涉及 "+new Set(list.map(function(x){return x.sourceKey})).size+" 个不同来源");
 var modeLabels={items:"全部记录",sources:"按来源合并",insights:"统计观察",saved:"我的收藏"};
 ["items","sources","insights","saved"].forEach(function(m){var btn=EL("mode-"+m);btn.classList.toggle("active",state.mode===m);btn.setAttribute("aria-pressed",String(state.mode===m))});
 EL("current-only").classList.toggle("active",state.savedOnly);
 EL("current-only").setAttribute("aria-pressed",String(state.savedOnly));
 var content="",shown=state.page*toDisplay;
 if(state.mode==="insights"){content=statPanel(list)}
 else if(state.mode==="sources"){
  if(!grouped.length)content='<div class="empty"><strong>没有找到来源</strong>试着清空筛选或搜索其他词。</div>';
  else content=grouped.slice(0,shown).map(sourceCard).join("");
 }else{
  if(!list.length)content='<div class="empty"><strong>没有找到匹配记录</strong>更换关键词、地区，或者清空筛选再试。</div>';
  else{
   var last="";
   content=list.slice(0,shown).map(function(x){
    var month=x.date.slice(0,7),label="";
    if(state.sort!=="title"&&month!==last){last=month;label='<div class="month-title">'+esc(month.replace("-"," 年 "))+' 月</div>'}
    return label+rowCard(x,false);
   }).join("");
  }
 }
 EL("results").innerHTML=content;
 var isPaged=state.mode==="sources"||state.mode==="items"||state.mode==="saved";
 EL("more").hidden=!isPaged||resultCount<=shown;
 EL("more").textContent="加载更多 · 还剩 "+Math.max(0,resultCount-shown)+" 条";
 EL("export-btn").disabled=list.length===0;
 EL("data-footnote").textContent=rows.length+" 条结构化记录 / "+distinctSource+" 个不同来源 URL · 截至 "+(meta.cutoff||"2026-10-23")+" · 非自动实时更新";
 var hash=decodeURIComponent(location.hash.slice(1));
 if(hash&&byId[hash]&&!EL(hash)&&state.page===1&&!Object.keys(state.detail).length){
  // Direct links remain navigable even when a visitor opens an archived item from a filter.
  if(state.mode!=="items")return;
 }
}
function selectField(id,key){EL(id).addEventListener("change",function(){setFilter(key,this.value)})}
function reset(){
 ["q","owner","province","cat","status","type","year","sourceType","start","end","sourceKey"].forEach(function(k){state[k]=""});
 state.sort="new";state.savedOnly=false;state.page=1;state.detail={};buildFilters();writeQuery();render();toast("已清空所有筛选");
}
function csvCell(s){return '"'+String(s===undefined||s===null?"":s).replace(/"/g,'""')+'"'}
function exportCSV(){
 var data=filteredRows();
 if(!data.length){toast("当前筛选没有可以导出的记录");return}
 var heads=["编号","发布日期","项目年度","采购主体","省份","原地区","类别","状态","记录类型","项目标题","摘要","专业提示","原始来源类型","来源名称","来源链接"];
 var body=[heads.map(csvCell).join(",")];
 data.forEach(function(x){body.push([x.id,x.date,x.projectYear,x.owner,x.province,x.region,x.cat,x.status,x.type,x.title,x.summary,x.analysis,x.sourceType,x.source,x.url].map(csvCell).join(","))});
 var csv="\ufeff"+body.join("\r\n");
 if(window.PowerAndroid&&typeof window.PowerAndroid.exportCsv==="function"){
  try{window.PowerAndroid.exportCsv(csv,"电力设备情报_"+(state.province||"全国")+"_"+(meta.cutoff||"2026-10-23")+".csv");toast("请选择CSV文件的保存位置");return}catch(e){toast("系统保存未启用，尝试浏览器下载")}
 }
 var blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
 var url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="电力设备情报_"+(state.province||"全国")+"_"+(meta.cutoff||"2026-10-23")+".csv";document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url)},800);toast("已生成 "+data.length+" 条筛选结果 CSV");
}
function setMode(m){state.mode=m;state.page=1;state.detail={};writeQuery();render()}
function openDirectItem(id){
 var rec=byId[id];if(!rec)return;
 var old={owner:state.owner,province:state.province,cat:state.cat,status:state.status,type:state.type,year:state.year,sourceType:state.sourceType,start:state.start,end:state.end,q:state.q,savedOnly:state.savedOnly};
 Object.keys(old).forEach(function(k){if(k==="savedOnly")state[k]=false;else state[k]=""});
 state.q=rec.id;state.sourceKey="";state.searchMode="project";
 state.mode="items";state.page=1;state.detail={[id]:true};
 buildFilters();writeQuery();render();
 var el=EL(id);if(el)el.scrollIntoView({behavior:"smooth",block:"center"});
}
function wireEvents(){
 EL("search").addEventListener("input",function(){state.q=this.value;state.page=1;writeQuery();render()});
 EL("search-tabs").addEventListener("click",function(ev){var b=ev.target.closest("[data-search-mode]");if(!b)return;state.searchMode=b.getAttribute("data-search-mode");state.q="";EL("search").value="";state.mode="items";state.sourceKey="";state.page=1;state.detail={};writeQuery();render();EL("search").focus()});
 EL("search-submit").addEventListener("click",function(){state.q=EL("search").value;state.page=1;writeQuery();render()});
 ["owner","province","cat","status","type","year","sourceType"].forEach(function(x){selectField("filter-"+x,x)});
 ["start","end"].forEach(function(x){selectField("filter-"+x,x)});
 selectField("filter-sort","sort");
 ["reset-main","reset-side"].forEach(function(id){EL(id).addEventListener("click",reset)});
 ["items","sources","insights","saved"].forEach(function(m){EL("mode-"+m).addEventListener("click",function(){setMode(m)})});
 EL("source-pin").addEventListener("click",function(){state.sourceKey="";state.page=1;writeQuery();render()});
 EL("province-tabs").addEventListener("click",function(ev){var b=ev.target.closest("[data-province]");if(!b)return;var p=b.getAttribute("data-province");state.province=p;EL("filter-province").value=p;state.page=1;writeQuery();render()});
 EL("current-only").addEventListener("click",function(){state.savedOnly=!state.savedOnly;state.page=1;render()});
 EL("more").addEventListener("click",function(){state.page++;render()});
 EL("export-btn").addEventListener("click",exportCSV);
 
 EL("share-site").addEventListener("click",function(){copyText(location.href)});
 EL("filters-mobile").addEventListener("click",function(){var panel=EL("filter-panel"),open=!panel.classList.contains("is-open");panel.classList.toggle("is-open",open);this.setAttribute("aria-expanded",String(open));this.textContent=open?"收起筛选条件 ↑":"高级筛选与排序 ↓"});
 EL("theme").addEventListener("click",function(){var cur=document.documentElement.getAttribute("data-theme");var target=cur==="dark"?"light":"dark";document.documentElement.setAttribute("data-theme",target);try{localStorage.setItem("power-intel-theme",target)}catch(e){}});
 EL("results").addEventListener("click",function(ev){
  var b=ev.target.closest("[data-action]");if(!b)return;
  var action=b.getAttribute("data-action"),id=b.getAttribute("data-id"),r=byId[id];
  if(!r)return;
  if(action==="favorite"){
   var i=saved.indexOf(id);if(i<0)saved.unshift(id);else saved.splice(i,1);
   persistSaved();render();toast(i<0?"已加入收藏":"已取消收藏");return;
  }
  if(action==="detail"){state.detail[id]=!state.detail[id];render();return}
  if(action==="group"){state.detail["g-"+id]=!state.detail["g-"+id];render();return}
  if(action==="share"){copyText(shareLink(r));return}
  if(action==="jump"||action==="read"){openDirectItem(id);return}
  if(action==="source"){state.mode="sources";state.q="";state.searchMode="project";state.owner="";state.province="";state.cat="";state.status="";state.type="";state.year="";state.sourceType="";state.start="";state.end="";state.sourceKey=r.sourceKey;state.savedOnly=false;state.page=1;state.detail={["g-"+r.id]:true};buildFilters();writeQuery();render();toast("正在查看这一来源的全部关联记录");return}
 });
}
function start(){
 if(!rows.length){EL("results").innerHTML='<div class="empty"><strong>数据未加载</strong>刷新网页，确认数据脚本可访问。</div>';return}
 readQuery();buildFilters();wireEvents();
 EL("kpi-records").textContent=rows.length;
 EL("kpi-sources").textContent=distinctSource;
 EL("kpi-organizations").textContent=new Set(rows.map(function(x){return x.owner})).size;
 EL("kpi-provinces").textContent=PROVINCES.filter(function(p){return (provinceCount[p]||0)>0}).length;
 EL("meta-date").textContent=meta.cutoff||"2026-10-23";
 
 try{var theme=localStorage.getItem("power-intel-theme");if(theme==="dark"||theme==="light")document.documentElement.setAttribute("data-theme",theme)}catch(e){}
 var deep=decodeURIComponent(location.hash.slice(1));
 if(deep&&byId[deep]){openDirectItem(deep)}
 else render();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start);else start();
})();