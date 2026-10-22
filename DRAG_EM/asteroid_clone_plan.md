# Asteroid Clone Plan — DRAG_EM

## Platform
DRAG_EM is a **mobile-first browser game**. The primary target is a phone held in landscape orientation. It must be fully playable with touch controls and must not require a physical keyboard. Desktop keyboard controls may remain as a development/testing fallback, but they are not the primary interface.

## Core fantasy
DRAG_EM is a heavy-JavaScript space game inspired by the movement and danger of Asteroids, but the main weapon is momentum rather than gunfire. The player grapples, drags, pushes, reels, and slings asteroids into hostile cruisers, stations, planetary defenses, and eventually planets. Lasers exist, but are intentionally secondary.

## Mobile control model
The screen is divided into two thumb zones while leaving the center as clear as possible for play.

### Left thumb
- Analog movement stick.
- The ship accelerates in the direction of the stick and turns to face that direction.
- Moving while tethered is the main way to drag an asteroid and build a useful trajectory.

### Right thumb
- **Grapple / Release:** tether the nearest asteroid, or release the currently tethered one.
- **Laser:** hold to fire the weak direct-fire weapon.
- **Push:** apply a short-range gravitic shove to a nearby asteroid.
- **Reel − / Reel +:** shorten or lengthen the active tether while held.
- **Build / Sling:** contextual late-game control. Before assembly it attempts to build the Relativistic Sling Array at the fabrication beacon. After assembly it fires a relativistic shot when an asteroid is grappled and a charge is available.

The player can also tap an asteroid directly to grapple it when it is close enough. Phones in portrait orientation should ask the player to rotate to landscape.

## Primary loop
1. Fly through an asteroid field.
2. Grapple or push a useful asteroid.
3. Use movement and tether length to change its trajectory.
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
Each relativistic launch consumes 3 Exotic Cells. Exotic Cells are rare and are most likely to drop from stations destroyed with asteroid strikes. Building the array therefore does not make relativistic launches routine.

### Firing sequence
1. Recover the rare construction parts.
2. Return to the central fabrication beacon.
3. Tap **Build** to assemble the Sling Array.
4. Recover enough Exotic Cells to create a charge.
5. Grapple an asteroid.
6. Aim using the movement stick.
7. Tap **Sling**.
8. The game represents the launch as a very high-speed projectile with a long luminous trail and catastrophic target damage.

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

## Current prototype goals
- Black-screen space presentation with procedural canvas graphics.
- Landscape mobile layout with safe-area support for phone notches and home indicators.
- Large multi-touch controls designed for two-thumb play.
- Momentum-based asteroid manipulation.
- Grapple/drag, tether adjustment, and short-range pushing as distinct asteroid-control tools.
- A projected trajectory indicator while an asteroid is tethered.
- Collision damage determined mainly by asteroid speed and mass.
- Weaker laser fallback.
- Salvage economy and difficult late-game build path.
- Progressive target escalation culminating in a planetary target.
- Relativistic strike as a rare, visually distinct victory mechanism.

## Desktop development fallback
For testing on a computer, keyboard controls may remain available, but the game design must never depend on them. The on-screen touch controls are the canonical interface.

## Future expansion ideas
- Better tether physics and asteroid rotational inertia.
- Multiple grapple heads, tractor beams, and directional push charges.
- Enemy point-defense systems that can cut tethers.
- Mobile fabrication ships instead of a static beacon.
- Boss stations with armor sections and vulnerable radiators.
- Different asteroid compositions and densities.
- Campaign map with orbital mechanics and mission objectives.
- Planet-impact aftermath sequence showing steam, atmospheric debris, coast changes, ecological collapse, and later cooling.
- Persistent parts inventory and ship loadouts.
- Controller support.
- Optional haptic feedback where the browser/device supports it.
