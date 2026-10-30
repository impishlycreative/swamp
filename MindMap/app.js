(()=>{'use strict';
const $=s=>document.querySelector(s);
const NS='http://www.w3.org/2000/svg';
const PROJECT_KEY='swamp.mindmap.project.v2';
const LEGACY_KEY='swamp.mindmap.v1';
const BACKUP_KEY='swamp.mindmap.project.backup';
const AUTH_KEY='swamp.mindmap.auth.v1';
const COLORS=['#F2D8A7','#DCEBE4','#D8E5F2','#E7DCF2','#F2D7DC','#E6E0D3','#CFE4DC','#F0E5C5'];
const VERSION='2.6.0';
const TEMPLATES=[
  {name:'Three-Act Structure',beats:['Act I — Setup','Inciting Incident','First Plot Point','Act II — Confrontation','Midpoint','Second Plot Point','Act III — Resolution','Climax','Denouement']},
  {name:'Save the Cat',beats:['Opening Image','Theme Stated','Setup','Catalyst','Debate','Break into Two','B Story','Fun and Games','Midpoint','Bad Guys Close In','All Is Lost','Dark Night of the Soul','Break into Three','Finale','Final Image']},
  {name:"Hero's Journey",beats:['Ordinary World','Call to Adventure','Refusal of the Call','Meeting the Mentor','Crossing the First Threshold','Tests, Allies, Enemies','Approach to the Inmost Cave','Ordeal','Reward','The Road Back','Resurrection','Return with the Elixir']}
];
const state={
  project:null,map:null,selected:null,edgeSelected:null,focusRoot:null,view:{x:0,y:0,scale:1},
  pointers:new Map(),pan:null,pinch:null,sheetMode:null,history:[],editSession:null,
  lastTap:{id:null,time:0},nodeDrag:null,suppressClickUntil:0,panelDrag:null
};
const uid=(prefix='i_')=>`${prefix}${Math.random().toString(36).slice(2,9)}${Date.now().toString(36).slice(-5)}`;
const now=()=>new Date().toISOString();
const finite=n=>Number.isFinite(n);
const isMobile=()=>matchMedia('(max-width:850px),(hover:none) and (pointer:coarse)').matches||(navigator.maxTouchPoints>0&&Math.min(screen.width,screen.height)<900);

function normalizeMap(map){
  if(!map?.nodes||!map?.rootId)return map;
  map.version=VERSION;
  map.id=map.id||uid('m_');
  map.created=map.created||now();
  map.updated=map.updated||map.created;
  map.view=map.view||{x:0,y:0,scale:1};
  Object.values(map.nodes).forEach(n=>{
    if(typeof n.description!=='string')n.description='';
    if(typeof n.edgeLabel!=='string')n.edgeLabel='';
    if(typeof n.text!=='string')n.text='Untitled';
    if(typeof n.collapsed!=='boolean')n.collapsed=false;
    if(!finite(n.x))n.x=null;
    if(!finite(n.y))n.y=null;
    if(n.targetMapId===undefined)n.targetMapId=n.targetSessionId||null;
    delete n.targetSessionId;
  });
  const root=map.nodes[map.rootId];
  map.title=(root?.text||map.title||'Untitled Mind Map').trim()||'Untitled Mind Map';
  return map;
}
function fresh(title='Untitled Mind Map'){
  const root=uid();
  const map={version:VERSION,id:uid('m_'),title,created:now(),updated:now(),rootId:root,
    nodes:{[root]:{id:root,text:title,description:'',parentId:null,color:COLORS[0],edgeLabel:'',collapsed:false,created:now(),x:null,y:null,targetMapId:null}},
    view:{x:0,y:0,scale:1}};
  return normalizeMap(map);
}
function freshProject(initial=fresh()){
  return{version:VERSION,id:uid('p_'),title:'MindMap Project',created:now(),updated:now(),currentMapId:initial.id,sessions:{[initial.id]:initial},templateHistory:[]};
}
function normalizeProject(project){
  if(!project||typeof project!=='object')return null;
  const rawSessions=project.sessions||project.maps;
  if(!rawSessions||typeof rawSessions!=='object')return null;
  const sessions={};
  Object.values(rawSessions).forEach(raw=>{
    const map=normalizeMap(raw);
    if(!map?.nodes?.[map.rootId])return;
    while(sessions[map.id])map.id=uid('m_');
    sessions[map.id]=map;
  });
  if(!Object.keys(sessions).length)return null;
  let current=project.currentMapId||project.currentSessionId;
  if(!sessions[current])current=Object.keys(sessions)[0];
  return{version:VERSION,id:project.id||uid('p_'),title:project.title||'MindMap Project',created:project.created||now(),updated:project.updated||now(),currentMapId:current,sessions,templateHistory:Array.isArray(project.templateHistory)?project.templateHistory:[]};
}
function save(show=false){
  if(!state.project||!state.map)return;
  state.map.version=VERSION;
  state.map.updated=now();
  state.map.view={...state.view};
  const root=state.map.nodes[state.map.rootId];
  if(root)state.map.title=(root.text||'Untitled Mind Map').trim()||'Untitled Mind Map';
  state.project.sessions[state.map.id]=state.map;
  state.project.currentMapId=state.map.id;
  state.project.updated=now();
  localStorage.setItem(PROJECT_KEY,JSON.stringify(state.project));
  updateMapSelect();
  if(show)toast('Saved locally');
}
function load(){
  let project=null;
  try{
    const raw=localStorage.getItem(PROJECT_KEY);
    if(raw)project=normalizeProject(JSON.parse(raw));
    if(!project){
      const legacy=localStorage.getItem(LEGACY_KEY);
      if(legacy){const map=normalizeMap(JSON.parse(legacy));if(map?.nodes?.[map.rootId])project=freshProject(map);}
    }
  }catch{}
  state.project=project||freshProject();
  let id=state.project.currentMapId;
  if(!state.project.sessions[id])id=Object.keys(state.project.sessions)[0];
  state.project.currentMapId=id;
  state.map=normalizeMap(state.project.sessions[id]);
  state.view={...(state.map.view||{x:0,y:0,scale:1})};
  state.selected=state.map.rootId;
  state.edgeSelected=null;
  state.focusRoot=null;
  state.history=[];
  state.sheetMode=null;
  save(false);
  updateUndo();
}
function updateMapSelect(){
  const select=$('#mapSelect');if(!select||!state.project)return;
  const current=state.map?.id||state.project.currentMapId;
  select.innerHTML='';
  Object.values(state.project.sessions).sort((a,b)=>(a.created||'').localeCompare(b.created||'')).forEach(map=>{
    const option=document.createElement('option');
    option.value=map.id;
    option.textContent=map.nodes?.[map.rootId]?.text||map.title||'Untitled Mind Map';
    option.selected=map.id===current;
    select.appendChild(option);
  });
}
function setCurrentMap(id,fitAfter=true,selectRoot=true){
  if(!state.project?.sessions?.[id])return;
  if(state.map)save(false);
  state.project.currentMapId=id;
  state.map=normalizeMap(state.project.sessions[id]);
  state.view={...(state.map.view||{x:0,y:0,scale:1})};
  state.selected=selectRoot?state.map.rootId:null;
  state.edgeSelected=null;
  state.focusRoot=null;
  state.history=[];
  state.sheetMode=null;
  updateUndo();updateMapSelect();render();
  if(fitAfter)requestAnimationFrame(()=>fit());
}
function newMap(title='Untitled Mind Map'){
  const map=fresh(title);
  state.project.sessions[map.id]=map;
  state.project.currentMapId=map.id;
  state.map=map;state.view={...map.view};state.selected=map.rootId;state.edgeSelected=null;state.focusRoot=null;state.history=[];state.sheetMode=null;
  save(false);render();centerOn(map.rootId);toast('New map created');
  requestAnimationFrame(()=>{if(isMobile())openSheet('edit',true);else{positionInspectorNear(map.rootId);$('#ideaText')?.focus();$('#ideaText')?.select();}});
}
function snapshot(){return JSON.stringify({map:state.map,selected:state.selected,edgeSelected:state.edgeSelected,focusRoot:state.focusRoot,view:state.view});}
function pushUndo(label){const snap=snapshot(),last=state.history[state.history.length-1];if(last?.snap===snap)return;state.history.push({snap,label});if(state.history.length>60)state.history.shift();updateUndo();}
function undo(){const item=state.history.pop();if(!item)return;const d=JSON.parse(item.snap);state.map=normalizeMap(d.map);state.project.sessions[state.map.id]=state.map;state.project.currentMapId=state.map.id;state.selected=d.selected;state.edgeSelected=d.edgeSelected||null;state.focusRoot=d.focusRoot;state.view=d.view||state.map.view||{x:0,y:0,scale:1};state.sheetMode=null;save(false);render();updateUndo();toast(`Undid ${item.label||'change'}`);}
function updateUndo(){$('#undoBtn').disabled=!state.history.length;}
const children=id=>Object.values(state.map.nodes).filter(n=>n.parentId===id);
function descendants(id,set=new Set()){set.add(id);children(id).forEach(c=>descendants(c.id,set));return set;}
function visible(n){let p=n;while(p&&p.parentId){const q=state.map.nodes[p.parentId];if(q?.collapsed)return false;p=q;}return state.focusRoot?descendants(state.focusRoot).has(n.id):true;}
function depth(id){let d=0,n=state.map.nodes[id];while(n?.parentId){d++;n=state.map.nodes[n.parentId];}return d;}
function resolvedPosition(node,x,y,a,d){return{ x:finite(node.x)?node.x:x, y:finite(node.y)?node.y:y, a,d };}
function layout(){
  const pos={},root=state.map.nodes[state.map.rootId];if(!root)return pos;
  pos[root.id]={x:0,y:0,a:-Math.PI/2,d:0};
  const kids=children(root.id),count=Math.max(1,kids.length),mobile=isMobile();
  const radius=Math.max(mobile?240:220,Math.min(mobile?540:500,210+kids.length*15));
  kids.forEach((n,i)=>{const a=-Math.PI/2+Math.PI*2*i/count;pos[n.id]=resolvedPosition(n,Math.cos(a)*radius,Math.sin(a)*radius,a,1);});
  kids.forEach(n=>branch(n.id,pos[n.id].x,pos[n.id].y,pos[n.id].a,2,pos));
  return pos;
}
function branch(id,px,py,base,d,pos){
  const parent=state.map.nodes[id];if(!parent||parent.collapsed)return;
  const kids=children(id);if(!kids.length)return;
  const mobile=isMobile(),count=kids.length;
  const fan=Math.min(Math.PI*1.18,Math.PI*.34+Math.max(0,count-1)*.22);
  const step=count===1?0:fan/(count-1);
  const baseDist=Math.max(mobile?185:160,(mobile?215:195)-d*5);
  const dist=baseDist+Math.max(0,count-3)*24;
  const clearance=mobile?150:140;
  kids.forEach((n,i)=>{
    const a=base+(count===1?0:-fan/2+i*step);
    let r=dist,x=px+Math.cos(a)*r,y=py+Math.sin(a)*r;
    if(!finite(n.x)||!finite(n.y)){
      for(let tries=0;tries<16;tries++){
        let blocked=false;
        for(const [otherId,p] of Object.entries(pos)){
          if(otherId===id)continue;
          if(Math.hypot(x-p.x,y-p.y)<clearance){blocked=true;break;}
        }
        if(!blocked)break;
        r+=mobile?30:28;x=px+Math.cos(a)*r;y=py+Math.sin(a)*r;
      }
    }
    pos[n.id]=resolvedPosition(n,x,y,a,d);
  });
  kids.forEach(n=>branch(n.id,pos[n.id].x,pos[n.id].y,pos[n.id].a,d+1,pos));
}
function curve(a,b){const dx=b.x-a.x,dy=b.y-a.y,d=Math.max(1,Math.hypot(dx,dy)),nx=-dy/d,ny=dx/d,bend=Math.min(76,d*.2);return`M ${a.x} ${a.y} Q ${(a.x+b.x)/2+nx*bend*.18} ${(a.y+b.y)/2+ny*bend*.18} ${b.x} ${b.y}`;}
function wrapText(text,maxChars=18){
  const source=String(text||'Untitled').trim()||'Untitled',lines=[];
  source.split(/\n/).forEach(paragraph=>{
    const words=paragraph.trim().split(/\s+/).filter(Boolean);if(!words.length){lines.push('');return;}
    let line='';
    const pushLong=word=>{let w=word;while(w.length>maxChars){if(line){lines.push(line);line='';}lines.push(w.slice(0,maxChars));w=w.slice(maxChars);}return w;};
    words.forEach(raw=>{const word=pushLong(raw);if(!word)return;const next=(line+' '+word).trim();if(next.length>maxChars&&line){lines.push(line);line=word;}else line=next;});
    if(line)lines.push(line);
  });
  return lines.length?lines:['Untitled'];
}
function nodeTextSpec(n){
  const root=n.id===state.map.rootId,mobile=isMobile(),font=root?(mobile?16:15):(mobile?15:14),lineHeight=font+4;
  const lines=wrapText(n.text,root?21:18),base=root?(mobile?80:74):(mobile?64:58);
  const vertical=lines.length*lineHeight/2+30+(n.targetMapId?10:0);
  const longest=Math.max(...lines.map(line=>line.length),1);
  const horizontal=longest*font*.31+26;
  return{lines,font,lineHeight,baseRadius:Math.max(base,vertical,horizontal)};
}
function nodeRadius(n){return nodeTextSpec(n).baseRadius;}
function edgeEndpoints(childId,pos,targetOverride=null,dx=0,dy=0,dragSet=null){
  const child=state.map.nodes[childId];if(!child?.parentId)return null;let parentId=child.parentId;if(targetOverride&&state.nodeDrag?.id===childId)parentId=targetOverride;
  const a0=pos[parentId],b0=pos[childId];if(!a0||!b0)return null;const parentMoves=!!dragSet?.has(parentId),childMoves=!!dragSet?.has(childId);
  return{a:{x:a0.x+(parentMoves?dx:0),y:a0.y+(parentMoves?dy:0)},b:{x:b0.x+(childMoves?dx:0),y:b0.y+(childMoves?dy:0)}};
}

function render(){
  const pos=layout(),edges=$('#edges'),labels=$('#labels'),nodes=$('#nodes');edges.innerHTML='';labels.innerHTML='';nodes.innerHTML='';
  const ids=new Set(Object.values(state.map.nodes).filter(visible).map(n=>n.id));
  Object.values(state.map.nodes).forEach(n=>{
    if(!n.parentId||!ids.has(n.id)||!ids.has(n.parentId))return;const ep=edgeEndpoints(n.id,pos);if(!ep)return;const d=curve(ep.a,ep.b);
    const hit=document.createElementNS(NS,'path'),p=document.createElementNS(NS,'path');hit.setAttribute('d',d);hit.setAttribute('class','edge-hit');hit.dataset.child=n.id;
    p.setAttribute('d',d);p.setAttribute('class','edge'+(state.edgeSelected===n.id?' selected-edge':'')+(state.selected===n.id?' focused':''));p.dataset.child=n.id;
    const edit=e=>{e.preventDefault();e.stopPropagation();openEdgeEditor(n.id,e.currentTarget);};
    hit.addEventListener('pointerdown',e=>e.stopPropagation());hit.addEventListener('click',edit);p.addEventListener('pointerdown',e=>e.stopPropagation());p.addEventListener('click',edit);edges.append(hit,p);
    if(n.edgeLabel){const mid={x:(ep.a.x+ep.b.x)/2,y:(ep.a.y+ep.b.y)/2-8},g=document.createElementNS(NS,'g');g.setAttribute('class','edge-label-group');g.dataset.child=n.id;g.setAttribute('transform',`translate(${mid.x} ${mid.y})`);const rect=document.createElementNS(NS,'rect'),t=document.createElementNS(NS,'text'),w=Math.max(48,n.edgeLabel.length*7.5+18);rect.setAttribute('x',-w/2);rect.setAttribute('y',-15);rect.setAttribute('width',w);rect.setAttribute('height',28);rect.setAttribute('rx',8);rect.setAttribute('class','edge-label-hit');t.setAttribute('class','edge-label');t.setAttribute('text-anchor','middle');t.setAttribute('y',3);t.textContent=n.edgeLabel;g.append(rect,t);g.addEventListener('pointerdown',e=>e.stopPropagation());g.addEventListener('click',edit);labels.appendChild(g);}
  });
  Object.values(state.map.nodes).forEach(n=>{
    if(!ids.has(n.id)||!pos[n.id])return;const p=pos[n.id],spec=nodeTextSpec(n),g=document.createElementNS(NS,'g');
    g.setAttribute('class','node'+(n.id===state.map.rootId?' root':'')+(n.id===state.selected?' selected':'')+(n.collapsed?' collapsed':'')+(n.targetMapId?' linked':''));g.setAttribute('transform',`translate(${p.x} ${p.y})`);g.dataset.id=n.id;
    const halo=document.createElementNS(NS,'circle'),body=document.createElementNS(NS,'circle');halo.setAttribute('class','halo');body.setAttribute('class','body');body.setAttribute('fill',n.color||COLORS[0]);g.append(halo,body);
    const textEls=[];spec.lines.forEach((s,i)=>{const t=document.createElementNS(NS,'text');t.setAttribute('class','idea-text');const y=(i-(spec.lines.length-1)/2)*spec.lineHeight+(n.targetMapId?-6:0);t.setAttribute('y',y);t.setAttribute('font-size',spec.font);t.textContent=s;t.addEventListener('pointerdown',e=>e.stopPropagation());t.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();select(n.id,false);openNodeTextEditor(n.id,g);});g.appendChild(t);textEls.push(t);});
    nodes.appendChild(g);
    let measured=0;textEls.forEach(t=>{try{measured=Math.max(measured,t.getComputedTextLength());}catch{}});
    let r=Math.max(spec.baseRadius,measured/2+24);halo.setAttribute('r',r+8);body.setAttribute('r',r);
    if(n.targetMapId){const link=document.createElementNS(NS,'text');link.setAttribute('class','linked-label');link.setAttribute('text-anchor','middle');link.setAttribute('y',r-15);link.textContent='OPEN MAP ↗';g.appendChild(link);}
    if(n.description?.trim()){const badge=document.createElementNS(NS,'g');badge.setAttribute('class','description-badge');badge.setAttribute('transform',`translate(${r*.68} ${r*.68})`);const bc=document.createElementNS(NS,'circle'),bt=document.createElementNS(NS,'text'),title=document.createElementNS(NS,'title');bc.setAttribute('r',11);bt.setAttribute('y',1);bt.textContent='≡';title.textContent='Has description';badge.append(bc,bt,title);g.appendChild(badge);}
    if(n.collapsed&&children(n.id).length){const c=document.createElementNS(NS,'text');c.setAttribute('class','count');c.setAttribute('y',r-13);c.textContent=`+${children(n.id).length}`;g.appendChild(c);}
    g.addEventListener('pointerdown',e=>beginNodeDrag(e,n.id,g));
    g.addEventListener('click',e=>{e.stopPropagation();if(Date.now()<state.suppressClickUntil)return;if(isMobile()){const tm=Date.now(),same=state.lastTap.id===n.id&&tm-state.lastTap.time<350;state.lastTap={id:n.id,time:tm};if(same){state.lastTap={id:null,time:0};if(n.targetMapId&&state.project.sessions[n.targetMapId])setCurrentMap(n.targetMapId,true,false);else quickAdd(n.id);return;}}select(n.id);});
    g.addEventListener('dblclick',e=>{if(isMobile()||e.target.tagName.toLowerCase()==='text')return;e.preventDefault();e.stopPropagation();if(n.targetMapId&&state.project.sessions[n.targetMapId])setCurrentMap(n.targetMapId,true,false);else quickAdd(n.id);});
    if(n.id===state.selected){const q=document.createElementNS(NS,'g');q.setAttribute('class','quick-add');q.dataset.owner=n.id;const a=p.a??0,qx=p.x+Math.cos(a)*(r+(isMobile()?38:34)),qy=p.y+Math.sin(a)*(r+(isMobile()?38:34));q.setAttribute('transform',`translate(${qx} ${qy})`);const c=document.createElementNS(NS,'circle'),plus=document.createElementNS(NS,'text');c.setAttribute('r',isMobile()?23:21);plus.setAttribute('y',1);plus.textContent='+';q.append(c,plus);q.addEventListener('pointerdown',e=>e.stopPropagation());q.addEventListener('click',e=>{e.stopPropagation();quickAdd(n.id);});nodes.appendChild(q);}
  });
  applyView();inspect();updateUndo();updateMapSelect();
}

