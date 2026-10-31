(()=>{'use strict';
if(window.__SWAMP_CONSOLIDATION_SELECTION_FIX__)return;
window.__SWAMP_CONSOLIDATION_SELECTION_FIX__=true;

const qs=(s,r=document)=>r.querySelector(s);
const app=()=>window.MindMapApp;
const mapNow=()=>app()?.getCurrentMap?.()||null;
const now=()=>new Date().toISOString();
let beforeRapidIds=null;
let updateRaf=0;
let nodesObserver=null;

function selectedId(){return qs('#nodes .node.selected')?.dataset.id||null;}
function rawChildren(map,parentId){return Object.values(map?.nodes||{}).filter(n=>n.parentId===parentId&&n.writer?.rawBrainstorm===true);}
function scheduleUpdate(){if(updateRaf)return;updateRaf=requestAnimationFrame(()=>{updateRaf=0;updateReviewAction();});}

function updateReviewAction(){
  const bar=qs('#writerContext');
  if(!bar)return;
  let button=qs('[data-consolidate-selected]',bar);
  if(!button){
    button=document.createElement('button');
    button.type='button';
    button.className='writer-action consolidate-selected-review';
    button.dataset.consolidateSelected='1';
    button.title='Review the rough ideas under this idea';
    button.innerHTML='<span class="writer-glyph">✓</span><span class="writer-label">Review Ideas</span>';
    button.addEventListener('click',e=>{
      e.preventDefault();
      e.stopPropagation();
      const id=selectedId();
      if(id)window.MindMapConsolidation?.open?.(id);
    });
    const more=qs('[data-writer-action="branch"]',bar);
    more?bar.insertBefore(button,more):bar.appendChild(button);
  }
  const map=mapNow(),id=selectedId(),count=id?rawChildren(map,id).length:0;
  button.hidden=count===0;
  const label=qs('.writer-label',button);
  if(label)label.textContent=count?`Review Ideas (${count})`:'Review Ideas';
  button.setAttribute('aria-label',count?`Review ${count} rough idea${count===1?'':'s'}`:'Review ideas');
}

function markRapidfireChildren(){
  const map=mapNow();
  if(!map||!beforeRapidIds)return;
  const added=Object.values(map.nodes||{}).filter(node=>!beforeRapidIds.has(node.id));
  beforeRapidIds=null;
  if(!added.length)return;
  let changed=false;
  added.forEach(node=>{
    if(!node?.parentId)return;
    if(!node.writer||typeof node.writer!=='object')node.writer={};
    node.writer.rawBrainstorm=true;
    node.writer.rapidfireParentId=node.parentId;
    node.writer.rapidfireCreatedAt=node.writer.rapidfireCreatedAt||now();
    node.writer.type='general';
    changed=true;
  });
  if(changed)app()?.save?.();
  scheduleUpdate();
}

function bindRapidfire(){
  const form=qs('#rapidfireForm');
  if(!form||form.dataset.consolidationExplicitMark==='1')return;
  form.dataset.consolidationExplicitMark='1';
  form.addEventListener('submit',()=>{
    const map=mapNow();
    beforeRapidIds=new Set(Object.keys(map?.nodes||{}));
    queueMicrotask(markRapidfireChildren);
  },true);
}

function observeNodes(){
  const nodes=qs('#nodes');
  if(!nodes||nodesObserver)return;
  nodesObserver=new MutationObserver(scheduleUpdate);
  nodesObserver.observe(nodes,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
}

function boot(){
  bindRapidfire();
  observeNodes();
  scheduleUpdate();
  setInterval(()=>{bindRapidfire();observeNodes();scheduleUpdate();},900);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
