import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join,dirname} from 'node:path';
import {ROAD_HALF_WIDTH,CRICKET_QUIET_RADIUS,CRICKET_RECOVERY_SECONDS,terrainAt,cricketPresence,cricketAttenuation} from '../gameplay.js';

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
