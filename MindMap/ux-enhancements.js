(()=>{'use strict';
const PROJECT_KEY='swamp.mindmap.project.v2';
const PROJECTS_KEY='swamp.mindmap.projects.v1';
const UI_VERSION='2.7.0';
let editSnapshot=null;
let newMapPromptOpen=false;

const $=s=>document.querySelector(s);
const uid=(prefix='i_')=>`${prefix}${Math.random().toString(36).slice(2,9)}${Date.now().toString(36).slice(-5)}`;
const now=()=>new Date().toISOString();
const readJson=(key,fallback=null)=>{try{return JSON.parse(localStorage.getItem(key)||'null')||fallback;}catch{return fallback;}};

function injectStyles(){
  if($('#mindmapUx27Styles'))return;
  const style=document.createElement('style');style.id='mindmapUx27Styles';style.textContent=`
    .ux-modal{position:fixed;inset:0;z-index:250;display:grid;place-items:center;padding:16px;background:rgba(25,25,25,.38)}
    .ux-modal.hidden{display:none}.ux-card{width:min(520px,100%);background:var(--paper,#fff);color:var(--ink,#25231f);border:1px solid var(--line,#d9d7d0);border-radius:22px;padding:20px;box-shadow:0 22px 60px rgba(0,0,0,.22)}
    .ux-card h2{margin:0 0 7px}.ux-card p{margin:0 0 15px;color:var(--muted,#6f6b63);line-height:1.4}.ux-actions{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:16px}.ux-actions .btn{width:100%}
    .ux-project-list{display:grid;gap:8px;max-height:52vh;overflow:auto}.ux-project-row{display:flex;align-items:center;gap:9px;width:100%;text-align:left}.ux-project-row .project-copy{min-width:0;flex:1}.ux-project-row strong,.ux-project-row small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ux-project-row small{color:var(--muted,#6f6b63);font-weight:500;margin-top:2px}.ux-project-current{font-size:.72rem;font-weight:850;color:var(--accent,#315d48)}
    .ux-project-context{grid-column:1/-1;padding:4px 2px 1px;font-size:.76rem;color:var(--muted,#6f6b63)}
    .mobile-edit .ux-edit-actions{display:grid}.ux-edit-actions{display:none;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}.mobile-edit #sheetClose{display:none!important}
    .mobile-more #addChildBtn,.mobile-more #centerBtn{display:none!important}
    #mobileSaveTop{background:var(--paper,#fff)!important;border-color:var(--line,#d9d7d0)!important;color:var(--ink,#25231f)!important}
    #mobileSaveTop:active{background:var(--soft,#eef4f1)!important;color:var(--accent,#315d48)!important}
    @media(max-width:850px),(hover:none) and (pointer:coarse){
      #addBtn{display:none!important}
      #mobileOpenTop,#mobileCenterTop,#mobileLockTop{display:inline-flex!important}
      .toolbar{gap:2px!important;overflow-x:auto;scrollbar-width:none}.toolbar::-webkit-scrollbar{display:none}
      .toolbar .btn.icon,#mobileOpenTop,#mobileCenterTop,#mobileLockTop{width:36px;min-width:36px;min-height:40px;padding:0}
      .map-select{min-width:72px!important;max-width:88px!important}
      #mobileExport,#mobileLock,.utility-grid label[for="mobileImportInput"]{display:none!important}
      .ux-modal{place-items:end center;padding:8px}.ux-card{border-radius:24px;margin-bottom:env(safe-area-inset-bottom)}
    }
  `;document.head.appendChild(style);
}

function createButton(id,title,html){const b=document.createElement('button');b.id=id;b.type='button';b.className='btn icon mobile-only';b.title=title;b.setAttribute('aria-label',title);b.innerHTML=html;return b;}

function setupToolbar(){
  const toolbar=$('.toolbar'),newTop=$('#mobileNewTop'),saveTop=$('#mobileSaveTop'),menu=$('#menuBtn');if(!toolbar||!saveTop)return;
  if(!$('#mobileOpenTop')){const b=createButton('mobileOpenTop','Open / import','⇧');b.addEventListener('click',()=>{$('#mobileImportInput')?.click();b.blur();});saveTop.before(b);}
  if(!$('#mobileCenterTop')){const b=createButton('mobileCenterTop','Center selected idea','◎');b.addEventListener('click',()=>{$('#centerBtn')?.click();b.blur();});saveTop.after(b);}
  if(!$('#mobileLockTop')){const b=createButton('mobileLockTop','Lock workspace','⌾');b.addEventListener('click',()=>{$('#mobileLock')?.click();b.blur();});(menu||saveTop).before(b);}
  saveTop.addEventListener('click',()=>setTimeout(()=>saveTop.blur(),0),true);
  const topEdit=Array.from(toolbar.querySelectorAll('button')).find(b=>/edit idea/i.test(`${b.title||''} ${b.getAttribute('aria-label')||''}`));if(topEdit)topEdit.style.display='none';
  if(newTop)newTop.title='New map in this project';
}

function ensureEditActions(){
  const panel=$('#inspector');if(!panel||$('#uxEditActions'))return;
  const actions=document.createElement('div');actions.id='uxEditActions';actions.className='ux-edit-actions';actions.innerHTML='<button id="uxEditCancel" class="btn" type="button">Cancel</button><button id="uxEditDone" class="btn primary" type="button">Done</button>';
  const primary=panel.querySelector('.edit-primary:last-of-type');(primary||panel).insertAdjacentElement('afterend',actions);
  $('#uxEditCancel').addEventListener('click',cancelEdit);
  $('#uxEditDone').addEventListener('click',commitEdit);
}
function selectedId(){return $('#nodes .node.selected')?.dataset?.id||null;}
function beginEditSnapshot(){
  const panel=$('#inspector');if(!panel?.classList.contains('mobile-edit'))return;
  const id=selectedId();if(!id)return;
  if(editSnapshot?.id===id)return;
  editSnapshot={id,text:$('#ideaText')?.value||'',description:$('#ideaDescription')?.value||''};
}
function dispatchInput(el,value){if(!el)return;el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));}
function closeEditor(){const close=$('#sheetClose');if(close)close.click();else $('#inspector')?.classList.remove('mobile-open','mobile-edit','mobile-more');}
function cancelEdit(){
  if(editSnapshot&&selectedId()===editSnapshot.id){dispatchInput($('#ideaText'),editSnapshot.text);dispatchInput($('#ideaDescription'),editSnapshot.description);$('#ideaText')?.blur();$('#ideaDescription')?.blur();}
  editSnapshot=null;closeEditor();
}
function commitEdit(){editSnapshot=null;$('#ideaText')?.blur();$('#ideaDescription')?.blur();closeEditor();}
function watchEditor(){
  ensureEditActions();const panel=$('#inspector');if(!panel)return;
  const obs=new MutationObserver(()=>{if(panel.classList.contains('mobile-edit'))beginEditSnapshot();else editSnapshot=null;});obs.observe(panel,{attributes:true,attributeFilter:['class']});
}