function select(id,doRender=true){if(!state.map.nodes[id])return;state.selected=id;state.edgeSelected=null;if(isMobile())closeSheet(false);if(doRender)render();}
function inspect(){
  const n=state.selected&&state.map.nodes[state.selected],panel=$('#inspector'),ctx=$('#mobileContext');$('#addBtn').disabled=!n;$('#focusBtn').disabled=!n;
  if(!n){panel.classList.add('hidden');ctx.classList.add('hidden');return;}
  if(document.activeElement!==$('#ideaText'))$('#ideaText').value=n.text||'';if(document.activeElement!==$('#ideaDescription'))$('#ideaDescription').value=n.description||'';if(document.activeElement!==$('#edgeLabel'))$('#edgeLabel').value=n.edgeLabel||'';
  $('#edgeField').classList.toggle('hidden',!n.parentId);$('#linkedField').classList.toggle('hidden',!n.targetMapId||!state.project.sessions[n.targetMapId]);$('#collapseBtn').disabled=!children(n.id).length;$('#collapseBtn').textContent=n.collapsed?'Expand':'Collapse';$('#deleteBtn').disabled=n.id===state.map.rootId;$('#resetPosBtn').disabled=!finite(n.x)||!finite(n.y);
  const row=$('#colorRow');row.innerHTML='';COLORS.forEach(color=>{const b=document.createElement('button');b.className='swatch'+(n.color===color?' active':'');b.style.background=color;b.onclick=()=>{if(n.color===color)return;pushUndo('colour change');n.color=color;save(false);render();if(isMobile())openSheet('more');};row.appendChild(b);});
  $('#contextFocus').classList.toggle('active',state.focusRoot===n.id);
  if(isMobile()){panel.classList.remove('hidden');panel.classList.toggle('mobile-open',!!state.sheetMode);panel.classList.toggle('mobile-edit',state.sheetMode==='edit');panel.classList.toggle('mobile-more',state.sheetMode==='more');ctx.classList.toggle('hidden',!!state.sheetMode);}else{panel.classList.remove('hidden','mobile-open','mobile-edit','mobile-more');ctx.classList.add('hidden');}
}
function positionInspectorNear(id){if(isMobile())return;const g=document.querySelector(`.node[data-id="${id}"]`),panel=$('#inspector'),ws=$('#workspace');if(!g||!panel)return;const gr=g.getBoundingClientRect(),wr=ws.getBoundingClientRect(),pr=panel.getBoundingClientRect();let left=gr.right-wr.left+16,top=gr.top-wr.top-18;if(left+pr.width>wr.width-10)left=gr.left-wr.left-pr.width-16;left=Math.max(10,Math.min(wr.width-pr.width-10,left));top=Math.max(10,Math.min(wr.height-pr.height-10,top));panel.style.right='auto';panel.style.left=left+'px';panel.style.top=top+'px';}
function openSheet(mode='edit',focus=false){if(!isMobile())return;state.sheetMode=mode;$('#sheetTitle').textContent=mode==='more'?'Idea details':'Edit idea';inspect();if(focus)setTimeout(()=>$('#ideaText').focus(),50);}
function closeSheet(renderNow=true){state.sheetMode=null;$('#inspector').classList.remove('mobile-open','mobile-edit','mobile-more');if(renderNow&&state.map)inspect();}

