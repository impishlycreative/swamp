window.addEventListener('DOMContentLoaded',()=>{
  const app=()=>window.MindMapApp;
  const utilitySheet=document.getElementById('utilitySheet');
  const utilityGrid=utilitySheet?.querySelector('.utility-grid');
  const menuBtn=document.getElementById('menuBtn');
  const mobileNew=document.getElementById('mobileNew');
  const mobileNewTop=document.getElementById('mobileNewTop');
  const mobileSaveTop=document.getElementById('mobileSaveTop');
  const mobileExport=document.getElementById('mobileExport');
  const mobileImportInput=document.getElementById('mobileImportInput');
  const mobileLock=document.getElementById('mobileLock');
  const newBtn=document.getElementById('newBtn');
  const addBtn=document.getElementById('addBtn');
  const searchBtn=document.getElementById('searchBtn');
  const centerBtn=document.getElementById('centerBtn');
  const addChildBtn=document.getElementById('addChildBtn');
  const inspector=document.getElementById('inspector');
  const sheetClose=document.getElementById('sheetClose');
  const sheetHandle=document.getElementById('sheetHandle');
  const ideaText=document.getElementById('ideaText');
  const ideaDescription=document.getElementById('ideaDescription');
  const exportDialog=document.getElementById('exportDialog');
  const exportTitle=document.getElementById('exportTitle');
  const mapSelect=document.getElementById('mapSelect');
  const PROJECTS_KEY='swamp.mindmap.projects.v1';
  const ACTIVE_PROJECT_KEY='swamp.mindmap.active-project.v1';
  const PROJECT_KEY=app()?.projectKey||'swamp.mindmap.project.v2';
  let editSnapshot=null;
  let syncTimer=null;
  let projectSwapInProgress=false;

  const style=document.createElement('style');
  style.id='mindmapUx27Styles';
  style.textContent=`
    .edit-confirm-actions{display:none;gap:10px;margin-top:14px}
    .mobile-edit .edit-confirm-actions{display:grid;grid-template-columns:1fr 1fr}
    .mobile-edit #sheetHandle{display:none!important}
    .utility-project{grid-column:1/-1;padding:10px 0 12px;border-bottom:1px solid var(--line);margin-bottom:2px}
    .utility-project label{display:block;font-size:.72rem;font-weight:850;letter-spacing:.04em;text-transform:uppercase;color:var(--muted);margin-bottom:6px}
    .utility-project select{width:100%;height:42px;border:1px solid var(--line);border-radius:12px;background:var(--paper);color:var(--ink);font-weight:750;padding:0 10px;margin-bottom:8px}
    .utility-project-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}
    .cloud-save-note{margin-top:10px;padding:10px 12px;border:1px solid var(--line);border-radius:12px;background:var(--soft);font-size:.78rem;line-height:1.4;color:var(--muted)}
    @media(max-width:850px),(hover:none) and (pointer:coarse){
      #addBtn{display:none!important}
      #mobileCenterTop,#mobileOpenTop,#mobileLockTop{display:inline-flex!important}
      #mobileSaveTop{background:var(--paper)!important;border-color:var(--line)!important;color:var(--ink)!important}
      #inspector.mobile-more #addChildBtn,#inspector.mobile-more #centerBtn{display:none!important}
      .toolbar{overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch}
      .toolbar::-webkit-scrollbar{display:none}
    }
  `;
  document.head.appendChild(style);

  const makeTopButton=(id,label,title)=>{
    const b=document.createElement('button');
    b.id=id;b.className='btn icon mobile-only';b.type='button';b.textContent=label;b.title=title;b.setAttribute('aria-label',title);return b;
  };
  const centerTop=makeTopButton('mobileCenterTop','⌖','Center selected idea');
  searchBtn?.insertAdjacentElement('afterend',centerTop);
  centerTop.addEventListener('click',()=>{centerBtn?.click();centerTop.blur();});

  const openTop=makeTopButton('mobileOpenTop','⇧','Open / import');
  const lockTop=makeTopButton('mobileLockTop','⌾','Lock workspace');
  mobileSaveTop?.insertAdjacentElement('afterend',openTop);
  openTop.insertAdjacentElement('afterend',lockTop);
  openTop.addEventListener('click',()=>{mobileImportInput?.click();openTop.blur();});
  lockTop.addEventListener('click',()=>{mobileLock?.click();lockTop.blur();});

  // The direct toolbar buttons replace duplicate utility-sheet actions on mobile.
  [mobileNew,mobileExport,mobileLock].forEach(el=>{if(el)el.style.display='none';});
  const mobileImportLabel=utilitySheet?.querySelector('label[for="mobileImportInput"]');
  if(mobileImportLabel)mobileImportLabel.style.display='none';

  if(mapSelect){
    mapSelect.title='Map in current project';
    mapSelect.setAttribute('aria-label','Map in current project');
  }

  const newMapPrompt=e=>{
    e?.preventDefault?.();
    e?.stopImmediatePropagation?.();
    const p=app()?.getProject?.();
    const projectName=(p?.title||'this project').trim()||'this project';
    if(!confirm(`Create a new map in “${projectName}”?\n\nYour existing maps will stay in this project.`))return;
    utilitySheet?.classList.remove('open');
    app()?.newMap?.();
  };
  [newBtn,mobileNew,mobileNewTop].forEach(el=>el?.addEventListener('click',newMapPrompt,true));

  // Dismiss the top-toolbar More sheet by tapping anywhere outside it.
  const dismissUtility=e=>{
    if(!utilitySheet?.classList.contains('open'))return;
    if(utilitySheet.contains(e.target)||menuBtn?.contains(e.target))return;
    utilitySheet.classList.remove('open');
  };
  document.addEventListener('pointerdown',dismissUtility,true);
  document.addEventListener('touchstart',dismissUtility,{capture:true,passive:true});

  // iOS can leave a tapped button visually focused. Explicitly release Save focus.
  const releaseSaveFocus=()=>setTimeout(()=>mobileSaveTop?.blur(),0);
  mobileSaveTop?.addEventListener('click',releaseSaveFocus);
  mobileSaveTop?.addEventListener('touchend',releaseSaveFocus,{passive:true});
  document.getElementById('exportCancel')?.addEventListener('click',releaseSaveFocus);
  exportDialog?.addEventListener('pointerdown',e=>{if(e.target===exportDialog)releaseSaveFocus();});

  // Make mobile Edit transactional: Done keeps the edit, Cancel restores the opening values.
  const editActions=document.createElement('div');
  editActions.id='mobileEditConfirm';editActions.className='edit-confirm-actions';
  editActions.innerHTML='<button id="mobileEditCancel" class="btn" type="button">Cancel</button><button id="mobileEditDone" class="btn primary" type="button">Done</button>';
  inspector?.appendChild(editActions);
  const originalSheetClose=sheetClose?.onclick;
  const hint=inspector?.querySelector('.hint');
  const defaultHint=hint?.textContent||'';

  const captureEdit=()=>{
    if(!inspector?.classList.contains('mobile-edit'))return;
    const selected=document.querySelector('#nodes .node.selected');
    const map=app()?.getCurrentMap?.();
    const nodeId=selected?.dataset?.id;
    const node=nodeId&&map?.nodes?.[nodeId];
    if(!node)return;
    editSnapshot={mapId:map.id,nodeId,text:node.text,description:node.description||'',mapTitle:map.title};
    if(hint)hint.textContent='Make your changes, then choose Done. Cancel keeps the previous text.';
  };
  const clearEdit=()=>{
    editSnapshot=null;
    if(hint)hint.textContent=defaultHint;
  };
  const closeWithOriginal=()=>{
    if(typeof originalSheetClose==='function')originalSheetClose.call(sheetClose);
    else sheetClose?.click();
  };
  const cancelEdit=()=>{
    const map=app()?.getCurrentMap?.();
    if(editSnapshot&&map?.id===editSnapshot.mapId&&map.nodes?.[editSnapshot.nodeId]){
      const node=map.nodes[editSnapshot.nodeId];
      node.text=editSnapshot.text;
      node.description=editSnapshot.description;
      if(node.id===map.rootId)map.title=editSnapshot.mapTitle;
      if(ideaText)ideaText.value=editSnapshot.text;
      if(ideaDescription)ideaDescription.value=editSnapshot.description;
      app()?.save?.();
    }
    clearEdit();
    closeWithOriginal();
  };
  const acceptEdit=()=>{
    ideaText?.blur();ideaDescription?.blur();app()?.save?.();clearEdit();closeWithOriginal();
  };
  document.getElementById('mobileEditCancel')?.addEventListener('click',cancelEdit);
  document.getElementById('mobileEditDone')?.addEventListener('click',acceptEdit);
  if(sheetClose){
    sheetClose.onclick=()=>inspector?.classList.contains('mobile-edit')?cancelEdit():originalSheetClose?.call(sheetClose);
  }
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&inspector?.classList.contains('mobile-edit')){
      e.preventDefault();e.stopImmediatePropagation();cancelEdit();
    }
  },true);
  if(inspector){
    const observer=new MutationObserver(()=>{
      if(inspector.classList.contains('mobile-edit')){
        if(!editSnapshot)captureEdit();
      }else clearEdit();
    });
    observer.observe(inspector,{attributes:true,attributeFilter:['class']});
  }

  // Clarify cloud-save behaviour without pretending the browser can force a provider.
  if(exportDialog){
    if(exportTitle)exportTitle.textContent='Save / Share / Export';
    const intro=exportDialog.querySelector('.export-card>p');
    if(intro)intro.textContent='Save the current map or the complete multi-map project. On mobile, exported files can be sent to a cloud provider through the system share sheet.';
    const existingNote=exportDialog.querySelector('.project-note');
    const cloud=document.createElement('div');
    cloud.className='cloud-save-note';
    cloud.innerHTML='<strong>Google Drive / OneDrive:</strong> choose a file format, then select Google Drive, OneDrive, or Files in the system picker/share sheet when that provider is installed. On desktop, choose a synced Drive or OneDrive folder in Save As.';
    existingNote?.insertAdjacentElement('beforebegin',cloud);
  }

  // Multiple local projects. The app still uses its established single-project key internally;
  // this registry swaps the active project into that key and reloads. Session unlock survives reload.
  const clone=value=>JSON.parse(JSON.stringify(value));
  const readRegistry=()=>{
    try{
      const parsed=JSON.parse(localStorage.getItem(PROJECTS_KEY)||'null');
      if(parsed&&typeof parsed==='object'&&parsed.projects&&typeof parsed.projects==='object')return parsed;
    }catch{}
    return{version:1,activeProjectId:null,projects:{}};
  };
  const writeRegistry=reg=>{
    localStorage.setItem(PROJECTS_KEY,JSON.stringify(reg));
    if(reg.activeProjectId)localStorage.setItem(ACTIVE_PROJECT_KEY,reg.activeProjectId);
  };
  let projectSelect=null;
  let renameProjectBtn=null;

  const renderProjectSelect=()=>{
    if(!projectSelect)return;
    const reg=readRegistry();
    const currentId=app()?.getProject?.()?.id||reg.activeProjectId;
    projectSelect.innerHTML='';
    Object.values(reg.projects)
      .sort((a,b)=>String(a?.data?.created||'').localeCompare(String(b?.data?.created||'')))
      .forEach(entry=>{
        const option=document.createElement('option');
        option.value=entry.id;
        option.textContent=(entry.data?.title||entry.title||'Untitled Project').trim()||'Untitled Project';
        option.selected=entry.id===currentId;
        projectSelect.appendChild(option);
      });
  };
  const syncCurrentProject=()=>{
    if(projectSwapInProgress)return;
    const current=app()?.getProject?.();
    if(!current?.id)return;
    app()?.save?.();
    const reg=readRegistry();
    reg.projects[current.id]={id:current.id,title:current.title||'Untitled Project',updated:current.updated||new Date().toISOString(),data:clone(current)};
    reg.activeProjectId=current.id;
    writeRegistry(reg);
    renderProjectSelect();
  };
  const scheduleSync=()=>{
    clearTimeout(syncTimer);
    syncTimer=setTimeout(syncCurrentProject,350);
  };
  const uid=prefix=>`${prefix}${Math.random().toString(36).slice(2,9)}${Date.now().toString(36).slice(-5)}`;
  const createProject=name=>{
    const timestamp=new Date().toISOString();
    const rootId=uid('i_'),mapId=uid('m_'),projectId=uid('p_');
    const map={version:'2.6.0',id:mapId,title:'Untitled Mind Map',created:timestamp,updated:timestamp,rootId,
      nodes:{[rootId]:{id:rootId,text:'Untitled Mind Map',description:'',parentId:null,color:'#F2D8A7',edgeLabel:'',collapsed:false,created:timestamp,x:null,y:null,targetMapId:null}},
      view:{x:0,y:0,scale:1}};
    return{version:'2.6.0',id:projectId,title:name||'Untitled Project',created:timestamp,updated:timestamp,currentMapId:mapId,sessions:{[mapId]:map},templateHistory:[]};
  };
  const switchProject=id=>{
    syncCurrentProject();
    const reg=readRegistry(),entry=reg.projects[id];
    if(!entry?.data)return;
    reg.activeProjectId=id;writeRegistry(reg);
    projectSwapInProgress=true;
    localStorage.setItem(PROJECT_KEY,JSON.stringify(entry.data));
    location.reload();
  };
  const newProject=()=>{
    syncCurrentProject();
    const raw=prompt('New project name','Untitled Project');
    if(raw===null)return;
    const name=raw.trim()||'Untitled Project';
    const project=createProject(name),reg=readRegistry();
    reg.projects[project.id]={id:project.id,title:project.title,updated:project.updated,data:clone(project)};
    reg.activeProjectId=project.id;writeRegistry(reg);
    projectSwapInProgress=true;
    localStorage.setItem(PROJECT_KEY,JSON.stringify(project));
    location.reload();
  };
  const renameProject=()=>{
    const current=app()?.getProject?.();if(!current)return;
    const raw=prompt('Project name',current.title||'Untitled Project');
    if(raw===null)return;
    current.title=raw.trim()||'Untitled Project';
    app()?.save?.();syncCurrentProject();renderProjectSelect();
  };

  if(utilityGrid){
    const box=document.createElement('div');
    box.className='utility-project';
    box.innerHTML='<label for="projectSelect">Project</label><select id="projectSelect" aria-label="Current project"></select><div class="utility-project-actions"><button id="newProjectBtn" class="btn" type="button">＋ New project</button><button id="renameProjectBtn" class="btn" type="button">✎ Rename</button></div>';
    utilityGrid.prepend(box);
    projectSelect=box.querySelector('#projectSelect');
    renameProjectBtn=box.querySelector('#renameProjectBtn');
    box.querySelector('#newProjectBtn')?.addEventListener('click',newProject);
    renameProjectBtn?.addEventListener('click',renameProject);
    projectSelect?.addEventListener('change',e=>switchProject(e.target.value));
  }

  const waitForProject=setInterval(()=>{
    if(!app()?.getProject?.())return;
    clearInterval(waitForProject);
    syncCurrentProject();
  },100);
  setTimeout(()=>clearInterval(waitForProject),10000);

  ['input','change','pointerup'].forEach(type=>document.addEventListener(type,scheduleSync,{passive:true}));
  [document.getElementById('importInput'),mobileImportInput].forEach(el=>el?.addEventListener('click',syncCurrentProject,true));
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')syncCurrentProject();});
  window.addEventListener('beforeunload',syncCurrentProject);
});
