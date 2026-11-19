import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join,dirname} from 'node:path';
import {solveTwoBone,gaitPhase,swingProgress} from '../pattycaker_kinematics.js';

const length=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
const root=join(dirname(fileURLToPath(import.meta.url)),'..');

test('two-bone IK respects both actual bone lengths and the world wrist target',()=>{
  const shoulder=[0,1,0],target=[.7,.3,.2],pole=[1,1,1];
  const result=solveTwoBone(shoulder,target,.7,.8,pole);
  assert.equal(result.reachable,true);
  assert.ok(length(result.elbow,shoulder)-.7<1e-6);
  assert.ok(Math.abs(length(result.elbow,shoulder)-.7)<1e-6);
  assert.ok(Math.abs(length(result.elbow,result.wrist)-.8)<1e-6);
  assert.ok(length(result.wrist,target)<1e-6);
});

test('unreachable wrist limits extension instead of stretching mesh geometry',()=>{
  const s=[0,1,0],t=[3,0,0],result=solveTwoBone(s,t,.7,.8,[1,2,0]);
  assert.equal(result.reachable,false);
  assert.ok(length(result.wrist,s)<1.500001);
  assert.ok(Math.abs(length(result.elbow,s)-.7)<1e-6);
  assert.ok(Math.abs(length(result.elbow,result.wrist)-.8)<1e-6);
});

test('collinear knee pole is handled without NaNs or broken knees',()=>{
  const solution=solveTwoBone([0,1,0],[0,0,0],.7,.7,[0,2,0]);
  assert.ok([...solution.elbow,...solution.wrist].every(Number.isFinite));
  assert.ok(Math.abs(length(solution.elbow,[0,1,0])-.7)<1e-6);
  assert.throws(()=>solveTwoBone([0,0,0],[1,0,0],0,.4,[0,1,0]),RangeError);
  assert.throws(()=>solveTwoBone([0,0,0],[1,0,0],.5,NaN,[0,1,0]),RangeError);
});

test('alternating pairs and three levels produce staggered movement',()=>{
  for(const side of [-1,1])for(let level=0;level<3;level++){
    const p=gaitPhase(12,level,side);
    assert.ok(p>=0&&p<1);
    const other=gaitPhase(12,level,-side);
    assert.ok(Math.abs(((other-p+1)%1)-.5)<1e-7);
  }
});

test('swing progresses smoothly from 0 to 1 and planted stance never lifts',()=>{
  assert.deepEqual(swingProgress(.2),{swing:false,progress:0,lift:0});
  assert.deepEqual(swingProgress(.62),{swing:true,progress:0,lift:0});
  assert.ok(swingProgress(.8).lift>.9);
  assert.ok(swingProgress(.999).progress>.99);
  assert.throws(()=>swingProgress(.5,1),RangeError);
});

test('scene integrates weighted anatomical joints and six grounded hand-feet',()=>{
  const model=readFileSync(join(root,'pattycaker.js'),'utf8');
  const encounter=readFileSync(join(root,'pattycaker_encounter.js'),'utf8');
  assert.match(model,/solveTwoBone\(/);
  assert.match(model,/root\.worldToLocal\(V\(wristTarget\.x,/);
  assert.match(model,/aimBone\(leg\.shoulder,leg\.elbow,/);
  assert.match(model,/aimBone\(leg\.elbow,leg\.wrist,/);
  assert.match(model,/const end=joint\(label\+'_finger_'\+i\+'_end'/);
  assert.match(model,/new THREE\.ExtrudeGeometry\(contour/);
  assert.match(model,/contour\.holes\.push\(p\)/);
  assert.match(model,/eyeballPivot/);
  assert.match(model,/f\.gaze\.position\.set/);
  assert.match(model,/f\.jaw\.position\.y/);
  assert.match(model,/Math\.pow\(Math\.max\(0,Math\.sin\(t\*\.71\+seed\)\),26\)/);
  assert.match(encounter,/facing\.lookAt\([\s\S]*group\.quaternion\.slerp\([\s\S]*patty\.animate\(t,phase,dt,camera\.position,age\)/);
  assert.match(model,/palmEyes:6,palmMouths:6/);
});
