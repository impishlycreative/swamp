(()=>{'use strict';
  const isMobile=()=>matchMedia('(max-width:850px),(hover:none) and (pointer:coarse)').matches||(navigator.maxTouchPoints>0&&Math.min(screen.width,screen.height)<900);
  const app=document.getElementById('app');
  const workspace=document.getElementById('workspace');
  const context=document.getElementById('mobileContext');
  const svg=document.getElementById('svg');
  const topbar=document.querySelector('#app>.topbar');
  const toolbar=topbar?.querySelector('.toolbar');

  const dockContext=()=>{
    if(app&&workspace&&context&&context.parentElement===workspace){
      workspace.insertAdjacentElement('afterend',context);
    }
  };

  const forceMobileChrome=()=>{
    if(!isMobile()||!app||!workspace||!topbar||!toolbar||!context)return;
    dockContext();

    app.style.setProperty('display','grid','important');
    app.style.setProperty('grid-template-rows','auto minmax(0,1fr) auto','important');
    app.style.setProperty('width','100%','important');
    app.style.setProperty('height','100dvh','important');
    app.style.setProperty('min-height','100dvh','important');
    app.style.setProperty('overflow','hidden','important');

    topbar.style.setProperty('display','flex','important');
    topbar.style.setProperty('visibility','visible','important');
    topbar.style.setProperty('opacity','1','important');
    topbar.style.setProperty('position','relative','important');
    topbar.style.setProperty('inset','auto','important');
    topbar.style.setProperty('transform','none','important');
    topbar.style.setProperty('width','100%','important');
    topbar.style.setProperty('min-height','51px','important');
    topbar.style.setProperty('height','auto','important');
    topbar.style.setProperty('overflow','visible','important');
    topbar.style.setProperty('flex','0 0 auto','important');
    topbar.style.setProperty('grid-row','1','important');
    topbar.style.setProperty('z-index','90','important');
    topbar.style.setProperty('pointer-events','auto','important');

    toolbar.style.setProperty('display','flex','important');
    toolbar.style.setProperty('visibility','visible','important');
    toolbar.style.setProperty('opacity','1','important');
    toolbar.style.setProperty('position','relative','important');
    toolbar.style.setProperty('width','100%','important');
    toolbar.style.setProperty('min-width','0','important');
    toolbar.style.setProperty('min-height','49px','important');
    toolbar.style.setProperty('height','auto','important');
    toolbar.style.setProperty('flex','1 1 auto','important');
    toolbar.style.setProperty('align-items','center','important');
    toolbar.style.setProperty('justify-content','flex-start','important');
    toolbar.style.setProperty('flex-wrap','nowrap','important');
    toolbar.style.setProperty('gap','3px','important');
    toolbar.style.setProperty('padding','4px 5px','important');
    toolbar.style.setProperty('overflow-x','auto','important');
    toolbar.style.setProperty('overflow-y','hidden','important');
    toolbar.style.setProperty('pointer-events','auto','important');

    const mapSelect=document.getElementById('mapSelect');
    if(mapSelect){
      mapSelect.style.setProperty('display','block','important');
      mapSelect.style.setProperty('visibility','visible','important');
      mapSelect.style.setProperty('opacity','1','important');
      mapSelect.style.setProperty('flex','1 1 58px','important');
      mapSelect.style.setProperty('min-width','58px','important');
      mapSelect.style.setProperty('max-width','none','important');
      mapSelect.style.setProperty('width','auto','important');
    }

    ['undoBtn','searchBtn','mobileNewTop','mobileSaveTop','menuBtn','mobileCenterTop','mobileOpenTop','mobileLockTop'].forEach(id=>{
      const el=document.getElementById(id);if(!el)return;
      el.style.setProperty('display','inline-flex','important');
      el.style.setProperty('visibility','visible','important');
      el.style.setProperty('opacity','1','important');
      el.style.setProperty('flex','0 0 35px','important');
      el.style.setProperty('width','35px','important');
      el.style.setProperty('min-width','35px','important');
      el.style.setProperty('max-width','35px','important');
    });
    document.getElementById('addBtn')?.style.setProperty('display','none','important');
    document.getElementById('fitTopBtn')?.style.setProperty('display','none','important');

    workspace.style.setProperty('position','relative','important');
    workspace.style.setProperty('inset','auto','important');
    workspace.style.setProperty('width','100%','important');
    workspace.style.setProperty('height','auto','important');
    workspace.style.setProperty('min-height','0','important');
    workspace.style.setProperty('grid-row','2','important');
    workspace.style.setProperty('overflow','hidden','important');

    context.style.setProperty('display','flex','important');
    context.style.setProperty('visibility','visible','important');
    context.style.setProperty('opacity','1','important');
    context.style.setProperty('position','relative','important');
    context.style.setProperty('inset','auto','important');
    context.style.setProperty('transform','none','important');
    context.style.setProperty('width','100%','important');
    context.style.setProperty('max-width','none','important');
    context.style.setProperty('grid-row','3','important');
    context.style.setProperty('flex','0 0 auto','important');
    context.style.setProperty('margin','0','important');
    context.style.setProperty('z-index','90','important');
  };

  dockContext();

  const style=document.createElement('style');
  style.id='mobileStableDocking';
  style.textContent=`
    @media(max-width:850px),(hover:none) and (pointer:coarse){
      html,body{height:100%;overflow:hidden!important;overscroll-behavior:none}
      #app.app:not(.hidden){display:grid!important;grid-template-rows:auto minmax(0,1fr) auto!important;width:100%!important;height:100dvh!important;min-height:100dvh!important;overflow:hidden!important}
      #app>.topbar{display:flex!important;visibility:visible!important;opacity:1!important;position:relative!important;inset:auto!important;transform:none!important;width:100%!important;min-height:51px!important;height:auto!important;overflow:visible!important;grid-row:1!important;flex:0 0 auto!important;z-index:90!important;pointer-events:auto!important}
      #app>.topbar .toolbar{display:flex!important;visibility:visible!important;opacity:1!important;flex-wrap:nowrap!important;align-items:center!important;justify-content:flex-start!important;width:100%!important;min-width:0!important;max-width:none!important;min-height:49px!important;overflow-x:auto!important;overflow-y:hidden!important;gap:3px!important;padding:4px 5px!important;pointer-events:auto!important}
      #app>.topbar .toolbar .map-select{display:block!important;visibility:visible!important;opacity:1!important;flex:1 1 58px!important;min-width:58px!important;max-width:none!important;width:auto!important}
      #workspace.workspace{position:relative!important;inset:auto!important;width:100%!important;height:auto!important;min-height:0!important;grid-row:2!important;overflow:hidden!important;touch-action:none!important}
      #svg{touch-action:none!important;-webkit-user-select:none;user-select:none}
      #app>#mobileContext.mobile-context{display:flex!important;visibility:visible!important;opacity:1!important;position:relative!important;inset:auto!important;transform:none!important;width:100%!important;max-width:none!important;grid-row:3!important;flex:0 0 auto!important;margin:0!important;z-index:90!important}
      #workspace .floating.mobile-open{position:absolute!important;left:8px!important;right:8px!important;top:auto!important;bottom:8px!important}
      #workspace .toast{bottom:16px!important;top:auto!important}
      #workspace .edge-hit{stroke-width:24!important}
    }
    @media(max-width:380px){
      #app>.topbar .toolbar{gap:2px!important;padding-left:3px!important;padding-right:3px!important}
      #app>.topbar .toolbar .map-select{min-width:48px!important}
      #app>.topbar .toolbar .btn.icon{flex-basis:32px!important;width:32px!important;min-width:32px!important;max-width:32px!important}
    }
  `;
  document.head.appendChild(style);

  const scheduleChrome=()=>requestAnimationFrame(forceMobileChrome);
  window.addEventListener('DOMContentLoaded',()=>{
    forceMobileChrome();
    setTimeout(forceMobileChrome,0);
    setTimeout(forceMobileChrome,80);
    setTimeout(forceMobileChrome,300);
  });
  window.addEventListener('resize',scheduleChrome);
  window.addEventListener('orientationchange',()=>setTimeout(forceMobileChrome,120));
  window.addEventListener('pageshow',forceMobileChrome);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)forceMobileChrome();});
  if(app)new MutationObserver(scheduleChrome).observe(app,{attributes:true,attributeFilter:['class'],childList:true,subtree:false});
  if(toolbar)new MutationObserver(scheduleChrome).observe(toolbar,{attributes:true,attributeFilter:['class','style'],childList:true});
  if(context)new MutationObserver(scheduleChrome).observe(context,{attributes:true,attributeFilter:['class','style']});

  if(!svg)return;

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
