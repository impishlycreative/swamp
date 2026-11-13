(()=>{'use strict';

// Story-template overview renderer and guided beat navigation.
// The overview stays structural; brainstorming happens in each linked beat map.
const PROFILES={
  'Three-Act Structure':[2,4,6,4,7,5,6,10,2],
  'Save the Cat':[2,2,3,6,4,6,5,7,8,7,2,1,6,10,2],
  "Hero's Journey":[2,5,3,4,6,5,7,10,6,7,10,3]
};
const PROFILE_NAMES=Object.keys(PROFILES);
const beat=(purpose,context,percentage)=>({purpose,context,percentage});
const HELP={
  'Three-Act Structure':{
    'Act I — Setup':beat('Set up the main character, normal life, goal, stakes, and key relationships.','This is the opening. Build toward the first big commitment.','≈20–25% of the book'),
    'Inciting Incident':beat('Something changes and gives the character a problem or opportunity.','After the setup, before the character fully commits.','Around the 8–12% point'),
    'First Plot Point':beat('Force the character to commit to the main conflict.','This ends Act I and launches the main struggle.','Around the 20–25% point'),
    'Act II — Confrontation':beat('Make the character try, fail, learn, adapt, and face harder problems.','This is the long middle between the two major plot points.','≈50–60% of the book'),
    'Midpoint':beat('Change the situation in a major way.','A big win, loss, reveal, or reversal changes how the character moves forward.','Around the 50% point'),
    'Second Plot Point':beat('Give the final big turn that pushes the story toward the ending.','This closes Act II and points directly at the final conflict.','Around the 75–80% point'),
    'Act III — Resolution':beat('Resolve the main conflict and pay off the important setup.','This is the final movement, including the climax and aftermath.','≈20–25% of the book'),
    'Climax':beat('Make the character face the decisive choice or confrontation.','This answers the story’s main question.','Usually around the 90–98% point'),
    'Denouement':beat('Show what changed and what the new normal looks like.','This comes after the climax. Keep it focused.','≈1–5% of the book')
  },
  'Save the Cat':{
    'Opening Image':beat('Show the starting world and the character’s current state.','A quick opening snapshot that can contrast with the ending.','First ≈1% of the book'),
    'Theme Stated':beat('Hint at the story’s main truth, question, or lesson.','Keep it natural. The character may not understand it yet.','Around the 5% point'),
    'Setup':beat('Show the character, normal life, goals, flaws, stakes, and key people.','Plant what the rest of the story will build on.','Roughly the first 10%'),
    'Catalyst':beat('Knock the normal situation off balance.','This creates the main disturbance.','Around the 10% point'),
    'Debate':beat('Let the character react, hesitate, prepare, or try to avoid the problem.','This sits between the catalyst and full commitment.','≈10–20% of the book'),
    'Break into Two':beat('Move the character into the main story.','They commit to a new plan, place, relationship, mission, or way of acting.','Around the 20% point'),
    'B Story':beat('Bring in a relationship or subplot that supports the theme.','It should matter to the main story, not feel separate.','Often around the 20–25% point'),
    'Fun and Games':beat('Deliver the main promise of the story idea.','Explore the situations, discoveries, wins, losses, and complications readers came for.','≈20–50% of the book'),
    'Midpoint':beat('Make a major change in stakes, goals, or understanding.','A big win, loss, reveal, or reversal changes the story.','Around the 50% point'),
    'Bad Guys Close In':beat('Increase pressure and remove easy options.','Opposition, flaws, time, relationships, or consequences tighten the situation.','≈50–75% of the book'),
    'All Is Lost':beat('Break the current plan or path to success.','This is the low point. Something important stops working.','Around the 75% point'),
    'Dark Night of the Soul':beat('Let the character face what went wrong.','This creates the realization needed for the final move.','Roughly 75–80% of the book'),
    'Break into Three':beat('Give the character a new plan or understanding.','This launches the final part of the story.','Around the 80% point'),
    'Finale':beat('Carry out the final plan and resolve the main conflict.','Pay off the important setup and test what the character learned.','≈80–99% of the book'),
    'Final Image':beat('Show the ending state in one clear image or moment.','Echo or contrast the Opening Image.','Final ≈1% of the book')
  },
  "Hero's Journey":{
    'Ordinary World':beat('Show the hero’s normal life before the journey.','Give a clear baseline for what will change.','≈0–10% of the book'),
    'Call to Adventure':beat('Give the hero a challenge, invitation, threat, or mission.','The journey is offered, but not fully accepted yet.','Around the 10% point'),
    'Refusal of the Call':beat('Show why the hero does not want to go forward.','Fear, duty, doubt, or practical problems can hold them back.','≈10–15% of the book'),
    'Meeting the Mentor':beat('Give the hero useful guidance, tools, training, or confidence.','The mentor helps prepare the hero but does not solve the journey.','≈15–20% of the book'),
    'Crossing the First Threshold':beat('Move the hero into the unfamiliar part of the journey.','The adventure becomes real and harder to walk away from.','Around the 20–25% point'),
    'Tests, Allies, Enemies':beat('Give the hero trials, friends, rivals, mistakes, and discoveries.','This teaches the rules of the new world.','≈25–45% of the book'),
    'Approach to the Inmost Cave':beat('Prepare for the central danger or challenge.','Narrow the options and build pressure before the ordeal.','≈45–50% of the book'),
    'Ordeal':beat('Put the hero through a major crisis or test.','This should cost something and change the hero or the journey.','≈50–60% of the book'),
    'Reward':beat('Give the hero something gained from surviving the ordeal.','It can be knowledge, victory, power, trust, or something concrete.','≈60–70% of the book'),
    'The Road Back':beat('Turn the hero toward the final stretch or return.','Consequences and unfinished business still remain.','≈70–80% of the book'),
    'Resurrection':beat('Test the hero one last time at the highest level.','The final test should show what changed.','≈80–95% of the book'),
    'Return with the Elixir':beat('Show what the hero brings back from the journey.','End with the change, lesson, healing, warning, or result that matters.','≈95–100% of the book')
  }
};
let scheduled=false;
let syncing=false;
let migrationDoneFor=new Set();

function app(){return window.MindMapApp;}
function project(){return app()?.getProject?.()||null;}
function map(){return app()?.getCurrentMap?.()||null;}
function isTouch(){return matchMedia('(max-width:850px),(hover:none) and (pointer:coarse)').matches||(navigator.maxTouchPoints>0&&Math.min(screen.width,screen.height)<900);}
function rootText(m){return String(m?.nodes?.[m.rootId]?.text||m?.title||'');}
function profileName(m){const title=rootText(m);return PROFILE_NAMES.find(name=>title===`${name} — Overview`||title.startsWith(`${name} — Overview`))||null;}
function rootChildren(m){return Object.values(m?.nodes||{}).filter(n=>n.parentId===m.rootId);}
function storyBeats(m){return Object.values(m?.nodes||{}).filter(n=>Number.isFinite(n.storyBeatIndex)).sort((a,b)=>a.storyBeatIndex-b.storyBeatIndex);}
function looksLikeTemplateOverview(m){const name=profileName(m);if(!name)return false;const kids=rootChildren(m),levels=PROFILES[name];return kids.length===levels.length&&kids.every(n=>n.targetMapId);}
function ensureMetadata(m){
  if(!m)return{story:false,changed:false,beats:[]};
  let changed=false;
  if(m.layoutMode!=='storyline'){
    if(!looksLikeTemplateOverview(m))return{story:false,changed:false,beats:[]};
    m.layoutMode='storyline';m.storyline={metric:'story-pressure',min:0,max:10};changed=true;
  }
  let beats=storyBeats(m);
  if(!beats.length){
    const name=profileName(m),levels=name?PROFILES[name]:null,kids=rootChildren(m);if(!levels||!kids.length)return{story:false,changed,beats:[]};
    kids.forEach((n,i)=>{n.storyBeatIndex=i;n.storyLevel=levels[i]??5.5;});beats=storyBeats(m);changed=true;
  }
  return{story:true,changed,beats};
}
function desiredPoint(beat,index,count){const step=isTouch()?190:210,amplitude=isTouch()?40:46;const level=Math.max(0,Math.min(10,Number.isFinite(beat.storyLevel)?beat.storyLevel:5.5));return{x:(index-(count-1)/2)*step,y:(5.5-level)*amplitude};}
function pinBeats(beats){let changed=false;beats.forEach((beat,i)=>{const p=desiredPoint(beat,i,beats.length);if(!Number.isFinite(beat.x)||Math.abs(beat.x-p.x)>.5){beat.x=p.x;changed=true;}if(!Number.isFinite(beat.y)||Math.abs(beat.y-p.y)>.5){beat.y=p.y;changed=true;}});return changed;}
function storyPath(points){
  if(!points.length)return'';if(points.length===1)return`M ${points[0].x} ${points[0].y}`;
  let d=`M ${points[0].x} ${points[0].y}`;
  for(let i=0;i<points.length-1;i++){
    const p0=points[i-1]||points[i],p1=points[i],p2=points[i+1],p3=points[i+2]||p2;
    const c1x=p1.x+(p2.x-p0.x)/6,c1y=p1.y+(p2.y-p0.y)/6,c2x=p2.x-(p3.x-p1.x)/6,c2y=p2.y-(p3.y-p1.y)/6;
    d+=` C ${c1x} ${c1y} ${c2x} ${c2y} ${p2.x} ${p2.y}`;
  }
  return d;
}
function arcLayer(){
  const viewport=document.getElementById('viewport'),edges=document.getElementById('edges');if(!viewport||!edges)return null;
  let layer=document.getElementById('storyArcLayer');if(!layer){layer=document.createElementNS('http://www.w3.org/2000/svg','g');layer.id='storyArcLayer';layer.setAttribute('pointer-events','none');viewport.insertBefore(layer,edges);}return layer;
}
function drawArc(m,beats){
  const edges=document.getElementById('edges'),labels=document.getElementById('labels'),nodes=document.getElementById('nodes'),layer=arcLayer();if(!edges||!labels||!nodes||!layer)return;
  edges.style.display='none';labels.style.display='none';layer.style.display='';layer.innerHTML='';
  const points=beats.map((beat,i)=>desiredPoint(beat,i,beats.length));
  if(points.length){
    const d=storyPath(points),ns='http://www.w3.org/2000/svg';
    const under=document.createElementNS(ns,'path');under.setAttribute('d',d);under.setAttribute('fill','none');under.setAttribute('stroke','#fff');under.setAttribute('stroke-width','10');under.setAttribute('stroke-linecap','round');under.setAttribute('stroke-linejoin','round');under.setAttribute('opacity','.8');
    const line=document.createElementNS(ns,'path');line.setAttribute('d',d);line.setAttribute('fill','none');line.setAttribute('stroke','#8b8174');line.setAttribute('stroke-width','5');line.setAttribute('stroke-linecap','round');line.setAttribute('stroke-linejoin','round');line.setAttribute('opacity','.88');layer.append(under,line);
  }
  Array.from(nodes.querySelectorAll('.node')).forEach(el=>{el.style.display=el.dataset.id===m.rootId?'none':'';});
}
function clearArc(){
  document.getElementById('storyArcLayer')?.remove();const edges=document.getElementById('edges'),labels=document.getElementById('labels');if(edges)edges.style.display='';if(labels)labels.style.display='';document.querySelectorAll('#nodes .node').forEach(el=>el.style.display='');
}
function storyControls(active){['addBtn','rapidfireBtn','focusBtn','addChildBtn','contextAdd','contextRapid','contextFocus'].forEach(id=>{const el=document.getElementById(id);if(el)el.disabled=!!active;});}
function showToast(message){const el=document.getElementById('toast');if(!el)return;el.textContent=message;el.classList.add('show');clearTimeout(el._storyArcTimer);el._storyArcTimer=setTimeout(()=>el.classList.remove('show'),1500);}
function descendantsOf(m,id,out=[]){Object.values(m.nodes||{}).filter(n=>n.parentId===id).forEach(n=>{out.push(n);descendantsOf(m,n.id,out);});return out;}
function cloneSubtreeInto(source,top,target){
  const list=[top,...descendantsOf(source,top.id)],idMap=new Map();
  for(const n of list){let id=n.id;while(target.nodes[id]||idMap.has(id))id=`i_${Math.random().toString(36).slice(2,10)}${Date.now().toString(36).slice(-4)}`;idMap.set(n.id,id);}
  for(const n of list){const copy={...n,id:idMap.get(n.id),parentId:n.id===top.id?target.rootId:idMap.get(n.parentId),x:null,y:null,targetMapId:n.targetMapId||null};target.nodes[copy.id]=copy;}
  list.forEach(n=>delete source.nodes[n.id]);
}
function migrateLegacyOverviewChildren(m,beats){
  if(migrationDoneFor.has(m.id))return false;let changed=false;
  for(const b of beats){const target=project()?.sessions?.[b.targetMapId];if(!target?.nodes?.[target.rootId])continue;const direct=Object.values(m.nodes||{}).filter(n=>n.parentId===b.id);direct.forEach(top=>{cloneSubtreeInto(m,top,target);changed=true;});}
  migrationDoneFor.add(m.id);return changed;
}
function ideaCountFor(beat){const target=project()?.sessions?.[beat.targetMapId];if(!target?.nodes)return 0;return Math.max(0,Object.keys(target.nodes).length-1);}
function helpFor(templateName,title){return HELP[templateName]?.[title]||beat('Develop this part of the story.','Keep the idea simple and specific.','Flexible — use what fits the story.');}
function ensureUi(){
  if(!document.getElementById('templateGuideStyles')){
    const style=document.createElement('style');style.id='templateGuideStyles';style.textContent=`
      .template-help-icon{cursor:help}.template-help-icon circle{fill:rgba(255,255,255,.97);stroke:rgba(49,95,77,.55);stroke-width:1.7}.template-help-icon text{font-size:12px;font-weight:900;fill:#315f4d;pointer-events:none;text-anchor:middle;dominant-baseline:middle}.template-child-indicator{font-size:10px;font-weight:900;fill:#315f4d;letter-spacing:.04em;pointer-events:none;text-anchor:middle}.template-focus-nav{position:absolute;left:18px;top:18px;z-index:45;display:flex;gap:8px;align-items:center}.template-focus-nav.hidden{display:none}.template-focus-nav .btn{box-shadow:0 8px 24px rgba(41,36,30,.16)}.template-help-modal{z-index:140}.template-help-card{width:min(520px,100%);padding:22px}.template-help-kicker{font-size:.76rem;font-weight:850;text-transform:uppercase;letter-spacing:.08em;color:#557766;margin-bottom:5px}.template-help-grid{display:grid;gap:10px;margin-top:14px}.template-help-block{background:var(--soft,#f4f1ea);border:1px solid var(--line,#ddd3c6);border-radius:14px;padding:12px 13px}.template-help-block strong{display:block;font-size:.74rem;text-transform:uppercase;letter-spacing:.06em;color:var(--muted,#625d55);margin-bottom:4px}.template-help-block p{margin:0;color:var(--ink,#25231f);line-height:1.4}.template-help-percent{font-size:1.02rem;font-weight:850;color:#315f4d}.template-brainstorm-rule{margin:12px 0 0;color:var(--muted,#625d55);font-size:.82rem;line-height:1.4}@media(max-width:850px),(hover:none) and (pointer:coarse){.template-focus-nav{left:10px;top:10px;max-width:calc(100vw - 20px)}.template-focus-nav .btn{padding:8px 10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.template-help-modal{place-items:end center;padding:8px}.template-help-card{width:100%;border-radius:24px;margin-bottom:env(safe-area-inset-bottom)}}`;
    document.head.appendChild(style);
  }
  const workspace=document.getElementById('workspace');
  if(workspace&&!document.getElementById('templateFocusNav')){
    const nav=document.createElement('div');nav.id='templateFocusNav';nav.className='template-focus-nav hidden';nav.innerHTML='<button id="templateBackBtn" class="btn" type="button">← Template overview</button><button id="templateBeatHelpBtn" class="btn icon" type="button" title="Beat help" aria-label="Beat help">?</button>';workspace.appendChild(nav);
    document.getElementById('templateBackBtn').addEventListener('click',()=>{const ctx=findOverviewForMap(map()?.id);if(ctx)app()?.setCurrentMap?.(ctx.overview.id,true,false);});
    document.getElementById('templateBeatHelpBtn').addEventListener('click',()=>{const ctx=findOverviewForMap(map()?.id);if(ctx)showHelp(ctx.name,ctx.node);});
  }
  if(!document.getElementById('templateHelpDialog')){
    const modal=document.createElement('div');modal.id='templateHelpDialog';modal.className='modal template-help-modal hidden';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.innerHTML=`<div class="card template-help-card"><div id="templateHelpKicker" class="template-help-kicker"></div><h2 id="templateHelpTitle">Story beat</h2><div class="template-help-grid"><div class="template-help-block"><strong>What it is for</strong><p id="templateHelpPurpose"></p></div><div class="template-help-block"><strong>Where it fits</strong><p id="templateHelpContext"></p></div><div class="template-help-block"><strong>Typical placement</strong><p id="templateHelpPercent" class="template-help-percent"></p></div></div><p class="template-brainstorm-rule"><strong>Brainstorming:</strong> Keep examples short. Use plain English. One thought at a time.</p><button id="templateHelpClose" class="btn" style="width:100%;margin-top:12px" type="button">Close</button></div>`;document.body.appendChild(modal);
    modal.addEventListener('click',e=>{if(e.target===modal)modal.classList.add('hidden');});document.getElementById('templateHelpClose').addEventListener('click',()=>modal.classList.add('hidden'));
  }
}
function showHelp(templateName,node){
  ensureUi();const h=helpFor(templateName,node.text);document.getElementById('templateHelpKicker').textContent=templateName||'Story template';document.getElementById('templateHelpTitle').textContent=node.text||'Story beat';document.getElementById('templateHelpPurpose').textContent=h.purpose;document.getElementById('templateHelpContext').textContent=h.context;document.getElementById('templateHelpPercent').textContent=h.percentage;document.getElementById('templateHelpDialog').classList.remove('hidden');
}
function decorateBeats(m,beats){
  const templateName=profileName(m),ns='http://www.w3.org/2000/svg';
  for(const b of beats){
    const g=document.querySelector(`#nodes .node[data-id="${CSS.escape(b.id)}"]`);if(!g)continue;g.classList.add('template-beat');
    const body=g.querySelector('.body'),r=Number(body?.getAttribute('r'))||64;
    let help=g.querySelector('.template-help-icon');if(!help){help=document.createElementNS(ns,'g');help.setAttribute('class','template-help-icon');help.dataset.nodeId=b.id;const c=document.createElementNS(ns,'circle'),t=document.createElementNS(ns,'text');c.setAttribute('r','11');t.setAttribute('y','.5');t.textContent='?';help.append(c,t);g.appendChild(help);}help.setAttribute('transform',`translate(${Math.round(r*.67)} ${Math.round(-r*.67)})`);
    const count=ideaCountFor(b);let label=g.querySelector('.template-child-indicator');if(count>0){if(!label){label=document.createElementNS(ns,'text');label.setAttribute('class','template-child-indicator');g.appendChild(label);}label.setAttribute('y',String(r-31));label.textContent=`● ${count} IDEA${count===1?'':'S'}`;}else label?.remove();
    const linked=g.querySelector('.linked-label');if(linked)linked.textContent='OPEN IDEAS ↗';
  }
}
function findOverviewForMap(mapId){
  const p=project();if(!p?.sessions||!mapId)return null;
  for(const h of p.templateHistory||[]){const overview=p.sessions[h.overviewMapId||h.overviewSessionId];if(!overview)continue;const node=Object.values(overview.nodes||{}).find(n=>n.targetMapId===mapId||n.targetSessionId===mapId);if(node)return{overview,node,name:h.name||profileName(overview)};}
  for(const overview of Object.values(p.sessions)){const name=profileName(overview);if(!name)continue;const node=Object.values(overview.nodes||{}).find(n=>n.targetMapId===mapId||n.targetSessionId===mapId);if(node)return{overview,node,name};}
  return null;
}
function updateFocusNav(m){
  ensureUi();const nav=document.getElementById('templateFocusNav'),ctx=findOverviewForMap(m?.id);if(!nav)return;nav.classList.toggle('hidden',!ctx);if(ctx){document.getElementById('templateBackBtn').textContent=`← ${ctx.name||'Template'} overview`;document.getElementById('templateBeatHelpBtn').title=`Help: ${ctx.node.text}`;}
}
function updateGlobalUi(){
  const exit=document.getElementById('rapidfireCancel');if(exit)exit.textContent='Exit';const idea=document.getElementById('rapidfireIdea');if(idea)idea.placeholder='One short idea';const desc=document.getElementById('rapidfireDescription');if(desc)desc.placeholder='Optional short note';
}
function sync(){
  if(syncing)return;syncing=true;
  try{
    ensureUi();updateGlobalUi();const m=map();updateFocusNav(m);
    if(!m){clearArc();storyControls(false);return;}
    const meta=ensureMetadata(m);
    if(!meta.story){clearArc();storyControls(false);return;}
    const migrated=migrateLegacyOverviewChildren(m,meta.beats),moved=pinBeats(meta.beats);
    if((meta.changed||moved||migrated)&&app()?.save){app().save();app().setCurrentMap?.(m.id,false,false);return;}
    drawArc(m,meta.beats);decorateBeats(m,meta.beats);storyControls(true);
  }finally{syncing=false;}
}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;sync();});}

