(()=>{'use strict';
if(window.__SWAMP_MINDMAP_V2__)return;
window.__SWAMP_MINDMAP_V2__=true;

const VERSION='3.0.0';
const NS='http://www.w3.org/2000/svg';
const LINK_FIELD='relationships';
const isMobile=()=>matchMedia('(max-width:850px),(hover:none) and (pointer:coarse)').matches||(navigator.maxTouchPoints>0&&Math.min(screen.width,screen.height)<900);
const app=()=>window.MindMapApp;
const mapNow=()=>app()?.getCurrentMap?.()||null;
const projectNow=()=>app()?.getProject?.()||null;
const qs=(s,r=document)=>r.querySelector(s);
const qsa=(s,r=document)=>[...r.querySelectorAll(s)];
const uid=(prefix='v2_')=>`${prefix}${Math.random().toString(36).slice(2,9)}${Date.now().toString(36).slice(-5)}`;

let navigatorOpen=false;
let linkMode=null;
let drawRaf=0;
let updateRaf=0;
let relationshipUndo=[];
let relationshipUndoArmed=false;
let walkState={active:false,nodeId:null,order:[]};

function toast(message){
  const el=qs('#toast');
  if(!el)return;
  el.textContent=message;
  el.classList.add('show');
  clearTimeout(el._v2Timer);
  el._v2Timer=setTimeout(()=>el.classList.remove('show'),2200);
}
function childrenOf(map,id){return Object.values(map?.nodes||{}).filter(n=>n.parentId===id);}
function selectedId(){return qs('#nodes .node.selected')?.dataset.id||mapNow()?.rootId||null;}
function ancestors(map,id){
  const chain=[];let n=map?.nodes?.[id],guard=0;
  while(n&&guard++<200){chain.unshift(n);if(!n.parentId)break;n=map.nodes[n.parentId];}
  return chain;
}
function flatten(map,rootId=map?.rootId){
  const rows=[],seen=new Set();
  const walk=(id,depth)=>{
    if(!id||seen.has(id)||!map?.nodes?.[id])return;
    seen.add(id);const node=map.nodes[id];rows.push({node,depth});
    childrenOf(map,id).forEach(child=>walk(child.id,depth+1));
  };
  walk(rootId,0);return rows;
}
function ensureLinks(map){
  if(!map)return[];
  if(!Array.isArray(map[LINK_FIELD]))map[LINK_FIELD]=[];
  return map[LINK_FIELD];
}
function nodePosition(id){
  const el=qs(`#nodes .node[data-id="${CSS.escape(id)}"]`);
  if(!el)return null;
  const m=(el.getAttribute('transform')||'').match(/translate\(\s*(-?[\d.]+)[ ,]+(-?[\d.]+)\s*\)/);
  if(!m)return null;
  const body=qs('circle.body',el);
  return{x:Number(m[1]),y:Number(m[2]),r:Number(body?.getAttribute('r'))||60,el};
}

function injectStyle(){
  if(qs('#v2ExperienceStyle'))return;
  const link=document.createElement('link');
  link.id='v2ExperienceStyle';link.rel='stylesheet';link.href=`v2-experience.css?v=${VERSION}`;
  document.head.appendChild(link);
}
function setVersionBranding(){
  document.title=`MindMap ${VERSION} V2 — Swamp`;
  document.documentElement.dataset.mindmapV2=VERSION;
  qsa('[data-toolbar-version]').forEach(el=>el.textContent=`V2 · ${VERSION}`);
}
function makeToolbarButton(label,title,onClick,extra=''){
  const b=document.createElement('button');
  b.type='button';b.className=`tb-button tb-icon v2-toolbar-btn ${extra}`.trim();b.textContent=label;b.title=title;b.setAttribute('aria-label',title);b.addEventListener('click',onClick);return b;
}
function injectToolbar(){
  const row=qs('#desktopToolbar .tb-row');
  if(row&&!qs('#v2NavigatorBtn')){
    const spacer=qs('.tb-spacer',row);
    const nav=makeToolbarButton('☷',"Writer's Navigator",toggleNavigator);nav.id='v2NavigatorBtn';
    const link=makeToolbarButton('↗','Link ideas across branches',()=>startLinkMode());link.id='v2LinkBtn';
    const walk=makeToolbarButton('▶','Story Walk',startWalk);walk.id='v2WalkBtn';
    const zen=makeToolbarButton('◐','Zen canvas',()=>toggleZen());zen.id='v2ZenBtn';
    [nav,link,walk,zen].forEach(b=>spacer?row.insertBefore(b,spacer):row.appendChild(b));
  }
  const mobile=qs('#mobileToolbar');
  if(mobile&&!qs('#v2MobileNavigatorBtn')){
    const more=qs('[data-toolbar-target="menuBtn"]',mobile);
    const nav=makeToolbarButton('☷',"Writer's Navigator",toggleNavigator);nav.id='v2MobileNavigatorBtn';
    more?mobile.insertBefore(nav,more):mobile.appendChild(nav);
  }
  const grid=qs('#utilitySheet .utility-grid');
  if(grid&&!qs('#v2UtilityNavigator')){
    const items=[
      ['v2UtilityNavigator','☷ Navigator',toggleNavigator],
      ['v2UtilityLink','↗ Link ideas',()=>startLinkMode()],
      ['v2UtilityWalk','▶ Story Walk',startWalk],
      ['v2UtilityZen','◐ Zen canvas',()=>toggleZen()]
    ];
    items.reverse().forEach(([id,text,fn])=>{const b=document.createElement('button');b.id=id;b.className='btn';b.type='button';b.textContent=text;b.addEventListener('click',()=>{qs('#utilitySheet')?.classList.remove('open');fn();});grid.prepend(b);});
  }
  const actions=qs('#inspector .actions');
  if(actions&&!qs('#v2InspectorLink')){
    const b=document.createElement('button');b.id='v2InspectorLink';b.type='button';b.className='btn';b.textContent='↗ Link idea';b.addEventListener('click',()=>startLinkMode());actions.appendChild(b);
  }
  const shortcuts=qs('#shortcutsDialog .shortcuts-grid');
  if(shortcuts&&!qs('[data-v2-shortcuts]',shortcuts)){
    const marker=document.createElement('span');marker.dataset.v2Shortcuts='1';marker.className='kbd';marker.textContent='⌘/Ctrl ⇧ O';
    const desc=document.createElement('span');desc.textContent="Writer's Navigator";shortcuts.append(marker,desc);
    [['⌘/Ctrl ⇧ L','Link ideas'],['⌘/Ctrl ⇧ P','Story Walk'],['Z','Zen canvas']].forEach(([k,d])=>{const a=document.createElement('span');a.className='kbd';a.textContent=k;const x=document.createElement('span');x.textContent=d;shortcuts.append(a,x);});
  }
}

function buildNavigator(){
  if(qs('#v2Navigator'))return;
  const back=document.createElement('div');back.id='v2NavigatorBackdrop';back.className='v2-nav-backdrop';back.addEventListener('click',()=>closeNavigator());
  const panel=document.createElement('aside');panel.id='v2Navigator';panel.className='v2-navigator';panel.setAttribute('aria-label',"Writer's Navigator");panel.innerHTML=`
    <header class="v2-nav-head">
      <div><span class="v2-eyebrow">Writer's Navigator</span><h2 id="v2NavTitle">Mind map</h2></div>
      <button id="v2NavClose" class="v2-icon-btn" type="button" aria-label="Close navigator">×</button>
    </header>
    <div id="v2NavStats" class="v2-nav-stats"></div>
    <div id="v2Breadcrumb" class="v2-breadcrumb" aria-label="Selected idea path"></div>
    <label class="v2-nav-search"><span>⌕</span><input id="v2NavFilter" type="search" placeholder="Filter ideas or notes…" autocomplete="off"></label>
    <div id="v2Outline" class="v2-outline" role="tree"></div>
    <footer class="v2-nav-foot"><button id="v2NavLink" class="btn" type="button">↗ Link selected</button><button id="v2NavWalk" class="btn primary" type="button">▶ Story Walk</button></footer>`;
  document.body.append(back,panel);
  qs('#v2NavClose').addEventListener('click',closeNavigator);
  qs('#v2NavFilter').addEventListener('input',renderNavigator);
  qs('#v2NavLink').addEventListener('click',()=>{closeNavigator();startLinkMode();});
  qs('#v2NavWalk').addEventListener('click',()=>{closeNavigator();startWalk();});
}
function mapStats(map){
  const nodes=Object.values(map?.nodes||{});let maxDepth=0,notes=0,leaves=0;
  nodes.forEach(n=>{if(n.description?.trim())notes++;if(!childrenOf(map,n.id).length)leaves++;maxDepth=Math.max(maxDepth,ancestors(map,n.id).length-1);});
  return{ideas:nodes.length,notes,leaves,depth:maxDepth,links:ensureLinks(map).length};
}
function renderBreadcrumb(map,id){
  const host=qs('#v2Breadcrumb');if(!host)return;host.innerHTML='';
  ancestors(map,id).forEach((node,i,arr)=>{
    const b=document.createElement('button');b.type='button';b.textContent=node.text||'Untitled';b.title=node.text||'Untitled';b.addEventListener('click',()=>selectAndCenter(node.id));host.appendChild(b);
    if(i<arr.length-1){const s=document.createElement('span');s.textContent='›';host.appendChild(s);}
  });
}
function renderNavigator(){
  const host=qs('#v2Outline'),map=mapNow();if(!host)return;
  if(!map){host.innerHTML='<div class="v2-empty">Unlock the workspace to browse ideas.</div>';return;}
  const root=map.nodes[map.rootId];qs('#v2NavTitle').textContent=root?.text||map.title||'Mind map';
  const stats=mapStats(map);const statHost=qs('#v2NavStats');statHost.innerHTML='';
  [[stats.ideas,'ideas'],[stats.notes,'notes'],[stats.links,'links'],[stats.depth,'depth']].forEach(([n,label])=>{const s=document.createElement('span');s.innerHTML=`<strong>${n}</strong> ${label}`;statHost.appendChild(s);});
  const current=selectedId()||map.rootId;renderBreadcrumb(map,current);
  const filter=(qs('#v2NavFilter')?.value||'').trim().toLowerCase();
  const rows=flatten(map),keep=new Set();
  if(filter){rows.forEach(({node})=>{if((node.text||'').toLowerCase().includes(filter)||(node.description||'').toLowerCase().includes(filter)){ancestors(map,node.id).forEach(a=>keep.add(a.id));}});}
  host.innerHTML='';
  rows.forEach(({node,depth})=>{
    if(filter&&!keep.has(node.id))return;
    const kids=childrenOf(map,node.id),row=document.createElement('div');row.className='v2-outline-row-wrap';row.style.setProperty('--depth',depth);
    const toggle=document.createElement('button');toggle.type='button';toggle.className='v2-outline-toggle';toggle.disabled=!kids.length;toggle.textContent=kids.length?(node.collapsed?'▸':'▾'):'·';toggle.title=kids.length?(node.collapsed?'Expand branch':'Collapse branch'):'';
    toggle.addEventListener('click',e=>{e.stopPropagation();toggleBranch(node.id);});
    const b=document.createElement('button');b.type='button';b.className='v2-outline-row';b.dataset.id=node.id;b.setAttribute('role','treeitem');b.setAttribute('aria-level',String(depth+1));
    if(node.id===current)b.classList.add('current');
    const label=document.createElement('span');label.className='v2-outline-label';label.textContent=node.text||'Untitled';
    const meta=document.createElement('span');meta.className='v2-outline-meta';
    if(node.description?.trim()){const n=document.createElement('span');n.textContent='note';meta.appendChild(n);}
    const related=ensureLinks(map).filter(l=>l.from===node.id||l.to===node.id).length;if(related){const n=document.createElement('span');n.textContent=`${related} link${related===1?'':'s'}`;meta.appendChild(n);}
    if(kids.length){const n=document.createElement('span');n.textContent=`${kids.length} child${kids.length===1?'':'ren'}`;meta.appendChild(n);}
    b.append(label,meta);b.addEventListener('click',()=>selectAndCenter(node.id));row.append(toggle,b);host.appendChild(row);
  });
  if(!host.children.length){const empty=document.createElement('div');empty.className='v2-empty';empty.textContent='No ideas match that filter.';host.appendChild(empty);}
}
function openNavigator(){buildNavigator();navigatorOpen=true;document.body.classList.add('v2-nav-open');renderNavigator();qs('#v2NavFilter')?.focus({preventScroll:true});}
function closeNavigator(){navigatorOpen=false;document.body.classList.remove('v2-nav-open');}
function toggleNavigator(){navigatorOpen?closeNavigator():openNavigator();}
function selectAndCenter(id,closeOnPhone=true){
  const node=qs(`#nodes .node[data-id="${CSS.escape(id)}"]`);
  if(!node){toast('That idea is inside a collapsed branch');return;}
  node.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));
  requestAnimationFrame(()=>qs('#centerBtn')?.click());
  if(closeOnPhone&&isMobile())closeNavigator();else requestAnimationFrame(renderNavigator);
}
function toggleBranch(id){
  const node=qs(`#nodes .node[data-id="${CSS.escape(id)}"]`);if(!node){toast('Open its parent branch first');return;}
  node.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));
  requestAnimationFrame(()=>qs('#collapseBtn')?.click());
}

