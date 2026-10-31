(()=>{'use strict';
if(window.__SWAMP_RELATIONSHIP_INTEGRITY__)return;
window.__SWAMP_RELATIONSHIP_INTEGRITY__=true;

const VERSION='3.1.3';
const qs=(s,r=document)=>r.querySelector(s);
const qsa=(s,r=document)=>[...r.querySelectorAll(s)];
const app=()=>window.MindMapApp;
const mapNow=()=>app()?.getCurrentMap?.()||null;

let mapId=null;
let lastRelationships='[]';
let lastNodes='{}';
let relationshipUndo=[];
let armed=false;
let restoring=false;
let previousUndoDisabled=null;
let linkObserver=null;
let nodesObserver=null;
let scanRaf=0;
let routeRaf=0;

function toast(message){
  const el=qs('#toast');if(!el)return;
  el.textContent=message;el.classList.add('show');clearTimeout(el._relationshipFixTimer);el._relationshipFixTimer=setTimeout(()=>el.classList.remove('show'),1700);
}
function linksOf(map){return Array.isArray(map?.relationships)?map.relationships:[];}
function linksSnapshot(map){return JSON.stringify(linksOf(map));}
function nodesSnapshot(map){return JSON.stringify(map?.nodes||{});}
function setVersionBranding(){
  document.title=`MindMap ${VERSION} V2 — Swamp`;
  document.documentElement.dataset.mindmapV2=VERSION;
  qsa('[data-toolbar-version]').forEach(el=>el.textContent=`V2 · ${VERSION}`);
}
function undoControls(){return [qs('#undoBtn'),...qsa('[data-toolbar-target="undoBtn"]')].filter(Boolean);}
function armUndo(){
  if(!armed){
    const base=qs('#undoBtn');
    previousUndoDisabled=base?!!base.disabled:null;
  }
  armed=true;
  undoControls().forEach(el=>{el.disabled=false;el.removeAttribute('aria-disabled');});
}
function restoreUndoControlState(){
  if(previousUndoDisabled===null)return;
  undoControls().forEach(el=>{el.disabled=previousUndoDisabled;if(previousUndoDisabled)el.setAttribute('aria-disabled','true');else el.removeAttribute('aria-disabled');});
  previousUndoDisabled=null;
}
function resetForMap(map){
  mapId=map?.id||null;
  lastRelationships=linksSnapshot(map);
  lastNodes=nodesSnapshot(map);
  relationshipUndo=[];
  armed=false;
  previousUndoDisabled=null;
}
function scanState(){
  scanRaf=0;
  const map=mapNow();if(!map)return;
  if(map.id!==mapId){resetForMap(map);scheduleRoute();return;}
  const rel=linksSnapshot(map),nodes=nodesSnapshot(map);
  if(restoring){lastRelationships=rel;lastNodes=nodes;restoring=false;return;}
  if(rel!==lastRelationships){
    relationshipUndo.push({mapId:map.id,before:lastRelationships,after:rel});
    if(relationshipUndo.length>40)relationshipUndo.shift();
    lastRelationships=rel;
    lastNodes=nodes;
    armUndo();
  }else if(armed&&nodes!==lastNodes){
    armed=false;
    previousUndoDisabled=null;
    lastNodes=nodes;
  }else{
    lastNodes=nodes;
  }
  scheduleRoute();
}
function scheduleScan(){if(!scanRaf)scanRaf=requestAnimationFrame(scanState);}
function canUndoRelationship(){
  if(!armed)return false;
  const map=mapNow(),entry=relationshipUndo[relationshipUndo.length-1];
  return !!map&&!!entry&&entry.mapId===map.id&&entry.after===linksSnapshot(map);
}
function undoRelationship(){
  if(!canUndoRelationship())return false;
  const map=mapNow(),entry=relationshipUndo.pop();
  let before=[];try{before=JSON.parse(entry.before);}catch{return false;}
  restoring=true;
  map.relationships=before;
  app()?.save?.();
  lastRelationships=JSON.stringify(before);
  lastNodes=nodesSnapshot(map);
  armed=false;
  restoreUndoControlState();
  try{document.body.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));}catch{}
  window.dispatchEvent(new Event('resize'));
  scheduleRoute();
  toast('Undid link');
  return true;
}