const nodesHost=document.getElementById('nodes');if(nodesHost)new MutationObserver(schedule).observe(nodesHost,{childList:true});
document.addEventListener('change',e=>{if(e.target?.id==='mapSelect')schedule();});
document.addEventListener('click',e=>{if(e.target?.closest?.('#templateOptions button,#mobileTemplates,#templateBtn'))setTimeout(schedule,0);});
window.addEventListener('resize',schedule);

document.addEventListener('keydown',e=>{
  const m=map();
  if(e.key==='Escape'&&!document.getElementById('templateHelpDialog')?.classList.contains('hidden')){e.preventDefault();e.stopImmediatePropagation();document.getElementById('templateHelpDialog').classList.add('hidden');return;}
  if(!m||m.layoutMode!=='storyline')return;
  const typing=e.target.matches?.('input,textarea,[contenteditable="true"]')||!!document.querySelector('.inline-editor:focus');if(typing||e.ctrlKey||e.metaKey||e.altKey)return;
  const key=e.key.toLowerCase();if(e.key==='Enter'||e.key==='Delete'||e.key==='Backspace'||key==='f'||key==='c'){e.preventDefault();e.stopImmediatePropagation();if(e.key==='Enter')showToast('Click a beat to brainstorm inside it');else if(e.key==='Delete'||e.key==='Backspace')showToast('Template beats stay on the story arc');}
},true);

document.addEventListener('pointerdown',e=>{
  const m=map();if(!m||m.layoutMode!=='storyline')return;const node=e.target.closest?.('#nodes .node');if(!node)return;if(e.target.closest?.('.template-help-icon')){e.preventDefault();e.stopImmediatePropagation();return;}if(e.target.tagName?.toLowerCase()!=='text')e.stopImmediatePropagation();
},true);

document.addEventListener('click',e=>{
  const m=map();if(!m||m.layoutMode!=='storyline')return;
  const help=e.target.closest?.('.template-help-icon');if(help){const n=m.nodes[help.dataset.nodeId||help.closest('.node')?.dataset.id];if(n){e.preventDefault();e.stopImmediatePropagation();showHelp(profileName(m),n);}return;}
  const nodeEl=e.target.closest?.('#nodes .node');if(!nodeEl)return;const n=m.nodes[nodeEl.dataset.id];if(!n?.targetMapId||!project()?.sessions?.[n.targetMapId])return;e.preventDefault();e.stopImmediatePropagation();app()?.setCurrentMap?.(n.targetMapId,true,false);setTimeout(schedule,0);
},true);

schedule();
})();