function ensureLinkLayer(){
  const viewport=qs('#viewport');if(!viewport)return null;
  let layer=qs('#v2LinksLayer');
  if(!layer){layer=document.createElementNS(NS,'g');layer.id='v2LinksLayer';const labels=qs('#labels');viewport.insertBefore(layer,labels||qs('#nodes'));
    const svg=qs('#svg');let defs=qs('#v2LinkDefs');if(!defs&&svg){defs=document.createElementNS(NS,'defs');defs.id='v2LinkDefs';defs.innerHTML='<marker id="v2Arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z"></path></marker>';svg.prepend(defs);}
  }
  return layer;
}
function curvedRelationship(a,b,id){
  const dx=b.x-a.x,dy=b.y-a.y,dist=Math.max(1,Math.hypot(dx,dy)),ux=dx/dist,uy=dy/dist;
  const start={x:a.x+ux*(a.r+8),y:a.y+uy*(a.r+8)},end={x:b.x-ux*(b.r+8),y:b.y-uy*(b.r+8)};
  const nx=-uy,ny=ux,hash=[...id].reduce((n,c)=>n+c.charCodeAt(0),0),sign=hash%2?1:-1,bend=Math.min(90,dist*.18)*sign;
  const cx=(start.x+end.x)/2+nx*bend,cy=(start.y+end.y)/2+ny*bend;
  return{d:`M ${start.x} ${start.y} Q ${cx} ${cy} ${end.x} ${end.y}`,mid:{x:.25*start.x+.5*cx+.25*end.x,y:.25*start.y+.5*cy+.25*end.y}};
}
function drawLinks(){
  drawRaf=0;const map=mapNow(),layer=ensureLinkLayer();if(!map||!layer)return;layer.innerHTML='';
  ensureLinks(map).forEach(link=>{
    if(!map.nodes[link.from]||!map.nodes[link.to]||link.from===link.to)return;
    const a=nodePosition(link.from),b=nodePosition(link.to);if(!a||!b)return;
    const c=curvedRelationship(a,b,link.id||`${link.from}:${link.to}`),g=document.createElementNS(NS,'g');g.classList.add('v2-link-group');g.dataset.linkId=link.id;
    const hit=document.createElementNS(NS,'path'),path=document.createElementNS(NS,'path');hit.setAttribute('d',c.d);hit.setAttribute('class','v2-link-hit');path.setAttribute('d',c.d);path.setAttribute('class','v2-link-line');
    const direction=link.direction||'forward';if(direction==='forward'||direction==='both')path.setAttribute('marker-end','url(#v2Arrow)');if(direction==='both')path.setAttribute('marker-start','url(#v2Arrow)');
    const open=e=>{e.preventDefault();e.stopPropagation();openLinkDialog({existing:link});};
    hit.addEventListener('pointerdown',e=>e.stopPropagation());hit.addEventListener('click',open);path.addEventListener('pointerdown',e=>e.stopPropagation());path.addEventListener('click',open);g.append(hit,path);
    if(link.label?.trim()){
      const lg=document.createElementNS(NS,'g');lg.setAttribute('class','v2-link-label');lg.setAttribute('transform',`translate(${c.mid.x} ${c.mid.y})`);const rect=document.createElementNS(NS,'rect'),text=document.createElementNS(NS,'text');const w=Math.max(62,Math.min(220,link.label.length*7.2+20));rect.setAttribute('x',-w/2);rect.setAttribute('y',-14);rect.setAttribute('width',w);rect.setAttribute('height',28);rect.setAttribute('rx',9);text.setAttribute('text-anchor','middle');text.setAttribute('y','4');text.textContent=link.label.length>28?link.label.slice(0,27)+'…':link.label;lg.append(rect,text);lg.addEventListener('pointerdown',e=>e.stopPropagation());lg.addEventListener('click',open);g.appendChild(lg);
    }
    layer.appendChild(g);
  });
}
function scheduleDraw(){if(!drawRaf)drawRaf=requestAnimationFrame(drawLinks);}
function relationshipSnapshot(){const map=mapNow();return map?JSON.stringify(ensureLinks(map)):null;}
function rememberRelationshipUndo(){const map=mapNow(),snap=relationshipSnapshot();if(!map||snap===null)return;relationshipUndo.push({mapId:map.id,snap});if(relationshipUndo.length>30)relationshipUndo.shift();relationshipUndoArmed=true;}
function commitRelationshipChange(label,fn){const map=mapNow();if(!map)return;rememberRelationshipUndo();fn(ensureLinks(map));app()?.save?.();scheduleDraw();renderNavigator();toast(`${label} · Ctrl/⌘+Z to undo`);}
function undoRelationship(){
  const map=mapNow();if(!map)return false;
  let item;while(relationshipUndo.length){const candidate=relationshipUndo.pop();if(candidate.mapId===map.id){item=candidate;break;}}
  if(!item)return false;map[LINK_FIELD]=JSON.parse(item.snap);app()?.save?.();scheduleDraw();renderNavigator();relationshipUndoArmed=relationshipUndo.length>0;toast('Undid relationship change');return true;
}
function buildLinkBanner(){
  if(qs('#v2LinkBanner'))return;
  const banner=document.createElement('div');banner.id='v2LinkBanner';banner.className='v2-link-banner';banner.innerHTML='<span id="v2LinkBannerText"></span><button type="button" aria-label="Cancel link mode">×</button>';banner.querySelector('button').addEventListener('click',()=>cancelLinkMode());document.body.appendChild(banner);
}
function startLinkMode(){
  const map=mapNow();if(!map){toast('Unlock the workspace first');return;}
  closeNavigator();const source=selectedId()||map.rootId;if(!map.nodes[source])return;
  linkMode={source};document.body.classList.add('v2-linking');buildLinkBanner();qs('#v2LinkBannerText').textContent=`Link “${map.nodes[source].text||'idea'}” → tap another idea`;
  qs(`#nodes .node[data-id="${CSS.escape(source)}"]`)?.classList.add('v2-link-source');toast('Tap another idea to connect it');
}
function cancelLinkMode(show=true){linkMode=null;document.body.classList.remove('v2-linking');qsa('.v2-link-source').forEach(el=>el.classList.remove('v2-link-source'));if(show)toast('Link mode exited');}
function buildLinkDialog(){
  if(qs('#v2LinkDialog'))return;
  const modal=document.createElement('div');modal.id='v2LinkDialog';modal.className='v2-modal hidden';modal.innerHTML=`<div class="v2-dialog" role="dialog" aria-modal="true" aria-labelledby="v2LinkTitle">
    <div class="v2-dialog-head"><div><span class="v2-eyebrow">Idea relationship</span><h2 id="v2LinkTitle">Connect ideas</h2></div><button id="v2LinkClose" class="v2-icon-btn" type="button">×</button></div>
    <div id="v2LinkEndpoints" class="v2-link-endpoints"></div>
    <label class="v2-field">Label <input id="v2LinkLabel" maxlength="100" placeholder="e.g. foreshadows, conflicts with, caused by"></label>
    <div class="v2-field"><span>Direction</span><div id="v2Direction" class="v2-segment"><button type="button" data-dir="forward">→</button><button type="button" data-dir="both">↔</button><button type="button" data-dir="none">—</button></div></div>
    <div class="v2-dialog-actions"><button id="v2LinkDelete" class="btn danger" type="button">Delete</button><span></span><button id="v2LinkCancel" class="btn" type="button">Cancel</button><button id="v2LinkSave" class="btn primary" type="button">Save link</button></div>
  </div>`;document.body.appendChild(modal);
  qs('#v2LinkClose').addEventListener('click',closeLinkDialog);qs('#v2LinkCancel').addEventListener('click',closeLinkDialog);modal.addEventListener('pointerdown',e=>{if(e.target===modal)closeLinkDialog();});
  qsa('#v2Direction button').forEach(b=>b.addEventListener('click',()=>{qsa('#v2Direction button').forEach(x=>x.classList.remove('active'));b.classList.add('active');modal.dataset.direction=b.dataset.dir;}));
}
function closeLinkDialog(){qs('#v2LinkDialog')?.classList.add('hidden');}
function openLinkDialog({from,to,existing=null}){
  buildLinkDialog();const map=mapNow();if(!map)return;cancelLinkMode(false);
  const source=existing?.from||from,target=existing?.to||to;if(!map.nodes[source]||!map.nodes[target])return;
  const modal=qs('#v2LinkDialog');modal.dataset.linkId=existing?.id||'';modal.dataset.from=source;modal.dataset.to=target;modal.dataset.direction=existing?.direction||'forward';
  qs('#v2LinkEndpoints').textContent=`${map.nodes[source].text||'Untitled'}  →  ${map.nodes[target].text||'Untitled'}`;qs('#v2LinkLabel').value=existing?.label||'';qs('#v2LinkDelete').classList.toggle('hidden',!existing);
  qsa('#v2Direction button').forEach(b=>b.classList.toggle('active',b.dataset.dir===modal.dataset.direction));
  qs('#v2LinkSave').onclick=()=>{
    const label=qs('#v2LinkLabel').value.trim(),direction=modal.dataset.direction||'forward',id=modal.dataset.linkId;
    if(id){commitRelationshipChange('Link updated',links=>{const item=links.find(l=>l.id===id);if(item){item.label=label;item.direction=direction;item.updated=new Date().toISOString();}});}else{commitRelationshipChange('Ideas linked',links=>links.push({id:uid('rel_'),from:source,to:target,label,direction,created:new Date().toISOString()}));}
    closeLinkDialog();
  };
  qs('#v2LinkDelete').onclick=()=>{const id=modal.dataset.linkId;if(!id)return;commitRelationshipChange('Link deleted',links=>{const i=links.findIndex(l=>l.id===id);if(i>=0)links.splice(i,1);});closeLinkDialog();};
  modal.classList.remove('hidden');setTimeout(()=>qs('#v2LinkLabel')?.focus(),20);
}

