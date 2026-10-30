(()=>{'use strict';
  const isMobile=()=>matchMedia('(max-width:850px),(hover:none) and (pointer:coarse)').matches||(navigator.maxTouchPoints>0&&Math.min(screen.width,screen.height)<900);
  const svg=document.getElementById('svg');
  if(!svg)return;

  // Mobile layout and toolbars are owned by toolbar-system.css/js.
  // This module handles map touch gestures only.
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
