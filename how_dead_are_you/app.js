const STORAGE_KEY = 'howDeadAreYou.v1';

const SCENES = [
  { key:'grave', min:86, title:'Tombstone', flavour:'We are accepting condolences.', image:'https://images.pexels.com/photos/5953236/pexels-photo-5953236.jpeg?auto=compress&cs=tinysrgb&w=1600' },
  { key:'bed', min:66, title:'Lying in bed', flavour:'Barely among the living.', image:'https://images.pexels.com/photos/8036757/pexels-photo-8036757.jpeg?auto=compress&cs=tinysrgb&w=1600' },
  { key:'crawl', min:41, title:'Crawling', flavour:'Mobility achieved. Dignity pending.', image:'https://images.pexels.com/photos/11890374/pexels-photo-11890374.jpeg?auto=compress&cs=tinysrgb&w=1600' },
  { key:'walk', min:16, title:'Walking', flavour:'Suspiciously functional.', image:'https://images.pexels.com/photos/19989394/pexels-photo-19989394.jpeg?auto=compress&cs=tinysrgb&w=1600' },
  { key:'dance', min:0, title:'Dancing', flavour:'Returned from the brink.', image:'https://images.pexels.com/photos/6599729/pexels-photo-6599729.jpeg?auto=compress&cs=tinysrgb&w=1600' }
];

const defaults = {
  people: [
    { id:'a', name:'Patient One', slider:32, lastCheckin:null, escalated:false },
    { id:'b', name:'Patient Two', slider:47, lastCheckin:null, escalated:false }
  ],
  history: []
};

let state = loadState();
const grid = document.querySelector('#peopleGrid');
const historyEl = document.querySelector('#history');
const toastEl = document.querySelector('#toast');
const nameDialog = document.querySelector('#nameDialog');
let toastTimer;

SCENES.forEach(scene => { const img = new Image(); img.src = scene.image; });

function loadState(){
  try{
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if(!raw || !Array.isArray(raw.people)) return structuredClone(defaults);
    return {
      people: defaults.people.map((fallback, i) => ({...fallback, ...(raw.people[i] || {})})),
      history: Array.isArray(raw.history) ? raw.history.slice(0,20) : []
    };
  }catch{return structuredClone(defaults);}
}
function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function deadPercent(person){ return 100 - Number(person.slider); }
function sceneFor(dead){ return SCENES.find(scene => dead >= scene.min) || SCENES.at(-1); }
function fmtTime(value){
  if(!value) return 'No check-in yet';
  return new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(new Date(value));
}
function statusText(person){
  const dead = deadPercent(person); const scene = sceneFor(dead);
  return `${person.name}: ${dead}% dead — ${scene.title}. ${scene.flavour}`;
}
function showToast(message){
  clearTimeout(toastTimer); toastEl.textContent = message; toastEl.classList.add('show');
  toastTimer = setTimeout(()=>toastEl.classList.remove('show'),2300);
}
function addHistory(person,type){
  const dead = deadPercent(person); const scene = sceneFor(dead);
  state.history.unshift({id:crypto.randomUUID?.() || String(Date.now()+Math.random()), person:person.name, type, dead, stage:scene.title, time:new Date().toISOString()});
  state.history = state.history.slice(0,20);
}

