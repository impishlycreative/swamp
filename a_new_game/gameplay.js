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
