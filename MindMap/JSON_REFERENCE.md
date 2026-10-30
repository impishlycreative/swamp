# Swamp MindMap JSON Reference

This document describes the JSON format used by the Swamp MindMap application. It is intended both for people and for external AI systems that need to create valid MindMap files.

## Canonical files

- JSON Schema: `https://impishlycreative.github.io/swamp/MindMap/schema/swamp-mindmap.schema.json`
- Human/AI reference: `https://impishlycreative.github.io/swamp/MindMap/JSON_REFERENCE.md`

The current export schema version is **1.0**.

## Export metadata

Every JSON file exported by the application includes these top-level fields:

```json
{
  "$schema": "https://impishlycreative.github.io/swamp/MindMap/schema/swamp-mindmap.schema.json",
  "format": "swamp-mindmap",
  "schemaVersion": "1.0",
  "kind": "map",
  "reference": "https://impishlycreative.github.io/swamp/MindMap/JSON_REFERENCE.md",
  "exportedAt": "2026-10-30T18:30:00.000Z"
}
```

`kind` is either `map` or `project`.

The application also stores its own internal data version in `version`. Do not confuse the application data version with `schemaVersion`. `schemaVersion` describes the published interchange format.

## Project -> map -> node hierarchy

A **project** is a container for multiple maps.

A **map** is one complete mind map. A project keeps its maps in the `sessions` object. The object key is the map ID and should match that map's own `id`.

A **node** is one bubble/idea within a map. Nodes are stored in the map's `nodes` object. The object key should match the node's own `id`.

The central/root idea of a map is identified by `rootId`.

### Project structure

```json
{
  "kind": "project",
  "id": "p_example",
  "title": "Novel Planning",
  "currentMapId": "m_overview",
  "sessions": {
    "m_overview": { "...": "map object" },
    "m_character": { "...": "map object" }
  },
  "templateHistory": []
}
```

`currentMapId` must identify one of the maps in `sessions`.

### Map structure

```json
{
  "id": "m_overview",
  "title": "Novel Overview",
  "rootId": "n_root",
  "nodes": {
    "n_root": { "...": "root node" },
    "n_conflict": { "...": "child node" }
  },
  "view": {
    "x": 400,
    "y": 300,
    "scale": 1
  }
}
```

`rootId` must identify one node in `nodes`.

The application's current behaviour normally keeps the map `title` aligned with the root node's `text`. AI-generated files should do the same unless there is a specific reason not to.

## Nodes and relationships

A typical node looks like this:

```json
{
  "id": "n_conflict",
  "text": "Main conflict",
  "description": "The protagonist must expose the fraud before the election.",
  "parentId": "n_root",
  "color": "#DCEBE4",
  "edgeLabel": "drives",
  "collapsed": false,
  "created": "2026-10-30T18:30:00.000Z",
  "x": null,
  "y": null,
  "targetMapId": null
}
```

### `parentId`

The hierarchy is defined by `parentId`.

- The root node must have `parentId: null`.
- Every non-root node should have a `parentId` that identifies another node in the same map.
- Do not create parent/child cycles.

### `edgeLabel`

A relationship label is stored on the **child** node. `edgeLabel` describes the connection from that node's parent to that node.

For example, if node B has:

```json
{
  "parentId": "node_a",
  "edgeLabel": "causes"
}
```

then the visual relationship is **node A --causes--> node B**.

### `targetMapId`

A node can link to another map in the same project. Set `targetMapId` to that map's ID.

For a standalone exported map, a `targetMapId` can technically be present, but it will only become useful when the referenced map exists in the project where the map is imported.

### `x` and `y`

`x` and `y` are optional manual positions in map coordinates.

For AI-generated content, the safest choice is usually:

```json
"x": null,
"y": null
```

This allows the application to auto-position the node. Use numeric coordinates only when you deliberately want to pin a node.

### `color`

Use a CSS colour string. Existing app palettes commonly use values such as:

- `#F2D8A7`
- `#DCEBE4`
- `#D8E5F2`
- `#E7DCF2`
- `#F2D7DC`
- `#E6E0D3`
- `#CFE4DC`
- `#F0E5C5`

## Generation rules for external AI

When creating a valid Swamp MindMap file:

1. Set `$schema`, `format`, `schemaVersion`, `kind`, and `reference` exactly as documented above.
2. Use unique IDs for projects, maps, and nodes. Simple readable IDs are acceptable; they do not have to imitate the application's generated IDs.
3. In every map, create exactly one root node and set `rootId` to its ID.
4. Give the root node `parentId: null`.
5. Make every non-root `parentId` reference a node in the same map.
6. Never create parent cycles.
7. In a project, make `currentMapId` reference a map in `sessions`.
8. If a node uses `targetMapId`, make it reference a map in the same project whenever possible.
9. Keep the `nodes` object key equal to the node's `id`.
10. Keep the `sessions` object key equal to the map's `id`.
11. Prefer `x: null` and `y: null` so the application can perform layout.
12. Use ISO-8601 timestamps for generated `created`, `updated`, and `exportedAt` values.
13. Keep map `title` and root node `text` consistent.
14. Preserve descriptions as plain text. Do not put formatting markup into fields unless the user explicitly wants literal markup.

## Minimum standalone map

```json
{
  "$schema": "https://impishlycreative.github.io/swamp/MindMap/schema/swamp-mindmap.schema.json",
  "format": "swamp-mindmap",
  "schemaVersion": "1.0",
  "kind": "map",
  "reference": "https://impishlycreative.github.io/swamp/MindMap/JSON_REFERENCE.md",
  "exportedAt": "2026-10-30T18:30:00.000Z",
  "version": "2.6.0",
  "id": "m_example",
  "title": "Example Map",
  "created": "2026-10-30T18:30:00.000Z",
  "updated": "2026-10-30T18:30:00.000Z",
  "rootId": "n_root",
  "nodes": {
    "n_root": {
      "id": "n_root",
      "text": "Example Map",
      "description": "Central idea",
      "parentId": null,
      "color": "#F2D8A7",
      "edgeLabel": "",
      "collapsed": false,
      "created": "2026-10-30T18:30:00.000Z",
      "x": null,
      "y": null,
      "targetMapId": null
    }
  },
  "view": {
    "x": 0,
    "y": 0,
    "scale": 1
  }
}
```

## Example prompt for an AI

You can give an AI this instruction together with the schema/reference URLs:

> Create a complete Swamp MindMap project in JSON. Follow the Swamp MindMap JSON Schema and reference exactly. Use one overview map and separate linked maps for the major subjects. Keep all node x/y values null so the app can lay them out. Return only valid JSON.

## Compatibility

The application continues to import older map/project JSON that does not contain the new export metadata. New exports include the metadata so they are self-describing and easier for external tools and AI systems to understand.
