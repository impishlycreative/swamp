import {
  VoxelWorld,
  VoxelChunk16,
  MortonKey,
  VoxelIndex,
  VoxelSmoothGeometry
} from 'https://cdn.jsdelivr.net/npm/@astrumforge/bvx-kit@2.0.0/out/index.js';

const B = window.BABYLON;
const canvas = document.getElementById('renderCanvas');
const statusEl = document.getElementById('status');
const swingBtn = document.getElementById('swingBtn');
const resetBtn = document.getElementById('resetBtn');
const movePad = document.getElementById('movePad');
const lookPad = document.getElementById('lookPad');

const engine = new B.Engine(canvas, true, { antialias: true, adaptToDeviceRatio: true, stencil: true });
const scene = new B.Scene(engine);
scene.clearColor = new B.Color4(0.035, 0.045, 0.06, 1);
scene.fogMode = B.Scene.FOGMODE_EXP2;
scene.fogDensity = 0.008;
scene.fogColor = new B.Color3(0.055, 0.065, 0.085);

const camera = new B.ArcRotateCamera('camera', -Math.PI / 2, 1.12, 8.4, new B.Vector3(0, 1.4, -1.5), scene);
camera.lowerRadiusLimit = 5.5;
camera.upperRadiusLimit = 10.5;
camera.lowerBetaLimit = 0.72;
camera.upperBetaLimit = 1.42;
camera.panningSensibility = 0;
camera.wheelPrecision = 55;
camera.attachControl(canvas, true);
if (camera.inputs.attached.pointers) camera.inputs.attached.pointers.buttons = [2];

const hemi = new B.HemisphericLight('hemi', new B.Vector3(0.2, 1, -0.25), scene);
hemi.intensity = 0.65;
hemi.groundColor = new B.Color3(0.09, 0.10, 0.13);
const key = new B.DirectionalLight('key', new B.Vector3(-0.45, -1, 0.35), scene);
key.position = new B.Vector3(5, 9, -6);
key.intensity = 2.8;
const warm = new B.PointLight('warm', new B.Vector3(4.5, 2.6, 1.2), scene);
warm.diffuse = new B.Color3(1.0, 0.48, 0.22);
warm.intensity = 22;
warm.range = 12;
const cool = new B.PointLight('cool', new B.Vector3(-4.0, 3.1, -1.5), scene);
cool.diffuse = new B.Color3(0.28, 0.48, 1.0);
cool.intensity = 18;
cool.range = 12;

function pbr(name, color, roughness = 0.8, metallic = 0) {
  const m = new B.PBRMaterial(name, scene);
  m.albedoColor = color;
  m.roughness = roughness;
  m.metallic = metallic;
  return m;
}

const floorMat = pbr('floorMat', new B.Color3(0.11, 0.12, 0.14), 0.95);
const trimMat = pbr('trimMat', new B.Color3(0.055, 0.06, 0.07), 0.55, 0.12);
const skinMat = pbr('skinMat', new B.Color3(0.52, 0.31, 0.22), 0.78);
const shirtMat = pbr('shirtMat', new B.Color3(0.055, 0.09, 0.15), 0.7);
const pantsMat = pbr('pantsMat', new B.Color3(0.035, 0.04, 0.055), 0.84);
const batMat = pbr('batMat', new B.Color3(0.34, 0.20, 0.07), 0.5);
const voxelMat = pbr('voxelMat', new B.Color3(1, 1, 1), 0.86);
voxelMat.useVertexColors = true;

const floor = B.MeshBuilder.CreateGround('floor', { width: 16, height: 18 }, scene);
floor.material = floorMat;
floor.receiveShadows = true;

function box(name, w, h, d, x, y, z, material) {
  const m = B.MeshBuilder.CreateBox(name, { width: w, height: h, depth: d }, scene);
  m.position.set(x, y, z);
  m.material = material;
  m.receiveShadows = true;
  return m;
}
box('leftWall', 0.2, 4.3, 13, -6.7, 2.15, 0.8, trimMat);
box('rightWall', 0.2, 4.3, 13, 6.7, 2.15, 0.8, trimMat);
box('header', 13.5, 0.22, 0.35, 0, 4.05, 4.15, trimMat);

