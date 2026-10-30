(()=>{'use strict';
  const isMobile=()=>matchMedia('(max-width:850px),(hover:none) and (pointer:coarse)').matches||(navigator.maxTouchPoints>0&&Math.min(screen.width,screen.height)<900);
  const app=document.getElementById('app');
  const svg=document.getElementById('svg');

  // Dedicated mobile header. It does not reuse or restyle the desktop .topbar,
  // so legacy desktop toolbar rules cannot make the mobile header disappear.
  function installMobileTopbar(){
    if(!app||document.getElementById('mobileTopbar'))return;

    const style=document.createElement('style');
    style.id='mobileTopbarStyles';
    style.textContent=`
      #mobileTopbar{display:none}
      @media(max-width:850px),(hover:none) and (pointer:coarse){
        #app.app:not(.hidden){display:grid!important;grid-template-rows:auto minmax(0,1fr) auto!important;width:100%!important;height:100dvh!important;min-height:100dvh!important;overflow:hidden!important}
        #app.app>.topbar{display:none!important}
        #mobileTopbar{
          display:flex!important;
          grid-row:1!important;
          position:relative!important;
          inset:auto!important;
          width:100%!important;
          min-width:0!important;
          height:52px!important;
          min-height:52px!important;
          flex:0 0 52px!important;
          align-items:center!important;
          gap:4px!important;
          padding:5px 6px!important;
          margin:0!important;
          background:rgba(252,251,247,.98)!important;
          border:0!important;
          border-bottom:1px solid rgba(126,112,94,.22)!important;
          box-shadow:0 4px 14px rgba(49,42,34,.08)!important;
          z-index:95!important;
          visibility:visible!important;
          opacity:1!important;
          pointer-events:auto!important;
          overflow:hidden!important;
        }
        #mobileTopbar .mobile-map-select{
          display:block!important;
          flex:1 1 auto!important;
          min-width:82px!important;
          width:auto!important;
          height:40px!important;
          margin:0!important;
          padding:0 24px 0 8px!important;
          border:1px solid var(--line,#ddd6ca)!important;
          border-radius:12px!important;
          background:var(--paper,#fbfaf6)!important;
          color:var(--ink,#201f1b)!important;
          font:inherit!important;
          font-size:.78rem!important;
          font-weight:750!important;
        }
        #mobileTopbar .mobile-top-action{
          display:inline-flex!important;
          flex:0 0 40px!important;
          width:40px!important;
          min-width:40px!important;
          max-width:40px!important;
          height:40px!important;
          min-height:40px!important;
          align-items:center!important;
          justify-content:center!important;
          margin:0!important;
          padding:0!important;
          border:1px solid var(--line,#ddd6ca)!important;
          border-radius:12px!important;
          background:#fff!important;
          color:var(--ink,#201f1b)!important;
          font:inherit!important;
          font-size:1.05rem!important;
          font-weight:800!important;
          line-height:1!important;
          visibility:visible!important;
          opacity:1!important;
        }
        #mobileTopbar .mobile-top-action:disabled{opacity:.38!important}
        #workspace.workspace{grid-row:2!important;position:relative!important;inset:auto!important;width:100%!important;height:auto!important;min-height:0!important}
        #app.app>#mobileContext.mobile-context{grid-row:3!important}
      }
      @media(max-width:370px){
        #mobileTopbar{gap:3px!important;padding-left:4px!important;padding-right:4px!important}
        #mobileTopbar .mobile-top-action{flex-basis:36px!important;width:36px!important;min-width:36px!important;max-width:36px!important}
        #mobileTopbar .mobile-map-select{min-width:70px!important}
      }
    `;
    document.head.appendChild(style);

    const nav=document.createElement('nav');
    nav.id='mobileTopbar';
    nav.setAttribute('aria-label','MindMap mobile toolbar');
    nav.innerHTML=`
      <select id="mobileMapSelect" class="mobile-map-select" aria-label="Current mind map"></select>
      <button id="mobileUndoFixed" class="mobile-top-action" type="button" title="Undo" aria-label="Undo">↶</button>
      <button id="mobileSearchFixed" class="mobile-top-action" type="button" title="Search" aria-label="Search">⌕</button>
      <button id="mobileNewFixed" class="mobile-top-action" type="button" title="New map" aria-label="New map">＋</button>
      <button id="mobileSaveFixed" class="mobile-top-action" type="button" title="Save / export" aria-label="Save / export">⇩</button>
      <button id="mobileMenuFixed" class="mobile-top-action" type="button" title="More" aria-label="More">•••</button>
    `;
    app.insertBefore(nav,app.firstChild);

    const coreSelect=document.getElementById('mapSelect');
    const mobileSelect=document.getElementById('mobileMapSelect');
    const coreUndo=document.getElementById('undoBtn');
    const mobileUndo=document.getElementById('mobileUndoFixed');

    const syncMapSelect=()=>{
      if(!coreSelect||!mobileSelect)return;
      mobileSelect.innerHTML=coreSelect.innerHTML;
      mobileSelect.value=coreSelect.value;
      mobileSelect.disabled=coreSelect.disabled;
    };
    const syncUndo=()=>{if(mobileUndo&&coreUndo)mobileUndo.disabled=coreUndo.disabled;};

    syncMapSelect();
    syncUndo();
    if(coreSelect){
      new MutationObserver(syncMapSelect).observe(coreSelect,{childList:true,subtree:true,attributes:true});
      coreSelect.addEventListener('change',syncMapSelect);
    }
    if(coreUndo)new MutationObserver(syncUndo).observe(coreUndo,{attributes:true,attributeFilter:['disabled']});

    mobileSelect?.addEventListener('change',()=>{
      if(!coreSelect)return;
      coreSelect.value=mobileSelect.value;
      coreSelect.dispatchEvent(new Event('change',{bubbles:true}));
    });
    mobileUndo?.addEventListener('click',()=>coreUndo?.click());
    document.getElementById('mobileSearchFixed')?.addEventListener('click',()=>document.getElementById('searchBtn')?.click());
    document.getElementById('mobileNewFixed')?.addEventListener('click',()=>{
      const existing=document.getElementById('mobileNewTop');
      if(existing)existing.click();else document.getElementById('newBtn')?.click();
    });
    document.getElementById('mobileSaveFixed')?.addEventListener('click',()=>{
      const existing=document.getElementById('mobileSaveTop');
      if(existing)existing.click();else document.getElementById('exportBtn')?.click();
    });
    document.getElementById('mobileMenuFixed')?.addEventListener('click',()=>document.getElementById('menuBtn')?.click());
  }

  installMobileTopbar();

  if(!svg)return;

  // Touch gesture policy:
  //   drag immediately = pan the map
  //   tap = normal node/edge action
  //   hold briefly, then drag a node = move that branch
  const touches=new Map();
  let suppressClickUntil=0;
  const PAN_THRESHOLD=7;
  const NODE_DRAG_HOLD_MS=360;
  const PAN_CONTENT='.node,.edge-hit,.edge,.edge-label-group';

  const pointerInit=(e,x=e.clientX,y=e.clientY,buttons=e.buttons)=>({
    bubbles:true,cancelable:true,composed:true,
    pointerId:e.pointerId,pointerType:'touch',isPrimary:e.isPrimary,
    clientX:x,clientY:y,screenX:e.screenX,screenY:e.screenY,
    button:0,buttons,width:e.width,height:e.height,pressure:e.pressure
  });

  svg.addEventListener('pointerdown',e=>{
    if(!isMobile()||!e.isTrusted||e.pointerType!=='touch')return;
    if(e.target===svg||e.target.closest?.('.quick-add'))return;
    if(!e.target.closest?.(PAN_CONTENT))return;

    const node=e.target.closest?.('.node')||null;
    const tag=(e.target.tagName||'').toLowerCase();
    const canNodeDrag=!!node&&!node.classList.contains('root')&&tag!=='text';
    touches.set(e.pointerId,{x:e.clientX,y:e.clientY,time:performance.now(),mode:'pending',node,canNodeDrag});
  },true);

  const beginPan=(e,p)=>{
    if(p.canNodeDrag&&p.node){
      try{if(p.node.hasPointerCapture?.(e.pointerId))p.node.releasePointerCapture(e.pointerId);}catch{}
      p.node.dispatchEvent(new PointerEvent('pointercancel',pointerInit(e,e.clientX,e.clientY,0)));
    }
    p.mode='pan';
    suppressClickUntil=Date.now()+450;
    svg.dispatchEvent(new PointerEvent('pointerdown',pointerInit(e,p.x,p.y,1)));
    try{if(svg.hasPointerCapture?.(e.pointerId))svg.releasePointerCapture(e.pointerId);}catch{}
    svg.dispatchEvent(new PointerEvent('pointermove',pointerInit(e,e.clientX,e.clientY,1)));
  };

  svg.addEventListener('pointermove',e=>{
    const p=touches.get(e.pointerId);if(!p)return;
    if(p.mode==='pan'){if(e.cancelable)e.preventDefault();return;}
    if(p.mode==='node')return;
    const dist=Math.hypot(e.clientX-p.x,e.clientY-p.y);
    if(dist<PAN_THRESHOLD)return;
    if(p.canNodeDrag&&performance.now()-p.time>=NODE_DRAG_HOLD_MS){p.mode='node';return;}
    if(e.cancelable)e.preventDefault();
    e.stopImmediatePropagation();
    beginPan(e,p);
  },true);

  const finish=e=>{
    const p=touches.get(e.pointerId);if(!p)return;
    if(p.mode==='pan')suppressClickUntil=Date.now()+450;
    touches.delete(e.pointerId);
  };
  svg.addEventListener('pointerup',finish,true);
  svg.addEventListener('pointercancel',finish,true);

  document.addEventListener('click',e=>{
    if(Date.now()>=suppressClickUntil)return;
    if(!e.target.closest?.('#svg'))return;
    e.preventDefault();
    e.stopImmediatePropagation();
  },true);
})();
