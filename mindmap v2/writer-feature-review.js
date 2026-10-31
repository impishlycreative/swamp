(()=>{'use strict';
if(window.__SWAMP_WRITER_FEATURE_REVIEW__)return;
window.__SWAMP_WRITER_FEATURE_REVIEW__=true;

const NS='http://www.w3.org/2000/svg';
const qs=(s,r=document)=>r.querySelector(s);
const qsa=(s,r=document)=>[...r.querySelectorAll(s)];
const app=()=>window.MindMapApp;
const mapNow=()=>app()?.getCurrentMap?.()||null;
const projectNow=()=>app()?.getProject?.()||null;
const save=()=>app()?.save?.();
const isMobile=()=>matchMedia('(max-width:850px),(hover:none) and (pointer:coarse)').matches||(navigator.maxTouchPoints>0&&Math.min(screen.width,screen.height)<900);

const PICKER_LABELS=new Set(['Idea','Scene','Chapter','Character','Location','Clue','Reveal','Subplot','Research','Setup','Payoff']);
const TYPE_HELP={
  Idea:'General thought or supporting idea.',
  Scene:'Scene-specific Lens, Rapidfire and story links.',
  Chapter:'New children default to Scene.',
  Character:'Highlights appearances, relationships and arc connections.',
  Location:'Connects scenes to where they happen.',
  Clue:'Supports clue → reveal tracking and Health checks.',
  Reveal:'Completes clue relationships.',
  Subplot:'Tracks a distinct story strand without forcing scene children.',
  Research:'Keeps questions and facts separate from story content.',
  Setup:'Tracks something deliberately planted for later.',
  Payoff:'Completes a setup relationship.'
};
const RAPID_PROMPTS={
  general:[['Possibility','What else could happen?'],['Consequence','What changes because of this?'],['Question','What still needs deciding?']],
  scene:[['Obstacle','What gets in the way?'],['Reversal','What changes direction?'],['Consequence','What changes after this scene?']],
  chapter:[['Scene','What scene belongs here?'],['Turn','What changes in this chapter?'],['Purpose','Why does this chapter need to exist?']],
  character:[['Want','What do they want right now?'],['Fear','What are they afraid of?'],['Secret','What are they hiding?'],['Contradiction','What does not quite fit?'],['Choice','What hard choice could they make?']],
  location:[['Detail','What makes this place memorable?'],['Danger','What can go wrong here?'],['History','What happened here before?'],['Story use','Why does the story need this place?']],
  clue:[['Discovery','How is the clue found?'],['Misdirection','How could it be misunderstood?'],['Meaning','What does it actually mean?'],['Payoff','Where does it lead?']],
  reveal:[['Discovery','Who learns the truth?'],['Change','What changes once it is known?'],['Consequence','What happens because of the reveal?']],
  subplot:[['Complication','What makes this strand harder?'],['Connection','Where does it touch the main story?'],['Turn','What changes this subplot?']],
  research:[['Question','What needs verifying?'],['Fact','What fact do you need?'],['Source','Where could you confirm it?']],
  setup:[['Plant','What should the reader notice?'],['Promise','What expectation are you creating?'],['Subtlety','How can this be planted naturally?']],
  payoff:[['Consequence','What does the setup cause?'],['Reveal','What becomes clear now?'],['Reversal','How does the payoff change things?']],
  beat:[['Fulfil beat','What could satisfy this beat?'],['Complicate','What makes this beat less obvious?'],['Plant/payoff','What could this beat set up or pay off?']]
};

let threadRaf=0;
let relationRaf=0;
let nodeObserver=null;
let lensObserver=null;
let moreObserver=null;
let rapidObserver=null;
let knownNodeIds=new Set();
const pendingChildChecks=new Set();
let lastMapId=null;
let healthOpen=false;

function toast(message){const el=qs('#toast');if(!el)return;el.textContent=message;el.classList.add('show');clearTimeout(el._reviewToast);el._reviewToast=setTimeout(()=>el.classList.remove('show'),1700);}
function esc(s){return String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));}
function nodeType(node){
  if(!node)return'general';
  if(node.targetMapId||Number.isFinite(node.storyBeatIndex))return'beat';
  const t=node.writer?.type;
  if(t)return t;
  const text=(node.text||'').toLowerCase();
  if(/^chapter\b/.test(text))return'chapter';
  if(/\b(clue|evidence)\b/.test(text))return'clue';
  if(/\b(reveal|revelation)\b/.test(text))return'reveal';
  return'general';
}
function childrenOf(map,id){return Object.values(map?.nodes||{}).filter(n=>n.parentId===id);}
function threadsOf(node){return Array.isArray(node?.writer?.threads)?node.writer.threads.filter(Boolean):[];}
function relationList(map){return Array.isArray(map?.relationships)?map.relationships:[];}
function selectedId(){return qs('#nodes .node.selected')?.dataset.id||null;}
function selectNode(id,center=false){
  const el=qs(`#nodes .node[data-id="${CSS.escape(id)}"]`);if(!el){toast('Open that branch first');return false;}
  el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));
  if(center)requestAnimationFrame(()=>qs('#centerBtn')?.click());
  return true;
}
function nodePosition(id){
  const el=qs(`#nodes .node[data-id="${CSS.escape(id)}"]`);if(!el)return null;
  const m=(el.getAttribute('transform')||'').match(/translate\(\s*(-?[\d.]+)[ ,]+(-?[\d.]+)\s*\)/);if(!m)return null;
  return{x:Number(m[1]),y:Number(m[2])};
}
function hierarchyOrder(map){
  const order=new Map(),seen=new Set();let i=0;
  const walk=id=>{if(!id||seen.has(id)||!map.nodes[id])return;seen.add(id);order.set(id,i++);childrenOf(map,id).forEach(n=>walk(n.id));};
  walk(map.rootId);Object.keys(map.nodes).forEach(walk);return order;
}