const materialBands = [
  { kind: 'drywall', label: 'Drywall', rgb: [0.78, 0.75, 0.68], radius: 2.9, freq: 135 },
  { kind: 'wood', label: 'Wood', rgb: [0.42, 0.22, 0.075], radius: 2.25, freq: 98 },
  { kind: 'glass', label: 'Glass', rgb: [0.20, 0.62, 0.72], radius: 3.5, freq: 880 },
  { kind: 'brick', label: 'Brick', rgb: [0.49, 0.12, 0.055], radius: 1.7, freq: 76 },
  { kind: 'concrete', label: 'Concrete', rgb: [0.38, 0.40, 0.42], radius: 1.25, freq: 62 }
];
function bandForGX(gx) {
  const i = Math.max(0, Math.min(materialBands.length - 1, Math.floor((gx / 48) * materialBands.length)));
  return materialBands[i];
}

const WORLD_ORIGIN = new B.Vector3(-6, 0, 3.9);
const CHUNKS_X = 3;
const world = new VoxelWorld();
const chunks = [];
const smoothers = [];
const chunkMeshes = [];

for (let cx = 0; cx < CHUNKS_X; cx++) {
  const chunk = new VoxelChunk16(MortonKey.from(cx, 0, 0));
  world.insert(chunk);
  chunks.push(chunk);
  smoothers.push(new VoxelSmoothGeometry());
  chunkMeshes.push(null);
}

const damageKey = 'smash-em-bvx-damage-v2';
let removed = [];
try { removed = JSON.parse(localStorage.getItem(damageKey) || '[]'); } catch { removed = []; }
const removedSet = new Set(removed);

function localIndex(lx, ly, lz) {
  return VoxelIndex.from(
    Math.floor(lx / 4), Math.floor(ly / 4), Math.floor(lz / 4),
    lx & 3, ly & 3, lz & 3
  );
}

function setGlobalBit(gx, gy, gz, on) {
  if (gx < 0 || gx >= 48 || gy < 0 || gy >= 16 || gz < 0 || gz >= 4) return false;
  const cx = Math.floor(gx / 16);
  const lx = gx - cx * 16;
  const idx = localIndex(lx, gy, gz);
  if (on) chunks[cx].setBitVoxel(idx); else chunks[cx].unsetBitVoxel(idx);
  return true;
}

for (let gx = 0; gx < 48; gx++) {
  for (let gy = 0; gy < 16; gy++) {
    for (let gz = 0; gz < 4; gz++) setGlobalBit(gx, gy, gz, true);
  }
}
for (const token of removedSet) {
  const [gx, gy, gz] = token.split(',').map(Number);
  setGlobalBit(gx, gy, gz, false);
}

function persistDamage() {
  localStorage.setItem(damageKey, JSON.stringify([...removedSet]));
}

function colorsForChunk(cx, positions) {
  const colors = new Float32Array((positions.length / 3) * 4);
  for (let i = 0, ci = 0; i < positions.length; i += 3, ci += 4) {
    const gxFloat = (cx * 4 + positions[i]) / 0.25;
    const band = bandForGX(Math.floor(gxFloat));
    const shade = 0.86 + Math.min(0.14, Math.max(-0.10, positions[i + 1] * 0.018));
    colors[ci] = band.rgb[0] * shade;
    colors[ci + 1] = band.rgb[1] * shade;
    colors[ci + 2] = band.rgb[2] * shade;
    colors[ci + 3] = band.kind === 'glass' ? 0.72 : 1;
  }
  return colors;
}

