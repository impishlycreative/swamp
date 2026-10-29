# MindMap Product Plan

## Goal

Build a web-based authenticated brainstorming and mind-mapping workspace that feels exceptionally polished while remaining extremely fast to use. The application begins with a central concept and lets the user grow, edit, reorganize, and relate ideas with direct manipulation rather than menu-heavy workflows.

## Core model

- A map begins with one central concept.
- Every item is an **idea**, not a “node” in the user interface.
- Ideas form parent/child branches but may be reorganized by dragging a branch to a different parent.
- New first-level ideas automatically distribute evenly around the central concept.
- Deeper ideas fan outward from their parent.
- Connections can carry editable labels.
- Ideas have editable text and colours.
- Structure, colours, labels, collapsed state, and view state persist through export/import.

## Hard interaction-budget rule

- Common actions: 1 interaction whenever the context is already selected.
- Routine/secondary actions: no more than 2 interactions.
- Anything else: 3 interactions maximum.
- Same rule on desktop and mobile.
- Important features must not be buried in nested menus merely to make the interface look minimal.

### Direct-manipulation requirements

These are core product behaviours:

- **Double-click / double-tap an idea:** create a child idea immediately.
- **Click existing idea text:** edit the text inline on the canvas without requiring the properties dialog.
- **Press Enter while inline-editing idea text:** commit the edit only; never interpret that Enter as Add Idea.
- **Click a connection line or its label:** add, edit, remove, or relabel connection text inline.
- Connection lines must have a forgiving hit target larger than the visible stroke.
- **Drag an idea onto another idea:** re-parent that idea and its entire descendant branch under the new parent.
- During a drag, the branch and its join must visibly follow the pointer. When hovering a valid new parent, the join must preview the new connection before drop.
- Once a dragged branch touches a valid destination, that destination should remain latched through a short grace distance rather than immediately dropping the target when the pointer slips away.
- **Undo:** always one action away; keyboard shortcut `Ctrl/Cmd+Z` on desktop.
- **Delete:** always ask for confirmation before deleting an idea and its descendants.

## Rapid idea capture

When Add Idea is invoked:

1. Create the child immediately.
2. Position it automatically.
3. Select it automatically.
4. Center it at a readable scale if necessary.
5. Put editing controls immediately beside the new idea on desktop.
6. On mobile, show the compact edit sheet.

The selected idea also retains a direct on-canvas `+` affordance.

## Properties dialog

Desktop properties must behave as a movable contextual tool rather than a fixed inspector:

- A newly created idea positions its properties dialog beside the idea.
- The dialog can be dragged freely around the visible canvas by its header.
- Moving the dialog must not change the idea's map position.
- Inline text editing remains available even when the dialog is closed or elsewhere.

Mobile keeps the compact bottom-sheet treatment because a floating desktop-style properties window would consume too much of the phone canvas.

## Branch re-parenting

The structure must support direct branch movement:

- The root concept cannot be re-parented.
- A dragged idea may be dropped on another valid idea.
- The dragged idea's descendants remain attached to it and move with it during the drag preview.
- The existing incoming join follows the moving branch while dragging.
- When the pointer enters a valid destination idea, the incoming join previews a connection from that destination to the dragged branch before the user releases it.
- The destination is **magnetically latched** once touched. The user may move a reasonable distance away while the dotted preview line stretches and still keep that destination active.
- The latch releases only after the pointer moves beyond the grace zone, at which point the preview returns to the original parent. Current target values are approximately 100 px on desktop and 125 px on touch devices.
- Entering another valid destination immediately transfers the latch to that destination.
- An idea cannot be dropped onto itself or one of its own descendants.
- The destination idea is visually highlighted while it remains the active drop target.
- After drop, automatic radial/fan layout reorganizes the branch beneath the new parent.
- Re-parenting is undoable.

## Connection editing

Connections are first-class editable objects in the interaction model even though they are stored on the child relationship in v1.x.

