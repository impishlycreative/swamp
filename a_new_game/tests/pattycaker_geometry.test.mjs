import test from 'node:test';
import assert from 'node:assert/strict';
import {makePattycaker} from '../pattycaker.js';

// Optional locally, required in CI; no browser or GPU is necessary.
let THREE;
try{THREE=await import('three');}catch{}
const smoke={skip:!THREE?'Install three@0.170.0 to run headless geometry checks':false};

test('the rig constructs and every weighted vertex is finite',smoke,()=>{
  const {group,skeleton,anatomy}=makePattycaker(THREE);
  assert.equal(group.userData.rig.walkingLimbs,6);
  assert.equal(group.userData.rig.fanArms,6);
  assert.equal(group.userData.rig.humanArms,2);
  assert.equal(group.userData.rig.fingerCount,70);
  assert.ok(skeleton.bones.length>=300);
  assert.equal(anatomy.isSkinnedMesh,true);
  const position=anatomy.geometry.attributes.position.array;
  const weights=anatomy.geometry.attributes.skinWeight.array;
  assert.ok(position.length>5000);
  assert.ok([...position].every(Number.isFinite));
  for(let i=0;i<weights.length;i+=4){
    assert.ok(Math.abs(weights[i]+weights[i+1]+weights[i+2]+weights[i+3]-1)<1e-4);
  }
  let openings=0;
  group.traverse(object=>{
    if(object.name.endsWith('_hollow_palm')){
      openings++;
      assert.equal(object.geometry.type,'ExtrudeGeometry');
      assert.equal(object.geometry.parameters.shapes.holes.length,2);
    }
  });
  assert.equal(openings,6);
  const cavities=[];
  group.traverse(object=>{
    if(object.name.endsWith('_mouth_cavity'))cavities.push(object);
  });
  assert.equal(cavities.length,6);
  for(const cavity of cavities)assert.ok(cavity.scale.y<.07,'mouth aperture stays smaller than the palm');

});

test('planted walking hands stay in place when the torso moves',smoke,()=>{
  const model=makePattycaker(THREE);
  model.group.visible=true;
  model.group.updateMatrixWorld(true);
  model.reset();
  model.animate(.10,'stalk',.016,new THREE.Vector3(0,1,10));
  const wrist=model.skeleton.bones.find(b=>b.name==='Walking_L_0_wrist');
  assert.ok(wrist,'walking wrist must exist');
  const a=wrist.getWorldPosition(new THREE.Vector3());
  model.group.position.z+=.12;
  model.animate(.12,'stalk',.016,new THREE.Vector3(0,1,10));
  const b=wrist.getWorldPosition(new THREE.Vector3());
  assert.ok(a.distanceTo(b)<.035,'planted wrist should not slide with the root');
});

test('all stalking and idle bones retain finite transforms',smoke,()=>{
  const model=makePattycaker(THREE);
  model.group.visible=true;
  for(let i=0;i<200;i++){
    const phase=i<125?'stalk':'linger';
    model.group.position.z=i*.006;
    model.animate(i/30,phase,1/30,new THREE.Vector3(1,1,8));
    for(const bone of model.skeleton.bones){
      const q=bone.quaternion;
      assert.ok([q.x,q.y,q.z,q.w,...bone.position].every(Number.isFinite));
    }
  }
});
