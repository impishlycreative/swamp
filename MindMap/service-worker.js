/* MindMap offline shell: precache once installed; model weights are not bundled. */
const CACHE='swamp-mindmap-offline';
const ASSETS=["./","./index.html","./style.css","./toolbar-system.css","./v2-experience.css","./v3-guided.css","./core-stability.js","./toolbar-system.js","./drag-hysteresis.js","./app.js","./minimap.js","./session-auth.js","./story-arc.js","./template-initial-view.js","./template-help.js","./rapidfire.js","./ux-projects.js","./mobile-viewport.js","./multi-select.js","./group-layout.js","./mobile-shell.js","./export-tools.js","./word-export-linked.js","./v2-experience.js","./guide-help.js","./consolidation.js","./consolidation-selection-fix.js","./relationship-routing.js","./lens-clear-fix.js","./v3-guided.js","./story-rules.md"];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{event.waitUntil(self.clients.claim());});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    try{
      const response=await fetch(event.request);
      if(response.ok)cache.put(event.request,response.clone()).catch(()=>{});
      return response;
    }catch{
      const hit=await cache.match(event.request,{ignoreSearch:true});
      if(hit)return hit;
      return Response.error();
    }
  })());
});
