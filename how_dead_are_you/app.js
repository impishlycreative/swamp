const STORAGE_KEY = 'howDeadAreYou.v1';

const SCENES = [
  { key:'grave', min:86, title:'Tombstone', flavour:'Officially dead, according to this deeply unscientific app.', image:'https://images.pexels.com/photos/5953236/pexels-photo-5953236.jpeg?auto=compress&cs=tinysrgb&w=1600' },
  { key:'bed', min:66, title:'Lying in bed', flavour:'Barely among the living.', image:'https://images.pexels.com/photos/8036757/pexels-photo-8036757.jpeg?auto=compress&cs=tinysrgb&w=1600' },
  { key:'crawl', min:41, title:'Crawling', flavour:'Mobility achieved. Dignity pending.', image:'https://images.pexels.com/photos/11890374/pexels-photo-11890374.jpeg?auto=compress&cs=tinysrgb&w=1600' },
  { key:'walk', min:16, title:'Walking', flavour:'Suspiciously functional.', image:'https://images.pexels.com/photos/19989394/pexels-photo-19989394.jpeg?auto=compress&cs=tinysrgb&w=1600' },
  { key:'dance', min:0, title:'Dancing', flavour:'Returned from the brink.', image:'https://images.pexels.com/photos/6599729/pexels-photo-6599729.jpeg?auto=compress&cs=tinysrgb&w=1600' }
];

const defaults = { people: [], history: [] };

let state = loadState();
const grid = document.querySelector('#peopleGrid');
const historyEl = document.querySelector('#history');
const toastEl = document.querySelector('#toast');
const countEl = document.querySelector('#personCount');
const addDialog = document.querySelector('#addPersonDialog');
const addForm = document.querySelector('#addPersonForm');
let toastTimer;

SCENES.forEach(scene => { const img = new Image(); img.src = scene.image; });

function makeId(){ return crypto.randomUUID?.() || `person-${Date.now()}-${Math.random().toString(16).slice(2)}`; }
function cloneDefaults(){ return {people:[], history:[]}; }
function clamp(value,min,max){ return Math.min(max,Math.max(min,value)); }

function loadState(){
  try{
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if(!raw || !Array.isArray(raw.people)) return cloneDefaults();
    return {
      people: raw.people.map((person,index)=>({
        id: person.id || makeId(),
        name: person.name || `Sick person ${index+1}`,
        gender: person.gender === 'man' ? 'man' : 'woman',
        slider: clamp(Number.isFinite(Number(person.slider)) ? Number(person.slider) : 50,0,100),
        lastCheckin: person.lastCheckin || null
      })),
      history: Array.isArray(raw.history) ? raw.history.filter(item=>item?.type !== 'ESCALATED').slice(0,20) : []
    };
  }catch{return cloneDefaults();}
}

function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function deadPercent(person){ return 100 - Number(person.slider); }
function sceneFor(dead){ return SCENES.find(scene => dead >= scene.min) || SCENES.at(-1); }
function genderLabel(person){ return person.gender === 'man' ? 'Man' : 'Woman'; }
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
  state.history.unshift({id:makeId(), person:person.name, type, dead, stage:scene.title, time:new Date().toISOString()});
  state.history = state.history.slice(0,20);
}

function render(){
  countEl.textContent = `${state.people.length} sick ${state.people.length === 1 ? 'person' : 'people'}`;
  if(!state.people.length){
    grid.innerHTML = `<div class="zero-state"><div class="zero-icon">🤒</div><h2>No sick people yet</h2><p>Add as many as you need. Zero is also a perfectly acceptable number.</p><button class="primary-btn zero-add" type="button">+ Add sick person</button></div>`;
    grid.querySelector('.zero-add').addEventListener('click',openAddDialog);
  }else{
    grid.innerHTML = state.people.map(person => cardMarkup(person)).join('');
    bindCards();
  }
  renderHistory();
}

