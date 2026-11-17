# The Road — v0.3.0 spectral encounters (November 17, 2026)

## Newly implemented
- Removed the wolf silhouette, golden eyes, synthesized howls, howl scheduler and wolf testing buttons.
- Added faint translucent, hovering human spectres with visible anatomically modeled features; periodically they drift, turn their heads and release wisps when close. A CC-BY-4.0 CesiumMan glTF asset loads opportunistically; a procedural human fallback is provided for failed/offline loads. Actual appearance requires browser visual verification and is not guaranteed to meet the user's high-detail model target.
- Added rare nearly-black shadow runners that move through the darkest field sections and vanish. Manual **Show shadow** testing is more visible than the normal encounter.
- Added soft stereo grass-rustles travelling left to right or right to left, with a **Test rustle** control. Rustles are quieter than the previous synthesis.
- Added a prerecorded-clip playback pipeline with stereo pan and distance-like filtering for "Mommy?", "Daddy?", "Have you seen my mummy?", "Hello?" and laughter, with a **Test voice** control. **Voice recordings themselves are not yet present**, because realistic childlike AI audio generation needs a connected voice/audio generator. No phone text-to-speech is used and no fake recordings are claimed.
- Preserved v0.2.0 player controls, stamina, town edge, fireflies and existing ambient footsteps/crickets.

## Test / remaining tasks
1. Connect a voice generation service and export five audio files in Ogg/Vorbis or Ogg/Opus format under a_new_game/audio/ with exact names listed in README. Confirm license/consent and suitability, then test on iPhone.
2. Verify CesiumMan model loads through the external CDN and is appropriate for the look; replace with a user-approved licensed higher-quality model if the test falls short.
3. Check mobile GPU performance, ghost opacity, shadow near-invisibility, wind/rustle loudness and all four test buttons.
4. Check nearby crickets fade and lantern subtly flickers when a ghost is close.
5. Once tested, reduce supernatural frequency further if encounters become predictable.

## Source attribution
CesiumMan by Cesium, CC-BY-4.0; see https://github.com/KhronosGroup/glTF-Sample-Assets/blob/main/Models/CesiumMan/LICENSE.md. The external model may display Cesium-related markings and is a replaceable prototype asset.

---
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
