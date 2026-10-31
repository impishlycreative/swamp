# MindMap V2 3.2.1

A local-first brainstorming and mind-mapping workspace for writers, built around the map as the primary writing surface.

V2 keeps hierarchy, direct idea editing, descriptions, Rapidfire, templates, minimap navigation, focus/collapse, search, drag re-parenting, local autosave, JSON/Word/PDF export, and desktop/mobile interaction. It adds writer-aware relationships, lenses, threads, guided help, story health, consolidation, and a stability layer that keeps Undo and versioning consistent across those features.

## Core writing workflow

- Select an idea to get the compact writer action bar.
- Use **Rapidfire** to capture rough ideas without classifying them while brainstorming.
- Use **Review Ideas** to sort raw Rapidfire ideas, group them, keep them as nodes, or move them into structured parent details.
- Use **Lens** to emphasize the selected idea's useful story context. **Clear** returns the map to its normal view and removes any active thread path.
- Use **Link** to connect ideas across branches without changing their parent/child structure.
- Use **Story Threads** to trace larger strands through the existing map.
- Use **Story Health** for objective structural checks such as unresolved setups, clues without payoffs, empty beats, broken links, and explicit needs-work flags.
- Use story templates as working story skeletons with linked brainstorming maps for each beat.

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

## Versioning

`core-stability.js` is the runtime semantic-version source for V2. Static HTML no longer carries a second semantic version in the page title or toolbar text. Asset URLs use independent build keys for cache refreshes.

## Regression tests

Run:

```bash
node "mindmap v2/tests/regression-tests.js"
```

The suite covers key workflows that have previously regressed, including Undo ordering, collapse/expand/link behavior, consolidation restoration, DOCX consolidated-detail coverage, Review Ideas visibility, Lens clearing, loader ordering, and changelog naming rules.

## Desktop and mobile

V2 uses one data model but separate responsive treatments.

- Desktop: contextual floating actions, compact Navigator, mouse/keyboard navigation, draggable writer bar.
- Mobile: canvas-first editing, touch-sized actions, full-screen Navigator, bottom-oriented sheets, safe-area-aware controls, and compact map navigation.

## Persistence

Projects remain local-first in browser storage unless exported. JSON exports retain V2 extension data such as relationships and writer metadata.

## Key files

- `index.html` — V2 entry point and loader order.
- `core-stability.js` — semantic version source and unified Undo coordination.
- `app.js` — base map data model, rendering, editing, storage, and core interactions.
- `writer-map.js` — writer-aware map behavior.
- `consolidation.js` — Rapidfire review and parent-detail consolidation.
- `v2-experience.js` — Navigator, relationships, Story Walk, Zen, and integration behavior.
- `relationship-routing.js` — collision-aware relationship routing.
- `lens-clear-fix.js` — reliable Lens/Thread clear handling across strip rebuilds.
- `guide-help.js` — contextual help and guided tours.
- `tests/regression-tests.js` — executable regression checks.
- `changelog.md` — required running change history.

## Maintenance rules

- Update `mindmap v2/changelog.md` whenever V2 changes.
- Keep changelog entries focused on Swamp behavior and implementation; do not name other products there.
- UI changes must work on desktop and mobile.
- Mobile behavior must be designed mobile-first rather than treated as a compressed desktop layout.
- Prefer one click/tap for the common action, two for a less-common variation, and three only for destructive, advanced, rare, or critical actions.
