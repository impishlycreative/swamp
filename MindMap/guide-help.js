(()=>{'use strict';
if(window.__SWAMP_GUIDE_HELP__)return;
window.__SWAMP_GUIDE_HELP__=true;

const qs=(s,r=document)=>r.querySelector(s);
const qsa=(s,r=document)=>[...r.querySelectorAll(s)];
const app=()=>window.MindMapApp;
const mapNow=()=>app()?.getCurrentMap?.()||null;
const isMobile=()=>matchMedia('(max-width:850px),(hover:none) and (pointer:coarse)').matches||(navigator.maxTouchPoints>0&&Math.min(screen.width,screen.height)<900);
let activeTour=null;
let tourIndex=0;
let branchObserver=null;
let resizeRaf=0;

const HELP_TOPICS={
  map:{title:'The map',summary:'This is where you build the story.',when:'Use it to group ideas and see how they fit together.',how:['Click an idea to select it.','Use the + on the idea to add something under it.','Drag ideas to move them.','Use the minimap when part of the map is off-screen.']},
  edit:{title:'Edit',summary:'Change the idea without opening extra panels every time.',when:'Use it when you want to change the title, notes or colour.',how:['Select an idea.','Click Edit, or click the idea text.','Make your changes and close the editor.']},
  rapid:{title:'Rapidfire',summary:'Add ideas quickly without stopping to polish them.',when:'Use it when you want lots of possibilities fast.',how:['Select the idea you want to build from.','Click Rapidfire.','Type one short idea and press ✓.','Keep going until you click Exit.']},
  lens:{title:'Lens',summary:'Show what matters to one idea.',when:'Use it when the map feels busy.',how:['Select an idea.','Click Lens.','Connected ideas stay clear. Other ideas fade.','Clear the Lens when you are done.']},
  links:{title:'Links',summary:'Connect two ideas without moving either one.',when:'Use it for things like clue → reveal, setup → payoff, character → scene or scene → location.',how:['Select the first idea.','Click Link.','Click the idea you want to connect to.']},
  types:{title:'Idea types',summary:'Tell the app what an idea is.',when:'Use a type when you want tools like Lens or Rapidfire to understand the idea better.',how:['Click the type badge on desktop, or use More on mobile.','Pick Scene, Character, Clue, Chapter and so on.','Leave ordinary ideas as Idea.']},
  threads:{title:'Story threads',summary:'Show one story line across the whole map.',when:'Use it for the main plot, a mystery, a romance, a character arc or another subplot.',how:['Add the same thread to the ideas that belong together.','Turn the thread on.','The map draws a path through those ideas.']},
  health:{title:'Story Health',summary:'Find story pieces that look unfinished.',when:'Use it to spot missing links or work you marked for later.',how:['Open More and choose Story Health.','Check the list.','Click a problem to jump to it.']},
  templates:{title:'Story templates',summary:'Start with a story shape such as Save the Cat or Three-Act Structure.',when:'Use one when you want help deciding where major story moments go.',how:['Open Story templates.','Pick a template.','Click a beat to work with it.','Use Ideas when you want to brainstorm that beat.']},
  minimap:{title:'Minimap',summary:'See where you are on a big map.',when:'Use it instead of zooming out until everything is tiny.',how:['The box shows the part of the map you can see.','Click or drag in the minimap to move around.','Use Fit only when you want the whole map on screen.']},
  navigator:{title:"Writer’s Navigator",summary:'Find an idea quickly.',when:'Use it when the map is large and you know what you are looking for.',how:['Open Navigator.','Search or browse the list.','Click an idea to jump to it on the map.']},
  focus:{title:'Focus and collapse',summary:'Hide things you do not need right now.',when:'Use them when the map gets crowded.',how:['Focus keeps one branch in view.','Collapse hides the children under an idea.','Turn Focus off to see everything again.']},
  branch:{title:'More',summary:'Less-used tools for the selected idea.',when:'Use it when you need something beyond Edit, Rapidfire, Lens or Link.',how:['Collapse or expand the branch.','Put the idea back in its automatic position.','Explore alternative makes a copy of the branch.','Needs Work marks something to come back to later.']},
  storywalk:{title:'Story Walk',summary:'Move through the map one idea at a time.',when:'Use it when you want to review the story in order without looking at the whole map.',how:['Start Story Walk.','Move forward, back or to related ideas.','Click Show on map when you want to return to the canvas.']},
  save:{title:'Save and export',summary:'Save a backup or take the map somewhere else.',when:'Use it before moving devices, sharing or making a backup.',how:['Use Save / Export for JSON backups.','Use Word for an outline.','Use PDF for a picture of the map.','Use Import to bring a saved map back in.']},
  mobile:{title:'Using it on a phone',summary:'The phone view keeps the common actions easy to reach.',when:'Use it for quick ideas, navigation and focused work.',how:['Tap an idea to select it.','Use the action bar for common tools.','Use More for the less-used tools.','Drag or pinch the map, and use the minimap to move around.']},
  shortcuts:{title:'Keyboard shortcuts',summary:'Faster controls when you are on a keyboard.',when:'Use them if you prefer keys over clicking.',how:['Enter — add an idea.','Ctrl/⌘ K — search.','Ctrl/⌘ Z — undo.','F — focus.','C — collapse.','Home — fit map.','Z — Zen.','? — Help.']}
};

const CONTEXTS={
  basics:{title:'Learn the map',icon:'◎',summary:'The few things you need to get around.',steps:[
    {title:'Start here',body:'This canvas is your story. Ideas under other ideas belong to that part of the story.',target:()=>qs('#workspace')},
    {title:'Work from an idea',body:'Click an idea. The small bar gives you the tools you are most likely to use.',target:()=>selectedOrFirstNode()},
    {title:'Move around',body:'Keep the map big enough to read. Use the minimap to get to the parts that are off-screen.',target:()=>qs('.mindmap-minimap')||qs('.mini')}
  ]},
  story:{title:'Build a story',icon:'▦',summary:'Start with a structure and fill it with ideas.',steps:[
    {title:'Pick a template',body:'Choose a story shape such as Save the Cat, Three-Act Structure or Hero’s Journey.',target:()=>visibleOne(['#desktopToolbar [data-toolbar-target="templateBtn"]','#utilitySheet [data-toolbar-target="templateBtn"]'])},
    {title:'Work one beat at a time',body:'Each beat is one part of the story. Click it to see what belongs there.',target:()=>storyBeatOrNode()},
    {title:'Brainstorm the beat',body:'Use Ideas for a deeper brainstorm, or Rapidfire when you just want quick possibilities.',target:()=>visibleOne(['#writerContext [data-writer-action="branch"]','#writerContext [data-writer-action="rapid"]'])}
  ]},
  character:{title:'Develop a character',icon:'P',summary:'Build the person and see where they touch the story.',steps:[
    {title:'Mark it as a character',body:'Set the idea to Character so the app knows you are working on a person.',before:()=>selectTypeNode('character'),target:()=>selectedOrFirstNode()},
    {title:'Brainstorm quickly',body:'Rapidfire gives you simple prompts like Want, Fear, Secret and Choice.',target:()=>qs('#writerContext [data-writer-action="rapid"]')},
    {title:'See where they connect',body:'Lens shows the parts of the story connected to this character. Link lets you add more connections.',target:()=>qs('#writerContext [data-writer-action="lens"]')}
  ]},
  scene:{title:'Develop a scene',icon:'S',summary:'Work out what happens and what changes.',steps:[
    {title:'Mark it as a scene',body:'Set the idea to Scene so the app can give you scene-specific help.',before:()=>selectTypeNode('scene'),target:()=>selectedOrFirstNode()},
    {title:'Find the turn',body:'Rapidfire can push you with simple prompts like Obstacle, Reversal and Consequence.',target:()=>qs('#writerContext [data-writer-action="rapid"]')},
    {title:'Connect the scene',body:'Use Link to connect the scene to its characters, location or other important ideas.',target:()=>qs('#writerContext [data-writer-action="link"]')}
  ]},
  mystery:{title:'Track clues and payoffs',icon:'?',summary:'Make sure clues and setups lead somewhere.',steps:[
    {title:'Mark the clue or setup',body:'Use Clue or Setup so the app knows this idea should lead to something later.',before:()=>selectTypeNode('clue','setup'),target:()=>selectedOrFirstNode()},
    {title:'Connect the answer',body:'Click Link, then click the Reveal or Payoff. The connection stays visible on the map.',target:()=>qs('#writerContext [data-writer-action="link"]')},
    {title:'Check for loose ends',body:'Story Health can show clues or setups that do not have an ending yet.',target:()=>visibleOne(['#writerContext [data-writer-action="branch"]','#writerHealthPanel'])}
  ]},
  subplot:{title:'Develop a subplot',icon:'≋',summary:'Follow one smaller story through the bigger one.',steps:[
    {title:'Mark the subplot',body:'Set this idea to Subplot so you have a clear home for that smaller story.',before:()=>selectTypeNode('subplot'),target:()=>selectedOrFirstNode()},
    {title:'Look at just this part',body:'Lens fades the rest of the map so this subplot is easier to follow.',target:()=>qs('#writerContext [data-writer-action="lens"]')},
    {title:'Follow it across the story',body:'Use a Story Thread when parts of the subplot appear in different chapters or branches.',target:()=>threadTarget()}
  ]},
  template:{title:'Use a story template',icon:'B',summary:'Use the beats without shrinking the whole story onto one screen.',steps:[
    {title:'Pick a beat',body:'Each bubble is one job the story needs to do. Click the beat you want to work on.',before:()=>selectBeat(),target:()=>storyBeatOrNode()},
    {title:'Need a reminder?',body:'The help icon tells you what the beat is for, roughly where it happens and gives short examples.',target:()=>qs('.template-help-icon')||storyBeatOrNode()},
    {title:'Need more room?',body:'Click Ideas to open the beat’s own brainstorming map. Use the minimap to move along the main story map.',target:()=>qs('#writerContext [data-writer-action="branch"]')||qs('.mindmap-minimap')}
  ]}
};

function inferType(node){
  if(!node)return'general';
  if(node.writer?.type)return node.writer.type;
  if(Number.isFinite(node.storyBeatIndex)||node.targetMapId)return'beat';
  const t=String(node.text||'').toLowerCase();
  if(/^chapter\b/.test(t))return'chapter';
  if(/\b(clue|evidence)\b/.test(t))return'clue';
  if(/\breveal/.test(t))return'reveal';
  return'general';
}
function selectedId(){return qs('#nodes .node.selected')?.dataset.id||null;}
function selectedNode(){const m=mapNow(),id=selectedId();return id&&m?.nodes?.[id]?m.nodes[id]:null;}
function contextKeyForNode(node){
  const type=inferType(node);
  if(type==='character')return'character';
  if(type==='scene')return'scene';
  if(type==='clue'||type==='reveal'||type==='setup'||type==='payoff')return'mystery';
  if(type==='subplot')return'subplot';
  if(type==='beat'||mapNow()?.layoutMode==='storyline')return'template';
  return'basics';
}
function selectedOrFirstNode(){return qs('#nodes .node.selected')||qs('#nodes .node');}
function storyBeatOrNode(){return qs('#nodes .node[data-story-beat-index]')||qsa('#nodes .node').find(el=>{const n=mapNow()?.nodes?.[el.dataset.id];return Number.isFinite(n?.storyBeatIndex)||!!n?.targetMapId;})||selectedOrFirstNode();}
function visible(el){if(!el)return false;const st=getComputedStyle(el),r=el.getBoundingClientRect();return st.display!=='none'&&st.visibility!=='hidden'&&r.width>0&&r.height>0;}
function visibleOne(selectors){for(const s of selectors){const el=qs(s);if(visible(el))return el;}return null;}
function threadTarget(){return visibleOne(['#writerLensStrip','.writer-thread-badge','#writerContext [data-writer-action="branch"]']);}
function selectNodeEl(el){if(!el)return false;el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));requestAnimationFrame(()=>qs('#centerBtn')?.click());return true;}
function selectTypeNode(...types){
  const m=mapNow();if(!m)return;
  const found=Object.values(m.nodes||{}).find(n=>types.includes(inferType(n)));
  if(found){const el=qs(`#nodes .node[data-id="${CSS.escape(found.id)}"]`);selectNodeEl(el);}
  else if(!selectedId())selectNodeEl(qs('#nodes .node'));
}
function selectBeat(){const el=storyBeatOrNode();if(el)selectNodeEl(el);}

