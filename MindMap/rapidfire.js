window.addEventListener('DOMContentLoaded',()=>{
  const panel=document.getElementById('searchPanel');
  const button=document.getElementById('searchBtn');
  const input=document.getElementById('searchInput');
  const utilitySheet=document.getElementById('utilitySheet');
  const workspace=document.getElementById('workspace');
  const inspector=document.getElementById('inspector');
  const mobileNew=document.getElementById('mobileNew');
  const mobileNewTop=document.getElementById('mobileNewTop');
  const mobileSaveTop=document.getElementById('mobileSaveTop');
  const rapidBtn=document.getElementById('rapidfireBtn');
  const contextRapid=document.getElementById('contextRapid');
  const rapidDialog=document.getElementById('rapidfireDialog');
  const rapidForm=document.getElementById('rapidfireForm');
  const rapidIdea=document.getElementById('rapidfireIdea');
  const rapidDescription=document.getElementById('rapidfireDescription');
  const rapidAccept=document.getElementById('rapidfireAccept');
  const rapidCancel=document.getElementById('rapidfireCancel');
  const rapidParent=document.getElementById('rapidfireParent');
  const rapidCount=document.getElementById('rapidfireCount');
  const rapid={active:false,choosing:false,parentId:null,parentLabel:'',count:0,busy:false};

  const chooserStyle=document.createElement('style');
  chooserStyle.id='rapidfireChooserStyle';
  chooserStyle.textContent=`
    #rapidfireChooserPrompt{position:absolute;z-index:85;top:16px;left:50%;transform:translateX(-50%);max-width:min(560px,calc(100% - 28px));padding:10px 14px;border:1px solid var(--line);border-radius:14px;background:var(--paper);box-shadow:0 8px 24px rgba(0,0,0,.14);font-weight:850;text-align:center;pointer-events:none}
    #rapidfireChooserPrompt small{display:block;margin-top:3px;color:var(--muted);font-size:.74rem;font-weight:650}
    #rapidfireChooserPrompt.hidden{display:none}
    .workspace.rapidfire-choosing #nodes .node{cursor:pointer}
    .workspace.rapidfire-choosing #nodes .node .body{stroke:var(--accent)!important;stroke-width:3px;filter:drop-shadow(0 0 4px rgba(111,85,24,.28))}
    #rapidfireFromIdeaBtn.rapid-active{background:#6f5518;border-color:#6f5518;color:#fff}
  `;
  document.head.appendChild(chooserStyle);

  let chooserPrompt=document.getElementById('rapidfireChooserPrompt');
  if(!chooserPrompt&&workspace){
    chooserPrompt=document.createElement('div');
    chooserPrompt.id='rapidfireChooserPrompt';
    chooserPrompt.className='hidden';
    chooserPrompt.innerHTML='⚡ Choose a parent idea<small>Click a node to start Rapidfire · click anywhere else to cancel</small>';
    workspace.appendChild(chooserPrompt);
  }

  let rapidFromIdeaBtn=document.getElementById('rapidfireFromIdeaBtn');
  if(!rapidFromIdeaBtn&&inspector){
    const actions=inspector.querySelector('.actions');
    const addChild=document.getElementById('addChildBtn');
    if(actions){
      rapidFromIdeaBtn=document.createElement('button');
      rapidFromIdeaBtn.id='rapidfireFromIdeaBtn';
      rapidFromIdeaBtn.className='btn';
      rapidFromIdeaBtn.type='button';
      rapidFromIdeaBtn.textContent='⚡ Rapidfire';
      rapidFromIdeaBtn.title='Rapidfire ideas under this idea';
      rapidFromIdeaBtn.setAttribute('aria-label','Rapidfire ideas under this idea');
      if(addChild?.parentElement===actions)addChild.insertAdjacentElement('afterend',rapidFromIdeaBtn);
      else actions.prepend(rapidFromIdeaBtn);
    }
  }

  const dismissSearch=e=>{
    if(!panel||panel.classList.contains('hidden'))return;
    const target=e.target;
    if(panel.contains(target)||button?.contains(target))return;
    panel.classList.add('hidden');
    input?.blur();
  };
  document.addEventListener('pointerdown',dismissSearch,true);
  document.addEventListener('touchstart',dismissSearch,{capture:true,passive:true});
  mobileNew?.addEventListener('click',()=>utilitySheet?.classList.remove('open'),true);
  mobileNewTop?.addEventListener('click',()=>document.getElementById('newBtn')?.click());
  mobileSaveTop?.addEventListener('click',()=>document.getElementById('exportBtn')?.click());

  const getSelectedNode=()=>document.querySelector('#nodes .node.selected');
  const getNodeById=id=>Array.from(document.querySelectorAll('#nodes .node')).find(node=>node.dataset.id===id)||null;
  const getNodeLabel=node=>Array.from(node?.querySelectorAll('.idea-text')||[]).map(t=>t.textContent.trim()).filter(Boolean).join(' ')||'selected idea';
  const showToast=message=>{
    const toast=document.getElementById('toast');
    if(!toast)return;
    toast.textContent=message;
    toast.classList.add('show');
    clearTimeout(toast._rapidTimer);
    toast._rapidTimer=setTimeout(()=>toast.classList.remove('show'),1500);
  };
  const setRapidButtons=active=>{
    rapidBtn?.classList.toggle('rapid-active',active);
    contextRapid?.classList.toggle('rapid-active',active);
    rapidFromIdeaBtn?.classList.toggle('rapid-active',active);
  };
  const setChooserVisible=visible=>{
    rapid.choosing=visible;
    workspace?.classList.toggle('rapidfire-choosing',visible);
    chooserPrompt?.classList.toggle('hidden',!visible);
  };
  const resetRapidInputs=()=>{
    rapidIdea.value='';
    rapidDescription.value='';
    requestAnimationFrame(()=>rapidIdea.focus());
  };
  const hideInspector=()=>{
    inspector?.classList.add('hidden');
    inspector?.classList.remove('mobile-open','mobile-edit','mobile-more');
  };

  function attachRapidChooser(){
    if(rapidChooserAttached)return;
    document.addEventListener('click',chooseRapidParent,true);
    rapidChooserAttached=true;
  }
  function detachRapidChooser(){
    if(!rapidChooserAttached)return;
    document.removeEventListener('click',chooseRapidParent,true);
    rapidChooserAttached=false;
  }
  function cancelRapidChooser(showMessage=true){
    if(!rapid.choosing)return;
    detachRapidChooser();
    setChooserVisible(false);
    rapid.active=false;
    rapid.parentId=null;
    rapid.parentLabel='';
    rapid.count=0;
    rapid.busy=false;
    setRapidButtons(false);
    if(showMessage)showToast('Rapidfire cancelled');
  }

  const openRapidfireFor=node=>{
    if(!node?.dataset.id)return;
    detachRapidChooser();
    setChooserVisible(false);
    rapid.active=true;
    rapid.parentId=node.dataset.id;
    rapid.parentLabel=getNodeLabel(node);
    rapid.count=0;
    rapid.busy=false;
    setRapidButtons(true);
    panel?.classList.add('hidden');
    input?.blur();
    utilitySheet?.classList.remove('open');
    hideInspector();
    rapidParent.textContent=`Adding ideas to “${rapid.parentLabel}”`;
    rapidCount.textContent='0';
    rapidDialog.classList.remove('hidden');
    resetRapidInputs();
  };
  const endRapidfire=()=>{
    if(rapid.choosing){cancelRapidChooser();return;}
    detachRapidChooser();
    setChooserVisible(false);
    rapid.active=false;
    rapid.parentId=null;
    rapid.parentLabel='';
    rapid.count=0;
    rapid.busy=false;
    rapidDialog.classList.add('hidden');
    rapidAccept.disabled=false;
    setRapidButtons(false);
    rapidIdea.value='';
    rapidDescription.value='';
    showToast('Rapidfire ended');
  };
  const armOrOpenRapidfire=()=>{
    const selected=getSelectedNode();
    if(selected){openRapidfireFor(selected);return;}
    rapid.active=true;
    rapid.parentId=null;
    rapid.parentLabel='';
    rapid.count=0;
    rapid.busy=false;
    setRapidButtons(true);
    panel?.classList.add('hidden');
    input?.blur();
    utilitySheet?.classList.remove('open');
    setChooserVisible(true);
    attachRapidChooser();
  };

  rapidBtn?.addEventListener('click',e=>{
    e.preventDefault();
    e.stopPropagation();
    if(rapid.active)endRapidfire();
    else armOrOpenRapidfire();
  });
  contextRapid?.addEventListener('click',e=>{
    e.preventDefault();
    e.stopPropagation();
    if(rapid.active)endRapidfire();
    else armOrOpenRapidfire();
  });
  rapidFromIdeaBtn?.addEventListener('click',e=>{
    e.preventDefault();
    e.stopPropagation();
    const selected=getSelectedNode();
    if(selected)openRapidfireFor(selected);
    else armOrOpenRapidfire();
  });

  const chooseRapidParent=e=>{
    if(!rapid.active||!rapid.choosing||rapid.parentId||!rapidDialog.classList.contains('hidden')||!e.isTrusted)return;
    if(e.target.closest?.('#rapidfireBtn,#contextRapid,#rapidfireFromIdeaBtn'))return;
    const node=e.target.closest?.('#nodes .node');
    if(node){
      e.preventDefault();
      e.stopImmediatePropagation();
      openRapidfireFor(node);
      return;
    }
    cancelRapidChooser();
  };
  let rapidChooserAttached=false;

  const clickSvgNode=node=>{
    if(!node)return false;
    return node.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));
  };

  const addRapidIdea=()=>{
    if(rapid.busy||!rapid.parentId)return;
    const idea=rapidIdea.value.trim();
    const description=rapidDescription.value.trim();
    if(!idea){rapidIdea.focus();return;}
    rapid.busy=true;
    rapidAccept.disabled=true;
    let added=false;

    try{
      let parent=getNodeById(rapid.parentId);
      if(!parent)throw new Error('Rapidfire parent is no longer available');

      if(!parent.classList.contains('selected')){
        const current=getSelectedNode();
        if(current&&current.dataset.id!==rapid.parentId)clickSvgNode(current);
        parent=getNodeById(rapid.parentId);
        if(!parent||!clickSvgNode(parent))throw new Error('Could not select Rapidfire parent');
        parent=getNodeById(rapid.parentId);
        if(!parent?.classList.contains('selected'))throw new Error('Could not select Rapidfire parent');
      }

      const addButton=document.getElementById('addBtn');
      if(!addButton||addButton.disabled)throw new Error('Add Idea is unavailable');
      addButton.click();

      const titleField=document.getElementById('ideaText');
      const descriptionField=document.getElementById('ideaDescription');
      if(!titleField||!descriptionField)throw new Error('Idea editor is unavailable');

      titleField.value=idea;
      titleField.dispatchEvent(new Event('input',{bubbles:true}));
      descriptionField.value=description;
      descriptionField.dispatchEvent(new Event('input',{bubbles:true}));
      descriptionField.dispatchEvent(new Event('blur'));

      rapid.count+=1;
      rapidCount.textContent=String(rapid.count);
      added=true;
    }catch(err){
      console.error('Rapidfire add failed',err);
      showToast(err?.message||'Could not add Rapidfire idea');
    }finally{
      rapid.busy=false;
      rapidAccept.disabled=false;
      if(added)resetRapidInputs();
      else requestAnimationFrame(()=>rapidIdea.focus());
    }
  };

  rapidForm?.addEventListener('submit',e=>{
    e.preventDefault();
    addRapidIdea();
  });
  rapidDialog?.addEventListener('keydown',e=>{
    if(e.key==='Escape'){
      e.preventDefault();
      e.stopPropagation();
      endRapidfire();
      return;
    }
    e.stopPropagation();
  });
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&rapid.choosing){
      e.preventDefault();
      e.stopImmediatePropagation();
      cancelRapidChooser();
    }
  },true);
  rapidIdea?.addEventListener('keydown',e=>{
    if(e.key==='Enter'&&!e.shiftKey){
      e.preventDefault();
      e.stopPropagation();
      rapidForm.requestSubmit();
    }
  });
  rapidDescription?.addEventListener('keydown',e=>{
    if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){
      e.preventDefault();
      e.stopPropagation();
      rapidForm.requestSubmit();
    }
  });
  rapidCancel?.addEventListener('click',endRapidfire);
});
