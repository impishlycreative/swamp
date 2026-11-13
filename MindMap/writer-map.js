(()=>{'use strict';
if(window.__SWAMP_WRITER_MAP__)return;
window.__SWAMP_WRITER_MAP__=true;

const NS='http://www.w3.org/2000/svg';
const qs=(s,r=document)=>r.querySelector(s);
const qsa=(s,r=document)=>[...r.querySelectorAll(s)];
const app=()=>window.MindMapApp;
const mapNow=()=>app()?.getCurrentMap?.()||null;
const projectNow=()=>app()?.getProject?.()||null;
const isMobile=()=>matchMedia('(max-width:850px),(hover:none) and (pointer:coarse)').matches||(navigator.maxTouchPoints>0&&Math.min(screen.width,screen.height)<900);
const uid=(prefix='w_')=>`${prefix}${Math.random().toString(36).slice(2,9)}${Date.now().toString(36).slice(-5)}`;

const TYPES={
  general:{label:'Idea',glyph:'•'},
  scene:{label:'Scene',glyph:'S'},
  chapter:{label:'Chapter',glyph:'C'},
  character:{label:'Character',glyph:'P'},
  location:{label:'Location',glyph:'L'},
  conflict:{label:'Conflict',glyph:'!'},
  theme:{label:'Theme',glyph:'T'},
  clue:{label:'Clue',glyph:'?'},
  reveal:{label:'Reveal',glyph:'R'},
  subplot:{label:'Subplot',glyph:'SP'},
  object:{label:'Object',glyph:'O'},
  research:{label:'Research',glyph:'RS'},
  setup:{label:'Setup',glyph:'↑'},
  payoff:{label:'Payoff',glyph:'↓'},
  beat:{label:'Story beat',glyph:'B'}
};
const TYPE_ORDER=['general','scene','chapter','character','location','conflict','theme','clue','reveal','subplot','object','research','setup','payoff'];
const DEFAULT_THREADS=['Main Plot','Character Arc','Mystery','Romance','Subplot','Foreshadowing'];
const BEAT_NAMES=new Set([
  'act i — setup','inciting incident','first plot point','act ii — confrontation','midpoint','second plot point','act iii — resolution','climax','denouement',
  'opening image','theme stated','setup','catalyst','debate','break into two','b story','fun and games','bad guys close in','all is lost','dark night of the soul','break into three','finale','final image',
  'ordinary world','call to adventure','refusal of the call','meeting the mentor','crossing the first threshold','tests, allies, enemies','approach to the inmost cave','ordeal','reward','the road back','resurrection','return with the elixir'
]);
const RAPID_HINTS={
  general:'One short possibility',scene:'Obstacle, turn, reveal, or consequence',chapter:'Scene, turn, or chapter purpose',character:'Want, fear, secret, contradiction, or choice',location:'Detail, danger, history, or story use',conflict:'Pressure, tactic, cost, or consequence',theme:'Image, choice, contrast, or question',clue:'Meaning, discovery, misdirection, or payoff',reveal:'What changes, who learns it, or consequence',subplot:'Beat, complication, or connection',object:'Use, history, owner, danger, or meaning',research:'Question, fact to verify, or source',setup:'Plant, promise, clue, or expectation',payoff:'Consequence, reveal, reversal, or fulfilment',beat:'One short possibility for this beat'
};

let selected=null;
let activeLens=null;
let activeThread=null;
let healthOpen=false;
let writerLinkMode=null;
let knownNodeIds=new Set();
let syncRaf=0;
let positionRaf=0;
let lastMapId=null;
let observer=null;
let viewportObserver=null;

function toast(message){
  const el=qs('#toast');if(!el)return;
  el.textContent=message;el.classList.add('show');clearTimeout(el._writerTimer);el._writerTimer=setTimeout(()=>el.classList.remove('show'),1800);
}
function esc(value){return String(value??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
function childrenOf(map,id){return Object.values(map?.nodes||{}).filter(n=>n.parentId===id);}
function descendants(map,id,out=new Set()){if(!map?.nodes?.[id]||out.has(id))return out;out.add(id);childrenOf(map,id).forEach(n=>descendants(map,n.id,out));return out;}
function ancestors(map,id){const out=[];let n=map?.nodes?.[id],guard=0;while(n&&guard++<200){out.unshift(n);if(!n.parentId)break;n=map.nodes[n.parentId];}return out;}
function currentSelectedId(){return qs('#nodes .node.selected')?.dataset.id||null;}
function inferType(node){
  if(!node)return'general';
  if(node.writer?.type&&TYPES[node.writer.type])return node.writer.type;
  const text=(node.text||'').trim().toLowerCase();
  if(node.targetMapId||BEAT_NAMES.has(text))return'beat';
  if(/^chapter\b/.test(text))return'chapter';
  if(/\b(clue|evidence)\b/.test(text))return'clue';
  if(/\b(reveal|revelation)\b/.test(text))return'reveal';
  return'general';
}
function typeMeta(node){return TYPES[inferType(node)]||TYPES.general;}
function threadsOf(node){return Array.isArray(node?.writer?.threads)?node.writer.threads.filter(Boolean):[];}
function flagsOf(node){return Array.isArray(node?.writer?.flags)?node.writer.flags.filter(Boolean):[];}
function ensureWriter(node){if(!node.writer||typeof node.writer!=='object')node.writer={};if(!Array.isArray(node.writer.threads))node.writer.threads=[];if(!Array.isArray(node.writer.flags))node.writer.flags=[];return node.writer;}
function relationList(map){if(!map)return[];if(!Array.isArray(map.relationships))map.relationships=[];return map.relationships;}
function save(){app()?.save?.();}
function nodeEl(id){return id?qs(`#nodes .node[data-id="${CSS.escape(id)}"]`):null;}
function selectNode(id,center=false){
  const el=nodeEl(id);if(!el){toast('Open that branch first');return false;}
  el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));
  if(center)requestAnimationFrame(()=>qs('#centerBtn')?.click());
  return true;
}
function refreshMap(selectId=null){
  const map=mapNow();if(!map)return;const id=map.id;save();app()?.setCurrentMap?.(id,false,false);
  requestAnimationFrame(()=>requestAnimationFrame(()=>{if(selectId)selectNode(selectId,false);scheduleSync();}));
}

function injectStyles(){
  if(qs('#writerMapStyles'))return;
  const style=document.createElement('style');style.id='writerMapStyles';style.textContent=`
    :root{--writer-green:#365f4d;--writer-purple:#725b82;--writer-amber:#a36f1d;--writer-red:#9d493f;--writer-panel:rgba(252,250,245,.97)}
    #writerContext{position:fixed;z-index:118;display:flex;align-items:center;gap:5px;padding:6px;border:1px solid rgba(92,78,61,.18);border-radius:16px;background:var(--writer-panel);box-shadow:0 12px 34px rgba(45,38,30,.18);backdrop-filter:blur(15px);max-width:min(92vw,720px);overflow-x:auto;scrollbar-width:none;transform:translateX(-50%)}
    #writerContext::-webkit-scrollbar{display:none}#writerContext.hidden{display:none!important}
    .writer-action{flex:none;min-height:38px;border:0;border-radius:11px;background:transparent;color:var(--ink,#25231f);padding:7px 10px;font:inherit;font-size:.76rem;font-weight:850;cursor:pointer;white-space:nowrap}.writer-action:hover,.writer-action:focus-visible{background:#eee9df;outline:0}.writer-action.primary{background:#e1ece6;color:#2f5d49}.writer-action.active{background:#e9dff0;color:#624b71}.writer-action .writer-glyph{font-weight:950;margin-right:4px}
    .writer-type-badge,.writer-thread-badge{pointer-events:none}.writer-type-badge circle{fill:rgba(255,255,255,.94);stroke:rgba(67,74,65,.28);stroke-width:1.2}.writer-type-badge text{font-size:9px;font-weight:950;fill:#365f4d;text-anchor:middle;dominant-baseline:central}.writer-thread-badge circle{fill:#725b82;stroke:#fff;stroke-width:2}.node.writer-lens-hit .body{stroke:var(--writer-green)!important;stroke-width:4!important;filter:drop-shadow(0 0 5px rgba(54,95,77,.28))}.node.writer-dim{opacity:.16!important}.edge.writer-dim,.edge-hit.writer-dim{opacity:.08!important}.edge.writer-lens-hit{stroke:var(--writer-green)!important;stroke-width:3.2!important}.v2-link-group.writer-dim{opacity:.1}.v2-link-group.writer-lens-hit .v2-link-line{stroke:var(--writer-green)!important;stroke-width:3.2!important;opacity:1}.node.writer-link-source .body{stroke:var(--writer-purple)!important;stroke-width:4!important;stroke-dasharray:7 5}
    .node.writer-health-issue .body{stroke:var(--writer-amber)!important;stroke-width:4!important;stroke-dasharray:7 5}.node.writer-health-critical .body{stroke:var(--writer-red)!important}
    #writerLensStrip{position:fixed;z-index:112;left:50%;top:72px;transform:translateX(-50%);max-width:min(92vw,900px);display:flex;align-items:center;gap:6px;padding:5px 7px;border:1px solid rgba(92,78,61,.14);border-radius:999px;background:rgba(252,250,245,.9);backdrop-filter:blur(14px);box-shadow:0 8px 28px rgba(45,38,30,.11);overflow-x:auto;scrollbar-width:none}#writerLensStrip::-webkit-scrollbar{display:none}#writerLensStrip.hidden{display:none!important}.writer-strip-label{font-size:.67rem;color:var(--muted);font-weight:900;text-transform:uppercase;letter-spacing:.06em;padding:0 4px}.writer-thread-chip{flex:none;border:1px solid rgba(114,91,130,.22);border-radius:999px;background:#fff;color:#62516e;min-height:32px;padding:5px 10px;font-size:.7rem;font-weight:850;cursor:pointer}.writer-thread-chip.active{background:#725b82;color:#fff}.writer-clear-chip{flex:none;border:0;background:#ece7de;border-radius:999px;min-height:32px;padding:5px 9px;font-size:.7rem;font-weight:850;color:#655f57;cursor:pointer}
    .writer-sheet{position:fixed;z-index:154;inset:0;background:rgba(35,33,29,.27);display:grid;place-items:end center;padding:8px}.writer-sheet.hidden{display:none!important}.writer-sheet-card{width:min(560px,100%);max-height:min(78vh,720px);overflow:auto;background:var(--writer-panel);border-radius:24px;padding:16px;box-shadow:0 24px 70px rgba(43,36,28,.24);margin-bottom:env(safe-area-inset-bottom)}.writer-sheet-head{display:flex;gap:10px;align-items:center;margin-bottom:12px}.writer-sheet-head>div{min-width:0;flex:1}.writer-sheet-head h2{margin:0;font-size:1.12rem}.writer-sheet-head p{margin:3px 0 0;color:var(--muted);font-size:.76rem}.writer-close{width:40px;height:40px;border:1px solid rgba(92,78,61,.18);border-radius:12px;background:#fff;font-size:1.2rem}.writer-option-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.writer-option{border:1px solid rgba(92,78,61,.16);border-radius:13px;background:#fff;min-height:46px;padding:8px 10px;text-align:left;font-weight:800;color:var(--ink);cursor:pointer}.writer-option.active{background:#e1ece6;border-color:#84a694;color:#2f5d49}.writer-option small{display:block;color:var(--muted);font-weight:600;margin-top:2px}.writer-custom-row{display:flex;gap:7px;margin-top:10px}.writer-custom-row input{min-width:0;flex:1;border:1px solid rgba(92,78,61,.2);border-radius:12px;padding:10px;font:inherit}.writer-custom-row button{border:0;border-radius:12px;background:var(--writer-green);color:#fff;padding:0 15px;font-weight:850}
    #writerLinkBanner{position:fixed;z-index:136;left:50%;top:max(76px,calc(env(safe-area-inset-top) + 60px));transform:translateX(-50%);max-width:calc(100vw - 24px);display:none;align-items:center;gap:8px;background:#263f34;color:#fff;border-radius:999px;padding:8px 10px 8px 14px;box-shadow:0 14px 36px rgba(30,48,40,.25);font-size:.76rem;font-weight:850}body.writer-linking #writerLinkBanner{display:flex}#writerLinkBanner span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#writerLinkBanner button{width:30px;height:30px;border:0;border-radius:50%;background:rgba(255,255,255,.15);color:#fff;font-size:1rem}body.writer-linking #nodes .node{cursor:crosshair}
    #writerHealthPanel{position:fixed;z-index:121;right:12px;top:118px;width:min(360px,calc(100vw - 24px));max-height:calc(100vh - 140px);overflow:auto;background:var(--writer-panel);border:1px solid rgba(92,78,61,.18);border-radius:20px;padding:13px;box-shadow:0 18px 48px rgba(45,38,30,.2)}#writerHealthPanel.hidden{display:none!important}.writer-health-head{display:flex;align-items:center;gap:8px;margin-bottom:8px}.writer-health-head strong{flex:1}.writer-health-item{width:100%;border:0;border-radius:12px;background:#f2eee6;color:var(--ink);padding:9px 10px;margin:4px 0;text-align:left;cursor:pointer}.writer-health-item strong{display:block;font-size:.8rem}.writer-health-item span{display:block;color:var(--muted);font-size:.7rem;margin-top:2px}.writer-health-empty{padding:18px 8px;text-align:center;color:var(--muted)}
    @media(max-width:850px),(hover:none) and (pointer:coarse){#writerContext{left:8px!important;right:8px!important;bottom:calc(68px + env(safe-area-inset-bottom));top:auto!important;transform:none!important;max-width:none;border-radius:14px;padding:5px}.writer-action{min-height:44px;padding:8px 11px}.writer-action .writer-glyph{display:block;margin:0;font-size:1.05rem}.writer-action{font-size:.66rem;text-align:center}#writerLensStrip{top:calc(58px + env(safe-area-inset-top));max-width:calc(100vw - 16px)}#writerHealthPanel{left:8px;right:8px;bottom:calc(68px + env(safe-area-inset-bottom));top:auto;width:auto;max-height:54vh}.writer-option-grid{grid-template-columns:1fr 1fr}}
    @media(min-width:851px) and (hover:hover){.writer-sheet{place-items:center}.writer-sheet-card{margin:0}.writer-option-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
  `;document.head.appendChild(style);
}

function buildUi(){
  if(!qs('#writerContext')){
    const bar=document.createElement('div');bar.id='writerContext';bar.className='hidden';bar.setAttribute('aria-label','Writer actions');bar.innerHTML=`
      <button class="writer-action primary" data-writer-action="add" type="button"><span class="writer-glyph">＋</span><span class="writer-label">Idea</span></button>
      <button class="writer-action" data-writer-action="rapid" type="button"><span class="writer-glyph">⚡</span><span class="writer-label">Rapid</span></button>
      <button class="writer-action" data-writer-action="lens" type="button"><span class="writer-glyph">◎</span><span class="writer-label">Lens</span></button>
      <button class="writer-action" data-writer-action="link" type="button"><span class="writer-glyph">↗</span><span class="writer-label">Link</span></button>
      <button class="writer-action" data-writer-action="type" type="button"><span class="writer-glyph">•</span><span class="writer-label">Type</span></button>
      <button class="writer-action" data-writer-action="thread" type="button"><span class="writer-glyph">≋</span><span class="writer-label">Thread</span></button>
      <button class="writer-action" data-writer-action="health" type="button"><span class="writer-glyph">✓</span><span class="writer-label">Health</span></button>
      <button class="writer-action" data-writer-action="branch" type="button"><span class="writer-glyph">⋯</span><span class="writer-label">Branch</span></button>`;
    document.body.appendChild(bar);bar.addEventListener('click',handleContextAction);
  }
  if(!qs('#writerLensStrip')){const strip=document.createElement('div');strip.id='writerLensStrip';strip.className='hidden';document.body.appendChild(strip);}
  if(!qs('#writerLinkBanner')){const b=document.createElement('div');b.id='writerLinkBanner';b.innerHTML='<span></span><button type="button" aria-label="Exit link mode">×</button>';b.querySelector('button').addEventListener('click',()=>cancelWriterLink());document.body.appendChild(b);}
  buildPicker('writerTypeSheet','Idea type');buildPicker('writerThreadSheet','Story thread',true);buildPicker('writerBranchSheet','Branch actions');
  if(!qs('#writerHealthPanel')){const panel=document.createElement('aside');panel.id='writerHealthPanel';panel.className='hidden';panel.innerHTML='<div class="writer-health-head"><strong>Story health</strong><button class="writer-close" type="button" aria-label="Close">×</button></div><div id="writerHealthList"></div>';panel.querySelector('.writer-close').addEventListener('click',()=>toggleHealth(false));document.body.appendChild(panel);}
}
function buildPicker(id,title,withInput=false){
  if(qs(`#${id}`))return;const sheet=document.createElement('div');sheet.id=id;sheet.className='writer-sheet hidden';sheet.innerHTML=`<section class="writer-sheet-card"><header class="writer-sheet-head"><div><h2>${esc(title)}</h2><p></p></div><button class="writer-close" type="button" aria-label="Close">×</button></header><div class="writer-option-grid"></div>${withInput?'<div class="writer-custom-row"><input maxlength="40" placeholder="New thread"><button type="button">Add</button></div>':''}</section>`;sheet.addEventListener('pointerdown',e=>{if(e.target===sheet)closeSheets();});sheet.querySelector('.writer-close').addEventListener('click',closeSheets);document.body.appendChild(sheet);
}
function closeSheets(){qsa('.writer-sheet').forEach(x=>x.classList.add('hidden'));}

function handleContextAction(e){
  const btn=e.target.closest('[data-writer-action]');if(!btn)return;const action=btn.dataset.writerAction,map=mapNow(),id=currentSelectedId();if(!map||!id||!map.nodes[id])return;
  if(action==='add'){qs('#addBtn')?.click();return;}
  if(action==='rapid'){(qs('#rapidfireFromIdeaBtn')||qs('#rapidfireBtn'))?.click();setTimeout(updateRapidfireContext,0);return;}
  if(action==='lens'){toggleNodeLens(id);return;}
  if(action==='link'){startWriterLink(id);return;}
  if(action==='type'){openTypeSheet(id);return;}
  if(action==='thread'){openThreadSheet(id);return;}
  if(action==='health'){toggleHealth();return;}
  if(action==='branch'){const node=map.nodes[id];if(node.targetMapId&&projectNow()?.sessions?.[node.targetMapId]){app()?.setCurrentMap?.(node.targetMapId,true,false);return;}openBranchSheet(id);return;}
}

function openTypeSheet(id){
  const map=mapNow(),node=map?.nodes?.[id],sheet=qs('#writerTypeSheet');if(!node||!sheet)return;const current=inferType(node),grid=sheet.querySelector('.writer-option-grid');sheet.dataset.nodeId=id;sheet.querySelector('.writer-sheet-head p').textContent=node.text||'Untitled';grid.innerHTML='';
  TYPE_ORDER.forEach(type=>{const meta=TYPES[type],b=document.createElement('button');b.type='button';b.className='writer-option'+(type===current?' active':'');b.innerHTML=`<strong>${esc(meta.glyph)} ${esc(meta.label)}</strong>`;b.addEventListener('click',()=>{ensureWriter(node).type=type;save();closeSheets();scheduleSync();toast(`${meta.label} type set`);});grid.appendChild(b);});sheet.classList.remove('hidden');
}
function allThreads(map){const set=new Set();Object.values(map?.nodes||{}).forEach(n=>threadsOf(n).forEach(t=>set.add(t)));return[...set].sort((a,b)=>a.localeCompare(b));}
function openThreadSheet(id){const map=mapNow(),node=map?.nodes?.[id],sheet=qs('#writerThreadSheet');if(!node||!sheet)return;sheet.dataset.nodeId=id;sheet.querySelector('.writer-sheet-head p').textContent=node.text||'Untitled';renderThreadOptions();sheet.classList.remove('hidden');}
function renderThreadOptions(){
  const sheet=qs('#writerThreadSheet'),map=mapNow(),node=map?.nodes?.[sheet?.dataset.nodeId];if(!sheet||!node)return;const current=new Set(threadsOf(node)),names=[...new Set([...allThreads(map),...DEFAULT_THREADS])],grid=sheet.querySelector('.writer-option-grid');grid.innerHTML='';
  names.forEach(name=>{const b=document.createElement('button');b.type='button';b.className='writer-option'+(current.has(name)?' active':'');b.innerHTML=`<strong>${esc(name)}</strong><small>${current.has(name)?'On this idea':'Add to this idea'}</small>`;b.addEventListener('click',()=>{const w=ensureWriter(node),set=new Set(w.threads);set.has(name)?set.delete(name):set.add(name);w.threads=[...set];save();renderThreadOptions();scheduleSync();});grid.appendChild(b);});
  const input=sheet.querySelector('.writer-custom-row input'),add=sheet.querySelector('.writer-custom-row button');add.onclick=()=>{const name=input.value.trim();if(!name)return;const w=ensureWriter(node);if(!w.threads.includes(name))w.threads.push(name);input.value='';save();renderThreadOptions();scheduleSync();};
}
function openBranchSheet(id){
  const map=mapNow(),node=map?.nodes?.[id],sheet=qs('#writerBranchSheet');if(!node||!sheet)return;sheet.dataset.nodeId=id;sheet.querySelector('.writer-sheet-head p').textContent=node.text||'Untitled';const grid=sheet.querySelector('.writer-option-grid');grid.innerHTML='';const items=[];
  if(childrenOf(map,id).length)items.push([node.collapsed?'Expand branch':'Collapse branch','Show or hide this branch',()=>{selectNode(id);requestAnimationFrame(()=>qs('#collapseBtn')?.click());closeSheets();}]);
  items.push(['Duplicate branch','Copy this idea and all children',()=>{duplicateBranch(id);closeSheets();}]);items.push(['Auto position','Return this idea to automatic layout',()=>{selectNode(id);requestAnimationFrame(()=>qs('#resetPosBtn')?.click());closeSheets();}]);const needs=flagsOf(node).includes('needs-work');items.push([needs?'Clear needs work':'Mark needs work',needs?'Remove its health flag':'Show it in Story Health',()=>{const w=ensureWriter(node),set=new Set(w.flags);needs?set.delete('needs-work'):set.add('needs-work');w.flags=[...set];save();closeSheets();scheduleSync();toast(needs?'Needs-work flag cleared':'Marked needs work');}]);
  items.forEach(([label,small,fn])=>{const b=document.createElement('button');b.type='button';b.className='writer-option';b.innerHTML=`<strong>${esc(label)}</strong><small>${esc(small)}</small>`;b.addEventListener('click',fn);grid.appendChild(b);});sheet.classList.remove('hidden');
}

function startWriterLink(source){const map=mapNow(),node=map?.nodes?.[source];if(!node)return;closeSheets();writerLinkMode={source};document.body.classList.add('writer-linking');qs('#writerLinkBanner span').textContent=`Link “${node.text||'idea'}” → tap another idea`;nodeEl(source)?.classList.add('writer-link-source');toast('Tap another idea');}
function cancelWriterLink(show=true){writerLinkMode=null;document.body.classList.remove('writer-linking');qsa('.writer-link-source').forEach(x=>x.classList.remove('writer-link-source'));if(show)toast('Link mode exited');}
function inferRelation(map,aId,bId){
  const a=map.nodes[aId],b=map.nodes[bId],at=inferType(a),bt=inferType(b);let from=aId,to=bId,label='related to',relationshipType='related',direction='none';const pair=(x,y)=>at===x&&bt===y;
  if(pair('clue','reveal')||pair('reveal','clue')){if(at==='reveal'){from=bId;to=aId;}label='clue → reveal';relationshipType='clue-reveal';direction='forward';}
  else if(pair('setup','payoff')||pair('payoff','setup')){if(at==='payoff'){from=bId;to=aId;}label='setup → payoff';relationshipType='setup-payoff';direction='forward';}
  else if((at==='character'&&bt==='scene')||(at==='scene'&&bt==='character')){if(at==='scene'){from=bId;to=aId;}label='appears in';relationshipType='character-scene';direction='forward';}
  else if((at==='scene'&&bt==='location')||(at==='location'&&bt==='scene')){if(at==='location'){from=bId;to=aId;}label='occurs at';relationshipType='scene-location';direction='forward';}
  else if(at==='conflict'||bt==='conflict'){label='conflicts with';relationshipType='conflict';direction='both';}
  else if(at==='clue'||bt==='clue'){label='supports clue';relationshipType='clue';direction='none';}
  else if(at==='character'&&bt==='character'){label='character relationship';relationshipType='character';direction='both';}
  return{from,to,label,relationshipType,direction};
}
function createWriterLink(source,target){
  const map=mapNow();if(!map||source===target||!map.nodes[source]||!map.nodes[target])return;const spec=inferRelation(map,source,target),rels=relationList(map);const exists=rels.some(r=>(r.from===spec.from&&r.to===spec.to)||(r.from===spec.to&&r.to===spec.from));if(exists){toast('Those ideas are already linked');return;}rels.push({id:uid('rel_'),from:spec.from,to:spec.to,label:spec.label,direction:spec.direction,relationshipType:spec.relationshipType,created:new Date().toISOString()});save();window.dispatchEvent(new Event('resize'));scheduleSync();toast(`${spec.label} added`);
}

function relationNeighbors(map,id){const set=new Set();relationList(map).forEach(r=>{if(r.from===id)set.add(r.to);if(r.to===id)set.add(r.from);});return set;}
function lensSetFor(map,id){
  const node=map.nodes[id],set=new Set([id]);if(!node)return set;const type=inferType(node);ancestors(map,id).forEach(n=>set.add(n.id));childrenOf(map,id).forEach(n=>set.add(n.id));relationNeighbors(map,id).forEach(x=>set.add(x));const threads=threadsOf(node);if(threads.length)Object.values(map.nodes).forEach(n=>{if(threadsOf(n).some(t=>threads.includes(t)))set.add(n.id);});if(type==='character')Object.values(map.nodes).forEach(n=>{if(n.writer?.pov===id||Array.isArray(n.writer?.characters)&&n.writer.characters.includes(id))set.add(n.id);});if(type==='subplot'||type==='chapter'||type==='beat')descendants(map,id).forEach(x=>set.add(x));if(type==='clue'||type==='setup')[...set].forEach(x=>relationNeighbors(map,x).forEach(y=>set.add(y)));return set;
}
function toggleNodeLens(id){if(activeLens?.id===id){activeLens=null;clearVisualLens();toast('Lens cleared');}else{activeThread=null;activeLens={id};applyVisualLens();toast(`${typeMeta(mapNow()?.nodes?.[id]).label} lens`);}renderLensStrip();updateContext();}
function setThreadLens(name){if(activeThread===name){activeThread=null;clearVisualLens();}else{activeLens=null;activeThread=name;applyVisualLens();}renderLensStrip();updateContext();}
function clearVisualLens(){qsa('.writer-dim,.writer-lens-hit').forEach(el=>el.classList.remove('writer-dim','writer-lens-hit'));}
function applyVisualLens(){
  const map=mapNow();if(!map)return;clearVisualLens();let keep=null;if(activeLens?.id&&map.nodes[activeLens.id])keep=lensSetFor(map,activeLens.id);else if(activeThread)keep=new Set(Object.values(map.nodes).filter(n=>threadsOf(n).includes(activeThread)).map(n=>n.id));if(!keep)return;
  qsa('#nodes .node').forEach(el=>el.classList.add(keep.has(el.dataset.id)?'writer-lens-hit':'writer-dim'));qsa('#edges .edge,#edges .edge-hit').forEach(el=>{const child=el.dataset.child,parent=map.nodes[child]?.parentId;el.classList.add(keep.has(child)&&keep.has(parent)?'writer-lens-hit':'writer-dim');});relationList(map).forEach(r=>{const g=qs(`#v2LinksLayer .v2-link-group[data-link-id="${CSS.escape(r.id||'')}"]`);if(g)g.classList.add(keep.has(r.from)&&keep.has(r.to)?'writer-lens-hit':'writer-dim');});
}

function issueForNode(map,node){
  const issues=[],type=inferType(node),rels=relationList(map).filter(r=>r.from===node.id||r.to===node.id),flags=flagsOf(node);if(flags.includes('needs-work'))issues.push({severity:'warn',message:'Marked needs work'});if(type==='clue'&&!rels.some(r=>r.relationshipType==='clue-reveal'||/reveal|payoff/i.test(r.label||'')))issues.push({severity:'warn',message:'Clue has no reveal or payoff link'});if(type==='setup'&&!rels.some(r=>r.relationshipType==='setup-payoff'||/payoff/i.test(r.label||'')))issues.push({severity:'warn',message:'Setup has no payoff link'});if(type==='character'&&!rels.length)issues.push({severity:'warn',message:'Character has no story relationships'});if(type==='beat'&&node.targetMapId){const target=projectNow()?.sessions?.[node.targetMapId],root=target?.nodes?.[target.rootId];if(target&&root&&!childrenOf(target,root.id).length&&!root.description?.trim())issues.push({severity:'info',message:'Beat has no brainstormed ideas yet'});}return issues;
}
function healthIssues(map){const out=[];if(!map)return out;Object.values(map.nodes).forEach(node=>issueForNode(map,node).forEach(issue=>out.push({...issue,nodeId:node.id,title:node.text||'Untitled'})));relationList(map).forEach(r=>{if(!map.nodes[r.from]||!map.nodes[r.to])out.push({severity:'critical',nodeId:map.nodes[r.from]?r.from:(map.nodes[r.to]?r.to:null),title:'Broken relationship',message:'A relationship points to a missing idea',relationshipId:r.id});});return out;}
function toggleHealth(force){healthOpen=force===undefined?!healthOpen:!!force;qs('#writerHealthPanel')?.classList.toggle('hidden',!healthOpen);renderHealth();updateContext();}
function renderHealth(){
  const map=mapNow(),list=qs('#writerHealthList');if(!list||!map)return;const issues=healthIssues(map);list.innerHTML='';qsa('#nodes .node').forEach(el=>el.classList.remove('writer-health-issue','writer-health-critical'));if(!issues.length){list.innerHTML='<div class="writer-health-empty">No obvious structural issues found.</div>';return;}const byNode=new Map();issues.forEach(issue=>{if(issue.nodeId){if(!byNode.has(issue.nodeId))byNode.set(issue.nodeId,[]);byNode.get(issue.nodeId).push(issue);}});if(healthOpen)byNode.forEach((arr,id)=>{const el=nodeEl(id);if(el){el.classList.add('writer-health-issue');if(arr.some(i=>i.severity==='critical'))el.classList.add('writer-health-critical');}});issues.forEach(issue=>{const b=document.createElement('button');b.type='button';b.className='writer-health-item';b.innerHTML=`<strong>${esc(issue.title)}</strong><span>${esc(issue.message)}</span>`;b.addEventListener('click',()=>{if(issue.nodeId){selectNode(issue.nodeId,true);activeLens={id:issue.nodeId};activeThread=null;applyVisualLens();renderLensStrip();}});list.appendChild(b);});
}

function duplicateBranch(id){
  const map=mapNow(),root=map?.nodes?.[id];if(!root||id===map.rootId){toast('Duplicate a branch below the root');return;}const ids=[...descendants(map,id)],idSet=new Set(ids),mapping=new Map(ids.map(old=>[old,uid('i_')]));ids.forEach(old=>{const src=map.nodes[old],clone=JSON.parse(JSON.stringify(src)),newId=mapping.get(old);clone.id=newId;clone.created=new Date().toISOString();clone.parentId=old===id?src.parentId:mapping.get(src.parentId);if(old===id)clone.text=`${src.text||'Untitled'} copy`;if(Number.isFinite(clone.x))clone.x+=48;if(Number.isFinite(clone.y))clone.y+=48;map.nodes[newId]=clone;});relationList(map).filter(r=>idSet.has(r.from)&&idSet.has(r.to)).forEach(r=>{map.relationships.push({...JSON.parse(JSON.stringify(r)),id:uid('rel_'),from:mapping.get(r.from),to:mapping.get(r.to),created:new Date().toISOString()});});const newRoot=mapping.get(id);refreshMap(newRoot);toast('Branch duplicated');
}

function decorateNodes(){
  const map=mapNow();if(!map)return;qsa('#nodes .node').forEach(el=>{const node=map.nodes[el.dataset.id];if(!node)return;const body=qs('circle.body',el),r=Number(body?.getAttribute('r'))||58,meta=typeMeta(node);let badge=qs('.writer-type-badge',el);if(!badge){badge=document.createElementNS(NS,'g');badge.setAttribute('class','writer-type-badge');const c=document.createElementNS(NS,'circle'),t=document.createElementNS(NS,'text'),title=document.createElementNS(NS,'title');c.setAttribute('r','11');t.setAttribute('y','.5');badge.append(c,t,title);el.appendChild(badge);}badge.setAttribute('transform',`translate(${-r*.68} ${-r*.68})`);qs('text',badge).textContent=meta.glyph;qs('title',badge).textContent=meta.label;let thread=qs('.writer-thread-badge',el);const count=threadsOf(node).length;if(count){if(!thread){thread=document.createElementNS(NS,'g');thread.setAttribute('class','writer-thread-badge');const c=document.createElementNS(NS,'circle'),title=document.createElementNS(NS,'title');c.setAttribute('r','7');thread.append(c,title);el.appendChild(thread);}thread.setAttribute('transform',`translate(${r*.68} ${-r*.68})`);qs('title',thread).textContent=threadsOf(node).join(', ');}else thread?.remove();});
}
function enhanceNavigator(){const map=mapNow();if(!map)return;qsa('#v2Outline .v2-outline-row').forEach(row=>{const node=map.nodes[row.dataset.id],meta=qs('.v2-outline-meta',row);if(!node||!meta)return;qsa('[data-writer-nav]',meta).forEach(x=>x.remove());const type=document.createElement('span');type.dataset.writerNav='type';type.textContent=typeMeta(node).label;meta.prepend(type);threadsOf(node).slice(0,2).forEach(name=>{const t=document.createElement('span');t.dataset.writerNav='thread';t.textContent=name;meta.appendChild(t);});});}
function updateRapidfireContext(){
  const dialog=qs('#rapidfireDialog');if(!dialog||dialog.classList.contains('hidden'))return;const map=mapNow();let id=currentSelectedId();const parentText=qs('#rapidfireParent')?.textContent||'';if(!id&&parentText){const match=Object.values(map?.nodes||{}).find(n=>parentText.includes(n.text||'\u0000'));if(match)id=match.id;}const node=map?.nodes?.[id],type=inferType(node),hint=RAPID_HINTS[type]||RAPID_HINTS.general,input=qs('#rapidfireIdea'),desc=qs('#rapidfireDescription');if(input)input.placeholder=hint;if(desc)desc.placeholder=type==='scene'?'Optional: what changes in the scene?':'Optional short note';const title=qs('#rapidfireTitle');if(title&&node)title.textContent=type==='beat'?'Rapidfire this beat':`Rapidfire · ${typeMeta(node).label}`;
}
function restoreRapidfireTitle(){const dialog=qs('#rapidfireDialog');if(dialog?.classList.contains('hidden')){const title=qs('#rapidfireTitle');if(title)title.textContent='Rapidfire';}}
function childDefaultType(parent){const t=inferType(parent);if(t==='chapter')return'scene';if(t==='subplot')return'scene';if(t==='scene'||t==='character'||t==='beat')return'general';return null;}
function detectNewNodes(){const map=mapNow();if(!map)return;if(lastMapId!==map.id){lastMapId=map.id;knownNodeIds=new Set(Object.keys(map.nodes));return;}let changed=false;Object.values(map.nodes).forEach(node=>{if(knownNodeIds.has(node.id))return;knownNodeIds.add(node.id);const type=childDefaultType(map.nodes[node.parentId]);if(type){ensureWriter(node).type=type;changed=true;}});if(changed)save();}
function renderLensStrip(){
  const map=mapNow(),strip=qs('#writerLensStrip');if(!strip||!map)return;const threads=allThreads(map),parts=[];if(activeLens?.id&&map.nodes[activeLens.id])parts.push(`<span class="writer-strip-label">Lens</span><button class="writer-thread-chip active" data-clear-lens="1">${esc(map.nodes[activeLens.id].text||'Idea')}</button>`);if(threads.length)parts.push('<span class="writer-strip-label">Threads</span>',...threads.map(name=>`<button class="writer-thread-chip${activeThread===name?' active':''}" data-thread="${esc(name)}">${esc(name)}</button>`));if(activeLens||activeThread)parts.push('<button class="writer-clear-chip" data-clear-all="1">Clear</button>');strip.innerHTML=parts.join('');strip.classList.toggle('hidden',!parts.length);qsa('[data-thread]',strip).forEach(b=>b.addEventListener('click',()=>setThreadLens(b.dataset.thread)));qsa('[data-clear-lens],[data-clear-all]',strip).forEach(b=>b.addEventListener('click',()=>{activeLens=null;activeThread=null;clearVisualLens();renderLensStrip();updateContext();}));
}
function updateContext(){
  const map=mapNow(),id=currentSelectedId(),bar=qs('#writerContext');selected=id;if(!map||!id||!map.nodes[id]||qs('#app')?.classList.contains('hidden')){bar?.classList.add('hidden');return;}const node=map.nodes[id],type=inferType(node),meta=typeMeta(node);bar.classList.remove('hidden');const typeBtn=qs('[data-writer-action="type"]',bar),add=qs('[data-writer-action="add"] .writer-label',bar),lens=qs('[data-writer-action="lens"]',bar),branch=qs('[data-writer-action="branch"] .writer-label',bar);qs('.writer-glyph',typeBtn).textContent=meta.glyph;qs('.writer-label',typeBtn).textContent=meta.label;add.textContent=type==='chapter'||type==='subplot'?'Scene':'Idea';lens.classList.toggle('active',activeLens?.id===id);qs('.writer-label',lens).textContent=type==='character'?'Character':type==='clue'?'Clue':type==='scene'?'Scene':'Lens';branch.textContent=node.targetMapId?'Ideas':'Branch';qs('[data-writer-action="health"]',bar)?.classList.toggle('active',healthOpen);positionContext();
}
function positionContext(){cancelAnimationFrame(positionRaf);positionRaf=requestAnimationFrame(()=>{const bar=qs('#writerContext');if(!bar||bar.classList.contains('hidden')||isMobile())return;const el=nodeEl(currentSelectedId());if(!el)return;const r=el.getBoundingClientRect(),w=bar.offsetWidth||560,h=bar.offsetHeight||48;let left=r.left+r.width/2,top=r.top-h-10;left=Math.max(w/2+10,Math.min(innerWidth-w/2-10,left));if(top<74)top=r.bottom+10;bar.style.left=`${left}px`;bar.style.top=`${top}px`;});}
function scheduleSync(){if(syncRaf)return;syncRaf=requestAnimationFrame(()=>{syncRaf=0;sync();});}
function sync(){const map=mapNow();if(!map)return;detectNewNodes();decorateNodes();updateContext();renderLensStrip();enhanceNavigator();updateRapidfireContext();restoreRapidfireTitle();if(activeLens||activeThread)applyVisualLens();if(healthOpen)renderHealth();}

function bind(){
  const nodes=qs('#nodes');if(nodes){nodes.addEventListener('pointerdown',e=>{if(!writerLinkMode)return;const targetEl=e.target.closest?.('.node');if(!targetEl)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();const target=targetEl.dataset.id,source=writerLinkMode.source;if(target===source){toast('Choose a different idea');return;}cancelWriterLink(false);createWriterLink(source,target);},true);observer=new MutationObserver(scheduleSync);observer.observe(nodes,{childList:true,subtree:true,attributes:true,attributeFilter:['class','transform','r']});}
  const viewport=qs('#viewport');if(viewport){viewportObserver=new MutationObserver(()=>{positionContext();if(activeLens||activeThread)applyVisualLens();});viewportObserver.observe(viewport,{attributes:true,attributeFilter:['transform']});}
  const rapid=qs('#rapidfireDialog');if(rapid)new MutationObserver(scheduleSync).observe(rapid,{attributes:true,attributeFilter:['class']});window.addEventListener('resize',()=>{positionContext();scheduleSync();},{passive:true});qs('#workspace')?.addEventListener('pointerup',positionContext,{passive:true});qs('#workspace')?.addEventListener('wheel',positionContext,{passive:true});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&writerLinkMode){e.preventDefault();e.stopImmediatePropagation();cancelWriterLink();return;}if(e.key==='Escape'&&!qsa('.writer-sheet:not(.hidden)').length&&healthOpen)toggleHealth(false);},true);
}
function boot(){injectStyles();buildUi();bind();const map=mapNow();if(map){lastMapId=map.id;knownNodeIds=new Set(Object.keys(map.nodes));}scheduleSync();setInterval(()=>{if(mapNow()?.id!==lastMapId)scheduleSync();},1200);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.WriterMap={types:TYPES,focus:id=>toggleNodeLens(id||currentSelectedId()),health:()=>toggleHealth(),link:()=>startWriterLink(currentSelectedId())};
})();