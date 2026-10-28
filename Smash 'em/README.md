# Smash ’em

A static browser destruction prototype for the `swamp` GitHub Pages site.

## What is in this first slice

- Babylon.js rendering in the browser
- Third-person character made from generated geometry
- Baseball-bat swing animation
- Persistent destructible wall cells
- Material-specific durability for drywall, wood, glass, brick, and concrete
- Debris and dust effects
- Synthesized material-specific impact audio using Web Audio
- Desktop keyboard/mouse controls
- Touch controls for mobile
- No server backend required

## Important limitation

This is a functional vertical-slice prototype, not the final photoreal target. The character and building materials are generated from primitives so the prototype can remain self-contained and license-clean. Replacing those with high-quality permissively licensed character, animation, texture, and sound assets is the next fidelity step.

## Runtime dependencies

- Babylon.js — Apache License 2.0
  - https://github.com/BabylonJS/Babylon.js/blob/master/license.md
  - https://github.com/BabylonJS/Babylon.js

The current prototype does **not yet integrate BVX Kit**; destruction is implemented as persistent local material cells so the interaction loop can be validated on GitHub Pages before introducing the voxel meshing dependency.

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
