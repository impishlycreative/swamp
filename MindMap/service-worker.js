/* Offline-first shell. Only one application semantic version exists in core-stability.js. */
'use strict';
const SHELL_CACHE='swamp-mindmap-pwa-shell';
const LIBRARY_CACHE='swamp-mindmap-runtime-modules';
const ASSETS=[
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/mindmap-192.png",
  "./icons/mindmap-512.png",
  "./style.css",
  "./toolbar-system.css",
  "./v2-experience.css",
  "./v3-guided.css",
  "./core-stability.js",
  "./v3-vault.js",
  "./v3-storage.js",
  "./v3-domain.js",
  "./v3-ai.js",
  "./v3-ai-worker.js",
  "./toolbar-system.js",
  "./drag-hysteresis.js",
  "./app.js",
  "./minimap.js",
  "./session-auth.js",
  "./story-arc.js",
  "./template-initial-view.js",
  "./template-help.js",
  "./rapidfire.js",
  "./ux-projects.js",
  "./mobile-viewport.js",
  "./multi-select.js",
  "./group-layout.js",
  "./mobile-shell.js",
  "./export-tools.js",
  "./word-export-linked.js",
  "./v2-experience.js",
  "./guide-help.js",
  "./consolidation.js",
  "./consolidation-selection-fix.js",
  "./relationship-routing.js",
  "./lens-clear-fix.js",
  "./v3-guided.js",
  "./v3-awareness.js",
  "./story-rules.md"
];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(SHELL_CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const names=await caches.keys();
    await Promise.all(names.filter(n=>n==='swamp-mindmap-offline'||n.startsWith('swamp-mindmap-pwa-shell-old-'))
      .map(n=>caches.delete(n)));
    await self.clients.claim();
  })());
});
self.addEventListener('message',event=>{
  if(event.data?.type!=='CHECK_OFFLINE')return;
  event.waitUntil((async()=>{
    const cache=await caches.open(SHELL_CACHE),missing=[];
    for(const url of ASSETS){if(!(await cache.match(url,{ignoreSearch:true})))missing.push(url);}
    event.ports?.[0]?.postMessage({ready:missing.length===0,missing});
  })());
});
self.addEventListener('fetch',event=>{
  const req=event.request;if(req.method!=='GET')return;
  const url=new URL(req.url);
  const sameOrigin=url.origin===self.location.origin;
  const runtimeModule=url.hostname==='cdn.jsdelivr.net';
  if(!sameOrigin&&!runtimeModule)return; // model weights are cached by Transformers.js
  event.respondWith((async()=>{
    const name=runtimeModule?LIBRARY_CACHE:SHELL_CACHE;
    const cache=await caches.open(name);
    const hit=await cache.match(req,{ignoreSearch:sameOrigin});
    if(runtimeModule&&hit)return hit; // offline-first for installed runtime modules
    try{
      const fresh=await fetch(req);
      if(fresh.ok&&(sameOrigin||fresh.type==='cors')){
        event.waitUntil(cache.put(req,fresh.clone()).catch(()=>{}));
      }
      return fresh;
    }catch{
      if(hit)return hit;
      if(req.mode==='navigate'){
        const fallback=await cache.match('./index.html',{ignoreSearch:true});
        if(fallback)return fallback;
      }
      return Response.error();
    }
  })());
});
