# MindMap 2.7.1

A local-first brainstorming and mind-mapping workspace for Swamp.

## Projects, maps, and ideas

MindMap uses three distinct levels:

- **Project** — the container for a related collection of maps.
- **Map** — one mind map inside the current project. The top map selector switches between maps in that project.
- **Root / central idea** — the central bubble inside a map. It is an idea inside the map, not the project itself.

The mobile **More** panel contains project controls for switching projects, creating a **New project**, and renaming the current project. Existing browser data is automatically registered as the first project. Each project is stored separately in browser storage, while the active project is loaded into the existing MindMap workspace key for compatibility with the rest of the application.

Creating a **New map** adds another map to the current project. It does not delete or replace the other maps. New Map now asks for confirmation before creating the map.

## Core interaction

- Start from a central concept.
- Select an idea and use **Add Idea**, its on-canvas `+`, double-click, or double-tap to create a child idea.
- Click a node to select it. Dragging and clicking are handled separately so a stationary click selects while a real pointer movement remains a drag.
- Click directly on an idea's existing text to edit it inline without opening the properties panel.
- Pressing **Enter** while using the inline text editor commits the edit and does **not** create another idea.
- Click a connection line or its existing label to add, edit, remove, or relabel the connection text inline.
- Drag a non-root idea onto another idea to re-parent the entire branch; all descendants move with it.
- Undo is available from the toolbar and with `Ctrl/Cmd+Z`.
- Deleting an idea asks for confirmation before removing the idea and its descendants.

## Mobile editing

Mobile remains canvas-first and uses a compact bottom sheet for editing.

The Edit Idea flow is transactional:

- **Done** keeps the text and description changes.
- **Cancel** restores the values that were present when the edit sheet opened.
- The close `X` behaves like Cancel while the edit sheet is open.
- The edit sheet does not depend on the swipe handle as its only way out.

The bottom node-context bar remains the primary place for node actions: **Idea**, **Rapid**, **Edit**, **Focus**, and **More**. Duplicate **Add Idea** and **Center here** actions are hidden from the node More sheet on mobile.

## Mobile top toolbar

Common workspace actions are directly accessible:

- Undo
- Search
- Center selected idea
- New map
- Save / Share / Export
- Open / Import
- Lock
- More

The redundant top Add Idea control is hidden on mobile because Add Idea already exists in the selected-node context bar. The toolbar uses compact controls on narrow screens.

The mobile **More** panel closes when the user taps outside it. The Save button also releases its pressed/focus state after use instead of remaining visually highlighted.

## Rapidfire brainstorming

Rapidfire is designed for entering many sibling ideas without repeatedly reselecting the same parent.

1. Select the node that should receive the ideas.
2. Start **Rapidfire** with the lightning control.
3. Enter an **Idea** and optional **Description**.
4. Press **Enter** in the Idea field or click the checkmark to accept it.
5. The new idea is added as a child of the original parent, the fields clear, the session count increases, and focus returns to the Idea field.
6. Continue until you press **Esc** or choose **Exit**.

Rapidfire behavior:

- The original node remains the parent for the entire session.
- Each accepted idea becomes a sibling under that parent.
- **Enter** accepts an idea.
- **Shift+Enter** inserts a newline in the Idea field.
- The counter tracks ideas added during the current Rapidfire session.
- Idea and Description fields clear after each accepted entry.
- Rapidfire can also be armed first and then assigned to the next node selected.

## Idea text and descriptions

Each idea has two separate content fields:

- **Idea text** is the concise text shown inside the bubble.
- **Description** is longer supporting information, notes, context, or detail shown in the idea properties panel rather than inside the bubble.

Descriptions are autosaved, undoable, included in JSON export/import, and searchable. A bubble with a non-empty description shows a notes indicator.

## Layout and organization

- First-level ideas distribute automatically around the central idea.
- Secondary and deeper ideas prefer the outward-facing hemisphere from their parent.
- Child fan and distance increase as sibling count grows.
- A lightweight collision pass pushes conflicting children outward while preserving sibling order.
- Re-parenting a branch preserves all descendants.
- Branches can be collapsed or isolated with Focus mode.
- Search, center, fit, pan, and zoom are built in.

