(()=>{'use strict';
if(window.__SWAMP_TEMPLATE_INITIAL_VIEW__)return;
window.__SWAMP_TEMPLATE_INITIAL_VIEW__=true;

const APPLIED_KEY='initialChunkViewV1';
const RECENT_MS=60000;
let applying=false;
let lastMapId=null;
let observer=null;

const app=()=>window.MindMapApp;
const currentMap=()=>app()?.getCurrentMap?.()||null;
const isTouch=()=>matchMedia('(max-width:850px),(hover:none) and (pointer:coarse)').matches||(navigator.maxTouchPoints>0&&Math.min(screen.width,screen.height)<900);

function isRecent(map){
  const created=Date.parse(map?.created||'');
  return Number.isFinite(created)&&(Date.now()-created)>=0&&(Date.now()-created)<RECENT_MS;
}
function storylineBeats(map){
  return Object.values(map?.nodes||{}).filter(n=>Number.isFinite(n.storyBeatIndex)).sort((a,b)=>a.storyBeatIndex-b.storyBeatIndex);
}
function isStoryOverview(map){
  if(!map)return false;
  if(map.layoutMode==='storyline')return true;
  const title=String(map.nodes?.[map.rootId]?.text||map.title||'');
  return / — Overview$/.test(title)&&storylineBeats(map).length>=3;
}
function zoomPercent(){
  const n=parseFloat(document.getElementById('zoomReadout')?.textContent||'');
  return Number.isFinite(n)?n/100:null;
}
function chooseScale(width,mobile){
  const desired=mobile?3:(width<1050?5:7);
  const raw=(Math.max(280,width)*.82)/(desired*210);
  return mobile?Math.max(.58,Math.min(.72,raw)):Math.max(.72,Math.min(.9,raw));
}
function zoomToward(target){
  const zin=document.getElementById('zoomIn'),zout=document.getElementById('zoomOut');
  if(!zin||!zout)return;
  for(let i=0;i<14;i++){
    const current=zoomPercent();if(!current)return;
    const up=Math.min(2.6,current*1.2),down=Math.max(.12,current/1.2);
    const here=Math.abs(current-target),upDiff=Math.abs(up-target),downDiff=Math.abs(down-target);
    if(upDiff+0.005<here){zin.click();continue;}
    if(downDiff+0.005<here){zout.click();continue;}
    break;
  }
}
function cleanSelection(){
  const svg=document.getElementById('svg');
  if(svg)svg.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));
}
function markApplied(map){
  map.storyline=map.storyline&&typeof map.storyline==='object'?map.storyline:{};
  map.storyline[APPLIED_KEY]=true;
  app()?.save?.();
}
function applyInitialChunkView(){
  if(applying)return;
  const map=currentMap();
  if(!map||!isStoryOverview(map)||!isRecent(map))return;
  map.storyline=map.storyline&&typeof map.storyline==='object'?map.storyline:{};
  if(map.storyline[APPLIED_KEY])return;
  const beats=storylineBeats(map);
  if(beats.length<3)return;
  const svg=document.getElementById('svg');
  const nodes=document.getElementById('nodes');
  if(!svg||!nodes)return;
  const rect=svg.getBoundingClientRect();
  if(rect.width<100||rect.height<100)return;
  const mobile=isTouch();
  const desired=mobile?3:(rect.width<1050?5:7);
  const focusIndex=Math.min(beats.length-1,Math.max(0,Math.floor((Math.min(desired,beats.length)-1)/2)));
  const focus=beats[focusIndex];
  const el=nodes.querySelector(`.node[data-id="${CSS.escape(focus.id)}"]`);
  if(!el)return;
  applying=true;
  try{
    el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));
    requestAnimationFrame(()=>{
      document.getElementById('centerBtn')?.click();
      requestAnimationFrame(()=>{
        zoomToward(chooseScale(rect.width,mobile));
        markApplied(map);
        cleanSelection();
        applying=false;
      });
    });
  }catch{
    applying=false;
  }
}
function schedule(){
  clearTimeout(schedule._t);
  schedule._t=setTimeout(applyInitialChunkView,80);
}
function boot(){
  const nodes=document.getElementById('nodes');
  if(nodes){observer=new MutationObserver(schedule);observer.observe(nodes,{childList:true,subtree:true});}
  document.getElementById('mapSelect')?.addEventListener('change',schedule);
  document.getElementById('templateOptions')?.addEventListener('click',()=>setTimeout(schedule,0),true);
  window.addEventListener('resize',schedule,{passive:true});
  setInterval(()=>{
    const id=currentMap()?.id||null;
    if(id!==lastMapId){lastMapId=id;schedule();}
  },500);
  schedule();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
