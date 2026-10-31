(()=>{'use strict';
  const $=id=>document.getElementById(id);
  const proxyButtons=[...document.querySelectorAll('[data-toolbar-target]')];
  const selects=[$('desktopMapSelect'),$('mobileMapSelect')].filter(Boolean);
  const legacyMap=$('mapSelect');

  function clickTarget(id){
    const target=$(id);
    if(target)target.click();
  }
  function installProjectsStyles(){
    if($('mindmapProjectsDialogStyles'))return;
    const style=document.createElement('style');
    style.id='mindmapProjectsDialogStyles';
    style.textContent=`
      #projectsDialog .projects-card{width:min(560px,100%)}
      #projectsDialog .projects-card h2{margin-bottom:6px}
      #projectsDialog .projects-card>p{margin-bottom:14px}
      #projectsDialog .projects-list{display:grid;gap:8px;max-height:52vh;overflow:auto}
      #projectsDialog .project-row{display:flex;align-items:center;gap:10px;text-align:left;padding:12px 13px}
      #projectsDialog .project-copy{min-width:0;flex:1}
      #projectsDialog .project-copy strong,#projectsDialog .project-copy small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      #projectsDialog .project-copy small{margin-top:2px;color:var(--muted);font-weight:550}
      #projectsDialog .project-current{flex:0 0 auto;font-size:.72rem;font-weight:900;color:var(--accent);letter-spacing:.04em}
      #projectsDialog .projects-actions{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:14px}
      @media(max-width:620px){#projectsDialog .projects-actions{grid-template-columns:1fr}#projectsDialog .projects-card{padding:20px}}
    `;
    document.head.appendChild(style);
  }
  function projectMapCount(projectId){
    try{
      const registry=JSON.parse(localStorage.getItem('swamp.mindmap.projects.v1')||'null');
      const entry=registry?.projects?.[projectId];
      const storageKey=entry?.storageKey||`swamp.mindmap.project.data.${projectId}`;
      const project=JSON.parse(localStorage.getItem(storageKey)||'null');
      if(project?.sessions&&typeof project.sessions==='object')return Object.keys(project.sessions).length;
    }catch{}
    return null;
  }
  function closeProjectsDialog(){
    $('projectsDialog')?.remove();
  }
  function showProjectsDialog(){
    const projectSelect=$('projectSelect');
    if(!projectSelect)return;
    $('utilitySheet')?.classList.remove('open');
    closeProjectsDialog();
    installProjectsStyles();

    const dialog=document.createElement('div');
    dialog.id='projectsDialog';
    dialog.className='modal';
    dialog.setAttribute('role','dialog');
    dialog.setAttribute('aria-modal','true');
    dialog.setAttribute('aria-labelledby','projectsDialogTitle');

    const card=document.createElement('div');
    card.className='card projects-card';
    card.innerHTML='<h2 id="projectsDialogTitle">Projects</h2><p>Switch projects or create a new one. Each project keeps its own group of maps.</p>';

    const list=document.createElement('div');
    list.className='projects-list';
    const currentId=projectSelect.value;
    [...projectSelect.options].forEach(option=>{
      const row=document.createElement('button');
      row.type='button';
      row.className='btn project-row';
      const count=projectMapCount(option.value);
      const countText=count===null?'Project':`${count} map${count===1?'':'s'}`;
      row.innerHTML=`<span class="project-copy"><strong></strong><small>${countText}</small></span>${option.value===currentId?'<span class="project-current">CURRENT</span>':''}`;
      row.querySelector('strong').textContent=option.textContent||'Untitled Project';
      row.addEventListener('click',()=>{
        if(option.value===projectSelect.value){closeProjectsDialog();return;}
        projectSelect.value=option.value;
        closeProjectsDialog();
        projectSelect.dispatchEvent(new Event('change',{bubbles:true}));
      });
      list.appendChild(row);
    });
    card.appendChild(list);

    const actions=document.createElement('div');
    actions.className='projects-actions';
    actions.innerHTML='<button class="btn" type="button" data-project-action="close">Close</button><button class="btn" type="button" data-project-action="rename">✎ Rename current</button><button class="btn primary" type="button" data-project-action="new">＋ New project</button>';
    card.appendChild(actions);
    dialog.appendChild(card);
    document.body.appendChild(dialog);

    actions.querySelector('[data-project-action="close"]')?.addEventListener('click',closeProjectsDialog);
    actions.querySelector('[data-project-action="rename"]')?.addEventListener('click',()=>{closeProjectsDialog();$('renameProjectBtn')?.click();});
    actions.querySelector('[data-project-action="new"]')?.addEventListener('click',()=>{closeProjectsDialog();$('newProjectBtn')?.click();});
    dialog.addEventListener('pointerdown',e=>{if(e.target===dialog)closeProjectsDialog();});
    card.addEventListener('pointerdown',e=>e.stopPropagation());
  }
  function installProjectsButton(){
    const mapSelect=$('desktopMapSelect');
    const row=mapSelect?.closest('.tb-row');
    if(!mapSelect||!row||$('desktopProjectsBtn'))return;
    const button=document.createElement('button');
    button.id='desktopProjectsBtn';
    button.type='button';
    button.className='tb-button';
    button.title='Switch, create, or rename projects';
    button.setAttribute('aria-label','Projects');
    button.textContent='▣ Projects';
    button.addEventListener('click',showProjectsDialog);
    mapSelect.insertAdjacentElement('afterend',button);
  }
  function syncVersion(){
    const match=document.title.match(/MindMap\s+([^\s—]+)/i);
    const version=match?.[1]||'';
    document.querySelectorAll('[data-toolbar-version]').forEach(el=>el.textContent=version?`Swamp · v${version.replace(/^v/i,'')}`:'Swamp');
  }
  function syncMaps(){
    if(!legacyMap)return;
    for(const select of selects){
      const value=legacyMap.value;
      select.innerHTML=legacyMap.innerHTML;
      select.value=value;
      select.disabled=legacyMap.disabled;
    }
  }
  function syncButton(button){
    const id=button.dataset.toolbarTarget;
    const target=$(id);
    if(!target)return;
    button.disabled=!!target.disabled;
    const active=target.classList.contains('active')||target.classList.contains('rapid-active')||target.getAttribute('aria-pressed')==='true';
    button.classList.toggle('is-active',active);
  }
  function syncAllButtons(){proxyButtons.forEach(syncButton);}

  proxyButtons.forEach(button=>{
    button.addEventListener('click',e=>{
      e.preventDefault();
      const fileId=button.dataset.toolbarFile;
      if(fileId){$(fileId)?.click();return;}
      clickTarget(button.dataset.toolbarTarget);
    });
  });
  selects.forEach(select=>select.addEventListener('change',()=>{
    if(!legacyMap)return;
    legacyMap.value=select.value;
    legacyMap.dispatchEvent(new Event('change',{bubbles:true}));
  }));

  if(legacyMap){
    new MutationObserver(syncMaps).observe(legacyMap,{childList:true,subtree:true,attributes:true});
    legacyMap.addEventListener('change',syncMaps);
  }

  const observedTargets=new Set(proxyButtons.map(b=>b.dataset.toolbarTarget).filter(Boolean));
  observedTargets.forEach(id=>{
    const target=$(id);if(!target)return;
    new MutationObserver(syncAllButtons).observe(target,{attributes:true,attributeFilter:['disabled','class','aria-pressed']});
  });

  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('projectsDialog'))closeProjectsDialog();});
  document.addEventListener('mindmap:render',()=>{installProjectsButton();syncMaps();syncAllButtons();});
  window.addEventListener('pageshow',()=>{installProjectsButton();syncMaps();syncAllButtons();});
  installProjectsButton();
  syncVersion();
  syncMaps();
  syncAllButtons();
  requestAnimationFrame(()=>{installProjectsButton();syncMaps();syncAllButtons();});
})();