function buildWalk(){
  if(qs('#v2Walk'))return;
  const view=document.createElement('section');view.id='v2Walk';view.className='v2-walk hidden';view.innerHTML=`
    <header class="v2-walk-head"><button id="v2WalkClose" class="v2-icon-btn" type="button" aria-label="Exit Story Walk">×</button><div class="v2-walk-map"><span class="v2-eyebrow">Story Walk</span><strong id="v2WalkMapTitle">Mind map</strong></div><div id="v2WalkCount" class="v2-walk-count"></div></header>
    <div class="v2-walk-progress"><span id="v2WalkProgress"></span></div>
    <main class="v2-walk-body"><div id="v2WalkCrumb" class="v2-breadcrumb v2-walk-crumb"></div><article class="v2-walk-card"><h1 id="v2WalkTitle"></h1><p id="v2WalkDescription"></p><div id="v2WalkRelations" class="v2-walk-relations"></div><div id="v2WalkChildren" class="v2-walk-children"></div><button id="v2WalkLinked" class="btn primary hidden" type="button">Open linked map ↗</button></article></main>
    <footer class="v2-walk-foot"><button id="v2WalkPrev" class="btn" type="button">← Previous</button><button id="v2WalkParent" class="btn" type="button">↑ Parent</button><button id="v2WalkMap" class="btn" type="button">◎ Show on map</button><button id="v2WalkNext" class="btn primary" type="button">Next →</button></footer>`;
  document.body.appendChild(view);
  qs('#v2WalkClose').addEventListener('click',closeWalk);qs('#v2WalkPrev').addEventListener('click',()=>walkStep(-1));qs('#v2WalkNext').addEventListener('click',()=>walkStep(1));qs('#v2WalkParent').addEventListener('click',walkParent);qs('#v2WalkMap').addEventListener('click',()=>{const id=walkState.nodeId;closeWalk();selectAndCenter(id,false);});
  let sx=0,sy=0;view.addEventListener('touchstart',e=>{const t=e.touches[0];sx=t.clientX;sy=t.clientY;},{passive:true});view.addEventListener('touchend',e=>{const t=e.changedTouches[0],dx=t.clientX-sx,dy=t.clientY-sy;if(Math.abs(dx)>70&&Math.abs(dx)>Math.abs(dy)*1.4)walkStep(dx<0?1:-1);},{passive:true});
}
function currentWalkMap(){return mapNow();}
function startWalk(){
  const map=mapNow();if(!map){toast('Unlock the workspace first');return;}
  closeNavigator();cancelLinkMode(false);buildWalk();walkState.active=true;walkState.order=flatten(map).map(r=>r.node.id);walkState.nodeId=selectedId()||map.rootId;document.body.classList.add('v2-walking');qs('#v2Walk').classList.remove('hidden');renderWalk();
}
function closeWalk(){walkState.active=false;document.body.classList.remove('v2-walking');qs('#v2Walk')?.classList.add('hidden');}
function walkTo(id){const map=currentWalkMap();if(!map?.nodes?.[id])return;walkState.nodeId=id;renderWalk();}
function walkStep(delta){const i=walkState.order.indexOf(walkState.nodeId);if(i<0)return;const next=i+delta;if(next>=0&&next<walkState.order.length)walkTo(walkState.order[next]);}
function walkParent(){const map=currentWalkMap(),node=map?.nodes?.[walkState.nodeId];if(node?.parentId)walkTo(node.parentId);}
function renderWalk(){
  const map=currentWalkMap(),node=map?.nodes?.[walkState.nodeId];if(!map||!node){closeWalk();return;}
  if(!walkState.order.includes(node.id))walkState.order=flatten(map).map(r=>r.node.id);
  const i=Math.max(0,walkState.order.indexOf(node.id));qs('#v2WalkMapTitle').textContent=map.nodes[map.rootId]?.text||map.title||'Mind map';qs('#v2WalkCount').textContent=`${i+1} / ${walkState.order.length}`;qs('#v2WalkProgress').style.width=`${((i+1)/Math.max(1,walkState.order.length))*100}%`;qs('#v2WalkTitle').textContent=node.text||'Untitled';qs('#v2WalkDescription').textContent=node.description?.trim()||'No description yet.';
  qs('#v2WalkPrev').disabled=i<=0;qs('#v2WalkNext').disabled=i>=walkState.order.length-1;qs('#v2WalkParent').disabled=!node.parentId;
  const crumb=qs('#v2WalkCrumb');crumb.innerHTML='';ancestors(map,node.id).forEach((n,idx,arr)=>{const b=document.createElement('button');b.type='button';b.textContent=n.text||'Untitled';b.addEventListener('click',()=>walkTo(n.id));crumb.appendChild(b);if(idx<arr.length-1){const s=document.createElement('span');s.textContent='›';crumb.appendChild(s);}});
  const childHost=qs('#v2WalkChildren');childHost.innerHTML='';childrenOf(map,node.id).forEach(child=>{const b=document.createElement('button');b.type='button';b.className='v2-child-chip';b.textContent=child.text||'Untitled';b.addEventListener('click',()=>walkTo(child.id));childHost.appendChild(b);});
  const relHost=qs('#v2WalkRelations');relHost.innerHTML='';ensureLinks(map).filter(l=>l.from===node.id||l.to===node.id).forEach(link=>{const otherId=link.from===node.id?link.to:link.from,other=map.nodes[otherId];if(!other)return;const b=document.createElement('button');b.type='button';b.className='v2-relation-chip';b.textContent=`${link.label?.trim()?link.label+' · ':''}${other.text||'Untitled'}`;b.addEventListener('click',()=>walkTo(otherId));relHost.appendChild(b);});
  const linked=qs('#v2WalkLinked'),project=projectNow();if(node.targetMapId&&project?.sessions?.[node.targetMapId]){linked.classList.remove('hidden');linked.onclick=()=>{app()?.setCurrentMap?.(node.targetMapId,false,false);requestAnimationFrame(()=>requestAnimationFrame(()=>{const next=mapNow();walkState.order=flatten(next).map(r=>r.node.id);walkState.nodeId=next.rootId;renderWalk();}));};}else linked.classList.add('hidden');
}