function injectStyles(){
  if(qs('#writerFeatureReviewStyles'))return;
  const style=document.createElement('style');style.id='writerFeatureReviewStyles';style.textContent=`
    #writerContext [data-writer-action="type"],#writerContext [data-writer-action="thread"]{display:none!important}
    .writer-type-badge,.writer-thread-badge{pointer-events:auto!important;cursor:pointer}
    .writer-type-badge:hover circle,.writer-thread-badge:hover circle{stroke-width:2.5}
    #writerThreadPathLayer{pointer-events:none}
    .writer-thread-path-under{fill:none;stroke:rgba(255,255,255,.9);stroke-width:10;stroke-linecap:round;stroke-linejoin:round}
    .writer-thread-path{fill:none;stroke:#725b82;stroke-width:4;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:12 7;opacity:.92}
    .writer-thread-end{fill:#725b82;stroke:#fff;stroke-width:3}
    .writer-thread-single{fill:none;stroke:#725b82;stroke-width:4;stroke-dasharray:6 5}
    .v2-link-group.review-clue-reveal .v2-link-line{stroke:#a36f1d!important;stroke-dasharray:8 5!important;stroke-width:3!important}
    .v2-link-group.review-setup-payoff .v2-link-line{stroke:#365f4d!important;stroke-width:3.4!important}
    .v2-link-group.review-character-scene .v2-link-line{stroke:#725b82!important;stroke-dasharray:3 5!important}
    .v2-link-group.review-scene-location .v2-link-line{stroke:#557a8c!important;stroke-dasharray:10 5!important}
    .v2-link-group.review-generic .v2-link-line{opacity:.78}
    .writer-rapid-prompts{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin:8px 0 4px}
    .writer-rapid-prompts>span{font-size:.68rem;font-weight:900;color:var(--muted);text-transform:uppercase;letter-spacing:.05em}
    .writer-rapid-prompt{border:1px solid rgba(54,95,77,.2);background:#fff;color:#365f4d;border-radius:999px;min-height:34px;padding:5px 10px;font:inherit;font-size:.72rem;font-weight:850;cursor:pointer}
    .writer-rapid-prompt:hover,.writer-rapid-prompt:focus-visible{background:#e1ece6;outline:0}
    #writerHealthPanel.review-health .writer-health-head{position:sticky;top:-13px;background:var(--writer-panel);padding:12px 0 8px;z-index:1}
    #writerHealthPanel.review-health .review-health-note{font-size:.68rem;color:var(--muted);margin:0 0 8px;line-height:1.35}
    #writerHealthPanel.review-health .writer-health-item.info{background:#eef1f2}
    #writerHealthPanel.review-health .writer-health-item.warn{background:#f4eee2}
    #writerHealthPanel.review-health .writer-health-item.critical{background:#f4e5e3}
    #v2Navigator .v2-nav-foot.review-navigation-only{display:block;color:var(--muted);font-size:.72rem;line-height:1.35;padding-top:10px}
    @media(max-width:850px),(hover:none) and (pointer:coarse){
      .writer-type-badge,.writer-thread-badge{pointer-events:none!important}
    }
  `;document.head.appendChild(style);
}

