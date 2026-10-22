# Asteroid Clone Plan — DRAG_EM

## Core fantasy
DRAG_EM is a heavy-JavaScript browser space game inspired by the movement and danger of Asteroids, but the main weapon is momentum rather than gunfire. The player grapples, drags, pushes, reels, and slings asteroids into hostile cruisers, stations, planetary defenses, and eventually planets. Lasers exist, but are intentionally secondary.

## Primary loop
1. Fly through an asteroid field.
2. Grapple a useful asteroid.
3. Use thrust and tether length to change its trajectory.
4. Release or sling it into a hostile target.
5. Recover salvage from destroyed heavy targets.
6. Use rare salvage to build more powerful manipulation technology.
7. Progress from ship kills to station kills to planetary-scale targets.

## Relativistic Sling Array
The late-game superweapon is a fictionalized Relativistic Sling Array. The game treats "one-third the speed of light" as a dramatic endgame capability rather than a real engineering recipe.

### Required assembly parts
- 3 Flux Rings
- 2 Gravitic Cores
- 4 Supercapacitors
- 2 Cryo Pumps
- 1 Phase Computer

Rare components are recovered primarily from heavy targets destroyed by asteroid impacts. Laser kills have worse salvage quality so the player is rewarded for using the core mechanic.

### Per-shot cost
Each relativistic launch also consumes 3 Exotic Cells. Exotic Cells are rare and are most likely to drop from stations destroyed with asteroid strikes. Building the array therefore does not make relativistic launches routine.

### Firing sequence
1. Assemble the Sling Array at the fabrication beacon.
2. Collect enough Exotic Cells for a charge.
3. Grapple an asteroid.
4. Aim the ship and release the relativistic shot.
5. The game represents the launch as a very high-speed projectile with a long luminous trail and catastrophic target damage.

## Target progression
- Light and heavy cruisers: ordinary asteroid impacts are efficient; lasers do chip damage.
- Stations: high hit points and better rare-part salvage.
- Planetary target: appears later and visually degrades under repeated impacts.
- Relativistic planetary strike: catastrophic disruption. The planet stops being a coherent world and becomes a debris field.

## Planet-impact visual stages
These are game abstractions informed by the discussion rather than exact scientific simulations.

### Ordinary giant impacts
- Atmosphere remains, but can become extremely hot, dusty, steamy, and chemically hostile.
- Huge impact basins glow with molten rock.
- Surface water near ocean impacts flashes to steam; surviving oceans are violently disturbed.
- Coastlines are radically reshaped by crater formation, tsunamis, erosion, sediment transport, and flooding.
- Most exposed forests and surface vegetation die; deep refuges, seeds, spores, roots, and some aquatic or microbial life may persist.
- Large marine animals are highly vulnerable to shock, heating, food-web collapse, and the need to surface.
- Deep-ocean and chemosynthetic communities are among the more plausible refuges.
- Surface habitability returns far more slowly than the immediate heat fades; human survival would favor deep, sealed, self-sufficient refuges.

### 100 km asteroid at about 0.33c
For game purposes, treat this as planetary disruption rather than a crater event.
- The impactor does not remain intact.
- The projectile and target material become a mix of ultra-hot plasma, vapor, molten droplets, and fragments.
- The event carries far more than the energy needed to catastrophically disrupt an Earth-like planet.
- The planet becomes an expanding debris field rather than a damaged but recognizable Earth.
- As the debris expands and cools, vapor condenses into droplets, dust, and rock while larger fragments continue outward or later reaccumulate.

## Prototype controls
- W/S: forward and reverse thrust
- A/D: turn
- Q/E: strafe
- Space: laser
- G: grapple or release nearest asteroid
- R/F: reel tether in or pay it out
- B: assemble Sling Array while near the central fabrication beacon
- X: fire a relativistic sling shot when the array is built, charged, and an asteroid is grappled
- N: restart

## Current prototype goals
- Black-screen space presentation with procedural canvas graphics.
- Momentum-based asteroid manipulation.
- Collision damage determined mainly by asteroid speed and mass.
- Weaker laser fallback.
- Salvage economy and difficult late-game build path.
- Progressive target escalation culminating in a planetary target.
- Relativistic strike as a rare, visually distinct victory mechanism.

## Future expansion ideas
- Better tether physics and asteroid rotational inertia.
- Multiple grapple heads, tractor beams, and push charges.
- Enemy point-defense systems that can cut tethers.
- Mobile fabrication ships instead of a static beacon.
- Boss stations with armor sections and vulnerable radiators.
- Different asteroid compositions and densities.
- Campaign map with orbital mechanics and mission objectives.
- Planet-impact aftermath sequence showing steam, atmospheric debris, coast changes, ecological collapse, and later cooling.
- Persistent parts inventory and ship loadouts.
- Touch controls and controller support.
