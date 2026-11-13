(()=>{'use strict';
if(window.__SWAMP_CONSOLIDATION__)return;
window.__SWAMP_CONSOLIDATION__=true;

const qs=(s,r=document)=>r.querySelector(s);
const qsa=(s,r=document)=>[...r.querySelectorAll(s)];
const app=()=>window.MindMapApp;
const mapNow=()=>app()?.getCurrentMap?.()||null;
const uid=(prefix='d_')=>`${prefix}${Math.random().toString(36).slice(2,9)}${Date.now().toString(36).slice(-5)}`;
const now=()=>new Date().toISOString();
const isMobile=()=>matchMedia('(max-width:850px),(hover:none) and (pointer:coarse)').matches||(navigator.maxTouchPoints>0&&Math.min(screen.width,screen.height)<900);

const CATEGORY_SETS={
  character:[['traits','Traits'],['abilities','Abilities'],['goals','Goals'],['backstory','Backstory'],['relationships','Relationships'],['secrets','Secrets'],['other','Other']],
  scene:[['events','Events'],['conflict','Conflict'],['characters','Characters'],['setting','Setting'],['outcome','Outcome'],['other','Other']],
  chapter:[['purpose','Purpose'],['events','Events'],['characters','Characters'],['questions','Questions'],['other','Other']],
  location:[['details','Details'],['history','History'],['dangers','Dangers'],['uses','Story use'],['other','Other']],
  clue:[['discovery','Discovery'],['meaning','Meaning'],['misdirection','Misdirection'],['payoff','Payoff'],['other','Other']],
  reveal:[['truth','Truth'],['who_knows','Who knows'],['consequences','Consequences'],['other','Other']],
  setup:[['plant','What is planted'],['promise','Promise'],['payoff','Expected payoff'],['other','Other']],
  payoff:[['result','Result'],['reveal','Reveal'],['consequences','Consequences'],['other','Other']],
  subplot:[['events','Events'],['connections','Connections'],['problems','Problems'],['outcome','Outcome'],['other','Other']],
  research:[['questions','Questions'],['facts','Facts'],['sources','Sources'],['other','Other']],
  beat:[['ideas','Ideas'],['conflict','Conflict'],['setup','Setup'],['payoff','Payoff'],['other','Other']],
  general:[['details','Details'],['questions','Questions'],['other','Other']]
};

let reviewState=null;
let moreObserver=null;
let nodeObserver=null;
let rapidObserver=null;
let knownNodeIds=new Set();
let rapidSessionParent=null;
let rapidSessionAdded=0;
const undoStack=[];
const MAX_UNDO=30;

function toast(message){const el=qs('#toast');if(!el)return;el.textContent=message;el.classList.add('show');clearTimeout(el._consolidateTimer);el._consolidateTimer=setTimeout(()=>el.classList.remove('show'),1800);}
function esc(v){return String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));}
function nodeType(node){
  if(!node)return'general';
  if(node.targetMapId||Number.isFinite(node.storyBeatIndex))return'beat';
  if(node.writer?.type)return node.writer.type;
  const text=String(node.text||'').toLowerCase();
  if(/^chapter\b/.test(text))return'chapter';
  if(/\b(clue|evidence)\b/.test(text))return'clue';
  if(/\breveal/.test(text))return'reveal';
  return'general';
}
function categoriesFor(parent){return CATEGORY_SETS[nodeType(parent)]||CATEGORY_SETS.general;}
function labelFor(parent,key){return categoriesFor(parent).find(([id])=>id===key)?.[1]||key.replace(/_/g,' ').replace(/^./,c=>c.toUpperCase());}
function childrenOf(map,id){return Object.values(map?.nodes||{}).filter(n=>n.parentId===id);}
function rawChildren(map,id){return childrenOf(map,id).filter(n=>n.writer?.rawBrainstorm===true);}
function relationsOf(map,id){return (Array.isArray(map?.relationships)?map.relationships:[]).filter(r=>r.from===id||r.to===id);}
function ensureWriter(node){if(!node.writer||typeof node.writer!=='object')node.writer={};return node.writer;}
function ensureDetails(node){const w=ensureWriter(node);if(!w.details||typeof w.details!=='object'||Array.isArray(w.details))w.details={};return w.details;}
function selectedId(){return qs('#nodes .node.selected')?.dataset.id||null;}
function selectNode(id){const el=qs(`#nodes .node[data-id="${CSS.escape(id)}"]`);if(!el)return;el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));}
function clearMulti(){qs('#multiClearBtn')?.click();}
function mapFingerprint(map){return JSON.stringify({nodes:map?.nodes||{},relationships:Array.isArray(map?.relationships)?map.relationships:[]});}
function snapshotMap(map){return JSON.stringify({nodes:map.nodes,relationships:Array.isArray(map.relationships)?map.relationships:[]});}
function recordUndo(map,before,label){undoStack.push({mapId:map.id,before,after:mapFingerprint(map),label});if(undoStack.length>MAX_UNDO)undoStack.shift();const btn=qs('#undoBtn');if(btn)btn.disabled=false;}
function canUndo(){const entry=undoStack[undoStack.length-1],map=mapNow();return !!entry&&!!map&&entry.mapId===map.id&&entry.after===mapFingerprint(map);}
function undoConsolidation(){
  if(!canUndo())return false;
  const entry=undoStack.pop(),map=mapNow();let snap=null;try{snap=JSON.parse(entry.before);}catch{return false;}
  map.nodes=snap.nodes||{};map.relationships=Array.isArray(snap.relationships)?snap.relationships:[];app()?.save?.();closeReview();clearMulti();window.dispatchEvent(new Event('resize'));toast(`Undid ${entry.label}`);return true;
}

