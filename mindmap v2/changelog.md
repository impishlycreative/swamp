# MindMap V2 Changelog

## 3.0.0 — 2026-10-31

### Foundation

- Forked the complete current `MindMap` application into `mindmap v2` so V2 can evolve independently while retaining the existing local-first project/map data model and browser storage compatibility.
- Set the HTML title to `MindMap 3.0.0 V2 — Swamp` directly in the document to avoid the old-version browser-tab flash during startup.
- Kept desktop and mobile on one data model while adding separate responsive treatments for the new V2 surfaces.
- Added **MindMap V2** to the repository root `index.html` under Visual experiments, linking directly to `mindmap v2/index.html`.

### Writer-first map interactions

- Added a context-sensitive writer action bar directly beside the selected map node on desktop and above the bottom toolbar on mobile.
- Kept common actions on the map itself: Add, Rapidfire, Lens, Link, Type, Thread, Health, and Branch actions are available from the selected idea without navigating to a separate application view.
- Added writer-specific node types for scenes, chapters, characters, locations, conflicts, themes, clues, reveals, subplots, objects, research, setups, and payoffs.
- Added unobtrusive type and story-thread badges directly to map bubbles.
- Added story threads with one-click map highlighting so Main Plot, Character Arc, Mystery, Romance, Subplot, Foreshadowing, and custom threads can be isolated without leaving the canvas.
- Added stronger map lenses that highlight the selected idea's useful story context and dim unrelated material. Character, scene, clue, setup, chapter, subplot, and template-beat lenses use their existing hierarchy and cross-links rather than creating duplicate views.
- Added writer-aware two-click relationships. Selecting **Link** and then another node immediately creates a sensible relationship such as Clue → Reveal, Setup → Payoff, Character → Scene, Scene → Location, Conflict, or Character Relationship when the node types make the intent clear.
- Added context-aware Rapidfire prompts so brainstorming stays short and changes with the selected idea type, including scene turns, character wants/secrets, location details, clue meanings, and template-beat possibilities.
- Made existing story-template beats recognizable as writer-aware map objects and added a direct **Ideas** action for linked beat brainstorming maps.
- Added Story Health overlays directly on the map for unresolved setups/clues, disconnected characters, empty template beats, explicitly marked needs-work ideas, and broken cross-links. Clicking a health item returns directly to the affected node.
- Added branch-level operations for collapse/expand, deep duplication, automatic positioning, and marking/clearing needs-work status. Duplicating a branch also duplicates relationships contained entirely inside that branch.
- Added smart child defaults so children created beneath Chapter or Subplot nodes become Scenes automatically while other contexts remain lightweight ideas.
- Enhanced the existing Writer's Navigator with node type and story-thread metadata while keeping the map as the source of truth.
- Applied the one-click/two-click interaction rule: frequent actions are immediate, variations use a second selection, and destructive actions remain outside the fast context bar.
- Added a mobile-first writer action strip with touch-sized controls rather than shrinking the desktop interaction model.

### Selected-node UI refinement

- Changed normal node selection so it no longer opens the full inspector automatically; selecting a node now keeps the map visible and shows the compact writer action bar only.
- Added a direct **Edit** action to the writer bar. Clicking node text also opens the inspector intentionally, so detailed editing is available when requested rather than competing with the map.
- Removed the redundant **Add Idea** action from the writer bar because the selected node already has the one-click `+` child control on the canvas.
- Moved **Story Health** out of the fast bar and into **More**, keeping it available in two interactions while reducing clutter.
- Renamed ordinary **Branch** access to **More**; linked template beats retain the direct one-click **Ideas** action.
- Added a desktop drag handle to the writer bar. The bar can be dragged anywhere in the viewport and remembers its dropped position locally.
- Added double-click on the drag handle to reattach the writer bar to the selected node.
- Consolidated mobile selected-node actions into the writer action strip and hid the older duplicate mobile bottom toolbar, leaving one touch-oriented action surface.
- Added a new cache key for the writer loader so browsers fetch the updated interaction model immediately.

### Writer's Navigator

- Added a synchronized hierarchical outline with breadcrumbs.
- Added live map statistics for ideas, notes, relationships, and hierarchy depth.
- Added idea/description filtering.
- Added note, child-count, and relationship indicators.
- Added map selection/centering from the outline.
- Added branch collapse/expand controls from the navigator.
- Added a mobile-first full-screen navigator and a compact desktop slide-in panel.

### Cross-branch relationships

- Added labelled free relationships between ideas without changing the parent/child hierarchy.
- Added forward, bidirectional, and non-directional relationship modes.
- Added relationship line/label editing and deletion.
- Added relationship rendering that follows node positions while the map changes.
- Persisted relationships in the map JSON as `relationships`, which is retained by local save and JSON export/import.
- Added immediate Ctrl/Cmd+Z support for relationship edits.

### Story Walk

- Added an immersive hierarchy walkthrough for presenting and reviewing a map.
- Added previous/next, parent, breadcrumb, child, and related-idea navigation.
- Added keyboard arrow navigation and horizontal swipe navigation on touch devices.
- Added linked-map navigation inside Story Walk.
- Added **Show on map** to exit and center the current idea.

### Zen Canvas

- Added distraction-free canvas mode with one-tap/one-key exit.
- Added `Z` shortcut.

### Access and shortcuts

- Added desktop toolbar controls for Navigator, Link, Story Walk, and Zen.
- Added a direct Navigator control to the mobile top toolbar.
- Added V2 actions to the mobile utility sheet and selected-idea inspector.
- Added `Ctrl/Cmd+Shift+O`, `Ctrl/Cmd+Shift+L`, and `Ctrl/Cmd+Shift+P` shortcuts and documented them in the existing shortcuts dialog.

### Research used

- Reviewed current XMind Outliner/Zen/Pitch behavior, Obsidian Canvas connections/groups/navigation, MindNode Focus Mode, and Heptabase's 2026 mobile whiteboard/navigation updates before selecting V2 features.
