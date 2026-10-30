# MindMap 1.8.5

A local-first brainstorming and mind-mapping workspace for Swamp.

## Core interaction

- Start from a central concept.
- Select an idea and use **Add Idea**, its on-canvas `+`, double-click, or double-tap to create a child idea.
- A newly created idea opens its properties beside the idea on desktop; that properties panel can be dragged anywhere within the canvas.
- On mobile, new-idea editing opens in a compact bottom sheet so the map remains usable.
- Click a node to select it. Dragging and clicking are handled separately so a stationary click selects while a real pointer movement remains a drag.
- Click directly on an idea's existing text to edit it inline without opening the properties panel.
- Pressing **Enter** while using the inline text editor commits the edit and does **not** create another idea.
- Click a connection line or its existing label to add, edit, remove, or relabel the connection text inline.
- Editing a connection does not implicitly select its child idea or open that idea's properties panel.
- Drag a non-root idea onto another idea to re-parent the entire branch; all descendants move with it.
- When a dragged branch touches a valid new parent, that destination remains magnetically latched through a short grace distance while the dotted reconnection preview stretches.
- Undo is always available from the toolbar and with `Ctrl/Cmd+Z`.
- Deleting an idea always asks for confirmation before removing the idea and its descendants.

## Rapidfire brainstorming

Rapidfire is designed for entering many sibling ideas without repeatedly reselecting the same parent.

1. Select the node that should receive the ideas.
2. Start **Rapidfire** with the lightning control.
3. Enter an **Idea** and optional **Description**.
4. Press **Enter** in the Idea field or click the checkmark to accept it.
5. The new idea is added as a child of the original parent, the fields clear, the session count increases, and focus returns to the Idea field.
6. Continue until you press **Esc** or choose **Cancel**.

Rapidfire behavior:

- The original node remains the parent for the entire session.
- Each accepted idea becomes a sibling under that parent.
- **Enter** accepts an idea.
- **Shift+Enter** inserts a newline in the Idea field.
- The counter tracks ideas added during the current Rapidfire session.
- Idea and Description fields clear after each accepted entry.
- Rapidfire can also be armed first and then assigned to the next node selected.
- Exiting Rapidfire fully removes its temporary parent-selection listener so normal node selection resumes immediately.
- Rapidfire is available from the desktop toolbar and the mobile node-context controls.

## Idea text and descriptions

Each idea has two separate content fields:

- **Idea text** is the concise text shown inside the bubble.
- **Description** is longer supporting information, notes, context, or detail that is shown in the idea properties panel rather than inside the bubble.
- A bubble with a non-empty description shows a small notes indicator so the extra content is visible at a glance without cluttering the map.
- Description edits are autosaved, undoable, included in JSON export/import, and searchable.
- Existing v1.x maps are automatically upgraded in memory with an empty description field, so old maps continue to work.

## Bubble readability

- Idea text wraps into shorter lines instead of running beyond the bubble edge.
- Bubble radius grows when necessary to accommodate rendered text.
- Very long labels use a bounded multi-line treatment with an ellipsis rather than spilling across neighbouring ideas.
- Node size is kept readable rather than being aggressively reduced to solve layout pressure.

## Layout and organization

Version 1.8.4 specifically improves dense branches created by Rapidfire:

- First-level ideas distribute automatically around the central idea in a full 360-degree ring.
- Secondary and deeper ideas strongly prefer the outward-facing hemisphere from their parent, away from the central concept.
- The child fan widens as sibling count grows.
- Child distance from the parent also increases as sibling count grows.
- All first-level nodes are positioned before descendant branches are expanded, helping secondary branches avoid neighbouring root sectors.
- A lightweight collision pass checks placed nodes and pushes a conflicting child farther outward along the same ray instead of scrambling sibling order.
- Dense sibling groups can therefore spread over a much wider arc rather than stacking into a narrow fan.
- Re-parenting a branch preserves all descendants and lets the automatic layout reorganize around the new parent.
- The live drag preview shows the branch and connection moving before the structural change is committed.
- Candidate parents use drag hysteresis so brief pointer movement away from a target does not immediately cancel the intended drop.
- Branches can be collapsed or isolated with Focus mode.
- Search, recenter, fit, pan, and zoom are built in.