function remeshChunk(cx) {
  const smooth = smoothers[cx];
  smooth.computeGeometry(chunks[cx], world, 1, false);
  if (chunkMeshes[cx]) {
    chunkMeshes[cx].dispose(false, true);
    chunkMeshes[cx] = null;
  }
  if (!smooth.indexCount) return;
  const mesh = new B.Mesh(`bvx-${cx}`, scene);
  const vd = new B.VertexData();
  vd.positions = new Float32Array(smooth.vertices);
  vd.normals = new Float32Array(smooth.normals);
  vd.indices = new Uint32Array(smooth.indices);
  vd.colors = colorsForChunk(cx, vd.positions);
  vd.applyToMesh(mesh, true);
  mesh.position.set(WORLD_ORIGIN.x + cx * 4, WORLD_ORIGIN.y, WORLD_ORIGIN.z);
  mesh.material = voxelMat;
  mesh.receiveShadows = true;
  mesh.isPickable = true;
  mesh.metadata = { voxelChunk: cx };
  chunkMeshes[cx] = mesh;
}
function remeshAll() { for (let cx = 0; cx < CHUNKS_X; cx++) remeshChunk(cx); }
remeshAll();

const player = new B.TransformNode('player', scene);
player.position.set(0, 0, -2.7);
let playerYaw = 0;
function capsule(name, height, radius, pos, material, parent = player) {
  const m = B.MeshBuilder.CreateCapsule(name, { height, radius, tessellation: 18 }, scene);
  m.position.copyFrom(pos); m.material = material; m.parent = parent; return m;
}
capsule('torso', 1.05, 0.27, new B.Vector3(0, 1.32, 0), shirtMat);
const head = B.MeshBuilder.CreateSphere('head', { diameter: 0.44, segments: 18 }, scene);
head.position.set(0, 2.06, 0); head.material = skinMat; head.parent = player;
capsule('leftLeg', 0.95, 0.11, new B.Vector3(-0.13, 0.55, 0), pantsMat);
capsule('rightLeg', 0.95, 0.11, new B.Vector3(0.13, 0.55, 0), pantsMat);
capsule('leftArm', 0.86, 0.095, new B.Vector3(-0.37, 1.43, 0), skinMat);
const swingPivot = new B.TransformNode('swingPivot', scene);
swingPivot.parent = player; swingPivot.position.set(0.35, 1.72, 0);
const rightArm = capsule('rightArm', 0.9, 0.10, new B.Vector3(0, -0.31, 0), skinMat, swingPivot);
rightArm.rotation.z = -0.28;
const bat = B.MeshBuilder.CreateCylinder('bat', { height: 1.25, diameterTop: 0.115, diameterBottom: 0.072, tessellation: 20 }, scene);
bat.material = batMat; bat.parent = swingPivot; bat.position.set(0.22, -0.52, 0); bat.rotation.z = -0.78;

const shadows = new B.ShadowGenerator(matchMedia('(pointer:coarse)').matches ? 512 : 1024, key);
shadows.useBlurExponentialShadowMap = true;
shadows.blurKernel = matchMedia('(pointer:coarse)').matches ? 12 : 24;
for (const m of player.getChildMeshes()) shadows.addShadowCaster(m);

const keys = new Set();
window.addEventListener('keydown', e => { keys.add(e.code); if (e.code === 'Space') { e.preventDefault(); swing(); } if (e.code === 'KeyR') resetWorld(); });
window.addEventListener('keyup', e => keys.delete(e.code));
canvas.addEventListener('contextmenu', e => e.preventDefault());
canvas.addEventListener('pointerdown', e => { if (e.button === 0 && e.pointerType !== 'touch') swing(); });
function setStatus(text) { statusEl.textContent = text; clearTimeout(setStatus._timer); setStatus._timer = setTimeout(() => { statusEl.textContent = 'BVX smooth voxels'; }, 1300); }
statusEl.textContent = 'BVX smooth voxels';

