# MindMap 1.0

A local-first brainstorming and mind-mapping experiment for Swamp.

## Core interaction

- Start from a central concept.
- Select any idea and choose **Add Idea** to branch from it.
- First-level ideas distribute around the centre in a full 360° ring.
- Deeper ideas fan outward from their parent so branches continue away from the centre instead of tangling back through the map.
- Edit idea text, colours, and parent-connection labels from the inspector.
- Collapse branches or enter Focus mode to reduce visual clutter.
- Pan, zoom, fit, search, and recenter on an idea.

## Persistence

Version 1.0 stores the complete map in browser `localStorage` and autosaves changes. JSON export/import preserves the map structure, idea text, colours, connection labels, collapsed state, and view state.

## Workspace lock

The static v1 build includes a browser-local workspace lock using Web Crypto PBKDF2. The passphrase hash and map remain in the browser. This is a local privacy gate, not server-backed multi-user authentication.

## Navigation

The app links back to the Swamp root with the back-arrow control in the top toolbar.

## Design goals

The UI is intentionally calm and progressive: rapid idea capture first, with editing and organization controls revealed when an idea is selected. The layout and Focus/collapse tools are designed to stay usable as maps grow.