function refineContextBar(){
  const bar=qs('#writerContext');if(!bar)return;
  const more=qs('[data-writer-action="branch"] .writer-label',bar);if(more&&more.textContent.trim()==='Branch')more.textContent='More';
}

function pruneTypePicker(){
  const sheet=qs('#writerTypeSheet');if(!sheet||sheet.classList.contains('hidden'))return;
  qsa('.writer-option',sheet).forEach(btn=>{
    const strong=qs('strong',btn);if(!strong)return;
    const text=strong.textContent.replace(/^[•SCP L?RSP↑↓]+\s*/,'').trim();
    const label=[...PICKER_LABELS].find(x=>strong.textContent.trim().endsWith(x))||text;
    if(!PICKER_LABELS.has(label)){btn.remove();return;}
    if(!qs('small',btn)&&TYPE_HELP[label]){const small=document.createElement('small');small.textContent=TYPE_HELP[label];btn.appendChild(small);}
  });
}
function openTypePicker(id){
  if(!selectNode(id,false))return;
  requestAnimationFrame(()=>{qs('#writerContext [data-writer-action="type"]')?.click();requestAnimationFrame(pruneTypePicker);});
}
function openThreadPicker(id){
  if(!selectNode(id,false))return;
  requestAnimationFrame(()=>qs('#writerContext [data-writer-action="thread"]')?.click());
}
function bindBadgeActions(){
  document.addEventListener('click',e=>{
    const type=e.target.closest?.('#nodes .writer-type-badge');
    if(type&&!isMobile()){
      const id=type.closest('.node')?.dataset.id;if(!id)return;
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();openTypePicker(id);return;
    }
    const thread=e.target.closest?.('#nodes .writer-thread-badge');
    if(thread&&!isMobile()){
      const id=thread.closest('.node')?.dataset.id;if(!id)return;
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();openThreadPicker(id);
    }
  },true);
}

function enhanceMore(){
  const sheet=qs('#writerBranchSheet');if(!sheet||sheet.classList.contains('hidden'))return;
  const grid=qs('.writer-option-grid',sheet);if(!grid)return;
  const id=sheet.dataset.nodeId||selectedId();
  if(!qs('[data-review-more="thread"]',grid)){
    const b=document.createElement('button');b.type='button';b.className='writer-option';b.dataset.reviewMore='thread';b.innerHTML='<strong>Story thread</strong><small>Assign or change narrative strands</small>';
    b.addEventListener('click',()=>{sheet.classList.add('hidden');openThreadPicker(id);});grid.prepend(b);
  }
  if(isMobile()&&!qs('[data-review-more="type"]',grid)){
    const b=document.createElement('button');b.type='button';b.className='writer-option';b.dataset.reviewMore='type';b.innerHTML='<strong>Idea type</strong><small>Scene, Character, Clue, Chapter and more</small>';
    b.addEventListener('click',()=>{sheet.classList.add('hidden');openTypePicker(id);});grid.prepend(b);
  }
  qsa('.writer-option strong',grid).forEach(strong=>{
    if(strong.textContent.trim()==='Duplicate branch'){
      strong.textContent='Explore alternative';const small=strong.parentElement.querySelector('small');if(small)small.textContent='Duplicate this branch and its internal links';
    }
  });
  const health=qs('[data-writer-refine="health"]',grid);
  if(health){const small=qs('small',health);if(small&&small.textContent!=='Check objective structural issues only')small.textContent='Check objective structural issues only';}
}
function watchMore(){
  const sheet=qs('#writerBranchSheet');if(!sheet||moreObserver)return;
  moreObserver=new MutationObserver(()=>{enhanceMore();});moreObserver.observe(sheet,{attributes:true,attributeFilter:['class'],childList:true,subtree:true});
}

