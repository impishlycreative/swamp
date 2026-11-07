(()=>{'use strict';
if(window.__SWAMP_MINDMAP_V3_GUIDED__)return;
window.__SWAMP_MINDMAP_V3_GUIDED__=true;
const $=(selector,root=document)=>root.querySelector(selector);
const app=()=>window.MindMapApp;
const mapNow=()=>app()?.getCurrentMap?.()||null;
const now=()=>new Date().toISOString();
const uid=()=>('g_'+Math.random().toString(36).slice(2,10)+Date.now().toString(36));
const blank=text=>!text||/^Untitled Mind Map$/i.test(text.trim());
let isOpen=false;
let autoOpenedMapId=null;
let observedNodeContainer=null;
const neutralQuestion='Which part of this would you like to explore next?';
function situation(map){
  if(!map)return null;
  if(!map.v3Guidance||typeof map.v3Guidance!=='object')map.v3Guidance={schemaVersion:1,strict:true,focusNodeId:map.rootId,turns:[],flags:[],lastQuestion:null};
  const s=map.v3Guidance;
  if(typeof s.strict!=='boolean')s.strict=true;
  if(!map.nodes[s.focusNodeId])s.focusNodeId=map.rootId;
  if(!Array.isArray(s.turns))s.turns=[];
  if(!Array.isArray(s.flags))s.flags=[];
  if(typeof s.lastQuestion!=='string')s.lastQuestion=null;
  return s;
}
function currentQuestion(map,s){
  if(!map||!s)return 'Unlock the workspace to begin.';
  if(blank(map.nodes[map.rootId]?.text)&&s.turns.length===0)return 'What would you like to brainstorm?';
  if(!s.lastQuestion)return neutralQuestion;
  return s.lastQuestion;
}
function refreshMap(map){
  const current=app();
  current?.save?.();
  current?.setCurrentMap?.(map.id,false,false);
  requestAnimationFrame(()=>{syncUI();decorateFlags();});
}
function addReviewFlag(map,s,nodeId,message,type='review'){
  const note=String(message||'').trim();
  if(!note||!map.nodes[nodeId])return null;
  const node=map.nodes[nodeId];
  const existing=Array.isArray(node.writer?.flags)&&node.writer.flags.includes('needs-work');
  if(!node.writer||typeof node.writer!=='object')node.writer={};
  if(!Array.isArray(node.writer.flags))node.writer.flags=[];
  if(!existing)node.writer.flags.push('needs-work');
  const flag={id:uid(),nodeId,message:note,type,created:now(),resolved:false,addedWriterFlag:!existing};
  s.flags.push(flag);
  return flag;
}
function submitAnswer(){
  const map=mapNow(),s=situation(map),field=$('#v3GuideAnswer');
  if(!map||!s||!field)return;
  const answer=field.value.trim();
  if(!answer)return;
  const root=map.nodes[map.rootId];
  const question=currentQuestion(map,s);
  let node;
  if(blank(root?.text)&&s.turns.length===0){
    node=root;
    root.text=answer.slice(0,500);
    root.description=answer.length>500?answer:'';
    root.writer={...(root.writer||{}),source:'user'};
    map.title=root.text;
  }else{
    const parentId=map.nodes[s.focusNodeId]?s.focusNodeId:map.rootId;
    const id=uid(),parent=map.nodes[parentId];
    node={id,text:answer.slice(0,500),description:answer.length>500?answer:'',parentId,
      color:parent.color||'#DCEBE4',edgeLabel:'',collapsed:false,created:now(),
      x:null,y:null,targetMapId:null,writer:{source:'user',type:'general'}};
    map.nodes[id]=node;
  }
  s.turns.push({question,answer,nodeId:node.id,focusNodeId:s.focusNodeId,created:now(),source:'user'});
  s.lastQuestion=neutralQuestion;
  // Only the user's explicit uncertainty creates automatic review flags.
  // Detecting inferred contradictions or gaps requires the future local model.
  if(/\b(tbd|to be determined|not sure|unsure|undecided|to decide)\b/i.test(answer)){
    addReviewFlag(map,s,node.id,'The author marked this detail as unresolved.','explicit-uncertainty');
  }
  field.value='';
  refreshMap(map);
  field.focus();
}
function useSelected(){
  const map=mapNow(),s=situation(map);
  if(!map||!s)return;
  const id=$('#nodes .node.selected')?.dataset.id;
  if(!id||!map.nodes[id])return;
  s.focusNodeId=id;s.lastQuestion=neutralQuestion;
  app()?.save?.();syncUI();
}
function useRoot(){
  const map=mapNow(),s=situation(map);if(!s)return;
  s.focusNodeId=map.rootId;s.lastQuestion=neutralQuestion;
  app()?.save?.();syncUI();
}
function flagFocused(){
  const map=mapNow(),s=situation(map),el=$('#v3FlagInput');
  if(!map||!s||!el)return;
  const text=el.value.trim();if(!text)return;
  addReviewFlag(map,s,s.focusNodeId,text);
  el.value='';refreshMap(map);
}
function resolveFlag(id){
  const map=mapNow(),s=situation(map);if(!s)return;
  const flag=s.flags.find(item=>item.id===id);if(!flag)return;
  flag.resolved=true;flag.resolvedAt=now();
  const node=map.nodes[flag.nodeId];
  if(node&&s.flags.some(item=>item.nodeId===flag.nodeId&&item.addedWriterFlag)&&!s.flags.some(item=>item.nodeId===flag.nodeId&&!item.resolved)){
    if(Array.isArray(node.writer?.flags))node.writer.flags=node.writer.flags.filter(value=>value!=='needs-work');
  }
  refreshMap(map);
}
function focusFlagNode(id){
  const map=mapNow(),s=situation(map);
  if(!s||!map.nodes[id])return;
  s.focusNodeId=id;app()?.save?.();syncUI();
  const selected=$('#nodes .node[data-id="'+CSS.escape(id)+'"]');
  if(selected)selected.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));
}
function decorateFlags(){
  const map=mapNow(),s=situation(map);if(!s)return;
  const openIds=new Set(s.flags.filter(f=>!f.resolved).map(f=>f.nodeId));
  document.querySelectorAll('#nodes .node').forEach(el=>el.classList.toggle('v3-review-flag',openIds.has(el.dataset.id)));
}
function renderFlags(map,s){
  const host=$('#v3FlagList');if(!host)return;
  host.replaceChildren();
  const flags=s.flags.filter(f=>!f.resolved&&map.nodes[f.nodeId]);
  $('#v3FlagCount').textContent=String(flags.length);
  for(const f of flags){
    const row=document.createElement('li');
    const title=document.createElement('span');
    title.textContent=(map.nodes[f.nodeId]?.text||'Idea').slice(0,55)+' — '+f.message;
    const go=document.createElement('button');go.type='button';go.textContent='Focus';go.addEventListener('click',()=>focusFlagNode(f.nodeId));
    const done=document.createElement('button');done.type='button';done.textContent='Resolve';done.addEventListener('click',()=>resolveFlag(f.id));
    row.append(title,go,done);host.appendChild(row);
  }
  if(!flags.length){const li=document.createElement('li');li.textContent='Nothing flagged for later.';host.appendChild(li);}
}
function syncUI(){
  if(!$('#v3GuidedPanel'))return;
  const map=mapNow(),s=situation(map);
  if(!map||!s){
    $('#v3GuideQuestion').textContent='Unlock the workspace to begin.';
    $('#v3GuideSubmit').disabled=true;
    return;
  }
  $('#v3GuideSubmit').disabled=false;
  $('#v3StrictToggle').checked=s.strict;
  $('#v3GuideQuestion').textContent=currentQuestion(map,s);
  $('#v3FocusName').textContent=map.nodes[s.focusNodeId]?.text||'Untitled';
  $('#v3TurnCount').textContent=String(s.turns.length);
  $('#v3ModeNote').textContent=s.strict
    ? 'Strict: your ideas only; neutral questions; no invented premises.'
    : 'Strict disabled. Offline guided capture remains available; creative AI suggestions need a future local model.';
  renderFlags(map,s);decorateFlags();
}
function maybeOpenDiscovery(){
  const map=mapNow(),s=situation(map);
  if(!map||!s||$('#app')?.classList.contains('hidden'))return;
  if(s.welcomeDismissed||autoOpenedMapId===map.id||s.turns.length||!blank(map.nodes[map.rootId]?.text))return;
  autoOpenedMapId=map.id;
  toggleOpen(true);
}
function toggleOpen(force){
  isOpen=typeof force==='boolean'?force:!isOpen;
  $('#v3GuidedPanel').hidden=!isOpen;
  if(!isOpen){const map=mapNow(),s=situation(map);if(s&&s.turns.length===0){s.welcomeDismissed=true;app()?.save?.();}}
  if(isOpen){syncUI();$('#v3GuideAnswer')?.focus();}
}
function addButtons(){
  if(!$('#v3GuideLaunch')){
    const desktop=$('#desktopToolbar .tb-row');
    if(desktop){
      const btn=document.createElement('button');btn.id='v3GuideLaunch';btn.type='button';btn.className='tb-button tb-icon';
      btn.title='Guided brainstorming';btn.setAttribute('aria-label','Guided brainstorming');btn.textContent='Guide';
      btn.addEventListener('click',()=>toggleOpen());
      desktop.insertBefore(btn,$('.tb-spacer',desktop)||desktop.firstChild);
    }
  }
  if(!$('#v3GuideUtility')){
    const grid=$('#utilitySheet .utility-grid');
    if(grid){const btn=document.createElement('button');btn.id='v3GuideUtility';btn.type='button';btn.className='btn';
      btn.textContent='Guide brainstorming';btn.addEventListener('click',()=>{grid.closest('#utilitySheet')?.classList.remove('open');toggleOpen(true);});grid.prepend(btn);}
  }
}
function createPanel(){
  const panel=document.createElement('aside');
  panel.id='v3GuidedPanel';panel.className='v3-guided-panel';panel.hidden=true;
  panel.setAttribute('aria-label','Guided brainstorming');
  panel.innerHTML=`<div class="v3-guide-top"><div><small>V3 preview · works offline</small><h2>Guided brainstorming</h2></div><button type="button" id="v3GuideClose" aria-label="Close guide">×</button></div>
    <label class="v3-strict"><input type="checkbox" id="v3StrictToggle" checked> Strict brainstorming (default)</label>
    <p id="v3ModeNote" class="v3-guide-note"></p>
    <div class="v3-guide-focus">Current branch: <strong id="v3FocusName"></strong>
      <div><button type="button" id="v3UseSelected">Use selected idea</button><button type="button" id="v3UseRoot">Use root</button></div>
    </div>
    <div class="v3-guide-question" id="v3GuideQuestion" role="status" aria-live="polite"></div>
    <label for="v3GuideAnswer">Your answer</label>
    <textarea id="v3GuideAnswer" rows="4" maxlength="10000" placeholder="Your words are recorded as written."></textarea>
    <button type="button" id="v3GuideSubmit" class="v3-primary">Add to map & continue</button>
    <small class="v3-guide-note">Recorded turns: <span id="v3TurnCount">0</span> · One neutral question at a time.</small>
    <section class="v3-guide-flags"><h3>Review later (<span id="v3FlagCount">0</span>)</h3>
      <label for="v3FlagInput">Flag something on this branch</label>
      <div class="v3-flag-entry"><input id="v3FlagInput" maxlength="400" placeholder="What needs review?"><button type="button" id="v3FlagAdd">Flag</button></div>
      <ul id="v3FlagList"></ul>
    </section>
    <p class="v3-guide-note">This preview uses local, rule-based guidance. It does not yet include an on-device AI model or automatic semantic contradiction detection. <a href="story-rules.md" target="_blank" rel="noopener">Strict rules</a></p>`;
  document.body.appendChild(panel);
  $('#v3GuideClose').addEventListener('click',()=>toggleOpen(false));
  $('#v3GuideSubmit').addEventListener('click',submitAnswer);
  $('#v3StrictToggle').addEventListener('change',e=>{const map=mapNow(),s=situation(map);if(!s)return;s.strict=e.target.checked;app()?.save?.();syncUI();});
  $('#v3UseSelected').addEventListener('click',useSelected);
  $('#v3UseRoot').addEventListener('click',useRoot);
  $('#v3FlagAdd').addEventListener('click',flagFocused);
  $('#v3GuideAnswer').addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key==='Enter'){e.preventDefault();submitAnswer();}});
}
function initOffline(){
  if('serviceWorker'in navigator && location.protocol.startsWith('http')){
    navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
  }
}
function boot(){
  createPanel();addButtons();syncUI();
  const nodes=$('#nodes');
  if(nodes&&!observedNodeContainer){observedNodeContainer=nodes;new MutationObserver(decorateFlags).observe(nodes,{childList:true});}
  setInterval(()=>{maybeOpenDiscovery();if(isOpen)syncUI();},900);
  initOffline();
  maybeOpenDiscovery();
}
window.MindMapV3Guidance={situation,currentQuestion,addReviewFlag};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();