function playImpact(band, brokenCount) {
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  if (!playImpact.ctx) playImpact.ctx = new AC(); const ctx = playImpact.ctx; if (ctx.state === 'suspended') ctx.resume();
  const now = ctx.currentTime; const gain = ctx.createGain(); gain.connect(ctx.destination);
  gain.gain.setValueAtTime(band.kind === 'glass' ? 0.11 : 0.18, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
  const osc = ctx.createOscillator(); osc.type = band.kind === 'glass' ? 'triangle' : band.kind === 'wood' ? 'sine' : 'square';
  osc.frequency.setValueAtTime(band.freq, now); osc.frequency.exponentialRampToValueAtTime(Math.max(45, band.freq * 0.62), now + 0.18);
  osc.connect(gain); osc.start(now); osc.stop(now + 0.2);
  if (brokenCount > 10) {
    const noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.18), ctx.sampleRate); const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = ctx.createBufferSource(); src.buffer = noiseBuffer; const filter = ctx.createBiquadFilter();
    filter.type = band.kind === 'glass' ? 'highpass' : 'lowpass'; filter.frequency.value = band.kind === 'glass' ? 1500 : 700;
    src.connect(filter); filter.connect(gain); src.start(now);
  }
}

const debris = [];
function spawnDebris(point, band, count) {
  const max = matchMedia('(pointer:coarse)').matches ? 10 : 22;
  for (let i = 0; i < Math.min(count, max); i++) {
    const d = B.MeshBuilder.CreatePolyhedron('chip', { type: 1, size: 0.06 + Math.random() * 0.09 }, scene);
    const dm = pbr(`chipMat-${Math.random()}`, new B.Color3(...band.rgb), 0.96); d.material = dm; d.position.copyFrom(point);
    d.position.addInPlace(new B.Vector3((Math.random()-0.5)*0.4, (Math.random()-0.5)*0.35, (Math.random()-0.5)*0.2));
    debris.push({ mesh: d, vel: new B.Vector3((Math.random()-0.5)*2.2, 1.0+Math.random()*2.5, -0.4-Math.random()*1.6), life: 0.8+Math.random()*0.8 });
  }
}
function worldPointToGrid(point) { const p = point.subtract(WORLD_ORIGIN); return { gx: Math.floor(p.x / 0.25), gy: Math.floor(p.y / 0.25), gz: Math.floor(p.z / 0.25) }; }
function carveSphere(gx, gy, gz, radius) {
  let count = 0; const r2 = radius * radius;
  for (let x = Math.floor(gx-radius); x <= Math.ceil(gx+radius); x++) for (let y = Math.floor(gy-radius); y <= Math.ceil(gy+radius); y++) for (let z = Math.floor(gz-radius); z <= Math.ceil(gz+radius); z++) {
    const dx=x-gx, dy=y-gy, dz=z-gz; if (dx*dx + dy*dy + dz*dz > r2 * (0.78 + Math.random()*0.28)) continue;
    if (x<0||x>=48||y<0||y>=16||z<0||z>=4) continue; const token = `${x},${y},${z}`; if (removedSet.has(token)) continue;
    setGlobalBit(x,y,z,false); removedSet.add(token); count++;
  }
  if (count) persistDamage(); return count;
}

let swingActive = false, swingTime = 0, impactDone = false; const swingDuration = 0.5;
function swing() { if (swingActive) return; swingActive = true; swingTime = 0; impactDone = false; }
function tryImpact() {
  const origin = player.position.add(new B.Vector3(0, 1.35, 0)); const dir = new B.Vector3(Math.sin(playerYaw), 0.02, Math.cos(playerYaw)).normalize();
  const hit = scene.pickWithRay(new B.Ray(origin, dir, 2.25), m => !!m.metadata?.voxelChunk);
  if (!hit?.hit || !hit.pickedPoint) { setStatus('Swing — no contact'); return; }
  const grid = worldPointToGrid(hit.pickedPoint); const band = bandForGX(grid.gx);
  const count = carveSphere(grid.gx, grid.gy, Math.max(0, Math.min(3, grid.gz)), band.radius);
  if (count) { remeshAll(); spawnDebris(hit.pickedPoint, band, Math.max(5, Math.floor(count * 0.5))); playImpact(band, count); setStatus(`${band.label}: ${count} BitVoxels removed`); }
  else setStatus(`${band.label}: already broken here`);
}
function resetWorld() { localStorage.removeItem(damageKey); location.reload(); }
if (swingBtn) swingBtn.addEventListener('pointerdown', e => { e.preventDefault(); swing(); });
if (resetBtn) resetBtn.addEventListener('pointerdown', e => { e.preventDefault(); resetWorld(); });

