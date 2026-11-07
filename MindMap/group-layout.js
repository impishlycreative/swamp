(()=>{'use strict';
if(window.__SWAMP_GROUP_LAYOUT__)return;
window.__SWAMP_GROUP_LAYOUT__=true;

const qs=(s,r=document)=>r.querySelector(s);
const qsa=(s,r=document)=>[...r.querySelectorAll(s)];
const app=()=>window.MindMapApp;
const isMobile=()=>matchMedia('(max-width:850px),(hover:none) and (pointer:coarse)').matches||(navigator.maxTouchPoints>0&&Math.min(screen.width,screen.height)<900);
const layoutSelected=new Set();
let marquee=null;
let selectArmed=false;
let suppressClickUntil=0;

function toast(message){
  const el=qs('#toast');if(!el)return;
  el.textContent=message;el.classList.add('show');
  clearTimeout(el._groupLayoutTimer);
  el._groupLayoutTimer=setTimeout(()=>el.classList.remove('show'),1700);
}
function mapNow(){return app()?.getCurrentMap?.()||null;}
function viewScale(){
  const t=qs('#viewport')?.getAttribute('transform')||'';
  const m=t.match(/scale\(\s*([\d.]+)\s*\)/i);
  return Math.max(.01,Number(m?.[1])||1);
}
function parseTranslate(el){
  const value=el?.getAttribute('transform')||'';
  const m=value.match(/translate\(\s*(-?[\d.]+)[ ,]+(-?[\d.]+)\s*\)/i);
  return m?{x:Number(m[1]),y:Number(m[2])}:{x:0,y:0};
}
function injectStyles(){
  if(qs('#groupLayoutStyles'))return;
  const style=document.createElement('style');style.id='groupLayoutStyles';style.textContent=`
    #groupSelectBtn.group-select-active{background:#e7dfef;color:#5f4971;border-color:#b8a7c6}
    body.group-select-armed #svg{cursor:crosshair!important}
    #groupMarquee{position:fixed;z-index:190;display:none;pointer-events:none;border:2px solid rgba(74,94,126,.72);background:rgba(112,137,177,.12);border-radius:8px;box-shadow:0 0 0 1px rgba(255,255,255,.75) inset}
    #groupMarquee.active{display:block}
    #nodes .node.layout-selected .body{stroke:#4f6484!important;stroke-width:4px!important;stroke-dasharray:8 5;filter:drop-shadow(0 0 5px rgba(79,100,132,.2))}
    #groupLayoutBar{position:absolute;z-index:88;left:50%;bottom:18px;transform:translateX(-50%);display:flex;align-items:center;gap:8px;max-width:calc(100% - 28px);padding:8px 10px;border:1px solid var(--line);border-radius:14px;background:var(--paper);box-shadow:0 8px 24px rgba(0,0,0,.14)}
    #groupLayoutBar.hidden{display:none}
    #groupLayoutBar .group-summary{font-size:.78rem;font-weight:850;white-space:nowrap}
    #groupLayoutBar .group-hint{font-size:.72rem;color:var(--muted);white-space:nowrap}
    #groupLayoutBar .btn{min-height:34px;padding:6px 10px}
    @media(max-width:850px),(hover:none) and (pointer:coarse){#groupSelectBtn{display:none!important}#groupLayoutBar{display:none!important}}
  `;document.head.appendChild(style);
}
function buildUi(){
  if(!qs('#groupMarquee')){
    const box=document.createElement('div');box.id='groupMarquee';document.body.appendChild(box);
  }
  if(!qs('#groupLayoutBar')){
    const bar=document.createElement('div');bar.id='groupLayoutBar';bar.className='hidden';
    bar.innerHTML='<span class="group-summary"></span><span class="group-hint">Space keeps the rough shape and adds breathing room</span><button id="groupSpaceBtn" class="btn primary" type="button">Space</button><button id="groupClearBtn" class="btn" type="button">Clear</button>';
    qs('#workspace')?.appendChild(bar);
    qs('#groupSpaceBtn')?.addEventListener('click',()=>spaceElements(groupElements()));
    qs('#groupClearBtn')?.addEventListener('click',clearLayoutSelection);
  }
  if(!qs('#groupSelectBtn')){
    const row=qs('#desktopToolbar .tb-row');
    if(row){
      const btn=document.createElement('button');btn.id='groupSelectBtn';btn.className='tb-button tb-icon';btn.type='button';btn.title='Select an area';btn.setAttribute('aria-label','Select an area');btn.textContent='▧';
      const focus=qsa('[data-toolbar-target="focusBtn"]',row)[0];
      if(focus)focus.after(btn);else row.appendChild(btn);
      btn.addEventListener('click',()=>setSelectArmed(!selectArmed));
    }
  }
  const multiBar=qs('#multiSelectBar');
  if(multiBar&&!qs('#multiSpaceBtn',multiBar)){
    const btn=document.createElement('button');btn.id='multiSpaceBtn';btn.className='btn primary';btn.type='button';btn.textContent='Space';
    const del=qs('#multiDeleteBtn',multiBar);if(del)del.before(btn);else multiBar.appendChild(btn);
    btn.addEventListener('click',()=>spaceElements(qsa('#nodes .node.multi-selected')));
    const hint=qs('.multi-hint',multiBar);if(hint)hint.textContent='Drag to move branches · Space adds breathing room';
  }
}
function setSelectArmed(on){
  selectArmed=!!on;
  document.body.classList.toggle('group-select-armed',selectArmed);
  qs('#groupSelectBtn')?.classList.toggle('group-select-active',selectArmed);
  if(selectArmed)toast('Drag across the ideas you want to space');
}
function groupElements(){
  const map=mapNow();
  return [...layoutSelected].map(id=>qs(`#nodes .node[data-id="${CSS.escape(id)}"]`)).filter(el=>el&&map?.nodes?.[el.dataset.id]);
}
function applyLayoutMarks(){
  qsa('#nodes .node').forEach(el=>el.classList.toggle('layout-selected',layoutSelected.has(el.dataset.id)));
  const bar=qs('#groupLayoutBar'),summary=qs('.group-summary',bar);
  if(summary)summary.textContent=`${layoutSelected.size} idea${layoutSelected.size===1?'':'s'} selected`;
  bar?.classList.toggle('hidden',layoutSelected.size===0);
}
function clearLayoutSelection(){
  layoutSelected.clear();applyLayoutMarks();
}
function marqueeRect(){
  if(!marquee)return null;
  const left=Math.min(marquee.startX,marquee.x),right=Math.max(marquee.startX,marquee.x),top=Math.min(marquee.startY,marquee.y),bottom=Math.max(marquee.startY,marquee.y);
  return{left,right,top,bottom,width:right-left,height:bottom-top};
}
function paintMarquee(){
  const r=marqueeRect(),box=qs('#groupMarquee');if(!r||!box)return;
  Object.assign(box.style,{left:`${r.left}px`,top:`${r.top}px`,width:`${r.width}px`,height:`${r.height}px`});
  box.classList.add('active');
}
function finishMarquee(e){
  const r=marqueeRect(),box=qs('#groupMarquee'),m=mapNow();
  box?.classList.remove('active');
  const additive=!!marquee?.additive;
  marquee=null;
  setSelectArmed(false);
  if(!r||r.width<6||r.height<6||!m)return;
  if(!additive)layoutSelected.clear();
  qsa('#nodes .node').forEach(el=>{
    const id=el.dataset.id;if(!id||id===m.rootId||el.classList.contains('writer-dim'))return;
    const b=el.getBoundingClientRect();
    const cx=(b.left+b.right)/2,cy=(b.top+b.bottom)/2;
    if(cx>=r.left&&cx<=r.right&&cy>=r.top&&cy<=r.bottom)layoutSelected.add(id);
  });
  applyLayoutMarks();
  suppressClickUntil=Date.now()+350;
  if(layoutSelected.size)toast(`${layoutSelected.size} ideas selected`);else toast('No ideas selected');
}
function infoFor(el){
  const scale=viewScale(),pos=parseTranslate(el),rect=el.getBoundingClientRect();
  return{id:el.dataset.id,x:pos.x,y:pos.y,ox:pos.x,oy:pos.y,r:Math.max(rect.width,rect.height)/(2*scale)};
}
function relax(items,obstacles){
  const gap=30;
  const originalCenter={x:items.reduce((s,n)=>s+n.x,0)/items.length,y:items.reduce((s,n)=>s+n.y,0)/items.length};
  let totalMove=0;
  for(let iter=0;iter<120;iter++){
    let moved=0;
    for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++){
      const a=items[i],b=items[j];let dx=b.x-a.x,dy=b.y-a.y,dist=Math.hypot(dx,dy);
      if(dist<.001){const angle=((i+1)*37+(j+1)*71)%360*Math.PI/180;dx=Math.cos(angle);dy=Math.sin(angle);dist=1;}
      const min=a.r+b.r+gap;if(dist>=min)continue;
      const push=(min-dist)/2,ux=dx/dist,uy=dy/dist;
      a.x-=ux*push;a.y-=uy*push;b.x+=ux*push;b.y+=uy*push;moved+=push*2;
    }
    for(const a of items)for(const b of obstacles){
      let dx=a.x-b.x,dy=a.y-b.y,dist=Math.hypot(dx,dy);
      if(dist<.001){dx=1;dy=0;dist=1;}
      const min=a.r+b.r+gap*.7;if(dist>=min)continue;
      const push=min-dist,ux=dx/dist,uy=dy/dist;
      a.x+=ux*push;a.y+=uy*push;moved+=push;
    }
    totalMove+=moved;if(moved<.15)break;
  }
  const center={x:items.reduce((s,n)=>s+n.x,0)/items.length,y:items.reduce((s,n)=>s+n.y,0)/items.length};
  const dx=originalCenter.x-center.x,dy=originalCenter.y-center.y;
  items.forEach(n=>{n.x+=dx;n.y+=dy;});
  return totalMove;
}
function refreshAfterLayout(ids){
  const m=mapNow();if(!m)return;
  app()?.save?.();
  app()?.setCurrentMap?.(m.id,false,false);
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    applyLayoutMarks();
    if(ids?.length)ids.forEach(id=>qs(`#nodes .node[data-id="${CSS.escape(id)}"]`)?.classList.add(layoutSelected.has(id)?'layout-selected':'multi-selected'));
  }));
}
function spaceElements(elements){
  const m=mapNow();
  const els=[...new Map((elements||[]).filter(Boolean).map(el=>[el.dataset.id,el])).values()].filter(el=>el.dataset.id&&el.dataset.id!==m?.rootId&&!el.classList.contains('writer-dim'));
  if(!m||els.length<2){toast('Select at least two ideas');return;}
  const ids=new Set(els.map(el=>el.dataset.id));
  const items=els.map(infoFor);
  const obstacles=qsa('#nodes .node').filter(el=>!ids.has(el.dataset.id)&&!el.classList.contains('writer-dim')).map(infoFor);
  const moved=relax(items,obstacles);
  if(moved<.5){toast('Those ideas already have enough space');return;}
  items.forEach(n=>{const node=m.nodes[n.id];if(node){node.x=Math.round(n.x*10)/10;node.y=Math.round(n.y*10)/10;}});
  refreshAfterLayout(items.map(n=>n.id));
  toast(`Spaced ${items.length} ideas`);
}
function startMarquee(e){
  const svg=qs('#svg');if(!svg||isMobile()||e.button!==0)return false;
  const overSvg=e.target.closest?.('#svg'),overNode=e.target.closest?.('#nodes .node');
  if(!overSvg||overNode||(!selectArmed&&!e.shiftKey))return false;
  marquee={pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,x:e.clientX,y:e.clientY,additive:e.ctrlKey||e.metaKey};
  e.preventDefault();e.stopImmediatePropagation();paintMarquee();
  try{svg.setPointerCapture?.(e.pointerId);}catch{}
  return true;
}
function bind(){
  injectStyles();buildUi();
  document.addEventListener('pointerdown',e=>{
    if(e.target.closest?.('#groupLayoutBar,#groupSelectBtn'))return;
    if(startMarquee(e))return;
    if(layoutSelected.size&&((e.ctrlKey||e.metaKey)&&e.target.closest?.('#nodes .node')))clearLayoutSelection();
  },true);
  document.addEventListener('pointermove',e=>{
    if(!marquee||e.pointerId!==marquee.pointerId)return;
    marquee.x=e.clientX;marquee.y=e.clientY;e.preventDefault();e.stopImmediatePropagation();paintMarquee();
  },true);
  document.addEventListener('pointerup',e=>{
    if(!marquee||e.pointerId!==marquee.pointerId)return;
    marquee.x=e.clientX;marquee.y=e.clientY;e.preventDefault();e.stopImmediatePropagation();finishMarquee(e);
  },true);
  document.addEventListener('pointercancel',e=>{
    if(!marquee||e.pointerId!==marquee.pointerId)return;
    marquee=null;qs('#groupMarquee')?.classList.remove('active');setSelectArmed(false);
  },true);
  document.addEventListener('click',e=>{
    if(Date.now()<suppressClickUntil&&e.target.closest?.('#svg')){e.preventDefault();e.stopImmediatePropagation();}
  },true);
  document.addEventListener('keydown',e=>{
    const tag=(e.target?.tagName||'').toLowerCase(),typing=tag==='input'||tag==='textarea'||e.target?.isContentEditable;
    if(typing)return;
    if(e.key==='Escape'&&(layoutSelected.size||selectArmed)){e.preventDefault();clearLayoutSelection();setSelectArmed(false);}
  },true);
  new MutationObserver(()=>{buildUi();requestAnimationFrame(applyLayoutMarks);}).observe(document.body,{childList:true,subtree:true});
  qs('#nodes')&&new MutationObserver(()=>requestAnimationFrame(applyLayoutMarks)).observe(qs('#nodes'),{childList:true,subtree:true});
}

window.SwampGroupLayout={space:()=>spaceElements(groupElements()),clear:clearLayoutSelection};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();
