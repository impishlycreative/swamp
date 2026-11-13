(()=>{'use strict';
if(window.__SWAMP_V3_AWARENESS__)return;
window.__SWAMP_V3_AWARENESS__=true;
const $=id=>document.getElementById(id);
const AI=()=>window.MindMapLocalAI;
const domain=()=>window.MindMapV3Domain;
const store=()=>window.MindMapV3Storage;
const app=()=>window.MindMapApp;
const mapNow=()=>app()?.getCurrentMap?.();
const guidance=map=>window.MindMapV3Guidance?.situation?.(map);
let working=false,installPrompt=null;
let statusNote='',lastMap=null;
// This is a device/session choice. Never enable inference simply because a model was cached.
let guidanceMode='basic';
function text(id,value){const node=$(id);if(node)node.textContent=String(value||'');}
function renderStatus(){
  const st=AI()?.getStatus?.();
  text('v3GuidanceMode',guidanceMode==='ai'&&AI()?.isReady?.()
    ?'Guidance mode: Local AI (accepted on this device)'
    :'Guidance mode: Basic (no local AI analysis)');
  const basic=$('v3UseBasicGuide');if(basic)basic.disabled=guidanceMode==='basic';
  if(st){
    const suffix=st.progress!==null&&st.progress!==undefined&&st.state==='downloading'?' ('+Math.round(st.progress)+'%)':'';
    text('v3AIStatus',st.message+suffix);
    const prog=$('v3AIProgress');if(prog){
      prog.hidden=st.state!=='downloading';
      if(st.progress===null||st.progress===undefined)prog.removeAttribute('value');
      else prog.value=st.progress;
    }
    const load=$('v3InstallModel');
    if(load){
      load.disabled=st.state==='downloading'||st.state==='thinking'||working;
      load.textContent=guidanceMode==='ai'&&AI()?.isReady?.()?'Local AI enabled':
        AI()?.isReady?.()?'Enable local AI':'Download & enable local AI';
    }
    text('v3AIHint',st.previouslyLoaded&&st.state==='idle'
      ?'A model was previously loaded. Reload it to verify that the files remain cached.'
      :'Bootstrap model: Qwen3 0.6B (experimental). The planned 2B/4B models remain evaluation candidates.');
  }
  const busy=$('v3GuideBusy');
  if(busy)busy.textContent=working?'Analyzing the last answer locally…':statusNote;
  const submit=$('v3GuideSubmit');
  if(submit)submit.disabled=working||!mapNow();
  if($('v3GuideAnswer'))$('v3GuideAnswer').disabled=working;
}
async function getRules(){
  const response=await fetch('./story-rules.md',{cache:'force-cache'});
  if(!response.ok)throw Error('Authoritative strict rules are not available');
  return response.text();
}
function currentProposals(){
  const map=mapNow(),s=guidance(map);
  return {map,s,items:(s?.proposals||[]).filter(p=>p.status==='unconfirmed'&&map?.nodes?.[p.from]&&map?.nodes?.[p.to])};
}
function renderProposals(){
  const host=$('v3ProposalList');if(!host)return;
  host.replaceChildren();
  const {map,s,items}=currentProposals();
  for(const p of items){
    const li=document.createElement('li'),label=document.createElement('span');
    label.textContent='AI suggests linking "'+map.nodes[p.from].text+'" with "'+
      map.nodes[p.to].text+'". '+(p.reason||'');
    const accept=document.createElement('button');accept.type='button';accept.textContent='Approve';
    const dismiss=document.createElement('button');dismiss.type='button';dismiss.textContent='Dismiss';
    accept.addEventListener('click',()=>{
      const existing=Array.isArray(map.relationships)?map.relationships:(map.relationships=[]);
      if(!existing.some(x=>x.from===p.from&&x.to===p.to))
        existing.push({id:'v3rel_'+Math.random().toString(36).slice(2),from:p.from,to:p.to,label:'related',created:new Date().toISOString(),source:'author-approved'});
      p.status='approved';p.approvedAt=new Date().toISOString();
      app()?.save?.();app()?.setCurrentMap?.(map.id,false,false);renderProposals();
    });
    dismiss.addEventListener('click',()=>{p.status='dismissed';app()?.save?.();renderProposals();});
    li.append(label,accept,dismiss);host.appendChild(li);
  }
  if(!items.length){const li=document.createElement('li');li.textContent='No proposed relationships.';host.appendChild(li);}
}
async function analyzeAnswer(info){
  const ai=AI(),d=domain(),map=mapNow(),s=guidance(map);
  if(guidanceMode!=='ai'||!ai?.isReady()||!d||!map||!s||map.id!==info.mapId||working)return;
  working=true;statusNote='';renderStatus();
  try{
    const rules=await getRules();
    const context=d.snapshot(map,s,info.answer,info.nodeId);
    const result=await ai.analyze(context,rules);
    const current=mapNow(),currentSituation=guidance(current);
    if(guidanceMode!=='ai'||!current||current.id!==info.mapId||
      currentSituation.turns.at(-1)?.created!==info.turnCreated)return;
    const output=d.validSuggestions(result,current,info.nodeId);
    for(const f of output.flags){
      const note='Possible '+f.kind+' to review: '+f.reason;
      if(currentSituation.flags.some(x=>!x.resolved&&x.nodeId===f.nodeId&&x.message===note))continue;
      const flag=window.MindMapV3Guidance.addReviewFlag(current,currentSituation,f.nodeId,note,'ai-'+f.kind);
      if(flag)flag.source='ai-suggestion';
    }
    for(const p of output.links){
      if(!currentSituation.proposals.some(x=>x.status==='unconfirmed'&&x.from===p.from&&x.to===p.to))
        currentSituation.proposals.push({...p,id:'v3proposal_'+Math.random().toString(36).slice(2)});
    }
    currentSituation.lastQuestion=d.chooseQuestion(output,currentSituation.strict);
    currentSituation.situationModel={
      purpose:current.nodes[current.rootId]?.text||'',activeNodeId:currentSituation.focusNodeId,
      establishedTurnIds:currentSituation.turns.filter(t=>t.nodeId).map(t=>t.nodeId),
      unresolvedFlagIds:currentSituation.flags.filter(f=>!f.resolved).map(f=>f.id),
      unconfirmedProposals:currentSituation.proposals.filter(p=>p.status==='unconfirmed').map(p=>p.id),
      strict:currentSituation.strict,updated:new Date().toISOString()
    };
    app()?.save?.();
    text('v3GuideQuestion',currentSituation.lastQuestion);
    statusNote='AI analysis complete. Its flags and links are suggestions, not established facts.';
    renderProposals();
  }catch(e){
    guidanceMode='basic';
    statusNote='Local AI could not analyze this answer. Switched to Basic guidance; your original answer was saved. '+String(e.message||e);
  }finally{working=false;renderStatus();}
}
function mount(){
  const panel=$('v3GuidedPanel');if(!panel)return;
  const section=document.createElement('section');section.className='v3-ai-tools';section.setAttribute('aria-label','Offline AI setup');
  section.innerHTML='<h3>Offline AI <small>experimental</small></h3>'+
    '<p id="v3GuidanceMode" class="v3-guide-note" role="status" aria-live="polite">Guidance mode: Basic</p>'+
    '<p class="v3-guide-note">Basic works without a model. Local AI is optional and only starts when you choose it on this device.</p>'+
    '<button type="button" id="v3InstallModel" class="v3-primary">Download & enable local AI</button>'+ 
    '<button type="button" id="v3UseBasicGuide">Use basic guidance</button>'+
    '<progress id="v3AIProgress" max="100" hidden></progress>'+
    '<p id="v3AIStatus" class="v3-guide-note" role="status" aria-live="polite"></p>'+
    '<p id="v3AIHint" class="v3-guide-note"></p>'+
    '<div class="v3-offline-actions"><button type="button" id="v3InstallApp">Install PWA</button>'+
    '<button type="button" id="v3ProtectStorage">Protect local storage</button></div>'+
    '<p id="v3OfflineStatus" class="v3-guide-note">Checking offline shell…</p>'+
    '<p id="v3GuideBusy" class="v3-guide-note" role="status"></p>';
  panel.insertBefore(section,panel.querySelector('.v3-guide-flags'));
  const proposals=document.createElement('section');proposals.className='v3-guide-flags';
  proposals.innerHTML='<h3>Unconfirmed AI links</h3><ul id="v3ProposalList"></ul>';
  panel.insertBefore(proposals,panel.querySelector('.v3-guide-flags'));
  $('v3InstallModel').addEventListener('click',async()=>{
    try{
      statusNote='';await AI().load();guidanceMode='ai';
      statusNote='You enabled local AI for this session. Test an offline restart before relying on its cache.';
    }catch(e){
      guidanceMode='basic';statusNote='Local AI unavailable. Basic guidance remains active: '+String(e.message||e);
    }
    renderStatus();
  });
  $('v3UseBasicGuide').addEventListener('click',()=>{
    guidanceMode='basic';statusNote='You selected Basic guidance. The downloaded model will not analyze your answers.';
    renderStatus();
  });
  $('v3ProtectStorage').addEventListener('click',async()=>{
    try{
      const granted=await store()?.requestPersistence?.();
      const stats=await store()?.estimate?.();
      statusNote=granted?'Browser granted persistent storage.':'Persistent storage not granted; export JSON backups regularly.';
      if(stats?.error)statusNote+=' Backup: '+stats.error;
    }catch(e){statusNote='Storage request failed: '+String(e.message||e);}
    renderStatus();
  });
  $('v3InstallApp').addEventListener('click',async()=>{
    if(installPrompt){
      const prompt=installPrompt;installPrompt=null;await prompt.prompt();
      text('v3OfflineStatus','Check your browser installation prompt.');
    }else text('v3OfflineStatus','Use the browser menu → Install app / Add to Home Screen (if supported).');
  });
  AI()?.subscribe?.(()=>renderStatus());
  renderStatus();renderProposals();refreshShell();
}
async function refreshShell(){
  if(!('serviceWorker'in navigator)){text('v3OfflineStatus','Service workers unavailable in this browser.');return;}
  try{
    const registration=await navigator.serviceWorker.ready;
    const target=navigator.serviceWorker.controller||registration.active;
    if(!target)throw Error('Waiting for service worker activation');
    const response=await new Promise((resolve,reject)=>{
      const channel=new MessageChannel();
      const timer=setTimeout(()=>reject(Error('offline check timed out')),7000);
      channel.port1.onmessage=e=>{clearTimeout(timer);resolve(e.data);channel.port1.close();};
      target.postMessage({type:'CHECK_OFFLINE'},[channel.port2]);
    });
    text('v3OfflineStatus',response.ready?
      'Application shell cached for offline use. Model cache needs a separate offline test.':
      'Application shell incomplete: '+response.missing.length+' file(s) missing. Reload online.');
  }catch(e){text('v3OfflineStatus','Offline shell not verified: '+String(e.message||e));}
}
window.addEventListener('mindmap:guided-answer',event=>{analyzeAnswer(event.detail||{});});
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;text('v3OfflineStatus','PWA installation is available.');});
window.addEventListener('appinstalled',()=>{installPrompt=null;text('v3OfflineStatus','MindMap installed as a PWA.');});
function boot(){
  mount();
  setInterval(()=>{const map=mapNow();if(map?.id!==lastMap){lastMap=map?.id;renderProposals();}},1100);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();