# Pattycaker v0.6.0 — rebuild and acceptance checklist

## Design invariants
- Adult, eyeless human face; both original human hands remain ordinary and cover her face.
- Three pairs (six total) of hand-footed supporting limbs, not shoes.
- Six fanned back arms, each with exactly one eye and one toothed mouth in its palm.
- Fourteen articulated hands and seventy individually jointed fingers.
- Non-gory; palm eyes and mouths only on the six fanned back hands.
- Appears at the town limits and can be triggered with the Show Pattycaker button.

## Implementation against the 1–10 rebuild scope

| # | Area | Implemented in v0.6 | Still requiring artist/device acceptance |
| - | - | - | - |
| 1 | Body geometry | Weighted connective skin, expanded finger segments, rounded joints, irregular limb profiles | Professional sculpt, retopology, seamless limb-to-torso topology |
| 2 | Legs / locomotion | Six world-anchored hand-feet; analytic two-bone IK and bent joints; lift/stance cycle; terrain raycast | Limb pole tuning at tight turns, obstacles, all-speed walk-cycle review |
| 3 | Knuckles | Flexing joints and terminal segment per finger; curling during ground contact | Finger-by-finger terrain IK and force-aware palm deformation |
| 4 | Eyes | Openings in extruded palm geometry, moist 3D eyeballs, lids, independent gaze and blink | Close-up sculpture, anatomical skin transitions, photoreal eye shaders |
| 5 | Mouths | Palm apertures, cavity/gums/irregular teeth and independently moving lower jaws | Full deforming lip aperture, soft-tissue simulation |
| 6 | Skin / hair | Procedural PBR skin micro-relief, roughness, moving layered strands | Artist-authored 2K/4K textures, baked materials and high-detail hair cards |
| 7 | Rig | THREE.Bone hierarchy and weighted SkinnedMesh, exportable GLB | Confirm Blender and Unity import and retargeting |
| 8 | Animation | Idle, knuckle scuttle, crouch/rise, pursuit, moving hair and fan arms | Hand-authored transitions, motion polish and collisions |
| 9 | Game | Town-limit encounter, test spawn, gaze, lantern/shadows, road/grass raycast, GLB export button | Desktop/iOS visual checks, lighting direction and GPU profiling |
| 10 | Tests | Pure IK/gait regressions, optional headless Three smoke tests and CI workflow | Actual rendering review, reference comparison and FPS measurements |

## Manual validation
1. Serve the repository over HTTP, open /a_new_game/, click BEGIN WALKING.
2. Click Show Pattycaker: verify crouching, face-covering, rising and approaching.
3. At close range, circle around the mob; inspect all six limb bends, anchored wrists and knuckle contacts.
4. Walk and run away; check higher-speed pursuit and alternating foot lift.
5. Check the six fanned palms for independent blinking, tracking and jaw motion; ordinary hands remain without eyes.
6. Walk near the dirt road and grass edge to check raycast-grounded targets.
7. Toggle the lantern, watch contact shadows and inspect geometry clipping.
8. Click Export Pattycaker GLB. Import into Blender; inspect bones, weights, idle and stalk clips.
9. In a_new_game, run npm test. For optional Three geometry smoke checks: npm install --no-save three@0.170.0 followed by npm test.
10. Repeat in desktop Chromium and mobile Safari, capture visual defects and FPS.

## Verification boundary
JavaScript syntax compilation and numerical IK checks were performed during development. The headless Three, real-browser visual, GLB import and performance checks are not yet confirmed. This procedural art is not yet production photorealistic. Do not mark the full acceptance checklist as complete before viewing her in motion on a target device.
