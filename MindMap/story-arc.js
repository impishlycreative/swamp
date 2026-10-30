(()=>{'use strict';

// Story-template overview renderer.
// Template overview maps remain normal project maps, but their beat bubbles
// are pinned to a left-to-right story arc instead of the radial mind-map layout.
const PROFILES={
  'Three-Act Structure':[2,4,6,4,7,5,6,10,2],
  'Save the Cat':[2,2,3,6,4,6,5,7,8,7,2,1,6,10,2],
  "Hero's Journey":[2,5,3,4,6,5,7,10,6,7,10,3]
};
const PROFILE_NAMES=Object.keys(PROFILES);
let scheduled=false;
let syncing=false;

function app(){return window.MindMapApp;}
function map(){return app()?.getCurrentMap?.()||null;}
function isTouch(){return matchMedia('(max-width:850px),(hover:none) and (pointer:coarse)').matches||(navigator.maxTouchPoints>0&&Math.min(screen.width,screen.height)<900);}
function rootText(m){return String(m?.nodes?.[m.rootId]?.text||m?.title||'');}
function profileName(m){
  const title=rootText(m);
  return PROFILE_NAMES.find(name=>title===`${name} — Overview`||title.startsWith(`${name} — Overview`))||null;
}
function rootChildren(m){return Object.values(m?.nodes||{}).filter(n=>n.parentId===m.rootId);}
function storyBeats(m){
  return Object.values(m?.nodes||{}).filter(n=>Number.isFinite(n.storyBeatIndex)).sort((a,b)=>a.storyBeatIndex-b.storyBeatIndex);
}
function looksLikeTemplateOverview(m){
  const name=profileName(m);if(!name)return false;
  const kids=rootChildren(m),levels=PROFILES[name];
  return kids.length===levels.length&&kids.every(n=>n.targetMapId);
}
function ensureMetadata(m){
  if(!m)return{story:false,changed:false,beats:[]};
  let changed=false;
  if(m.layoutMode!=='storyline'){
    if(!looksLikeTemplateOverview(m))return{story:false,changed:false,beats:[]};
    m.layoutMode='storyline';
    m.storyline={metric:'story-pressure',min:0,max:10};
    changed=true;
  }
  let beats=storyBeats(m);
  if(!beats.length){
    const name=profileName(m),levels=name?PROFILES[name]:null,kids=rootChildren(m);
    if(!levels||!kids.length)return{story:false,changed,beats:[]};
    kids.forEach((n,i)=>{
      n.storyBeatIndex=i;
      n.storyLevel=levels[i]??5.5;
    });
    beats=storyBeats(m);
    changed=true;
  }
  return{story:true,changed,beats};
}
function desiredPoint(beat,index,count){
  const step=isTouch()?210:235;
  const amplitude=isTouch()?43:50;
  const level=Math.max(0,Math.min(10,Number.isFinite(beat.storyLevel)?beat.storyLevel:5.5));
  return{x:(index-(count-1)/2)*step,y:(5.5-level)*amplitude};
}
function pinBeats(beats){
  let changed=false;
  beats.forEach((beat,i)=>{
    const p=desiredPoint(beat,i,beats.length);
    if(!Number.isFinite(beat.x)||Math.abs(beat.x-p.x)>.5){beat.x=p.x;changed=true;}
    if(!Number.isFinite(beat.y)||Math.abs(beat.y-p.y)>.5){beat.y=p.y;changed=true;}
  });
  return changed;
}
function storyPath(points){
  if(!points.length)return'';
  if(points.length===1)return`M ${points[0].x} ${points[0].y}`;
  let d=`M ${points[0].x} ${points[0].y}`;
  for(let i=0;i<points.length-1;i++){
    const p0=points[i-1]||points[i],p1=points[i],p2=points[i+1],p3=points[i+2]||p2;
    const c1x=p1.x+(p2.x-p0.x)/6,c1y=p1.y+(p2.y-p0.y)/6;
    const c2x=p2.x-(p3.x-p1.x)/6,c2y=p2.y-(p3.y-p1.y)/6;
    d+=` C ${c1x} ${c1y} ${c2x} ${c2y} ${p2.x} ${p2.y}`;
  }
  return d;
}
function arcLayer(){
  const viewport=document.getElementById('viewport'),edges=document.getElementById('edges');
  if(!viewport||!edges)return null;
  let layer=document.getElementById('storyArcLayer');
  if(!layer){
    layer=document.createElementNS('http://www.w3.org/2000/svg','g');
    layer.id='storyArcLayer';
    layer.setAttribute('pointer-events','none');
    viewport.insertBefore(layer,edges);
  }
  return layer;
}
function drawArc(m,beats){
  const edges=document.getElementById('edges'),labels=document.getElementById('labels'),nodes=document.getElementById('nodes'),layer=arcLayer();
  if(!edges||!labels||!nodes||!layer)return;
  edges.style.display='none';
  labels.style.display='none';
  layer.style.display='';
  layer.innerHTML='';

  const points=beats.map((beat,i)=>desiredPoint(beat,i,beats.length));
  if(points.length){
    const d=storyPath(points),ns='http://www.w3.org/2000/svg';
    const under=document.createElementNS(ns,'path');
    under.setAttribute('d',d);under.setAttribute('fill','none');under.setAttribute('stroke','#fff');under.setAttribute('stroke-width','10');under.setAttribute('stroke-linecap','round');under.setAttribute('stroke-linejoin','round');under.setAttribute('opacity','.8');
    const line=document.createElementNS(ns,'path');
    line.setAttribute('d',d);line.setAttribute('fill','none');line.setAttribute('stroke','#8b8174');line.setAttribute('stroke-width','5');line.setAttribute('stroke-linecap','round');line.setAttribute('stroke-linejoin','round');line.setAttribute('opacity','.88');
    layer.append(under,line);
  }

  Array.from(nodes.querySelectorAll('.node')).forEach(el=>{
    el.style.display=el.dataset.id===m.rootId?'none':'';
  });
}
function clearArc(){
  document.getElementById('storyArcLayer')?.remove();
  const edges=document.getElementById('edges'),labels=document.getElementById('labels');
  if(edges)edges.style.display='';
  if(labels)labels.style.display='';
  document.querySelectorAll('#nodes .node').forEach(el=>el.style.display='');
}
function storyControls(active){
  if(!active)return;
  ['addBtn','rapidfireBtn','focusBtn','addChildBtn','collapseBtn','deleteBtn','resetPosBtn','contextRapid','contextFocus'].forEach(id=>{
    const el=document.getElementById(id);if(el)el.disabled=true;
  });
}
function selectFirstBeatIfRoot(m,beats){
  const root=document.querySelector(`#nodes .node.root.selected`);
  if(!root||!beats.length)return;
  const first=Array.from(document.querySelectorAll('#nodes .node')).find(el=>el.dataset.id===beats[0].id);
  first?.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));
}
function showToast(message){
  const el=document.getElementById('toast');if(!el)return;
  el.textContent=message;el.classList.add('show');clearTimeout(el._storyArcTimer);el._storyArcTimer=setTimeout(()=>el.classList.remove('show'),1500);
}
function sync(){
  if(syncing)return;syncing=true;
  try{
    const m=map();
    if(!m){clearArc();return;}
    const meta=ensureMetadata(m);
    if(!meta.story){clearArc();return;}
    const moved=pinBeats(meta.beats);
    if((meta.changed||moved)&&app()?.save){
      app().save();
      // Re-render once so the app's own node transforms use the pinned points.
      app().setCurrentMap?.(m.id,false);
      return;
    }
    drawArc(m,meta.beats);
    storyControls(true);
    selectFirstBeatIfRoot(m,meta.beats);
    if(app())app().version='2.1.0';
  }finally{syncing=false;}
}
function schedule(){
  if(scheduled)return;scheduled=true;
  requestAnimationFrame(()=>{scheduled=false;sync();});
}