function injectStyles(){
  if(qs('#guideHelpStyles'))return;
  const style=document.createElement('style');style.id='guideHelpStyles';style.textContent=`
    .guide-help-overlay{position:fixed;inset:0;z-index:190;background:rgba(36,32,27,.34);display:grid;place-items:center;padding:12px}.guide-help-overlay.hidden{display:none!important}
    .guide-help-card{width:min(720px,100%);max-height:min(86vh,760px);overflow:auto;background:#fcfaf5;border:1px solid rgba(92,78,61,.18);border-radius:22px;box-shadow:0 26px 80px rgba(38,31,24,.28);padding:18px;color:var(--ink,#25231f)}
    .guide-help-head{display:flex;gap:12px;align-items:flex-start}.guide-help-head>div{min-width:0;flex:1}.guide-help-head h2{margin:0 0 4px;font-size:1.25rem}.guide-help-head p{margin:0;color:var(--muted,#6e675e);line-height:1.4}.guide-help-close{width:42px;height:42px;border:1px solid var(--line,#ddd3c6);border-radius:13px;background:#fff;font-size:1.2rem;flex:none}
    .guide-current{display:flex;align-items:center;gap:10px;margin:14px 0;padding:11px 12px;background:#eef4f0;border-radius:14px}.guide-current strong{display:block}.guide-current span{display:block;color:var(--muted);font-size:.76rem;margin-top:2px}.guide-current button{margin-left:auto;border:0;border-radius:11px;background:#315f4d;color:#fff;min-height:40px;padding:8px 12px;font-weight:850}
    .guide-section-title{margin:18px 0 8px;font-size:.76rem;color:var(--muted);font-weight:900}.guide-context-grid,.guide-topic-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.guide-context,.guide-topic{border:1px solid rgba(92,78,61,.17);border-radius:14px;background:#fff;padding:11px 12px;text-align:left;color:var(--ink)}.guide-context{display:grid;grid-template-columns:34px 1fr;gap:9px}.guide-context-icon{width:34px;height:34px;border-radius:10px;background:#e7efe9;color:#315f4d;display:grid;place-items:center;font-weight:950}.guide-context strong,.guide-topic strong{display:block}.guide-context small,.guide-topic span{display:block;color:var(--muted);font-size:.73rem;line-height:1.35;margin-top:3px}
    .guide-search{display:flex;align-items:center;gap:8px;border:1px solid var(--line);border-radius:13px;background:#fff;padding:0 10px;margin-bottom:8px}.guide-search input{border:0;outline:0;background:transparent;min-width:0;flex:1;font:inherit;font-size:16px;padding:11px 0}
    .guide-topic-view h3{margin:14px 0 4px}.guide-topic-view>p{margin:0 0 12px;color:var(--muted);line-height:1.45}.guide-topic-block{background:#f3f0e9;border-radius:13px;padding:11px 12px;margin:8px 0}.guide-topic-block strong{display:block;margin-bottom:4px}.guide-topic-block ul{margin:0;padding-left:20px}.guide-topic-block li{margin:4px 0;line-height:1.4}.guide-back{border:0;background:transparent;color:#315f4d;font-weight:850;padding:6px 0;margin-top:8px}
    .guide-tour-overlay{position:fixed;inset:0;z-index:198;pointer-events:none}.guide-tour-overlay.hidden{display:none!important}.guide-spotlight{position:fixed;border:3px solid #f7f4ec;border-radius:16px;box-shadow:0 0 0 9999px rgba(31,28,24,.62),0 0 0 6px rgba(49,95,77,.78);pointer-events:none}.guide-spotlight.no-target{display:none}.guide-tour-card{position:fixed;z-index:199;width:min(340px,calc(100vw - 24px));background:#fcfaf5;color:var(--ink);border:1px solid rgba(92,78,61,.2);border-radius:18px;padding:14px;box-shadow:0 22px 70px rgba(29,25,21,.3);pointer-events:auto}.guide-tour-kicker{font-size:.68rem;color:#557766;font-weight:900}.guide-tour-card h3{margin:5px 0}.guide-tour-card p{margin:0;color:var(--muted);line-height:1.45}.guide-tour-actions{display:flex;gap:7px;align-items:center;margin-top:13px}.guide-tour-actions .spacer{flex:1}.guide-tour-actions button{min-height:40px;border:1px solid var(--line);border-radius:11px;background:#fff;padding:7px 11px;font-weight:850}.guide-tour-actions .primary{background:#315f4d;border-color:#315f4d;color:#fff}.guide-tour-progress{font-size:.7rem;color:var(--muted);font-weight:800}.guide-tour-exit{border:0!important;background:transparent!important;color:var(--muted)!important}
    @media(max-width:620px),(hover:none) and (pointer:coarse){.guide-help-overlay{place-items:end center;padding:6px}.guide-help-card{border-radius:22px 22px 16px 16px;max-height:88vh;padding:15px}.guide-context-grid,.guide-topic-list{grid-template-columns:1fr}.guide-current{align-items:flex-start;flex-wrap:wrap}.guide-current button{margin-left:0;width:100%}.guide-tour-card{left:8px!important;right:8px!important;bottom:max(8px,env(safe-area-inset-bottom))!important;top:auto!important;width:auto}}
  `;document.head.appendChild(style);
}

