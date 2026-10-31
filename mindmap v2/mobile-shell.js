(()=>{'use strict';
if(window.__SWAMP_MOBILE_SHELL__)return;
window.__SWAMP_MOBILE_SHELL__=true;

const qs=(s,r=document)=>r.querySelector(s);
const qsa=(s,r=document)=>[...r.querySelectorAll(s)];
const isMobile=()=>matchMedia('(max-width:850px)').matches||matchMedia('(hover:none) and (pointer:coarse)').matches;
let observer=null;
let writerObserver=null;
let syncRaf=0;

function injectStyles(){
  if(qs('#mobileShellStyles'))return;
  const style=document.createElement('style');
  style.id='mobileShellStyles';
  style.textContent=`
    @media(max-width:850px),(hover:none) and (pointer:coarse){
      html,body{width:100%;height:100%;margin:0;overflow:hidden!important}
      body #app.app:not(.hidden){display:grid!important;grid-template-rows:max-content minmax(0,1fr) max-content!important;width:100%!important;height:100dvh!important;min-height:100dvh!important;overflow:hidden!important}
      body #desktopToolbar{display:none!important}
      body #mobileToolbar{display:flex!important;grid-row:1!important;position:relative!important;inset:auto!important;align-items:center!important;gap:5px!important;width:100%!important;min-width:0!important;padding:calc(6px + env(safe-area-inset-top)) 7px 6px!important;background:rgba(252,251,247,.985)!important;border:0!important;border-bottom:1px solid rgba(126,112,94,.18)!important;box-shadow:0 3px 12px rgba(49,42,34,.07)!important;z-index:160!important}
      body #mobileToolbar .tb-select{display:block!important;flex:1 1 auto!important;min-width:0!important;max-width:none!important;width:auto!important;height:42px!important;border-radius:12px!important;font-size:.8rem!important;padding:0 28px 0 9px!important}
      body #mobileToolbar .tb-button{display:inline-flex!important;flex:0 0 42px!important;width:42px!important;min-width:42px!important;max-width:42px!important;height:42px!important;min-height:42px!important;padding:0!important;border-radius:12px!important;font-size:1.04rem!important}
      body #workspace.workspace{display:block!important;grid-row:2!important;position:relative!important;inset:auto!important;width:100%!important;height:auto!important;min-height:0!important;overflow:hidden!important}
      body #mobileBottomToolbar{display:flex!important;grid-row:3!important;position:relative!important;inset:auto!important;align-items:stretch!important;width:100%!important;min-width:0!important;margin:0!important;padding:6px 7px calc(6px + env(safe-area-inset-bottom))!important;gap:4px!important;background:rgba(252,251,247,.985)!important;border:0!important;border-top:1px solid rgba(126,112,94,.18)!important;box-shadow:0 -3px 12px rgba(49,42,34,.07)!important;z-index:160!important}
      body #mobileBottomToolbar .tb-bottom-action{display:flex!important;flex:1 1 0!important;min-width:0!important;height:54px!important;border:0!important;border-radius:13px!important;background:transparent!important;color:var(--ink)!important;padding:4px 2px!important;font:inherit!important;font-size:.69rem!important;font-weight:820!important;line-height:1.05!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:3px!important;white-space:nowrap!important}
      body #mobileBottomToolbar .tb-bottom-action .tb-glyph{display:block!important;font-size:1.08rem!important;line-height:1!important}
      body #mobileBottomToolbar .tb-bottom-action:active,body #mobileBottomToolbar .tb-bottom-action.is-active{background:var(--soft)!important;color:var(--accent)!important}
      body #mobileBottomToolbar .tb-bottom-action:disabled{opacity:.35!important}
      body #writerContext{display:none!important}
      body #groupSelectBtn,body #groupLayoutBar{display:none!important}
      body #multiSelectBar{bottom:calc(72px + env(safe-area-inset-bottom))!important;max-width:calc(100% - 16px)!important}
      body #writerLensStrip{top:calc(58px + env(safe-area-inset-top))!important;max-width:calc(100vw - 16px)!important;z-index:150!important}
      body #writerHealthPanel{bottom:calc(72px + env(safe-area-inset-bottom))!important;max-height:50dvh!important}
      body #workspace .utility-sheet{right:8px!important;top:8px!important;width:calc(100vw - 16px)!important;max-width:340px!important;z-index:170!important}
      body #workspace .search{top:8px!important;width:calc(100vw - 16px)!important;z-index:170!important}
      body .mini{display:none!important}
    }
    @media(max-width:380px){
      body #mobileToolbar{gap:3px!important;padding-left:4px!important;padding-right:4px!important}
      body #mobileToolbar .tb-button{flex-basis:38px!important;width:38px!important;min-width:38px!important;max-width:38px!important}
      body #mobileBottomToolbar{gap:2px!important;padding-left:4px!important;padding-right:4px!important}
      body #mobileBottomToolbar .tb-bottom-action{font-size:.64rem!important}
    }
  `;
  document.head.appendChild(style);
}

function clickFirst(...selectors){
  for(const selector of selectors){
    const el=qs(selector);
    if(el){el.click();return true;}
  }
  return false;
}

const ACTIONS=[
  {key:'edit',glyph:'✎',label:'Edit',run:()=>clickFirst('#writerContext [data-writer-refine="edit"]','#contextEdit')},
  {key:'rapid',glyph:'⚡',label:'Rapid',run:()=>clickFirst('#writerContext [data-writer-action="rapid"]','#contextRapid')},
  {key:'lens',glyph:'◎',label:'Lens',run:()=>clickFirst('#writerContext [data-writer-action="lens"]')},
  {key:'link',glyph:'↗',label:'Link',run:()=>clickFirst('#writerContext [data-writer-action="link"]')},
  {key:'more',glyph:'•••',label:'More',run:()=>clickFirst('#writerContext [data-writer-action="branch"]','#contextMore')}
];

function rebuildBottom(){
  const bar=qs('#mobileBottomToolbar');if(!bar||bar.dataset.mobileShell==='1')return;
  bar.dataset.mobileShell='1';
  bar.innerHTML='';
  ACTIONS.forEach(action=>{
    const btn=document.createElement('button');
    btn.type='button';btn.className='tb-bottom-action';btn.dataset.mobileAction=action.key;
    btn.innerHTML=`<span class="tb-glyph">${action.glyph}</span><span>${action.label}</span>`;
    btn.addEventListener('click',e=>{e.preventDefault();if(btn.disabled)return;action.run();requestAnimationFrame(sync);});
    bar.appendChild(btn);
  });
}
function selected(){return qs('#nodes .node.selected');}
function actionSource(key){
  if(key==='edit')return qs('#writerContext [data-writer-refine="edit"]')||qs('#contextEdit');
  if(key==='more')return qs('#writerContext [data-writer-action="branch"]')||qs('#contextMore');
  if(key==='rapid')return qs('#writerContext [data-writer-action="rapid"]')||qs('#contextRapid');
  return qs(`#writerContext [data-writer-action="${key}"]`);
}
function sync(){
  if(!isMobile())return;
  rebuildBottom();
  const hasSelected=!!selected();
  qsa('#mobileBottomToolbar [data-mobile-action]').forEach(btn=>{
    const source=actionSource(btn.dataset.mobileAction);
    btn.disabled=!hasSelected||!source;
    btn.classList.toggle('is-active',!!source&&(source.classList.contains('active')||source.getAttribute('aria-pressed')==='true'));
  });
  document.body.classList.toggle('mobile-node-selected',hasSelected);
}
function scheduleSync(){cancelAnimationFrame(syncRaf);syncRaf=requestAnimationFrame(sync);}
function watchWriter(){
  const writer=qs('#writerContext');
  if(!writer||writerObserver)return false;
  writerObserver=new MutationObserver(scheduleSync);
  writerObserver.observe(writer,{childList:true,subtree:true,attributes:true,attributeFilter:['class','aria-pressed']});
  scheduleSync();
  return true;
}
function bind(){
  injectStyles();rebuildBottom();sync();watchWriter();
  const nodes=qs('#nodes');
  if(nodes){observer=new MutationObserver(scheduleSync);observer.observe(nodes,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});}
  if(!writerObserver){
    const bodyObserver=new MutationObserver(()=>{if(watchWriter())bodyObserver.disconnect();});
    bodyObserver.observe(document.body,{childList:true,subtree:true});
  }
  document.addEventListener('click',scheduleSync,true);
  window.addEventListener('resize',scheduleSync,{passive:true});
  window.addEventListener('orientationchange',scheduleSync,{passive:true});
  window.addEventListener('pageshow',scheduleSync);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();
