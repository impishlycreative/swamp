# A New Game — The Road (prototype v0.7.0)

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
The command checks syntax and runs gameplay, Pattycaker kinematics, ghost anatomy and model smoke-test suites. Headless Three.js model smoke checks require `npm install --no-save three@0.170.0` first; without the package they are explicitly skipped. The added GitHub Actions workflow installs Three.js and runs all tests. The rules for terrain classification and cricket recovery live in `gameplay.js`, which is also imported by the browser scene.

These tests do not render WebGL, measure frame rate, listen to audio, or establish photorealism. A manual visual and audio check in desktop and mobile browsers is still required.

## Quality and limitations

**Visual target:** The previously generated concept screenshot is a *gameplay-quality acceptance target*. This procedural proof-of-interaction is not remotely at the target level yet. The geometry, material maps and synthetic sounds are placeholders; the moving grass and reactive crickets are interactive proof-of-concept effects rather than field-recorded or photographically scanned assets. There is no genuine photogrammetry, human model, complex vegetation wind animation, authored cinematics, physically accurate GI, voiced performance, story or multiplayer implementation. Browsers and mobile GPUs will vary in performance, and the scene still needs visual inspection on a target device.

**Next milestone:** Replace primitive assets with licensed/created high-detail meshes and PBR materials; improve moonlight/exposure/atmospherics, grass sway, lantern and occlusion, then use field recordings for realistic cricket and footstep sound. Establish a visual quality gate before expanding the open world. The choice of browser engine versus a game engine remains open if actual high-fidelity targets require it.

See [`game_design_plan.md`](./game_design_plan.md) for agreed requirements, including the adult urban horror direction and eventual solo and multiplayer play.

## Ghost apparition rebuild (v0.7.0)

The former ghost used semi-transparent spheres and capsules to imitate a person, with a brittle third-party CesiumMan model fetch. **That primitive placeholder and network dependency have been removed.**

The new ghost is generated locally by [ghost.js](./ghost.js): a continuous indexed mesh sharing clothing, throat, face and cranium geometry at believable adult proportions; curved tapered sleeves with independent elbow/wrist motion; slender fingers and layered drifting hair. The clothing has subtle fabric grain, while a modified physically-lit shader adds restrained Fresnel edges, asynchronous shimmer and a fading lower silhouette. Transparent geometry uses front-facing surfaces, depth handling and low-alpha discard rather than bright see-through bubbles. A few thin vapor threads replace the big glowing orbs.

The ghost keeps its randomly timed encounters and **Show ghost** test control, which now places it nearer the player for inspection. It appears slowly, turns with a delay, hovers instead of taking stiff steps and fades out.

This is a substantial procedural visual improvement, but **not a photo-scanned human model**. Close-up facial anatomy, clothing and hair still warrant an artist-authored model for the photorealism target. Automated Node tests validate geometry, proportions and fading; the Chromium test also renders the ghost and saves an in-game screenshot.

The voice playback engine expects these separately generated audio clips: `audio/mommy.ogg`, `audio/daddy.ogg`, `audio/have-you-seen-my-mummy.ogg`, `audio/hello.ogg` and `audio/child-laugh.ogg`. **They have not yet been generated or included.** The voice test shows an informative status until recordings exist; it never silently uses the phone's text-to-speech voice. Any audio producer may export Ogg (Opus or Vorbis) 44.1 kHz or 48 kHz. Ensure playback on iPhone Safari and license rights before release. The repository is still usable and other audio remains functional without these optional files.

The v0.7 ghost is newly generated procedural geometry; it does not download or bundle the previous third-party CesiumMan asset.

## Pattycaker rebuild (v0.6.0)

Pattycaker remains an original procedural adult horror character with six hand-footed walking limbs, six fanned arms bearing eyes and mouths, two ordinary human face-covering hands, and an eyeless face. The encounter at the town limits and the Show Pattycaker test button remain intact.

Version 0.6 introduces:
- Weighted, deformable connective anatomy, four articulated finger segments with visible knuckles, and irregular skin geometry with procedural PBR micro-texture.
- Recessed eye and mouth apertures in each of the six fan palms (rather than pasted-on decals), independently tracking/blinking eyes, gums, uneven teeth, and moving lower jaws.
- A six-limb world-anchored IK gait with alternating plant/swing cycles, contact shadows and road/grass ground-height raycasting. Pattycaker crouches, rises, walks, turns toward the player and accelerates into pursuit when far away.
- An on-demand **Export Pattycaker GLB** button for the weighted rig and baked idle / in-place stalking clips. The GLB export path and importing those clips into Blender still need manual verification.
- Numerical IK/gait tests, optional headless Three.js rig tests and an Actions workflow.

The **v0.6 branch is a prototype-quality character rebuild**, not a finished photorealistic sculpt. True muscle-to-skin topology, finger-by-finger collision/contact IK, performance capture, professional textures/hair, close-range visual direction, browser FPS, and GLB import still require review.

See [PATTYCAKER_ACCEPTANCE.md](./PATTYCAKER_ACCEPTANCE.md) for the item-by-item implementation and the ten manual acceptance checks.
