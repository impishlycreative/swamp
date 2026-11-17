# A New Game — The Road (prototype v0.3.0)

A first-person browser prototype for the rural opening scene of **A New Game**. This is an actual rendered, navigable 3D environment, **not** the generated reference screenshot and **not yet photorealistic**.

## Play

Serve the folder over HTTP (ES modules do not reliably run from `file://`):

```bash
python -m http.server 8000
```

Open `http://localhost:8000/a_new_game/` if serving from the Swamp repository root, or `http://localhost:8000/` if serving from this folder. The scene loads Three.js 0.170.0 from jsDelivr and requires WebGL and an internet connection for that dependency. Audio requires a user gesture.

If Swamp GitHub Pages serves the repository root, the scene's relative URL is `/a_new_game/`.

## Implemented in this first pass

- First-person movement: tap/click a destination to walk, double-tap/double-click to run, and single tap while running to walk toward the new point. A visible stamina bar drains after around eight seconds of running and refills in about twelve seconds while walking/resting. To run again after exhaustion, recharge at least 25% and double-tap. Desktop supports WASD, Shift+WASD to run, drag-to-look, and optional right-click pointer lock.
- Moonlit night sky, full moon, road, dirt texture, puddles, tall procedural grass, trees, fences and distant town with lit windows. GPU grass tips sway in the wind and bend when the walker passes nearby.
- A lantern equipped at spawn with a dynamic warm local light, shadows and small movement sway; lantern on/off button.
- Synthetic movement-linked dirt footfalls, separate grass footsteps and a continuous grass-brushing layer while moving through long grass.
- Spatialized chirping from 64 individual cricket sources, including 48 deliberately distributed along the roadside. Nearby sources quiet within 7.2 metres and recover 1.55 seconds after the player leaves their area; distant sources continue.
- Sound toggle and immediate **Test howl** button; first automatic howl after about 18 seconds and subsequent howls every 3–5 minutes. The **Show wolf** button triggers the golden-eyed rising silhouette, which is temporarily much more frequent and visible for testing. Grass rustling is quieter, fireflies have pearly brighter/longer glow and winding flight, and the player can approach the town's closed boundary without entering. Audio needs a user interaction; the assets remain procedural.
- A visible troubleshooting message if the browser cannot start the WebGL scene.

## Automated checks

From the `a_new_game` directory, run `npm test` with Node.js 20+.
The command checks JavaScript syntax and runs the `tests/prototype.test.mjs` regression suite. The rules for terrain classification and cricket recovery live in `gameplay.js`, which is also imported by the browser scene.

These tests do not render WebGL, measure frame rate, listen to audio, or establish photorealism. A manual visual and audio check in desktop and mobile browsers is still required.

## Quality and limitations

**Visual target:** The previously generated concept screenshot is a *gameplay-quality acceptance target*. This procedural proof-of-interaction is not remotely at the target level yet. The geometry, material maps and synthetic sounds are placeholders; the moving grass and reactive crickets are interactive proof-of-concept effects rather than field-recorded or photographically scanned assets. There is no genuine photogrammetry, human model, complex vegetation wind animation, authored cinematics, physically accurate GI, voiced performance, story or multiplayer implementation. Browsers and mobile GPUs will vary in performance, and the scene still needs visual inspection on a target device.

**Next milestone:** Replace primitive assets with licensed/created high-detail meshes and PBR materials; improve moonlight/exposure/atmospherics, grass sway, lantern and occlusion, then use field recordings for realistic cricket and footstep sound. Establish a visual quality gate before expanding the open world. The choice of browser engine versus a game engine remains open if actual high-fidelity targets require it.

See [`game_design_plan.md`](./game_design_plan.md) for agreed requirements, including the adult urban horror direction and eventual solo and multiplayer play.

## Spectral encounters and missing voice recordings (v0.3)

Werewolves and howls have been removed. The game now has hovering ghostly humans, subtle drifting wisps, very dark running silhouettes, and moving positional grass rustles. Test from the on-screen Ghost / Shadow / Rustle controls. An attributed CesiumMan CC-BY-4.0 glTF model is loaded from a CDN; a simpler procedural body is shown if that model cannot load. This is a visual prototype, not a verified high-fidelity human asset.

The voice playback engine expects these separately generated audio clips: `audio/mommy.ogg`, `audio/daddy.ogg`, `audio/have-you-seen-my-mummy.ogg`, `audio/hello.ogg` and `audio/child-laugh.ogg`. **They have not yet been generated or included.** The voice test shows an informative status until recordings exist; it never silently uses the phone's text-to-speech voice. Any audio producer may export Ogg (Opus or Vorbis) 44.1 kHz or 48 kHz. Ensure playback on iPhone Safari and license rights before release. The repository is still usable and other audio remains functional without these optional files.

Asset credit: CesiumMan by Cesium, CC-BY-4.0 (with additional trademark/logo restrictions); https://github.com/KhronosGroup/glTF-Sample-Assets/blob/main/Models/CesiumMan/LICENSE.md.