// Template creation, map switching, import, and normal re-renders all replace
// the node group's children. Watching only that group avoids observing our own
// story-line SVG updates and prevents needless redraw loops.
const nodesHost=document.getElementById('nodes');
if(nodesHost)new MutationObserver(schedule).observe(nodesHost,{childList:true});
document.addEventListener('change',e=>{if(e.target?.id==='mapSelect')schedule();});
document.addEventListener('click',e=>{if(e.target?.closest?.('#templateOptions button,#mobileTemplates,#templateBtn'))setTimeout(schedule,0);});
window.addEventListener('resize',schedule);

// Story overview maps are structural diagrams: the beats stay on their line.
// Keep structural-edit shortcuts from accidentally altering the overview.
document.addEventListener('keydown',e=>{
  const m=map();if(!m||m.layoutMode!=='storyline')return;
  const typing=e.target.matches?.('input,textarea,[contenteditable="true"]')||!!document.querySelector('.inline-editor:focus');
  if(typing||e.ctrlKey||e.metaKey||e.altKey)return;
  const key=e.key.toLowerCase();
  if(e.key==='Enter'||e.key==='Delete'||e.key==='Backspace'||key==='f'||key==='c'){
    e.preventDefault();e.stopImmediatePropagation();
    if(e.key==='Enter')showToast('Open a beat map to brainstorm that beat');
    else if(e.key==='Delete'||e.key==='Backspace')showToast('Template beats stay on the story arc');
  }
},true);

document.addEventListener('pointerdown',e=>{
  const m=map();if(!m||m.layoutMode!=='storyline')return;
  const node=e.target.closest?.('#nodes .node');
  if(node&&e.target.tagName?.toLowerCase()!=='text')e.stopImmediatePropagation();
},true);

schedule();
})();
