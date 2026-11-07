(()=>{'use strict';
if(window.MindMapV3Storage)return;
const PROJECT_KEY='swamp.mindmap.project.v2';
const DB_NAME='swamp.mindmap.offline.v3';
const STORE='snapshots';
let db=null,backupTimer=null,lastSaved=null,restored=false,error=null;
function valid(raw){
  try{const x=JSON.parse(raw);return x&&typeof x==='object'&&
    x.sessions&&typeof x.sessions==='object'&&Object.keys(x.sessions).length>0;}
  catch{return false;}
}
function open(){
  return new Promise((resolve,reject)=>{
    if(!window.indexedDB){reject(Error('IndexedDB unavailable'));return;}
    const req=indexedDB.open(DB_NAME,1);
    req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE);};
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error||Error('Could not open storage'));
  });
}
function get(key){
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE,'readonly'),req=tx.objectStore(STORE).get(key);
    req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error);
  });
}
function put(key,value){
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE,'readwrite');
    tx.objectStore(STORE).put(value,key);
    tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
    tx.onabort=()=>reject(tx.error||Error('Snapshot write aborted'));
  });
}
const ready=(async()=>{
  try{
    db=await open();
    const saved=await get('project');
    const local=localStorage.getItem(PROJECT_KEY);
    if(!local&&saved?.data&&valid(saved.data)){
      localStorage.setItem(PROJECT_KEY,saved.data);
      restored=true;lastSaved=saved.data;
    }
    if(local&&valid(local)){lastSaved=saved?.data||null;scheduleBackup();}
    return true;
  }catch(e){error=e.message||String(e);return false;}
})();
async function backupNow(){
  await ready;if(!db)return false;
  const raw=localStorage.getItem(PROJECT_KEY);
  if(!raw||!valid(raw)||raw===lastSaved)return false;
  try{
    await put('project',{data:raw,at:new Date().toISOString(),format:'swamp.mindmap.project.v2'});
    lastSaved=raw;error=null;return true;
  }catch(e){error=String(e.message||e);return false;}
}
function scheduleBackup(){clearTimeout(backupTimer);backupTimer=setTimeout(backupNow,350);}
async function requestPersistence(){
  if(!navigator.storage?.persist)return false;
  return await navigator.storage.persist();
}
async function estimate(){
  const estimate=navigator.storage?.estimate?await navigator.storage.estimate():null;
  const persistent=navigator.storage?.persisted?await navigator.storage.persisted():false;
  return {persistent,used:estimate?.usage||null,quota:estimate?.quota||null,restored,error};
}
window.MindMapV3Storage={ready,backupNow,scheduleBackup,requestPersistence,estimate,
  getStatus:()=>({restored,error,backupAvailable:!!db})};
})();