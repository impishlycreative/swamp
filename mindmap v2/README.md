# MindMap V2 3.0.0

A local-first brainstorming and mind-mapping workspace for writers, built on the existing Swamp `MindMap` application.

V2 retains the current project/map model, automatic radial layout, direct idea editing, descriptions, Rapidfire, story templates, minimap, focus/collapse, search, drag re-parenting, local autosave, JSON/Word/PDF export, and desktop/mobile interaction model. It adds a second layer for navigating and connecting a large body of ideas without turning the app into a generic whiteboard.

## V2 highlights

### Writer's Navigator

Open the Navigator with the `☷` control or `Ctrl/Cmd+Shift+O`.

- Browse the map as a synchronized hierarchy.
- See the path to the selected idea as breadcrumbs.
- Filter by idea text or description.
- See idea, note, relationship, and depth counts.
- Jump back to any visible idea and center it on the map.
- Collapse or expand branches from the outline.

Desktop uses a compact right-side drawer. Mobile uses a full-screen touch-first navigator so the outline is readable instead of being squeezed beside the canvas.

### Cross-branch Idea Links

The parent/child tree remains the structural backbone. V2 relationships add a separate semantic layer between ideas on different branches.

1. Select the source idea.
2. Choose **Link ideas** (`↗`) or press `Ctrl/Cmd+Shift+L`.
3. Tap/click another idea.
4. Add an optional label and choose `→`, `↔`, or `—`.

Relationship lines follow idea positions, can be tapped/clicked to edit, and are stored in the map's `relationships` array. JSON map/project export retains them automatically.

### Story Walk

Open Story Walk with `▶` or `Ctrl/Cmd+Shift+P`.

Story Walk presents the hierarchy as a readable sequence. Each step shows the idea, its description, breadcrumb path, child ideas, and any V2 relationships. Use previous/next, move to the parent, choose a child/related idea, or open linked story-template maps. Touch devices also support horizontal swipe navigation.

### Zen Canvas

Press `Z` or choose **Zen canvas** to hide editing chrome and leave the map dominant. **Exit Zen** remains visible on both desktop and mobile.

## Existing core interactions retained

- Click/tap an idea to select it.
- Click idea text to edit inline.
- Double-click/double-tap an idea to add a child.
- Drag a non-root idea onto another idea to re-parent the branch.
- Drag to empty space to pin a manual position.
- Click/tap a hierarchy connection to edit its label.
- Use Rapidfire for repeated sibling idea entry.
- Use Focus and Collapse to control large maps.
- Use search, fit, center, pan, zoom, and the minimap to navigate.
- Export a map/project as JSON, the outline as Word, or the visual map as PDF.

## Desktop and mobile

V2 uses one application/data model but does not drop the desktop UI onto a phone.

- Desktop: contextual floating editing, compact Navigator drawer, toolbar access to V2 modes, mouse/keyboard navigation.
- Mobile: canvas-first editing, bottom actions, direct top Navigator control, full-screen Navigator, bottom-sheet dialogs, touch-sized relationship targets, swipe Story Walk navigation, and safe-area-aware layouts.

## Persistence

The application remains local-first and stores projects in browser storage. V2 intentionally keeps the existing storage key so current MindMap projects remain available. New `relationships` data uses the schema's allowed extension fields, so the original app can retain the data even when it does not render V2 relationship lines.

## V2 files

- `index.html` — V2 entry point and fixed 3.0.0 browser title.
- `v2-experience.js` — Navigator, relationships, Story Walk, Zen, shortcuts, and integration layer.
- `v2-experience.css` — responsive V2 interface and SVG relationship styling.
- `V2_FEATURES.md` — design rationale and feature reference.
- `changelog.md` — required running changelog.

## Maintenance rule

Update `mindmap v2/changelog.md` whenever V2 changes. UI changes must be implemented for both desktop and mobile; mobile behavior should be designed mobile-first rather than treated as a compressed desktop layout.