function activeThread(){return qs('#writerLensStrip .writer-thread-chip.active[data-thread]')?.dataset.thread||null;}
function ensureThreadLayer(){
  const viewport=qs('#viewport');if(!viewport)return null;
  let layer=qs('#writerThreadPathLayer');if(!layer){layer=document.createElementNS(NS,'g');layer.id='writerThreadPathLayer';viewport.insertBefore(layer,qs('#nodes'));}return layer;
}
function threadPoints(map,name){
  const order=hierarchyOrder(map);
  return Object.values(map.nodes).filter(n=>threadsOf(n).includes(name)).sort((a,b)=>{
    if(Number.isFinite(a.storyBeatIndex)&&Number.isFinite(b.storyBeatIndex))return a.storyBeatIndex-b.storyBeatIndex;
    return (order.get(a.id)??99999)-(order.get(b.id)??99999);
  }).map(n=>({node:n,pos:nodePosition(n.id)})).filter(x=>x.pos);
}
function smoothPath(points){
  if(!points.length)return'';if(points.length===1)return'';let d=`M ${points[0].pos.x} ${points[0].pos.y}`;
  for(let i=1;i<points.length;i++){
    const a=points[i-1].pos,b=points[i].pos,mid=(a.x+b.x)/2;d+=` C ${mid} ${a.y} ${mid} ${b.y} ${b.x} ${b.y}`;
  }return d;
}
function drawThreadPath(){
  threadRaf=0;const layer=ensureThreadLayer(),map=mapNow(),name=activeThread();if(!layer)return;layer.innerHTML='';if(!map||!name)return;
  const points=threadPoints(map,name);if(!points.length)return;
  if(points.length===1){const c=document.createElementNS(NS,'circle');c.setAttribute('class','writer-thread-single');c.setAttribute('cx',points[0].pos.x);c.setAttribute('cy',points[0].pos.y);c.setAttribute('r','78');layer.appendChild(c);return;}
  const d=smoothPath(points),under=document.createElementNS(NS,'path'),line=document.createElementNS(NS,'path');under.setAttribute('class','writer-thread-path-under');under.setAttribute('d',d);line.setAttribute('class','writer-thread-path');line.setAttribute('d',d);layer.append(under,line);
  [points[0],points[points.length-1]].forEach(p=>{const c=document.createElementNS(NS,'circle');c.setAttribute('class','writer-thread-end');c.setAttribute('cx',p.pos.x);c.setAttribute('cy',p.pos.y);c.setAttribute('r','7');layer.appendChild(c);});
}
function scheduleThreadPath(){if(threadRaf)return;threadRaf=requestAnimationFrame(drawThreadPath);}

function relationClass(rel){
  const t=rel.relationshipType||'';const label=(rel.label||'').toLowerCase();
  if(t==='clue-reveal'||/clue.*reveal/.test(label))return'review-clue-reveal';
  if(t==='setup-payoff'||/setup.*payoff/.test(label))return'review-setup-payoff';
  if(t==='character-scene'||/appears in/.test(label))return'review-character-scene';
  if(t==='scene-location'||/occurs at/.test(label))return'review-scene-location';
  return'review-generic';
}
function decorateRelationships(){
  relationRaf=0;const map=mapNow();if(!map)return;
  const byId=new Map(relationList(map).map(r=>[r.id,r]));
  qsa('#v2LinksLayer .v2-link-group').forEach(g=>{
    g.classList.remove('review-clue-reveal','review-setup-payoff','review-character-scene','review-scene-location','review-generic');
    const rel=byId.get(g.dataset.linkId);if(!rel)return;g.classList.add(relationClass(rel));
    let title=qs('title',g);if(!title){title=document.createElementNS(NS,'title');g.appendChild(title);}const a=map.nodes[rel.from]?.text||'Idea',b=map.nodes[rel.to]?.text||'Idea';title.textContent=`${a} — ${rel.label||'related to'} — ${b}`;
  });
}
function scheduleRelationships(){if(relationRaf)return;relationRaf=requestAnimationFrame(decorateRelationships);}

