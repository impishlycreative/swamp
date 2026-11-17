# The Road — Prototype Plan

## Version v0.2.0 — November 17, 2026
The player begins as an ordinary human man. There is still **no 3D human avatar**; the first-person camera and lantern represent the player. Appearance, later transformation, and third-person perspective are undecided.

## Six implemented requests
1. **Hear werewolf howls** — Higher-volume, layered synthesized howl; first automatic howl approximately 18 seconds after sound starts, then every 3–5 minutes (occasional answering howl). A **Test howl** button triggers one on demand. Actual sound output requires an enabled browser audio context and device testing.
2. **See werewolves** — More frequent golden-eyed watcher: initial appearance roughly 9 seconds after the scene starts, subsequent appearances roughly 23–43 seconds after each encounter. It now spawns closer to the forward view, holds around 20–28 seconds, and rises visibly from a crouch. **Show wolf** manually triggers the event for inspection. This high frequency is for testing and should be reduced later.
3. **Tone down grass rustling** — Lower distant rustle level, grass footstep rustling, and continuous grass contact; keep footsteps and subtle distant environmental sound.
4. **Run with stamina** — Mobile single tap walks toward a selected point; double tap within 330 ms and 36 px runs to the selected point. A single tap while already running cancels the run and walks to the new point. Desktop single click/double-click provides the same behavior; drag or optional right-click pointer lock rotates the view, WASD moves, and Shift+WASD runs. Walking speed 2.3 m/s; run speed 4.6 m/s. Full sprint depletes stamina in about eight seconds, then the player automatically walks to the same destination. Regeneration takes about 12 seconds when walking or resting; a new run can start at or above 25%, but never automatically resumes. A visible stamina bar tracks the value.
5. **Approach town without entering** — Travel limit moved to z=-147.5, near the town outskirts at z≈-160 to -189. The existing road continues toward that edge; a visible fence and town-limit sign mark the non-enterable boundary. Extended roadside grass and fence details. Town entry stays disabled.
6. **Longer/brighter pearly fireflies** — Larger bright cores, pearly glow sprites, longer visibility cycles and layered curved flight paths. No more than eight visible simultaneously.

## Testing checklist
- On mobile, start the scene with audio enabled. Tap **Test howl**; verify actual howl volume and note mute-switch/device differences.
- Tap **Show wolf** and verify eyes and rising silhouette are in the field of view.
- Check single-tap walking, double-tap running, single-tap canceling running, stamina exhaustion, regeneration, and a second sprint.
- Reach the fence at the edge of town without entering it.
- Evaluate quieter rustling and brighter fireflies at night.
- Repeat movement checks on desktop and watch frame rate on mobile.

## Reality and quality limitations
Browser audio and WebGL performance have not been verified on the target iPhone, and these source changes are not a substitute for interactive visual/acoustic testing. The watcher is still made from primitive geometries, the howls are synthesized, and the player has no physical human body mesh.

## Earlier milestones
- v0.1.0 (November 16, 2026): first-person road, lantern, moon, procedural grass, cricket and rustling atmosphere, fireflies, distant howl, golden-eyed watcher, intro version.
- v0.2.0 (November 17, 2026): changes described above.
