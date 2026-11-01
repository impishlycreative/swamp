# Space Fighters

**Version:** 0.2.2

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
- iPhone Safari browser mode lifts touch controls above the visible bottom browser chrome instead of allowing the toolbar to cover them.
- Gameplay touch surfaces explicitly suppress Safari pan, pinch, rapid-tap zoom, and gesture zoom so finger movement stays assigned to the game.
- Desktop mouse-X positioning with W/S forward/back movement; A/D and arrow-key fallback remain available.
- Right-click fires a missile on desktop.
- Shields, hull integrity, and lives.
- Respawn near the death location instead of restarting the mission.
- Death removes temporary power-ups but keeps persistent upgrades.
- Temporary weapon, shield, rapid-fire, and missile power-ups.
- Persistent gun, engine, shield, and hull upgrades purchased with mission credits.
- Brief, skippable mission briefings.
- Progressive enemy roster including scouts, strikers, bombers, gunships, aces, and a carrier.
- Multiple mission objectives: destruction quotas, survival, defense, and a capital-ship strike.
- Branching campaign recovery missions when a main-line mission is failed.
- Typical mission targets are designed around roughly 3–5 minutes.

## 0.2.x balance model

Version 0.2.0 introduced the first pass of the researched Space Fighters Game Design Guide. Versions 0.2.1 and 0.2.2 add iPhone Safari layout and gesture protections:

- Mission 01 is now an authored encounter sequence instead of a generic random-wave mission.
- Mission-specific caps limit active enemies, simultaneous firing enemies, active enemy bullets, and total encounter threat.
- Recovery missions stay in the same broad difficulty tier as the mission the player failed rather than becoming an immediate punishment spike.
- Early projectile speeds are substantially slower and increase progressively through the campaign.
- Mission 01 contains guaranteed weapon, shield, and missile pickups so the power-up system is actually taught.
- The player collision radius is smaller than the visible fighter silhouette, making tight dodges fairer.
- Random later missions use threat-aware spawning so a new wave is delayed when the existing screen is still too dangerous.
- Recovery missions provide somewhat stronger access to recovery drops.
- Respawns clear nearby enemy bullets and can provide extra recovery help after repeated deaths.
- iPhone Safari browser mode reserves extra bottom clearance for touch controls so Safari's bottom toolbar does not cover the joystick or action buttons.
- Gameplay canvas and touch controls block Safari gesture zoom and page movement while active.

## Controls

### Desktop

- **Horizontal movement:** move the mouse left/right; the fighter follows the mouse X position
- **Forward/back:** W / S
- **Fallback movement:** A / D or arrow keys
- **Primary fire:** hold Space
- **Missile:** right-click (E remains available as keyboard fallback)
- **Pause:** P or Escape

### Mobile

- **Move:** left virtual joystick
- **Primary fire:** hold FIRE; tap for a burst
- **Missile:** tap MISSILE

## Campaign flow

The main path is linear when the player succeeds. Failure does not immediately end the campaign; it diverts the player to a recovery mission that can return them to the main path.

Recovery branches are deliberately kept near the same raw difficulty tier as the failed main mission. Their challenge comes from a different objective and situation rather than simply flooding the screen with more enemies.

Current missions: Patrol Intercept; Emergency Screen (failure branch); Convoy Shield; Salvage Run (failure branch); Carrier Strike; Break Contact (failure branch); Ace Trial.

## Persistence

Credits, campaign position, high score, and permanent upgrades are stored locally in the browser using `localStorage`. Version 0.2.x migrates the earlier 0.1.x save key when possible. The Hangar includes a reset option for testing.

## Design direction

Visual direction: **retro arcade meets modern sci-fi**.

Gameplay priorities: mobile-first readability and controls; fast arcade action with tactical positioning and target priority; short missions with increasing enemy complexity rather than simple health inflation; persistent progression plus disposable in-mission power growth; brief story delivery that never gets in the way of play.

The complete researched design standard is stored in the ChatGPT Library `Space_Fighters` folder as `Space_Fighters_Game_Design_Guide.md`.

## Project files

- `index.html` — game shell, HUD, menus, briefing, hangar, result, touch controls, Safari viewport/layout safeguards.
- `styles.css` — responsive/mobile-first presentation.
- `game.js` — game loop, controls, combat, enemy behavior, authored/capped encounters, missions, campaign branching, upgrades and persistence.
- `mobile-guards.js` — iOS/Safari gameplay gesture suppression for pan, pinch and rapid-tap zoom.
- `VERSION` — current version.
- `CHANGELOG.md` — release history.

## Next development targets

Playtest and tune the new Mission 01 pacing; verify touch-control clearance and no-zoom behavior across iPhone Safari toolbar states and screen sizes; add audio and stronger shield/hull damage feedback; add more authored mission-specific formations; introduce additional secondary weapons while keeping mobile controls simple; expand bosses and capital ships; add more persistent fighter/loadout choices; add campaign-map and ace-ranking presentation; collect local playtest telemetry for deaths, enemy/bullet density, power-up use, and mission outcomes.
