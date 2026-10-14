(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const categories = ['全部','AI算力','供配电','液冷与制冷','项目建设','行业观察'];
  const styles = ['blue-white','dark'];
  const labels = {'blue-white':'蓝白竖版',dark:'深色横版'};
  const prefixes = {'blue-white':'blue',dark:'dark'};
  const shortDate = date => `${Number(date.slice(5,7))}月${Number(date.slice(8,10))}日`;
  const today = () => new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai'}).format(new Date());
  const stored = key => {try {const a=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(a)?a.filter(v=>typeof v==='string'):[];}catch{return [];}};
  let editions=[],config={products:[]},selected=null,category='全部',onlySaved=false,zoom=false;
  let limits={'blue-white':4,dark:4},saved=stored('dc-daily-saved'),reads=stored('dc-daily-reads'),toastTimer;
  const latest = () => editions.find(e=>e.style==='blue-white') || editions[0];
  const peers = e => editions.filter(item=>item.style===e.style);
  function message(text){$('toast').textContent=text;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,3500);}
  function persist(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{message('浏览器未允许保存记录');}}
  function safeLink(value){try{const u=new URL(value);return u.protocol==='https:'?u.href:'';}catch{return '';}}
  function posterPath(value){try{const u=new URL(value,location.href);return u.origin===location.origin?u.href:'';}catch{return '';}}
  function decodedImage(img,url,key){
    const request=(Number(img.dataset.request)||0)+1;img.dataset.request=String(request);
    const probe=new Image();probe.decoding='async';probe.fetchPriority='high';
    probe.onload=async()=>{try{if(probe.decode)await probe.decode();}catch{} if(img.dataset.key===key&&img.dataset.request===String(request))img.src=url;};
    probe.onerror=()=>{};probe.src=url;
  }
  function showImage(img,e,hero){
    const key=e.id+'|'+e.image+'|'+(e.preview||'');
    if(img.dataset.key===key)return;
    img.dataset.key=key;img.alt=e.title+'完整资讯图';img.decoding='async';
    if(e.width&&e.height){img.width=e.width;img.height=e.height;img.style.height='auto';}
    const small=e.placeholder||posterPath(e.thumbnail||e.image);
    img.src=small;
    decodedImage(img,posterPath(e.preview||e.image),key);
  }
  function upgradeOriginal(img,e){decodedImage(img,posterPath(e.image),img.dataset.key);}
  function resetLimits(){limits={'blue-white':4,dark:4};}
  function render(){
    const e=latest();if(!e)return;
    $('latest-date').textContent=e.date.replaceAll('-','.');
    $('latest-title').textContent=e.title;$('latest-summary').textContent=e.summary;
    $('edition-status').textContent=e.date===today()?'今日蓝白图':'最新蓝白图';
    $('image-date').textContent=`${shortDate(e.date)} · ${labels[e.style]} · 点击放大`; 
    let button=document.querySelector('.poster-button');
    if(!button){button=document.createElement('button');button.className='poster-button';button.dataset.action='open-latest';button.innerHTML='<img alt="">';document.querySelector('.latest-poster').prepend(button);}
    button.setAttribute('aria-label',`放大查看${e.title}`);
    showImage(button.querySelector('img'),e,true);
    $('edition-count').textContent=editions.length;
    $('blue-total').textContent=editions.filter(item=>item.style==='blue-white').length;
    $('dark-total').textContent=editions.filter(item=>item.style==='dark').length;
    if(config.schedule?.enabled){$('cadence').textContent='每日自动更新';$('schedule-note').textContent='每日20:00开始更新';$('generation-note').textContent='两种版式分别更新，往期原图持续保留。';}
    const recent=reads.filter(d=>{const diff=(Date.parse(today())-Date.parse(d))/86400000;return diff>=0&&diff<7;}).length;
    $('reading-days').textContent=recent?`近7天，你已阅读${recent}天`:'每天5分钟，多懂一点';
    $('saved-count').textContent=saved.filter(id=>editions.some(item=>item.id===id)).length;
    const oldMonth=$('month').value;
    $('month').innerHTML='<option value="">全部月份</option>'+[...new Set(editions.map(item=>item.date.slice(0,7)))].map(m=>`<option value="${esc(m)}">${m.slice(0,4)}年${Number(m.slice(5))}月</option>`).join('');$('month').value=oldMonth;
    $('categories').innerHTML=categories.map(c=>`<button data-category="${esc(c)}" class="${category===c?'active':''}">${esc(c)}</button>`).join('');
    const products=(config.products||[]).filter(p=>safeLink(p.url));
    $('products').innerHTML=products.map((p,i)=>`<a class="product" href="${esc(safeLink(p.url))}" target="_blank" rel="noopener noreferrer"><small>专题 ${String(i+1).padStart(2,'0')}</small><h3>${esc(p.title)}</h3><p>${esc(p.description)}</p><div><strong>${esc(p.price||'查看商品')}</strong><span>前往店铺 ↗</span></div></a>`).join('');$('no-products').hidden=products.length>0;
    $('sponsor').innerHTML=config.sponsor&&safeLink(config.sponsor.url)?`<a class="sponsor" href="${esc(safeLink(config.sponsor.url))}" target="_blank" rel="noopener noreferrer"><small>合作推广</small><h3>${esc(config.sponsor.title)}</h3><p>${esc(config.sponsor.description)}</p><span>了解详情 ↗</span></a>`:'';
    renderArchive();
  }
  function card(e){
    const marked=saved.includes(e.id);
    return `<article class="card"><button class="card-image" data-open="${esc(e.id)}" aria-label="查看${esc(e.title)}"><img src="${esc(posterPath(e.thumbnail||e.image))}" alt="${esc(e.title)}资讯图" loading="lazy" decoding="async"><span class="image-date">${esc(e.date.slice(5).replace('-','.'))}</span></button><div class="card-copy"><div class="card-meta"><span class="tag">${esc(e.category)}</span><time datetime="${e.date}">${shortDate(e.date)}</time></div><button class="card-title" data-open="${esc(e.id)}"><h3>${esc(e.title)}</h3></button><p>${esc(e.summary)}</p><div class="card-bottom"><button data-open="${esc(e.id)}">阅读图解 →</button><button class="save" data-save="${esc(e.id)}" aria-label="${marked?'取消收藏':'收藏'}" aria-pressed="${marked}">${marked?'★':'☆'}</button></div></div></article>`;
  }
  function renderArchive(){
    const q=$('search').value.trim().toLowerCase(),m=$('month').value;
    const items=editions.filter(e=>(category==='全部'||e.category===category)&&(!m||e.date.startsWith(m))&&(!onlySaved||saved.includes(e.id))&&`${e.date} ${e.title} ${e.summary} ${e.category}`.toLowerCase().includes(q));
    $('result-count').textContent=`${onlySaved?'收藏 · ':''}共${items.length}张图`;
    $('empty').hidden=items.length>0;
    for(const style of styles){
      const p=prefixes[style],group=items.filter(e=>e.style===style),limit=limits[style];
      $(p+'-count').textContent=`${group.length}张`;
      $(p+'-grid').innerHTML=group.slice(0,limit).map(card).join('');
      $(p+'-empty').hidden=group.length>0;
      $(p+'-more').hidden=group.length<=limit;
      $(p+'-more').textContent=`查看更多${labels[style]} · 还有${Math.max(0,group.length-limit)}张 ↓`;
    }
    document.querySelector('[data-action="saved"]').classList.toggle('active',onlySaved);
    document.querySelector('[data-action="all"]').classList.toggle('active',!onlySaved);
  }
  function bookmark(id){
    saved=saved.includes(id)?saved.filter(v=>v!==id):[...saved,id];
    persist('dc-daily-saved',saved);
    $('saved-count').textContent=saved.filter(value=>editions.some(e=>e.id===value)).length;
    renderArchive();
    if(selected)document.querySelector('[data-action="bookmark"]').textContent=saved.includes(selected.id)?'已收藏 ★':'收藏 ☆';
  }
  function open(e){
    if(!e)return;
    selected=e;zoom=false;readerScale=1;$('reader-image').style.width='100%';$('reader-scroll').classList.remove('zoomed');
    document.querySelector('[data-action="zoom"]').textContent='放大原图 ⊕';
    $('reader-title').textContent=e.title;
    $('reader-date').textContent=`${e.date.replaceAll('-','.')} · ${labels[e.style]} · ${e.category}`;
    showImage($('reader-image'),e,false);
    $('reader-summary').textContent=e.summary;
    $('reader-sources').innerHTML=(e.sources||[]).filter(s=>safeLink(s.url)).map(s=>`<a href="${esc(safeLink(s.url))}" target="_blank" rel="noopener noreferrer">${esc(s.title)} ↗</a>`).join('');
    const group=peers(e),index=group.findIndex(item=>item.id===e.id);
    $('position').textContent=`${labels[e.style]} · ${index+1} / ${group.length}`;
    document.querySelector('[data-action="older"]').disabled=index===group.length-1;
    document.querySelector('[data-action="newer"]').disabled=index===0;
    document.querySelector('[data-action="bookmark"]').textContent=saved.includes(e.id)?'已收藏 ★':'收藏 ☆';
    if(!$('reader').open){if($('reader').showModal)$('reader').showModal();else $('reader').setAttribute('open','');document.body.style.overflow='hidden';}
    const date=today();
    if(!reads.includes(date)){reads=[...reads,date].slice(-366);persist('dc-daily-reads',reads);}
    const u=new URL(location.href);u.searchParams.delete('date');u.searchParams.delete('style');u.searchParams.set('id',e.id);history.replaceState(null,'',u);
    document.querySelector('.reader-content').scrollTop=0;$('reader-scroll').scrollLeft=0;$('reader-scroll').scrollTop=0;
  }
  function close(){
    if($('reader').close)$('reader').close();else $('reader').removeAttribute('open');
    document.body.style.overflow='';selected=null;
    const u=new URL(location.href);['date','id','style'].forEach(key=>u.searchParams.delete(key));history.replaceState(null,'',u);
  }
  async function share(e){
    const u=new URL('./',location.href);if(e)u.searchParams.set('id',e.id);
    try{if(navigator.share)await navigator.share({title:e?.title||'数据中心每日资讯',text:'蓝白图解、深色简报，每日自动更新。免费阅读，无需登录。',url:u.href});else if(navigator.clipboard){await navigator.clipboard.writeText(u.href);message('网址已复制，可以发到微信或给朋友');}else{window.prompt('复制网址发给朋友',u.href);}}catch(err){if(err.name!=='AbortError')message('请复制浏览器地址栏的网址分享');}
  }
  async function download(e){
    if(!e)return;const url=posterPath(e.image),name=`数据中心每日资讯_${e.date}_${labels[e.style]}.${e.image.split('.').pop()}`;
    if(window.NativeDaily&&typeof window.NativeDaily.saveImage==='function'){
      window.NativeDaily.saveImage(url,name);return;
    }
    message('正在准备原图…');
    try{
      const response=await fetch(url);if(!response.ok)throw Error('download');
      const blob=await response.blob(),file=new File([blob],name,{type:blob.type||'image/png'});
      if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:e.title});return;}
      const object=URL.createObjectURL(blob),a=document.createElement('a');a.href=object;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(object),60000);
      message(/Android/i.test(navigator.userAgent)?'若没有保存提示，请安装新版安卓软件后重试':'已发起原图下载');
    }catch(err){if(err.name!=='AbortError')message('下载未完成，请检查网络后重试');}
  }
  let readerScale=1,pinch=null,lastTap=0;
  function setScale(value,cx,cy){
    const pane=$('reader-scroll'),img=$('reader-image'),old=readerScale;
    readerScale=Math.max(1,Math.min(6,value));zoom=readerScale>1.05;
    pane.classList.toggle('zoomed',zoom);img.style.width=zoom?`${pane.clientWidth*readerScale}px`:'100%';img.style.maxWidth='none';
    if(cx!==undefined){pane.scrollLeft=(pane.scrollLeft+cx)*readerScale/old-cx;pane.scrollTop=(pane.scrollTop+cy)*readerScale/old-cy;}
    document.querySelector('[data-action="zoom"]').textContent=zoom?'适应屏幕 ⊖':'放大原图 ⊕';
  }
  const pane=$('reader-scroll');pane.style.maxHeight='65vh';pane.style.overflow='auto';pane.style.webkitOverflowScrolling='touch';
  pane.addEventListener('touchstart',ev=>{
    if(ev.touches.length===2){const a=ev.touches[0],b=ev.touches[1];pinch={distance:Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY),scale:readerScale};if(selected)upgradeOriginal($('reader-image'),selected);}
  },{passive:true});
  pane.addEventListener('touchmove',ev=>{
    if(pinch&&ev.touches.length===2){ev.preventDefault();const a=ev.touches[0],b=ev.touches[1],r=pane.getBoundingClientRect();setScale(pinch.scale*Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY)/pinch.distance,(a.clientX+b.clientX)/2-r.left,(a.clientY+b.clientY)/2-r.top);}
  },{passive:false});
  pane.addEventListener('touchend',ev=>{if(ev.touches.length<2)pinch=null;});
  $('reader-image').addEventListener('dblclick',()=>{if(selected){upgradeOriginal($('reader-image'),selected);setScale(zoom?1:3);}});

  function reset(){category='全部';onlySaved=false;$('search').value='';$('month').value='';resetLimits();render();}
  document.addEventListener('click',ev=>{
    const t=ev.target.closest('button,a');if(!t)return;
    if(t.dataset.open){open(editions.find(e=>e.id===t.dataset.open));return;}
    if(t.dataset.save){bookmark(t.dataset.save);return;}
    if(t.dataset.category){category=t.dataset.category;resetLimits();render();return;}
    if(t.dataset.more){limits[t.dataset.more]+=8;renderArchive();return;}
    switch(t.dataset.action){
      case 'open-latest':open(latest());break;case 'save-latest':download(latest());break;case 'close':close();break;
      case 'zoom':if(selected)upgradeOriginal($('reader-image'),selected);setScale(zoom?1:3);break;
      case 'save-selected':download(selected);break;case 'bookmark':if(selected)bookmark(selected.id);break;
      case 'share-site':void share();break;case 'share-selected':void share(selected);break;
      case 'older':if(selected){const group=peers(selected);open(group[group.findIndex(e=>e.id===selected.id)+1]);}break;
      case 'newer':if(selected){const group=peers(selected);open(group[group.findIndex(e=>e.id===selected.id)-1]);}break;
      case 'all':onlySaved=false;resetLimits();renderArchive();break;
      case 'saved':onlySaved=true;resetLimits();renderArchive();break;
      case 'clear-search':$('search').value='';resetLimits();renderArchive();break;case 'reset':reset();break;
    }
  });
  $('search').addEventListener('input',()=>{resetLimits();renderArchive();});
  $('month').addEventListener('change',()=>{resetLimits();renderArchive();});
  $('reader').addEventListener('cancel',ev=>{ev.preventDefault();close();});
  $('reader').addEventListener('click',ev=>{if(ev.target===$('reader')){const r=$('reader').getBoundingClientRect();if(ev.clientX<r.left||ev.clientX>r.right||ev.clientY<r.top||ev.clientY>r.bottom)close();}});
  let lastSnapshot='';
  function apply(data){
    const snapshot=JSON.stringify([data.editions,data.config]);if(snapshot===lastSnapshot)return;lastSnapshot=snapshot;
    if(!Array.isArray(data.editions)||!data.editions.length)return;
    editions=data.editions.map(e=>({...e,id:e.id||e.date+'-'+(e.style||'dark'),style:e.style||'dark'})).sort((a,b)=>b.date.localeCompare(a.date)||a.id.localeCompare(b.id));
    config=data.config||{products:[]};
    const migrated=[...new Set(saved.flatMap(value=>/^\d{4}-\d{2}-\d{2}$/.test(value)?editions.filter(e=>e.date===value).map(e=>e.id):[value]))];
    if(JSON.stringify(migrated)!==JSON.stringify(saved)){saved=migrated;persist('dc-daily-saved',saved);}
    render();
  }
  try{apply(JSON.parse($('initial-data').textContent));}catch{}
  const params=new URLSearchParams(location.search),requestedId=params.get('id'),requestedDate=params.get('date'),requestedStyle=params.get('style');
  let requestedHandled=false;
  function openRequested(){
    if(requestedHandled||(!requestedId&&!requestedDate))return;
    const e=requestedId?editions.find(item=>item.id===requestedId):editions.find(item=>item.date===requestedDate&&(!requestedStyle||item.style===requestedStyle));
    if(e){requestedHandled=true;open(e);}
  }
  openRequested();
  async function refresh(){try{const r=await fetch(`./data.json?t=${Date.now()}`,{cache:'no-store'});if(r.ok){apply(await r.json());openRequested();}}catch{}}
  if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(()=>{});
  window.addEventListener('daily-resume',()=>{void refresh();});
  void refresh();setInterval(()=>{if(document.visibilityState==='visible')void refresh();},120000);
})();
