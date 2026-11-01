# Changelog

All notable Space Fighters changes are tracked here.

## 0.2.2 — 2026-11-01

### Fixed

- Prevented iPhone Safari from treating gameplay finger movement as page pan or zoom gestures.
- Added explicit suppression for Safari pinch gesture events, rapid double-tap zoom, and touch-move scrolling on the combat canvas and touch-control surface.
- Added tighter viewport scaling constraints and touch-action/callout protections for gameplay controls.
- Kept menu panels scrollable by limiting the gesture lock to gameplay surfaces instead of the whole application.

## 0.2.1 — 2026-11-01

### Fixed

- Lifted the mobile joystick and FIRE/MISSILE controls above iPhone Safari's visible bottom browser toolbar.
- Kept the full-screen combat canvas while reserving extra bottom clearance only for coarse-pointer browser mode on iOS/WebKit.
- Added a cache-busting version query for `game.js` and synchronized visible/browser-title version branding to 0.2.1.

## 0.2.0 — 2026-10-31

### Changed

- Reworked the campaign difficulty curve using the researched Space Fighters Game Design Guide.
- Rebuilt Mission 01 as an authored onboarding mission with deliberate waves, breathers, and guaranteed power-ups.
- Added per-mission caps for active enemies, simultaneous firing enemies, enemy bullets, and total threat.
- Flattened recovery-branch difficulty so R1/R2/R3 remain near the corresponding main-mission tier instead of becoming automatic difficulty spikes.
- Reduced early enemy projectile speeds and scale projectile speed progressively by campaign tier.
- Reduced early mission kill targets and enemy saturation.
- Added threat-aware wave spawning so later waves wait when the current encounter is still at its cap.
- Reduced the player's damaging collision radius relative to the visible fighter silhouette.
- Improved respawn recovery by clearing nearby bullets and offering limited recovery assistance after repeated deaths.
- Increased recovery-mission power-up assistance.
- Replaced desktop left/right velocity steering with direct mouse-X destination control.
- Updated desktop control copy and kept keyboard movement fallbacks.
- Migrated earlier 0.1.x browser save data to a stable save key where possible.

### Removed

- Removed the separate `desktop-controls.js` compatibility layer; desktop input is now handled directly by the main game code.

## 0.1.1 — 2026-10-31

### Added

- Initial desktop mouse steering experiment.
- Right-click missile input.

## 0.1.0 — 2026-10-31

### Added

- First playable Space Fighters prototype.
- Fixed top-down camera and continuous forward-scrolling battlefield.
- Forward-facing fighter with unrestricted 2D translation inside the viewport.
- Keyboard and mobile touch movement controls.
- Hold-to-fire primary weapon with tap bursts.
- Missile secondary weapon.
- Shield, hull, lives, death and nearby respawn systems.
- Temporary power-ups that are lost on death.
- Persistent upgrade hangar using browser local storage.
- Credits and basic campaign progression persistence.
- Progressive enemy roster: scouts, strikers, bombers, gunships, aces and carrier.
- Kill, survival, defense and boss mission objective types.
- Main campaign path plus failure/recovery branches.
- Brief skippable mission briefings.
- Responsive HUD and mobile-first control surface.
- Retro-arcade/modern-sci-fi canvas presentation.
