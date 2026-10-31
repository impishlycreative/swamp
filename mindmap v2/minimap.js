(()=>{'use strict';
const STORAGE_KEY='swamp.mindmap.minimap.collapsed';
const SYNTH_POINTER_ID=424242;
const $=s=>document.querySelector(s);
const svg=$('#svg'),viewport=$('#viewport'),workspace=$('#workspace');
if(!svg||!viewport||!workspace)return;

const style=document.createElement('style');
style.textContent=`
.mindmap-minimap{position:absolute;right:18px;bottom:18px;width:224px;height:164px;z-index:34;background:color-mix(in srgb,var(--paper,#fff) 94%,transparent);border:1px solid var(--line,#d8d0c4);border-radius:14px;box-shadow:0 8px 28px rgba(45,39,31,.14);overflow:hidden;backdrop-filter:blur(8px);user-select:none;touch-action:none}
.mindmap-minimap.is-collapsed{width:42px;height:42px;border-radius:12px}
.mindmap-minimap-head{height:34px;padding:0 7px 0 10px;display:flex;align-items:center;gap:8px;border-bottom:1px solid var(--line,#d8d0c4);background:color-mix(in srgb,var(--paper,#fff) 96%,var(--soft,#f4efe7));font-size:11px;font-weight:850;letter-spacing:.02em;color:var(--muted,#6f685f)}
.mindmap-minimap-title{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mindmap-minimap-toggle{width:25px;height:25px;border:0;border-radius:8px;background:transparent;color:var(--muted,#6f685f);font:800 17px/1 system-ui,sans-serif;cursor:pointer;display:grid;place-items:center}
.mindmap-minimap-toggle:hover{background:var(--soft,#f4efe7);color:var(--ink,#2d271f)}
.mindmap-minimap-canvas{display:block;width:100%;height:130px;cursor:crosshair;touch-action:none}
.mindmap-minimap.is-collapsed .mindmap-minimap-head{height:40px;padding:0;justify-content:center;border-bottom:0}
.mindmap-minimap.is-collapsed .mindmap-minimap-title,.mindmap-minimap.is-collapsed .mindmap-minimap-canvas{display:none}
.mindmap-minimap.is-collapsed .mindmap-minimap-toggle{width:40px;height:40px;font-size:18px}
@media(max-width:850px),(hover:none) and (pointer:coarse){.mindmap-minimap{right:10px;bottom:84px;width:156px;height:118px;border-radius:12px}.mindmap-minimap-head{height:28px;padding-left:8px;font-size:10px}.mindmap-minimap-canvas{height:90px}.mindmap-minimap.is-collapsed{width:40px;height:40px}.mindmap-minimap.is-collapsed .mindmap-minimap-head,.mindmap-minimap.is-collapsed .mindmap-minimap-toggle{height:38px;width:38px}}
@media print{.mindmap-minimap{display:none!important}}
`;
document.head.appendChild(style);

const panel=document.createElement('section');
panel.className='mindmap-minimap';
panel.setAttribute('aria-label','Minimap navigation');
panel.innerHTML='<div class="mindmap-minimap-head"><span class="mindmap-minimap-title">Minimap</span><button class="mindmap-minimap-toggle" type="button" aria-label="Collapse minimap" title="Collapse minimap">−</button></div><canvas class="mindmap-minimap-canvas" tabindex="0" role="application" aria-label="Minimap. Drag or click to navigate the mind map."></canvas>';
workspace.appendChild(panel);
const canvas=panel.querySelector('canvas'),toggle=panel.querySelector('button');
const ctx=canvas.getContext('2d');
let lastTransform=null,drawQueued=false,nav=null;

function setCollapsed(collapsed){
  panel.classList.toggle('is-collapsed',collapsed);
  toggle.textContent=collapsed?'▣':'−';
  toggle.setAttribute('aria-label',collapsed?'Open minimap':'Collapse minimap');
  toggle.title=collapsed?'Open minimap':'Collapse minimap';
  try{localStorage.setItem(STORAGE_KEY,collapsed?'1':'0');}catch{}
  if(!collapsed)scheduleDraw();
}
try{setCollapsed(localStorage.getItem(STORAGE_KEY)==='1');}catch{setCollapsed(false);}
toggle.addEventListener('click',e=>{e.stopPropagation();setCollapsed(!panel.classList.contains('is-collapsed'));});

function parseTranslate(el){
  const raw=el?.getAttribute('transform')||'';
  const m=raw.match(/translate\(\s*(-?[\d.]+)(?:[ ,]+)(-?[\d.]+)\s*\)/i);
  return m?{x:Number(m[1]),y:Number(m[2])}:null;
}
function parseView(){
  const raw=viewport.getAttribute('transform')||'';
  const t=raw.match(/translate\(\s*(-?[\d.]+)(?:[ ,]+)(-?[\d.]+)\s*\)/i);
  const s=raw.match(/scale\(\s*([\d.]+)\s*\)/i);
  return{x:t?Number(t[1]):0,y:t?Number(t[2]):0,scale:s?Math.max(.0001,Number(s[1])):1};
}
function nodeData(){
  const app=window.MindMapApp,map=app?.getCurrentMap?.(),byId=new Map();
  document.querySelectorAll('#nodes .node').forEach(el=>{
    const p=parseTranslate(el);if(!p)return;
    const body=el.querySelector('.body');
    const r=Math.max(8,Number(body?.getAttribute('r'))||Number(body?.getAttribute('rx'))||46);
    byId.set(el.dataset.id,{id:el.dataset.id,x:p.x,y:p.y,r,color:map?.nodes?.[el.dataset.id]?.color||'#d7d0c5',selected:el.classList.contains('selected')});
  });
  return{map,byId,nodes:[...byId.values()]};
}
function worldViewport(view){
  const r=svg.getBoundingClientRect();
  return{x0:-view.x/view.scale,y0:-view.y/view.scale,x1:(r.width-view.x)/view.scale,y1:(r.height-view.y)/view.scale};
}
function computeTransform(nodes,vp,w,h){
  let minX=vp.x0,minY=vp.y0,maxX=vp.x1,maxY=vp.y1;
  nodes.forEach(n=>{minX=Math.min(minX,n.x-n.r);minY=Math.min(minY,n.y-n.r);maxX=Math.max(maxX,n.x+n.r);maxY=Math.max(maxY,n.y+n.r);});
  const spanX=Math.max(1,maxX-minX),spanY=Math.max(1,maxY-minY),pad=10;
  const scale=Math.max(.0001,Math.min((w-pad*2)/spanX,(h-pad*2)/spanY));
  const usedW=spanX*scale,usedH=spanY*scale;
  return{scale,ox:(w-usedW)/2-minX*scale,oy:(h-usedH)/2-minY*scale,w,h,minX,minY,maxX,maxY};
}
function worldToMini(x,y,t){return{x:x*t.scale+t.ox,y:y*t.scale+t.oy};}
function miniToWorld(clientX,clientY,t){
  const r=canvas.getBoundingClientRect(),x=(clientX-r.left)*(t.w/r.width),y=(clientY-r.top)*(t.h/r.height);
  return{x:(x-t.ox)/t.scale,y:(y-t.oy)/t.scale};
}
function resizeCanvas(){
  const r=canvas.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1),w=Math.max(1,Math.round(r.width*dpr)),h=Math.max(1,Math.round(r.height*dpr));
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
  ctx.setTransform(dpr,0,0,dpr,0,0);
  return{w:r.width,h:r.height};
}
function css(name,fallback){const v=getComputedStyle(document.documentElement).getPropertyValue(name).trim();return v||fallback;}
function draw(){
  drawQueued=false;if(panel.classList.contains('is-collapsed')||!ctx)return;
  const dims=resizeCanvas(),view=parseView(),data=nodeData(),vp=worldViewport(view),t=computeTransform(data.nodes,vp,dims.w,dims.h);lastTransform=t;
  ctx.clearRect(0,0,dims.w,dims.h);
  ctx.fillStyle=css('--canvas','#f7f3ec');ctx.fillRect(0,0,dims.w,dims.h);
  const line=css('--line','#d8d0c4'),ink=css('--ink','#2d271f'),accent=css('--accent','#6f5518');
  ctx.lineCap='round';ctx.lineJoin='round';
  ctx.strokeStyle=line;ctx.lineWidth=1;
  if(data.map){
    Object.values(data.map.nodes||{}).forEach(n=>{const a=data.byId.get(n.parentId),b=data.byId.get(n.id);if(!a||!b)return;const p1=worldToMini(a.x,a.y,t),p2=worldToMini(b.x,b.y,t);ctx.beginPath();ctx.moveTo(p1.x,p1.y);ctx.lineTo(p2.x,p2.y);ctx.stroke();});
  }
  data.nodes.forEach(n=>{const p=worldToMini(n.x,n.y,t),radius=Math.max(2.5,Math.min(6,n.r*t.scale*.22));ctx.beginPath();ctx.arc(p.x,p.y,radius,0,Math.PI*2);ctx.fillStyle=n.color;ctx.fill();ctx.strokeStyle=n.selected?accent:line;ctx.lineWidth=n.selected?2:1;ctx.stroke();});
  const a=worldToMini(vp.x0,vp.y0,t),b=worldToMini(vp.x1,vp.y1,t),x=Math.min(a.x,b.x),y=Math.min(a.y,b.y),ww=Math.abs(b.x-a.x),hh=Math.abs(b.y-a.y);
  ctx.fillStyle='rgba(111,85,24,.08)';ctx.fillRect(x,y,ww,hh);ctx.strokeStyle=accent;ctx.lineWidth=1.7;ctx.strokeRect(x+.85,y+.85,Math.max(0,ww-1.7),Math.max(0,hh-1.7));
  if(!data.nodes.length){ctx.fillStyle=ink;ctx.globalAlpha=.55;ctx.font='11px system-ui,sans-serif';ctx.textAlign='center';ctx.fillText('Map appears here',dims.w/2,dims.h/2);ctx.globalAlpha=1;}
}
function scheduleDraw(){if(drawQueued)return;drawQueued=true;requestAnimationFrame(draw);}

function dispatchMain(type,x,y){
  const ev=new PointerEvent(type,{bubbles:true,cancelable:true,pointerId:SYNTH_POINTER_ID,pointerType:'mouse',isPrimary:true,button:0,buttons:type==='pointerup'?0:1,clientX:x,clientY:y});
  svg.dispatchEvent(ev);
}
function withCaptureBypass(fn){
  const hadOwn=Object.prototype.hasOwnProperty.call(svg,'setPointerCapture'),own=svg.setPointerCapture;
  try{Object.defineProperty(svg,'setPointerCapture',{value:()=>{},configurable:true,writable:true});fn();}
  finally{if(hadOwn)Object.defineProperty(svg,'setPointerCapture',{value:own,configurable:true,writable:true});else delete svg.setPointerCapture;}
}
function startNavigation(e){
  if(e.button!==undefined&&e.button!==0)return;
  if(!lastTransform)draw();if(!lastTransform)return;
  e.preventDefault();e.stopPropagation();canvas.setPointerCapture?.(e.pointerId);
  const rect=svg.getBoundingClientRect(),view=parseView();
  nav={pointerId:e.pointerId,transform:{...lastTransform},view,originX:rect.left+rect.width/2,originY:rect.top+rect.height/2,width:rect.width,height:rect.height,lastX:rect.left+rect.width/2,lastY:rect.top+rect.height/2};
  withCaptureBypass(()=>dispatchMain('pointerdown',nav.originX,nav.originY));
  moveNavigation(e);
}
function moveNavigation(e){
  if(!nav||e.pointerId!==nav.pointerId)return;e.preventDefault();
  const world=miniToWorld(e.clientX,e.clientY,nav.transform),desiredX=nav.width/2-world.x*nav.view.scale,desiredY=nav.height/2-world.y*nav.view.scale;
  nav.lastX=nav.originX+(desiredX-nav.view.x);nav.lastY=nav.originY+(desiredY-nav.view.y);
  dispatchMain('pointermove',nav.lastX,nav.lastY);
}
function endNavigation(e){
  if(!nav||e.pointerId!==nav.pointerId)return;e.preventDefault();dispatchMain('pointerup',nav.lastX,nav.lastY);nav=null;scheduleDraw();
}
canvas.addEventListener('pointerdown',startNavigation);
canvas.addEventListener('pointermove',moveNavigation);
canvas.addEventListener('pointerup',endNavigation);
canvas.addEventListener('pointercancel',endNavigation);
function navigateToWorld(world){
  const r=svg.getBoundingClientRect(),view=parseView(),originX=r.left+r.width/2,originY=r.top+r.height/2,desiredX=r.width/2-world.x*view.scale,desiredY=r.height/2-world.y*view.scale;
  withCaptureBypass(()=>dispatchMain('pointerdown',originX,originY));
  dispatchMain('pointermove',originX+(desiredX-view.x),originY+(desiredY-view.y));
  dispatchMain('pointerup',originX+(desiredX-view.x),originY+(desiredY-view.y));
}
canvas.addEventListener('keydown',e=>{
  if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();
  const view=parseView(),r=svg.getBoundingClientRect(),step=.18,center={x:(r.width/2-view.x)/view.scale,y:(r.height/2-view.y)/view.scale};
  if(e.key==='ArrowLeft')center.x-=r.width*step/view.scale;if(e.key==='ArrowRight')center.x+=r.width*step/view.scale;if(e.key==='ArrowUp')center.y-=r.height*step/view.scale;if(e.key==='ArrowDown')center.y+=r.height*step/view.scale;
  navigateToWorld(center);
});

const observer=new MutationObserver(scheduleDraw);
observer.observe(viewport,{attributes:true,attributeFilter:['transform'],childList:true,subtree:true});
if(window.ResizeObserver)new ResizeObserver(scheduleDraw).observe(svg);
window.addEventListener('resize',scheduleDraw,{passive:true});
window.addEventListener('orientationchange',scheduleDraw,{passive:true});
scheduleDraw();
})();