const touch = { mx: 0, my: 0, lookX: 0 };
function setupPad(el, kind) {
  if (!el) return; let id = null, sx = 0, sy = 0;
  el.addEventListener('pointerdown', e => { id=e.pointerId; sx=e.clientX; sy=e.clientY; el.setPointerCapture(id); });
  el.addEventListener('pointermove', e => { if (e.pointerId !== id) return; const dx = Math.max(-50, Math.min(50, e.clientX-sx))/50; const dy = Math.max(-50, Math.min(50, e.clientY-sy))/50; if (kind === 'move') { touch.mx=dx; touch.my=-dy; } else touch.lookX = dx; });
  const end = e => { if (e.pointerId!==id) return; id=null; if(kind==='move'){touch.mx=0;touch.my=0;}else touch.lookX=0; };
  el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
}
setupPad(movePad,'move'); setupPad(lookPad,'look');

let walkT = 0;
engine.runRenderLoop(() => {
  const dt = Math.min(0.033, engine.getDeltaTime()/1000); let mx = 0, mz = 0;
  if (keys.has('KeyA')) mx -= 1; if (keys.has('KeyD')) mx += 1; if (keys.has('KeyW')) mz += 1; if (keys.has('KeyS')) mz -= 1;
  mx += touch.mx; mz += touch.my; if (touch.lookX) playerYaw += touch.lookX * dt * 1.8;
  const mag = Math.hypot(mx,mz);
  if (mag > 0.05) {
    mx/=Math.max(1,mag); mz/=Math.max(1,mag); const speed = 2.45; player.position.x += mx*speed*dt; player.position.z += mz*speed*dt;
    player.position.x = Math.max(-5.7, Math.min(5.7, player.position.x)); player.position.z = Math.max(-5.5, Math.min(3.15, player.position.z)); playerYaw = Math.atan2(mx, mz); walkT += dt*9;
    const legs = player.getChildMeshes().filter(m=>m.name==='leftLeg'||m.name==='rightLeg'); if (legs.length===2) { legs[0].rotation.x=Math.sin(walkT)*0.28; legs[1].rotation.x=-Math.sin(walkT)*0.28; }
  }
  player.rotation.y = playerYaw;
  if (swingActive) {
    swingTime += dt; const t = Math.min(1, swingTime/swingDuration); const phase = Math.sin(t*Math.PI);
    swingPivot.rotation.x = -0.45*phase; swingPivot.rotation.y = 1.55*phase; swingPivot.rotation.z = -0.85*phase;
    if (!impactDone && t > 0.44) { impactDone=true; tryImpact(); }
    if (t>=1) { swingActive=false; swingPivot.rotation.set(0,0,0); }
  }
  for (let i=debris.length-1;i>=0;i--) {
    const d=debris[i]; d.life-=dt; d.vel.y-=7.5*dt; d.mesh.position.addInPlace(d.vel.scale(dt)); d.mesh.rotation.x+=dt*5; d.mesh.rotation.z+=dt*3;
    if (d.mesh.position.y<0.04) { d.mesh.position.y=0.04; d.vel.y*=-0.25; d.vel.x*=0.82; d.vel.z*=0.82; }
    if (d.life<=0) { d.mesh.material?.dispose(); d.mesh.dispose(); debris.splice(i,1); }
  }
  camera.target.copyFrom(player.position.add(new B.Vector3(0,1.35,0.25))); scene.render();
});
window.addEventListener('resize', ()=>engine.resize());
setStatus('BVX smooth wall ready');
