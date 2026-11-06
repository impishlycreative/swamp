# Zombie Demo

Open `index.html` through an HTTP server or the existing Swamp web host. For a local preview, run `python3 -m http.server 8000` from the repository root and visit `/zombie_demo/`.

- Actual Kenney characterMedium FBX model, textured with Zombie A or Zombie C.
- Left/right buttons rotate the character 22.5 degrees; arrow keys also rotate.
- Drag to orbit, pinch/scroll to zoom, and reset the view.
- Idle, Run, Walk, Shamble, Chicken Dance and Robot Dance use procedural skeleton motion; Jump uses the downloaded clip. Optional skeleton overlay.
- Mobile layout with large controls and capped rendering resolution.

Three.js 0.170.0 and its FBXLoader/OrbitControls modules load from jsDelivr. An internet connection and WebGL are required. Original FBX files are used directly; no GLB conversion is required for this viewer. The original asset licence is preserved in `assets/License.txt` (Kenney CC0).

Hand rig: each hand has a wrist, three index-chain joints and two thumb-chain joints; there are no separately named middle, ring or little-finger chains.

## In-place motion modes

Run and Walk use alternating leg IK and arm swings. Shamble has an asymmetric gait, a trailing right foot with minimal clearance, forward-reaching bent arms, and a 17-degree combined sideways neck/head tilt. Chicken Dance flaps bent elbows and alternates foot lifts. Robot Dance uses deliberately stepped arm and torso poses. Mode changes blend over 0.25 seconds. All five modes drive the actual rig procedurally and preserve the viewer pivot and model translation. These are authored poses, not a physical simulation or additional Kenney clips. Jump remains the original supplied clip.