function closeMoreOnOutsideTap(){
  document.addEventListener('pointerdown',e=>{
    const utility=$('#utilitySheet'),menu=$('#menuBtn');
    if(utility?.classList.contains('open')&&!utility.contains(e.target)&&!menu?.contains(e.target))utility.classList.remove('open');
    const panel=$('#inspector'),contextMore=$('#contextMore');
    if(panel?.classList.contains('mobile-more')&&!panel.contains(e.target)&&!contextMore?.contains(e.target))closeEditor();
  },true);
}

function modalBase(title,copy){
  const wrap=document.createElement('div');wrap.className='ux-modal';wrap.innerHTML=`<div class="ux-card" role="dialog" aria-modal="true"><h2></h2><p></p><div class="ux-body"></div></div>`;wrap.querySelector('h2').textContent=title;wrap.querySelector('p').textContent=copy||'';document.body.appendChild(wrap);return wrap;
}
function confirmChoice(title,copy,confirmLabel='Create'){
  return new Promise(resolve=>{const wrap=modalBase(title,copy),card=wrap.querySelector('.ux-card'),actions=document.createElement('div');actions.className='ux-actions';actions.innerHTML=`<button class="btn" type="button">Cancel</button><button class="btn primary" type="button"></button>`;actions.lastElementChild.textContent=confirmLabel;card.appendChild(actions);const finish=v=>{wrap.remove();resolve(v);};actions.firstElementChild.onclick=()=>finish(false);actions.lastElementChild.onclick=()=>finish(true);wrap.addEventListener('pointerdown',e=>{if(e.target===wrap)finish(false);});});
}