function buildUi(){
  if(!qs('#guideHelpOverlay')){
    const wrap=document.createElement('div');wrap.id='guideHelpOverlay';wrap.className='guide-help-overlay hidden';wrap.innerHTML=`<section class="guide-help-card" role="dialog" aria-modal="true"><header class="guide-help-head"><div><h2>Help & tours</h2><p>Pick what you want help with. You do not need to learn everything at once.</p></div><button id="guideHelpClose" class="guide-help-close" type="button" aria-label="Close help">×</button></header><div id="guideHelpBody"></div></section>`;
    wrap.addEventListener('pointerdown',e=>{if(e.target===wrap)closeHelp();});document.body.appendChild(wrap);qs('#guideHelpClose').addEventListener('click',closeHelp);
  }
  if(!qs('#guideTourOverlay')){
    const tour=document.createElement('div');tour.id='guideTourOverlay';tour.className='guide-tour-overlay hidden';tour.innerHTML=`<div id="guideSpotlight" class="guide-spotlight no-target"></div><section id="guideTourCard" class="guide-tour-card" role="dialog" aria-modal="true"><div id="guideTourKicker" class="guide-tour-kicker"></div><h3 id="guideTourTitle"></h3><p id="guideTourBody"></p><div class="guide-tour-actions"><button id="guideTourExit" class="guide-tour-exit" type="button">Exit</button><span id="guideTourProgress" class="guide-tour-progress"></span><span class="spacer"></span><button id="guideTourBack" type="button">Back</button><button id="guideTourNext" class="primary" type="button">Next</button></div></section>`;document.body.appendChild(tour);
    qs('#guideTourExit').addEventListener('click',endTour);qs('#guideTourBack').addEventListener('click',()=>showTourStep(tourIndex-1));qs('#guideTourNext').addEventListener('click',()=>{if(!activeTour)return;tourIndex>=activeTour.steps.length-1?endTour():showTourStep(tourIndex+1);});
  }
}

