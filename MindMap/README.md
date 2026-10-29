# MindMap 1.7

A local-first brainstorming and mind-mapping experiment for Swamp.

## Core interaction

- Start from a central concept.
- Select an idea and use **Add Idea**, its on-canvas `+`, double-click, or double-tap to create a child idea.
- A newly created idea opens its properties beside the idea on desktop; that properties panel can be dragged anywhere within the canvas.
- On mobile, new-idea editing opens in a compact bottom sheet so the map remains usable.
- Click directly on an idea's existing text to edit it inline without opening the properties panel.
- Pressing **Enter** while using the inline text editor commits the edit and does **not** create another idea.
- Click a connection line or its existing label to add, edit, remove, or relabel the connection text inline.
- Editing a connection no longer implicitly selects its child idea or opens that idea's properties panel.
- Drag a non-root idea onto another idea to re-parent the entire branch; all descendants move with it.
- When a dragged branch touches a valid new parent, that destination remains magnetically latched through a short grace distance while the dotted reconnection preview stretches.
- Undo is always available from the toolbar and with `Ctrl/Cmd+Z`.
- Deleting an idea always asks for confirmation before removing the idea and its descendants.

## Idea text and descriptions

Each idea now has two separate content fields:

- **Idea text** is the concise text shown inside the bubble.
- **Description** is longer supporting information, notes, context, or detail that is shown in the idea properties panel rather than inside the bubble.
- A bubble with a non-empty description shows a small data/notes indicator so the extra content is visible at a glance without cluttering the map.
- Description edits are autosaved, undoable, included in JSON export/import, and searchable.
- Existing v1.x maps are automatically upgraded in memory with an empty description field, so old maps continue to work.

## Bubble readability

Version 1.7 improves containment of idea text:

- Idea text wraps into shorter lines instead of running beyond the bubble edge.
- Bubble radius grows when necessary to accommodate the rendered text.
- Very long labels use a bounded multi-line treatment with an ellipsis rather than spilling across neighbouring ideas.
- Layout spacing was increased slightly to account for larger bubbles.

## Interaction-budget rule

This is a hard product requirement:

- Common actions: 1 interaction whenever the context is already selected.
- Routine/secondary actions: no more than 2 interactions.
- Anything else: 3 interactions maximum.
- The same budget applies on desktop and mobile.

Examples:

- Double-click/double-tap an idea to add a child: 1 gesture.
- Click idea text to edit it inline: 1 gesture.
- Click a connection to label or relabel it: 1 gesture.
- Drag a branch onto a new parent to re-parent it: 1 gesture.
- Undo: 1 action.
- Delete: Delete, then confirm.

## Layout and organization

- First-level ideas distribute automatically around the central idea.
- Deeper ideas fan outward from their parent.
- Re-parenting a branch preserves all descendants and lets the automatic layout reorganize around the new parent.
- The live drag preview shows the branch and connection moving before the structural change is committed.
- Candidate parents use drag hysteresis so brief pointer movement away from a target does not immediately cancel the intended drop.
- Branches can be collapsed or isolated with Focus mode.
- Search, recenter, fit, pan, and zoom are built in.

## Persistence

Version 1.7 keeps the v1.x storage key and autosaves to browser `localStorage`. JSON export/import preserves structure, idea text, descriptions, colours, connection labels, collapsed state, and view state.

## Workspace lock

The static build includes a browser-local workspace lock using Web Crypto PBKDF2. This is a local privacy gate, not server-backed multi-user authentication.

## Desktop and mobile

Desktop keeps a movable idea-properties panel and full toolbar controls. Mobile remains canvas-first with floating controls, contextual actions, a compact bottom sheet, one-finger panning, and pinch zoom.

## Design principle

The map should dominate the screen. Important actions should be immediate and discoverable rather than buried in menus.