function render(){
  grid.innerHTML = state.people.map(person => cardMarkup(person)).join('');
  bindCards(); renderHistory();
}
function cardMarkup(person){
  const dead = deadPercent(person); const scene = sceneFor(dead);
  return `<article class="person-card ${person.escalated?'escalated':''}" data-person="${person.id}" data-scene="${scene.key}">
    <div class="scene-photo" style="background-image:url('${scene.image}')"></div><div class="scene-vignette"></div><div class="scene-grade"></div>
    <div class="person-content">
      <div class="card-top"><h2 class="person-name">${escapeHtml(person.name)}</h2><span class="alert-chip">Escalated</span></div>
      <div class="status-block">
        <p class="dead-number"><b class="dead-value">${dead}</b><span>% DEAD</span></p>
        <h3 class="stage-title">${scene.title}</h3><p class="flavour">${scene.flavour}</p>
      </div>
      <div class="meter-panel">
        <div class="range-wrap"><input class="death-slider" type="range" min="0" max="100" step="1" value="${person.slider}" aria-label="${escapeHtml(person.name)} recovery level" aria-valuetext="${dead} percent dead"></div>
        <div class="range-labels" aria-hidden="true"><span>🪦 Tombstone</span><span>🛏️ Bed</span><span>🧎 Crawling</span><span>🚶 Walking</span><span>💃 Dancing</span></div>
        <div class="actions"><button class="primary-btn checkin-btn" type="button">Check in now</button><button class="share-btn" type="button">Share status</button><button class="escalate-btn" type="button">🚨 ESCALATE — I feel worse</button></div>
        <p class="last-checkin">Last check-in: <span>${fmtTime(person.lastCheckin)}</span></p>
      </div>
    </div>
  </article>`;
}
function bindCards(){
  document.querySelectorAll('.person-card').forEach(card => {
    const person = state.people.find(p=>p.id===card.dataset.person);
    const slider = card.querySelector('.death-slider');
    slider.addEventListener('input', () => {
      person.slider = Number(slider.value); person.escalated = false; updateCard(card,person); saveState();
    });
    card.querySelector('.checkin-btn').addEventListener('click',()=>{
      person.lastCheckin = new Date().toISOString(); person.escalated = false; addHistory(person,'check-in'); saveState(); render(); showToast(`${person.name} checked in at ${deadPercent(person)}% dead.`);
    });
    card.querySelector('.escalate-btn').addEventListener('click',()=>{
      person.slider = Math.max(0, Number(person.slider)-20); person.lastCheckin = new Date().toISOString(); person.escalated = true; addHistory(person,'ESCALATED'); saveState(); render(); showToast(`🚨 ${person.name} escalated to ${deadPercent(person)}% dead.`);
      if(navigator.vibrate) navigator.vibrate([90,60,150]);
    });
    card.querySelector('.share-btn').addEventListener('click',()=>shareStatus(person));
  });
}
function updateCard(card,person){
  const dead = deadPercent(person); const scene = sceneFor(dead);
  card.dataset.scene = scene.key; card.classList.toggle('escalated',person.escalated);
  card.querySelector('.dead-value').textContent = dead;
  card.querySelector('.stage-title').textContent = scene.title;
  card.querySelector('.flavour').textContent = scene.flavour;
  card.querySelector('.scene-photo').style.backgroundImage = `url('${scene.image}')`;
  card.querySelector('.death-slider').setAttribute('aria-valuetext',`${dead} percent dead, ${scene.title}`);
}
async function shareStatus(person){
  const text = `${statusText(person)}\nLast check-in: ${fmtTime(person.lastCheckin)}\n${location.href}`;
  try{
    if(navigator.share){ await navigator.share({title:'How Dead Are You?',text}); }
    else if(navigator.clipboard){ await navigator.clipboard.writeText(text); showToast('Status copied to clipboard.'); }
    else{ showToast('Sharing is not available in this browser.'); }
  }catch(err){ if(err?.name !== 'AbortError') showToast('Could not share status.'); }
}
function renderHistory(){
  if(!state.history.length){ historyEl.innerHTML='<div class="empty">No incidents yet. Suspiciously peaceful.</div>'; return; }
  historyEl.innerHTML = state.history.slice(0,8).map(item=>`<div class="history-item"><div><strong>${escapeHtml(item.person)} · ${escapeHtml(item.type)}</strong><small>${item.dead}% dead — ${escapeHtml(item.stage)}</small></div><small>${fmtTime(item.time)}</small></div>`).join('');
}
function escapeHtml(value){ return String(value).replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch])); }

document.querySelector('#editNames').addEventListener('click',()=>{
  document.querySelector('#nameA').value=state.people[0].name; document.querySelector('#nameB').value=state.people[1].name; nameDialog.showModal();
});
document.querySelector('#saveNames').addEventListener('click',e=>{
  e.preventDefault();
  const a=document.querySelector('#nameA').value.trim(), b=document.querySelector('#nameB').value.trim();
  if(a) state.people[0].name=a; if(b) state.people[1].name=b; saveState(); nameDialog.close(); render();
});
document.querySelector('#clearHistory').addEventListener('click',()=>{ state.history=[]; saveState(); renderHistory(); showToast('Incident log cleared.'); });

render();
