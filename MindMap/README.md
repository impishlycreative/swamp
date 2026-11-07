# MindMap V3 — PWA + on-device AI evaluation (3.5.0-alpha.1)

MindMap V3 is the canonical application at `MindMap/` in `impishlycreative/swamp`. The earlier V2 baseline remains available at `mindmap v2/`; Git history preserves the previous canonical app.

## Single application version source

`MindMap/core-stability.js` defines the **only runtime semantic version**. The UI, base app and V2 extensions read `window.SWAMP_MINDMAP_VERSION`. PWA cache identifiers and asset build query strings are not semantic versions.

## What is implemented

- Installable PWA metadata (web manifest, 192px/512px PNG icons, standalone display) with an offline shell service worker.
- Separate caching for app assets and browser inference library modules; browser-native model weights are cached by Transformers.js.
- IndexedDB project snapshot mirror and recovery when browser localStorage is missing. The existing app remains localStorage-first for compatibility and Undo. A user-initiated browser storage-persistence request is available from Guide.
- Guided discovery for a blank map; uncertainty such as “no idea” is treated as a request for procedural discovery rather than made into the story's title.
- Per-map Strict Brainstorming toggle, one neutral question at a time, user-authored answer capture, branch focus, history and review flags.
- An interchangeable internal browser inference adapter, a dedicated Web Worker, explicit model download/load UI and progress, with no mandatory local server, launcher or cloud AI.
- **Experimental bootstrap model:** `onnx-community/Qwen3-0.6B-ONNX` using `@huggingface/transformers@4.3.2`, WebGPU q4f16 when available and attempted WASM/CPU q4 fallback. This is a compatibility prototype, **not** the approved final model.
- Model output is validated by `v3-domain.js`. In Strict Mode the model can only choose a predefined neutral question; it cannot write story material into established nodes.
- Model-proposed review flags are visibly labelled **AI suggestions**. Suggested cross-links are stored as **unconfirmed** until the author explicitly approves or dismisses them. Inferences never silently become user-established facts.
- Existing V2 map editing, templates, exports, navigator, layout tools, and baseline regression suite remain in the canonical directory; supplemental writer scripts not loaded by the V2 HTML entry point remain an integration task.

## Offline use

1. Open the hosted MindMap in a supported HTTPS browser.
2. Use **Install PWA** or the browser's Install option (where available). The shell is precached by the service worker.
3. Open **Guide** → **Download & enable local AI**. Allow the initial model/runtime download to finish.
4. Optionally click **Protect local storage**. Export a JSON backup; browser storage can be evicted or cleared.
5. Test closing/reopening with network disconnected. The status panel checks whether the app shell is cached; it does **not** claim the AI model is offline-ready until a real offline restart has succeeded.

If WebGPU is unavailable, a slower CPU path is attempted; it may fail due to browser/model limitations. In that case guided capture, user-controlled flags, and the map remain available without AI.

**The PWA itself does not start native processes.** Ollama and `llama.cpp` are not required. An optional local inference companion is an architecture possibility, not implemented here.

## Security / authorship

The user's authored text and decisions stay in application-controlled map data. The model receives a bounded local situation snapshot, analyzes it inside the browser and suggests unconfirmed metadata only. Strict Story Mode rules are stored in `story-rules.md`. Downloading third-party runtime/model assets initially requires internet access; no user-authored text is intentionally sent to a cloud inference endpoint.

## Tests

```bash
node MindMap/tests/regression-tests.js
node MindMap/tests/v3-smoke-tests.js
node MindMap/tests/v3-domain-tests.js
```

These are code-level tests. Browser installation, WebGPU/WASM model load, download/cache retention, IndexedDB restore, device memory/speed, and full disconnected restart must still be tested on real supported devices.

## Remaining before a stable V3 release

- Run the planned 30–50 real multi-turn evaluations with target browsers, and benchmark Qwen 3.5 2B/4B only after confirming browser runtimes support their exact formats.
- Verify that all required browser inference package chunks, WASM files, tokenizers and weights survive offline restart without network activity.
- Expand semantic situation tracking across manually edited nodes, map switching, imported projects and long sessions.
- Validate Strict Brainstorming behaviour and false-positive contradiction reports under actual local inference.
- Improve project storage/migration beyond compatibility-first localStorage and prove crash/offline recovery.
- Finish integration testing of V2's additional writer modules and full mobile layout.
- Verify model weight/converted ONNX redistribution licence and notices prior to commercial release.