- Clicking anywhere on the visible join or its enlarged hit region opens an inline connection-label editor.
- Clicking an existing connection label opens the same editor.
- A label created in the properties dialog remains editable afterward from either the line or label itself.
- An empty committed label removes the visible label without removing the join.
- Connection-label edits are undoable.
- Selecting/editing a connection should not implicitly select its child idea merely because the v1.x data model stores the label on that child relationship.

## Undo model

Undo should cover destructive and structural edits, including:

- Add idea.
- Delete idea/branch.
- Move/re-parent branch.
- Idea text edits.
- Connection label edits.
- Colour changes.
- Collapse/expand.
- New map and import where practical.

The history is local to the current browser session and does not need to be exported with the map.

## Visual design

- Warm neutral canvas rather than stark white.
- Soft depth and restrained shadows.
- Rounded idea shapes and controls.
- Muted, harmonious colour palette.
- Smooth radial composition.
- Clear selection and drop-target states.
- A re-connecting join should visibly change treatment during drag so the destination relationship is obvious before release.
- The latched reconnection preview uses a dotted line so the user can see the grace distance stretching before the target releases.
- Minimal permanent chrome.
- Strong typography and whitespace.
- The map should remain the dominant visual element.

MindNode remains a reference for visual cleanliness; Miro/FigJam for direct manipulation; XMind/MindMeister for structural clarity; Whimsical for polished simplicity; Scrapple for flexible relationship labelling.

## Scale and clutter control

- Collapsible branches.
- Focus mode.
- Search and jump-to-idea.
- Fit and recenter controls.
- Progressive disclosure.
- Local branch layout rather than destructive global rearrangement where possible.
- Preserve manual intent if later versions introduce persistent manual coordinates.

## Persistence — v1

- Browser `localStorage` autosave.
- JSON export/import.
- Export/import preserves structure, colours, connection labels, collapsed state, and view state.
- Keep the storage format backward-compatible across v1.x releases where practical.

## Authentication — v1

The static release uses a browser-local PBKDF2 workspace lock. It is a privacy gate, not true server-backed identity authentication. A future hosted release can replace it with account authentication and cloud persistence without changing the map data model.

## Desktop and mobile

Use one underlying application and data model, but do not force the desktop interaction surface onto a phone.

### Desktop

- Movable contextual properties dialog.
- Inline text and connection-label editing.
- Drag-and-drop branch re-parenting with live branch/join preview and target hysteresis.
- Wheel zoom and pointer panning.
- Keyboard shortcuts.

### Mobile

- Full-screen canvas.
- Floating compact toolbar.
- Contextual action bar.
- Compact temporary edit/details bottom sheet.
- Double-tap to add a child idea.
- Tap idea text to edit inline.
- Tap a connection to label or relabel it.
- Touch branch dragging for re-parenting where the gesture can be resolved without interfering with canvas panning.
- Wider drag-target grace distance than desktop to account for finger imprecision.
- One-finger canvas panning and two-finger pinch zooming.

## Current v1.6 implementation

Implemented across `MindMap/index.html`, `MindMap/app.js`, `MindMap/style.css`, and `MindMap/drag-hysteresis.js`:

- Central concept and automatic radial layout.
- Add Idea button and direct on-canvas `+`.
- Double-click/double-tap child creation.
- Properties dialog positioned beside new ideas on desktop.
- Draggable desktop properties dialog.
- Inline idea-text editing with Enter isolated from the Add Idea shortcut.
- Reliable inline connection label/relabel editing from both the join and existing label.
- Enlarged invisible join hit target.
- Drag-and-drop branch re-parenting with descendant preservation and invalid-target protection.
- Live dragged-branch movement and live join reconnection preview to candidate parents.
- Sticky candidate-parent hysteresis with a dotted preview that stretches before snapping back to the original parent.
- Undo toolbar control and `Ctrl/Cmd+Z`.
- Delete confirmation.
- Colour editing.
- Collapse/expand.
- Focus mode.
- Search and jump.
- Recenter, fit, pan, and zoom.
- Local autosave.
- JSON export/import.
- Browser-local workspace lock.
- Responsive mobile canvas-first UI.

## Core product principle

**The application should feel direct: click what you want to change, drag what you want to move, and keep every common action within immediate reach.**