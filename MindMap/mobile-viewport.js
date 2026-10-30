(()=>{'use strict';
  const isMobile=()=>matchMedia('(max-width:850px),(hover:none) and (pointer:coarse)').matches||(navigator.maxTouchPoints>0&&Math.min(screen.width,screen.height)<900);
  const app=document.getElementById('app');
  const workspace=document.getElementById('workspace');
  const context=document.getElementById('mobileContext');
  const svg=document.getElementById('svg');

  // Mobile toolbars are structural layout rows. Nothing tracks Safari's
  // scrolling visual viewport, so the bars do not float, chase, or lag.
  if(app&&workspace&&context&&context.parentElement===workspace){
    workspace.insertAdjacentElement('afterend',context);
  }

  const style=document.createElement('style');
  style.id='mobileStableDocking';
  style.textContent=`
    @media(max-width:850px),(hover:none) and (pointer:coarse){
      html,body{height:100%;overflow:hidden!important;overscroll-behavior:none}
      #app.app:not(.hidden){
        display:grid!important;
        grid-template-rows:auto minmax(0,1fr) auto!important;
        width:100%!important;
        height:100dvh!important;
        min-height:100dvh!important;
        overflow:hidden!important;
      }
      #app>.topbar{
        position:relative!important;
        inset:auto!important;
        left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;
        transform:none!important;
        width:100%!important;
        min-width:0!important;
        overflow:hidden!important;
        grid-row:1!important;
      }
      #app>.topbar .toolbar{
        display:flex!important;
        flex-wrap:nowrap!important;
        align-items:center!important;
        justify-content:flex-start!important;
        width:100%!important;
        min-width:0!important;
        max-width:none!important;
        overflow:hidden!important;
        overflow-x:hidden!important;
        -webkit-overflow-scrolling:auto!important;
        gap:3px!important;
        padding:4px 5px!important;
      }
      #app>.topbar .toolbar .map-select{
        flex:1 1 auto!important;
        min-width:58px!important;
        max-width:none!important;
        width:auto!important;
      }
      #app>.topbar .toolbar .btn.icon{
        flex:0 0 35px!important;
        width:35px!important;
        min-width:35px!important;
        max-width:35px!important;
      }
      #workspace.workspace{
        position:relative!important;
        inset:auto!important;
        left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;
        width:100%!important;
        height:auto!important;
        min-height:0!important;
        grid-row:2!important;
        overflow:hidden!important;
        touch-action:none!important;
      }
      #svg{touch-action:none!important;-webkit-user-select:none;user-select:none}
      #app>#mobileContext.mobile-context{
        position:relative!important;
        inset:auto!important;
        left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;
        transform:none!important;
        width:100%!important;
        max-width:none!important;
        grid-row:3!important;
        flex:none!important;
        margin:0!important;
      }
      #workspace .floating.mobile-open{
        position:absolute!important;
        left:8px!important;right:8px!important;top:auto!important;bottom:8px!important;
      }
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

  if(!svg)return;

  // Touch gesture policy:
  //   drag immediately = pan the map
  //   tap = normal node/edge action
  //   hold briefly, then drag a node = move that branch
  // This removes the sticky feeling caused by nodes and wide edge hit areas
  // swallowing the first touch while preserving deliberate node dragging.
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
    touches.set(e.pointerId,{
      x:e.clientX,y:e.clientY,time:performance.now(),
      mode:'pending',node,canNodeDrag
    });
    // Do not stop the down event. A stationary touch remains a normal tap,
    // and a held node keeps the app's existing branch-drag behaviour.
  },true);

  const beginPan=(e,p)=>{
    // If app.js already armed a node drag, cancel it cleanly before panning.
    if(p.canNodeDrag&&p.node){
      try{if(p.node.hasPointerCapture?.(e.pointerId))p.node.releasePointerCapture(e.pointerId);}catch{}
      p.node.dispatchEvent(new PointerEvent('pointercancel',pointerInit(e,e.clientX,e.clientY,0)));
    }

    p.mode='pan';
    suppressClickUntil=Date.now()+450;

    // Start the app's own pan state at the original finger-down coordinate.
    svg.dispatchEvent(new PointerEvent('pointerdown',pointerInit(e,p.x,p.y,1)));
    try{if(svg.hasPointerCapture?.(e.pointerId))svg.releasePointerCapture(e.pointerId);}catch{}

    // Apply the movement that caused the gesture to become a pan.
    svg.dispatchEvent(new PointerEvent('pointermove',pointerInit(e,e.clientX,e.clientY,1)));
  };

  svg.addEventListener('pointermove',e=>{
    const p=touches.get(e.pointerId);if(!p)return;
    if(p.mode==='pan'){
      if(e.cancelable)e.preventDefault();
      return;
    }
    if(p.mode==='node')return;

    const dist=Math.hypot(e.clientX-p.x,e.clientY-p.y);
    if(dist<PAN_THRESHOLD)return;

    // A deliberate hold on a draggable node retains branch dragging.
    if(p.canNodeDrag&&performance.now()-p.time>=NODE_DRAG_HOLD_MS){
      p.mode='node';
      return;
    }

    // Movement before the hold threshold means the user is navigating.
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
