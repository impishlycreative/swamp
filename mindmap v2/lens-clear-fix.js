(()=>{'use strict';
if(window.__SWAMP_LENS_CLEAR_FIX__)return;
window.__SWAMP_LENS_CLEAR_FIX__=true;

const qs=(s,r=document)=>r.querySelector(s);
const qsa=(s,r=document)=>[...r.querySelectorAll(s)];
let lensSourceId=null;
let clearCheckTimer=0;

function toast(message){
  const el=qs('#toast');if(!el)return;
  el.textContent=message;el.classList.add('show');
  clearTimeout(el._lensClearTimer);
  el._lensClearTimer=setTimeout(()=>el.classList.remove('show'),1500);
}
function selectedNodeId(){return qs('#nodes .node.selected')?.dataset.id||null;}
function mapNow(){return window.MindMapApp?.getCurrentMap?.()||null;}
function lensChip(){return qs('#writerLensStrip [data-clear-lens]');}
function activeThreadChip(){return qs('#writerLensStrip .writer-thread-chip.active[data-thread]');}
function hasActiveLens(){return !!lensChip();}
function hasActiveFilter(){return hasActiveLens()||!!activeThreadChip();}

function injectInteractionRules(){
  if(qs('#lensInteractionRules'))return;
  const style=document.createElement('style');
  style.id='lensInteractionRules';
  style.textContent=`
    #nodes .node.writer-dim,#nodes .node.writer-dim *{pointer-events:none!important;cursor:default!important}
    #edges .edge.writer-dim,#edges .edge-hit.writer-dim{pointer-events:none!important}
    #v2LinksLayer .v2-link-group.writer-dim,#v2LinksLayer .v2-link-group.writer-dim *{pointer-events:none!important}
  `;
  document.head.appendChild(style);
}

function clearVisualLayers(){
  qsa('.writer-dim,.writer-lens-hit').forEach(el=>el.classList.remove('writer-dim','writer-lens-hit'));
  qs('#writerThreadPathLayer')?.replaceChildren();
}

function inferLensSource(){
  const chip=lensChip(),map=mapNow();if(!chip||!map)return null;
  const label=chip.textContent.trim();
  const matches=qsa('#nodes .node.writer-lens-hit').map(el=>el.dataset.id).filter(id=>map.nodes?.[id]?.text?.trim()===label);
  if(matches.length===1)return matches[0];
  const selected=selectedNodeId();
  if(selected&&matches.includes(selected))return selected;
  return matches[0]||null;
}

function syncLensSource(candidate=null){
  if(!hasActiveLens()){lensSourceId=null;return;}
  const map=mapNow(),chip=lensChip();
  if(candidate&&map?.nodes?.[candidate]&&map.nodes[candidate].text?.trim()===chip?.textContent?.trim()){
    lensSourceId=candidate;return;
  }
  if(!lensSourceId||!map?.nodes?.[lensSourceId])lensSourceId=inferLensSource();
}

function fallbackClear(){
  const writer=window.WriterMap;
  const thread=activeThreadChip();
  if(thread)thread.click();

  if(hasActiveLens()&&typeof writer?.focus==='function'){
    const source=lensSourceId||inferLensSource();
    if(source){
      writer.focus(source);
      if(hasActiveLens())writer.focus(source);
    }
  }

  lensSourceId=null;
  clearVisualLayers();
}

function verifyClearAfterNativeHandler(){
  clearTimeout(clearCheckTimer);
  clearCheckTimer=setTimeout(()=>{
    if(hasActiveFilter())fallbackClear();
    clearVisualLayers();
    requestAnimationFrame(()=>{
      if(hasActiveFilter())fallbackClear();
      else toast('Lens cleared');
    });
  },0);
}

function clearLensState(){
  const clear=qs('#writerLensStrip [data-clear-all]')||lensChip();
  if(clear){
    // Let writer-map's own button handler clear its private activeLens/activeThread
    // state. The verification step below is only a fallback.
    clear.click();
    return;
  }
  fallbackClear();
  toast('Lens cleared');
}

function bind(){
  injectInteractionRules();
  document.addEventListener('click',e=>{
    const lensAction=e.target.closest?.('#writerContext [data-writer-action="lens"]');
    if(lensAction){
      const candidate=selectedNodeId();
      setTimeout(()=>syncLensSource(candidate),0);
      return;
    }

    const clear=e.target.closest?.('#writerLensStrip [data-clear-lens],#writerLensStrip [data-clear-all]');
    if(!clear)return;
    // Do not prevent or stop this event. writer-map owns the real Lens state and
    // its direct button listener must receive the desktop mouse click.
    verifyClearAfterNativeHandler();
  },true);

  const strip=qs('#writerLensStrip');
  if(strip)new MutationObserver(()=>syncLensSource()).observe(strip,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
}

window.SwampLensClear={clear:clearLensState};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();