function rapidType(){const map=mapNow(),id=selectedId(),node=map?.nodes?.[id];return nodeType(node);}
function ensureRapidPrompts(){
  const dialog=qs('#rapidfireDialog'),form=qs('#rapidfireForm');if(!dialog||!form)return;
  let row=qs('#writerRapidPrompts');if(!row){row=document.createElement('div');row.id='writerRapidPrompts';row.className='writer-rapid-prompts';const firstField=qs('.field',form);firstField?form.insertBefore(row,firstField):form.prepend(row);}
  if(dialog.classList.contains('hidden'))return;
  const type=rapidType(),items=RAPID_PROMPTS[type]||RAPID_PROMPTS.general;row.innerHTML='<span>Brainstorm</span>';
  items.forEach(([label,prompt])=>{const b=document.createElement('button');b.type='button';b.className='writer-rapid-prompt';b.textContent=label;b.title=prompt;b.addEventListener('click',()=>{const input=qs('#rapidfireIdea');if(input){input.placeholder=prompt;input.focus();}});row.appendChild(b);});
}

function objectiveIssues(map){
  const issues=[];if(!map)return issues;const rels=relationList(map);
  Object.values(map.nodes).forEach(node=>{
    const type=nodeType(node),mine=rels.filter(r=>r.from===node.id||r.to===node.id),flags=Array.isArray(node.writer?.flags)?node.writer.flags:[];
    if(flags.includes('needs-work'))issues.push({severity:'warn',nodeId:node.id,title:node.text||'Untitled',message:'Marked needs work'});
    if(type==='clue'&&!mine.some(r=>r.relationshipType==='clue-reveal'||/reveal|payoff/i.test(r.label||'')))issues.push({severity:'warn',nodeId:node.id,title:node.text||'Clue',message:'Clue has no reveal or payoff relationship'});
    if(type==='setup'&&!mine.some(r=>r.relationshipType==='setup-payoff'||/payoff/i.test(r.label||'')))issues.push({severity:'warn',nodeId:node.id,title:node.text||'Setup',message:'Setup has no payoff relationship'});
    if(type==='beat'&&node.targetMapId){const target=projectNow()?.sessions?.[node.targetMapId];if(target?.nodes&&Object.keys(target.nodes).length<=1)issues.push({severity:'info',nodeId:node.id,title:node.text||'Story beat',message:'Beat has no brainstormed ideas yet'});}
  });
  rels.forEach(r=>{if(!map.nodes[r.from]||!map.nodes[r.to])issues.push({severity:'critical',nodeId:map.nodes[r.from]?r.from:(map.nodes[r.to]?r.to:null),title:'Broken relationship',message:'Relationship points to a missing idea'});});
  const threads=new Map();Object.values(map.nodes).forEach(n=>threadsOf(n).forEach(t=>{if(!threads.has(t))threads.set(t,[]);threads.get(t).push(n);}));
  threads.forEach((nodes,name)=>{if(nodes.length===1)issues.push({severity:'info',nodeId:nodes[0].id,title:`Thread: ${name}`,message:'Thread currently has only one mapped point'});});
  return issues;
}
function renderReviewHealth(){
  const panel=qs('#writerHealthPanel'),map=mapNow();if(!panel||!map)return;panel.classList.add('review-health');
  let head=qs('.writer-health-head',panel);if(!head){head=document.createElement('div');head.className='writer-health-head';panel.prepend(head);}head.innerHTML='<strong>Story Health</strong><button class="writer-close" type="button" aria-label="Close">×</button>';head.querySelector('button').addEventListener('click',()=>toggleReviewHealth(false));
  let note=qs('.review-health-note',panel);if(!note){note=document.createElement('p');note.className='review-health-note';head.insertAdjacentElement('afterend',note);}note.textContent='Structural facts only — no judgments about writing quality.';
  let list=qs('#writerHealthList',panel);if(!list){list=document.createElement('div');list.id='writerHealthList';panel.appendChild(list);}list.innerHTML='';
  qsa('#nodes .node').forEach(el=>el.classList.remove('writer-health-issue','writer-health-critical'));
  const issues=objectiveIssues(map);if(!issues.length){list.innerHTML='<div class="writer-health-empty">No structural issues found.</div>';return;}
  issues.forEach(issue=>{
    if(issue.nodeId){const el=qs(`#nodes .node[data-id="${CSS.escape(issue.nodeId)}"]`);el?.classList.add('writer-health-issue');if(issue.severity==='critical')el?.classList.add('writer-health-critical');}
    const b=document.createElement('button');b.type='button';b.className=`writer-health-item ${issue.severity}`;b.innerHTML=`<strong>${esc(issue.title)}</strong><span>${esc(issue.message)}</span>`;b.addEventListener('click',()=>{if(issue.nodeId){toggleReviewHealth(false);selectNode(issue.nodeId,true);}});list.appendChild(b);
  });
}
function toggleReviewHealth(force){
  const panel=qs('#writerHealthPanel');if(!panel)return;healthOpen=force===undefined?!healthOpen:!!force;panel.classList.toggle('hidden',!healthOpen);if(healthOpen)renderReviewHealth();else qsa('#nodes .node').forEach(el=>el.classList.remove('writer-health-issue','writer-health-critical'));
}
function overrideHealth(){if(window.WriterMap)window.WriterMap.health=()=>toggleReviewHealth();}

