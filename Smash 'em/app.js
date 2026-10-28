(() => {
  'use strict';

  const canvas = document.getElementById('renderCanvas');
  const statusEl = document.getElementById('status');
  const swingBtn = document.getElementById('swingBtn');
  const resetBtn = document.getElementById('resetBtn');
  const movePad = document.getElementById('movePad');
  const lookPad = document.getElementById('lookPad');

  const engine = new BABYLON.Engine(canvas, true, {
    preserveDrawingBuffer: false,
    stencil: true,
    antialias: true,
    adaptToDeviceRatio: true
  });

  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color4(0.055, 0.065, 0.085, 1);
  scene.environmentIntensity = 0.75;
  scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
  scene.fogDensity = 0.014;
  scene.fogColor = new BABYLON.Color3(0.08, 0.09, 0.11);

  const camera = new BABYLON.ArcRotateCamera(
    'camera',
    -Math.PI / 2,
    1.12,
    7.2,
    new BABYLON.Vector3(0, 1.45, -2.3),
    scene
  );
  camera.lowerRadiusLimit = 4.2;
  camera.upperRadiusLimit = 9;
  camera.lowerBetaLimit = 0.62;
  camera.upperBetaLimit = 1.45;
  camera.wheelPrecision = 45;
  camera.panningSensibility = 0;
  camera.attachControl(canvas, true);
  camera.inputs.attached.pointers.buttons = [2];

  const hemi = new BABYLON.HemisphericLight('hemi', new BABYLON.Vector3(0.2, 1, -0.2), scene);
  hemi.intensity = 0.7;
  hemi.groundColor = new BABYLON.Color3(0.12, 0.12, 0.16);

  const keyLight = new BABYLON.DirectionalLight('key', new BABYLON.Vector3(-0.4, -1, 0.35), scene);
  keyLight.position = new BABYLON.Vector3(4, 8, -5);
  keyLight.intensity = 2.5;

  const fillLight = new BABYLON.PointLight('fill', new BABYLON.Vector3(-3.5, 2.8, -2), scene);
  fillLight.diffuse = new BABYLON.Color3(0.35, 0.5, 0.8);
  fillLight.intensity = 28;
  fillLight.range = 10;

  const warmLight = new BABYLON.PointLight('warm', new BABYLON.Vector3(3.2, 2.4, 2.5), scene);
  warmLight.diffuse = new BABYLON.Color3(1.0, 0.48, 0.22);
  warmLight.intensity = 24;
  warmLight.range = 9;

  function mat(name, color, roughness = 0.75, metallic = 0) {
    const m = new BABYLON.PBRMaterial(name, scene);
    m.albedoColor = color;
    m.roughness = roughness;
    m.metallic = metallic;
    return m;
  }

  const materials = {
    floor: mat('floorMat', new BABYLON.Color3(0.13, 0.14, 0.16), 0.93),
    wall: mat('wallMat', new BABYLON.Color3(0.42, 0.44, 0.46), 0.88),
    trim: mat('trimMat', new BABYLON.Color3(0.08, 0.09, 0.10), 0.62, 0.08),
    skin: mat('skinMat', new BABYLON.Color3(0.54, 0.33, 0.24), 0.78),
    shirt: mat('shirtMat', new BABYLON.Color3(0.08, 0.12, 0.18), 0.68),
    pants: mat('pantsMat', new BABYLON.Color3(0.05, 0.055, 0.07), 0.82),
    bat: mat('batMat', new BABYLON.Color3(0.28, 0.18, 0.08), 0.52),
    drywall: mat('drywallMat', new BABYLON.Color3(0.72, 0.70, 0.64), 0.96),
    wood: mat('woodMat', new BABYLON.Color3(0.34, 0.19, 0.08), 0.82),
    glass: mat('glassMat', new BABYLON.Color3(0.20, 0.52, 0.62), 0.16),
    brick: mat('brickMat', new BABYLON.Color3(0.42, 0.11, 0.06), 0.95),
    concrete: mat('concreteMat', new BABYLON.Color3(0.32, 0.34, 0.35), 0.99)
  };
  materials.glass.alpha = 0.38;
  materials.glass.transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_ALPHABLEND;

  const floor = BABYLON.MeshBuilder.CreateGround('floor', { width: 14, height: 16 }, scene);
  floor.material = materials.floor;
  floor.receiveShadows = true;

  function box(name, size, position, material) {
    const b = BABYLON.MeshBuilder.CreateBox(name, { width: size.x, height: size.y, depth: size.z }, scene);
    b.position.copyFrom(position);
    b.material = material;
    b.receiveShadows = true;
    return b;
  }

  box('leftWall', new BABYLON.Vector3(0.22, 4.2, 12), new BABYLON.Vector3(-5.7, 2.1, 1.0), materials.wall);
  box('rightWall', new BABYLON.Vector3(0.22, 4.2, 12), new BABYLON.Vector3(5.7, 2.1, 1.0), materials.wall);
  box('ceilingBeam', new BABYLON.Vector3(11.5, 0.22, 0.28), new BABYLON.Vector3(0, 3.95, 4.65), materials.trim);

  const stage = box('stage', new BABYLON.Vector3(11.0, 0.12, 1.1), new BABYLON.Vector3(0, 0.06, 4.25), materials.trim);
  stage.receiveShadows = true;

  const materialDefs = {
    drywall: { hp: 2, label: 'Drywall', dust: new BABYLON.Color3(0.76, 0.73, 0.66) },
    wood: { hp: 3, label: 'Wood', dust: new BABYLON.Color3(0.42, 0.24, 0.10) },
    glass: { hp: 1, label: 'Glass', dust: new BABYLON.Color3(0.35, 0.68, 0.78) },
    brick: { hp: 4, label: 'Brick', dust: new BABYLON.Color3(0.48, 0.14, 0.08) },
    concrete: { hp: 6, label: 'Concrete', dust: new BABYLON.Color3(0.42, 0.44, 0.45) }
  };

  const damageStateKey = 'smash-em-damage-v1';
  let savedDamage = {};
  try { savedDamage = JSON.parse(localStorage.getItem(damageStateKey) || '{}'); } catch { savedDamage = {}; }

  const destructibles = [];
  const columns = ['drywall', 'wood', 'glass', 'brick', 'concrete'];
  const rows = 6;
  const colsPerType = 3;
  const cellW = 0.62;
  const cellH = 0.58;
  const depth = 0.26;
  const totalCols = columns.length * colsPerType;
  const startX = -(totalCols * cellW) / 2 + cellW / 2;

  function persistDamage() {
    const out = {};
    for (const mesh of destructibles) {
      if (!mesh || mesh.isDisposed()) continue;
      if (mesh.metadata.hp !== mesh.metadata.maxHp) out[mesh.metadata.id] = mesh.metadata.hp;
    }
    localStorage.setItem(damageStateKey, JSON.stringify(out));
  }

  for (let c = 0; c < totalCols; c++) {
    const kind = columns[Math.floor(c / colsPerType)];
    const def = materialDefs[kind];
    for (let r = 0; r < rows; r++) {
      const id = `${kind}-${c}-${r}`;
      if (savedDamage[id] === 0) continue;
      const mesh = BABYLON.MeshBuilder.CreateBox(id, { width: cellW - 0.018, height: cellH - 0.018, depth }, scene);
      mesh.position.set(startX + c * cellW, 0.45 + r * cellH, 4.12);
      mesh.material = materials[kind];
      mesh.metadata = {
        destructible: true,
        id,
        kind,
        maxHp: def.hp,
        hp: typeof savedDamage[id] === 'number' ? savedDamage[id] : def.hp,
        baseColor: materials[kind].albedoColor.clone()
      };
      if (mesh.metadata.hp < mesh.metadata.maxHp) {
        const damageRatio = 1 - mesh.metadata.hp / mesh.metadata.maxHp;
        mesh.scaling.z = 1 - damageRatio * 0.35;
      }
      destructibles.push(mesh);
    }
  }

  const player = new BABYLON.TransformNode('player', scene);
  player.position.set(0, 0, -2.9);
  let playerYaw = 0;

  function bodyPart(name, options, pos, material, parent = player) {
    const mesh = options.diameter
      ? BABYLON.MeshBuilder.CreateSphere(name, { diameter: options.diameter, segments: 16 }, scene)
      : BABYLON.MeshBuilder.CreateCapsule(name, { height: options.height, radius: options.radius, tessellation: 16 }, scene);
    mesh.position.copyFrom(pos);
    mesh.material = material;
    mesh.parent = parent;
    return mesh;
  }

  bodyPart('torso', { height: 1.08, radius: 0.27 }, new BABYLON.Vector3(0, 1.33, 0), materials.shirt);
  bodyPart('head', { diameter: 0.43 }, new BABYLON.Vector3(0, 2.07, 0), materials.skin);
  bodyPart('leftLeg', { height: 0.95, radius: 0.11 }, new BABYLON.Vector3(-0.13, 0.55, 0), materials.pants);
  bodyPart('rightLeg', { height: 0.95, radius: 0.11 }, new BABYLON.Vector3(0.13, 0.55, 0), materials.pants);
  bodyPart('leftArm', { height: 0.88, radius: 0.095 }, new BABYLON.Vector3(-0.38, 1.42, 0.02), materials.skin);

  const swingPivot = new BABYLON.TransformNode('swingPivot', scene);
  swingPivot.parent = player;
  swingPivot.position.set(0.36, 1.72, 0.02);
  const rightArm = bodyPart('rightArm', { height: 0.9, radius: 0.1 }, new BABYLON.Vector3(0, -0.30, 0), materials.skin, swingPivot);
  rightArm.rotation.z = -0.32;

  const bat = BABYLON.MeshBuilder.CreateCylinder('bat', { height: 1.18, diameterTop: 0.11, diameterBottom: 0.075, tessellation: 20 }, scene);
  bat.material = materials.bat;
  bat.parent = swingPivot;
  bat.position.set(0.22, -0.50, 0.02);
  bat.rotation.z = -0.76;

  const shadowGenerator = new BABYLON.ShadowGenerator(1024, keyLight);
  shadowGenerator.useBlurExponentialShadowMap = true;
  shadowGenerator.blurKernel = 24;
  [player, ...player.getChildMeshes()].forEach(m => { if (m.getClassName && m.getClassName() !== 'TransformNode') shadowGenerator.addShadowCaster(m); });

  const keys = new Set();
  window.addEventListener('keydown', e => {
    keys.add(e.code);
    if (e.code === 'Space') { e.preventDefault(); swing(); }
    if (e.code === 'KeyR') resetDamage();
  });
  window.addEventListener('keyup', e => keys.delete(e.code));

  canvas.addEventListener('contextmenu', e => e.preventDefault());
  canvas.addEventListener('pointerdown', e => {
    if (e.button === 0 && e.pointerType !== 'touch') swing();
  });

  let moving = false;
  let swingActive = false;
  let swingTime = 0;
  let impactDone = false;
  const swingDuration = 0.48;
  const debris = [];

  function setStatus(text) {
    statusEl.textContent = text;
    clearTimeout(setStatus._t);
    setStatus._t = setTimeout(() => statusEl.textContent = 'Ready', 1200);
  }

  function forwardFromYaw(yaw) {
    return new BABYLON.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
  }

  function playImpact(kind, broken) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!playImpact.ctx) playImpact.ctx = new AC();
    const ctx = playImpact.ctx;
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(kind === 'glass' ? 0.12 : 0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (broken ? 0.32 : 0.18));

    const osc = ctx.createOscillator();
    osc.type = kind === 'glass' ? 'triangle' : kind === 'wood' ? 'sine' : 'square';
    const freq = { drywall: 120, wood: 95, glass: 820, brick: 78, concrete: 64 }[kind] || 110;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq * 0.65), now + 0.16);
    osc.connect(gain);
    osc.start(now);
    osc.stop(now + 0.18);

    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.22), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = kind === 'glass' ? 'highpass' : 'lowpass';
    filter.frequency.value = kind === 'glass' ? 1200 : kind === 'drywall' ? 900 : 500;
    noise.connect(filter);
    filter.connect(gain);
    noise.start(now);
  }

  function spawnDebris(mesh, amount, broken) {
    const kind = mesh.metadata.kind;
    const def = materialDefs[kind];
    const count = Math.min(amount, matchMedia('(pointer:coarse)').matches ? 10 : 24);
    for (let i = 0; i < count; i++) {
      const d = BABYLON.MeshBuilder.CreateBox('debris', {
        size: 0.06 + Math.random() * (broken ? 0.10 : 0.045)
      }, scene);
      d.material = mat(`debris-${kind}-${Math.random()}`, def.dust.scale(0.65 + Math.random() * 0.35), 0.95);
      d.position.copyFrom(mesh.getAbsolutePosition());
      d.position.x += (Math.random() - 0.5) * 0.42;
      d.position.y += (Math.random() - 0.5) * 0.40;
      d.position.z -= 0.15 + Math.random() * 0.18;
      const away = forwardFromYaw(playerYaw).scale(1.4 + Math.random() * 1.7);
      d.metadata = {
        velocity: new BABYLON.Vector3(
          away.x + (Math.random() - 0.5) * 1.3,
          1.1 + Math.random() * 2.3,
          away.z + (Math.random() - 0.5) * 1.3
        ),
        life: 1.2 + Math.random() * 1.1
      };
      debris.push(d);
    }
  }

  function damageTarget(mesh) {
    if (!mesh || mesh.isDisposed() || !mesh.metadata?.destructible) return;
    const md = mesh.metadata;
    md.hp -= 1;
    const broken = md.hp <= 0;
    playImpact(md.kind, broken);
    spawnDebris(mesh, broken ? 18 : 7, broken);

    if (broken) {
      setStatus(`${materialDefs[md.kind].label}: broken through`);
      savedDamage[md.id] = 0;
      mesh.dispose();
    } else {
      const ratio = 1 - md.hp / md.maxHp;
      mesh.scaling.z = 1 - ratio * 0.4;
      mesh.rotation.z += (Math.random() - 0.5) * 0.035;
      mesh.position.z += 0.018;
      setStatus(`${materialDefs[md.kind].label}: ${md.hp}/${md.maxHp} integrity`);
      savedDamage[md.id] = md.hp;
    }
    persistDamage();
  }

  function doImpact() {
    const origin = player.position.add(new BABYLON.Vector3(0, 1.45, 0));
    const dir = forwardFromYaw(playerYaw).normalize();
    const ray = new BABYLON.Ray(origin, dir, 3.15);
    const pick = scene.pickWithRay(ray, m => !!m.metadata?.destructible);
    if (pick?.hit && pick.pickedMesh) {
      damageTarget(pick.pickedMesh);
    } else {
      playImpact('wood', false);
      setStatus('Swing — no contact');
    }
  }

  function swing() {
    if (swingActive) return;
    swingActive = true;
    swingTime = 0;
    impactDone = false;
  }

  function resetDamage() {
    localStorage.removeItem(damageStateKey);
    location.reload();
  }

  swingBtn?.addEventListener('pointerdown', e => { e.preventDefault(); swing(); });
  resetBtn?.addEventListener('pointerdown', e => { e.preventDefault(); resetDamage(); });

  const moveTouch = { active: false, id: null, startX: 0, startY: 0, x: 0, y: 0 };
  const lookTouch = { active: false, id: null, lastX: 0, lastY: 0 };

  function bindPad(el, state, type) {
    if (!el) return;
    el.addEventListener('pointerdown', e => {
      state.active = true;
      state.id = e.pointerId;
      el.setPointerCapture(e.pointerId);
      if (type === 'move') {
        state.startX = state.x = e.clientX;
        state.startY = state.y = e.clientY;
      } else {
        state.lastX = e.clientX;
        state.lastY = e.clientY;
      }
    });
    el.addEventListener('pointermove', e => {
      if (!state.active || e.pointerId !== state.id) return;
      if (type === 'move') {
        state.x = e.clientX;
        state.y = e.clientY;
      } else {
        const dx = e.clientX - state.lastX;
        const dy = e.clientY - state.lastY;
        camera.alpha -= dx * 0.008;
        camera.beta = BABYLON.Scalar.Clamp(camera.beta + dy * 0.006, 0.65, 1.42);
        state.lastX = e.clientX;
        state.lastY = e.clientY;
      }
    });
    const end = e => {
      if (e.pointerId !== state.id) return;
      state.active = false;
      state.id = null;
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
  }
  bindPad(movePad, moveTouch, 'move');
  bindPad(lookPad, lookTouch, 'look');

  function movementVector() {
    let x = 0, z = 0;
    if (keys.has('KeyW') || keys.has('ArrowUp')) z += 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) z -= 1;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) x -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) x += 1;

    if (moveTouch.active) {
      x += BABYLON.Scalar.Clamp((moveTouch.x - moveTouch.startX) / 45, -1, 1);
      z += BABYLON.Scalar.Clamp((moveTouch.startY - moveTouch.y) / 45, -1, 1);
    }

    const v = new BABYLON.Vector3(x, 0, z);
    return v.lengthSquared() > 1 ? v.normalize() : v;
  }

  scene.onBeforeRenderObservable.add(() => {
    const dt = Math.min(engine.getDeltaTime() / 1000, 0.033);

    const input = movementVector();
    moving = input.lengthSquared() > 0.002;
    if (moving) {
      const cameraForward = camera.target.subtract(camera.position);
      cameraForward.y = 0;
      cameraForward.normalize();
      const cameraRight = BABYLON.Vector3.Cross(BABYLON.Axis.Y, cameraForward).normalize();
      const move = cameraForward.scale(input.z).add(cameraRight.scale(input.x));
      if (move.lengthSquared() > 0.001) {
        move.normalize();
        player.position.addInPlace(move.scale(2.45 * dt));
        player.position.x = BABYLON.Scalar.Clamp(player.position.x, -4.8, 4.8);
        player.position.z = BABYLON.Scalar.Clamp(player.position.z, -5.4, 2.3);
        playerYaw = Math.atan2(move.x, move.z);
        player.rotation.y = playerYaw;
      }
    }

    camera.target = BABYLON.Vector3.Lerp(camera.target, player.position.add(new BABYLON.Vector3(0, 1.35, 0)), 0.14);

    if (swingActive) {
      swingTime += dt;
      const t = BABYLON.Scalar.Clamp(swingTime / swingDuration, 0, 1);
      const eased = 0.5 - 0.5 * Math.cos(t * Math.PI * 2);
      swingPivot.rotation.y = -1.15 + eased * 2.45;
      swingPivot.rotation.x = 0.22 - Math.sin(t * Math.PI) * 0.35;
      if (!impactDone && t >= 0.48) {
        impactDone = true;
        doImpact();
      }
      if (t >= 1) {
        swingActive = false;
        swingPivot.rotation.y = 0;
        swingPivot.rotation.x = 0;
      }
    }

    for (let i = debris.length - 1; i >= 0; i--) {
      const d = debris[i];
      if (!d || d.isDisposed()) { debris.splice(i, 1); continue; }
      d.metadata.life -= dt;
      d.metadata.velocity.y -= 5.8 * dt;
      d.position.addInPlace(d.metadata.velocity.scale(dt));
      d.rotation.x += 2.3 * dt;
      d.rotation.z += 1.7 * dt;
      if (d.position.y < 0.05) {
        d.position.y = 0.05;
        d.metadata.velocity.y *= -0.28;
        d.metadata.velocity.x *= 0.78;
        d.metadata.velocity.z *= 0.78;
      }
      if (d.metadata.life <= 0) {
        d.dispose();
        debris.splice(i, 1);
      }
    }
  });

  setStatus('Ready — smash the wall');

  engine.runRenderLoop(() => scene.render());
  window.addEventListener('resize', () => engine.resize());
})();
