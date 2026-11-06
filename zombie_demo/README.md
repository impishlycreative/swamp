# Zombie Demo

Open `index.html` through an HTTP server or the existing Swamp web host. For a local preview, run `python3 -m http.server 8000` from the repository root and visit `/zombie_demo/`.

- Actual Kenney characterMedium FBX model, textured with Zombie A or Zombie C.
- Left/right buttons rotate the character 22.5 degrees; arrow keys also rotate.
- Drag to orbit, pinch/scroll to zoom, and reset the view.
- Idle, run and jump clips from the downloaded pack; optional skeleton overlay.
- Mobile layout with large controls and capped rendering resolution.

Three.js 0.170.0 and its FBXLoader/OrbitControls modules load from jsDelivr. An internet connection and WebGL are required. Original FBX files are used directly; no GLB conversion is required for this viewer. The original asset licence is preserved in `assets/License.txt` (Kenney CC0).

Hand rig: each hand has a wrist, three index-chain joints and two thumb-chain joints; there are no separately named middle, ring or little-finger chains.
