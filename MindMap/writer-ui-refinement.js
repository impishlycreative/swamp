(()=>{'use strict';
if(window.__SWAMP_WRITER_UI_REFINEMENT__)return;
window.__SWAMP_WRITER_UI_REFINEMENT__=true;

const OFFSET_KEY='swamp.mindmap.writerBar.position.v1';
const qs=(s,r=document)=>r.querySelector(s);
const qsa=(s,r=document)=>[...r.querySelectorAll(s)];
const isMobile=()=>matchMedia('(max-width:850px),(hover:none) and (pointer:coarse)').matches||(navigator.maxTouchPoints>0&&Math.min(screen.width,screen.height)<900);
let editIntent=false;
let drag=null;
let barObserver=null;
let branchObserver=null;

function injectStyle(){
  if(qs('#writerUiRefinementStyles'))return;
  const style=document.createElement('style');
  style.id='writerUiRefinementStyles';
  style.textContent=`
    #writerContext [data-writer-action="add"],
    #writerContext [data-writer-action="health"]{display:none!important}
    #writerContext .writer-drag-handle{flex:none;width:30px;min-width:30px;height:38px;border:0;border-radius:10px;background:transparent;color:var(--muted,#746d63);font-size:1rem;font-weight:950;line-height:1;cursor:grab;touch-action:none;user-select:none;padding:0}
    #writerContext .writer-drag-handle:hover,#writerContext .writer-drag-handle:focus-visible{background:#eee9df;outline:0;color:var(--ink,#25231f)}
    #writerContext.writer-dragging .writer-drag-handle{cursor:grabbing;background:#e1ece6;color:#2f5d49}
    #writerContext.writer-manual{left:var(--writer-manual-left)!important;top:var(--writer-manual-top)!important;transform:none!important}
    #writerContext .writer-refine-edit{background:#e1ece6;color:#2f5d49}
    #inspector.writer-selection-suppressed{display:none!important}
    @media(max-width:850px),(hover:none) and (pointer:coarse){
      #mobileBottomToolbar{display:none!important}
      #writerContext{bottom:max(8px,env(safe-area-inset-bottom))!important;top:auto!important}
      #writerContext .writer-drag-handle{display:none!important}
      #writerContext.writer-manual{left:8px!important;right:8px!important;bottom:max(8px,env(safe-area-inset-bottom))!important;top:auto!important;transform:none!important}
    }
  `;
  document.head.appendChild(style);
}

function hideInspector(){
  const panel=qs('#inspector');
  if(!panel)return;
  panel.classList.add('writer-selection-suppressed','hidden');
  panel.classList.remove('mobile-open','mobile-edit','mobile-more');
}
function showInspector(focus=true){
  const panel=qs('#inspector');
  if(!panel)return;
  panel.classList.remove('writer-selection-suppressed');
  if(isMobile()){
    const legacy=qs('#contextEdit');
    if(legacy){legacy.click();return;}
    panel.classList.remove('hidden');
    panel.classList.add('mobile-open','mobile-edit');
  }else{
    panel.classList.remove('hidden','mobile-open','mobile-edit','mobile-more');
    if(focus)requestAnimationFrame(()=>qs('#ideaText')?.focus({preventScroll:true}));
  }
}

function savedPosition(){
  try{
    const raw=localStorage.getItem(OFFSET_KEY);if(!raw)return null;
    const value=JSON.parse(raw);
    if(Number.isFinite(value?.left)&&Number.isFinite(value?.top))return value;
  }catch{}
  return null;
}
function applySavedPosition(){
  const bar=qs('#writerContext');if(!bar||isMobile())return;
  const pos=savedPosition();
  if(!pos){bar.classList.remove('writer-manual');return;}
  const w=bar.offsetWidth||560,h=bar.offsetHeight||48;
  const left=Math.max(8,Math.min(innerWidth-w-8,pos.left));
  const top=Math.max(70,Math.min(innerHeight-h-8,pos.top));
  bar.style.setProperty('--writer-manual-left',`${left}px`);
  bar.style.setProperty('--writer-manual-top',`${top}px`);
  bar.classList.add('writer-manual');
}
function savePosition(left,top){
  try{localStorage.setItem(OFFSET_KEY,JSON.stringify({left,top}));}catch{}
}
function resetPosition(){
  const bar=qs('#writerContext');if(!bar)return;
  try{localStorage.removeItem(OFFSET_KEY);}catch{}
  bar.classList.remove('writer-manual','writer-dragging');
  bar.style.removeProperty('--writer-manual-left');
  bar.style.removeProperty('--writer-manual-top');
  window.dispatchEvent(new Event('resize'));
}
function startDrag(e){
  if(isMobile()||e.button!==0)return;
  const bar=qs('#writerContext');if(!bar)return;
  e.preventDefault();e.stopPropagation();
  const rect=bar.getBoundingClientRect();
  drag={pointerId:e.pointerId,dx:e.clientX-rect.left,dy:e.clientY-rect.top};
  bar.classList.add('writer-manual','writer-dragging');
  bar.style.setProperty('--writer-manual-left',`${rect.left}px`);
  bar.style.setProperty('--writer-manual-top',`${rect.top}px`);
  e.currentTarget.setPointerCapture?.(e.pointerId);
}
function moveDrag(e){
  if(!drag||drag.pointerId!==e.pointerId)return;
  const bar=qs('#writerContext');if(!bar)return;
  e.preventDefault();
  const w=bar.offsetWidth||560,h=bar.offsetHeight||48;
  const left=Math.max(8,Math.min(innerWidth-w-8,e.clientX-drag.dx));
  const top=Math.max(70,Math.min(innerHeight-h-8,e.clientY-drag.dy));
  bar.style.setProperty('--writer-manual-left',`${left}px`);
  bar.style.setProperty('--writer-manual-top',`${top}px`);
}
function endDrag(e){
  if(!drag||drag.pointerId!==e.pointerId)return;
  const bar=qs('#writerContext');
  if(bar){
    const rect=bar.getBoundingClientRect();
    bar.classList.remove('writer-dragging');
    savePosition(rect.left,rect.top);
  }
  drag=null;
}

function addEditButton(bar){
  if(qs('[data-writer-refine="edit"]',bar))return;
  const edit=document.createElement('button');
  edit.type='button';
  edit.className='writer-action writer-refine-edit';
  edit.dataset.writerRefine='edit';
  edit.innerHTML='<span class="writer-glyph">✎</span><span class="writer-label">Edit</span>';
  edit.title='Edit idea details';
  edit.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();showInspector(true);});
  const rapid=qs('[data-writer-action="rapid"]',bar);
  bar.insertBefore(edit,rapid||bar.firstChild);
}
function addDragHandle(bar){
  if(qs('.writer-drag-handle',bar))return;
  const handle=document.createElement('button');
  handle.type='button';
  handle.className='writer-drag-handle';
  handle.innerHTML='⠿';
  handle.title='Drag writer bar · double-click to reattach to the selected idea';
  handle.setAttribute('aria-label','Drag writer bar');
  handle.addEventListener('pointerdown',startDrag);
  handle.addEventListener('pointermove',moveDrag);
  handle.addEventListener('pointerup',endDrag);
  handle.addEventListener('pointercancel',endDrag);
  handle.addEventListener('dblclick',e=>{e.preventDefault();e.stopPropagation();resetPosition();});
  bar.prepend(handle);
}
function refineBar(){
  const bar=qs('#writerContext');if(!bar)return false;
  addDragHandle(bar);addEditButton(bar);
  const branchLabel=qs('[data-writer-action="branch"] .writer-label',bar);
  if(branchLabel&&branchLabel.textContent.trim()==='Branch')branchLabel.textContent='More';
  applySavedPosition();
  if(!barObserver){
    barObserver=new MutationObserver(()=>{
      const label=qs('[data-writer-action="branch"] .writer-label',bar);
      if(label&&label.textContent.trim()==='Branch')label.textContent='More';
    });
    barObserver.observe(bar,{subtree:true,childList:true,characterData:true});
  }
  return true;
}