function suggestCategory(parent,node){
  const type=nodeType(parent),t=`${node.text||''} ${node.description||''}`.toLowerCase();
  if(type==='character'){
    if(/\b(magic|power|ability|skill|sword|weapon|fight|combat|speed|fast|strong|can\b|able\b)/.test(t))return'abilities';
    if(/\b(want|goal|search|searching|look for|looking for|find|needs|trying|plan to|plans to)/.test(t))return'goals';
    if(/\b(secret|hide|hides|hiding|conceal|unknown|doesn.t tell|never tells)/.test(t))return'secrets';
    if(/\b(past|born|childhood|grew up|used to|formerly|years ago|before the story)/.test(t))return'backstory';
    if(/\b(friend|enemy|mother|father|sister|brother|wife|husband|partner|loves|hates|relationship)/.test(t))return'relationships';
    return'traits';
  }
  if(type==='scene'){
    if(/\b(fight|argue|threat|attack|problem|obstacle|conflict|danger|opposes)/.test(t))return'conflict';
    if(/\b(room|house|street|forest|city|school|office|bar|location|setting|night|morning|outside|inside)/.test(t))return'setting';
    if(/\b(after|result|consequence|ends with|leaves|changes|because of this)/.test(t))return'outcome';
    if(/\b(character|arrives|enters|leaves|meets|talks to)/.test(t))return'characters';
    return'events';
  }
  if(type==='location'){
    if(/\b(history|years ago|used to|built|founded|old|past)/.test(t))return'history';
    if(/\b(danger|unsafe|risk|trap|threat|hazard)/.test(t))return'dangers';
    if(/\b(scene|meet|hide|fight|escape|story|use)/.test(t))return'uses';
    return'details';
  }
  if(type==='clue'){
    if(/\b(find|found|discover|discovered|notice|noticed)/.test(t))return'discovery';
    if(/\b(false|mislead|misdirection|wrong|mistake)/.test(t))return'misdirection';
    if(/\b(reveal|payoff|answer|leads to)/.test(t))return'payoff';
    return'meaning';
  }
  if(type==='research'){
    if(/\?|\b(question|why|how|when|where|who|what)\b/.test(t))return'questions';
    if(/\b(source|book|article|website|link|reference)/.test(t))return'sources';
    return'facts';
  }
  if(type==='subplot'){
    if(/\b(connect|main plot|character arc|crosses|ties to)/.test(t))return'connections';
    if(/\b(problem|obstacle|conflict|complication)/.test(t))return'problems';
    if(/\b(end|resolve|outcome|finish|result)/.test(t))return'outcome';
    return'events';
  }
  if(type==='setup')return /payoff|later|result/.test(t)?'payoff':/promise|expect/.test(t)?'promise':'plant';
  if(type==='payoff')return /reveal|truth/.test(t)?'reveal':/because|consequence|result/.test(t)?'consequences':'result';
  if(type==='chapter')return /\?|question|decide/.test(t)?'questions':/purpose|why/.test(t)?'purpose':'events';
  if(type==='reveal')return /who|learn|knows/.test(t)?'who_knows':/after|because|consequence|changes/.test(t)?'consequences':'truth';
  if(type==='beat')return /fight|problem|obstacle|conflict/.test(t)?'conflict':/payoff|resolve/.test(t)?'payoff':/setup|plant/.test(t)?'setup':'ideas';
  return /\?|question|decide|unknown/.test(t)?'questions':'details';
}

