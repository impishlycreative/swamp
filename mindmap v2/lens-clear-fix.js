(()=>{'use strict';
if(window.__SWAMP_LENS_CLEAR_FIX__)return;
window.__SWAMP_LENS_CLEAR_FIX__=true;

const qs=(s,r=document)=>r.querySelector(s);
const qsa=(s,r=document)=>[...r.querySelectorAll(s)];

function toast(message){
  const el=qs('#toast');if(!el)return;
  el.textContent=message;el.classList.add('show');
  clearTimeout(el._lensClearTimer);
  el._lensClearTimer=setTimeout(()=>el.classList.remove('show'),1500);
}

function hasActiveLensOrThread(){
  return !!qs('#writerLensStrip [data-clear-lens],#writerLensStrip .writer-thread-chip.active[data-thread],#writerLensStrip [data-clear-all]');
}

function fallbackNodeId(){
  return qs('#nodes .node.selected')?.dataset.id||qs('#nodes .node')?.dataset.id||null;
}

function clearVisualLayers(){
  qsa('.writer-dim,.writer-lens-hit').forEach(el=>el.classList.remove('writer-dim','writer-lens-hit'));
  qs('#writerThreadPathLayer')?.replaceChildren();
}

function clearLensState(){
  const id=fallbackNodeId();
  const writer=window.WriterMap;

  if(typeof writer?.clearLens==='function'){
    writer.clearLens();
  }else if(id&&typeof writer?.focus==='function'){
    // The current writer API exposes Lens as a toggle rather than a clear call.
    // One call clears when this is the active Lens node; otherwise it switches
    // to this node, and the second call clears it. Both calls happen before paint.
    writer.focus(id);
    if(hasActiveLensOrThread())writer.focus(id);
  }

  clearVisualLayers();
  const strip=qs('#writerLensStrip');
  if(strip&&hasActiveLensOrThread()){
    strip.innerHTML='';
    strip.classList.add('hidden');
  }
  toast('Lens cleared');
}

function bind(){
  document.addEventListener('click',e=>{
    const clear=e.target.closest?.('#writerLensStrip [data-clear-lens],#writerLensStrip [data-clear-all]');
    if(!clear)return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    clearLensState();
  },true);
}

window.SwampLensClear={clear:clearLensState};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();