function quickAdd(parentId=state.selected){
  const parent=state.map.nodes[parentId];if(!parent)return;pushUndo('add idea');const sib=children(parentId),id=uid();
  state.map.nodes[id]={id,text:'New idea',description:'',parentId,color:COLORS[(sib.length+depth(parentId))%COLORS.length],edgeLabel:'',collapsed:false,created:now(),x:null,y:null,targetMapId:null};parent.collapsed=false;state.selected=id;state.edgeSelected=null;save(false);render();centerOn(id);
  requestAnimationFrame(()=>{if(isMobile())openSheet('edit',true);else{positionInspectorNear(id);$('#ideaText').focus();$('#ideaText').select();}});toast('Idea added');
}
function removeSelected(){const id=state.selected;if(!id||id===state.map.rootId)return;const n=state.map.nodes[id],count=descendants(id).size-1,msg=count?`Delete “${n.text}” and its ${count} child idea${count===1?'':'s'}?`:`Delete “${n.text}”?`;if(!confirm(msg))return;pushUndo('delete idea');const parent=n.parentId;descendants(id).forEach(x=>delete state.map.nodes[x]);state.selected=parent;state.edgeSelected=null;state.sheetMode=null;save(false);render();toast('Idea deleted');}
function toggleFocus(){if(!state.selected)return;state.focusRoot=state.focusRoot===state.selected?null:state.selected;render();fit();toast(state.focusRoot?'Focused branch':'Full map');}
function toggleCollapse(){const n=state.map.nodes[state.selected];if(n&&children(n.id).length){pushUndo(n.collapsed?'expand branch':'collapse branch');n.collapsed=!n.collapsed;save(false);render();if(isMobile())openSheet('more');}}
function resetPosition(){const n=state.map.nodes[state.selected];if(!n||(!finite(n.x)&&!finite(n.y)))return;pushUndo('auto position');n.x=null;n.y=null;save(false);render();centerOn(n.id);toast('Auto position restored');}