function renderHelp(homeContext=null){
  buildUi();const body=qs('#guideHelpBody'),node=selectedNode(),key=homeContext||contextKeyForNode(node),ctx=CONTEXTS[key]||CONTEXTS.basics;
  const current=node?`${inferType(node)==='general'?'Idea':inferType(node)}: ${String(node.text||'Untitled').slice(0,60)}`:(mapNow()?.layoutMode==='storyline'?'Story template':'No idea selected');
  body.innerHTML=`<div class="guide-current"><div><strong>Right now</strong><span>${escapeHtml(current)}</span></div><button type="button" data-current-tour="${key}">Show me</button></div><div class="guide-section-title">What do you want to do?</div><div class="guide-context-grid" id="guideContextGrid"></div><div class="guide-section-title">Look up a feature</div><label class="guide-search"><span>⌕</span><input id="guideHelpSearch" type="search" placeholder="Search help…"></label><div class="guide-topic-list" id="guideTopicList"></div>`;
  const grid=qs('#guideContextGrid');Object.entries(CONTEXTS).forEach(([id,c])=>{const b=document.createElement('button');b.type='button';b.className='guide-context';b.innerHTML=`<span class="guide-context-icon">${escapeHtml(c.icon)}</span><span><strong>${escapeHtml(c.title)}</strong><small>${escapeHtml(c.summary)}</small></span>`;b.addEventListener('click',()=>startTour(id));grid.appendChild(b);});
  qs('[data-current-tour]')?.addEventListener('click',e=>startTour(e.currentTarget.dataset.currentTour));
  const input=qs('#guideHelpSearch');input.addEventListener('input',()=>renderTopicList(input.value));renderTopicList('');
}
function renderTopicList(filter=''){
  const host=qs('#guideTopicList');if(!host)return;host.innerHTML='';const q=filter.trim().toLowerCase();Object.entries(HELP_TOPICS).forEach(([id,t])=>{const hay=`${t.title} ${t.summary} ${t.when} ${t.how.join(' ')}`.toLowerCase();if(q&&!hay.includes(q))return;const b=document.createElement('button');b.type='button';b.className='guide-topic';b.innerHTML=`<strong>${escapeHtml(t.title)}</strong><span>${escapeHtml(t.summary)}</span>`;b.addEventListener('click',()=>showTopic(id));host.appendChild(b);});if(!host.children.length)host.innerHTML='<div style="padding:12px;color:var(--muted)">Nothing found.</div>';
}
function showTopic(id){
  const t=HELP_TOPICS[id],body=qs('#guideHelpBody');if(!t||!body)return;body.innerHTML=`<button class="guide-back" type="button">← Back</button><div class="guide-topic-view"><h3>${escapeHtml(t.title)}</h3><p>${escapeHtml(t.summary)}</p><div class="guide-topic-block"><strong>Good for</strong>${escapeHtml(t.when)}</div><div class="guide-topic-block"><strong>Do this</strong><ul>${t.how.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul></div></div>`;qs('.guide-back',body).addEventListener('click',()=>renderHelp());
}
function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
function openHelp(context=null){endTour();buildUi();renderHelp(context);qs('#guideHelpOverlay').classList.remove('hidden');requestAnimationFrame(()=>qs('#guideHelpSearch')?.focus({preventScroll:true}));}
function closeHelp(){qs('#guideHelpOverlay')?.classList.add('hidden');}
function startTour(key){closeHelp();activeTour=CONTEXTS[key]||CONTEXTS.basics;tourIndex=0;qs('#guideTourOverlay').classList.remove('hidden');showTourStep(0);}
function endTour(){activeTour=null;tourIndex=0;qs('#guideTourOverlay')?.classList.add('hidden');qs('#guideSpotlight')?.classList.add('no-target');}
function showTourStep(index){
  if(!activeTour)return;index=Math.max(0,Math.min(activeTour.steps.length-1,index));tourIndex=index;const step=activeTour.steps[index];try{step.before?.();}catch{}
  setTimeout(()=>{const target=resolveTarget(step);positionSpotlight(target);qs('#guideTourKicker').textContent=activeTour.title;qs('#guideTourTitle').textContent=step.title;qs('#guideTourBody').textContent=step.body;qs('#guideTourProgress').textContent=`${index+1} / ${activeTour.steps.length}`;qs('#guideTourBack').disabled=index===0;qs('#guideTourNext').textContent=index===activeTour.steps.length-1?'Done':'Next';positionTourCard(target);},40);
}
function resolveTarget(step){let el=null;try{el=step.target?.()||null;}catch{}return el&&visible(el)?el:null;}
function positionSpotlight(target){
  const spot=qs('#guideSpotlight');if(!spot)return;if(!target){spot.classList.add('no-target');return;}target.scrollIntoView?.({block:'nearest',inline:'nearest'});const r=target.getBoundingClientRect(),pad=7;spot.classList.remove('no-target');spot.style.left=`${Math.max(4,r.left-pad)}px`;spot.style.top=`${Math.max(4,r.top-pad)}px`;spot.style.width=`${Math.min(innerWidth-8,r.width+pad*2)}px`;spot.style.height=`${Math.min(innerHeight-8,r.height+pad*2)}px`;
}
function positionTourCard(target){
  const card=qs('#guideTourCard');if(!card)return;card.style.left='';card.style.top='';card.style.right='';card.style.bottom='';if(isMobile()||!target)return;const r=target.getBoundingClientRect(),w=card.offsetWidth||340,h=card.offsetHeight||180,gap=18;let left=r.right+gap,top=Math.max(12,Math.min(innerHeight-h-12,r.top));if(left+w>innerWidth-12)left=Math.max(12,r.left-w-gap);if(left<12){left=12;top=Math.min(innerHeight-h-12,r.bottom+gap);}card.style.left=`${left}px`;card.style.top=`${top}px`;
}

