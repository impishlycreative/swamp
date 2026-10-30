(()=>{'use strict';

// Story-template overview renderer and guided beat navigation.
// Template overview maps stay clean: beat bubbles live on the story arc,
// their brainstormed children live in the linked beat maps, and a single
// click drills into the beat. Each beat also exposes contextual help.
const PROFILES={
  'Three-Act Structure':[2,4,6,4,7,5,6,10,2],
  'Save the Cat':[2,2,3,6,4,6,5,7,8,7,2,1,6,10,2],
  "Hero's Journey":[2,5,3,4,6,5,7,10,6,7,10,3]
};
const PROFILE_NAMES=Object.keys(PROFILES);
const beat=(purpose,context,percentage)=>({purpose,context,percentage});
const HELP={
  'Three-Act Structure':{
    'Act I — Setup':beat('Establish the protagonist, normal world, central desire, stakes, important relationships, and the pressures that will destabilize the status quo.','This is the opening movement. It contains the inciting incident and builds toward the first major commitment to the story conflict.','≈20–25% of the book'),
    'Inciting Incident':beat('Disrupt the protagonist’s normal situation with the problem, opportunity, threat, discovery, or invitation that makes the story impossible to ignore.','This happens inside Act I after enough setup exists for the disruption to matter. It creates the story problem but does not always force the protagonist to commit yet.','Around the 8–12% point; usually a concentrated event'),
    'First Plot Point':beat('Force a meaningful decision or event that commits the protagonist to the main conflict and changes the direction of the story.','This closes Act I and opens the larger confrontation. After this point, returning to the old normal should be difficult or impossible.','Around the 20–25% point'),
    'Act II — Confrontation':beat('Develop the main struggle through attempts, complications, discoveries, reversals, relationships, subplots, and escalating consequences.','This is the largest movement, stretching from the first plot point to the second plot point and usually containing the midpoint.','≈50–60% of the book'),
    'Midpoint':beat('Deliver a major reversal, revelation, victory, defeat, or shift in understanding that changes how the protagonist approaches the conflict.','The midpoint divides the long middle so the second half of Act II does not simply repeat the first. Stakes or urgency commonly intensify here.','Around the 50% point'),
    'Second Plot Point':beat('Provide the final major turn, discovery, loss, decision, or piece of information needed to drive the story into its ending.','This closes Act II. The protagonist should now be pushed toward the decisive confrontation rather than another cycle of ordinary complications.','Around the 75–80% point'),
    'Act III — Resolution':beat('Bring the major conflicts to their decisive tests, pay off important setups, resolve the central dramatic question, and show the immediate consequences.','This is the final movement after the second plot point. It contains the climax and then the story’s closing material.','≈20–25% of the book'),
    'Climax':beat('Stage the decisive confrontation or choice that answers the story’s central dramatic question.','This is the highest-pressure part of Act III. The protagonist’s accumulated choices, growth, skills, failures, and relationships should matter here.','Usually around the 90–98% point'),
    'Denouement':beat('Show the immediate aftermath: what changed, what was resolved, what remains, and what the new normal looks like.','This comes after the climax. Keep it long enough to provide emotional and practical closure without starting a new major story.','≈1–5% of the book')
  },
  'Save the Cat':{
    'Opening Image':beat('Give a compact first impression of the protagonist’s world, tone, emotional condition, or central imbalance.','This is a snapshot before the story’s transformation. It gains extra meaning when contrasted with the Final Image.','First ≈1% of the book'),
    'Theme Stated':beat('Introduce the story’s underlying truth, question, warning, or lesson, often before the protagonist fully understands it.','The theme can be spoken directly or implied through another character, situation, or contradiction. It should feel natural rather than like an author lecture.','Around the 5% point'),
    'Setup':beat('Establish the protagonist, supporting cast, normal routines, flaws, needs, goals, stakes, and the problems that are already waiting to worsen.','This section makes the later disruption meaningful and plants elements that can pay off in the middle and ending.','Roughly the first 10%'),
    'Catalyst':beat('Introduce the event that knocks the existing situation off balance and demands a response.','The catalyst creates the central disturbance. The protagonist may still hesitate, deny, investigate, or resist before fully entering the new situation.','Around the 10% point'),
    'Debate':beat('Let the protagonist react to the catalyst, weigh options, resist, prepare, fail to avoid the problem, or question whether to proceed.','This is the uncertainty between disruption and commitment. It should contain active consequences, not only internal hesitation.','≈10–20% of the book'),
    'Break into Two':beat('Move the protagonist decisively into the story’s main arena, plan, relationship, mission, or mode of action.','This marks the transition from setup into the central promise of the premise. The protagonist should enter by choice or meaningful commitment, even if pressured.','Around the 20% point'),
    'B Story':beat('Introduce or foreground a secondary relationship, subplot, or perspective that helps explore the theme and pressures the protagonist to change.','The B Story should connect emotionally or thematically to the main plot rather than feeling like unrelated filler.','Often begins around the 20–25% point'),
    'Fun and Games':beat('Explore the core promise of the premise: the situations, discoveries, relationships, victories, failures, and escalating complications readers came to experience.','This is not necessarily comic. It is where the story fully delivers on its central concept before the midpoint changes the pressure.','≈20–50% of the book; often about 25–30% total'),
    'Midpoint':beat('Create a major shift that raises the stakes, changes the goal, reveals new information, or produces a significant false victory or false defeat.','The midpoint re-energizes the story and changes the meaning of what came before. External stakes and internal stakes often become more tightly connected.','Around the 50% point'),
    'Bad Guys Close In':beat('Tighten pressure from antagonists, consequences, internal flaws, relationships, time, or circumstances as the protagonist’s earlier approach stops being enough.','The opposition does not have to be a literal villain. This section should progressively reduce easy options and expose weaknesses.','≈50–75% of the book'),
    'All Is Lost':beat('Deliver the low point where the protagonist’s current plan, belief, relationship, or apparent path to success collapses.','The loss should matter because of what has been built beforehand. It often contains a symbolic or literal sense that something must end before a new approach is possible.','Around the 75% point'),
    'Dark Night of the Soul':beat('Give the protagonist space to process the low point, confront what has failed, and approach the realization needed for the final movement.','This is reflection with purpose. It should create the emotional or intellectual bridge between defeat and the new solution.','Roughly 75–80% of the book'),
    'Break into Three':beat('Combine what the protagonist has learned from the main plot and the B Story into a new plan, choice, or understanding.','This launches the final movement. The protagonist should now approach the problem differently than they would have at the beginning.','Around the 80% point'),
    'Finale':beat('Execute the final plan, confront the strongest resistance, resolve the central conflict, and demonstrate the protagonist’s final choices or transformation.','The finale should pay off major setups and test whether the protagonist can act on what the story has taught them.','≈80–99% of the book'),
    'Final Image':beat('End on a concise image, condition, or moment that shows what has changed—or deliberately failed to change—since the Opening Image.','This is the closing snapshot. It can echo the opening directly or contrast with it in a way that makes the story’s transformation visible.','Final ≈1% of the book')
  },
  "Hero's Journey":{
    'Ordinary World':beat('Show the hero’s starting life, needs, relationships, limitations, and the conditions that make the coming journey meaningful.','This establishes the baseline before the adventure creates separation from normal life.','≈0–10% of the book'),
    'Call to Adventure':beat('Present the challenge, invitation, threat, discovery, mission, or disruption that points the hero toward a larger journey.','The call opens a door. The hero does not have to accept it immediately.','Around the 10% point'),
    'Refusal of the Call':beat('Show fear, reluctance, denial, competing duty, practical resistance, or another force that makes entering the journey difficult.','The refusal clarifies what the hero risks and why the journey is personally difficult. It can be brief or expressed through circumstances rather than a literal no.','≈10–15% of the book'),
    'Meeting the Mentor':beat('Give the hero guidance, training, tools, confidence, warning, perspective, or a resource that helps them move forward.','The mentor may be a person, group, text, memory, institution, or experience. The help should prepare rather than solve the journey for the hero.','≈15–20% of the book'),
    'Crossing the First Threshold':beat('Move the hero from the familiar world into the journey’s unfamiliar rules, dangers, commitments, or consequences.','This is the point where the adventure becomes active and the old normal is left behind in a meaningful way.','Around the 20–25% point'),
    'Tests, Allies, Enemies':beat('Let the hero learn the new world through trials, relationships, mistakes, victories, rivalries, discoveries, and escalating opposition.','This develops the adventure’s working rules and the social landscape while preparing the hero for a more dangerous central challenge.','≈25–45% of the book'),
    'Approach to the Inmost Cave':beat('Prepare for the central ordeal by narrowing options, gathering resources, entering dangerous territory, or confronting fear and uncertainty.','The “cave” may be literal or symbolic. This section builds tension and focuses the hero on the journey’s deepest immediate test.','≈45–50% of the book'),
    'Ordeal':beat('Put the hero through a central crisis, confrontation, sacrifice, symbolic death, major failure, or transformative test.','The ordeal changes the hero’s relationship to the journey. It often sits near the structural center and should carry significant emotional or practical cost.','≈50–60% of the book'),
    'Reward':beat('Let the hero gain insight, reconciliation, an object, victory, information, power, relationship, or other benefit after surviving the ordeal.','The reward is not necessarily the ending. It gives the hero something they can carry into the remaining conflict.','≈60–70% of the book'),
    'The Road Back':beat('Turn the hero toward return, consequence, pursuit, unfinished business, or the final effort needed to complete the journey.','The story begins moving out of the central adventure while proving that the conflict is not fully settled yet.','≈70–80% of the book'),
    'Resurrection':beat('Test the hero one last time at the highest level so the final confrontation demonstrates what has changed—or what has not.','This is the culminating transformation test. The hero often must apply lessons from the whole journey rather than merely repeat an earlier tactic.','≈80–95% of the book'),
    'Return with the Elixir':beat('Bring the hero into a new normal carrying knowledge, change, healing, power, warning, relationship, or another result of the journey.','The “elixir” is what makes the journey matter beyond simply surviving it. It provides closure and shows the effect of the transformation.','≈95–100% of the book')
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
function profileName(m){
  const title=rootText(m);
  return PROFILE_NAMES.find(name=>title===`${name} — Overview`||title.startsWith(`${name} — Overview`))||null;
}
function rootChildren(m){return Object.values(m?.nodes||{}).filter(n=>n.parentId===m.rootId);}
function storyBeats(m){return Object.values(m?.nodes||{}).filter(n=>Number.isFinite(n.storyBeatIndex)).sort((a,b)=>a.storyBeatIndex-b.storyBeatIndex);}
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
    kids.forEach((n,i)=>{n.storyBeatIndex=i;n.storyLevel=levels[i]??5.5;});
    beats=storyBeats(m);changed=true;
  }
  return{story:true,changed,beats};
}
function desiredPoint(beat,index,count){
  const step=isTouch()?210:235,amplitude=isTouch()?43:50;
  const level=Math.max(0,Math.min(10,Number.isFinite(beat.storyLevel)?beat.storyLevel:5.5));
  return{x:(index-(count-1)/2)*step,y:(5.5-level)*amplitude};
}
function pinBeats(beats){
  let changed=false;
  beats.forEach((beat,i)=>{const p=desiredPoint(beat,i,beats.length);if(!Number.isFinite(beat.x)||Math.abs(beat.x-p.x)>.5){beat.x=p.x;changed=true;}if(!Number.isFinite(beat.y)||Math.abs(beat.y-p.y)>.5){beat.y=p.y;changed=true;}});
  return changed;
}
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
  document.getElementById('storyArcLayer')?.remove();
  const edges=document.getElementById('edges'),labels=document.getElementById('labels');if(edges)edges.style.display='';if(labels)labels.style.display='';document.querySelectorAll('#nodes .node').forEach(el=>el.style.display='');
}
function storyControls(active){
  ['addBtn','rapidfireBtn','focusBtn','addChildBtn','contextAdd','contextRapid','contextFocus'].forEach(id=>{const el=document.getElementById(id);if(el)el.disabled=!!active;});
}
function showToast(message){
  const el=document.getElementById('toast');if(!el)return;el.textContent=message;el.classList.add('show');clearTimeout(el._storyArcTimer);el._storyArcTimer=setTimeout(()=>el.classList.remove('show'),1500);
}
function descendantsOf(m,id,out=[]){
  Object.values(m.nodes||{}).filter(n=>n.parentId===id).forEach(n=>{out.push(n);descendantsOf(m,n.id,out);});return out;
}
function cloneSubtreeInto(source,top,target){
  const list=[top,...descendantsOf(source,top.id)],idMap=new Map();
  for(const n of list){let id=n.id;while(target.nodes[id]||idMap.has(id))id=`i_${Math.random().toString(36).slice(2,10)}${Date.now().toString(36).slice(-4)}`;idMap.set(n.id,id);}
  for(const n of list){const copy={...n,id:idMap.get(n.id),parentId:n.id===top.id?target.rootId:idMap.get(n.parentId),x:null,y:null,targetMapId:n.targetMapId||null};target.nodes[copy.id]=copy;}
  list.forEach(n=>delete source.nodes[n.id]);
}
function migrateLegacyOverviewChildren(m,beats){
  if(migrationDoneFor.has(m.id))return false;let changed=false;
  for(const b of beats){
    const target=project()?.sessions?.[b.targetMapId];if(!target?.nodes?.[target.rootId])continue;
    const direct=Object.values(m.nodes||{}).filter(n=>n.parentId===b.id);
    direct.forEach(top=>{cloneSubtreeInto(m,top,target);changed=true;});
  }
  migrationDoneFor.add(m.id);return changed;
}
function ideaCountFor(beat){const target=project()?.sessions?.[beat.targetMapId];if(!target?.nodes)return 0;return Math.max(0,Object.keys(target.nodes).length-1);}
function helpFor(templateName,title){return HELP[templateName]?.[title]||beat('Use this beat to develop this part of the story.',`This is a ${templateName||'story structure'} beat.`,'Flexible — use the story’s needs.');}
function ensureUi(){
  if(!document.getElementById('templateGuideStyles')){
    const style=document.createElement('style');style.id='templateGuideStyles';style.textContent=`
      .template-help-icon{cursor:help}.template-help-icon circle{fill:rgba(255,255,255,.97);stroke:rgba(49,95,77,.55);stroke-width:1.7}.template-help-icon text{font-size:12px;font-weight:900;fill:#315f4d;pointer-events:none;text-anchor:middle;dominant-baseline:middle}.template-child-indicator{font-size:10px;font-weight:900;fill:#315f4d;letter-spacing:.04em;pointer-events:none;text-anchor:middle}.template-focus-back{position:absolute;left:18px;top:18px;z-index:45;box-shadow:0 8px 24px rgba(41,36,30,.16)}.template-help-modal{z-index:140}.template-help-card{width:min(520px,100%);padding:22px}.template-help-kicker{font-size:.76rem;font-weight:850;text-transform:uppercase;letter-spacing:.08em;color:#557766;margin-bottom:5px}.template-help-grid{display:grid;gap:10px;margin-top:14px}.template-help-block{background:var(--soft,#f4f1ea);border:1px solid var(--line,#ddd3c6);border-radius:14px;padding:12px 13px}.template-help-block strong{display:block;font-size:.74rem;text-transform:uppercase;letter-spacing:.06em;color:var(--muted,#625d55);margin-bottom:4px}.template-help-block p{margin:0;color:var(--ink,#25231f);line-height:1.45}.template-help-percent{font-size:1.02rem;font-weight:850;color:#315f4d}@media(max-width:850px),(hover:none) and (pointer:coarse){.template-focus-back{left:10px;top:10px;max-width:62vw;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.template-help-modal{place-items:end center;padding:8px}.template-help-card{width:100%;border-radius:24px;margin-bottom:env(safe-area-inset-bottom)}}`;
    document.head.appendChild(style);
  }
  const workspace=document.getElementById('workspace');
  if(workspace&&!document.getElementById('templateBackBtn')){const b=document.createElement('button');b.id='templateBackBtn';b.className='btn template-focus-back hidden';b.type='button';b.textContent='← Template overview';workspace.appendChild(b);b.addEventListener('click',()=>{const ctx=findOverviewForMap(map()?.id);if(ctx)app()?.setCurrentMap?.(ctx.overview.id,true);});}
  if(!document.getElementById('templateHelpDialog')){
    const modal=document.createElement('div');modal.id='templateHelpDialog';modal.className='modal template-help-modal hidden';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.innerHTML=`<div class="card template-help-card"><div id="templateHelpKicker" class="template-help-kicker"></div><h2 id="templateHelpTitle">Story beat</h2><div class="template-help-grid"><div class="template-help-block"><strong>What this node is for</strong><p id="templateHelpPurpose"></p></div><div class="template-help-block"><strong>Context</strong><p id="templateHelpContext"></p></div><div class="template-help-block"><strong>Typical book placement / share</strong><p id="templateHelpPercent" class="template-help-percent"></p></div></div><button id="templateHelpClose" class="btn" style="width:100%;margin-top:12px" type="button">Close</button></div>`;document.body.appendChild(modal);
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
function updateBackButton(m){
  ensureUi();const b=document.getElementById('templateBackBtn'),ctx=findOverviewForMap(m?.id);if(!b)return;b.classList.toggle('hidden',!ctx);if(ctx)b.textContent=`← ${ctx.name||'Template'} overview`;
}
function updateVersionUi(){
  document.title=document.title.replace(/MindMap\s+[^—]+—/,'MindMap 2.5.0 —');const small=document.querySelector('.brand small');if(small)small.textContent='Swamp · v2.5.0';if(app())app().version='2.5.0';
}
function sync(){
  if(syncing)return;syncing=true;
  try{
    ensureUi();updateVersionUi();const m=map();updateBackButton(m);
    if(!m){clearArc();storyControls(false);return;}
    const meta=ensureMetadata(m);
    if(!meta.story){clearArc();storyControls(false);return;}
    const migrated=migrateLegacyOverviewChildren(m,meta.beats),moved=pinBeats(meta.beats);
    if((meta.changed||moved||migrated)&&app()?.save){app().save();app().setCurrentMap?.(m.id,false);return;}
    drawArc(m,meta.beats);decorateBeats(m,meta.beats);storyControls(true);
  }finally{syncing=false;}
}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;sync();});}

const nodesHost=document.getElementById('nodes');if(nodesHost)new MutationObserver(schedule).observe(nodesHost,{childList:true});
document.addEventListener('change',e=>{if(e.target?.id==='mapSelect')schedule();});
document.addEventListener('click',e=>{if(e.target?.closest?.('#templateOptions button,#mobileTemplates,#templateBtn'))setTimeout(schedule,0);});
window.addEventListener('resize',schedule);

// A template overview is navigation, not a normal brainstorming map. Keep the
// structural controls out of it and route a single click straight into a beat.
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
  const nodeEl=e.target.closest?.('#nodes .node');if(!nodeEl)return;const n=m.nodes[nodeEl.dataset.id];if(!n?.targetMapId||!project()?.sessions?.[n.targetMapId])return;e.preventDefault();e.stopImmediatePropagation();app()?.setCurrentMap?.(n.targetMapId,true);setTimeout(schedule,0);
},true);

schedule();
})();
