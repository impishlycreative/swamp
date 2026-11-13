(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root&&root.document)root.MindMapV3Vault=api;
})(typeof window!=='undefined'?window:globalThis,function(root){
'use strict';
const DB_NAME='swamp.mindmap.secure.v1';
const RECORDS='records',KEYS='keys';
const PROJECT_KEY='swamp.mindmap.project.v2';
const BACKUP_KEY='swamp.mindmap.project.backup';
const PREFIX='swamp.mindmap.project.data.';
const PROTECTED=new Set([PROJECT_KEY,BACKUP_KEY,'swamp.mindmap.v1',
  'swamp.mindmap.projects.v1','swamp.mindmap.active-project.v1']);
const subtle=(root.crypto&&root.crypto.subtle)?root.crypto.subtle:
  (typeof require==='function'?require('node:crypto').webcrypto.subtle:null);
const random=(length)=>{
  const bytes=new Uint8Array(length);
  if(root.crypto?.getRandomValues)root.crypto.getRandomValues(bytes);
  else if(typeof require==='function')require('node:crypto').webcrypto.getRandomValues(bytes);
  else throw Error('Secure random numbers are unavailable');
  return bytes;
};
const encoder=new TextEncoder(),decoder=new TextDecoder();
const base64=bytes=>btoa(String.fromCharCode(...new Uint8Array(bytes)));
const bytes64=str=>Uint8Array.from(atob(str),x=>x.charCodeAt(0));
const protectedKey=key=>PROTECTED.has(key)||String(key).startsWith(PREFIX);
let db=null,key=null,unlocked=false,opening=null,pending=Promise.resolve(),lastError=null;
const cache=new Map(),listeners=new Set();
const assertSecure=()=>{
  if(!subtle||!root.isSecureContext&&root.document)throw Error('Encrypted storage needs HTTPS and Web Crypto');
};
async function newMaster(){assertSecure();return subtle.importKey('raw',random(32),{name:'AES-GCM'},false,['encrypt','decrypt']);}
async function seal(secret,plain,aad){
  const iv=random(12);
  const encrypted=await subtle.encrypt({name:'AES-GCM',iv,additionalData:encoder.encode(aad)},secret,encoder.encode(plain));
  return {v:1,iv:base64(iv),data:base64(new Uint8Array(encrypted))};
}
async function unseal(secret,envelope,aad){
  if(!envelope||envelope.v!==1||typeof envelope.iv!=='string'||typeof envelope.data!=='string')
    throw Error('Unsupported encrypted record format');
  const decrypted=await subtle.decrypt({name:'AES-GCM',iv:bytes64(envelope.iv),
    additionalData:encoder.encode(aad)},secret,bytes64(envelope.data));
  return decoder.decode(decrypted);
}
function openDb(name=DB_NAME,upgrade=true){
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open(name,1);
    request.onupgradeneeded=()=>{
      if(!upgrade)return;
      for(const store of [RECORDS,KEYS])
        if(!request.result.objectStoreNames.contains(store))request.result.createObjectStore(store);
    };
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error||Error('Encrypted storage unavailable'));
  });
}
function query(database,store,operation,keyName,value){
  return new Promise((resolve,reject)=>{
    const transaction=database.transaction(store,operation==='get'?'readonly':'readwrite');
    const objectStore=transaction.objectStore(store);
    const request=operation==='get'?objectStore.get(keyName):
      operation==='put'?objectStore.put(value,keyName):objectStore.delete(keyName);
    request.onsuccess=()=>{if(operation==='get')resolve(request.result??null);};
    transaction.oncomplete=()=>{if(operation!=='get')resolve(true);};
    transaction.onerror=()=>reject(transaction.error||request.error||Error('Vault transaction failed'));
    transaction.onabort=()=>reject(transaction.error||Error('Vault transaction aborted'));
  });
}
function allRecords(){
  return new Promise((resolve,reject)=>{
    const transaction=db.transaction(RECORDS,'readonly'),items=[];
    const request=transaction.objectStore(RECORDS).openCursor();
    request.onsuccess=()=>{const c=request.result;if(c){items.push([c.key,c.value]);c.continue();}else resolve(items);};
    request.onerror=()=>reject(request.error||Error('Cannot read encrypted records'));
    transaction.onerror=()=>reject(transaction.error||Error('Vault records unavailable'));
  });
}
async function writeRecord(name,value,secret=key){
  const sealed=await seal(secret,String(value),'MindMap:v1:'+name);
  await query(db,RECORDS,'put',name,sealed);
  const stored=await query(db,RECORDS,'get',name);
  if(await unseal(secret,stored,'MindMap:v1:'+name)!==String(value))
    throw Error('Encrypted write verification failed for '+name);
}
async function oldSnapshot(){
  let old=null;
  try{
    old=await openDb('swamp.mindmap.offline.v3',false);
    if(!old.objectStoreNames.contains('snapshots'))return null;
    const record=await query(old,'snapshots','get','project');
    return record&&typeof record.data==='string'?record.data:null;
  }finally{old?.close();}
}
function assertLegacySnapshotMatches(existing,snapshot){
  if(existing!==null&&existing!==snapshot)
    throw Error('Conflicting legacy snapshot and encrypted project. The old snapshot was preserved for recovery.');
}
async function clearOldSnapshot(){
  let old=null;
  try{
    old=await openDb('swamp.mindmap.offline.v3',false);
    if(old.objectStoreNames.contains('snapshots'))await query(old,'snapshots','delete','project');
  }finally{old?.close();}
}
async function hydrate(){
  assertSecure();
  if(!root.indexedDB)throw Error('IndexedDB is required for encrypted maps');
  db=await openDb();
  const records=await allRecords();
  let device=await query(db,KEYS,'get','device');
  let master=await query(db,KEYS,'get','master');
  if((!device||!master)&&records.length)throw Error('Encryption key is missing. Existing maps were not overwritten.');
  if(!device||!master){
    device=await subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt']);
    const raw=random(32);
    master=await seal(device,base64(raw),'MindMap:v1:device-wrap');
    await query(db,KEYS,'put','device',device);
    await query(db,KEYS,'put','master',master);
  }
  const wrapped=await unseal(device,master,'MindMap:v1:device-wrap');
  key=await subtle.importKey('raw',bytes64(wrapped),{name:'AES-GCM'},false,['encrypt','decrypt']);
  cache.clear();
  for(const [name,envelope] of records){
    if(!protectedKey(name))throw Error('Unexpected protected record '+name);
    cache.set(name,await unseal(key,envelope,'MindMap:v1:'+name));
  }
  // Verify each encrypted copy before removing an older plaintext value.
  const migrated=[];
  for(let i=0;i<localStorage.length;i++){
    const name=localStorage.key(i);
    if(!protectedKey(name))continue;
    const raw=localStorage.getItem(name);
    if(raw===null)continue;
    if(cache.has(name)&&cache.get(name)!==raw)
      throw Error('Conflicting old and encrypted map data. Plaintext was preserved for recovery.');
    if(!cache.has(name)){await writeRecord(name,raw);cache.set(name,raw);}
    migrated.push(name);
  }
  const snapshot=await oldSnapshot();
  if(snapshot){
    // Do not destroy an old recovery source when the encrypted project disagrees.
    assertLegacySnapshotMatches(cache.has(PROJECT_KEY)?cache.get(PROJECT_KEY):null,snapshot);
    if(!cache.has(PROJECT_KEY)){
      await writeRecord(PROJECT_KEY,snapshot);cache.set(PROJECT_KEY,snapshot);
    }
    // Re-read and authenticate the encrypted copy before deleting the legacy snapshot.
    const verified=await query(db,RECORDS,'get',PROJECT_KEY);
    if(await unseal(key,verified,'MindMap:v1:'+PROJECT_KEY)!==snapshot)
      throw Error('Legacy snapshot was not verified in encrypted storage');
    await clearOldSnapshot();
  }
  for(const name of migrated)localStorage.removeItem(name);
  unlocked=true;lastError=null;
  return true;
}
async function open(){
  if(unlocked)return true;
  if(opening)return opening;
  opening=hydrate();
  try{return await opening;}catch(e){lastError=e;key=null;cache.clear();unlocked=false;throw e;}
  finally{opening=null;}
}
function getItem(name){
  if(!protectedKey(name))throw Error('Not a vault project key: '+name);
  if(!unlocked)throw Error('Unlock the encrypted vault first');
  return cache.has(name)?cache.get(name):null;
}
function enqueue(job){
  // Stop the write chain on the first storage failure; later jobs must not
  // create the illusion that a failed autosave was recovered.
  pending=pending.then(()=>{
    if(lastError)throw lastError;
    return job();
  }).catch(e=>{lastError=e;});
}
function setItem(name,value){
  if(!protectedKey(name))throw Error('Not a vault project key: '+name);
  if(!unlocked||lastError)throw Error('Encrypted vault is not writable: '+(lastError?.message||'locked'));
  const before=cache.has(name)?cache.get(name):null;
  const next=String(value);cache.set(name,next);
  const writeKey=key;
  enqueue(()=>writeRecord(name,next,writeKey));
  for(const callback of listeners){try{callback(name,before,next);}catch{}}
}
function removeItem(name){
  if(!protectedKey(name)||!unlocked)throw Error('Unlock the encrypted vault first');
  cache.delete(name);
  enqueue(()=>query(db,RECORDS,'delete',name));
}
async function flush(){await pending;if(lastError)throw lastError;}
function lock(){
  // Pending writes capture their encryption key, so locking cannot null out a queued seal.
  key=null;cache.clear();unlocked=false;lastError=null;
}
function onWrite(callback){listeners.add(callback);return()=>listeners.delete(callback);}
function status(){return{unlocked,error:lastError?.message||null,storage:'encrypted IndexedDB',deviceBound:true};}
return {open,getItem,setItem,removeItem,flush,lock,onWrite,status,isUnlocked:()=>unlocked,
  protectedKey,seal,unseal,newMaster,assertLegacySnapshotMatches};
});
