# MindMap V2 — 3.0.0

MindMap V2 builds directly on the existing Swamp MindMap codebase. It keeps the current local-first project/map model, direct manipulation, Rapidfire, templates, minimap, exports, and mobile canvas behavior, then adds a writer-focused navigation and relationship layer.

## New in V2

### Writer's Navigator

A synchronized hierarchical outline for the current map.

- Shows every idea in story/branch order.
- Shows breadcrumbs for the selected idea.
- Displays map pulse stats: idea count, notes, free relationships, and maximum depth.
- Filters by idea text or description.
- Shows note, child, and relationship indicators without cluttering the main canvas.
- Selecting an outline item returns to and centers that idea on the map.
- Branches can be collapsed/expanded from the outline.
- Mobile uses a full-screen, touch-first navigator; desktop uses a compact slide-in panel.

### Cross-branch Idea Links

The original parent/child tree remains intact, but V2 can also express relationships between ideas on different branches.

- Select an idea and choose **Link ideas**.
- Tap/click a second idea.
- Add an optional relationship label.
- Choose directional, bidirectional, or non-directional linking.
- Relationship curves follow ideas while branches move.
- Tap/click a relationship line or label to edit or delete it.
- Relationships are stored on the map as `relationships` and therefore persist in local storage and JSON map/project export.
- Immediate Ctrl/Cmd+Z after a relationship edit restores the previous relationship state.

### Story Walk

A presentation/reading mode built for writers rather than slide decks.

- Walks through the hierarchy in story order.
- Shows the current idea at large readable scale with its description.
- Shows breadcrumbs, child ideas, and cross-branch relationships as direct navigation choices.
- Supports previous/next, parent navigation, keyboard arrows, and horizontal swipe on touch screens.
- Linked story-template maps can be opened without leaving Story Walk.
- **Show on map** exits Story Walk and centers the current idea.

### Zen Canvas

A distraction-free canvas that hides editing chrome while keeping the map interactive.

- Press `Z` or choose **Zen canvas**.
- A small **Exit Zen** control remains available on touch and desktop.

## Keyboard additions

- `Ctrl/Cmd + Shift + O` — Writer's Navigator
- `Ctrl/Cmd + Shift + L` — Link ideas
- `Ctrl/Cmd + Shift + P` — Story Walk
- `Z` — Zen Canvas

## Design inspiration researched for V2

- XMind: synchronized Outliner, Zen Mode, and Pitch Mode.
- Obsidian Canvas: labelled freeform relationships and navigation across connected cards.
- Heptabase: mobile whiteboard navigation, mobile minimap/search, hierarchical whiteboard navigation, smart guides, and stronger mobile toolbars.
- MindNode: branch-focused navigation and reduced-context Focus Mode.

The intent is not to clone those products. V2 takes the interaction ideas that fit Swamp's writer-first, local-first model and folds them into the existing application without turning the map into a generic whiteboard.