function injectStyles(){
  if(qs('#consolidationStyles'))return;
  const style=document.createElement('style');style.id='consolidationStyles';style.textContent=`
    .consolidate-overlay{position:fixed;inset:0;z-index:182;background:rgba(35,31,27,.35);display:grid;place-items:center;padding:12px}.consolidate-overlay.hidden{display:none!important}
    .consolidate-card{width:min(760px,100%);max-height:min(86vh,780px);display:flex;flex-direction:column;background:#fcfaf5;border:1px solid rgba(92,78,61,.18);border-radius:22px;box-shadow:0 26px 80px rgba(38,31,24,.28);color:var(--ink,#25231f)}
    .consolidate-head{display:flex;align-items:flex-start;gap:10px;padding:16px 16px 10px}.consolidate-head>div{min-width:0;flex:1}.consolidate-head h2{margin:0 0 3px;font-size:1.18rem}.consolidate-head p{margin:0;color:var(--muted);line-height:1.35}.consolidate-close{width:40px;height:40px;border:1px solid var(--line);border-radius:12px;background:#fff;font-size:1.1rem}
    .consolidate-tip{margin:0 16px 10px;padding:9px 11px;border-radius:12px;background:#eef4f0;color:#365f4d;font-size:.78rem;line-height:1.35}
    .consolidate-list{overflow:auto;padding:0 12px 8px;display:grid;gap:7px}.consolidate-row{display:grid;grid-template-columns:30px minmax(0,1fr) minmax(145px,190px);gap:9px;align-items:center;border:1px solid rgba(92,78,61,.14);border-radius:14px;background:#fff;padding:9px}.consolidate-row input{width:20px;height:20px}.consolidate-copy{min-width:0}.consolidate-copy strong{display:block;font-size:.84rem;line-height:1.3}.consolidate-copy small{display:block;margin-top:2px;color:var(--muted);font-size:.71rem;line-height:1.3}.consolidate-copy em{display:block;margin-top:3px;color:#8a6235;font-size:.67rem;font-style:normal}.consolidate-row select{width:100%;min-height:40px;border:1px solid var(--line);border-radius:10px;background:#fff;color:var(--ink);font:inherit;padding:6px 8px}
    .consolidate-actions{display:flex;gap:8px;align-items:center;justify-content:flex-end;border-top:1px solid rgba(92,78,61,.13);padding:12px 16px 16px}.consolidate-actions .btn{min-height:42px}.consolidate-actions .primary{background:#365f4d;color:#fff;border-color:#365f4d}.consolidate-count{margin-right:auto;color:var(--muted);font-size:.74rem;font-weight:800}
    .writer-details-section{margin:10px 0;padding:10px;border:1px solid rgba(92,78,61,.14);border-radius:14px;background:#f7f4ed}.writer-details-section.hidden{display:none}.writer-details-head{display:flex;align-items:center;gap:8px;margin-bottom:8px}.writer-details-head strong{flex:1;font-size:.78rem;text-transform:uppercase;letter-spacing:.05em;color:var(--muted)}.writer-details-head button{border:0;border-radius:9px;background:#e1ece6;color:#315f4d;min-height:32px;padding:5px 9px;font-weight:850}.writer-details-head button.hidden{display:none}.writer-details-group{margin:8px 0}.writer-details-group>strong{display:block;font-size:.75rem;margin-bottom:4px}.writer-detail-item{padding:6px 8px;margin:3px 0;border-radius:9px;background:#fff;font-size:.78rem;line-height:1.35}.writer-detail-item small{display:block;color:var(--muted);margin-top:2px}.writer-details-empty{color:var(--muted);font-size:.76rem;padding:4px 0}
    #multiConsolidateBtn{border-color:#729582;background:#eef4f0;color:#315f4d}
    @media(max-width:620px),(hover:none) and (pointer:coarse){.consolidate-overlay{place-items:end center;padding:6px}.consolidate-card{max-height:90vh;border-radius:22px 22px 15px 15px}.consolidate-row{grid-template-columns:30px minmax(0,1fr)}.consolidate-row select{grid-column:2}.consolidate-actions{display:grid;grid-template-columns:1fr 1fr}.consolidate-count{grid-column:1/-1;margin:0}.consolidate-actions .primary{grid-column:1/-1}.writer-details-section{margin-bottom:12px}}
  `;document.head.appendChild(style);
}

