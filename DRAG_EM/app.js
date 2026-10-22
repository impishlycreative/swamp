(() => {
  'use strict';

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d', { alpha: false });
  const hudPrimary = document.getElementById('hud-primary');
  const hudSecondary = document.getElementById('hud-secondary');
  const objective = document.getElementById('objective');
  const message = document.getElementById('message');
  const joystick = document.getElementById('joystick');
  const stickKnob = document.getElementById('stick-knob');
  const laserBtn = document.getElementById('laser-btn');
  const grappleBtn = document.getElementById('grapple-btn');
  const pushBtn = document.getElementById('push-btn');
  const reelInBtn = document.getElementById('reel-in-btn');
  const reelOutBtn = document.getElementById('reel-out-btn');
  const specialBtn = document.getElementById('special-btn');
  const restartBtn = document.getElementById('restart-btn');

  const TAU = Math.PI * 2;
  let W = innerWidth;
  let H = innerHeight;
  let DPR = 1;
  let last = performance.now();
  let messageTimer = 0;

  const buildRequirements = {
    fluxRing: 3,
    gravCore: 2,
    capacitor: 4,
    cryoPump: 2,
    phaseCPU: 1
  };

  const labels = {
    fluxRing: 'Flux Ring',
    gravCore: 'Gravitic Core',
    capacitor: 'Supercapacitor',
    cryoPump: 'Cryo Pump',
    phaseCPU: 'Phase Computer',
    exoticCell: 'Exotic Cell'
  };

  const state = {
    score: 0,
    wave: 1,
    kills: 0,
    slingBuilt: false,
    slingCharges: 0,
    planetUnlocked: false,
    win: false,
    inv: { fluxRing: 0, gravCore: 0, capacitor: 0, cryoPump: 0, phaseCPU: 0, exoticCell: 0 },
    stars: [],
    asteroids: [],
    enemies: [],
    lasers: [],
    salvage: [],
    particles: [],
    planet: null
  };

  const ship = {
    x: W * 0.38,
    y: H * 0.54,
    vx: 0,
    vy: 0,
    a: 0,
    r: 13,
    hp: 100,
    grapple: null,
    tether: 135,
    laserCd: 0,
    pushCd: 0
  };

  const beacon = { x: W * 0.5, y: H * 0.5, r: 30 };
  const input = { moveX: 0, moveY: 0, laser: false, reelIn: false, reelOut: false };
  const keyState = new Set();
  let joystickPointer = null;

  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  function resize() {
    DPR = Math.min(devicePixelRatio || 1, 2);
    W = Math.max(320, innerWidth);
    H = Math.max(240, innerHeight);
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    beacon.x = W * 0.5;
    beacon.y = H * 0.47;
    if (state.planet && !state.planet.disrupted) {
      state.planet.x = W * 0.78;
      state.planet.y = H * 0.43;
      state.planet.r = clamp(Math.min(W, H) * 0.16, 66, 104);
    }
  }

  addEventListener('resize', resize);
  addEventListener('orientationchange', () => setTimeout(resize, 180));
  resize();

  function wrap(o, pad = 65) {
    if (o.x < -pad) o.x = W + pad;
    else if (o.x > W + pad) o.x = -pad;
    if (o.y < -pad) o.y = H + pad;
    else if (o.y > H + pad) o.y = -pad;
  }

  function say(text, seconds = 2.2) {
    message.textContent = text;
    message.classList.add('show');
    messageTimer = seconds;
  }

  function burst(x, y, count = 22, speed = 170, hot = false) {
    const room = Math.max(0, 320 - state.particles.length);
    count = Math.min(count, room);
    for (let i = 0; i < count; i++) {
      const a = rand(0, TAU);
      const v = rand(25, speed);
      state.particles.push({
        x, y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        life: rand(0.28, 1.05),
        max: 1.05,
        hot
      });
    }
  }

  function initialiseStars() {
    const count = clamp(Math.round((W * H) / 6500), 75, 150);
    state.stars = Array.from({ length: count }, () => ({
      x: Math.random(),
      y: Math.random(),
      z: rand(0.25, 1)
    }));
  }

  function spawnAsteroid() {
    const edge = Math.floor(rand(0, 4));
    let x, y;
    if (edge === 0) { x = -35; y = rand(35, H - 35); }
    else if (edge === 1) { x = W + 35; y = rand(35, H - 35); }
    else if (edge === 2) { x = rand(35, W - 35); y = -35; }
    else { x = rand(35, W - 35); y = H + 35; }

    const r = rand(17, 35);
    state.asteroids.push({
      x, y,
      vx: rand(-34, 34),
      vy: rand(-34, 34),
      r,
      mass: r * r * 0.13,
      spin: rand(-0.8, 0.8),
      rot: rand(0, TAU),
      rel: false,
      dead: false
    });
  }

  function spawnEnemy(type = 'cruiser') {
    const side = Math.random() < 0.5 ? -1 : 1;
    const x = side < 0 ? -80 : W + 80;
    const y = rand(70, Math.max(90, H - 90));
    if (type === 'station') {
      state.enemies.push({ type, x, y, vx: -side * 10, vy: rand(-5, 5), r: 45, hp: 560, max: 560, score: 1700, dead: false });
    } else {
      state.enemies.push({ type: 'cruiser', x, y, vx: -side * rand(20, 40), vy: rand(-11, 11), r: 28, hp: 250, max: 250, score: 720, dead: false });
    }
  }

  function spawnPlanet() {
    const r = clamp(Math.min(W, H) * 0.16, 66, 104);
    state.planet = {
      x: W * 0.78,
      y: H * 0.43,
      r,
      hp: 2500,
      max: 2500,
      damage: 0,
      disrupted: false,
      marks: []
    };
    state.planetUnlocked = true;
    say('PLANETARY TARGET ACQUIRED — build the Sling Array for decisive force', 4.2);
  }

  function reset() {
    state.score = 0;
    state.wave = 1;
    state.kills = 0;
    state.slingBuilt = false;
    state.slingCharges = 0;
    state.planetUnlocked = false;
    state.win = false;
    state.planet = null;
    state.inv = { fluxRing: 0, gravCore: 0, capacitor: 0, cryoPump: 0, phaseCPU: 0, exoticCell: 0 };
    state.asteroids = [];
    state.enemies = [];
    state.lasers = [];
    state.salvage = [];
    state.particles = [];
    Object.assign(ship, {
      x: W * 0.38,
      y: H * 0.54,
      vx: 0,
      vy: 0,
      a: 0,
      hp: 100,
      grapple: null,
      tether: 135,
      laserCd: 0,
      pushCd: 0
    });
    for (let i = 0; i < 9; i++) spawnAsteroid();
    spawnEnemy('cruiser');
    spawnEnemy('cruiser');
    spawnEnemy('station');
    say('DRAG_EM — move with the left stick; make the asteroid field your weapon', 4);
  }

  initialiseStars();
  reset();

  function nearestAsteroid(maxDistance = 245) {
    let best = null;
    let bestDistance = maxDistance;
    for (const a of state.asteroids) {
      if (a.dead || a.rel) continue;
      const d = distance(ship, a);
      if (d < bestDistance) {
        best = a;
        bestDistance = d;
      }
    }
    return best;
  }

  function grappleAsteroid(target = null) {
    if (ship.grapple) {
      ship.grapple = null;
      say('Grapple released');
      return;
    }
    const a = target || nearestAsteroid();
    if (!a) {
      say('No asteroid in grapple range');
      return;
    }
    if (distance(ship, a) > 265) {
      say('Move closer to grapple that asteroid');
      return;
    }
    ship.grapple = a;
    ship.tether = clamp(distance(ship, a), 75, 225);
    say('Asteroid tethered — move around it to drag and sling');
  }

  function pushAsteroid() {
    if (ship.pushCd > 0) return;
    const a = nearestAsteroid(185);
    if (!a) {
      say('No asteroid in push range', 1.2);
      return;
    }
    ship.pushCd = 1.1;
    const dx = a.x - ship.x;
    const dy = a.y - ship.y;
    const d = Math.max(1, Math.hypot(dx, dy));
    const force = 15500 / Math.max(110, a.mass);
    a.vx += (dx / d) * force;
    a.vy += (dy / d) * force;
    ship.vx -= (dx / d) * 10;
    ship.vy -= (dy / d) * 10;
    burst(a.x, a.y, 12, 105);
    say('Gravitic push', 0.8);
  }

  function canBuild() {
    return Object.entries(buildRequirements).every(([key, amount]) => state.inv[key] >= amount);
  }

  function atBeacon() {
    return distance(ship, beacon) < 105;
  }

  function buildSling() {
    if (state.slingBuilt) {
      fireRelativistic();
      return;
    }
    if (!atBeacon()) {
      say('Bring the ship to the fabrication beacon to build the Sling Array');
      return;
    }
    if (!canBuild()) {
      say('Sling Array incomplete — destroy heavy targets with asteroids for rare parts');
      return;
    }
    for (const [key, amount] of Object.entries(buildRequirements)) state.inv[key] -= amount;
    state.slingBuilt = true;
    burst(beacon.x, beacon.y, 55, 240, true);
    say('RELATIVISTIC SLING ARRAY ONLINE — Exotic Cells now charge shots', 4);
  }

  function loadCharges() {
    if (!state.slingBuilt) return;
    while (state.inv.exoticCell >= 3) {
      state.inv.exoticCell -= 3;
      state.slingCharges++;
    }
  }

  function fireRelativistic() {
    loadCharges();
    if (!state.slingBuilt) {
      buildSling();
      return;
    }
    if (state.slingCharges < 1) {
      say('Need 3 Exotic Cells for a relativistic shot');
      return;
    }
    if (!ship.grapple) {
      say('Grapple an asteroid first');
      return;
    }

    const a = ship.grapple;
    ship.grapple = null;
    state.slingCharges--;
    const speed = 2050;
    a.rel = true;
    a.vx = Math.cos(ship.a) * speed;
    a.vy = Math.sin(ship.a) * speed;
    burst(a.x, a.y, 70, 340, true);
    say('RELATIVISTIC RELEASE — simulated 0.33c', 3.2);
  }

  function shootLaser() {
    if (ship.laserCd > 0 || ship.hp <= 0) return;
    ship.laserCd = 0.17;
    const speed = 590;
    state.lasers.push({
      x: ship.x + Math.cos(ship.a) * 19,
      y: ship.y + Math.sin(ship.a) * 19,
      vx: ship.vx + Math.cos(ship.a) * speed,
      vy: ship.vy + Math.sin(ship.a) * speed,
      life: 1.05
    });
  }

  function dropSalvage(enemy, asteroidKill) {
    const count = enemy.type === 'station' ? 7 : 3;
    const basic = ['fluxRing', 'gravCore', 'capacitor', 'cryoPump'];
    for (let i = 0; i < count; i++) {
      let type;
      if (enemy.type === 'station' && asteroidKill && Math.random() < 0.18) type = 'phaseCPU';
      else type = basic[Math.floor(rand(0, basic.length))];
      if (!asteroidKill && Math.random() < 0.7) type = 'capacitor';
      if (enemy.type === 'station' && asteroidKill && Math.random() < 0.3) type = 'exoticCell';
      state.salvage.push({
        x: enemy.x + rand(-22, 22),
        y: enemy.y + rand(-22, 22),
        vx: rand(-30, 30),
        vy: rand(-30, 30),
        r: 7,
        type,
        dead: false
      });
    }
    if (enemy.type === 'station' && asteroidKill) {
      state.salvage.push({ x: enemy.x, y: enemy.y, vx: 18, vy: -12, r: 7, type: 'exoticCell', dead: false });
    }
  }

  function damageEnemy(enemy, amount, asteroidKill = false) {
    enemy.hp -= amount;
    if (enemy.hp > 0 || enemy.dead) return;
    enemy.dead = true;
    state.score += enemy.score;
    state.kills++;
    dropSalvage(enemy, asteroidKill);
    burst(enemy.x, enemy.y, 48, 270, true);

    if (state.kills % 3 === 0) {
      state.wave++;
      spawnEnemy('station');
      spawnEnemy('cruiser');
    }
    if (state.wave >= 4 && !state.planetUnlocked) spawnPlanet();
  }

  function hitPlanet(a) {
    const p = state.planet;
    if (!p || p.disrupted) return;

    if (a.rel) {
      p.hp = 0;
      p.damage = 3;
      p.disrupted = true;
      state.win = true;
      state.score += 25000;
      burst(p.x, p.y, 180, 540, true);
      say('PLANETARY DISRUPTION — target reduced to expanding debris', 7);
    } else {
      const power = Math.max(130, Math.hypot(a.vx, a.vy) * a.mass * 0.012);
      p.hp -= power;
      p.damage = clamp(p.damage + 1, 0, 2);
      p.marks.push({ x: rand(-p.r * 0.45, p.r * 0.45), y: rand(-p.r * 0.4, p.r * 0.4), r: rand(8, 18) });
      burst(a.x, a.y, 60, 310, true);
      say('Planetary impact — atmosphere, oceans, coastlines and crust destabilized', 3.4);
      if (p.hp <= 0) {
        p.damage = 2;
        state.score += 8000;
        say('Surface biosphere devastated — deep refuges may remain', 5);
      }
    }
    a.dead = true;
  }

  function setButtonHold(button, key) {
    const down = (e) => {
      e.preventDefault();
      button.setPointerCapture?.(e.pointerId);
      input[key] = true;
      button.classList.add('active');
    };
    const up = (e) => {
      e.preventDefault();
      input[key] = false;
      button.classList.remove('active');
    };
    button.addEventListener('pointerdown', down);
    button.addEventListener('pointerup', up);
    button.addEventListener('pointercancel', up);
    button.addEventListener('lostpointercapture', up);
  }

  setButtonHold(laserBtn, 'laser');
  setButtonHold(reelInBtn, 'reelIn');
  setButtonHold(reelOutBtn, 'reelOut');

  grappleBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); grappleAsteroid(); });
  pushBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); pushAsteroid(); });
  specialBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); state.slingBuilt ? fireRelativistic() : buildSling(); });
  restartBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); reset(); });

  function updateJoystickFromEvent(e) {
    const rect = joystick.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxRadius = rect.width * 0.32;
    let dx = e.clientX - cx;
    let dy = e.clientY - cy;
    const d = Math.hypot(dx, dy);
    if (d > maxRadius) {
      dx = dx / d * maxRadius;
      dy = dy / d * maxRadius;
    }
    input.moveX = dx / maxRadius;
    input.moveY = dy / maxRadius;
    stickKnob.style.transform = `translate(${dx}px, ${dy}px)`;
  }

  joystick.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (joystickPointer !== null) return;
    joystickPointer = e.pointerId;
    joystick.setPointerCapture(e.pointerId);
    joystick.classList.add('active');
    updateJoystickFromEvent(e);
  });

  joystick.addEventListener('pointermove', (e) => {
    if (e.pointerId !== joystickPointer) return;
    e.preventDefault();
    updateJoystickFromEvent(e);
  });

  function releaseJoystick(e) {
    if (e.pointerId !== joystickPointer) return;
    joystickPointer = null;
    input.moveX = 0;
    input.moveY = 0;
    stickKnob.style.transform = 'translate(0px, 0px)';
    joystick.classList.remove('active');
  }

  joystick.addEventListener('pointerup', releaseJoystick);
  joystick.addEventListener('pointercancel', releaseJoystick);
  joystick.addEventListener('lostpointercapture', releaseJoystick);

  canvas.addEventListener('pointerup', (e) => {
    if (e.pointerType !== 'touch' && e.pointerType !== 'pen') return;
    let best = null;
    let bestDistance = 44;
    for (const a of state.asteroids) {
      if (a.dead || a.rel) continue;
      const d = Math.hypot(e.clientX - a.x, e.clientY - a.y) - a.r;
      if (d < bestDistance) {
        best = a;
        bestDistance = d;
      }
    }
    if (best) grappleAsteroid(best);
  });

  addEventListener('keydown', (e) => {
    keyState.add(e.code);
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    if (e.repeat) return;
    if (e.code === 'KeyG') grappleAsteroid();
    if (e.code === 'KeyP') pushAsteroid();
    if (e.code === 'KeyB') buildSling();
    if (e.code === 'KeyX') fireRelativistic();
    if (e.code === 'KeyN') reset();
  });
  addEventListener('keyup', (e) => keyState.delete(e.code));

  function applyShipInput(dt) {
    let mx = input.moveX;
    let my = input.moveY;

    if (keyState.has('KeyA') || keyState.has('ArrowLeft')) mx -= 1;
    if (keyState.has('KeyD') || keyState.has('ArrowRight')) mx += 1;
    if (keyState.has('KeyW') || keyState.has('ArrowUp')) my -= 1;
    if (keyState.has('KeyS') || keyState.has('ArrowDown')) my += 1;

    const mag = Math.min(1, Math.hypot(mx, my));
    if (mag > 0.06) {
      mx /= Math.max(1, Math.hypot(mx, my));
      my /= Math.max(1, Math.hypot(mx, my));
      const thrust = 205 * mag;
      ship.vx += mx * thrust * dt;
      ship.vy += my * thrust * dt;
      ship.a = Math.atan2(my, mx);
    }

    const speed = Math.hypot(ship.vx, ship.vy);
    const maxSpeed = 285;
    if (speed > maxSpeed) {
      ship.vx *= maxSpeed / speed;
      ship.vy *= maxSpeed / speed;
    }

    ship.vx *= Math.pow(0.993, dt * 60);
    ship.vy *= Math.pow(0.993, dt * 60);
    ship.x += ship.vx * dt;
    ship.y += ship.vy * dt;
    wrap(ship);

    if (input.laser || keyState.has('Space')) shootLaser();
    if (ship.grapple) {
      if (input.reelIn || keyState.has('KeyR')) ship.tether = Math.max(58, ship.tether - 75 * dt);
      if (input.reelOut || keyState.has('KeyF')) ship.tether = Math.min(260, ship.tether + 75 * dt);
    }
  }

  function update(dt) {
    if (messageTimer > 0) {
      messageTimer -= dt;
      if (messageTimer <= 0) message.classList.remove('show');
    }

    ship.laserCd = Math.max(0, ship.laserCd - dt);
    ship.pushCd = Math.max(0, ship.pushCd - dt);
    applyShipInput(dt);

    for (const a of state.asteroids) {
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      a.rot += a.spin * dt;
      if (!a.rel) wrap(a);
      else if (a.x < -350 || a.x > W + 350 || a.y < -350 || a.y > H + 350) a.dead = true;
    }

    if (ship.grapple && !ship.grapple.dead) {
      const a = ship.grapple;
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const d = Math.max(1, Math.hypot(dx, dy));
      const stretch = d - ship.tether;
      const nx = dx / d;
      const ny = dy / d;
      const spring = stretch * 0.76;
      a.vx -= nx * spring * dt * (110 / a.mass);
      a.vy -= ny * spring * dt * (110 / a.mass);
      ship.vx += nx * spring * dt * 0.13;
      ship.vy += ny * spring * dt * 0.13;
    } else {
      ship.grapple = null;
    }

    for (const l of state.lasers) {
      l.x += l.vx * dt;
      l.y += l.vy * dt;
      l.life -= dt;
    }

    for (const e of state.enemies) {
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      wrap(e, 90);
    }

    for (const s of state.salvage) {
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vx *= 0.995;
      s.vy *= 0.995;
      wrap(s);
      if (distance(ship, s) < 38) {
        state.inv[s.type]++;
        s.dead = true;
        say('Recovered ' + labels[s.type], 1.05);
      }
    }

    for (const p of state.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.983;
      p.vy *= 0.983;
      p.life -= dt;
    }

    for (const l of state.lasers) {
      for (const e of state.enemies) {
        if (!e.dead && Math.hypot(l.x - e.x, l.y - e.y) < e.r) {
          damageEnemy(e, 20, false);
          l.life = 0;
          break;
        }
      }
      if (state.planet && !state.planet.disrupted && Math.hypot(l.x - state.planet.x, l.y - state.planet.y) < state.planet.r) {
        state.planet.hp -= 2;
        l.life = 0;
      }
    }

    for (const a of state.asteroids) {
      if (a.dead) continue;
      for (const e of state.enemies) {
        if (e.dead) continue;
        const d = Math.hypot(a.x - e.x, a.y - e.y);
        if (d < a.r + e.r) {
          const speed = Math.hypot(a.vx, a.vy);
          const damage = a.rel ? 99999 : Math.max(48, speed * a.mass * 0.018);
          damageEnemy(e, damage, true);
          const nx = (a.x - e.x) / (d || 1);
          const ny = (a.y - e.y) / (d || 1);
          a.vx += nx * 76;
          a.vy += ny * 76;
          e.vx -= nx * 11;
          e.vy -= ny * 11;
          burst(a.x, a.y, a.rel ? 72 : 20, a.rel ? 430 : 165, a.rel);
          if (a.rel) a.dead = true;
        }
      }
      if (state.planet && !a.dead && Math.hypot(a.x - state.planet.x, a.y - state.planet.y) < a.r + state.planet.r) hitPlanet(a);
    }

    for (const e of state.enemies) {
      if (!e.dead && Math.hypot(ship.x - e.x, ship.y - e.y) < ship.r + e.r) ship.hp -= 24 * dt;
    }

    if (ship.hp <= 0) {
      ship.hp = 0;
      say('SHIP LOST — tap RESTART', 999);
    }

    state.lasers = state.lasers.filter((x) => x.life > 0);
    state.enemies = state.enemies.filter((x) => !x.dead);
    state.salvage = state.salvage.filter((x) => !x.dead);
    state.asteroids = state.asteroids.filter((x) => !x.dead);
    state.particles = state.particles.filter((x) => x.life > 0);

    while (state.asteroids.length < 8) spawnAsteroid();
    while (state.enemies.length < Math.min(5, 2 + state.wave) && !state.win) {
      spawnEnemy(Math.random() < 0.25 ? 'station' : 'cruiser');
    }

    loadCharges();
  }

  function drawAsteroid(a) {
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(a.rot);
    ctx.beginPath();
    for (let i = 0; i < 9; i++) {
      const ang = i / 9 * TAU;
      const rr = a.r * (0.76 + 0.22 * Math.sin(i * 2.17 + 3));
      const x = Math.cos(ang) * rr;
      const y = Math.sin(ang) * rr;
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = a.rel ? '#fff0b8' : '#36393b';
    ctx.strokeStyle = a === ship.grapple ? '#70f2ff' : (a.rel ? '#ffffff' : '#969b9d');
    ctx.lineWidth = a === ship.grapple ? 3 : 1.3;
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    if (a.rel) {
      ctx.strokeStyle = 'rgba(255,222,156,.82)';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(a.x - a.vx * 0.11, a.y - a.vy * 0.11);
      ctx.stroke();
    }
  }

  function drawPlanet(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    if (p.disrupted) {
      for (let i = 0; i < 19; i++) {
        const angle = i / 19 * TAU + performance.now() * 0.000035;
        const rr = p.r * (0.45 + (i % 5) * 0.24);
        ctx.fillStyle = i % 3 === 0 ? '#ffb05e' : (i % 2 ? '#7e4d3d' : '#d76b41');
        ctx.beginPath();
        ctx.arc(Math.cos(angle) * rr, Math.sin(angle) * rr, 7 + (i % 5) * 3, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
      return;
    }

    const gradient = ctx.createRadialGradient(-p.r * 0.25, -p.r * 0.3, 8, 0, 0, p.r);
    gradient.addColorStop(0, p.damage === 0 ? '#55c9ff' : '#ffb25a');
    gradient.addColorStop(0.55, p.damage === 0 ? '#176db0' : (p.damage === 1 ? '#68482e' : '#493936'));
    gradient.addColorStop(1, '#07101a');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, p.r, 0, TAU);
    ctx.fill();

    if (p.damage === 0) {
      ctx.fillStyle = 'rgba(72,163,86,.84)';
      const land = [
        [-0.38, -0.12, 0.25, 0.11, 0.4],
        [0.2, -0.35, 0.22, 0.1, -0.3],
        [0.34, 0.09, 0.3, 0.13, 0.6],
        [-0.12, 0.35, 0.18, 0.09, -0.4]
      ];
      for (const [x, y, rx, ry, rot] of land) {
        ctx.beginPath();
        ctx.ellipse(x * p.r, y * p.r, rx * p.r, ry * p.r, rot, 0, TAU);
        ctx.fill();
      }
    }

    if (p.damage >= 1) {
      ctx.strokeStyle = 'rgba(255,105,52,.9)';
      ctx.lineWidth = 4;
      for (const mark of p.marks) {
        ctx.beginPath();
        ctx.arc(mark.x, mark.y, mark.r, 0, TAU);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(195,178,163,.2)';
      ctx.beginPath();
      ctx.arc(0, 0, p.r + 10, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawTrajectory() {
    const a = ship.grapple;
    if (!a) return;
    ctx.save();
    ctx.setLineDash([8, 10]);
    ctx.strokeStyle = 'rgba(120,240,255,.38)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(a.x + a.vx * 1.1, a.y + a.vy * 1.1);
    ctx.stroke();
    ctx.restore();
  }

  function drawEnemy(e) {
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.rotate(Math.atan2(e.vy, e.vx));
    ctx.fillStyle = e.type === 'station' ? '#62435c' : '#573a3a';
    ctx.strokeStyle = '#e7a3a3';
    ctx.lineWidth = 2;
    if (e.type === 'station') {
      ctx.beginPath();
      ctx.arc(0, 0, e.r, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.strokeRect(-e.r - 11, -8, (e.r + 11) * 2, 16);
    } else {
      ctx.beginPath();
      ctx.moveTo(-e.r, -14);
      ctx.lineTo(e.r, 0);
      ctx.lineTo(-e.r, 14);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();

    ctx.fillStyle = '#2c1111';
    ctx.fillRect(e.x - e.r, e.y - e.r - 9, e.r * 2, 4);
    ctx.fillStyle = '#ff7777';
    ctx.fillRect(e.x - e.r, e.y - e.r - 9, e.r * 2 * clamp(e.hp / e.max, 0, 1), 4);
  }

  function drawShip() {
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.a);
    ctx.strokeStyle = '#d9ffff';
    ctx.fillStyle = '#0d252b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(19, 0);
    ctx.lineTo(-12, -10);
    ctx.lineTo(-7, 0);
    ctx.lineTo(-12, 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    if (Math.hypot(input.moveX, input.moveY) > 0.08 || keyState.has('KeyW')) {
      ctx.strokeStyle = '#ffb15e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-10, -5);
      ctx.lineTo(-23, 0);
      ctx.lineTo(-10, 5);
      ctx.stroke();
    }
    ctx.restore();
  }

  function updateHud() {
    hudPrimary.innerHTML = `<b>DRAG_EM</b> &nbsp; HULL ${Math.ceil(ship.hp)}% &nbsp; SCORE ${state.score} &nbsp; WAVE ${state.wave}`;

    const parts = Object.entries(buildRequirements)
      .map(([key, need]) => `${labels[key].replace('Supercapacitor', 'Cap').replace('Gravitic Core', 'Core').replace('Flux Ring', 'Ring').replace('Cryo Pump', 'Cryo').replace('Phase Computer', 'CPU')} ${state.inv[key]}/${need}`)
      .join(' · ');

    hudSecondary.textContent = state.slingBuilt
      ? `SLING ONLINE · CHARGES ${state.slingCharges} · CELLS ${state.inv.exoticCell}`
      : parts;

    if (state.win) objective.textContent = 'TARGET DISRUPTED — tap RESTART to play again';
    else if (!state.slingBuilt && canBuild()) objective.textContent = atBeacon() ? 'SLING ARRAY READY — tap BUILD' : 'SLING ARRAY READY — return to the central beacon';
    else if (!state.slingBuilt) objective.textContent = 'Smash heavy targets with asteroids to recover rare Sling Array parts';
    else if (state.slingCharges === 0) objective.textContent = 'Destroy stations with asteroid impacts to recover Exotic Cells';
    else if (!ship.grapple) objective.textContent = 'Grapple an asteroid, aim with the movement stick, then tap SLING';
    else objective.textContent = 'Relativistic shot armed — aim and tap SLING';

    grappleBtn.textContent = ship.grapple ? 'RELEASE' : 'GRAPPLE';
    specialBtn.textContent = state.slingBuilt ? 'SLING' : 'BUILD';
    specialBtn.classList.toggle('ready', state.slingBuilt ? (state.slingCharges > 0 && !!ship.grapple) : (canBuild() && atBeacon()));
    pushBtn.classList.toggle('cooldown', ship.pushCd > 0);
  }

  function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    for (const s of state.stars) {
      ctx.globalAlpha = 0.22 + 0.75 * s.z;
      ctx.fillStyle = '#fff';
      const size = 0.6 + s.z * 1.4;
      ctx.fillRect(s.x * W, s.y * H, size, size);
    }
    ctx.globalAlpha = 1;

    if (state.planet) drawPlanet(state.planet);

    ctx.strokeStyle = 'rgba(130,245,255,.35)';
    ctx.fillStyle = 'rgba(130,245,255,.08)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(beacon.x, beacon.y, beacon.r + 7, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(beacon.x, beacon.y, beacon.r - 8, 0, TAU);
    ctx.fill();
    ctx.stroke();

    if (ship.grapple) {
      ctx.strokeStyle = 'rgba(115,235,255,.82)';
      ctx.lineWidth = 1.7;
      ctx.beginPath();
      ctx.moveTo(ship.x, ship.y);
      ctx.lineTo(ship.grapple.x, ship.grapple.y);
      ctx.stroke();
      drawTrajectory();
    }

    state.asteroids.forEach(drawAsteroid);
    state.enemies.forEach(drawEnemy);

    for (const l of state.lasers) {
      ctx.strokeStyle = '#68eaff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(l.x, l.y);
      ctx.lineTo(l.x - l.vx * 0.03, l.y - l.vy * 0.03);
      ctx.stroke();
    }

    for (const s of state.salvage) {
      ctx.fillStyle = s.type === 'exoticCell' ? '#f3da67' : (s.type === 'phaseCPU' ? '#d8a7ff' : '#9acbd2');
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.rect(s.x - 5, s.y - 5, 10, 10);
      ctx.fill();
      ctx.stroke();
    }

    for (const p of state.particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.hot ? '#ffd27a' : '#ff9c62';
      ctx.fillRect(p.x, p.y, 2.2, 2.2);
    }
    ctx.globalAlpha = 1;

    drawShip();
    updateHud();
  }

  function loop(now) {
    const dt = Math.min(0.033, (now - last) / 1000 || 0.016);
    last = now;

    if (ship.hp > 0 && !state.win) update(dt);
    else if (messageTimer > 0 && messageTimer < 900) {
      messageTimer -= dt;
      if (messageTimer <= 0) message.classList.remove('show');
    }

    draw();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