## Story templates

Story templates can generate an overview map plus dedicated maps for individual beats. Linked beat nodes open their corresponding brainstorming maps. Current built-in templates include Three-Act Structure, Save the Cat, and Hero's Journey.

## Search

- Search matches idea text and descriptions.
- Clicking away from the search panel dismisses it on desktop and touch devices.
- Selecting a search result selects and centers the matching node.

## Save, share, and export

The Save / Share / Export control offers:

- **Current map (`.mindmap.json`)** — one map with hierarchy, descriptions, linked-map references, manual positions, and view state.
- **Complete project (`.mindmap-project.json`)** — every map in the current project, including template maps, links, positions, and viewport state.
- **Word outline (`.docx`)** — the current map as hierarchical text with descriptions.
- **Visual map (PDF)** — the current bubble map through the browser print/PDF workflow.

### Google Drive and OneDrive

MindMap does not pretend that a static browser page can force a specific cloud provider. Instead:

- On supported desktop browsers, the native **Save As** picker can target a local folder or a synced Google Drive / OneDrive folder.
- On supported mobile browsers, the native system share sheet is used for exported files. If Google Drive or OneDrive is installed and available as a provider, it can be selected there.
- If neither mechanism is supported, MindMap falls back to a normal browser download.

The export dialog explains this flow so users know whether they are saving, sharing to cloud storage, or downloading.

## Open / import

Import accepts either:

- a single map, which is added to the current project; or
- a complete project file, which replaces the active project after confirmation.

Open / Import is directly accessible from the mobile top toolbar.

## Persistence

MindMap is local-first and autosaves to browser `localStorage`.

Project management adds a small project registry plus a separate storage entry for each project. The currently selected project is mirrored into the established MindMap project key so existing map, template, export, and session code continues to work.

JSON export remains the portable backup/transfer mechanism. Browser storage should not be treated as the only long-term backup.

## Workspace lock

The static build includes a browser-local workspace lock using Web Crypto PBKDF2. This is a local privacy gate, not server-backed multi-user authentication.

A refresh in the same browser session stays unlocked. Deliberately pressing **Lock** clears the session unlock so the passphrase is required again.

## Interaction-budget rule

- Common actions: 1 interaction whenever the context is already selected.
- Routine/secondary actions: no more than 2 interactions.
- Anything else: 3 interactions maximum.
- The same budget applies on desktop and mobile.

## Current version notes

### 2.7.1

- Added local **multi-project** management: create, rename, switch, and persist separate projects.
- Clarified the hierarchy as **Project → Map → root/central idea**.
- Added confirmation before creating a new map.
- Added transactional mobile Edit Idea controls: **Cancel** and **Done**.
- Put **Open**, **Lock**, and **Center** directly on the mobile top toolbar alongside Save and New Map.
- Removed redundant mobile Add Idea and Center actions from More.
- Made the top More panel dismiss when tapping outside it.
- Fixed the mobile Save control remaining visually highlighted after use.
- Clarified Google Drive / OneDrive saving through the native Save As picker or mobile share sheet.
- Tightened mobile toolbar spacing for narrow screens.

### 2.6.x

- Added session-only refresh unlock while preserving explicit Lock behavior.
- Added story-template beat help and focused beat navigation.
- Tightened map layout and reduced excessive whitespace.
- Improved concise brainstorming examples and Rapidfire exit wording.

### 1.8.5

- Restored multi-format Save/Export: structural JSON, hierarchical Word `.docx`, and visual PDF.
- Word export preserves root-to-branch hierarchy and includes node descriptions.
- Added a Save/Export format chooser on desktop and mobile.

## Design principle

The map should dominate the screen. Important actions should be immediate and discoverable rather than buried in menus.

## Maintenance rule

Update `MindMap/README.md` whenever a user-visible MindMap feature, interaction, layout rule, persistence behavior, mobile behavior, export behavior, or version changes.