## Search

- Search matches idea text and descriptions.
- Clicking away from the search panel dismisses it on desktop and touch devices.
- Selecting a search result selects and centers the matching node.

## Save and export formats

The Save/Export control offers multiple output formats for the **current open mind map**:

- **MindMap data (.json)** — structural map data for backup, transfer, and later import.
- **Word outline (.docx)** — a text-based hierarchical document. Export starts with the central/root idea and walks outward through each branch. Children appear beneath their parent, deeper descendants remain nested beneath the correct ancestor, and indentation increases with hierarchy depth. Node descriptions are included beneath the corresponding node and are indented with that branch.
- **Visual map (PDF)** — the bubble map itself, fitted for printing and saved through the browser's PDF/print workflow.

The Word export is intentionally **not** a screenshot or picture of the map. It is a readable outline representation of the map structure. A map like:

```text
Central concept
├── Character
│   ├── Motivation
│   └── Conflict
└── Setting
    └── Location
```

is represented in Word as a root-first document with progressively indented headings and descriptions so the parent/child structure is preserved in text.

Where the browser supports the native Save As picker, output can be saved to local folders or synced folders such as OneDrive or Google Drive. On supported mobile devices, the native share sheet can also be used for saving/sharing exported files.

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
- Start Rapidfire on a selected node: 1 action.
- Add each Rapidfire idea after the mode starts: type, then Enter/checkmark.
- Open Save/Export: 1 action; choose the required output format as the second action.
- Undo: 1 action.
- Delete: Delete, then confirm.

## Persistence

MindMap keeps the v1.x browser storage key and autosaves to `localStorage`. JSON export/import preserves structure, idea text, descriptions, colours, connection labels, collapsed state, and view state.

## Workspace lock

The static build includes a browser-local workspace lock using Web Crypto PBKDF2. This is a local privacy gate, not server-backed multi-user authentication.

## Desktop and mobile

Desktop keeps a movable idea-properties panel and full toolbar controls.

Mobile remains canvas-first with:

- contextual node actions;
- compact bottom-sheet editing;
- Rapidfire access from the node context bar;
- top-level New and Save/Export controls;
- one-finger panning;
- pinch zoom;
- drag-and-drop branch re-parenting;
- direct node selection after drag or Rapidfire activity;
- multi-format Save/Export access for JSON, Word, and PDF.

## Current version notes

### 1.8.5

- Restored multi-format Save/Export: structural JSON, hierarchical Word `.docx`, and visual PDF.
- Word export preserves root-to-branch hierarchy using heading levels and indentation and includes node descriptions.
- Added a Save/Export format chooser on desktop and mobile.
- PDF output fits the visual map and excludes the application toolbar.

### 1.8.4

- Redesigned dense-branch layout for Rapidfire-sized sibling sets.
- Wider outward fan for secondary branches.
- Sibling-count-based branch distance.
- Collision-aware outward displacement while preserving sibling order.

### 1.8.3

- Fixed click-versus-drag handling so nodes remain selectable while drag-to-reparent continues to work.

### 1.8.2

- Fixed Rapidfire cleanup so its temporary node-choice listener is removed when the mode starts or ends.

### 1.8.1

- Fixed Rapidfire repeat-entry flow: fields clear, count increments, the checkmark re-enables, and focus returns to Idea.

### 1.8.0

- Added Rapidfire brainstorming with optional descriptions, keyboard shortcuts, a session counter, desktop controls, and mobile controls.

## Design principle

The map should dominate the screen. Important actions should be immediate and discoverable rather than buried in menus.

## Maintenance rule

The `MindMap/README.md` should be updated whenever a user-visible MindMap feature, interaction, layout rule, persistence behavior, mobile behavior, export behavior, or version changes.