function injectHealthIntoMore(){
  const sheet=qs('#writerBranchSheet');if(!sheet||sheet.classList.contains('hidden'))return;
  const grid=qs('.writer-option-grid',sheet);if(!grid||qs('[data-writer-refine="health"]',grid))return;
  const health=document.createElement('button');
  health.type='button';
  health.className='writer-option';
  health.dataset.writerRefine='health';
  health.innerHTML='<strong>Story Health</strong><small>Show structural issues on the map</small>';
  health.addEventListener('click',()=>{
    sheet.classList.add('hidden');
    window.WriterMap?.health?.();
  });
  grid.prepend(health);
}
function watchMoreSheet(){
  const sheet=qs('#writerBranchSheet');if(!sheet||branchObserver)return;
  branchObserver=new MutationObserver(injectHealthIntoMore);
  branchObserver.observe(sheet,{attributes:true,attributeFilter:['class'],childList:true,subtree:true});
}

function bindNodeSelection(){
  document.addEventListener('click',e=>{
    const text=e.target.closest?.('#nodes .node .idea-text');
    if(text){
      const node=text.closest('.node');if(!node)return;
      e.preventDefault();e.stopImmediatePropagation();
      editIntent=true;
      node.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));
      requestAnimationFrame(()=>requestAnimationFrame(()=>{showInspector(true);editIntent=false;}));
      return;
    }
    const node=e.target.closest?.('#nodes .node');
    if(node&&!editIntent){
      requestAnimationFrame(()=>requestAnimationFrame(hideInspector));
    }
  },true);
}

function bindMobileSingleBar(){
  window.addEventListener('resize',()=>{if(!isMobile())applySavedPosition();},{passive:true});
}

function waitForWriterBar(attempt=0){
  if(refineBar()){
    watchMoreSheet();
    applySavedPosition();
    return;
  }
  if(attempt<120)setTimeout(()=>waitForWriterBar(attempt+1),50);
}

function boot(){
  injectStyle();
  bindNodeSelection();
  bindMobileSingleBar();
  waitForWriterBar();
  setTimeout(hideInspector,150);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