function ensureDialog(){
  injectStyles();if(qs('#consolidateOverlay'))return;
  const wrap=document.createElement('div');wrap.id='consolidateOverlay';wrap.className='consolidate-overlay hidden';wrap.innerHTML=`<section class="consolidate-card" role="dialog" aria-modal="true" aria-labelledby="consolidateTitle"><header class="consolidate-head"><div><h2 id="consolidateTitle">Review ideas</h2><p id="consolidateParent"></p></div><button id="consolidateClose" class="consolidate-close" type="button" aria-label="Close">×</button></header><div class="consolidate-tip">These are rough ideas. Change a category if the suggestion is wrong.</div><div id="consolidateList" class="consolidate-list"></div><footer class="consolidate-actions"><span id="consolidateCount" class="consolidate-count"></span><button id="consolidateKeep" class="btn" type="button">Keep as nodes</button><button id="consolidateGroup" class="btn" type="button">Group under headings</button><button id="consolidateMove" class="btn primary" type="button">Move into parent</button></footer></section>`;
  wrap.addEventListener('pointerdown',e=>{if(e.target===wrap)closeReview();});document.body.appendChild(wrap);
  qs('#consolidateClose').addEventListener('click',closeReview);qs('#consolidateKeep').addEventListener('click',()=>applyReview('keep'));qs('#consolidateGroup').addEventListener('click',()=>applyReview('group'));qs('#consolidateMove').addEventListener('click',()=>applyReview('move'));
}
function reviewRows(){return qsa('#consolidateList .consolidate-row').map(row=>({row,id:row.dataset.nodeId,checked:qs('input[type="checkbox"]',row)?.checked!==false,category:qs('select',row)?.value||'other'}));}
function updateReviewCount(){const rows=reviewRows(),n=rows.filter(r=>r.checked).length;const out=qs('#consolidateCount');if(out)out.textContent=`${n} of ${rows.length} selected`;['#consolidateKeep','#consolidateGroup','#consolidateMove'].forEach(s=>{const b=qs(s);if(b)b.disabled=n===0;});}
function openReview(parentId,ids=null){
  const map=mapNow(),parent=map?.nodes?.[parentId];if(!map||!parent)return;
  let candidates=ids?.length?ids.map(id=>map.nodes[id]).filter(n=>n&&n.parentId===parentId):rawChildren(map,parentId);
  if(!candidates.length){toast('No ideas are waiting to be reviewed');return;}
  ensureDialog();reviewState={mapId:map.id,parentId,candidateIds:candidates.map(n=>n.id)};qs('#consolidateParent').textContent=`Sort the ideas under “${parent.text||'this idea'}”.`;
  const list=qs('#consolidateList');list.innerHTML='';const cats=categoriesFor(parent);
  candidates.forEach(node=>{
    const row=document.createElement('div');row.className='consolidate-row';row.dataset.nodeId=node.id;const hasChildren=childrenOf(map,node.id).length>0,hasLinks=relationsOf(map,node.id).length>0||!!node.targetMapId;
    row.innerHTML=`<input type="checkbox" checked aria-label="Use ${esc(node.text||'idea')}"><div class="consolidate-copy"><strong>${esc(node.text||'Untitled')}</strong>${node.description?.trim()?`<small>${esc(node.description.trim())}</small>`:''}${hasChildren||hasLinks?'<em>This one has children or links, so Move will keep the node too.</em>':''}</div><select aria-label="Category for ${esc(node.text||'idea')}">${cats.map(([key,label])=>`<option value="${esc(key)}">${esc(label)}</option>`).join('')}</select>`;
    qs('select',row).value=suggestCategory(parent,node);qs('input',row).addEventListener('change',updateReviewCount);list.appendChild(row);
  });
  qs('#consolidateOverlay').classList.remove('hidden');updateReviewCount();
}
function closeReview(){qs('#consolidateOverlay')?.classList.add('hidden');reviewState=null;}

