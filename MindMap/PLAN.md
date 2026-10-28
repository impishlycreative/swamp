# MindMap Product Plan

## Goal

Build a web-based authenticated brainstorming and mind-mapping workspace that feels exceptionally polished while remaining extremely fast to use. The application begins with a central concept and lets the user grow ideas outward without manually arranging every new item.

The product should combine the strongest ideas found in Miro, FigJam, XMind, MindMeister, MindNode, Whimsical, Ayoa, Lucidspark, MindManager, Coggle, and Scrapple while avoiding the common complaints found in user reviews: clutter, slowdown, feature bloat, difficult navigation, and awkward transitions between brainstorming and structured mapping.

## Core model

- A map begins with one central concept.
- Every item is an **idea**, not a “node” in the user interface.
- Selecting an idea exposes the ability to add another idea from it.
- New first-level ideas automatically distribute evenly around the central concept.
- Deeper ideas fan outward from their parent so branches naturally continue away from the centre.
- Connections can carry their own labels.
- Ideas have editable text and colours.
- Map organization, colours, labels, collapsed state, and view state are preserved during export/import.

## Hard interaction-budget rule

This is a product requirement, not a guideline:

- **Common actions: 1 interaction whenever the working context is already selected.**
- **Routine/secondary actions: no more than 2 interactions.**
- **Anything else: 3 interactions maximum.**
- The same rule applies on desktop and mobile.
- Important features must not be buried in nested menus simply to make the interface appear minimal.

Minimalism should come from strong defaults, contextual controls, and progressive presentation.

### Examples

- Add an idea from the selected idea: 1 action.
- Add using the selected idea’s on-canvas `+`: 1 action.
- Edit selected idea text: immediately available.
- Change colour: select idea, choose colour — at most 2 actions.
- Label a connection: select child idea, type label — at most 2 actions.
- Collapse/expand, focus, centre, or delete: select idea, choose action — at most 2 actions.
- Search and jump: open search, select result — 2 actions.
- New map: New, confirm — 2 actions.
- Export, import, zoom, fit, and lock remain directly exposed.

## Rapid idea capture

Adding an idea should never require a multi-screen flow.

When Add Idea is invoked:

1. Create the child immediately.
2. Position it automatically.
3. Select it automatically.
4. Put keyboard focus directly into its text so the user can type.

The selected idea also receives a direct on-canvas `+` affordance.

## Visual design

The interface should feel calm, balanced, elegant, and desirable to use.

Design direction:

- Warm neutral canvas rather than stark white.
- Soft depth and restrained shadows.
- Rounded idea shapes and controls.
- Muted, harmonious colour palette.
- Smooth radial composition.
- Clear selection halo.
- Minimal permanent chrome.
- Strong typography and whitespace.
- Attractive enough that visual quality itself encourages use.

MindNode is an important reference for visual cleanliness. Miro/FigJam are references for freeform speed. XMind/MindMeister are references for structural clarity. Whimsical is a reference for effortless visual polish. Ayoa/MindManager are references for eventually moving from ideas toward action. Scrapple is a reference for flexible relationships and connection labelling rather than forcing every relationship into rigid hierarchy.

## Scale and clutter control

Design for large maps from the beginning.

- Collapsible branches.
- Focus mode that isolates one branch.
- Search and jump-to-idea.
- Fit and recenter controls.
- Progressive disclosure of editing controls.
- Local branch layout rather than destructive global rearrangement where possible.
- Preserve manual intent if future versions introduce manual positioning.
- Eventually render only visible content and load deep branches on demand as map sizes grow.

## Data architecture

Ideas should be stored as structured objects and relationships independently from the rendered visual layout.

This allows future views of the same data without duplication:

- Mind map
- Outline
- Cards
- Timeline
- Tasks

The visual map is a view of the underlying idea graph, not the sole representation of the data.

## Persistence — v1

Initial release is local-first:

- Browser `localStorage` autosave.
- JSON export.
- JSON import.
- Export/import must preserve structure, colours, connection labels, collapsed state, and view state.

## Authentication — v1

The current static release uses a browser-local workspace lock based on Web Crypto PBKDF2. It is a local privacy gate, not true server-backed identity authentication.

A future hosted release can replace this with proper account authentication and server/cloud persistence while preserving the same map data model.

## Desktop and mobile

Use one responsive application rather than separate products.

### Desktop

- Full toolbar labels when space permits.
- Right-side inspector.
- Wheel zoom.
- Pointer/mouse panning.
- Keyboard shortcuts for frequent operations.

### Mobile

- Compact toolbar with large touch targets.
- Inspector becomes a bottom sheet.
- One-finger canvas panning.
- Two-finger pinch zooming.
- No multi-level mobile menu that violates the interaction budget.

Touch targets should be approximately 44 px where practical.

## Current v1.1 implementation

Implemented in `MindMap/index.html`:

- Central concept.
- Automatic radial first-level spacing.
- Outward branch fanning.
- Direct Add Idea button.
- Direct on-canvas `+` for selected ideas.
- Immediate creation and text focus when adding.
- Idea colour editing.
- Connection labels.
- Collapse/expand.
- Focus mode.
- Search and jump.
- Recenter and fit.
- Pan and zoom.
- Mobile pinch zoom.
- Local autosave.
- JSON export/import.
- Browser-local workspace lock.
- Responsive desktop/mobile inspector behavior.
- Link back to the Swamp root.

## Core product principle

**Do not remove capability to reduce complexity. Reveal complexity only when it becomes relevant — and never make the user hunt for something they reasonably expect to reach in one, two, or at most three actions.**