function openNodeTextEditor(id,g){const n=state.map.nodes[id];if(!n)return;openInlineEditor(n.text,g.getBoundingClientRect(),value=>{const v=value.trim()||'Untitled';if(v!==n.text){pushUndo('text edit');n.text=v;if(id===state.map.rootId)state.map.title=v;save(false);render();}},'Edit idea');}
function openEdgeEditor(childId,el){const n=state.map.nodes[childId];if(!n)return;const rect=el.getBoundingClientRect();state.selected=null;state.edgeSelected=childId;state.sheetMode=null;render();openInlineEditor(n.edgeLabel||'',rect,value=>{const v=value.trim();if(v!==n.edgeLabel){pushUndo('connection label');n.edgeLabel=v;save(false);render();}},'Label connection');}
function openInlineEditor(value,rect,onCommit,placeholder='Edit'){
  document.querySelector('.inline-editor')?.remove();const input=document.createElement('input');input.className='inline-editor';input.value=value;input.placeholder=placeholder;document.body.appendChild(input);
  const w=Math.min(420,Math.max(180,rect.width+100)),left=Math.max(8,Math.min(innerWidth-w-8,rect.left+rect.width/2-w/2)),top=Math.max(8,Math.min(innerHeight-54,rect.top+rect.height/2-23));input.style.width=w+'px';input.style.left=left+'px';input.style.top=top+'px';let done=false;
  const finish=commit=>{if(done)return;done=true;const v=input.value;input.remove();if(commit)onCommit(v);};input.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter'){e.preventDefault();finish(true);}else if(e.key==='Escape'){e.preventDefault();finish(false);}});input.addEventListener('keyup',e=>e.stopPropagation());input.addEventListener('keypress',e=>e.stopPropagation());input.addEventListener('blur',()=>finish(true));setTimeout(()=>{input.focus();input.select();},0);
}

