import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GHOST_HEIGHT,HEAD_TURN_DISTANCE,GHOST_PATROL_BOUNDS,
  chooseRoadGhostCount,nextRoadPatrol,ghostOpacityAtHeight,createSpectralGhost
} from '../ghost.js';
let THREE;
try{THREE=await import('three');}catch{}

test('farmer stands at human height and ghostliness fades only near the feet',()=>{
  assert.ok(GHOST_HEIGHT>=1.75&&GHOST_HEIGHT<=2.1);
  assert.equal(HEAD_TURN_DISTANCE,12);
  assert.ok(ghostOpacityAtHeight(.08)<ghostOpacityAtHeight(.50));
  assert.ok(ghostOpacityAtHeight(.50)>0.65);
  assert.equal(ghostOpacityAtHeight(1,0),0);
});

test('exactly one or two road travellers are selected per scene',()=>{
  assert.equal(chooseRoadGhostCount(()=>0),1);
  assert.equal(chooseRoadGhostCount(()=>.499),1);
  assert.equal(chooseRoadGhostCount(()=>.5),2);
  assert.equal(chooseRoadGhostCount(()=>1),2);
  assert.throws(()=>chooseRoadGhostCount(()=>Number.NaN),RangeError);
});

test('road travellers float in BOTH directions and mirror at end limits',()=>{
  const {north,south}=GHOST_PATROL_BOUNDS;
  assert.ok(north<-100&&south>60);
  assert.equal(nextRoadPatrol(10,-1,1,1).z,9);
  assert.equal(nextRoadPatrol(10,1,1,1).z,11);
  const atSouth=nextRoadPatrol(south-.2,1,1,.5);
  const atNorth=nextRoadPatrol(north+.2,-1,1,.5);
  assert.equal(atSouth.direction,-1);
  assert.equal(atNorth.direction,1);
  assert.ok(Math.abs(atSouth.z-(south-.3))<1e-8);
  assert.ok(Math.abs(atNorth.z-(north+.3))<1e-8);
  let current={z:south-1,direction:1};
  for(let i=0;i<6000;i++){
    current=nextRoadPatrol(current.z,current.direction,.9,.1);
    assert.ok(current.z>=north-1e-9&&current.z<=south+1e-9);
  }
  assert.throws(()=>nextRoadPatrol(0,1,-1,1),RangeError);
});

test('rig has independently moving head and real deforming clothes',{
  skip:!THREE?'Install three for rig tests':false
},()=>{
  const old=globalThis.document;
  globalThis.document={createElement(tag){
    assert.equal(tag,'canvas');
    return {width:64,height:64,getContext(){
      return {createImageData(w,h){return {data:new Uint8ClampedArray(w*h*4)};},putImageData(){}};
    }};
  }};
  try{
    const fig=createSpectralGhost(THREE);
    assert.equal(fig.group.userData.ghostVersion,'0.8.0');
    assert.equal(fig.metadata.rigged,true);
    assert.equal(fig.metadata.headIndependent,true);
    assert.equal(fig.metadata.separateLegs,2);
    assert.ok(fig.skeleton instanceof THREE.Skeleton);
    assert.ok(fig.bones.length>=17);
    assert.ok(fig.meshes.length>=8);
    assert.equal(fig.head.isBone,true);
    const names=fig.bones.map(b=>b.name);
    for(const part of ['Ghost_Hips','Ghost_Spine','Ghost_Chest','Ghost_Neck','Ghost_Head',
      'Ghost_L_Elbow','Ghost_R_Elbow','Ghost_L_Knee','Ghost_R_Knee']){
      assert.ok(names.includes(part),part);
    }
    const headHat=fig.head.children.find(x=>x.name==='Wide brim plain farmer hat');
    assert.ok(headHat,'brimmed farm hat turns with head');
    let pants=0,coat=0;
    fig.group.traverse(obj=>{
      if(obj.name.includes('trouser leg'))pants++;
      if(obj.name.includes('fitted coat torso'))coat++;
    });
    assert.equal(pants,2);
    assert.equal(coat,1);
    for(const mesh of fig.meshes){
      assert.equal(mesh.isSkinnedMesh,true);
      assert.ok(mesh.skeleton.bones.length>=17);
      const positions=mesh.geometry.attributes.position.array;
      assert.ok([...positions].every(Number.isFinite));
      const weights=mesh.geometry.attributes.skinWeight.array;
      for(let i=0;i<weights.length;i+=4){
        assert.ok(Math.abs(weights[i]+weights[i+1]+weights[i+2]+weights[i+3]-1)<1e-5);
      }
    }
    fig.update(1,.8,.12,{dt:.5,distance:5,player:new THREE.Vector3(5,1.8,5),moving:true});
    assert.ok(fig.headTargetYaw>.2,'head should aim toward nearby player independently');
    assert.ok(fig.headYaw>.1,'head should actually turn, not merely set a target');
    const movingYaw=fig.headYaw;
    for(let i=0;i<50;i++)fig.update(i*.1,.8,.12,{
      dt:.1,distance:30,player:new THREE.Vector3(5,1.8,5)
    });
    assert.ok(Math.abs(fig.headYaw)<Math.abs(movingYaw)*.05,'head relaxes when player goes away');
    assert.ok(fig.materials.every(x=>x.userData.ghostState.fade===.8));
  }finally{globalThis.document=old;}
});

test('the ghost imports no third-party model and contains no procedural skirt',()=>{
  const s=createSpectralGhost.toString();
  assert.doesNotMatch(s,/GLTFLoader|cdn\.jsdelivr|vaporMaterial/);
  assert.match(s,/new THREE\.SkinnedMesh/);
  assert.match(s,/new THREE\.Skeleton/);
});