function nodeGeometry(id){
  const el=qs(`#nodes .node[data-id="${CSS.escape(id)}"]`);if(!el)return null;
  const m=(el.getAttribute('transform')||'').match(/translate\(\s*(-?[\d.]+)[ ,]+(-?[\d.]+)\s*\)/);if(!m)return null;
  const body=qs('circle.body',el);return{id,x:Number(m[1]),y:Number(m[2]),r:Number(body?.getAttribute('r'))||60};
}
function visibleObstacles(exclude){
  return qsa('#nodes .node').map(el=>nodeGeometry(el.dataset.id)).filter(Boolean).filter(n=>!exclude.has(n.id));
}
function quadPoint(s,c,e,t){const u=1-t;return{x:u*u*s.x+2*u*t*c.x+t*t*e.x,y:u*u*s.y+2*u*t*c.y+t*t*e.y};}
function pathCandidate(a,b,bend){
  const dx=b.x-a.x,dy=b.y-a.y,dist=Math.max(1,Math.hypot(dx,dy)),ux=dx/dist,uy=dy/dist;
  const start={x:a.x+ux*(a.r+9),y:a.y+uy*(a.r+9)},end={x:b.x-ux*(b.r+9),y:b.y-uy*(b.r+9)};
  const nx=-uy,ny=ux,c={x:(start.x+end.x)/2+nx*bend,y:(start.y+end.y)/2+ny*bend};
  const mid=quadPoint(start,c,end,.5);
  return{start,end,c,mid,d:`M ${start.x} ${start.y} Q ${c.x} ${c.y} ${end.x} ${end.y}`};
}
function collisionScore(candidate,obstacles){
  let score=0;
  for(const o of obstacles){
    const margin=o.r+15;
    for(let i=1;i<20;i++){
      const p=quadPoint(candidate.start,candidate.c,candidate.end,i/20),d=Math.hypot(p.x-o.x,p.y-o.y);
      if(d<margin)score+=(margin-d)+40;
    }
    const md=Math.hypot(candidate.mid.x-o.x,candidate.mid.y-o.y),labelClear=o.r+58;
    if(md<labelClear)score+=(labelClear-md)*2+80;
  }
  return score;
}
function routedPath(link,a,b){
  const dx=b.x-a.x,dy=b.y-a.y,dist=Math.max(1,Math.hypot(dx,dy));
  const hash=[...(link.id||`${link.from}:${link.to}`)].reduce((n,c)=>n+c.charCodeAt(0),0),sign=hash%2?1:-1;
  const base=Math.max(48,Math.min(96,dist*.18));
  const candidates=[base*sign,-base*sign,base*1.5*sign,-base*1.5*sign,140*sign,-140*sign,190*sign,-190*sign,250*sign,-250*sign,0];
  const obstacles=visibleObstacles(new Set([link.from,link.to]));
  let best=null,bestScore=Infinity;
  for(const bend of candidates){
    const candidate=pathCandidate(a,b,bend),score=collisionScore(candidate,obstacles);
    if(score<bestScore){best=candidate;bestScore=score;}
    if(score===0)break;
  }
  return best||pathCandidate(a,b,base*sign);
}
function routeLinks(){
  routeRaf=0;
  const map=mapNow(),layer=qs('#v2LinksLayer');if(!map||!layer)return;
  const byId=new Map(linksOf(map).map(link=>[link.id,link]));
  qsa('.v2-link-group',layer).forEach(group=>{
    const link=byId.get(group.dataset.linkId);if(!link)return;
    const a=nodeGeometry(link.from),b=nodeGeometry(link.to);if(!a||!b)return;
    const routed=routedPath(link,a,b);
    qsa('.v2-link-line,.v2-link-hit',group).forEach(path=>path.setAttribute('d',routed.d));
    qs('.v2-link-label',group)?.setAttribute('transform',`translate(${routed.mid.x} ${routed.mid.y})`);
  });
}
function scheduleRoute(){if(!routeRaf)routeRaf=requestAnimationFrame(routeLinks);}
function attachObservers(){
  const layer=qs('#v2LinksLayer');
  if(layer&&!linkObserver){linkObserver=new MutationObserver(()=>{scheduleScan();scheduleRoute();});linkObserver.observe(layer,{childList:true,subtree:true});}
  const nodes=qs('#nodes');
  if(nodes&&!nodesObserver){nodesObserver=new MutationObserver(()=>{scheduleScan();scheduleRoute();});nodesObserver.observe(nodes,{childList:true,subtree:true,attributes:true,attributeFilter:['transform','r','class']});}
}
function isTyping(target){return target instanceof HTMLInputElement||target instanceof HTMLTextAreaElement||target instanceof HTMLSelectElement||target?.isContentEditable;}
function bindUndo(){
  window.addEventListener('click',e=>{
    if(!e.target.closest?.('#undoBtn,[data-toolbar-target="undoBtn"]'))return;
    scanState();
    if(!undoRelationship())return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
  },true);
  window.addEventListener('keydown',e=>{
    if(!(e.ctrlKey||e.metaKey)||e.shiftKey||e.key.toLowerCase()!=='z'||isTyping(e.target))return;
    scanState();
    if(!undoRelationship())return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
  },true);
}
function boot(){
  setVersionBranding();
  resetForMap(mapNow());
  bindUndo();
  attachObservers();
  window.addEventListener('resize',()=>{scheduleScan();scheduleRoute();},{passive:true});
  setInterval(()=>{setVersionBranding();attachObservers();scheduleScan();scheduleRoute();},700);
  scheduleScan();scheduleRoute();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