function clearDropTarget(){document.querySelectorAll('.node.drop-target').forEach(el=>el.classList.remove('drop-target'));}
function canReparent(id,target){return !!target&&id!==state.map.rootId&&target!==id&&!descendants(id).has(target);}
function beginNodeDrag(e,id,g){if(id===state.map.rootId||(e.button!==undefined&&e.button!==0)||e.target.tagName.toLowerCase()==='text')return;const pos=layout(),set=descendants(id);state.nodeDrag={id,pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,dx:0,dy:0,moved:false,target:null,g,pos,set,oldParent:state.map.nodes[id].parentId};g.setPointerCapture?.(e.pointerId);g.addEventListener('pointermove',moveNodeDrag);g.addEventListener('pointerup',endNodeDrag,{once:true});g.addEventListener('pointercancel',cancelNodeDrag,{once:true});}
function findDropTarget(x,y,d){const stack=document.elementsFromPoint(x,y);for(const el of stack){const node=el.closest?.('.node');if(node&&canReparent(d.id,node.dataset.id))return node.dataset.id;}let best=null,bestDist=Infinity;document.querySelectorAll('.node').forEach(node=>{const id=node.dataset.id;if(!canReparent(d.id,id))return;const r=node.getBoundingClientRect(),cx=(r.left+r.right)/2,cy=(r.top+r.bottom)/2,dist=Math.hypot(x-cx,y-cy);if(dist<Math.max(r.width,r.height)*.62&&dist<bestDist){best=id;bestDist=dist;}});return best;}
function moveNodeDrag(e){const d=state.nodeDrag;if(!d||e.pointerId!==d.pointerId)return;const screenDist=Math.hypot(e.clientX-d.startX,e.clientY-d.startY);if(!d.moved&&screenDist<8)return;d.moved=true;d.dx=(e.clientX-d.startX)/state.view.scale;d.dy=(e.clientY-d.startY)/state.view.scale;d.target=findDropTarget(e.clientX,e.clientY,d);clearDropTarget();if(d.target)document.querySelector(`.node[data-id="${d.target}"]`)?.classList.add('drop-target');updateDragPreview();}
function updateDragPreview(){
  const d=state.nodeDrag;if(!d?.moved)return;d.set.forEach(id=>{const p=d.pos[id],g=document.querySelector(`.node[data-id="${id}"]`);if(p&&g){g.classList.add('branch-dragging');if(id===d.id)g.classList.add('dragging');g.setAttribute('transform',`translate(${p.x+d.dx} ${p.y+d.dy})`);}});document.querySelectorAll('.quick-add').forEach(q=>{const owner=q.dataset.owner;if(d.set.has(owner))q.style.visibility='hidden';});
  document.querySelectorAll('[data-child]').forEach(el=>{const childId=el.dataset.child;if(!childId||!d.set.has(childId))return;const ep=edgeEndpoints(childId,d.pos,childId===d.id&&d.target?d.target:null,d.dx,d.dy,d.set);if(!ep)return;if(el.tagName.toLowerCase()==='path'){el.setAttribute('d',curve(ep.a,ep.b));if(childId===d.id&&el.classList.contains('edge'))el.classList.toggle('reconnecting',!!d.target);}else if(el.classList.contains('edge-label-group'))el.setAttribute('transform',`translate(${(ep.a.x+ep.b.x)/2} ${(ep.a.y+ep.b.y)/2-8})`);});
}
function finishNodeDrag(commit){
  const d=state.nodeDrag;if(!d)return;d.g.removeEventListener('pointermove',moveNodeDrag);clearDropTarget();state.suppressClickUntil=Date.now()+300;
  if(commit&&d.moved&&d.target){pushUndo('move branch');const n=state.map.nodes[d.id];n.parentId=d.target;n.x=null;n.y=null;state.map.nodes[d.target].collapsed=false;state.selected=d.id;state.edgeSelected=null;save(false);state.nodeDrag=null;render();centerOn(d.id);toast('Branch moved');return;}
  if(commit&&d.moved){pushUndo('manual position');const n=state.map.nodes[d.id],p=d.pos[d.id];n.x=p.x+d.dx;n.y=p.y+d.dy;state.selected=d.id;state.edgeSelected=null;save(false);state.nodeDrag=null;render();toast('Position pinned');return;}
  state.nodeDrag=null;render();
}
function endNodeDrag(e){if(state.nodeDrag&&e.pointerId===state.nodeDrag.pointerId)finishNodeDrag(true);}function cancelNodeDrag(e){if(state.nodeDrag&&e.pointerId===state.nodeDrag.pointerId)finishNodeDrag(false);}