function detailEntry(node){return{id:uid('detail_'),text:String(node.text||'Untitled').trim()||'Untitled',description:String(node.description||'').trim(),created:now(),sourceNodeId:node.id};}
function addDetail(parent,category,node){const details=ensureDetails(parent);if(!Array.isArray(details[category]))details[category]=[];const text=String(node.text||'').trim().toLowerCase();if(details[category].some(d=>String(d?.text||'').trim().toLowerCase()===text))return;details[category].push(detailEntry(node));}
function makeGroup(map,parent,category){
  const existing=childrenOf(map,parent.id).find(n=>n.writer?.detailGroup===category);if(existing)return existing;
  const id=uid('i_'),label=labelFor(parent,category);const node={id,text:label,description:'',parentId:parent.id,color:parent.color||'#DCEBE4',edgeLabel:'',collapsed:false,created:now(),x:null,y:null,targetMapId:null,writer:{type:'general',detailGroup:category}};map.nodes[id]=node;return node;
}
function applyReview(mode){
  const map=mapNow();if(!reviewState||!map||map.id!==reviewState.mapId)return;const parent=map.nodes[reviewState.parentId];if(!parent)return;
  const chosen=reviewRows().filter(r=>r.checked).map(r=>({node:map.nodes[r.id],category:r.category})).filter(x=>x.node&&x.node.parentId===parent.id);if(!chosen.length)return;
  const before=snapshotMap(map);let keptBecauseLinked=0;
  if(mode==='move'){
    chosen.forEach(({node,category})=>{addDetail(parent,category,node);const safe=childrenOf(map,node.id).length===0&&relationsOf(map,node.id).length===0&&!node.targetMapId;if(safe)delete map.nodes[node.id];else{const w=ensureWriter(node);w.rawBrainstorm=false;w.consolidatedToParent=true;keptBecauseLinked++;}});
  }else if(mode==='group'){
    const groups=new Map();chosen.forEach(({node,category})=>{let group=groups.get(category);if(!group){group=makeGroup(map,parent,category);groups.set(category,group);}node.parentId=group.id;node.x=null;node.y=null;const w=ensureWriter(node);w.rawBrainstorm=false;w.reviewed=true;});parent.collapsed=false;
  }else{
    chosen.forEach(({node})=>{const w=ensureWriter(node);w.rawBrainstorm=false;w.reviewed=true;});
  }
  app()?.save?.();recordUndo(map,before,mode==='move'?'idea consolidation':mode==='group'?'idea grouping':'idea review');closeReview();clearMulti();window.dispatchEvent(new Event('resize'));requestAnimationFrame(()=>selectNode(parent.id));
  if(mode==='move')toast(keptBecauseLinked?`Moved details into parent; ${keptBecauseLinked} linked idea${keptBecauseLinked===1?' stayed':'s stayed'} on the map`:'Ideas moved into parent details');
  else if(mode==='group')toast('Ideas grouped under headings');else toast('Ideas kept as nodes');
}

