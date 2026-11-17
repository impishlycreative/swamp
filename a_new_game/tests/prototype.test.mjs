import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join,dirname} from 'node:path';
import {ROAD_HALF_WIDTH,CRICKET_QUIET_RADIUS,CRICKET_RECOVERY_SECONDS,terrainAt,cricketPresence,cricketAttenuation,TOWN_EDGE_Z,WALK_SPEED,RUN_SPEED,STAMINA_MAX,MIN_RUN_STAMINA,canStartRun,staminaStep,classifyTap} from '../gameplay.js';

const folder=join(dirname(fileURLToPath(import.meta.url)),'..');

test('road and long grass share the exact audio surface boundary',()=>{
  assert.equal(terrainAt(0),'dirt');
  assert.equal(terrainAt(ROAD_HALF_WIDTH),'dirt');
  assert.equal(terrainAt(-ROAD_HALF_WIDTH),'dirt');
  assert.equal(terrainAt(ROAD_HALF_WIDTH+.01),'grass');
  assert.equal(terrainAt(-ROAD_HALF_WIDTH-.01),'grass');
});

test('nearby crickets are quiet as soon as the walker is within range',()=>{
  const state=cricketPresence(CRICKET_QUIET_RADIUS-.01,10,0);
  assert.equal(state.audible,false);
  assert.ok(Math.abs(state.holdUntil-(10+CRICKET_RECOVERY_SECONDS))<1e-9);
});

test('crickets stay quiet for 1.55 seconds after the player leaves',()=>{
  const near=cricketPresence(1,10,0);
  const leaving=cricketPresence(8,11,near.holdUntil);
  assert.equal(leaving.audible,false);
  assert.equal(cricketPresence(8,near.holdUntil-.01,leaving.holdUntil).audible,false);
  assert.equal(cricketPresence(8,near.holdUntil,leaving.holdUntil).audible,true);
});

test('staying close extends silence, but undisturbed distant crickets still sing',()=>{
  const first=cricketPresence(2,10);
  const second=cricketPresence(2,11,first.holdUntil);
  assert.ok(second.holdUntil>first.holdUntil);
  assert.equal(cricketPresence(30,11,0).audible,true);
});

test('individual cricket sources attenuate naturally with distance',()=>{
  assert.equal(cricketAttenuation(0),1);
  assert.ok(cricketAttenuation(5)>cricketAttenuation(25));
  assert.ok(cricketAttenuation(25)>cricketAttenuation(60));
});

test('bad cricket readings fail clearly',()=>{
  assert.throws(()=>cricketPresence(NaN,0),RangeError);
  assert.throws(()=>cricketPresence(1,Infinity),RangeError);
});

test('browser scene uses the tested rules and key gameplay features',()=>{
  const js=readFileSync(join(folder,'main.js'),'utf8');
  const html=readFileSync(join(folder,'index.html'),'utf8');
  assert.match(js,/cricketPresence\(dist,t,c\.holdUntil\)/);
  assert.match(js,/footstep\(terrainAt\(camera\.position\.x\)==='grass'\)/);
  assert.match(js,/grassMat\.onBeforeCompile/);
  assert.match(js,/grassBrushGain/);
  assert.match(js,/requestAnimationFrame\(animate\)/);
  assert.match(js,/requestPointerLock/);
  assert.match(js,/touchstart/);
  assert.match(html,/<canvas id="game"/);
  assert.match(html,/<button id="lantern"/);
});

test('running drains stamina and resumes walking after exhaustion',()=>{
 assert.equal(RUN_SPEED,2*WALK_SPEED);
 assert.equal(STAMINA_MAX,100);
 const depleted=staminaStep(100,true,true,8);
 assert.equal(depleted.stamina,0);
 assert.equal(depleted.running,false);
 assert.equal(staminaStep(0,false,true,12).stamina,100);
 assert.equal(staminaStep(0,false,false,12).stamina,100);
 assert.equal(staminaStep(40,true,false,3).stamina,65);
 assert.equal(canStartRun(MIN_RUN_STAMINA-.1),false);
 assert.equal(canStartRun(MIN_RUN_STAMINA),true);
 assert.throws(()=>staminaStep(NaN,true,true,1),RangeError);
});
test('double-tap requires proximity and timing',()=>{
 const first=classifyTap(null,1000,100,100);
 assert.equal(first.double,false);
 assert.equal(classifyTap(first.previous,1250,120,110).double,true);
 assert.equal(classifyTap(first.previous,1390,120,110).double,false);
 assert.equal(classifyTap(first.previous,1250,160,100).double,false);
});
test('run controls, town boundary and test UI are present',()=>{
 const js=readFileSync(join(folder,'main.js'),'utf8');
 const html=readFileSync(join(folder,'index.html'),'utf8');
 assert.equal(TOWN_EDGE_Z,-147.5);
 assert.match(js,/clamp\(oldz\+dz,TOWN_EDGE_Z,79\)/);
 assert.match(js,/goToPixel\(x,y,tap.double\)/);
 assert.match(js,/runToDestination=run && canStartRun\(stamina\)/);
 assert.match(js,/pattycakerEncounter\.show\(started,true\)/);
 assert.match(js,/pattycakerEncounter\.tick\(dt,t,started\)/);
 assert.match(html,/id="staminaTrack"/);
 assert.match(html,/id="testGhost"/);
 assert.match(html,/id="testPatty"/);
});

test('Pattycaker encounter is connected to game, model and test UI',()=>{
 const js=readFileSync(join(folder,'main.js'),'utf8');
 const encounter=readFileSync(join(folder,'pattycaker_encounter.js'),'utf8');
 const model=readFileSync(join(folder,'pattycaker.js'),'utf8');
 const html=readFileSync(join(folder,'index.html'),'utf8');
 assert.match(js,/createPattycakerEncounter/);
 assert.match(encounter,/townEdge\+43/);
 assert.match(encounter,/phase='cover'/);
 assert.match(encounter,/phase='stalk'/);
 assert.match(encounter,/phase='linger'/);
 assert.match(model,/const walkLegs=\[\]/);
 assert.match(model,/const fanArms=\[\]/);
 assert.match(html,/id="testPatty"/);
});
