window.addEventListener('DOMContentLoaded',()=>{
  'use strict';

  const app=()=>window.MindMapApp;
  const workspace=document.getElementById('workspace');
  const svg=document.getElementById('svg');
  const nodesLayer=document.getElementById('nodes');
  const undoBtn=document.getElementById('undoBtn');
  if(!workspace||!svg||!nodesLayer)return;

  const isMobile=()=>matchMedia('(max-width:850px),(hover:none) and (pointer:coarse)').matches||(navigator.maxTouchPoints>0&&Math.min(screen.width,screen.height)<900);
  const selected=new Set();
  const batchUndo=[];
  let selectedMapId=null;
  let drag=null;
  let mobileTap=null;
  let longPress=null;
  let suppressClickUntil=0;
  let clearingCoreSelection=false;
  const LONG_PRESS_MS=460;
  const MOVE_THRESHOLD=8;
  const MAX_BATCH_UNDO=60;

  const style=document.createElement('style');
  style.id='mindmapMultiSelectStyles';
  style.textContent=`
    #multiSelectBar{position:absolute;z-index:86;left:50%;bottom:18px;transform:translateX(-50%);display:flex;align-items:center;gap:8px;max-width:calc(100% - 28px);padding:8px 10px;border:1px solid var(--line);border-radius:14px;background:var(--paper);box-shadow:0 8px 24px rgba(0,0,0,.14)}
    #multiSelectBar.hidden{display:none}
    #multiSelectBar .multi-summary{font-size:.78rem;font-weight:850;white-space:nowrap}
    #multiSelectBar .multi-hint{font-size:.72rem;color:var(--muted);white-space:nowrap}
    #multiSelectBar .btn{min-height:34px;padding:6px 10px}
    #nodes .node.multi-selected .body{stroke:#6f5518!important;stroke-width:4px!important;stroke-dasharray:8 5}
    #nodes .node.multi-selected .halo{opacity:1}
    #nodes .node.multi-branch-dragging{opacity:.72;cursor:grabbing}
    #nodes .node.multi-drop-target .body{stroke:#2f7259!important;stroke-width:5px!important;filter:drop-shadow(0 0 5px rgba(47,114,89,.35))}
    @media(max-width:850px),(hover:none) and (pointer:coarse){
      #multiSelectBar{bottom:calc(78px + env(safe-area-inset-bottom));width:min(560px,calc(100% - 20px));justify-content:center;flex-wrap:wrap}
      #multiSelectBar .multi-hint{display:none}
      #multiSelectBar .multi-summary{flex:1 1 auto;text-align:center}
    }
  `;
  document.head.appendChild(style);

  const bar=document.createElement('div');
  bar.id='multiSelectBar';
  bar.className='hidden';
  bar.innerHTML='<span class="multi-summary"></span><span class="multi-hint">Drag a selected idea onto a new parent</span><button id="multiDeleteBtn" class="btn danger" type="button">Delete</button><button id="multiClearBtn" class="btn" type="button">Clear</button>';
  workspace.appendChild(bar);

  const toast=message=>{
    const el=document.getElementById('toast');
    if(!el)return;
    el.textContent=message;
    el.classList.add('show');
    clearTimeout(el._multiTimer);
    el._multiTimer=setTimeout(()=>el.classList.remove('show'),1700);
  };

  const currentMap=()=>app()?.getCurrentMap?.()||null;

  const ensureMap=()=>{
    const m=currentMap();
    const id=m?.id||null;
    if(selectedMapId&&id&&selectedMapId!==id){
      selected.clear();
      drag=null;
      mobileTap=null;
      selectedMapId=id;
    }else if(!selectedMapId&&id)selectedMapId=id;
    return m;
  };

  const descendantIds=(id,m=ensureMap(),out=new Set())=>{
    if(!m?.nodes?.[id]||out.has(id))return out;
    out.add(id);
    Object.values(m.nodes).forEach(node=>{if(node.parentId===id)descendantIds(node.id,m,out);});
    return out;
  };

  const hasSelectedAncestor=id=>{
    const m=ensureMap();
    let parent=m?.nodes?.[id]?.parentId||null;
    while(parent){
      if(selected.has(parent))return true;
      parent=m.nodes[parent]?.parentId||null;
    }
    return false;
  };

  const pruneSelection=()=>{
    const m=ensureMap();
    if(!m){selected.clear();return;}
    [...selected].forEach(id=>{if(id===m.rootId||!m.nodes[id])selected.delete(id);});
    [...selected].forEach(id=>{if(hasSelectedAncestor(id))selected.delete(id);});
  };

  const movedIds=()=>{
    const m=ensureMap(),out=new Set();
    if(!m)return out;
    pruneSelection();
    selected.forEach(id=>descendantIds(id,m,out));
    return out;
  };

  const mapFingerprint=m=>{
    if(!m)return'';
    const nodes=Object.values(m.nodes||{}).map(node=>({
      id:node.id,
      text:node.text,
      description:node.description||'',
      parentId:node.parentId||null,
      color:node.color||'',
      edgeLabel:node.edgeLabel||'',
      collapsed:!!node.collapsed,
      x:Number.isFinite(node.x)?node.x:null,
      y:Number.isFinite(node.y)?node.y:null,
      targetMapId:node.targetMapId||null
    })).sort((a,b)=>String(a.id).localeCompare(String(b.id)));
    return JSON.stringify({id:m.id,title:m.title||'',rootId:m.rootId,nodes});
  };

  const canUndoBatch=()=>{
    const entry=batchUndo[batchUndo.length-1],m=ensureMap();
    return !!entry&&!!m&&entry.mapId===m.id&&mapFingerprint(m)===entry.afterFingerprint;
  };

  const syncUndoButton=()=>{
    if(canUndoBatch()&&undoBtn)undoBtn.disabled=false;
  };

  const updateBar=()=>{
    pruneSelection();
    const summary=bar.querySelector('.multi-summary');
    summary.textContent=`${selected.size} idea${selected.size===1?'':'s'} selected`;
    bar.classList.toggle('hidden',selected.size===0);
  };

  const applyMarks=()=>{
    ensureMap();
    pruneSelection();
    document.querySelectorAll('#nodes .node').forEach(node=>node.classList.toggle('multi-selected',selected.has(node.dataset.id)));
    updateBar();
    syncUndoButton();
  };

  const clearDropTarget=()=>document.querySelectorAll('#nodes .node.multi-drop-target').forEach(node=>node.classList.remove('multi-drop-target'));

  const clearSelection=()=>{
    selected.clear();
    clearDropTarget();
    applyMarks();
  };

  const clearCoreSelection=()=>{
    clearingCoreSelection=true;
    try{
      svg.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));
    }finally{
      clearingCoreSelection=false;
    }
  };

  const refreshMap=()=>{
    const m=ensureMap();
    if(!m)return;
    app()?.save?.();
    window.dispatchEvent(new Event('resize'));
    requestAnimationFrame(applyMarks);
  };

  const recordBatchUndo=(before,label)=>{
    const m=ensureMap();
    if(!m)return;
    batchUndo.push({mapId:m.id,before,label,afterFingerprint:mapFingerprint(m)});
    if(batchUndo.length>MAX_BATCH_UNDO)batchUndo.shift();
    syncUndoButton();
  };

  const undoBatch=()=>{
    if(!canUndoBatch())return false;
    const entry=batchUndo.pop(),m=ensureMap();
    if(!entry||!m)return false;
    let snapshot=null;
    try{snapshot=JSON.parse(entry.before);}catch{return false;}
    Object.keys(m).forEach(key=>delete m[key]);
    Object.assign(m,snapshot);
    selected.clear();
    drag=null;
    mobileTap=null;
    clearDropTarget();
    refreshMap();
    toast(`Undid ${entry.label}`);
    return true;
  };

  const toggleSelection=id=>{
    const m=ensureMap();
    if(!m?.nodes?.[id])return;
    if(id===m.rootId){toast('The central idea cannot be moved or deleted');return;}
    if(selected.has(id))selected.delete(id);
    else{
      if(hasSelectedAncestor(id)){
        toast('That idea is already included in a selected branch');
        return;
      }
      const branch=descendantIds(id,m);
      [...selected].forEach(other=>{if(branch.has(other))selected.delete(other);});
      selected.add(id);
    }
    selectedMapId=m.id;
    clearCoreSelection();
    requestAnimationFrame(applyMarks);
  };

  const parseTranslate=el=>{
    const value=el?.getAttribute('transform')||'';
    const match=value.match(/translate\(\s*(-?[\d.]+)[ ,]+(-?[\d.]+)\s*\)/i);
    return match?{x:Number(match[1]),y:Number(match[2])}:{x:0,y:0};
  };

  const viewScale=()=>{
    const transform=document.getElementById('viewport')?.getAttribute('transform')||'';
    const match=transform.match(/scale\(\s*([\d.]+)\s*\)/i);
    return Math.max(.01,Number(match?.[1])||1);
  };

  const validDropTarget=(id,moving)=>{
    const m=ensureMap();
    return !!id&&!!m?.nodes?.[id]&&!moving.has(id);
  };

  const findDropTarget=(x,y,moving)=>{
    for(const el of document.elementsFromPoint(x,y)){
      const node=el.closest?.('#nodes .node');
      const id=node?.dataset?.id;
      if(validDropTarget(id,moving))return id;
    }
    let best=null,bestDist=Infinity;
    document.querySelectorAll('#nodes .node').forEach(node=>{
      const id=node.dataset.id;
      if(!validDropTarget(id,moving))return;
      const r=node.getBoundingClientRect(),cx=(r.left+r.right)/2,cy=(r.top+r.bottom)/2;
      const dist=Math.hypot(x-cx,y-cy);
      if(dist<Math.max(r.width,r.height)*.62&&dist<bestDist){best=id;bestDist=dist;}
    });
    return best;
  };

  const beginDrag=(e,node)=>{
    const moving=movedIds();
    const original=new Map();
    moving.forEach(id=>{
      const el=document.querySelector(`#nodes .node[data-id="${CSS.escape(id)}"]`);
      if(el)original.set(id,parseTranslate(el));
    });
    drag={pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,moved:false,target:null,moving,roots:[...selected],original};
    try{node.setPointerCapture?.(e.pointerId);}catch{}
  };

  const restorePreview=d=>{
    if(!d)return;
    d.original.forEach((pos,id)=>{
      const node=document.querySelector(`#nodes .node[data-id="${CSS.escape(id)}"]`);
      if(!node)return;
      node.setAttribute('transform',`translate(${pos.x} ${pos.y})`);
      node.classList.remove('multi-branch-dragging');
    });
    clearDropTarget();
  };

  const moveDrag=e=>{
    if(!drag||e.pointerId!==drag.pointerId)return;
    const distance=Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY);
    if(!drag.moved&&distance<MOVE_THRESHOLD)return;
    drag.moved=true;
    const scale=viewScale(),dx=(e.clientX-drag.startX)/scale,dy=(e.clientY-drag.startY)/scale;
    drag.original.forEach((pos,id)=>{
      const node=document.querySelector(`#nodes .node[data-id="${CSS.escape(id)}"]`);
      if(!node)return;
      node.classList.add('multi-branch-dragging');
      node.setAttribute('transform',`translate(${pos.x+dx} ${pos.y+dy})`);
    });
    drag.target=findDropTarget(e.clientX,e.clientY,drag.moving);
    clearDropTarget();
    if(drag.target)document.querySelector(`#nodes .node[data-id="${CSS.escape(drag.target)}"]`)?.classList.add('multi-drop-target');
    if(e.cancelable)e.preventDefault();
  };

  const finishDrag=e=>{
    if(!drag||e.pointerId!==drag.pointerId)return false;
    const d=drag;
    restorePreview(d);
    drag=null;
    if(!d.moved)return false;
    suppressClickUntil=Date.now()+500;
    if(!d.target){
      applyMarks();
      toast('Move cancelled');
      return true;
    }
    const m=ensureMap();
    if(!m?.nodes?.[d.target])return true;
    const before=JSON.stringify(m);
    d.roots.forEach(id=>{
      const node=m.nodes[id];
      if(!node)return;
      node.parentId=d.target;
      node.x=null;
      node.y=null;
    });
    m.nodes[d.target].collapsed=false;
    app()?.save?.();
    recordBatchUndo(before,'branch move');
    refreshMap();
    toast(`${d.roots.length} branch${d.roots.length===1?'':'es'} moved`);
    return true;
  };

  const deleteSelection=()=>{
    const m=ensureMap();
    if(!m||!selected.size)return;
    pruneSelection();
    const all=movedIds();
    const extra=all.size-selected.size;
    const message=selected.size===1
      ?`Delete the selected idea${extra?` and its ${extra} child idea${extra===1?'':'s'}`:''}?`
      :`Delete ${selected.size} selected ideas${extra?` and ${extra} child idea${extra===1?'':'s'}`:''}?`;
    if(!confirm(message))return;
    const before=JSON.stringify(m);
    all.forEach(id=>delete m.nodes[id]);
    selected.clear();
    app()?.save?.();
    recordBatchUndo(before,'branch deletion');
    refreshMap();
    toast('Selected ideas deleted');
  };

  const cancelLongPress=()=>{
    if(!longPress)return;
    clearTimeout(longPress.timer);
    longPress=null;
  };

  const armLongPress=(e,node)=>{
    cancelLongPress();
    const id=node.dataset.id;
    const m=ensureMap();
    if(!id||id===m?.rootId)return;
    const record={pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,node,id,timer:null};
    record.timer=setTimeout(()=>{
      if(longPress!==record)return;
      longPress=null;
      try{if(node.hasPointerCapture?.(e.pointerId))node.releasePointerCapture(e.pointerId);}catch{}
      try{node.dispatchEvent(new PointerEvent('pointercancel',{bubbles:true,cancelable:true,pointerId:e.pointerId,pointerType:'touch',clientX:e.clientX,clientY:e.clientY,button:0,buttons:0}));}catch{}
      toggleSelection(id);
      suppressClickUntil=Date.now()+700;
      toast('Multi-select on — tap more ideas or drag a selected idea');
    },LONG_PRESS_MS);
    longPress=record;
  };

  document.addEventListener('pointerdown',e=>{
    if(e.target.closest?.('#multiSelectBar'))return;
    const node=e.target.closest?.('#nodes .node');
    const id=node?.dataset?.id;

    if(!isMobile()){
      if((e.ctrlKey||e.metaKey)&&node){
        e.preventDefault();
        e.stopImmediatePropagation();
        toggleSelection(id);
        suppressClickUntil=Date.now()+350;
        return;
      }
      if(selected.size&&node&&selected.has(id)&&e.button===0){
        e.preventDefault();
        e.stopImmediatePropagation();
        beginDrag(e,node);
      }
      return;
    }

    if(e.pointerType!=='touch')return;
    if(selected.size){
      if(!node)return;
      const m=ensureMap();
      if(id===m?.rootId)return;
      e.preventDefault();
      e.stopImmediatePropagation();
      mobileTap={pointerId:e.pointerId,id,startX:e.clientX,startY:e.clientY};
      if(selected.has(id))beginDrag(e,node);
      return;
    }
    if(node)armLongPress(e,node);
  },true);

  document.addEventListener('pointermove',e=>{
    if(longPress&&e.pointerId===longPress.pointerId&&Math.hypot(e.clientX-longPress.startX,e.clientY-longPress.startY)>MOVE_THRESHOLD)cancelLongPress();
    if(mobileTap&&e.pointerId===mobileTap.pointerId&&Math.hypot(e.clientX-mobileTap.startX,e.clientY-mobileTap.startY)>MOVE_THRESHOLD&&!selected.has(mobileTap.id))mobileTap=null;
    moveDrag(e);
  },true);

  document.addEventListener('pointerup',e=>{
    if(longPress&&e.pointerId===longPress.pointerId)cancelLongPress();
    const hadDrag=drag&&e.pointerId===drag.pointerId;
    const moved=hadDrag?drag.moved:false;
    if(hadDrag)finishDrag(e);
    if(mobileTap&&e.pointerId===mobileTap.pointerId){
      const tap=mobileTap;
      mobileTap=null;
      if(!moved){
        toggleSelection(tap.id);
        suppressClickUntil=Date.now()+500;
      }
    }
  },true);

  document.addEventListener('pointercancel',e=>{
    if(longPress&&e.pointerId===longPress.pointerId)cancelLongPress();
    if(mobileTap&&e.pointerId===mobileTap.pointerId)mobileTap=null;
    if(drag&&e.pointerId===drag.pointerId){const d=drag;restorePreview(d);drag=null;applyMarks();}
  },true);

  document.addEventListener('click',e=>{
    if(clearingCoreSelection)return;
    if(e.isTrusted&&Date.now()<suppressClickUntil&&e.target.closest?.('#svg')){
      e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }
    if(!selected.size||e.target.closest?.('#multiSelectBar'))return;
    const node=e.target.closest?.('#nodes .node');
    if(isMobile()){
      if(!node&&e.target.closest?.('#svg'))clearSelection();
      return;
    }
    if(node&&selected.has(node.dataset.id)){
      e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }
    if(e.target.closest?.('#svg'))clearSelection();
  },true);

  document.addEventListener('keydown',e=>{
    const tag=(e.target?.tagName||'').toLowerCase();
    const typing=tag==='input'||tag==='textarea'||e.target?.isContentEditable;
    const ctrl=e.ctrlKey||e.metaKey;
    if(!typing&&ctrl&&e.key.toLowerCase()==='z'&&!e.shiftKey&&undoBatch()){
      e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }
    if(!selected.size||typing)return;
    if(e.key==='Delete'||e.key==='Backspace'){
      e.preventDefault();
      e.stopImmediatePropagation();
      deleteSelection();
    }else if(e.key==='Escape'){
      e.preventDefault();
      e.stopImmediatePropagation();
      clearSelection();
    }
  },true);

  undoBtn?.addEventListener('click',e=>{
    if(!undoBatch())return;
    e.preventDefault();
    e.stopImmediatePropagation();
  },true);

  bar.querySelector('#multiDeleteBtn')?.addEventListener('click',deleteSelection);
  bar.querySelector('#multiClearBtn')?.addEventListener('click',clearSelection);

  new MutationObserver(()=>requestAnimationFrame(applyMarks)).observe(nodesLayer,{childList:true,subtree:true});
  window.addEventListener('resize',applyMarks);
  applyMarks();
});