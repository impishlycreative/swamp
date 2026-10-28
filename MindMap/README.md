# MindMap 1.1

A local-first brainstorming and mind-mapping experiment for Swamp.

## Core interaction

- Start from a central concept.
- Select any idea and use **Add Idea** to branch from it.
- The selected idea also gets a direct `+` control on the canvas.
- Adding an idea creates it immediately, selects it, and moves keyboard focus straight to its text so the user can type without opening another dialog.
- First-level ideas distribute around the centre in a full 360° ring.
- Deeper ideas fan outward from their parent so branches continue away from the centre instead of tangling back through the map.
- Edit idea text, colours, and parent-connection labels from the inspector.
- Collapse branches or enter Focus mode to reduce visual clutter.
- Pan, zoom, fit, search, and recenter on an idea.
- Desktop supports wheel zoom and pointer pan; touch devices support drag-to-pan and two-finger pinch zoom.

## Interaction-budget rule

This is a hard product rule, not a suggestion:

- **Common actions: 1 interaction whenever the context is already selected.**
- **Routine/secondary actions: no more than 2 interactions.**
- **Anything else: 3 interactions maximum.**
- The same budget applies on desktop and mobile.
- Important functions must never be buried in nested menus simply to make the interface look minimal.

Examples:

- Add from the selected idea: 1 action.
- Add directly from a selected canvas idea using its `+`: 1 action.
- Edit selected idea text: immediate in the visible inspector.
- Change colour: select idea, choose colour — at most 2 actions.
- Label a connection: select child idea, type label — at most 2 actions.
- Collapse/expand, focus, centre, or delete: select idea, choose action — at most 2 actions.
- Search and jump: open search, choose result — 2 actions.
- Fit, zoom, export, import, lock: directly exposed controls.
- New map: New, confirm — 2 actions.

## Persistence

Version 1.1 stores the complete map in browser `localStorage` and autosaves changes. JSON export/import preserves map structure, idea text, colours, connection labels, collapsed state, and view state.

## Workspace lock

The static build includes a browser-local workspace lock using Web Crypto PBKDF2. The passphrase hash and map remain in the browser. This is a local privacy gate, not server-backed multi-user authentication.

## Responsive behaviour

The same application adapts instead of maintaining separate desktop and mobile versions:

- Desktop keeps the inspector at the right side and shows fuller toolbar labels.
- Narrow screens turn the inspector into a bottom sheet and reduce the toolbar to large touch-friendly controls.
- Touch targets are kept around 44 px where practical.
- Mobile supports one-finger canvas panning and two-finger pinch zooming.
- The interaction-budget rule is unchanged on mobile; features are not pushed into deeper menus.

## Navigation

The app links back to the Swamp root with the back-arrow control in the top toolbar.

## Design goals

The interface should feel polished, calm, visually balanced, and desirable to use while remaining extremely fast. Minimalism must come from good defaults and progressive presentation, not from hiding important controls.

The central design challenge is to keep the application simple while the user's information becomes complex.
