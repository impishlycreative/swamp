(()=>{'use strict';
  const isMobile=()=>matchMedia('(max-width:850px),(hover:none) and (pointer:coarse)').matches||(navigator.maxTouchPoints>0&&Math.min(screen.width,screen.height)<900);
  const app=document.getElementById('app');
  const workspace=document.getElementById('workspace');
  const context=document.getElementById('mobileContext');
  const svg=document.getElementById('svg');

  // On mobile the toolbars are real layout rows, not floating elements that
  // chase Safari's visual viewport. This keeps them mechanically attached to
  // the top and bottom of the app while the map occupies the space between.
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
        grid-row:1!important;
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
  `;
  document.head.appendChild(style);

  if(!svg)return;

  // The original app only starts a canvas pan when the first touch lands on
  // blank SVG. On a dense map, nodes and wide edge hit areas therefore feel
  // sticky. For touch input, route a drag that starts on map content through
  // the app's existing pan code. A tap still reaches the normal node/edge
  // click handler; only a real drag suppresses that click.
  const bridged=new Map();
  let suppressClickUntil=0;
  const PAN_THRESHOLD=6;
  const PAN_CONTENT='.node,.edge-hit,.edge,.edge-label-group';

  svg.addEventListener('pointerdown',e=>{
    if(!isMobile()||!e.isTrusted||e.pointerType!=='touch')return;
    if(e.target===svg||e.target.closest?.('.quick-add'))return;
    if(!e.target.closest?.(PAN_CONTENT))return;

    bridged.set(e.pointerId,{x:e.clientX,y:e.clientY,moved:false});
    e.stopImmediatePropagation();

    const proxy=new PointerEvent('pointerdown',{
      bubbles:true,cancelable:true,composed:true,
      pointerId:e.pointerId,pointerType:'touch',isPrimary:e.isPrimary,
      clientX:e.clientX,clientY:e.clientY,screenX:e.screenX,screenY:e.screenY,
      button:0,buttons:1,width:e.width,height:e.height,pressure:e.pressure
    });
    svg.dispatchEvent(proxy);

    // app.js captures the proxy pointer. Release immediately so a stationary
    // touch can still click the original node/text/edge, while move/up events
    // continue to bubble through SVG and drive the already-started pan.
    try{if(svg.hasPointerCapture?.(e.pointerId))svg.releasePointerCapture(e.pointerId);}catch{}
  },true);

  svg.addEventListener('pointermove',e=>{
    const p=bridged.get(e.pointerId);if(!p)return;
    if(!p.moved&&Math.hypot(e.clientX-p.x,e.clientY-p.y)>=PAN_THRESHOLD){
      p.moved=true;
      suppressClickUntil=Date.now()+400;
    }
    if(p.moved&&e.cancelable)e.preventDefault();
  },true);

  const finish=e=>{
    const p=bridged.get(e.pointerId);if(!p)return;
    if(p.moved)suppressClickUntil=Date.now()+400;
    bridged.delete(e.pointerId);
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
