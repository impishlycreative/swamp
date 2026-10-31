# Space Fighters

**Version:** 0.1.0

Space Fighters is a single-player 2D arcade combat game built for desktop and mobile. The design combines the immediate feel and power growth of classic vertical shooters such as *1942* with a modern sci-fi campaign structure inspired by mission-based space combat games.

## Play

Open `Space_Fighters/index.html` directly, or run the repository through GitHub Pages/static hosting.

No build step, framework, external assets, or package install is required.

## Current gameplay

- Fixed top-down camera with continuous forward scrolling.
- The player fighter always faces forward; there is no ship rotation.
- Free movement within the combat viewport: forward, backward, left, right, diagonal, and curved movement are all possible.
- Hold the primary fire control for automatic fire; tapping produces short bursts.
- Mobile-first virtual joystick plus large FIRE and MISSILE controls.
- Desktop controls with full feature parity.
- Shields, hull integrity, and lives.
- Respawn near the death location instead of restarting the mission.
- Death removes temporary power-ups but keeps persistent upgrades.
- Temporary weapon, shield, rapid-fire, and missile power-ups.
- Persistent gun, engine, shield, and hull upgrades purchased with mission credits.
- Brief, skippable mission briefings.
- Progressive enemy mix including scouts, strikers, bombers, gunships, aces, and a carrier.
- Multiple mission objectives: destruction quotas, survival, defense, and a capital-ship strike.
- Branching campaign recovery missions when a main-line mission is failed.
- Typical mission targets are designed around roughly 3–5 minutes.

## Controls

### Desktop

- **Move:** WASD or arrow keys
- **Primary fire:** hold Space
- **Missile:** E
- **Pause:** P or Escape

### Mobile

- **Move:** left virtual joystick
- **Primary fire:** hold FIRE; tap for a burst
- **Missile:** tap MISSILE

## Campaign flow

The main path is linear when the player succeeds. Failure does not immediately end the campaign; it diverts the player to a recovery mission that can return them to the main path.

Current prototype missions: Patrol Intercept; Emergency Screen (failure branch); Convoy Shield; Salvage Run (failure branch); Carrier Strike; Break Contact (failure branch); Ace Trial.

## Persistence

Credits, unlocked campaign position, high score, and permanent upgrades are stored locally in the browser using `localStorage`. The Hangar includes a reset option for testing.

## Design direction

Visual direction: **retro arcade meets modern sci-fi**.

Gameplay priorities: mobile-first readability and controls; fast arcade action with tactical positioning and target priority; short missions with increasing enemy complexity rather than simple health inflation; persistent progression plus disposable in-mission power growth; brief story delivery that never gets in the way of play.

## Project files

- `index.html` — game shell, HUD, menus, briefing, hangar, result and touch controls.
- `styles.css` — responsive/mobile-first presentation.
- `game.js` — game loop, input, combat, enemies, missions, campaign branching, upgrades and persistence.
- `VERSION` — current version.
- `CHANGELOG.md` — release history.

## Next development targets

Sound effects and music; more mission-specific formations and scripted events; additional secondary weapons while keeping mobile controls simple; more capital ships and bosses; more persistent fighter/loadout choices; campaign map and ace ranking presentation; balance testing across phone sizes, tablets and desktop aspect ratios.
