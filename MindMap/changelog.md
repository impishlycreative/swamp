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
- Added a full-width `Projects` title bar to the Projects sheet so its drag surface matches the Idea inspector more closely.
- Added a `⚡ Rapidfire` button to the Idea inspector so Rapidfire can start directly from the currently selected idea.
- Added a persistent Rapidfire parent-selection prompt when Rapidfire is started without a selected node.

### Changed
- Updated the MindMap page version label from 2.8.1 to 2.8.2.
- Loaded the new `minimap.js` module after the core MindMap application.
- Changed the `template-help.js` cache key from the old `v=2.6.3` URL to a new 2.8.2 title-fix URL so browsers cannot reuse the stale title-overriding script.
- Changed the `story-arc.js` cache key from `v=2.6.2` to a new 2.8.2 title-fix URL so the corrected story-arc code is fetched.
- Changed the `ux-projects.js` cache key to a new 2.8.2 version-fix URL so browsers fetch the corrected project creation logic.
- Changed the `toolbar-system.js` cache key so the restored desktop Projects control is fetched immediately.
- Changed the `toolbar-system.js` cache key again for the corrected Projects drag handler so the deployed page cannot keep the older non-dragging script.
- Changed the `toolbar-system.js` cache key to `1.0.6-projectsheader1` for the full-width Projects drag header.
- Renamed the project selector label from `Project` to `Current project` so the new `Projects` title bar owns the panel heading.
- Rapidfire started without a selection now enters an explicit `Choose a parent idea` mode instead of relying on a short toast and silently waiting.

### Fixed
- Removed the hard-coded version override from `template-help.js` so it can no longer replace the browser-tab title with an older MindMap version after page load.
- Removed the hard-coded `MindMap 2.6.0` browser-title, toolbar-version, and `MindMapApp.version` override from `story-arc.js`. Its story-template sync was the remaining cause of the tab briefly showing 2.8.2 and then reverting to 2.6.0.
- Removed the hard-coded `2.6.0` map/project version values from `ux-projects.js`. Newly created projects now derive their version from the authoritative page title instead of carrying a separate stale release number.
- Restored the desktop entry point for multi-project management that was lost when the toolbar was rewritten. The existing project registry, active-project switching, project creation/rename, and per-project map grouping are used unchanged.
- Opening the desktop Projects UI now dismisses the Idea inspector first so the two panels cannot stack on top of each other.
- Fixed Projects dragging on desktop by detecting the actual visible desktop toolbar instead of disabling drag based on coarse-pointer/touch media queries, which could misclassify touchscreen-capable Windows machines.
- Projects dragging now tracks pointer movement at the window level so panel movement remains reliable after the pointer leaves the header area.
- Expanded the Projects drag target from the small selector label to a dedicated full-width title bar, making its draggable area comparable to the Idea panel header.
- The draggable Projects sheet is clamped inside the MindMap workspace and resets its desktop drag coordinates when switching to the mobile layout.
- Rapidfire parent selection can now be cancelled by clicking anywhere that is not a node; the click continues to its normal target after cancelling.
- Starting Rapidfire from the Idea inspector now closes the Idea inspector before opening the Rapidfire entry dialog, preventing stacked editing panels.
- The HTML `<title>` is now the authoritative source for the browser-tab version, while the toolbar reads that same title for its displayed version.

### Implementation notes
- Minimap navigation reuses the existing main SVG pointer-pan behavior so viewport changes continue to flow through the application's existing save/view-state path.
- The minimap observes the rendered SVG and viewport transform, avoiding a second independent layout model that could drift out of sync.
- Story-template rendering still updates Rapidfire labels/placeholders, but no longer owns or mutates the application version.
- `ux-projects.js` now reads the application version from the page title when creating local project/map records, avoiding another independent UI-version constant.
- Desktop project management continues to use the existing `ux-projects.js` registry and switching logic; `toolbar-system.js` supplies the desktop Projects entry point, panel exclusivity, title bar, and drag behavior without creating a second project model.
- Rapidfire chooser mode visually marks nodes as selectable and keeps a persistent instruction banner visible until the user chooses a node or clicks elsewhere to cancel.
