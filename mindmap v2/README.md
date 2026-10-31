# MindMap V2 3.3.1

A local-first brainstorming and mind-mapping workspace for writers, built around the map as the primary writing surface.

V2 keeps hierarchy, direct idea editing, descriptions, Rapidfire, templates, minimap navigation, focus/collapse, search, drag re-parenting, local autosave, JSON/Word/PDF export, and desktop/mobile interaction. It adds writer-aware relationships, lenses, threads, guided help, story health, consolidation, group layout tools, and a stability layer that keeps Undo and versioning consistent across those features.

## Core writing workflow

- Select an idea to get the compact writer action bar.
- Use **Rapidfire** to capture rough ideas without classifying them while brainstorming.
- Use **Review Ideas** to sort raw Rapidfire ideas, group them, keep them as nodes, or move them into structured parent details.
- Use **Lens** to emphasize the selected idea's useful story context. Muted nodes are intentionally not clickable while the Lens is active. **Clear** returns the map to its normal view and removes any active thread path.
- Use **Link** to connect ideas across branches without changing their parent/child structure.
- Use **Select area** on desktop to drag a box around a cluster of ideas, then press **Space** to give them breathing room while keeping their rough shape.
- Use **Story Threads** to trace larger strands through the existing map.
- Use **Story Health** for objective structural checks such as unresolved setups, clues without payoffs, empty beats, broken links, and explicit needs-work flags.
- Use story templates as working story skeletons with linked brainstorming maps for each beat.

## Group layout

Desktop has a mouse-first **Select area** tool. Click it, drag across blank canvas around the ideas you want, then use **Space**. **Shift + drag** on blank canvas is the faster shortcut.

Spacing uses the current bubble sizes and nearby visible ideas. It pushes crowded selected bubbles apart without flattening the group into a row or grid. The central/root idea stays fixed. The resulting positions are normal saved map positions and can be undone.

The existing multi-select bar also gets **Space**, so Ctrl/Cmd-selected ideas on desktop and long-press multi-selection on touch devices can use the same spacing behavior.

## Navigation

### Writer's Navigator

- Browse the current map as a synchronized hierarchy.
- See the selected idea's path.
- Filter by idea text or description.
- Jump back to an idea and center it on the canvas.
- Collapse or expand branches without leaving the Navigator.

Desktop uses a compact drawer. Mobile uses a full-screen, touch-first Navigator.

### Minimap

The minimap is intended for spatial navigation, especially on long story templates where the initial view deliberately shows only a readable section of the map.

### Story Walk

Story Walk presents the hierarchy as a readable sequence with parent/child and relationship navigation, plus a direct **Show on map** return.

## Relationships

Parent/child structure answers **where an idea belongs**. Relationships answer **how two ideas connect**.

Writer-aware links can infer common relationships such as Clue → Reveal, Setup → Payoff, Character → Scene, and Scene → Location. Relationship routes avoid unrelated visible nodes where possible.

## Undo

As of 3.2.0, meaningful project changes share one chronological Undo history.

- Toolbar Undo and Ctrl/Cmd+Z use the same history.
- Relationships and consolidation no longer need to win against separate feature-specific histories.
- Pan, zoom, viewport movement, and map navigation are ignored by Undo.
- Normal typing is coalesced into useful edit-sized Undo actions.
- Group spacing is stored as normal manual positions, so one spacing operation participates in the same Undo path.

## Versioning

`core-stability.js` is the runtime semantic-version source for V2. Static HTML no longer carries a second semantic version in the page title or toolbar text. Asset URLs use independent build keys for cache refreshes.

## Regression tests

Run:

```bash
node "mindmap v2/tests/regression-tests.js"
```

The suite covers key workflows that have previously regressed, including Undo ordering, collapse/expand/link behavior, consolidation restoration, DOCX consolidated-detail coverage, Review Ideas visibility, Lens clearing, desktop Clear event handling, muted-node interaction, group-layout loading and persistence, mobile-shell loading and toolbar behavior, loader ordering, and changelog naming rules.

## Desktop and mobile

V2 uses one data model but separate responsive treatments.

- Desktop: contextual floating actions, compact Navigator, mouse/keyboard navigation, draggable writer bar, drag-box area selection, and group spacing.
- Mobile: a stable top bar for map/global actions and a stable bottom bar for selected-node actions. The bottom bar exposes **Edit, Rapidfire, Lens, Link, More**; the node's own `+` remains the direct Add action. Mobile also keeps touch-sized sheets, safe-area spacing, full-screen Navigator, and **Space** through long-press multi-selection.

## Persistence

Projects remain local-first in browser storage unless exported. JSON exports retain V2 extension data such as relationships and writer metadata.

## Key files

- `index.html` — V2 entry point and loader order.
- `core-stability.js` — semantic version source and unified Undo coordination.
- `app.js` — base map data model, rendering, editing, storage, and core interactions.
- `writer-map.js` — writer-aware map behavior.
- `consolidation.js` — Rapidfire review and parent-detail consolidation.
- `group-layout.js` — desktop area selection and shared group spacing.
- `mobile-shell.js` — stable mobile toolbar/layout shell and selected-node action bar.
- `v2-experience.js` — Navigator, relationships, Story Walk, Zen, and integration behavior.
- `relationship-routing.js` — collision-aware relationship routing.
- `lens-clear-fix.js` — reliable Lens/Thread clearing and Lens interaction locking.
- `guide-help.js` — contextual help and guided tours.
- `tests/regression-tests.js` — executable regression checks.
- `changelog.md` — required running change history.

## Maintenance rules

- Update `mindmap v2/changelog.md` whenever V2 changes.
- Keep changelog entries focused on Swamp behavior and implementation; do not name other products there.
- UI changes must work on desktop and mobile.
- Mobile behavior must be designed mobile-first rather than treated as a compressed desktop layout.
- Prefer one click/tap for the common action, two for a less-common variation, and three only for destructive, advanced, rare, or critical actions.