function size(){const r=$('#svg').getBoundingClientRect();return{w:r.width,h:r.height};}
function applyView(){$('#viewport').setAttribute('transform',`translate(${state.view.x} ${state.view.y}) scale(${state.view.scale})`);$('#zoomReadout').textContent=Math.round(state.view.scale*100)+'%';}
function centerOn(id){const p=layout()[id];if(!p)return;const v=size(),min=isMobile()?.55:.35,max=isMobile()?1.35:1.25;state.view.scale=Math.max(min,Math.min(max,state.view.scale));state.view.x=v.w/2-p.x*state.view.scale;state.view.y=v.h/2-p.y*state.view.scale;applyView();save(false);}
function fit(){
  const pos=layout(),ids=Object.values(state.map.nodes).filter(visible).map(n=>n.id).filter(id=>pos[id]);if(!ids.length)return;const v=size();let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
  ids.forEach(id=>{const p=pos[id],r=nodeRadius(state.map.nodes[id])+24;minX=Math.min(minX,p.x-r);maxX=Math.max(maxX,p.x+r);minY=Math.min(minY,p.y-r);maxY=Math.max(maxY,p.y+r);});
  const pad=isMobile()?36:70,bw=Math.max(1,maxX-minX),bh=Math.max(1,maxY-minY),s=Math.max(.12,Math.min(isMobile()?1.08:1.2,(v.w-pad)/bw,(v.h-pad)/bh));state.view.scale=s;state.view.x=v.w/2-(minX+maxX)/2*s;state.view.y=v.h/2-(minY+maxY)/2*s;applyView();save(false);
}
function zoomAt(x,y,f){const old=state.view.scale,next=Math.max(.12,Math.min(2.6,old*f)),wx=(x-state.view.x)/old,wy=(y-state.view.y)/old;state.view.scale=next;state.view.x=x-wx*next;state.view.y=y-wy*next;applyView();save(false);}
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(t._timer);t._timer=setTimeout(()=>t.classList.remove('show'),1500);}
function showSearch(){$('#searchPanel').classList.remove('hidden');$('#searchInput').value='';search('');setTimeout(()=>$('#searchInput').focus(),10);}function hideSearch(){$('#searchPanel').classList.add('hidden');}
function esc(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
function search(q){const out=$('#searchResults');out.innerHTML='';const t=q.trim().toLowerCase(),items=Object.values(state.map.nodes).filter(n=>!t||n.text.toLowerCase().includes(t)||(n.description||'').toLowerCase().includes(t)).slice(0,60);items.forEach(n=>{const b=document.createElement('button');b.className='search-item';b.innerHTML=`${esc(n.text)}<small>${n.description?.trim()?'Idea · has description':n.id===state.map.rootId?'Central concept':'Idea'}</small>`;b.onclick=()=>{state.selected=n.id;state.edgeSelected=null;render();centerOn(n.id);hideSearch();};out.appendChild(b);});if(!items.length)out.innerHTML='<div style="padding:14px;color:var(--muted)">No matching ideas</div>';}

function createTemplate(template){
  const overview=fresh(`${template.name} — Overview`);overview.nodes[overview.rootId].description=`${template.name} story-structure overview. Open any beat to brainstorm that part of the story.`;
  template.beats.forEach((beat,i)=>{
    const beatMap=fresh(beat);beatMap.nodes[beatMap.rootId].description=`${template.name} beat. Brainstorm ${beat} here.`;state.project.sessions[beatMap.id]=beatMap;
    const id=uid();overview.nodes[id]={id,text:beat,description:`Open the dedicated ${beat} map.`,parentId:overview.rootId,color:COLORS[i%COLORS.length],edgeLabel:'',collapsed:false,created:now(),x:null,y:null,targetMapId:beatMap.id};
  });
  state.project.sessions[overview.id]=overview;state.project.templateHistory.push({name:template.name,overviewMapId:overview.id,created:now()});state.project.currentMapId=overview.id;state.map=overview;state.view={...overview.view};state.selected=overview.rootId;state.edgeSelected=null;state.focusRoot=null;state.history=[];save(false);$('#templateDialog').classList.add('hidden');render();fit();toast(`${template.name} added`);
}
function renderTemplates(){const host=$('#templateOptions');host.innerHTML='';TEMPLATES.forEach(t=>{const b=document.createElement('button');b.className='btn template-option';b.innerHTML=`<span><strong>${esc(t.name)}</strong><small>${t.beats.length} beat maps + overview</small></span>`;b.addEventListener('click',()=>createTemplate(t));host.appendChild(b);});}
function openTemplates(){$('#utilitySheet').classList.remove('open');renderTemplates();$('#templateDialog').classList.remove('hidden');}
function openShortcuts(){$('#utilitySheet').classList.remove('open');$('#shortcutsDialog').classList.remove('hidden');}

async function importFile(file){
  try{
    const obj=JSON.parse(await file.text());
    if(obj?.sessions||obj?.maps){
      const imported=normalizeProject(obj);if(!imported)throw new Error('Invalid project');
      if(!confirm('Open this complete project? The current browser project will be replaced.'))return;
      localStorage.setItem(BACKUP_KEY,JSON.stringify(state.project));
      state.project=imported;state.map=imported.sessions[imported.currentMapId];state.view={...(state.map.view||{x:0,y:0,scale:1})};state.selected=state.map.rootId;state.edgeSelected=null;state.focusRoot=null;state.history=[];state.sheetMode=null;save(false);render();fit();toast('Project opened');return;
    }
    const map=normalizeMap(obj);if(!map?.nodes?.[map.rootId])throw new Error('Invalid map');
    map.id=uid('m_');state.project.sessions[map.id]=map;state.project.currentMapId=map.id;state.map=map;state.view={...(map.view||{x:0,y:0,scale:1})};state.selected=map.rootId;state.edgeSelected=null;state.focusRoot=null;state.history=[];state.sheetMode=null;save(false);render();fit();toast('Map added to project');
  }catch(err){console.error(err);toast('Could not open that file');}
}

async function hashPass(pass,salt64){const enc=new TextEncoder(),key=await crypto.subtle.importKey('raw',enc.encode(pass),'PBKDF2',false,['deriveBits']),salt=Uint8Array.from(atob(salt64),c=>c.charCodeAt(0)),bits=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt,iterations:120000},key,256);return btoa(String.fromCharCode(...new Uint8Array(bits)));}
function authRec(){try{return JSON.parse(localStorage.getItem(AUTH_KEY)||'null');}catch{return null;}}
function authUi(){const r=authRec();$('#displayName').disabled=!!r;if(r)$('#displayName').value=r.name||'';$('#authTitle').textContent=r?'Welcome back':'Private workspace';$('#authCopy').textContent=r?'Unlock your local MindMap workspace.':'Create a local workspace lock. Your project stays in this browser unless you export it.';$('#authSubmit').textContent=r?'Unlock workspace':'Create workspace';}
async function authenticate(e){e.preventDefault();const pass=$('#passphrase').value,r=authRec();if(!r){const bytes=crypto.getRandomValues(new Uint8Array(16)),salt=btoa(String.fromCharCode(...bytes)),hash=await hashPass(pass,salt);localStorage.setItem(AUTH_KEY,JSON.stringify({name:$('#displayName').value.trim()||'Writer',salt,hash}));unlock();}else if(await hashPass(pass,r.salt)===r.hash)unlock();else{$('#authCopy').textContent='Passphrase does not match.';$('#passphrase').value='';}}
function unlock(){$('#auth').classList.add('hidden');$('#app').classList.remove('hidden');load();render();requestAnimationFrame(()=>fit());}
function lock(){save(false);$('#app').classList.add('hidden');$('#auth').classList.remove('hidden');authUi();}