function decorateEntrypoints(){qsa('[data-toolbar-target="shortcutsBtn"]').forEach(btn=>{btn.title='Help & tours';btn.setAttribute('aria-label','Help & tours');if(btn.closest('#utilitySheet'))btn.textContent='? Help & tours';});}
function interceptHelpEntrypoints(){
  document.addEventListener('click',e=>{const btn=e.target.closest?.('[data-toolbar-target="shortcutsBtn"],#shortcutsBtn');if(!btn)return;e.preventDefault();e.stopImmediatePropagation();openHelp();},true);
  document.addEventListener('keydown',e=>{if(e.key!=='?'||e.ctrlKey||e.metaKey||e.altKey)return;const tag=document.activeElement?.tagName;if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT'||document.activeElement?.isContentEditable)return;e.preventDefault();e.stopImmediatePropagation();openHelp();},true);
}
function injectContextHelp(){
  const sheet=qs('#writerBranchSheet');if(!sheet||sheet.classList.contains('hidden'))return;const grid=qs('.writer-option-grid',sheet);if(!grid||qs('[data-guide-context-help]',grid))return;
  const b=document.createElement('button');b.type='button';b.className='writer-option';b.dataset.guideContextHelp='1';b.innerHTML='<strong>Help for this idea</strong><small>Show what these tools do</small>';b.addEventListener('click',()=>{sheet.classList.add('hidden');openHelp(contextKeyForNode(selectedNode()));});grid.prepend(b);
}
function watchBranchSheet(){const sheet=qs('#writerBranchSheet');if(!sheet||branchObserver)return;branchObserver=new MutationObserver(injectContextHelp);branchObserver.observe(sheet,{attributes:true,attributeFilter:['class'],childList:true,subtree:true});}
function onResize(){cancelAnimationFrame(resizeRaf);resizeRaf=requestAnimationFrame(()=>{if(activeTour)showTourStep(tourIndex);});}
function boot(){injectStyles();buildUi();decorateEntrypoints();interceptHelpEntrypoints();watchBranchSheet();window.addEventListener('resize',onResize,{passive:true});setInterval(()=>{decorateEntrypoints();watchBranchSheet();},1200);}

window.MindMapGuideHelp={open:openHelp,startTour,showTopic};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
