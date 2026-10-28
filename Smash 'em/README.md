# Smash ’em

A static browser destruction prototype for the `swamp` GitHub Pages site.

## Current slice

- Babylon.js rendering in the browser
- BVX Kit smooth voxel wall using `VoxelSmoothGeometry`
- Three 16×16×16 BitVoxel chunks, rendered as one continuous wall
- Individual BitVoxel removal on bat impact
- Persistent destruction stored in browser `localStorage`
- Material bands for drywall, wood, glass, brick, and concrete
- Material-specific carve size and synthesized impact sound
- Debris particles generated from the actual impact point
- Third-person placeholder character and baseball-bat swing
- Desktop keyboard/mouse controls
- Touch controls for mobile
- No server backend required

## Important limitation

This now uses real BVX smooth voxel geometry for the destructible wall, but it is still a vertical-slice prototype rather than the final realism target. The human character, animation, building architecture, textures, sound library, debris physics, and structural-collapse behaviour still need higher-fidelity passes.

## Runtime dependencies

### Babylon.js

Apache License 2.0

- License: https://github.com/BabylonJS/Babylon.js/blob/master/license.md
- Repository: https://github.com/BabylonJS/Babylon.js

### BVX Kit

Apache License 2.0

- License: https://github.com/astrum-forge/bvx-kit/blob/main/LICENSE
- Repository: https://github.com/astrum-forge/bvx-kit
- Package: `@astrumforge/bvx-kit`

The browser prototype imports BVX Kit 2.0.0 as an ES module from jsDelivr and Babylon.js from its official CDN, so the site remains deployable as static files on GitHub Pages.

## Controls

Desktop:
- WASD: move
- Right-drag: orbit camera
- Left click or Space: swing
- R: reset destruction

Mobile:
- Left pad: move
- Right pad: look
- SMASH: swing
- RESET: reset destruction
