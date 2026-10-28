# MindMap 1.2

A local-first brainstorming and mind-mapping experiment for Swamp.

## Core interaction

- Start from a central concept.
- Select any idea and use **Add Idea** to branch from it.
- The selected idea also gets a direct `+` control on the canvas.
- Adding an idea creates it immediately, selects it, centers it at a readable scale, and opens text editing so the user can type immediately.
- First-level ideas distribute around the centre in a full 360° ring.
- Deeper ideas fan outward from their parent so branches continue away from the centre instead of tangling back through the map.
- Connections can be labelled.
- Ideas can be recoloured.
- Branches can be collapsed or isolated with Focus mode.
- Search, recenter, fit, pan, and zoom are built in.

## Interaction-budget rule

This is a hard product rule, not a suggestion:

- **Common actions: 1 interaction whenever the context is already selected.**
- **Routine/secondary actions: no more than 2 interactions.**
- **Anything else: 3 interactions maximum.**
- The same budget applies on desktop and mobile.
- Important functions must never be buried in deep menus simply to make the interface look minimal.

Examples:

- Add from the selected idea: 1 action.
- Add directly from a selected canvas idea using its `+`: 1 action.
- Edit selected idea text on mobile: **Edit** once; the keyboard opens on the text.
- Focus selected branch on mobile: **Focus** once.
- Change colour, label a connection, collapse, center, or delete: **More** then the action — no more than 2 actions from a selected idea.
- Search and jump: search, choose result — 2 actions.
- Fit map: 1 action.
- Export/import/lock: More menu then action — 2 actions.
- New map: More, New map, confirm — 3 actions.

## Persistence

Version 1.2 stores the complete map in browser `localStorage` and autosaves changes. JSON export/import preserves map structure, idea text, colours, connection labels, collapsed state, and view state.

Existing v1/v1.1 maps continue to use the same storage key and are migrated to v1.2 when opened.

## Workspace lock

The static build includes a browser-local workspace lock using Web Crypto PBKDF2. The passphrase hash and map remain in the browser. This is a local privacy gate, not server-backed multi-user authentication.

## Responsive behaviour

The same data and application logic are used on desktop and mobile, but the interaction surface is intentionally different.

### Desktop

- Full toolbar controls.
- Persistent right-side inspector when an idea is selected.
- Wheel zoom and pointer panning.
- Keyboard shortcuts for frequent actions.

### Mobile

Mobile is **canvas first** rather than a compressed desktop layout.

- Selecting an idea does **not** automatically cover the map with the inspector.
- A compact contextual bar appears with four immediate actions: **Idea, Edit, Focus, More**.
- The selected idea keeps its direct on-canvas `+` control.
- **Edit** opens a small bottom sheet containing only the text editor.
- **More** opens the bottom sheet with colour, connection label, collapse, center, delete, and Add Idea.
- The bottom sheet can be closed with `×` or dragged downward by its handle.
- The main toolbar is reduced to Add, Search, Fit, and a two-tap utility menu.
- Export, Import, New map, Lock, and Back to Swamp live in that single utility menu; there are no deeper nested menus.
- One-finger drag pans the canvas.
- Two-finger pinch zooms.
- Touch targets are approximately 44 px or larger.
- Imported or older maps open centered at a readable scale rather than automatically shrinking the entire map to fit the phone screen.
- Fit remains one tap away when the user wants the whole map overview.

## Navigation

Desktop exposes Back to Swamp directly. Mobile exposes it in the single-level utility menu, keeping it within two taps.

## Design goals

The interface should feel polished, calm, visually balanced, and desirable to use while remaining extremely fast. The map should dominate the screen; controls should appear contextually rather than permanently consuming canvas space.

Minimalism must come from good defaults and progressive presentation, not from hiding important capability.

The central design challenge is to keep the application simple while the user's information becomes complex.
