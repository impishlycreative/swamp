import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/+esm';

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 1);
document.body.prepend(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(7.2, 5.2, 8.5);
camera.lookAt(0, 0, 0);

const cubeRoot = new THREE.Group();
cubeRoot.rotation.set(-0.22, 0.48, 0.08);
scene.add(cubeRoot);

const LEVEL_COUNT = 6;
const CUBE_SIZE = 4;
const HALF = CUBE_SIZE / 2;
const LEVEL_HEIGHT = CUBE_SIZE / LEVEL_COUNT;
const VISIBLE_LEVEL_HEIGHT = LEVEL_HEIGHT * 0.92;
const LEVEL_AXIS = new THREE.Vector3(0, 1, 0);

const levels = [];
const pickMeshes = [];

for (let i = 0; i < LEVEL_COUNT; i += 1) {
  const pivot = new THREE.Group();
  // Every level rotates around the same fixed vertical axis through one cube corner.
  pivot.position.set(-HALF, 0, -HALF);
  cubeRoot.add(pivot);

  const geometry = new THREE.BoxGeometry(CUBE_SIZE, VISIBLE_LEVEL_HEIGHT, CUBE_SIZE);
  const material = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.16,
    depthWrite: false,
    side: THREE.DoubleSide
  });

  const mesh = new THREE.Mesh(geometry, material);
  const levelY = -HALF + LEVEL_HEIGHT * (i + 0.5);
  mesh.position.set(HALF, levelY, HALF);
  mesh.renderOrder = i;
  pivot.add(mesh);

  const edgeGeometry = new THREE.EdgesGeometry(geometry, 18);
  const edgeMaterial = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.92
  });
  const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
  edges.position.copy(mesh.position);
  pivot.add(edges);

  const level = {
    index: i,
    pivot,
    mesh,
    edges,
    angle: 0,
    hueOffset: (i / LEVEL_COUNT + 0.07 * i) % 1,
    hueSpeed: 0.025 + i * 0.004
  };

  mesh.userData.level = level;
  levels.push(level);
  pickMeshes.push(mesh);
}

// Subtle marker for the shared corner-axis.
const axisGeometry = new THREE.BufferGeometry().setFromPoints([
  new THREE.Vector3(-HALF, -HALF - 0.18, -HALF),
  new THREE.Vector3(-HALF, HALF + 0.18, -HALF)
]);
const axisMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.13 });
const axisLine = new THREE.Line(axisGeometry, axisMaterial);
cubeRoot.add(axisLine);

const PARTICLE_COUNT = 72;
const PARTICLE_RADIUS = 0.055;
const FIELD = 7.2;
const particleGeometry = new THREE.SphereGeometry(PARTICLE_RADIUS, 8, 8);
const particles = [];

function randomVelocity() {
  const direction = new THREE.Vector3(
    THREE.MathUtils.randFloatSpread(2),
    THREE.MathUtils.randFloatSpread(2),
    THREE.MathUtils.randFloatSpread(2)
  ).normalize();
  return direction.multiplyScalar(THREE.MathUtils.randFloat(0.22, 0.48));
}

for (let i = 0; i < PARTICLE_COUNT; i += 1) {
  const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const mesh = new THREE.Mesh(particleGeometry, material);
  mesh.position.set(
    THREE.MathUtils.randFloatSpread(FIELD * 2),
    THREE.MathUtils.randFloatSpread(FIELD * 1.35),
    THREE.MathUtils.randFloatSpread(FIELD * 2)
  );
  scene.add(mesh);

  particles.push({
    mesh,
    material,
    velocity: randomVelocity(),
    radius: PARTICLE_RADIUS,
    hueOffset: Math.random(),
    hueSpeed: THREE.MathUtils.randFloat(0.015, 0.052)
  });
}

const raycaster = new THREE.Raycaster();
const pointerNdc = new THREE.Vector2();
const interaction = {
  mode: null,
  pointerId: null,
  level: null,
  startX: 0,
  startY: 0,
  startAngle: 0,
  startCubeQuaternion: new THREE.Quaternion()
};

function setPointerNdc(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointerNdc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointerNdc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

renderer.domElement.addEventListener('pointerdown', (event) => {
  if (interaction.pointerId !== null) return;

  interaction.pointerId = event.pointerId;
  interaction.startX = event.clientX;
  interaction.startY = event.clientY;
  interaction.startCubeQuaternion.copy(cubeRoot.quaternion);
  renderer.domElement.setPointerCapture(event.pointerId);

  setPointerNdc(event);
  raycaster.setFromCamera(pointerNdc, camera);
  const hits = raycaster.intersectObjects(pickMeshes, false);

  if (hits.length > 0) {
    interaction.mode = 'level';
    interaction.level = hits[0].object.userData.level;
    interaction.startAngle = interaction.level.angle;
  } else {
    interaction.mode = 'cube';
    interaction.level = null;
  }
});

renderer.domElement.addEventListener('pointermove', (event) => {
  if (event.pointerId !== interaction.pointerId || !interaction.mode) return;

  const dx = event.clientX - interaction.startX;
  const dy = event.clientY - interaction.startY;

  if (interaction.mode === 'level' && interaction.level) {
    const angle = interaction.startAngle + (dx - dy * 0.28) * 0.012;
    interaction.level.angle = angle;
    interaction.level.pivot.setRotationFromAxisAngle(LEVEL_AXIS, angle);
    return;
  }

  const yaw = dx * 0.008;
  const pitch = dy * 0.008;
  const yawQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
  const pitchQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), pitch);

  cubeRoot.quaternion.copy(interaction.startCubeQuaternion);
  cubeRoot.quaternion.premultiply(yawQ);
  cubeRoot.quaternion.multiply(pitchQ);
});