function detailsEntries(node){const details=node?.writer?.details;if(!details||typeof details!=='object'||Array.isArray(details))return[];return Object.entries(details).filter(([,items])=>Array.isArray(items)&&items.length);}
function ensureDetailsSection(){
  const inspector=qs('#inspector');if(!inspector)return null;let section=qs('#writerDetailsSection');if(section)return section;const description=qs('#ideaDescription')?.closest('.field');if(!description)return null;
  section=document.createElement('section');section.id='writerDetailsSection';section.className='writer-details-section hidden';section.innerHTML='<div class="writer-details-head"><strong>Details</strong><button type="button" data-review-details>Review Ideas</button></div><div class="writer-details-body"></div>';description.insertAdjacentElement('afterend',section);qs('[data-review-details]',section).addEventListener('click',()=>{const id=selectedId();if(id)openReview(id);});return section;
}
function renderDetails(){
  const section=ensureDetailsSection();if(!section)return;const map=mapNow(),id=selectedId(),node=map?.nodes?.[id];if(!node){section.classList.add('hidden');return;}const entries=detailsEntries(node),raw=rawChildren(map,id),button=qs('[data-review-details]',section),body=qs('.writer-details-body',section),head=qs('.writer-details-head strong',section);head.textContent=nodeType(node)==='character'?'Character details':'Details';button.classList.toggle('hidden',raw.length===0);button.textContent=raw.length?`Review Ideas (${raw.length})`:'Review Ideas';body.innerHTML='';entries.forEach(([key,items])=>{const group=document.createElement('div');group.className='writer-details-group';group.innerHTML=`<strong>${esc(labelFor(node,key))}</strong>`;items.forEach(item=>{const d=document.createElement('div');d.className='writer-detail-item';d.innerHTML=`${esc(item.text||'')}${item.description?`<small>${esc(item.description)}</small>`:''}`;group.appendChild(d);});body.appendChild(group);});if(!entries.length)body.innerHTML='<div class="writer-details-empty">No details moved here yet.</div>';section.classList.toggle('hidden',entries.length===0&&raw.length===0);
}

function enhanceMore(){
  const sheet=qs('#writerBranchSheet');if(!sheet||sheet.classList.contains('hidden'))return;const grid=qs('.writer-option-grid',sheet);if(!grid)return;const map=mapNow(),id=sheet.dataset.nodeId||selectedId(),count=rawChildren(map,id).length;let button=qs('[data-consolidate-review]',grid);
  if(!count){button?.remove();return;}if(!button){button=document.createElement('button');button.type='button';button.className='writer-option';button.dataset.consolidateReview='1';button.addEventListener('click',()=>{sheet.classList.add('hidden');openReview(sheet.dataset.nodeId||selectedId());});grid.prepend(button);}const html=`<strong>Review Ideas</strong><small>${count} Rapidfire idea${count===1?'':'s'} ready to sort</small>`;if(button.innerHTML!==html)button.innerHTML=html;
}
function watchMore(){const sheet=qs('#writerBranchSheet');if(!sheet||moreObserver)return;moreObserver=new MutationObserver(()=>enhanceMore());moreObserver.observe(sheet,{attributes:true,attributeFilter:['class']});document.addEventListener('click',e=>{if(e.target.closest?.('#writerContext [data-writer-action="branch"]'))setTimeout(enhanceMore,0);},true);}

