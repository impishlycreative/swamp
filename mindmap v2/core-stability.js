(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root&&root.document)api.install(root);
})(typeof window!=='undefined'?window:null,function(){
  'use strict';

  const VERSION='3.2.3';
  const PROJECT_KEY='swamp.mindmap.project.v2';
  const MAX_HISTORY=100;
  const COALESCE_MS=1400;

  function clone(value){return value==null?value:JSON.parse(JSON.stringify(value));}
  function stable(value){
    if(Array.isArray(value))return value.map(stable);
    if(value&&typeof value==='object'){
      const out={};Object.keys(value).sort().forEach(key=>{out[key]=stable(value[key]);});return out;
    }
    return value;
  }
  function semanticProject(input){
    const project=typeof input==='string'?JSON.parse(input):clone(input||{});
    delete project.version;delete project.updated;delete project.currentMapId;delete project.currentSessionId;
    const sessions=project.sessions||project.maps||{};
    Object.values(sessions).forEach(map=>{
      if(!map||typeof map!=='object')return;
      delete map.version;delete map.updated;delete map.view;
    });
    return stable(project);
  }
  function fingerprint(input){
    try{return JSON.stringify(semanticProject(input));}catch{return null;}
  }
  function sessionsOf(project){return project?.sessions||project?.maps||{};}
  function changedMapIds(before,after){
    const a=sessionsOf(before),b=sessionsOf(after),ids=new Set([...Object.keys(a),...Object.keys(b)]),out=[];
    ids.forEach(id=>{if(JSON.stringify(stable(a[id]||null))!==JSON.stringify(stable(b[id]||null)))out.push(id);});
    return out;
  }
  function same(a,b){return JSON.stringify(stable(a))===JSON.stringify(stable(b));}
  function inferChange(beforeInput,afterInput){
    let before,after;try{before=typeof beforeInput==='string'?JSON.parse(beforeInput):beforeInput;after=typeof afterInput==='string'?JSON.parse(afterInput):afterInput;}catch{return{label:'change',mapId:null};}
    const bs=sessionsOf(before),as=sessionsOf(after),mapIds=changedMapIds(semanticProject(before),semanticProject(after));
    if(Object.keys(as).length>Object.keys(bs).length)return{label:'new map',mapId:mapIds[0]||after?.currentMapId||null};
    if(Object.keys(as).length<Object.keys(bs).length)return{label:'map removal',mapId:mapIds[0]||before?.currentMapId||null};
    const mapId=mapIds[0]||after?.currentMapId||before?.currentMapId||null;
    const bm=bs[mapId],am=as[mapId];if(!bm||!am)return{label:'change',mapId};
    const br=Array.isArray(bm.relationships)?bm.relationships:[],ar=Array.isArray(am.relationships)?am.relationships:[];
    if(!same(br,ar))return{label:ar.length>br.length?'link added':ar.length<br.length?'link removed':'link changed',mapId};
    const bn=bm.nodes||{},an=am.nodes||{};
    if(Object.keys(an).length>Object.keys(bn).length)return{label:'add idea',mapId};
    if(Object.keys(an).length<Object.keys(bn).length){
      const writerChanged=Object.keys(an).some(id=>!same(bn[id]?.writer,an[id]?.writer));
      return{label:writerChanged?'idea consolidation':'delete idea',mapId};
    }
    for(const id of new Set([...Object.keys(bn),...Object.keys(an)])){
      const a=bn[id],b=an[id];if(!a||!b||same(a,b))continue;
      if(a.collapsed!==b.collapsed)return{label:b.collapsed?'collapse branch':'expand branch',mapId};
      if(a.parentId!==b.parentId)return{label:'move branch',mapId};
      if(a.x!==b.x||a.y!==b.y)return{label:(b.x==null&&b.y==null)?'auto position':'manual position',mapId};
      if(a.text!==b.text)return{label:'text edit',mapId};
      if(a.description!==b.description)return{label:'description edit',mapId};
      if(a.edgeLabel!==b.edgeLabel)return{label:'connection label',mapId};
      if(a.color!==b.color)return{label:'colour change',mapId};
      if(!same(a.writer?.details,b.writer?.details))return{label:'idea consolidation',mapId};
      if(a.writer?.type!==b.writer?.type)return{label:'idea type',mapId};
      if(!same(a.writer?.threads,b.writer?.threads))return{label:'story thread',mapId};
      if(!same(a.writer?.flags,b.writer?.flags))return{label:'idea flag',mapId};
      if(!same(a.writer,b.writer))return{label:'writer detail',mapId};
    }
    return{label:'change',mapId};
  }

  class UnifiedHistory{
    constructor(max=MAX_HISTORY){this.max=max;this.entries=[];}
    clear(){this.entries.length=0;}
    record(beforeRaw,afterRaw,time=Date.now()){
      const beforeFingerprint=fingerprint(beforeRaw),afterFingerprint=fingerprint(afterRaw);
      if(!beforeFingerprint||!afterFingerprint||beforeFingerprint===afterFingerprint)return false;
      const meta=inferChange(beforeRaw,afterRaw),last=this.entries[this.entries.length-1];
      const coalesce=meta.label==='text edit'||meta.label==='description edit'||meta.label==='connection label';
      if(coalesce&&last&&last.label===meta.label&&last.mapId===meta.mapId&&last.afterFingerprint===beforeFingerprint&&time-last.time<COALESCE_MS){
        last.afterRaw=afterRaw;last.afterFingerprint=afterFingerprint;last.time=time;return true;
      }
      const derivedAfterAdd=last&&last.label==='add idea'&&(meta.label==='writer detail'||meta.label==='idea type')&&last.mapId===meta.mapId&&last.afterFingerprint===beforeFingerprint&&time-last.time<700;
      if(derivedAfterAdd){last.afterRaw=afterRaw;last.afterFingerprint=afterFingerprint;last.time=time;return true;}
      this.entries.push({beforeRaw,afterRaw,beforeFingerprint,afterFingerprint,label:meta.label,mapId:meta.mapId,time});
      if(this.entries.length>this.max)this.entries.shift();return true;
    }
    canUndo(currentRaw){const last=this.entries[this.entries.length-1];return !!last&&last.afterFingerprint===fingerprint(currentRaw);}
    takeUndo(currentRaw){if(!this.canUndo(currentRaw))return null;return this.entries.pop();}
    get length(){return this.entries.length;}
  }

  function install(win){
    if(win.__SWAMP_CORE_STABILITY__)return win.SwampMindMapCore;
    win.__SWAMP_CORE_STABILITY__=true;
    const doc=win.document,history=new UnifiedHistory();
    let restoring=false,enabled=false,initialized=false,lastRaw=null,originalSetItem=null;

    function applyVersion(){
      const wantedTitle=`MindMap ${VERSION} V2 — Swamp`;
      if(doc.title!==wantedTitle)doc.title=wantedTitle;
      if(doc.documentElement.dataset.mindmapV2!==VERSION)doc.documentElement.dataset.mindmapV2=VERSION;
      const wantedToolbar=`V2 · ${VERSION}`;
      doc.querySelectorAll('[data-toolbar-version]').forEach(el=>{if(el.textContent!==wantedToolbar)el.textContent=wantedToolbar;});
    }
    win.SWAMP_MINDMAP_VERSION=VERSION;
    applyVersion();

    function currentRaw(){try{return win.localStorage.getItem(PROJECT_KEY);}catch{return null;}}
    function undoControls(){return [doc.getElementById('undoBtn'),...doc.querySelectorAll('[data-toolbar-target="undoBtn"]')].filter(Boolean);}
    function syncUndo(){
      const can=history.canUndo(currentRaw());
      undoControls().forEach(el=>{const disabled=!can;if(el.disabled!==disabled)el.disabled=disabled;if(can){if(el.hasAttribute('aria-disabled'))el.removeAttribute('aria-disabled');}else if(el.getAttribute('aria-disabled')!=='true')el.setAttribute('aria-disabled','true');});
    }
    function record(before,after){if(!enabled||restoring||!after)return;if(!initialized){initialized=true;lastRaw=after;syncUndo();return;}if(!before)return;history.record(before,after);lastRaw=after;syncUndo();}

    try{
      const proto=win.Storage?.prototype;
      originalSetItem=proto?.setItem;
      if(originalSetItem){
        proto.setItem=function(key,value){
          if(key!==PROJECT_KEY||this!==win.localStorage||restoring)return originalSetItem.call(this,key,value);
          const before=win.localStorage.getItem(PROJECT_KEY),result=originalSetItem.call(this,key,value),after=String(value);
          record(before,after);return result;
        };
      }
    }catch(err){console.warn('Unified history storage hook unavailable',err);}

    function replaceObject(target,source){Object.keys(target||{}).forEach(key=>delete target[key]);Object.assign(target,clone(source));}
    function restore(entry){
      const app=win.MindMapApp;if(!app)return false;
      let restored;try{restored=JSON.parse(entry.beforeRaw);}catch{return false;}
      const project=app.getProject?.(),currentMap=app.getCurrentMap?.();if(!project||!currentMap)return false;
      const sessions=restored.sessions||restored.maps;if(!sessions)return false;
      let targetId=entry.mapId&&sessions[entry.mapId]?entry.mapId:(sessions[currentMap.id]?currentMap.id:(restored.currentMapId||Object.keys(sessions)[0]));
      if(!targetId||!sessions[targetId])return false;
      const selected=doc.querySelector('#nodes .node.selected')?.dataset.id||null;
      const view=currentMap.id===targetId?clone(currentMap.view):null;
      const restoredMap=clone(sessions[targetId]);if(view)restoredMap.view=view;
      restoring=true;
      try{
        replaceObject(project,restored);
        replaceObject(currentMap,restoredMap);
        project.sessions=project.sessions||project.maps||{};delete project.maps;project.sessions[targetId]=currentMap;project.currentMapId=targetId;
        app.setCurrentMap?.(targetId,false,false);
        app.save?.();
        lastRaw=currentRaw();
      }finally{restoring=false;}
      win.requestAnimationFrame(()=>{
        const el=selected&&doc.querySelector(`#nodes .node[data-id="${CSS.escape(selected)}"]`);el?.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:win}));
        win.dispatchEvent(new Event('resize'));syncUndo();
      });
      const toast=doc.getElementById('toast');if(toast){toast.textContent=`Undid ${entry.label||'change'}`;toast.classList.add('show');clearTimeout(toast._unifiedUndoTimer);toast._unifiedUndoTimer=setTimeout(()=>toast.classList.remove('show'),1700);}
      return true;
    }
    function undo(){const raw=currentRaw(),entry=history.takeUndo(raw);if(!entry){syncUndo();return false;}return restore(entry);}
    function typingTarget(target){return target instanceof win.HTMLInputElement||target instanceof win.HTMLTextAreaElement||target instanceof win.HTMLSelectElement||target?.isContentEditable;}
    function interceptUndo(e){
      const click=e.type==='click'&&e.target.closest?.('#undoBtn,[data-toolbar-target="undoBtn"]');
      const key=e.type==='keydown'&&(e.ctrlKey||e.metaKey)&&!e.shiftKey&&String(e.key).toLowerCase()==='z';
      if(!click&&!key)return;
      if(key&&typingTarget(e.target)){e.stopImmediatePropagation();return;}
      if(undo()){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();return;}
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    }
    win.addEventListener('click',interceptUndo,true);
    win.addEventListener('keydown',interceptUndo,true);

    function poll(){
      const raw=currentRaw();
      if(enabled&&!restoring&&raw&&lastRaw&&raw!==lastRaw&&fingerprint(raw)!==fingerprint(lastRaw))record(lastRaw,raw);
      if(raw){lastRaw=raw;if(!initialized&&win.MindMapApp?.getCurrentMap?.())initialized=true;}applyVersion();syncUndo();
    }
    function boot(){lastRaw=currentRaw();enabled=true;applyVersion();syncUndo();
      const title=doc.querySelector('title');if(title)new MutationObserver(applyVersion).observe(title,{childList:true,characterData:true,subtree:true});
      const undo=doc.getElementById('undoBtn');if(undo)new MutationObserver(syncUndo).observe(undo,{attributes:true,attributeFilter:['disabled']});
      win.setInterval(poll,500);
    }
    if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',boot,{once:true});else boot();

    win.SwampMindMapCore={VERSION,PROJECT_KEY,history,undo,recordExternal:(before,after)=>record(before,after),semanticProject,fingerprint,inferChange};
    return win.SwampMindMapCore;
  }

  return{VERSION,PROJECT_KEY,UnifiedHistory,semanticProject,fingerprint,inferChange,install};
});
