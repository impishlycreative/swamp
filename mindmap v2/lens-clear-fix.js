(()=>{'use strict';
if(window.__SWAMP_LENS_CLEAR_FIX__)return;
window.__SWAMP_LENS_CLEAR_FIX__=true;

const qs=(s,r=document)=>r.querySelector(s);
const qsa=(s,r=document)=>[...r.querySelectorAll(s)];
let lensSourceId=null;

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

function clearLensState(){
  const writer=window.WriterMap;
  const thread=activeThreadChip();
  if(thread)thread.click();

  if(hasActiveLens()&&typeof writer?.focus==='function'){
    const source=lensSourceId||inferLensSource();
    if(source){
      writer.focus(source);
      // If the source was inferred incorrectly, the first call can switch the
      // Lens to that node. A second call then clears that Lens before paint.
      if(hasActiveLens())writer.focus(source);
    }
  }

  lensSourceId=null;
  clearVisualLayers();
  requestAnimationFrame(()=>{
    clearVisualLayers();
    if(!hasActiveLens()&&!activeThreadChip())toast('Lens cleared');
  });
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
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    clearLensState();
  },true);

  const strip=qs('#writerLensStrip');
  if(strip)new MutationObserver(()=>syncLensSource()).observe(strip,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
}

window.SwampLensClear={clear:clearLensState};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();
