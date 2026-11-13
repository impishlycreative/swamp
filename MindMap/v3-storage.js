(()=>{'use strict';
if(window.MindMapV3Storage)return;
// Snapshots are stored through the encrypted vault, never as plaintext IndexedDB entries.
const PROJECT_KEY='swamp.mindmap.project.v2';
const BACKUP_KEY='swamp.mindmap.project.backup';
let timer=null,lastSaved=null,error=null,restored=false;
const vault=()=>window.MindMapV3Vault;
const ready=Promise.resolve(true);
function valid(raw){
  try{
    const project=JSON.parse(raw);
    return !!(project&&typeof project==='object'&&
      project.sessions&&typeof project.sessions==='object'&&Object.keys(project.sessions).length);
  }catch{return false;}
}
async function backupNow(){
  if(!vault()?.isUnlocked?.())return false;
  try{
    await vault().flush();
    const raw=vault().getItem(PROJECT_KEY);
    if(!raw||!valid(raw)||raw===lastSaved)return false;
    vault().setItem(BACKUP_KEY,raw);
    await vault().flush();
    lastSaved=raw;error=null;return true;
  }catch(e){error=String(e.message||e);return false;}
}
function scheduleBackup(){clearTimeout(timer);timer=setTimeout(()=>{backupNow();},350);}
async function requestPersistence(){
  if(!navigator.storage?.persist)return false;
  return await navigator.storage.persist();
}
async function estimate(){
  const amount=navigator.storage?.estimate?await navigator.storage.estimate():null;
  const persistent=navigator.storage?.persisted?await navigator.storage.persisted():false;
  return {persistent,used:amount?.usage??null,quota:amount?.quota??null,restored,
    error:error||vault()?.status?.().error||null};
}
window.MindMapV3Storage={
  ready,backupNow,scheduleBackup,requestPersistence,estimate,
  getStatus:()=>({restored,error:error||vault()?.status?.().error||null,
    backupAvailable:!!vault()?.isUnlocked?.()&&!!vault().getItem(BACKUP_KEY)})
};
})();
