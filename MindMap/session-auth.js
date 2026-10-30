(()=>{'use strict';
const AUTH_KEY='swamp.mindmap.auth.v1';
const SESSION_KEY='swamp.mindmap.session-auth.v1';
const SECRET_KEY='swamp.mindmap.session-secret.v1';

function clearSession(){
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SECRET_KEY);
}
function b64(bytes){return btoa(String.fromCharCode(...bytes));}
async function hashPass(pass,salt64){
  const enc=new TextEncoder();
  const key=await crypto.subtle.importKey('raw',enc.encode(pass),'PBKDF2',false,['deriveBits']);
  const salt=Uint8Array.from(atob(salt64),c=>c.charCodeAt(0));
  const bits=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt,iterations:120000},key,256);
  return b64(new Uint8Array(bits));
}
async function establishSession(){
  const originalAuth=localStorage.getItem(AUTH_KEY);
  if(!originalAuth)return;
  const secret=b64(crypto.getRandomValues(new Uint8Array(32)));
  const salt=b64(crypto.getRandomValues(new Uint8Array(16)));
  const hash=await hashPass(secret,salt);
  let name='Writer';
  try{name=JSON.parse(originalAuth)?.name||name;}catch{}
  sessionStorage.setItem(SESSION_KEY,JSON.stringify({originalAuth,sessionAuth:JSON.stringify({name,salt,hash})}));
  sessionStorage.setItem(SECRET_KEY,secret);
}
function readSession(){
  try{
    const bundle=JSON.parse(sessionStorage.getItem(SESSION_KEY)||'null');
    const secret=sessionStorage.getItem(SECRET_KEY);
    return bundle&&secret?{bundle,secret}:null;
  }catch{clearSession();return null;}
}
function autoUnlock(){
  const session=readSession();
  if(!session)return;
  const {bundle,secret}=session;
  const currentAuth=localStorage.getItem(AUTH_KEY);
  if(!bundle.originalAuth||currentAuth!==bundle.originalAuth){clearSession();return;}
  const auth=document.getElementById('auth');
  const app=document.getElementById('app');
  const form=document.getElementById('authForm');
  const pass=document.getElementById('passphrase');
  if(!form||!pass||auth?.classList.contains('hidden')||!app?.classList.contains('hidden'))return;
  localStorage.setItem(AUTH_KEY,bundle.sessionAuth);
  pass.value=secret;
  try{form.requestSubmit();}
  finally{
    localStorage.setItem(AUTH_KEY,bundle.originalAuth);
    pass.value='';
  }
}

const auth=document.getElementById('auth');
const app=document.getElementById('app');
if(auth&&app){
  let establishing=false;
  const observer=new MutationObserver(()=>{
    const unlocked=auth.classList.contains('hidden')&&!app.classList.contains('hidden');
    if(unlocked&&!readSession()&&!establishing){
      establishing=true;
      establishSession().finally(()=>{establishing=false;});
    }
  });
  observer.observe(auth,{attributes:true,attributeFilter:['class']});
}

document.addEventListener('click',e=>{
  if(e.target?.closest?.('#lockBtn,#mobileLock'))clearSession();
},true);

autoUnlock();
})();