function interceptNewMap(){
  document.addEventListener('click',async e=>{
    const trigger=e.target.closest?.('#newBtn,#mobileNew,#mobileNewTop');if(!trigger||newMapPromptOpen)return;
    e.preventDefault();e.stopImmediatePropagation();newMapPromptOpen=true;$('#utilitySheet')?.classList.remove('open');
    const ok=await confirmChoice('Create a new map?','This adds a new map to the current project. Your existing maps stay in the project.','Create map');
    newMapPromptOpen=false;if(ok)window.MindMapApp?.newMap?.();
  },true);
}

function projectRegistry(){
  let reg=readJson(PROJECTS_KEY,null);if(!reg||typeof reg!=='object'||!reg.projects)reg={version:1,currentId:null,projects:{}};return reg;
}
function currentProject(){return readJson(PROJECT_KEY,null)||window.MindMapApp?.getProject?.()||null;}
function saveRegistry(reg){localStorage.setItem(PROJECTS_KEY,JSON.stringify(reg));}
function syncCurrentProject(){
  const project=currentProject();if(!project?.id)return null;const reg=projectRegistry();const serialized=JSON.stringify(project);if(JSON.stringify(reg.projects[project.id])!==serialized)reg.projects[project.id]=project;reg.currentId=project.id;saveRegistry(reg);return reg;
}
function freshProject(name){
  const root=uid(),mapId=uid('m_'),projectId=uid('p_'),stamp=now(),mapTitle='Untitled Mind Map';
  const map={version:'2.6.0',id:mapId,title:mapTitle,created:stamp,updated:stamp,rootId:root,nodes:{[root]:{id:root,text:mapTitle,description:'',parentId:null,color:'#F2D8A7',edgeLabel:'',collapsed:false,created:stamp,x:null,y:null,targetMapId:null}},view:{x:0,y:0,scale:1}};
  return{version:'2.6.0',id:projectId,title:name||'Untitled Project',created:stamp,updated:stamp,currentMapId:mapId,sessions:{[mapId]:map},templateHistory:[]};
}
function switchProject(id){
  const reg=syncCurrentProject()||projectRegistry(),target=reg.projects[id];if(!target)return;reg.currentId=id;saveRegistry(reg);localStorage.setItem(PROJECT_KEY,JSON.stringify(target));location.reload();
}
function createProject(name){
  const reg=syncCurrentProject()||projectRegistry(),project=freshProject(name);reg.projects[project.id]=project;reg.currentId=project.id;saveRegistry(reg);localStorage.setItem(PROJECT_KEY,JSON.stringify(project));location.reload();
}
function newProjectPrompt(){
  const wrap=modalBase('New project','A project contains one or more maps. Your current project will remain available.'),body=wrap.querySelector('.ux-body'),card=wrap.querySelector('.ux-card');body.innerHTML='<label style="display:block;font-size:.78rem;font-weight:800;margin-bottom:6px">Project name</label><input id="uxProjectName" class="input" maxlength="80" value="Untitled Project">';const actions=document.createElement('div');actions.className='ux-actions';actions.innerHTML='<button class="btn" type="button">Cancel</button><button class="btn primary" type="button">Create project</button>';card.appendChild(actions);const close=()=>wrap.remove();actions.firstElementChild.onclick=close;actions.lastElementChild.onclick=()=>{const name=$('#uxProjectName')?.value.trim()||'Untitled Project';close();createProject(name);};wrap.addEventListener('pointerdown',e=>{if(e.target===wrap)close();});setTimeout(()=>{$('#uxProjectName')?.focus();$('#uxProjectName')?.select();},30);
}
function showProjects(){
  const reg=syncCurrentProject()||projectRegistry(),wrap=modalBase('Projects','Switch projects, or create a new one. Maps live inside a project.'),body=wrap.querySelector('.ux-body'),card=wrap.querySelector('.ux-card'),list=document.createElement('div');list.className='ux-project-list';
  Object.values(reg.projects).sort((a,b)=>(b.updated||'').localeCompare(a.updated||'')).forEach(project=>{const row=document.createElement('button');row.type='button';row.className='btn ux-project-row';const count=Object.keys(project.sessions||{}).length;row.innerHTML=`<span class="project-copy"><strong></strong><small>${count} map${count===1?'':'s'}</small></span>${project.id===reg.currentId?'<span class="ux-project-current">CURRENT</span>':''}`;row.querySelector('strong').textContent=project.title||'Untitled Project';row.onclick=()=>{if(project.id===reg.currentId){wrap.remove();return;}switchProject(project.id);};list.appendChild(row);});body.appendChild(list);const actions=document.createElement('div');actions.className='ux-actions';actions.innerHTML='<button class="btn" type="button">Close</button><button class="btn primary" type="button">＋ New project</button>';card.appendChild(actions);actions.firstElementChild.onclick=()=>wrap.remove();actions.lastElementChild.onclick=()=>{wrap.remove();newProjectPrompt();};wrap.addEventListener('pointerdown',e=>{if(e.target===wrap)wrap.remove();});
}
function setupProjectUi(){
  const utility=$('#utilitySheet .utility-grid');if(utility&&!$('#mobileProjects')){const context=document.createElement('div');context.className='ux-project-context';context.id='uxProjectContext';utility.prepend(context);const projects=document.createElement('button');projects.id='mobileProjects';projects.className='btn';projects.type='button';projects.textContent='▣ Projects';projects.onclick=()=>{$('#utilitySheet')?.classList.remove('open');showProjects();};const newer=document.createElement('button');newer.id='mobileNewProject';newer.className='btn';newer.type='button';newer.textContent='＋ New project';newer.onclick=()=>{$('#utilitySheet')?.classList.remove('open');newProjectPrompt();};const newMap=$('#mobileNew');if(newMap){newMap.before(projects);newMap.before(newer);}else utility.prepend(projects,newer);}
  const toolbar=$('.toolbar');if(toolbar&&!$('#projectBtn')){const b=document.createElement('button');b.id='projectBtn';b.type='button';b.className='btn desktop-secondary';b.title='Projects';b.textContent='Projects';b.onclick=showProjects;$('#mapSelect')?.after(b);}
  refreshProjectContext();
}
function refreshProjectContext(){const p=currentProject(),context=$('#uxProjectContext'),select=$('#mapSelect');if(context)context.textContent=`Project: ${p?.title||'MindMap Project'} · Maps are listed above.`;if(select)select.title=`Maps in project: ${p?.title||'MindMap Project'}`;}

