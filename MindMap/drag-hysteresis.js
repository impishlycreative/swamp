(()=>{'use strict';

// Drag target hysteresis for MindMap.
// Once a dragged branch touches a possible new parent, keep that target
// magnetically latched for a short distance. The app's existing dotted
// reconnection preview therefore stretches as the pointer moves away and
// only snaps back to the original parent after the release threshold.

const originalElementsFromPoint=document.elementsFromPoint.bind(document);
const DESKTOP_RELEASE_PX=100;
const TOUCH_RELEASE_PX=125;
const CLICK_MOVE_PX=8;
const CLICK_RECOVERY_MS=320;

let dragPointerId=null;
let draggedNode=null;
let latchedNode=null;
const clickPointers=new Map();

function isTouchLike(){
  return matchMedia('(hover:none) and (pointer:coarse)').matches||navigator.maxTouchPoints>0;
}

function releaseDistance(){
  return isTouchLike()?TOUCH_RELEASE_PX:DESKTOP_RELEASE_PX;
}

function distanceOutsideRect(x,y,rect){
  const dx=x<rect.left?rect.left-x:x>rect.right?x-rect.right:0;
  const dy=y<rect.top?rect.top-y:y>rect.bottom?y-rect.bottom:0;
  return Math.hypot(dx,dy);
}

function nodeAtPoint(x,y){
  for(const el of originalElementsFromPoint(x,y)){
    const node=el.closest?.('.node');
    // Ignore the branch being dragged. app.js marks every member of that
    // branch with branch-dragging as soon as the drag becomes active.
    if(node&&node!==draggedNode&&!node.classList.contains('branch-dragging'))return node;
  }
  return null;
}

function stillWithinLatchZone(node,x,y){
  if(!node?.isConnected)return false;
  return distanceOutsideRect(x,y,node.getBoundingClientRect())<=releaseDistance();
}

// app.js asks document.elementsFromPoint() which node is under the pointer.
// While a destination is latched, inject it into that hit-test result until
// the pointer has moved far enough away. app.js still performs its own
// validity checks, so self/descendant drops remain blocked.
document.elementsFromPoint=function(x,y){
  const result=originalElementsFromPoint(x,y);
  if(
    dragPointerId!==null&&
    latchedNode&&
    stillWithinLatchZone(latchedNode,x,y)&&
    !result.includes(latchedNode)
  ){
    return [latchedNode,...result];
  }
  return result;
};

document.addEventListener('pointerdown',e=>{
  const node=e.target.closest?.('.node');
  if(!node||e.target.tagName?.toLowerCase()==='text')return;

  dragPointerId=e.pointerId;
  draggedNode=node;
  latchedNode=null;

  // app.js starts a possible drag on every non-root node. Track stationary
  // presses separately so we can recover the normal click that its drag
  // cleanup currently suppresses.
  if(!node.classList.contains('root')){
    clickPointers.set(e.pointerId,{
      id:node.dataset.id,
      x:e.clientX,
      y:e.clientY,
      moved:false
    });
  }
},true);

document.addEventListener('pointermove',e=>{
  if(e.pointerId===dragPointerId){
    const touched=nodeAtPoint(e.clientX,e.clientY);
    if(touched){
      latchedNode=touched;
    }else if(latchedNode&&!stillWithinLatchZone(latchedNode,e.clientX,e.clientY)){
      latchedNode=null;
    }
  }

  const click=clickPointers.get(e.pointerId);
  if(click&&!click.moved&&Math.hypot(e.clientX-click.x,e.clientY-click.y)>=CLICK_MOVE_PX){
    click.moved=true;
  }
},true);

function recoverStationaryClick(e){
  const click=clickPointers.get(e.pointerId);
  if(!click)return;
  clickPointers.delete(e.pointerId);
  if(click.moved)return;

  // app.js sets a 300 ms suppression window even when no drag occurred.
  // Once that window has expired, send the click only if the node still did
  // not become selected through the browser's native click path.
  setTimeout(()=>{
    const node=Array.from(document.querySelectorAll('#nodes .node'))
      .find(el=>el.dataset.id===click.id);
    if(!node||node.classList.contains('selected'))return;
    node.dispatchEvent(new MouseEvent('click',{
      bubbles:true,
      cancelable:true,
      view:window,
      detail:1
    }));
  },CLICK_RECOVERY_MS);
}

function clearDrag(e){
  if(e.pointerId!==dragPointerId)return;
  dragPointerId=null;
  draggedNode=null;
  latchedNode=null;
}

document.addEventListener('pointerup',e=>{
  recoverStationaryClick(e);
  clearDrag(e);
},true);

document.addEventListener('pointercancel',e=>{
  clickPointers.delete(e.pointerId);
  clearDrag(e);
},true);

})();
