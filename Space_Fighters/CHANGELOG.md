# Changelog

All notable Space Fighters changes are tracked here.

## 0.1.1 — 2026-10-31

### Added

- Desktop mouse-controlled lateral steering: move the pointer left or right of the combat area's centre to steer in that direction.
- Right-click missile launch on desktop.
- Dedicated `desktop-controls.js` input layer so desktop mouse controls do not interfere with mobile touch controls.

### Changed

- Desktop forward/back movement is now documented around W/S while A/D and arrow movement remain available as fallbacks.
- Browser context menu is suppressed over the combat canvas so right-click can be used for missiles.

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
