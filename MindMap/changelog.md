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
- Restored a visible `Projects` control beside the desktop map selector.
- Restored a dedicated desktop Projects dialog for project switching, project creation, project rename, and per-project map counts.

### Changed
- Updated the MindMap page version label from 2.8.1 to 2.8.2.
- Loaded the new `minimap.js` module after the core MindMap application.
- Changed the `template-help.js` cache key from the old `v=2.6.3` URL to a new 2.8.2 title-fix URL so browsers cannot reuse the stale title-overriding script.
- Changed the `story-arc.js` cache key from `v=2.6.2` to a new 2.8.2 title-fix URL so the corrected story-arc code is fetched.
- Changed the `ux-projects.js` cache key to a new 2.8.2 version-fix URL so browsers fetch the corrected project creation logic.
- Changed the `toolbar-system.js` cache key so the restored desktop Projects control is fetched immediately.

### Fixed
- Removed the hard-coded version override from `template-help.js` so it can no longer replace the browser-tab title with an older MindMap version after page load.
- Removed the hard-coded `MindMap 2.6.0` browser-title, toolbar-version, and `MindMapApp.version` override from `story-arc.js`. Its story-template sync was the remaining cause of the tab briefly showing 2.8.2 and then reverting to 2.6.0.
- Removed the hard-coded `2.6.0` map/project version values from `ux-projects.js`. Newly created projects now derive their version from the authoritative page title instead of carrying a separate stale release number.
- Restored the desktop entry point for multi-project management that was lost when the toolbar was rewritten. The existing project registry, active-project switching, project creation/rename, and per-project map grouping are used unchanged.
- Opening the desktop Projects UI now dismisses the Idea inspector first so the two panels cannot stack on top of each other.
- The HTML `<title>` is now the authoritative source for the browser-tab version, while the toolbar reads that same title for its displayed version.

### Implementation notes
- Minimap navigation reuses the existing main SVG pointer-pan behavior so viewport changes continue to flow through the application's existing save/view-state path.
- The minimap observes the rendered SVG and viewport transform, avoiding a second independent layout model that could drift out of sync.
- Story-template rendering still updates Rapidfire labels/placeholders, but no longer owns or mutates the application version.
- `ux-projects.js` now reads the application version from the page title when creating local project/map records, avoiding another independent UI-version constant.
- Desktop project management continues to use the existing `ux-projects.js` registry and switching logic; the Projects dialog is only a UI surface over those controls.