$('#authForm').addEventListener('submit',authenticate);
$('#addBtn').onclick=()=>quickAdd();$('#undoBtn').onclick=undo;$('#addChildBtn').onclick=()=>quickAdd();$('#focusBtn').onclick=toggleFocus;$('#searchBtn').onclick=showSearch;$('#searchInput').oninput=e=>search(e.target.value);
$('#mapSelect').addEventListener('change',e=>setCurrentMap(e.target.value,true));
$('#newBtn').onclick=()=>newMap();$('#mobileNew').onclick=()=>{$('#utilitySheet').classList.remove('open');newMap();};$('#lockBtn').onclick=lock;$('#mobileLock').onclick=lock;
$('#templateBtn').onclick=openTemplates;$('#mobileTemplates').onclick=openTemplates;$('#templateCancel').onclick=()=>$('#templateDialog').classList.add('hidden');
$('#shortcutsBtn').onclick=openShortcuts;$('#mobileShortcuts').onclick=openShortcuts;$('#shortcutsClose').onclick=()=>$('#shortcutsDialog').classList.add('hidden');
$('#openLinkedBtn').onclick=()=>{const n=state.map.nodes[state.selected];if(n?.targetMapId&&state.project.sessions[n.targetMapId])setCurrentMap(n.targetMapId,true,false);};
$('#collapseBtn').onclick=toggleCollapse;$('#centerBtn').onclick=()=>centerOn(state.selected);$('#resetPosBtn').onclick=resetPosition;$('#deleteBtn').onclick=removeSelected;
$('#fitBtn').onclick=fit;$('#fitTopBtn').onclick=fit;$('#zoomIn').onclick=()=>{const v=size();zoomAt(v.w/2,v.h/2,1.2);};$('#zoomOut').onclick=()=>{const v=size();zoomAt(v.w/2,v.h/2,.83);};
$('#menuBtn').onclick=()=>$('#utilitySheet').classList.toggle('open');$('#contextAdd').onclick=()=>quickAdd();$('#contextEdit').onclick=()=>openSheet('edit',true);$('#contextFocus').onclick=toggleFocus;$('#contextMore').onclick=()=>openSheet('more');$('#sheetClose').onclick=()=>closeSheet();
$('#importInput').onchange=e=>{const f=e.target.files[0];if(f)importFile(f);e.target.value='';};$('#mobileImportInput').onchange=e=>{const f=e.target.files[0];if(f)importFile(f);e.target.value='';};

function beginField(key,label){state.editSession={key,label,pushed:false};}
function fieldInput(key,label,fn){if(!state.editSession||state.editSession.key!==key)beginField(key,label);if(!state.editSession.pushed){pushUndo(label);state.editSession.pushed=true;}fn();save(false);}
$('#ideaText').addEventListener('focus',()=>beginField('text:'+state.selected,'text edit'));$('#ideaText').addEventListener('input',e=>fieldInput('text:'+state.selected,'text edit',()=>{const n=state.map.nodes[state.selected];n.text=e.target.value;if(n.id===state.map.rootId)state.map.title=e.target.value||'Untitled Mind Map';}));$('#ideaText').addEventListener('keydown',e=>{if(e.key==='Enter')e.stopPropagation();});$('#ideaText').addEventListener('blur',()=>{state.editSession=null;render();});
$('#ideaDescription').addEventListener('focus',()=>beginField('description:'+state.selected,'description edit'));$('#ideaDescription').addEventListener('input',e=>fieldInput('description:'+state.selected,'description edit',()=>{state.map.nodes[state.selected].description=e.target.value;}));$('#ideaDescription').addEventListener('keydown',e=>e.stopPropagation());$('#ideaDescription').addEventListener('blur',()=>{state.editSession=null;render();});
$('#edgeLabel').addEventListener('focus',()=>beginField('edge:'+state.selected,'connection label'));$('#edgeLabel').addEventListener('input',e=>fieldInput('edge:'+state.selected,'connection label',()=>{state.map.nodes[state.selected].edgeLabel=e.target.value;}));$('#edgeLabel').addEventListener('keydown',e=>{if(e.key==='Enter'){e.stopPropagation();e.preventDefault();e.currentTarget.blur();}});$('#edgeLabel').addEventListener('blur',()=>{state.editSession=null;render();});

