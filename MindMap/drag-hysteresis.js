(()=>{'use strict';

// Drag target hysteresis for MindMap.
// Once a dragged branch touches a possible new parent, keep that target
// magnetically latched for a short distance. The app's existing dotted
// reconnection preview therefore stretches as the pointer moves away and
// only snaps back to the original parent after the release threshold.

const originalElementsFromPoint=document.elementsFromPoint.bind(document);
const DESKTOP_RELEASE_PX=100;
const TOUCH_RELEASE_PX=125;

let dragPointerId=null;
let draggedNode=null;
let latchedNode=null;

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
},true);

document.addEventListener('pointermove',e=>{
  if(e.pointerId!==dragPointerId)return;

  const touched=nodeAtPoint(e.clientX,e.clientY);
  if(touched){
    latchedNode=touched;
    return;
  }

  if(latchedNode&&!stillWithinLatchZone(latchedNode,e.clientX,e.clientY)){
    latchedNode=null;
  }
},true);

function clearDrag(e){
  if(e.pointerId!==dragPointerId)return;
  dragPointerId=null;
  draggedNode=null;
  latchedNode=null;
}

document.addEventListener('pointerup',clearDrag,true);
document.addEventListener('pointercancel',clearDrag,true);

})();