function enhanceMultiSelect(){
  const bar=qs('#multiSelectBar');if(!bar||qs('#multiConsolidateBtn',bar))return;const b=document.createElement('button');b.id='multiConsolidateBtn';b.className='btn';b.type='button';b.textContent='Consolidate';b.addEventListener('click',()=>{const map=mapNow(),ids=qsa('#nodes .node.multi-selected').map(el=>el.dataset.id).filter(Boolean);if(!map||!ids.length){toast('Select ideas first');return;}const parents=[...new Set(ids.map(id=>map.nodes[id]?.parentId).filter(Boolean))];if(parents.length!==1){toast('Choose ideas that share the same parent');return;}openReview(parents[0],ids);});const del=qs('#multiDeleteBtn',bar);del?bar.insertBefore(b,del):bar.appendChild(b);
}

function markRapidfireNewNodes(){
  const map=mapNow(),dialog=qs('#rapidfireDialog');if(!map)return;const open=dialog&&!dialog.classList.contains('hidden');let changed=false;
  Object.values(map.nodes||{}).forEach(node=>{
    if(knownNodeIds.has(node.id))return;knownNodeIds.add(node.id);
    if(!open)return;const w=ensureWriter(node);w.rawBrainstorm=true;w.rapidfireParentId=node.parentId||null;w.rapidfireCreatedAt=now();w.type='general';rapidSessionParent=node.parentId||rapidSessionParent;rapidSessionAdded++;changed=true;
  });
  if(changed)app()?.save?.();
}
function enforceRawTypes(){const map=mapNow();if(!map)return;let changed=false;Object.values(map.nodes||{}).forEach(node=>{if(node.writer?.rawBrainstorm&&node.writer.type!=='general'){node.writer.type='general';changed=true;}});if(changed)app()?.save?.();}
function observeNodes(){const nodes=qs('#nodes');if(!nodes||nodeObserver)return;const map=mapNow();knownNodeIds=new Set(Object.keys(map?.nodes||{}));nodeObserver=new MutationObserver(()=>requestAnimationFrame(()=>{markRapidfireNewNodes();enforceRawTypes();renderDetails();enhanceMultiSelect();}));nodeObserver.observe(nodes,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});}
function observeRapidfire(){
  const dialog=qs('#rapidfireDialog');if(!dialog||rapidObserver)return;let wasOpen=!dialog.classList.contains('hidden');
  rapidObserver=new MutationObserver(()=>{const open=!dialog.classList.contains('hidden');if(open&&!wasOpen){rapidSessionParent=selectedId();rapidSessionAdded=0;const map=mapNow();knownNodeIds=new Set(Object.keys(map?.nodes||{}));}else if(!open&&wasOpen&&rapidSessionAdded>0){const parent=rapidSessionParent,count=rapidSessionAdded;rapidSessionAdded=0;rapidSessionParent=null;requestAnimationFrame(()=>{if(parent)selectNode(parent);toast(`${count} idea${count===1?'':'s'} captured · Review Ideas is in More`);});}wasOpen=open;});
  rapidObserver.observe(dialog,{attributes:true,attributeFilter:['class']});
}

function bindUndo(){
  document.addEventListener('keydown',e=>{const tag=(e.target?.tagName||'').toLowerCase(),typing=tag==='input'||tag==='textarea'||tag==='select'||e.target?.isContentEditable;if(!typing&&(e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'&&!e.shiftKey&&undoConsolidation()){e.preventDefault();e.stopImmediatePropagation();}},true);
  qs('#undoBtn')?.addEventListener('click',e=>{if(!undoConsolidation())return;e.preventDefault();e.stopImmediatePropagation();},true);
}
function bindEscape(){document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!qs('#consolidateOverlay')?.classList.contains('hidden')){e.preventDefault();e.stopImmediatePropagation();closeReview();}},true);}
function boot(){injectStyles();ensureDialog();ensureDetailsSection();watchMore();observeNodes();observeRapidfire();enhanceMultiSelect();renderDetails();bindUndo();bindEscape();setInterval(()=>{watchMore();enhanceMore();enhanceMultiSelect();renderDetails();},1200);}

window.MindMapConsolidation={open:openReview,undo:undoConsolidation};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