function clarifySaveFlow(){
  const title=$('#exportTitle'),dialog=$('#exportDialog');if(!dialog)return;if(title)title.textContent='Save / Share / Export';const intro=dialog.querySelector('.export-card>p');if(intro)intro.textContent='Choose what to save. On mobile, the next step opens your device share sheet so you can choose Files, Google Drive, OneDrive, or another installed provider.';
  const mapStrong=$('#exportJson strong'),projectStrong=$('#exportProject strong');if(mapStrong)mapStrong.textContent='Current map — Save / Share (.mindmap.json)';if(projectStrong)projectStrong.textContent='Complete project — Save / Share (.mindmap-project.json)';
  const mapSmall=$('#exportJson small'),projectSmall=$('#exportProject small');if(mapSmall)mapSmall.textContent='One map. Choose Files, Google Drive, OneDrive, or another destination in the system save/share step.';if(projectSmall)projectSmall.textContent='Every map in this project. Best choice for cloud backup or moving the whole project between devices.';
  const note=dialog.querySelector('.project-note');if(note)note.textContent='Cloud destinations are provided by your device/browser. On desktop, choose a synced Google Drive or OneDrive folder in Save As; on mobile, choose the provider from the share sheet.';
  const obs=new MutationObserver(()=>{if(dialog.classList.contains('hidden'))$('#mobileSaveTop')?.blur();});obs.observe(dialog,{attributes:true,attributeFilter:['class']});
}

function updateVersion(){document.title=document.title.replace(/MindMap\s+[^—]+—/,'MindMap 2.7.0 —');const small=$('.brand small');if(small)small.textContent='Swamp · v2.7.0';if(window.MindMapApp)window.MindMapApp.version=UI_VERSION;}

function init(){
  injectStyles();setupToolbar();watchEditor();closeMoreOnOutsideTap();interceptNewMap();setupProjectUi();clarifySaveFlow();updateVersion();syncCurrentProject();
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')syncCurrentProject();});window.addEventListener('beforeunload',syncCurrentProject);setInterval(()=>{if(!$('#app')?.classList.contains('hidden'))syncCurrentProject();refreshProjectContext();},2500);
}
window.addEventListener('DOMContentLoaded',init);
})();