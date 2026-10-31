(()=>{'use strict';
if(window.__SWAMP_GUIDE_HELP__)return;
window.__SWAMP_GUIDE_HELP__=true;

const qs=(s,r=document)=>r.querySelector(s);
const qsa=(s,r=document)=>[...r.querySelectorAll(s)];
const app=()=>window.MindMapApp;
const mapNow=()=>app()?.getCurrentMap?.()||null;
const isMobile=()=>matchMedia('(max-width:850px),(hover:none) and (pointer:coarse)').matches||(navigator.maxTouchPoints>0&&Math.min(screen.width,screen.height)<900);
const CONTEXT_KEY='swamp.mindmap.guide.context.v1';
let activeTour=null;
let tourIndex=0;
let branchObserver=null;
let nodeObserver=null;
let resizeRaf=0;

const HELP_TOPICS={
  map:{title:'The map',summary:'The map is the project. Parent/child structure shows where ideas belong.',when:'Use it to see structure, clusters and story relationships at once.',how:['Click a node to select it.','Use the + attached to a node to add a child in one click.','Drag a node to position it or drop it on another node to move the branch.','Use the minimap to move around large maps without shrinking everything to fit.']},
  edit:{title:'Editing an idea',summary:'Selection stays lightweight; detailed editing opens only when you ask for it.',when:'Use Edit for text, descriptions, colour and less-common details.',how:['Select a node.','Choose Edit from the writer bar, or click the node text.','Close the editor to return to the map.']},
  rapid:{title:'Rapidfire',summary:'Rapidfire captures many short possibilities without interrupting brainstorming momentum.',when:'Use it when you want quantity before judging ideas.',how:['Select the idea you want to brainstorm from.','Choose Rapidfire.','Use the short context prompts such as Obstacle, Want, Clue or Consequence.','Accept each idea with ✓; Exit ends the session.']},
  lens:{title:'Lens',summary:'Lens temporarily makes the selected story element the centre of the map.',when:'Use it to answer “what is connected to this character, scene, clue, subplot or beat?”',how:['Select a meaningful node.','Choose Lens once.','Relevant hierarchy and cross-links stay strong while unrelated material fades.','Clear the Lens to return to the complete map.']},
  links:{title:'Writer links',summary:'Links connect ideas that are related without changing where they live in the hierarchy.',when:'Use them for clue → reveal, setup → payoff, character → scene, scene → location and other cross-story connections.',how:['Select the source node.','Choose Link.','Click the target node.','The map infers a useful relationship when the node types make the intent clear.']},
  types:{title:'Writer types',summary:'A type exists only when it changes how the app behaves.',when:'Use types when you want Lens, Rapidfire, links or Health to understand what an idea represents.',how:['Click the type badge on desktop, or use More on mobile.','Choose Scene, Chapter, Character, Location, Clue, Reveal, Subplot, Research, Setup or Payoff.','Keep ordinary thoughts as Idea.']},
  threads:{title:'Story threads',summary:'A thread is a story strand that crosses the normal hierarchy.',when:'Use it for Main Plot, a character arc, Mystery, Romance or another strand that appears in many places.',how:['Assign a thread to the ideas that belong to that strand.','Activate the thread to draw its path across the map.','Use the visible path to spot gaps, isolated points and intersections with other story material.']},
  health:{title:'Story Health',summary:'Health reports structural facts the map can prove; it does not judge your prose.',when:'Use it to find unfinished structural work.',how:['Open More and choose Story Health.','Review missing clue/reveal or setup/payoff links, broken relationships, empty template beats, one-point threads and items you marked Needs Work.','Click an issue to return to that node.']},
  templates:{title:'Story templates',summary:'Templates turn story structures into working maps, not static diagrams.',when:'Use Save the Cat, Three-Act Structure or Hero’s Journey when you want a story skeleton to brainstorm into.',how:['Choose Story templates from the toolbar.','The overview opens at a readable working zoom rather than fitting the whole structure.','Each beat knows its purpose and approximate place in the book.','Choose Ideas on a beat to open its dedicated brainstorming map.']},
  minimap:{title:'Minimap',summary:'The minimap gives you location and navigation without forcing the main canvas to show everything.',when:'Use it whenever the useful working zoom means parts of the map are off-screen.',how:['The highlighted rectangle shows your current viewport.','Click or drag in the minimap to move to another part of the map.','Use Fit only when you explicitly want the entire map visible.']},
  navigator:{title:"Writer’s Navigator",summary:'Navigator is for finding and jumping to ideas, not for replacing the map.',when:'Use it on large projects when you know the structural location or text of what you want.',how:['Open Navigator.','Search by idea text or notes, or browse the hierarchy.','Choose an idea to return to it on the map.']},
  focus:{title:'Focus and collapse',summary:'Focus isolates one branch; Collapse hides detail while keeping the structure intact.',when:'Use these when a large map becomes visually noisy.',how:['Select a branch and use Focus to work only inside it.','Collapse branches you do not currently need.','Exit Focus to restore the complete map.']},
  branch:{title:'More / branch tools',summary:'More contains secondary operations that should not crowd the fast writer bar.',when:'Use it for structural or less-common work.',how:['Collapse or expand the selected branch.','Auto-position a manually placed node.','Explore alternative to deep-copy a branch while preserving internal relationships.','Mark Needs Work when you want Story Health to remember an unresolved item.']},
  storywalk:{title:'Story Walk',summary:'Story Walk reviews the hierarchy as a guided sequence without replacing the map.',when:'Use it to read through structure or present the map one idea at a time.',how:['Start Story Walk from the toolbar or utility menu.','Move previous/next, parent or related ideas.','Choose Show on map to return to the exact idea on the canvas.']},
  save:{title:'Save, import and export',summary:'The workspace saves locally; export creates portable project or presentation formats.',when:'Use export for backups, sharing or moving the project.',how:['Save / Export can create the current map JSON or the complete project JSON.','Word exports a hierarchical outline.','PDF exports the visual map.','Import accepts a map or complete project.']},
  mobile:{title:'Mobile use',summary:'Mobile uses the same project data with touch-first controls.',when:'Use it for capture, navigation and focused story work away from desktop.',how:['Tap a node to select it and show the writer action strip.','Use the top More menu for Help, templates and project actions.','Pinch/drag the canvas and use the minimap for large maps.','The full inspector opens only when you choose Edit.']},
  shortcuts:{title:'Keyboard shortcuts',summary:'Keyboard shortcuts keep frequent desktop actions fast.',when:'Use them when working heavily from a keyboard.',how:['Enter — add a child idea.','Ctrl/⌘ K — search.','Ctrl/⌘ Z — undo.','F — focus/unfocus branch.','C — collapse/expand.','Home — fit map.','Z — Zen canvas.','? — Help & tours.']}
};

const CONTEXTS={
  basics:{title:'Learn the map',icon:'◎',summary:'How the canvas, nodes, minimap and navigation work together.',topics:['map','minimap','navigator','edit'],steps:[
    {title:'The map is the workspace',body:'Your story lives on this canvas. Parent/child structure answers “where does this idea belong?”',target:()=>qs('#workspace')},
    {title:'Work from the node',body:'Select an idea to reveal its fast writer actions. Use the + attached to the node for the common one-click child action.',target:()=>selectedOrFirstNode()},
    {title:'Keep a readable zoom',body:'You do not need the complete map on screen. Work at a useful scale and use the minimap to move around.',target:()=>qs('.mindmap-minimap')||qs('.mini')},
    {title:'Find large-project material',body:'Navigator finds ideas by hierarchy or text and brings you back to the map.',target:()=>visibleOne(['#v2NavigatorBtn','#v2MobileNavigatorBtn'])}
  ]},
  story:{title:'Build a story',icon:'▦',summary:'Templates, beats and brainstorming maps for story structure.',topics:['templates','map','rapid','minimap'],steps:[
    {title:'Choose a story structure',body:'Story templates create a working overview plus a brainstorming map for every beat.',target:()=>visibleOne(['#desktopToolbar [data-toolbar-target="templateBtn"]','#utilitySheet [data-toolbar-target="templateBtn"]'])},
    {title:'Treat beats as working objects',body:'Each beat knows its purpose, rough position and linked Ideas map. The overview is your story skeleton.',target:()=>storyBeatOrNode()},
    {title:'Brainstorm from the beat',body:'Use Ideas for deeper beat brainstorming or Rapidfire for short possibilities without leaving the map flow.',target:()=>visibleOne(['#writerContext [data-writer-action="branch"]','#writerContext [data-writer-action="rapid"]'])},
    {title:'Navigate instead of shrinking',body:'Templates intentionally open at a readable zoom. Use the minimap for the rest of the structure.',target:()=>qs('.mindmap-minimap')||qs('.mini')}
  ]},
  character:{title:'Develop a character',icon:'P',summary:'Use Character type, Rapidfire, Lens and links to see a character across the story.',topics:['types','rapid','lens','links','threads'],steps:[
    {title:'Give the idea meaning',body:'Character type tells the map this node represents a person, so other tools can behave differently.',before:()=>selectTypeNode('character'),target:()=>selectedOrFirstNode()},
    {title:'Brainstorm the person',body:'Rapidfire offers short prompts such as Want, Fear, Secret, Contradiction and Choice.',target:()=>qs('#writerContext [data-writer-action="rapid"]')},
    {title:'See their story footprint',body:'Lens highlights the character’s useful hierarchy and cross-story connections while fading unrelated material.',target:()=>qs('#writerContext [data-writer-action="lens"]')},
    {title:'Connect them to the story',body:'Link the character to scenes and other story material without moving those ideas in the hierarchy.',target:()=>qs('#writerContext [data-writer-action="link"]')}
  ]},
  scene:{title:'Develop a scene',icon:'S',summary:'Use Scene type to brainstorm turns, connect cast/location and inspect scene context.',topics:['types','rapid','lens','links'],steps:[
    {title:'Mark the scene',body:'Scene type gives Rapidfire, Lens and links scene-specific meaning.',before:()=>selectTypeNode('scene'),target:()=>selectedOrFirstNode()},
    {title:'Find the turn',body:'Rapidfire keeps scene brainstorming short: Obstacle, Reversal and Consequence.',target:()=>qs('#writerContext [data-writer-action="rapid"]')},
    {title:'Inspect scene context',body:'Lens helps you see what this scene is structurally connected to without leaving the canvas.',target:()=>qs('#writerContext [data-writer-action="lens"]')},
    {title:'Connect cast and place',body:'Use Link to connect a scene to characters, locations or other relevant story elements.',target:()=>qs('#writerContext [data-writer-action="link"]')}
  ]},
  mystery:{title:'Track clues and payoffs',icon:'?',summary:'Use typed clues/setups and semantic links to make the trail visible.',topics:['types','links','threads','health'],steps:[
    {title:'Identify the clue or setup',body:'Clue and Setup types let the map track whether something later resolves them.',before:()=>selectTypeNode('clue','setup'),target:()=>selectedOrFirstNode()},
    {title:'Link to the resolution',body:'Link → target can infer Clue → Reveal or Setup → Payoff, keeping the relationship visible on the canvas.',target:()=>qs('#writerContext [data-writer-action="link"]')},
    {title:'Trace the larger strand',body:'A Mystery or Foreshadowing thread can draw a path through clues, discoveries and reveals across the hierarchy.',target:()=>threadTarget()},
    {title:'Check unfinished structure',body:'Story Health reports clues or setups with no matching resolution. It reports the structural fact, not whether the writing is good.',target:()=>visibleOne(['#writerContext [data-writer-action="branch"]','#writerHealthPanel'])}
  ]},
  subplot:{title:'Develop a subplot',icon:'≋',summary:'Use Lens and Threads to see a strand that crosses chapters and scenes.',topics:['types','lens','threads','branch'],steps:[
    {title:'Mark the subplot',body:'Subplot gives the strand a structural home without forcing every child to be a Scene.',before:()=>selectTypeNode('subplot'),target:()=>selectedOrFirstNode()},
    {title:'Focus on its local structure',body:'Lens keeps the subplot and its relevant connections prominent while unrelated material fades.',target:()=>qs('#writerContext [data-writer-action="lens"]')},
    {title:'Trace it across the story',body:'Assign a Story Thread when this subplot appears in ideas elsewhere. Activating the thread draws its path across the map.',target:()=>threadTarget()},
    {title:'Try another version safely',body:'More → Explore alternative deep-copies a branch so you can try another direction without destroying the original.',target:()=>qs('#writerContext [data-writer-action="branch"]')}
  ]},
  template:{title:'Use a story template',icon:'B',summary:'Understand the overview, beat help, Ideas maps and template navigation.',topics:['templates','minimap','rapid','focus'],steps:[
    {title:'The overview is a working skeleton',body:'A template overview shows story beats as map objects, not just labels on a chart.',before:()=>selectBeat(),target:()=>storyBeatOrNode()},
    {title:'Ask what the beat is for',body:'Beat help explains purpose, context, rough percentage of the book and short examples.',target:()=>qs('.template-help-icon')||storyBeatOrNode()},
    {title:'Open Ideas for depth',body:'Ideas opens the dedicated brainstorming map for this beat. The overview stays clean while the detail lives behind it.',target:()=>qs('#writerContext [data-writer-action="branch"]')},
    {title:'Use the minimap for the whole structure',body:'The initial view shows a useful chunk at readable scale. The minimap is the fast way to move along the rest.',target:()=>qs('.mindmap-minimap')||qs('.mini')}
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
  if(type==='beat')return'template';
  const map=mapNow();
  if(map?.layoutMode==='storyline')return'template';
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
  else if(!selectedId()){selectNodeEl(qs('#nodes .node'));}
}
function selectBeat(){const el=storyBeatOrNode();if(el)selectNodeEl(el);}

function injectStyles(){
  if(qs('#guideHelpStyles'))return;
  const style=document.createElement('style');style.id='guideHelpStyles';style.textContent=`
    .guide-help-overlay{position:fixed;inset:0;z-index:190;background:rgba(36,32,27,.34);display:grid;place-items:center;padding:12px}.guide-help-overlay.hidden{display:none!important}
    .guide-help-card{width:min(760px,100%);max-height:min(86vh,780px);overflow:auto;background:rgba(252,250,245,.99);border:1px solid rgba(92,78,61,.18);border-radius:24px;box-shadow:0 26px 80px rgba(38,31,24,.28);padding:18px;color:var(--ink,#25231f)}
    .guide-help-head{display:flex;gap:12px;align-items:flex-start}.guide-help-head>div{min-width:0;flex:1}.guide-help-head h2{margin:0 0 4px;font-size:1.25rem}.guide-help-head p{margin:0;color:var(--muted,#6e675e);line-height:1.4}.guide-help-close{width:42px;height:42px;border:1px solid var(--line,#ddd3c6);border-radius:13px;background:#fff;font-size:1.2rem;flex:none}
    .guide-current{display:flex;align-items:center;gap:10px;margin:14px 0;padding:11px 12px;border:1px solid rgba(49,95,77,.2);background:#eef4f0;border-radius:15px}.guide-current strong{display:block}.guide-current span{display:block;color:var(--muted,#6e675e);font-size:.76rem;margin-top:2px}.guide-current button{margin-left:auto;flex:none;border:0;border-radius:11px;background:#315f4d;color:#fff;min-height:40px;padding:8px 12px;font-weight:850}
    .guide-section-title{margin:18px 0 8px;font-size:.76rem;text-transform:uppercase;letter-spacing:.08em;color:var(--muted,#6e675e);font-weight:900}.guide-context-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.guide-context{border:1px solid rgba(92,78,61,.17);border-radius:15px;background:#fff;min-height:76px;padding:11px 12px;text-align:left;color:var(--ink);display:grid;grid-template-columns:34px 1fr;gap:9px;align-items:start}.guide-context:hover,.guide-context:focus-visible{border-color:#739985;background:#f3f7f4;outline:0}.guide-context-icon{width:34px;height:34px;border-radius:10px;background:#e7efe9;color:#315f4d;display:grid;place-items:center;font-weight:950}.guide-context strong{display:block;margin-bottom:3px}.guide-context small{display:block;color:var(--muted);line-height:1.35;font-weight:600}
    .guide-search{display:flex;align-items:center;gap:8px;border:1px solid var(--line,#ddd3c6);border-radius:13px;background:#fff;padding:0 10px;margin-bottom:8px}.guide-search input{border:0;outline:0;background:transparent;min-width:0;flex:1;font:inherit;font-size:16px;padding:11px 0}.guide-topic-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.guide-topic{border:1px solid rgba(92,78,61,.14);border-radius:13px;background:#fff;padding:10px 11px;text-align:left;color:var(--ink)}.guide-topic strong{display:block}.guide-topic span{display:block;margin-top:3px;color:var(--muted);font-size:.72rem;line-height:1.35}
    .guide-topic-view h3{margin:14px 0 4px;font-size:1.15rem}.guide-topic-view>p{margin:0 0 12px;color:var(--muted);line-height:1.45}.guide-topic-block{background:#f3f0e9;border-radius:14px;padding:11px 12px;margin:8px 0}.guide-topic-block strong{display:block;margin-bottom:4px;font-size:.76rem;text-transform:uppercase;letter-spacing:.05em;color:#625d55}.guide-topic-block ul{margin:0;padding-left:20px}.guide-topic-block li{margin:4px 0;line-height:1.4}.guide-back{border:0;background:transparent;color:#315f4d;font-weight:850;padding:6px 0;margin-top:8px}
    .guide-tour-overlay{position:fixed;inset:0;z-index:198;pointer-events:none}.guide-tour-overlay.hidden{display:none!important}.guide-spotlight{position:fixed;border:3px solid #f7f4ec;border-radius:16px;box-shadow:0 0 0 9999px rgba(31,28,24,.62),0 0 0 6px rgba(49,95,77,.78);transition:left .18s ease,top .18s ease,width .18s ease,height .18s ease;pointer-events:none}.guide-spotlight.no-target{display:none}.guide-tour-card{position:fixed;z-index:199;width:min(360px,calc(100vw - 24px));background:#fcfaf5;color:var(--ink);border:1px solid rgba(92,78,61,.2);border-radius:19px;padding:14px;box-shadow:0 22px 70px rgba(29,25,21,.3);pointer-events:auto}.guide-tour-kicker{font-size:.68rem;text-transform:uppercase;letter-spacing:.08em;color:#557766;font-weight:900}.guide-tour-card h3{margin:5px 0 5px;font-size:1.08rem}.guide-tour-card p{margin:0;color:var(--muted);line-height:1.45}.guide-tour-actions{display:flex;gap:7px;align-items:center;margin-top:13px}.guide-tour-actions .spacer{flex:1}.guide-tour-actions button{min-height:40px;border:1px solid var(--line);border-radius:11px;background:#fff;padding:7px 11px;font-weight:850}.guide-tour-actions .primary{background:#315f4d;border-color:#315f4d;color:#fff}.guide-tour-progress{font-size:.7rem;color:var(--muted);font-weight:800}.guide-tour-exit{border:0!important;background:transparent!important;color:var(--muted)!important;padding-left:3px!important;padding-right:3px!important}
    @media(max-width:620px),(hover:none) and (pointer:coarse){.guide-help-overlay{place-items:end center;padding:6px}.guide-help-card{border-radius:22px 22px 16px 16px;max-height:88vh;padding:15px}.guide-context-grid,.guide-topic-list{grid-template-columns:1fr}.guide-current{align-items:flex-start;flex-wrap:wrap}.guide-current button{margin-left:0;width:100%}.guide-tour-card{left:8px!important;right:8px!important;bottom:max(8px,env(safe-area-inset-bottom))!important;top:auto!important;width:auto}.guide-spotlight{border-radius:13px}}
    @media(prefers-reduced-motion:reduce){.guide-spotlight{transition:none}}
  `;document.head.appendChild(style);
}

function buildUi(){
  if(!qs('#guideHelpOverlay')){
    const wrap=document.createElement('div');wrap.id='guideHelpOverlay';wrap.className='guide-help-overlay hidden';wrap.innerHTML=`<section class="guide-help-card" role="dialog" aria-modal="true" aria-labelledby="guideHelpTitle"><header class="guide-help-head"><div><h2 id="guideHelpTitle">Help & guided tours</h2><p>Choose what you are doing, or look up a feature. Help follows the map context instead of making you learn the whole app.</p></div><button id="guideHelpClose" class="guide-help-close" type="button" aria-label="Close help">×</button></header><div id="guideHelpBody"></div></section>`;
    wrap.addEventListener('pointerdown',e=>{if(e.target===wrap)closeHelp();});document.body.appendChild(wrap);qs('#guideHelpClose').addEventListener('click',closeHelp);
  }
  if(!qs('#guideTourOverlay')){
    const tour=document.createElement('div');tour.id='guideTourOverlay';tour.className='guide-tour-overlay hidden';tour.innerHTML=`<div id="guideSpotlight" class="guide-spotlight no-target"></div><section id="guideTourCard" class="guide-tour-card" role="dialog" aria-modal="true" aria-live="polite"><div id="guideTourKicker" class="guide-tour-kicker"></div><h3 id="guideTourTitle"></h3><p id="guideTourBody"></p><div class="guide-tour-actions"><button id="guideTourExit" class="guide-tour-exit" type="button">Exit</button><span id="guideTourProgress" class="guide-tour-progress"></span><span class="spacer"></span><button id="guideTourBack" type="button">Back</button><button id="guideTourNext" class="primary" type="button">Next</button></div></section>`;document.body.appendChild(tour);
    qs('#guideTourExit').addEventListener('click',endTour);qs('#guideTourBack').addEventListener('click',()=>showTourStep(tourIndex-1));qs('#guideTourNext').addEventListener('click',()=>{if(!activeTour)return;if(tourIndex>=activeTour.steps.length-1)endTour();else showTourStep(tourIndex+1);});
  }
}

function renderHelp(homeContext=null){
  buildUi();const body=qs('#guideHelpBody'),node=selectedNode(),key=homeContext||contextKeyForNode(node),ctx=CONTEXTS[key]||CONTEXTS.basics;
  const currentText=node?`${inferType(node)==='general'?'Idea':inferType(node)}: ${String(node.text||'Untitled').slice(0,70)}`:(mapNow()?.layoutMode==='storyline'?'Story template overview':'No idea selected');
  body.innerHTML=`<div class="guide-current"><div><strong>Current context</strong><span>${escapeHtml(currentText)}</span></div><button type="button" data-current-tour="${key}">Tour: ${escapeHtml(ctx.title)}</button></div><div class="guide-section-title">Guided tours — choose your goal</div><div class="guide-context-grid" id="guideContextGrid"></div><div class="guide-section-title">Function help</div><label class="guide-search"><span>⌕</span><input id="guideHelpSearch" type="search" placeholder="Search help…" autocomplete="off"></label><div class="guide-topic-list" id="guideTopicList"></div>`;
  const grid=qs('#guideContextGrid');Object.entries(CONTEXTS).forEach(([id,c])=>{const b=document.createElement('button');b.type='button';b.className='guide-context';b.dataset.tour=id;b.innerHTML=`<span class="guide-context-icon">${escapeHtml(c.icon)}</span><span><strong>${escapeHtml(c.title)}</strong><small>${escapeHtml(c.summary)}</small></span>`;b.addEventListener('click',()=>startTour(id));grid.appendChild(b);});
  qs('[data-current-tour]')?.addEventListener('click',e=>startTour(e.currentTarget.dataset.currentTour));
  const input=qs('#guideHelpSearch');input.addEventListener('input',()=>renderTopicList(input.value));renderTopicList('');
}
function renderTopicList(filter=''){
  const host=qs('#guideTopicList');if(!host)return;host.innerHTML='';const q=filter.trim().toLowerCase();Object.entries(HELP_TOPICS).forEach(([id,t])=>{const hay=`${t.title} ${t.summary} ${t.when} ${t.how.join(' ')}`.toLowerCase();if(q&&!hay.includes(q))return;const b=document.createElement('button');b.type='button';b.className='guide-topic';b.innerHTML=`<strong>${escapeHtml(t.title)}</strong><span>${escapeHtml(t.summary)}</span>`;b.addEventListener('click',()=>showTopic(id));host.appendChild(b);});if(!host.children.length)host.innerHTML='<div style="padding:12px;color:var(--muted)">No matching help topics.</div>';
}
function showTopic(id){
  const t=HELP_TOPICS[id],body=qs('#guideHelpBody');if(!t||!body)return;body.innerHTML=`<button class="guide-back" type="button">← All help</button><div class="guide-topic-view"><h3>${escapeHtml(t.title)}</h3><p>${escapeHtml(t.summary)}</p><div class="guide-topic-block"><strong>Use it when</strong>${escapeHtml(t.when)}</div><div class="guide-topic-block"><strong>How it works</strong><ul>${t.how.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul></div></div>`;qs('.guide-back',body).addEventListener('click',()=>renderHelp());
}
function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
function openHelp(context=null){endTour();buildUi();renderHelp(context);qs('#guideHelpOverlay').classList.remove('hidden');requestAnimationFrame(()=>qs('#guideHelpSearch')?.focus({preventScroll:true}));}
function closeHelp(){qs('#guideHelpOverlay')?.classList.add('hidden');}

function startTour(key){
  const context=CONTEXTS[key]||CONTEXTS.basics;try{localStorage.setItem(CONTEXT_KEY,key);}catch{}
  closeHelp();activeTour=context;tourIndex=0;qs('#guideTourOverlay')?.classList.remove('hidden');showTourStep(0);
}
function endTour(){activeTour=null;tourIndex=0;qs('#guideTourOverlay')?.classList.add('hidden');qs('#guideSpotlight')?.classList.add('no-target');}
function showTourStep(index){
  if(!activeTour)return;index=Math.max(0,Math.min(activeTour.steps.length-1,index));tourIndex=index;const step=activeTour.steps[index];
  try{step.before?.();}catch{}
  setTimeout(()=>{const target=resolveTarget(step);positionSpotlight(target);qs('#guideTourKicker').textContent=activeTour.title;qs('#guideTourTitle').textContent=step.title;qs('#guideTourBody').textContent=step.body;qs('#guideTourProgress').textContent=`${index+1} / ${activeTour.steps.length}`;qs('#guideTourBack').disabled=index===0;qs('#guideTourNext').textContent=index===activeTour.steps.length-1?'Done':'Next';positionTourCard(target);},50);
}
function resolveTarget(step){let el=null;try{el=step.target?.()||null;}catch{}if(el&&!visible(el))el=null;return el;}
function positionSpotlight(target){
  const spot=qs('#guideSpotlight');if(!spot)return;if(!target){spot.classList.add('no-target');return;}target.scrollIntoView?.({block:'nearest',inline:'nearest',behavior:'smooth'});const r=target.getBoundingClientRect(),pad=7;spot.classList.remove('no-target');spot.style.left=`${Math.max(4,r.left-pad)}px`;spot.style.top=`${Math.max(4,r.top-pad)}px`;spot.style.width=`${Math.min(innerWidth-8,r.width+pad*2)}px`;spot.style.height=`${Math.min(innerHeight-8,r.height+pad*2)}px`;
}
function positionTourCard(target){
  const card=qs('#guideTourCard');if(!card)return;card.style.left='';card.style.right='';card.style.top='';card.style.bottom='';if(isMobile()||!target)return;const r=target.getBoundingClientRect(),w=card.offsetWidth||360,h=card.offsetHeight||190,gap=18;let left=r.right+gap,top=Math.max(12,Math.min(innerHeight-h-12,r.top));if(left+w>innerWidth-12){left=Math.max(12,r.left-w-gap);}if(left<12){left=Math.max(12,Math.min(innerWidth-w-12,r.left));top=r.bottom+gap;if(top+h>innerHeight-12)top=Math.max(12,r.top-h-gap);}card.style.left=`${left}px`;card.style.top=`${top}px`;
}

function decorateEntrypoints(){
  qsa('[data-toolbar-target="shortcutsBtn"]').forEach(btn=>{btn.title='Help & guided tours';btn.setAttribute('aria-label','Help & guided tours');if(btn.closest('#utilitySheet'))btn.textContent='? Help & tours';});
}
function interceptHelpEntrypoints(){
  document.addEventListener('click',e=>{const btn=e.target.closest?.('[data-toolbar-target="shortcutsBtn"],#shortcutsBtn');if(!btn)return;e.preventDefault();e.stopImmediatePropagation();openHelp();},true);
  document.addEventListener('keydown',e=>{if(e.key!=='?'||e.ctrlKey||e.metaKey||e.altKey)return;const tag=document.activeElement?.tagName;if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT'||document.activeElement?.isContentEditable)return;e.preventDefault();e.stopImmediatePropagation();openHelp();},true);
}
function injectContextHelp(){
  const sheet=qs('#writerBranchSheet');if(!sheet||sheet.classList.contains('hidden'))return;const grid=qs('.writer-option-grid',sheet);if(!grid||qs('[data-guide-context-help]',grid))return;const b=document.createElement('button');b.type='button';b.className='writer-option';b.dataset.guideContextHelp='1';b.innerHTML='<strong>Help for this idea</strong><small>Explain the selected idea’s writer tools</small>';b.addEventListener('click',()=>{sheet.classList.add('hidden');openHelp(contextKeyForNode(selectedNode()));});grid.prepend(b);
}
function watchBranchSheet(){const sheet=qs('#writerBranchSheet');if(!sheet||branchObserver)return;branchObserver=new MutationObserver(injectContextHelp);branchObserver.observe(sheet,{attributes:true,attributeFilter:['class'],childList:true,subtree:true});}
function watchNodes(){const nodes=qs('#nodes');if(!nodes||nodeObserver)return;nodeObserver=new MutationObserver(()=>{if(!qs('#guideHelpOverlay')?.classList.contains('hidden'))renderHelp();});nodeObserver.observe(nodes,{attributes:true,subtree:true,attributeFilter:['class']});}
function onResize(){cancelAnimationFrame(resizeRaf);resizeRaf=requestAnimationFrame(()=>{if(activeTour)showTourStep(tourIndex);});}
function boot(){injectStyles();buildUi();decorateEntrypoints();interceptHelpEntrypoints();watchBranchSheet();watchNodes();window.addEventListener('resize',onResize,{passive:true});setInterval(()=>{decorateEntrypoints();watchBranchSheet();},1000);}

window.MindMapGuideHelp={open:openHelp,startTour,showTopic};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
