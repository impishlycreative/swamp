window.addEventListener('DOMContentLoaded',()=>{
  const panel=document.getElementById('searchPanel');
  const button=document.getElementById('searchBtn');
  const input=document.getElementById('searchInput');
  const utilitySheet=document.getElementById('utilitySheet');
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
  const rapid={active:false,parentId:null,parentLabel:'',count:0,busy:false};

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
  };
  const resetRapidInputs=()=>{
    rapidIdea.value='';
    rapidDescription.value='';
    requestAnimationFrame(()=>rapidIdea.focus());
  };
  const openRapidfireFor=node=>{
    if(!node?.dataset.id)return;
    detachRapidChooser();
    rapid.active=true;
    rapid.parentId=node.dataset.id;
    rapid.parentLabel=getNodeLabel(node);
    rapid.count=0;
    rapid.busy=false;
    setRapidButtons(true);
    panel?.classList.add('hidden');
    input?.blur();
    utilitySheet?.classList.remove('open');
    rapidParent.textContent=`Adding ideas to “${rapid.parentLabel}”`;
    rapidCount.textContent='0';
    rapidDialog.classList.remove('hidden');
    resetRapidInputs();
  };
  const endRapidfire=()=>{
    detachRapidChooser();
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
    rapid.count=0;
    setRapidButtons(true);
    attachRapidChooser();
    showToast('Rapidfire on — choose a node');
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
    const selected=getSelectedNode();
    if(selected)openRapidfireFor(selected);
  });

  const chooseRapidParent=e=>{
    if(!rapid.active||rapid.parentId||!rapidDialog.classList.contains('hidden')||!e.isTrusted)return;
    const node=e.target.closest?.('#nodes .node');
    if(!node)return;
    e.preventDefault();
    e.stopImmediatePropagation();
    openRapidfireFor(node);
  };
  let rapidChooserAttached=false;
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

      // quickAdd selects the child it creates. Before the next rapid entry,
      // safely move selection back to the original parent. Touch mode treats
      // two fast clicks on the same node as a double-tap add, so first click
      // the currently selected child to reset that tap sequence.
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