function buildZenExit(){if(qs('#v2ZenExit'))return;const b=document.createElement('button');b.id='v2ZenExit';b.type='button';b.className='v2-zen-exit';b.textContent='Exit Zen';b.addEventListener('click',()=>toggleZen(false));document.body.appendChild(b);}
function toggleZen(force){buildZenExit();const next=force===undefined?!document.body.classList.contains('v2-zen'):!!force;document.body.classList.toggle('v2-zen',next);if(next){closeNavigator();qs('#utilitySheet')?.classList.remove('open');toast('Zen canvas · press Z to exit');}}

function bindGlobalInteractions(){
  const nodes=qs('#nodes');if(nodes){nodes.addEventListener('pointerdown',e=>{if(!linkMode)return;const node=e.target.closest?.('.node');if(!node)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();const target=node.dataset.id;if(target===linkMode.source){toast('Choose a different idea');return;}const source=linkMode.source;cancelLinkMode(false);openLinkDialog({from:source,to:target});},true);}
  document.addEventListener('keydown',e=>{
    const typing=e.target instanceof HTMLInputElement||e.target instanceof HTMLTextAreaElement||e.target?.isContentEditable;
    if(walkState.active){if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();closeWalk();return;}if(e.key==='ArrowRight'){e.preventDefault();e.stopImmediatePropagation();walkStep(1);return;}if(e.key==='ArrowLeft'){e.preventDefault();e.stopImmediatePropagation();walkStep(-1);return;}if(e.key==='ArrowUp'){e.preventDefault();e.stopImmediatePropagation();walkParent();return;}if(e.key==='ArrowDown'){const child=childrenOf(mapNow(),walkState.nodeId)[0];if(child){e.preventDefault();e.stopImmediatePropagation();walkTo(child.id);}return;}}
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'&&relationshipUndoArmed&&!typing){if(undoRelationship()){e.preventDefault();e.stopImmediatePropagation();}return;}
    if(typing)return;
    if((e.ctrlKey||e.metaKey)&&e.shiftKey&&e.key.toLowerCase()==='o'){e.preventDefault();e.stopImmediatePropagation();toggleNavigator();return;}
    if((e.ctrlKey||e.metaKey)&&e.shiftKey&&e.key.toLowerCase()==='l'){e.preventDefault();e.stopImmediatePropagation();startLinkMode();return;}
    if((e.ctrlKey||e.metaKey)&&e.shiftKey&&e.key.toLowerCase()==='p'){e.preventDefault();e.stopImmediatePropagation();startWalk();return;}
    if(e.key.toLowerCase()==='z'&&!e.ctrlKey&&!e.metaKey&&!e.altKey){e.preventDefault();e.stopImmediatePropagation();toggleZen();return;}
    if(e.key==='Escape'&&navigatorOpen){e.preventDefault();e.stopImmediatePropagation();closeNavigator();return;}
    if(e.key==='Escape'&&linkMode){e.preventDefault();e.stopImmediatePropagation();cancelLinkMode();return;}
  },true);
  document.addEventListener('pointerdown',e=>{if(!relationshipUndoArmed)return;if(e.target.closest?.('#v2LinkDialog,#v2LinksLayer,#v2LinkBanner'))return;relationshipUndoArmed=false;},true);
  document.addEventListener('input',e=>{if(relationshipUndoArmed&&!e.target.closest?.('#v2LinkDialog'))relationshipUndoArmed=false;},true);
}
function observeBaseApp(){
  const nodes=qs('#nodes');if(!nodes)return;
  const observer=new MutationObserver(()=>{scheduleDraw();if(!updateRaf)updateRaf=requestAnimationFrame(()=>{updateRaf=0;if(linkMode){qsa('.v2-link-source').forEach(el=>el.classList.remove('v2-link-source'));qs(`#nodes .node[data-id="${CSS.escape(linkMode.source)}"]`)?.classList.add('v2-link-source');}if(navigatorOpen)renderNavigator();if(walkState.active){const map=mapNow();if(!map?.nodes?.[walkState.nodeId]){walkState.order=flatten(map).map(r=>r.node.id);walkState.nodeId=map?.rootId||null;}renderWalk();}});});
  observer.observe(nodes,{childList:true,subtree:true,attributes:true,attributeFilter:['transform','class','r']});
  window.addEventListener('resize',scheduleDraw,{passive:true});
}

function boot(){injectStyle();setVersionBranding();injectToolbar();buildNavigator();buildLinkBanner();buildLinkDialog();buildWalk();buildZenExit();bindGlobalInteractions();observeBaseApp();scheduleDraw();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