function correctSmartChildren(){
  const map=mapNow();if(!map)return;
  if(lastMapId!==map.id){lastMapId=map.id;knownNodeIds=new Set(Object.keys(map.nodes));pendingChildChecks.clear();return;}
  Object.values(map.nodes).forEach(node=>{
    if(knownNodeIds.has(node.id)||pendingChildChecks.has(node.id))return;
    knownNodeIds.add(node.id);pendingChildChecks.add(node.id);
    setTimeout(()=>{
      pendingChildChecks.delete(node.id);
      const current=mapNow(),fresh=current?.nodes?.[node.id];if(!current||current.id!==map.id||!fresh)return;
      const parent=current.nodes[fresh.parentId];
      if(fresh.writer?.type==='scene'&&nodeType(parent)==='subplot'&&(fresh.text==='New idea'||!fresh.text?.trim())){
        fresh.writer.type='general';save();app()?.setCurrentMap?.(current.id,false,false);
      }
    },140);
  });
}

function simplifyNavigator(){
  const foot=qs('#v2Navigator .v2-nav-foot');if(!foot)return;if(foot.classList.contains('review-navigation-only'))return;foot.classList.add('review-navigation-only');foot.textContent='Choose an idea to center it on the map. Use the map itself for writing actions.';
}

function observeUi(){
  const nodes=qs('#nodes');if(nodes&&!nodeObserver){nodeObserver=new MutationObserver(()=>{correctSmartChildren();scheduleThreadPath();scheduleRelationships();refineContextBar();});nodeObserver.observe(nodes,{childList:true,subtree:true,attributes:true,attributeFilter:['class','transform']});}
  const lens=qs('#writerLensStrip');if(lens&&!lensObserver){lensObserver=new MutationObserver(()=>{scheduleThreadPath();});lensObserver.observe(lens,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});}
  const rapid=qs('#rapidfireDialog');if(rapid&&!rapidObserver){rapidObserver=new MutationObserver(ensureRapidPrompts);rapidObserver.observe(rapid,{attributes:true,attributeFilter:['class']});}
  const links=qs('#v2LinksLayer');if(links&&!links._reviewObserved){new MutationObserver(scheduleRelationships).observe(links,{childList:true,subtree:true});links._reviewObserved=true;}
}

function tick(){
  injectStyles();refineContextBar();pruneTypePicker();enhanceMore();watchMore();ensureRapidPrompts();overrideHealth();simplifyNavigator();observeUi();correctSmartChildren();scheduleThreadPath();scheduleRelationships();
}
function boot(){
  bindBadgeActions();
  const map=mapNow();if(map){lastMapId=map.id;knownNodeIds=new Set(Object.keys(map.nodes));}
  tick();let attempts=0;const timer=setInterval(()=>{tick();if(++attempts>40)clearInterval(timer);},100);
  setInterval(()=>{const id=mapNow()?.id||null;if(id!==lastMapId){lastMapId=id;knownNodeIds=new Set(Object.keys(mapNow()?.nodes||{}));scheduleThreadPath();scheduleRelationships();}simplifyNavigator();overrideHealth();},900);
  window.addEventListener('resize',()=>{scheduleThreadPath();scheduleRelationships();},{passive:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();