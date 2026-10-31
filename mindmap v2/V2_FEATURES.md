# MindMap V2 — 3.2.3

MindMap V2 is built around one rule: the map is the writing workspace. Supporting features should make the map easier to think with, navigate, connect, and clean up rather than turn the application into a collection of separate screens.

## Map-first writing features

### Context actions

Selecting an idea exposes the small writer action bar. The everyday actions stay close to the node: Edit, Rapidfire, Lens, Link, and More. Context-only actions appear when they are actually useful, such as Review Ideas on a parent with raw Rapidfire children.

### Writer-aware idea types

Types exist when they change application behavior. Current useful types include Idea, Scene, Chapter, Character, Location, Clue, Reveal, Subplot, Research, Setup, Payoff, and story-template beats.

Types influence Rapidfire prompts, Lens behavior, smart links, consolidation categories, Story Health, and some child defaults.

### Rapidfire and consolidation

Rapidfire is capture-first. New Rapidfire children stay raw and generic while brainstorming.

Afterward, Review Ideas can:

- move selected ideas into structured parent details;
- group them under category headings;
- keep them as normal map nodes.

Suggested categories depend on the parent context. Consolidated details remain part of the map data and are included in Word export.

### Lenses

Lens temporarily emphasizes useful context around the selected idea while dimming unrelated material. Different writer types use different context rules.

Muted nodes, muted hierarchy connections, and muted cross-branch relationships do not accept pointer interaction while the Lens is active. **Clear** lets the writer Lens module clear its own private state first; the safety layer checks afterward and only uses a fallback if a Lens or Thread remains active.

### Story Threads

Threads mark larger story strands that cut across the parent/child hierarchy. Active threads are shown as paths through their mapped nodes.

### Cross-branch relationships

Relationships connect ideas without changing hierarchy. Smart two-click linking can infer common relationships from writer types. Relationship routing tries alternate curves to avoid unrelated visible nodes and labels.

### Story Health

Story Health reports objective structural facts the map can prove, including unresolved setups, clues without reveals/payoffs, empty linked beats, broken relationships, one-point threads, and explicit needs-work markers.

It is not intended to judge prose or story quality.

### Story templates

Story templates create a working overview plus linked brainstorming maps for individual beats. Newly created templates start on a readable opening section rather than shrinking the complete structure to fit the screen. The minimap is used to navigate the rest.

## Navigation

### Writer's Navigator

The Navigator is a secondary navigation surface for large maps. It provides hierarchy, path context, filtering, metadata, and one-click return to an idea on the canvas.

### Minimap

The minimap answers the spatial question: where am I on this large canvas? It is especially important for long story-template maps.

### Story Walk

Story Walk presents the hierarchy as a readable sequence and provides parent, child, related-idea, and linked-map navigation.

### Zen Canvas

Zen Canvas hides unnecessary chrome while keeping the map usable.

## Help

Help and guided tours are context-based. The writer chooses what they are trying to do, such as learning the map, building a story, developing a character or scene, tracking clues/payoffs, working a subplot, or using a story template.

Tour and help copy is intentionally short and plain English.

## Stability architecture introduced in 3.2.0

### Unified Undo

Meaningful saved project changes feed one chronological Undo history. The history intentionally ignores view-only movement such as pan and zoom.

The unified history covers both base-map and V2 data because it watches the saved project state rather than requiring each feature to maintain its own competing stack.

### Central semantic version

`core-stability.js` is the runtime semantic-version source. The static page title and toolbar do not declare their own semantic version. Asset query strings use independent build identifiers for cache control.

### Relationship routing separation

Relationship path routing is handled by `relationship-routing.js`. Routing no longer carries separate Undo responsibilities.

### Regression tests

`tests/regression-tests.js` checks the workflows most likely to break when systems interact, including:

- collapse → expand → link → Undo ordering;
- ignoring pan/zoom in Undo history;
- text-edit coalescing;
- consolidation restoration;
- consolidated details remaining covered by DOCX exporters;
- Review Ideas remaining reachable from a selected parent;
- Lens/Thread Clear remaining reachable after the strip rebuilds;
- Lens Clear resetting the actual Lens state;
- normal desktop Clear clicks reaching the writer module;
- muted Lens content remaining non-interactive;
- centralized loader/version ordering;
- changelog naming rules.

Run with:

```bash
node "mindmap v2/tests/regression-tests.js"
```

## Interaction rules

- One click/tap does the common thing.
- Two clicks/taps handle a less-common variation.
- Three interactions are reserved for destructive, advanced, rare, or critical actions.
- Desktop and mobile share data and behavior, but mobile UI is designed touch-first rather than compressed from desktop.
