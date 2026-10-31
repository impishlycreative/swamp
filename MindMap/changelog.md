# MindMap Changelog

## 2026-10-31 — 2.9.1

### Changed
- Bumped the MindMap release from 2.9.0 to 2.9.1 for the desktop Ctrl/Command-click multi-select fix.
- Changed the `multi-select.js` cache key to `2.9.1-ctrlfix1` so browsers fetch the corrected selection logic immediately.

### Fixed
- Fixed Ctrl-click and Command-click multi-select immediately clearing itself after a node was selected.
- The internal synthetic map click used to clear the app's normal single-node selection is now distinguished from a real empty-map click, so it no longer clears the multi-select set.

### Implementation notes
- The core application continues to derive `MindMapApp.version` from the authoritative HTML title, so the 2.9.1 page version is also used for runtime map/project metadata.

## 2026-10-31 — 2.9.0

### Added
- Added multi-select branch handling for brainstorming maps. On desktop, Ctrl-click or Command-click toggles ideas into the selection; on mobile, long-press enters multi-select and subsequent taps toggle ideas.
- Added a floating multi-select action bar with `Delete` and `Clear` controls. On mobile it sits above the bottom toolbar.
- Selected branches can be dragged together onto another node to make that node their new parent.

### Changed
- Bumped the MindMap release from 2.8.2 to 2.9.0 because multi-select and batch branch reparenting are new user-facing functionality rather than a patch-only fix.
- Loaded `multi-select.js` with the `2.9.0-multiselect1` cache key on desktop and mobile.
- Changed the core `app.js` version source from the stale hard-coded `2.0.0` value to the authoritative MindMap version in the page title, with `2.9.0` as the fallback.
- Changed the `app.js` cache key to `2.9.0-coreversion1` so browsers fetch the corrected core version logic immediately.
- Changed `ux-projects.js` to prefer `MindMapApp.version`, then the page title, with `2.9.0` as its final fallback when creating new project/map records.
- Changed the `ux-projects.js` cache key to `2.9.0-version1` so browsers fetch the aligned project-version logic immediately.

### Fixed
- Multi-select prevents the root idea from being selected, moved, or deleted.
- Multi-select prevents cycles by rejecting any drop target that is part of one of the branches currently being moved.
- Selecting a parent branch automatically absorbs separately selected descendants so the same subtree is never moved or deleted twice.
- `MindMapApp.version`, newly created maps/projects, normalized imports, and saved map metadata now report the 2.9.0 release instead of being rewritten to the old `2.0.0` core constant.
- Removed the remaining `2.8.2` fallback from project creation so the project module cannot silently create records under an older release if the title lookup ever fails.

### Implementation notes
- Multi-select uses the same map hierarchy data (`parentId`) as normal branch dragging. Reparenting moves each selected branch root while preserving all descendants beneath it.
- Mobile multi-select uses a long-press gesture so it does not depend on keyboard modifiers; normal single-node controls remain available outside multi-select mode.
- The HTML `<title>` remains the single release-version source used by the toolbar and core application; project creation consumes `MindMapApp.version` first, reducing the chance of future UI/data version drift.

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
- Changed the `rapidfire.js` cache key to `2.8.2-parentchooser1` so the improved parent-selection flow and Idea-panel Rapidfire action are fetched immediately.
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