function endPointer(event) {
  if (event.pointerId !== interaction.pointerId) return;
  if (renderer.domElement.hasPointerCapture(event.pointerId)) {
    renderer.domElement.releasePointerCapture(event.pointerId);
  }
  interaction.mode = null;
  interaction.pointerId = null;
  interaction.level = null;
}

renderer.domElement.addEventListener('pointerup', endPointer);
renderer.domElement.addEventListener('pointercancel', endPointer);

renderer.domElement.addEventListener('wheel', (event) => {
  event.preventDefault();
  const distance = camera.position.length();
  const nextDistance = THREE.MathUtils.clamp(distance * Math.exp(event.deltaY * 0.001), 5.2, 18);
  camera.position.setLength(nextDistance);
  camera.lookAt(0, 0, 0);
}, { passive: false });

const tempLocal = new THREE.Vector3();
const tempNormalLocal = new THREE.Vector3();
const tempNormalWorld = new THREE.Vector3();

function collideParticleWithLevel(particle, level) {
  const mesh = level.mesh;
  tempLocal.copy(particle.mesh.position);
  mesh.worldToLocal(tempLocal);

  const hx = HALF;
  const hy = VISIBLE_LEVEL_HEIGHT / 2;
  const hz = HALF;
  const r = particle.radius;

  if (
    Math.abs(tempLocal.x) > hx + r ||
    Math.abs(tempLocal.y) > hy + r ||
    Math.abs(tempLocal.z) > hz + r
  ) {
    return false;
  }

  const px = hx + r - Math.abs(tempLocal.x);
  const py = hy + r - Math.abs(tempLocal.y);
  const pz = hz + r - Math.abs(tempLocal.z);

  tempNormalLocal.set(0, 0, 0);

  if (px <= py && px <= pz) {
    const sign = Math.sign(tempLocal.x) || 1;
    tempLocal.x = sign * (hx + r + 0.002);
    tempNormalLocal.set(sign, 0, 0);
  } else if (py <= pz) {
    const sign = Math.sign(tempLocal.y) || 1;
    tempLocal.y = sign * (hy + r + 0.002);
    tempNormalLocal.set(0, sign, 0);
  } else {
    const sign = Math.sign(tempLocal.z) || 1;
    tempLocal.z = sign * (hz + r + 0.002);
    tempNormalLocal.set(0, 0, sign);
  }

  mesh.localToWorld(tempLocal);
  particle.mesh.position.copy(tempLocal);

  tempNormalWorld.copy(tempNormalLocal).transformDirection(mesh.matrixWorld).normalize();
  const towardSurface = particle.velocity.dot(tempNormalWorld);
  if (towardSurface < 0) {
    particle.velocity.reflect(tempNormalWorld);
  }

  return true;
}

function collideParticles() {
  for (let i = 0; i < particles.length; i += 1) {
    const a = particles[i];
    for (let j = i + 1; j < particles.length; j += 1) {
      const b = particles[j];
      const delta = b.mesh.position.clone().sub(a.mesh.position);
      const minDistance = a.radius + b.radius;
      const distanceSq = delta.lengthSq();

      if (distanceSq === 0 || distanceSq >= minDistance * minDistance) continue;

      const distance = Math.sqrt(distanceSq);
      const normal = delta.multiplyScalar(1 / distance);
      const overlap = minDistance - distance;

      a.mesh.position.addScaledVector(normal, -overlap * 0.5);
      b.mesh.position.addScaledVector(normal, overlap * 0.5);

      const relativeVelocity = a.velocity.clone().sub(b.velocity);
      const closingSpeed = relativeVelocity.dot(normal);
      if (closingSpeed > 0) {
        a.velocity.addScaledVector(normal, -closingSpeed);
        b.velocity.addScaledVector(normal, closingSpeed);
      }
    }
  }
}

function keepParticleInField(particle) {
  const p = particle.mesh.position;
  const v = particle.velocity;
  const yLimit = FIELD * 0.7;

  if (p.x < -FIELD || p.x > FIELD) {
    p.x = THREE.MathUtils.clamp(p.x, -FIELD, FIELD);
    v.x *= -1;
  }
  if (p.y < -yLimit || p.y > yLimit) {
    p.y = THREE.MathUtils.clamp(p.y, -yLimit, yLimit);
    v.y *= -1;
  }
  if (p.z < -FIELD || p.z > FIELD) {
    p.z = THREE.MathUtils.clamp(p.z, -FIELD, FIELD);
    v.z *= -1;
  }
}

function updateColors(timeSeconds) {
  for (const level of levels) {
    const hue = (level.hueOffset + timeSeconds * level.hueSpeed) % 1;
    level.mesh.material.color.setHSL(hue, 0.95, 0.52);
    level.edges.material.color.setHSL((hue + 0.025) % 1, 1, 0.66);
  }

  for (const particle of particles) {
    const hue = (particle.hueOffset + timeSeconds * particle.hueSpeed) % 1;
    particle.material.color.setHSL(hue, 1, 0.62);
  }
}

const clock = new THREE.Clock();
let elapsed = 0;

function animate() {
  requestAnimationFrame(animate);

  const dt = Math.min(clock.getDelta(), 0.033);
  elapsed += dt;

  for (const particle of particles) {
    particle.mesh.position.addScaledVector(particle.velocity, dt);
    keepParticleInField(particle);
  }

  cubeRoot.updateMatrixWorld(true);
  scene.updateMatrixWorld(true);

  for (const particle of particles) {
    for (const level of levels) {
      if (collideParticleWithLevel(particle, level)) break;
    }
  }

  collideParticles();
  updateColors(elapsed);
  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
});

animate();
