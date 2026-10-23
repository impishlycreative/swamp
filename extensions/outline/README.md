# Outline Chrome Extension

Outline is an experimental Manifest V3 Chrome extension framework for bringing Scrivener-like research, notes, character information and modifiable timelines into browser-based writing workflows.

## What v0.1 already does

- Opens a custom left-side overlay from the Chrome toolbar button.
- Clips selected text from any normal HTTP/HTTPS page.
- Saves readable page text as a research item.
- Adds `Outline` actions to the browser context menu.
- Stores research clips, notes, characters and timeline events in `chrome.storage.local`.
- Keeps timeline values as normalized decimal strings rather than JavaScript floating-point numbers.
- Sorts timeline events chronologically even when values are extremely large.
- Includes the beginning of a character/event validation engine.
- Exports the entire local Outline state as JSON.

## Load it in Chrome

1. Clone or pull the `swamp` repository.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Choose **Load unpacked**.
5. Select `extensions/outline`.
6. Pin **Outline** to the Chrome toolbar.
7. Open a normal webpage and click the Outline toolbar button.

Chrome will not inject extensions into protected pages such as `chrome://extensions` itself.

## Current architecture

```text
manifest.json
    ├── background.js          toolbar + context menus
    ├── content.js             injected sidebar + page capture
    ├── content.css            isolated Outline-prefixed UI styles
    └── src/
        ├── storage.js         versioned local data store
        └── model.js           timeline normalization, sorting, validation
```

The sidebar currently overlays the page rather than resizing Google Docs. That is intentional for the framework stage: it avoids coupling the prototype to undocumented Google Docs layout internals. A Docs-specific adapter can be added separately.

## Storage shape

```text
state
  projects[]
  clips[]
  notes[]
  characters[]
  locations[]
  events[]
  eventCharacters[]
  eventLocations[]
  ui
```

Birth and death are intended to be event types linked through `eventCharacters`, not permanent date fields on a character. This lets moving a birth/death event recalculate ages and produce continuity warnings later.

Each event has a time object:

```json
{
  "value": "13800000000.5",
  "precision": "rough",
  "earliest": null,
  "latest": null,
  "calendarId": null
}
```

`value` is a decimal string. This lets the model compare very large epochs without relying on binary floating-point precision.

## Next logical layers

- Projects and nested outline folders.
- Relational character/event/location editor.
- Birth/death linking and automatic age-at-event calculations.
- Gantt/swim-lane timeline with drag editing.
- Fuzzy ranges (`earliest`/`latest`) and fictional calendar display adapters.
- Markdown/article extraction instead of raw readable page text.
- Citation metadata extraction.
- Google Docs adapter for navigating headings and attaching cards to manuscript sections.
- Import/restore JSON and optional synced/cloud persistence.

This directory is deliberately dependency-free for now so it can be loaded directly into Chrome without a build step.
