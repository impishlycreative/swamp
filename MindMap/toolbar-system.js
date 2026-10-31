(()=>{'use strict';
  const $=id=>document.getElementById(id);
  const proxyButtons=[...document.querySelectorAll('[data-toolbar-target]')];
  const selects=[$('desktopMapSelect'),$('mobileMapSelect')].filter(Boolean);
  const legacyMap=$('mapSelect');

  function clickTarget(id){
    const target=$(id);
    if(target)target.click();
  }
  function dismissIdeaInspector(){
    const inspector=$('inspector');
    if(!inspector||inspector.classList.contains('hidden'))return;
    const svg=$('svg');
    if(svg)svg.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));
    inspector.classList.add('hidden');
    inspector.classList.remove('mobile-open','mobile-edit','mobile-more');
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
    button.addEventListener('click',()=>{
      dismissIdeaInspector();
      const sheet=$('utilitySheet');
      if(!sheet)return;
      sheet.classList.add('open');
      requestAnimationFrame(()=>{
        const projectSelect=$('projectSelect');
        if(projectSelect){
          projectSelect.focus();
          projectSelect.scrollIntoView({block:'nearest'});
        }
      });
    });
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

  document.addEventListener('mindmap:render',()=>{installProjectsButton();syncMaps();syncAllButtons();});
  window.addEventListener('pageshow',()=>{installProjectsButton();syncMaps();syncAllButtons();});
  installProjectsButton();
  syncVersion();
  syncMaps();
  syncAllButtons();
  requestAnimationFrame(()=>{installProjectsButton();syncMaps();syncAllButtons();});
})();
