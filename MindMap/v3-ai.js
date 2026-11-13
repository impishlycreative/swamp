(()=>{'use strict';
if(window.MindMapLocalAI)return;
const MODEL='onnx-community/Qwen3-0.6B-ONNX';
const SAVED_KEY='swamp.mindmap.ai.model-cache-hint.v1';
let worker=null,serial=0,ready=false,loading=null;
const pending=new Map(),listeners=new Set();
let status={state:'idle',model:MODEL,message:'AI model not loaded',progress:null,device:null,previouslyLoaded:localStorage.getItem(SAVED_KEY)===MODEL};
function setStatus(update){status={...status,...update};for(const cb of listeners){try{cb({...status});}catch{}}}
function failAll(reason){for(const {reject,timeout} of pending.values()){clearTimeout(timeout);reject(Error(reason));}pending.clear();}
function startWorker(){
  if(worker)return worker;
  if(!window.Worker)throw Error('Browser workers are unavailable');
  if(!window.isSecureContext)throw Error('A secure HTTPS connection is needed');
  worker=new Worker('./v3-ai-worker.js',{type:'module',name:'MindMap local AI'});
  worker.addEventListener('message',event=>{
    const msg=event.data||{};
    if(msg.kind==='progress'){setStatus(msg);return;}
    const item=pending.get(msg.id);if(!item)return;
    pending.delete(msg.id);clearTimeout(item.timeout);
    if(msg.kind==='failure')item.reject(Error(msg.message||'Local inference failed'));
    else if(msg.kind==='response')item.resolve(msg.data);
  });
  worker.addEventListener('error',event=>{
    ready=false;const message=event.message||'Failed to start the browser AI worker';
    setStatus({state:'error',message});failAll(message);
    worker?.terminate();worker=null;
  });
  return worker;
}
function request(type,data,timeoutMs){
  startWorker();
  const id=++serial;
  return new Promise((resolve,reject)=>{
    const timeout=setTimeout(()=>{pending.delete(id);reject(Error('Local AI request timed out'));},timeoutMs);
    pending.set(id,{resolve,reject,timeout});
    worker.postMessage({type,id,data});
  });
}
async function load(){
  if(ready)return {...status};
  if(loading)return loading;
  if(!('gpu' in navigator))setStatus({message:'No WebGPU detected. Attempting the slower CPU backend…'});
  setStatus({state:'downloading',progress:0,message:'Preparing browser-local AI…'});
  loading=request('load',null,12*60*1000).then(data=>{
    ready=true;localStorage.setItem(SAVED_KEY,MODEL);
    setStatus({state:'ready',progress:100,model:MODEL,device:data.device,previouslyLoaded:true,message:'Local AI is ready; disconnect to verify offline restart.'});
    return {...status};
  }).catch(err=>{
    ready=false;setStatus({state:'error',message:String(err.message||err)});throw err;
  }).finally(()=>{loading=null;});
  return loading;
}
async function analyze(context,rules){
  if(!ready)throw Error('Local model is not loaded');
  setStatus({state:'thinking',message:'Reviewing the current branch locally…'});
  try{
    const result=await request('analyze',{context,rules},180000);
    setStatus({state:'ready',message:'Local AI is ready'});
    return result;
  }catch(err){
    setStatus({state:'ready',message:'Local AI response could not be used: '+err.message});
    throw err;
  }
}
function reset(){
  worker?.terminate();worker=null;ready=false;loading=null;
  failAll('The local AI worker was stopped');
  setStatus({state:'idle',progress:null,message:'Local model unloaded (downloaded data remains in browser cache).'});
}
window.MindMapLocalAI={
  model:MODEL,load,analyze,reset,isReady:()=>ready,
  getStatus:()=>({...status}),
  subscribe:cb=>{listeners.add(cb);try{cb({...status});}catch{}return()=>listeners.delete(cb);}
};
})();