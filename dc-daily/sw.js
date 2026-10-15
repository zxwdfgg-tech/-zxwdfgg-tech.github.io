'use strict';
const VERSION='dc-reader-fast-v3-20261015',SHELL=VERSION+'-shell',IMAGES=VERSION+'-images';
const BASE=new URL('./',self.location.href),INDEX=new URL('index.html',BASE).href;
self.addEventListener('install',event=>event.waitUntil((async()=>{
  try{
    const c=await caches.open(SHELL),r=await fetch(INDEX,{cache:'reload'});
    if(r.ok){const html=await r.clone().text();await save(c,INDEX,r);
      const urls=[...html.matchAll(/(?:src|href)=["']([^"']+\.(?:css|js)(?:\?[^"']*)?)["']/g)].map(m=>new URL(m[1],BASE)).filter(u=>u.origin===BASE.origin&&u.pathname.startsWith(BASE.pathname));
      await Promise.allSettled(urls.map(async u=>{const response=await fetch(u.href);await save(c,u.href,response);}));
    }
  }catch{}
  await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  let migrated=false;
  for(const key of await caches.keys())if(key.startsWith('dc-reader-fast-')&&key!==SHELL&&key!==IMAGES){migrated=true;await caches.delete(key);}
  await self.clients.claim();
  // Older readers have no controllerchange listener. Reload once on this version's activation.
  if(migrated)for(const client of await self.clients.matchAll({type:'window'})){
    const u=new URL(client.url);if(u.origin===BASE.origin&&u.pathname.startsWith(BASE.pathname))await client.navigate(client.url);
  }
})()));
async function save(cache,key,response,max){
  if(!response.ok||response.type==='opaque')return;
  try{await cache.put(key,response.clone());}catch{return;}
  if(max){const keys=await cache.keys();for(const old of keys.slice(0,Math.max(0,keys.length-max)))await cache.delete(old);}
}
self.addEventListener('fetch',event=>{
  const req=event.request,url=new URL(req.url);
  if(req.method!=='GET'||url.origin!==BASE.origin||!url.pathname.startsWith(BASE.pathname))return;
  if(url.pathname.endsWith('/data.json')){
    event.respondWith((async()=>{const c=await caches.open(SHELL);try{const r=await fetch(req);if(!r.ok)throw Error('Data unavailable');await save(c,new URL('data.json',BASE).href,r);return r;}catch(e){const old=await c.match(new URL('data.json',BASE).href);if(old)return old;throw e;}})());return;
  }
  if(req.mode==='navigate'){
    const network=(async()=>{const c=await caches.open(SHELL);const r=await fetch(req);await save(c,INDEX,r);return r;})();
    event.waitUntil(network.catch(()=>{}));
    event.respondWith((async()=>{const old=await (await caches.open(SHELL)).match(INDEX);return old||network;})());return;
  }
  if(url.pathname.includes('/images/')){
    event.respondWith((async()=>{const c=await caches.open(IMAGES);const old=await c.match(req);if(old)return old;const r=await fetch(req);await save(c,req,r,100);return r;})());return;
  }
  if(/\.(js|css|svg)$/.test(url.pathname)&&!url.pathname.endsWith('/sw.js')){
    event.respondWith((async()=>{const c=await caches.open(SHELL);const old=await c.match(req);if(old)return old;const r=await fetch(req);await save(c,req,r,20);return r;})());
  }
});

