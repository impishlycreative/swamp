# A New Game — The Road (prototype 0.1)

A first-person browser prototype for the rural opening scene of **A New Game**. This is an actual rendered, navigable 3D environment, **not** the generated reference screenshot and **not yet photorealistic**.

## Play

Serve the folder over HTTP (ES modules do not reliably run from `file://`):

```bash
python -m http.server 8000
```

Open `http://localhost:8000/a_new_game/` if serving from the Swamp repository root, or `http://localhost:8000/` if serving from this folder. The scene loads Three.js 0.170.0 from jsDelivr and requires WebGL and an internet connection for that dependency. Audio requires a user gesture.

If Swamp GitHub Pages serves the repository root, the scene's relative URL is `/a_new_game/`.

## Implemented in this first pass

- First-person camera and movement: WASD, Shift to hurry, click scene to lock mouse and look, Escape to release; touch tap-to-move and drag-to-look without a virtual joystick.
- Moonlit night sky, full moon, road, dirt texture, puddles, tall procedural grass, trees, fences and distant town with lit windows.
- A lantern equipped at spawn with a dynamic warm local light, shadows and small movement sway; lantern on/off button.
- Synthetic movement-linked dirt footfalls and grass-footstep/rustling sounds.
- Spatialized chirping from individual cricket sources: nearby sources quiet within ~7 metres and recover ~1.5 seconds after the player leaves their area; distant sources continue.
- Sound toggle; generated audio requires explicit interaction and no external audio assets.

## Quality and limitations

**Visual target:** The previously generated concept screenshot is a *gameplay-quality acceptance target*. This procedural proof-of-interaction is not remotely at the target level yet. The geometry, material maps and synthetic sounds are placeholders. There is no genuine photogrammetry, human model, complex vegetation wind animation, authored cinematics, physically accurate GI, voiced performance, story or multiplayer implementation. Browsers and mobile GPUs will vary in performance, and the scene still needs visual inspection on a target device.

**Next milestone:** Replace primitive assets with licensed/created high-detail meshes and PBR materials; improve moonlight/exposure/atmospherics, grass sway, lantern and occlusion, then use field recordings for realistic cricket and footstep sound. Establish a visual quality gate before expanding the open world. The choice of browser engine versus a game engine remains open if actual high-fidelity targets require it.

See [`game_design_plan.md`](./game_design_plan.md) for agreed requirements, including the adult urban horror direction and eventual solo and multiplayer play.