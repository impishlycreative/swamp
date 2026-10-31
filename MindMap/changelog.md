# MindMap Changelog

## 2026-10-31 — 2.8.2

### Added
- Added an interactive minimap in the lower-right of the MindMap workspace.
- The minimap renders the currently visible idea hierarchy and connections.
- Added a highlighted viewport rectangle showing which part of the full map is currently on screen.
- Click or drag inside the minimap to move the main map viewport.
- Arrow keys pan the map when the minimap canvas has keyboard focus.
- The minimap updates automatically during pan, zoom, Fit, Focus mode, branch collapse/expand, map switching, and resizing.
- Added a compact mobile minimap layout above the bottom toolbar.
- Added a collapse/restore control; the collapsed state is remembered locally.
- The minimap is excluded from print/PDF output.

### Changed
- Updated the MindMap page version label from 2.8.1 to 2.8.2.
- Loaded the new `minimap.js` module after the core MindMap application.
- Changed the `template-help.js` cache key from the old `v=2.6.3` URL to a new 2.8.2 title-fix URL so browsers cannot reuse the stale title-overriding script.

### Fixed
- Removed the hard-coded version override from `template-help.js` so it can no longer replace the browser-tab title with an older MindMap version after page load.
- The HTML `<title>` is now the authoritative source for the browser-tab version, while the toolbar reads that same title for its displayed version.

### Implementation notes
- Minimap navigation reuses the existing main SVG pointer-pan behavior so viewport changes continue to flow through the application's existing save/view-state path.
- The minimap observes the rendered SVG and viewport transform, avoiding a second independent layout model that could drift out of sync.