function cardMarkup(person){
  const dead = deadPercent(person); const scene = sceneFor(dead);
  const isGrave = scene.key === 'grave';
  return `<article class="person-card" data-person="${person.id}" data-scene="${scene.key}">
    <div class="scene-photo" style="background-image:url('${scene.image}')"></div><div class="scene-vignette"></div><div class="scene-grade"></div>
    <div class="grave-marker" aria-hidden="${isGrave ? 'false' : 'true'}"><div class="tombstone"><span class="rip">RIP</span><span class="tombstone-name">${escapeHtml(person.name)}</span></div><div class="tombstone-base"></div></div>
    <div class="person-content">
      <div class="card-top">
        <div class="identity"><h2 class="person-name">${escapeHtml(person.name)}</h2><span class="gender-chip">${genderLabel(person)}</span></div>
        <button class="remove-person" type="button" aria-label="Remove ${escapeHtml(person.name)}">Remove</button>
      </div>
      <div class="status-block">
        <p class="dead-number"><b class="dead-value">${dead}</b><span>% DEAD</span></p>
        <h3 class="stage-title">${scene.title}</h3><p class="flavour">${scene.flavour}</p>
      </div>
      <div class="meter-panel">
        <div class="range-wrap"><input class="death-slider" type="range" min="0" max="100" step="1" value="${person.slider}" aria-label="${escapeHtml(person.name)} recovery level" aria-valuetext="${dead} percent dead"></div>
        <div class="range-labels" aria-hidden="true"><span>🪦 Tombstone</span><span>🛏️ Bed</span><span>🧎 Crawling</span><span>🚶 Walking</span><span>💃 Dancing</span></div>
        <div class="actions"><button class="primary-btn checkin-btn" type="button">Check in now</button><button class="share-btn" type="button">Share status</button></div>
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
      person.slider = Number(slider.value); updateCard(card,person); saveState();
    });
    card.querySelector('.checkin-btn').addEventListener('click',()=>{
      person.lastCheckin = new Date().toISOString(); addHistory(person,'check-in'); saveState(); render(); showToast(`${person.name} checked in at ${deadPercent(person)}% dead.`);
    });
    card.querySelector('.share-btn').addEventListener('click',()=>shareStatus(person));
    card.querySelector('.remove-person').addEventListener('click',()=>removePerson(person));
  });
}

function updateCard(card,person){
  const dead = deadPercent(person); const scene = sceneFor(dead);
  card.dataset.scene = scene.key;
  card.querySelector('.dead-value').textContent = dead;
  card.querySelector('.stage-title').textContent = scene.title;
  card.querySelector('.flavour').textContent = scene.flavour;
  card.querySelector('.scene-photo').style.backgroundImage = `url('${scene.image}')`;
  card.querySelector('.death-slider').setAttribute('aria-valuetext',`${dead} percent dead, ${scene.title}`);
  const grave = card.querySelector('.grave-marker');
  grave.setAttribute('aria-hidden',scene.key === 'grave' ? 'false' : 'true');
}

function removePerson(person){
  if(!confirm(`Remove ${person.name} from the sick list?`)) return;
  state.people = state.people.filter(p=>p.id !== person.id);
  saveState(); render(); showToast(`${person.name} removed.`);
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

function openAddDialog(){
  addForm.reset();
  document.querySelector('input[name="gender"][value="woman"]').checked = true;
  addDialog.showModal();
  setTimeout(()=>document.querySelector('#newPersonName').focus(),0);
}

document.querySelector('#addPerson').addEventListener('click',openAddDialog);
document.querySelector('#cancelAddPerson').addEventListener('click',()=>addDialog.close());
addForm.addEventListener('submit',event=>{
  event.preventDefault();
  const name = document.querySelector('#newPersonName').value.trim();
  if(!name) return;
  const gender = new FormData(addForm).get('gender') === 'man' ? 'man' : 'woman';
  const person = {id:makeId(),name,gender,slider:50,lastCheckin:null};
  state.people.push(person); saveState(); addDialog.close(); render();
  document.querySelector(`[data-person="${person.id}"]`)?.scrollIntoView({behavior:'smooth',block:'center'});
  showToast(`${person.name} added to sick bay.`);
});
document.querySelector('#clearHistory').addEventListener('click',()=>{ state.history=[]; saveState(); renderHistory(); showToast('Incident log cleared.'); });

render();
