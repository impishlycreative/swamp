# MindMap V2 Changelog

## 3.0.0 — 2026-10-31

### Foundation

- Forked the complete current `MindMap` application into `mindmap v2` so V2 can evolve independently while retaining the existing local-first project/map data model and browser storage compatibility.
- Set the HTML title to `MindMap 3.0.0 V2 — Swamp` directly in the document to avoid the old-version browser-tab flash during startup.
- Kept desktop and mobile on one data model while adding separate responsive treatments for the new V2 surfaces.

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
