// Small, deterministic gameplay rules shared by the browser prototype and Node tests.
// Keep these independent from rendering/audio APIs so behavior can be regression-tested.
export const ROAD_HALF_WIDTH = 3.1;
export const CRICKET_QUIET_RADIUS = 7.2;
export const CRICKET_RECOVERY_SECONDS = 1.55;

export function terrainAt(x) {
  return Math.abs(x) > ROAD_HALF_WIDTH ? 'grass' : 'dirt';
}

export function cricketPresence(distance, now, holdUntil = 0) {
  if (!Number.isFinite(distance) || !Number.isFinite(now)) {
    throw new RangeError('Cricket distance and current time must be finite');
  }
  if (distance < CRICKET_QUIET_RADIUS) {
    // Every update near the player extends the silence by 1.55 seconds.
    return { audible: false, holdUntil: now + CRICKET_RECOVERY_SECONDS };
  }
  // Faraway crickets never fall silent; only recently disturbed voices recover.
  return { audible: now >= holdUntil, holdUntil };
}

export function cricketAttenuation(distance) {
  const d = Math.max(0, distance);
  return 1 / (1 + d * 0.07 + d * d * 0.006);
}

export const TOWN_EDGE_Z = -147.5;
export const WALK_SPEED = 2.3;
export const RUN_SPEED = 4.6;
export const STAMINA_MAX = 100;
export const RUN_DURATION = 8;
export const RECOVERY_DURATION = 12;
export const MIN_RUN_STAMINA = 25;
export const DOUBLE_TAP_MS = 330;
export const DOUBLE_TAP_PX = 36;

export function canStartRun(stamina) {
  return Number.isFinite(stamina) && stamina >= MIN_RUN_STAMINA;
}
export function staminaStep(stamina, isRunning, isMoving, dt) {
  if (!Number.isFinite(stamina) || !Number.isFinite(dt) || dt < 0) throw new RangeError('Invalid stamina or delta');
  const change = (isRunning && isMoving ? -STAMINA_MAX / RUN_DURATION : STAMINA_MAX / RECOVERY_DURATION) * dt;
  const next = Math.max(0, Math.min(STAMINA_MAX, stamina + change));
  return {stamina: next, running: !!isRunning && next > 0};
}
export function classifyTap(previous, now, x, y) {
  if (![now,x,y].every(Number.isFinite)) throw new RangeError('Invalid tap');
  const double = !!previous && now >= previous.time && now - previous.time <= DOUBLE_TAP_MS &&
    Math.hypot(x-previous.x,y-previous.y) <= DOUBLE_TAP_PX;
  return {double, previous: double ? null : {time:now,x,y}};
}