const svg=$('#svg');
svg.addEventListener('click',e=>{if(e.target===svg){state.selected=null;state.edgeSelected=null;closeSheet(false);render();}});
svg.addEventListener('wheel',e=>{e.preventDefault();const r=svg.getBoundingClientRect();zoomAt(e.clientX-r.left,e.clientY-r.top,e.deltaY<0?1.09:.92);},{passive:false});
svg.addEventListener('pointerdown',e=>{if(e.target.closest('.node,.quick-add,.edge-hit,.edge,.edge-label-group'))return;svg.setPointerCapture(e.pointerId);state.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(state.pointers.size===1)state.pan={x:e.clientX,y:e.clientY,v:{...state.view}};if(state.pointers.size===2){const pts=[...state.pointers.values()],dx=pts[1].x-pts[0].x,dy=pts[1].y-pts[0].y;state.pinch={dist:Math.hypot(dx,dy),scale:state.view.scale,mid:{x:(pts[0].x+pts[1].x)/2,y:(pts[0].y+pts[1].y)/2},view:{...state.view}};}});
svg.addEventListener('pointermove',e=>{if(!state.pointers.has(e.pointerId))return;state.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(state.pointers.size===1&&state.pan){state.view.x=state.pan.v.x+e.clientX-state.pan.x;state.view.y=state.pan.v.y+e.clientY-state.pan.y;applyView();}else if(state.pointers.size===2&&state.pinch){const pts=[...state.pointers.values()],dx=pts[1].x-pts[0].x,dy=pts[1].y-pts[0].y,mid={x:(pts[0].x+pts[1].x)/2,y:(pts[0].y+pts[1].y)/2},ratio=Math.hypot(dx,dy)/Math.max(1,state.pinch.dist),next=Math.max(.12,Math.min(2.6,state.pinch.scale*ratio)),wx=(state.pinch.mid.x-state.pinch.view.x)/state.pinch.scale,wy=(state.pinch.mid.y-state.pinch.view.y)/state.pinch.scale;state.view.scale=next;state.view.x=mid.x-wx*next;state.view.y=mid.y-wy*next;applyView();}});
function endPointer(e){state.pointers.delete(e.pointerId);if(state.pointers.size<2)state.pinch=null;if(!state.pointers.size){state.pan=null;save(false);}}
svg.addEventListener('pointerup',endPointer);svg.addEventListener('pointercancel',endPointer);

$('#inspectorHead').addEventListener('pointerdown',e=>{if(isMobile()||e.target.closest('button,input,textarea'))return;const panel=$('#inspector'),ws=$('#workspace'),pr=panel.getBoundingClientRect(),wr=ws.getBoundingClientRect();state.panelDrag={dx:e.clientX-pr.left,dy:e.clientY-pr.top,wr};$('#inspectorHead').setPointerCapture(e.pointerId);});
$('#inspectorHead').addEventListener('pointermove',e=>{const d=state.panelDrag;if(!d)return;const panel=$('#inspector'),pr=panel.getBoundingClientRect();let left=e.clientX-d.wr.left-d.dx,top=e.clientY-d.wr.top-d.dy;left=Math.max(8,Math.min(d.wr.width-pr.width-8,left));top=Math.max(8,Math.min(d.wr.height-pr.height-8,top));panel.style.right='auto';panel.style.left=left+'px';panel.style.top=top+'px';});$('#inspectorHead').addEventListener('pointerup',()=>state.panelDrag=null);
let sheetDrag=null;$('#sheetHandle').addEventListener('pointerdown',e=>{if(!isMobile())return;sheetDrag={start:e.clientY,last:e.clientY};$('#sheetHandle').setPointerCapture(e.pointerId);});$('#sheetHandle').addEventListener('pointermove',e=>{if(sheetDrag)sheetDrag.last=e.clientY;});$('#sheetHandle').addEventListener('pointerup',()=>{if(sheetDrag&&sheetDrag.last-sheetDrag.start>70)closeSheet();sheetDrag=null;});

document.addEventListener('keydown',e=>{
  if($('#app').classList.contains('hidden'))return;
  const typing=e.target.matches?.('input,textarea,[contenteditable="true"]')||!!document.querySelector('.inline-editor:focus');
  const ctrl=e.ctrlKey||e.metaKey,key=e.key.toLowerCase();
  if(ctrl&&key==='z'){e.preventDefault();undo();return;}
  if(ctrl&&key==='k'){e.preventDefault();showSearch();return;}
  if(ctrl&&key==='s'){e.preventDefault();if(e.shiftKey)$('#exportProject')?.click();else $('#exportJson')?.click();return;}
  if(ctrl&&key==='e'){e.preventDefault();$('#exportWord')?.click();return;}
  if(ctrl&&key==='p'){e.preventDefault();$('#exportPdf')?.click();return;}
  if(e.key==='Escape'){
    hideSearch();$('#utilitySheet').classList.remove('open');$('#templateDialog').classList.add('hidden');$('#shortcutsDialog').classList.add('hidden');$('#exportDialog').classList.add('hidden');closeSheet();
    if(state.focusRoot){state.focusRoot=null;render();fit();}
    return;
  }
  if(typing)return;
  if(e.key==='Enter'){e.preventDefault();quickAdd();return;}
  if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();removeSelected();return;}
  if(key==='f'){e.preventDefault();toggleFocus();return;}
  if(key==='c'){e.preventDefault();toggleCollapse();return;}
  if(e.key==='Home'){e.preventDefault();fit();return;}
  if(e.key==='?'){e.preventDefault();openShortcuts();return;}
});
window.addEventListener('resize',()=>{if(state.map)render();});

window.MindMapApp={
  version:VERSION,
  projectKey:PROJECT_KEY,
  getProject:()=>state.project,
  getCurrentMap:()=>state.map,
  save:()=>save(false),
  setCurrentMap,
  newMap
};
authUi();
})();