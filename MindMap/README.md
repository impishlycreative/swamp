# MindMap V3 preview

This directory is the **canonical Swamp MindMap application**. On 2026-11-07, the complete original `mindmap v2/` tree was promoted to `MindMap/` and a first V3 guided-brainstorming layer was added. `mindmap v2/` is preserved unchanged for comparison; the original `MindMap/` content is recoverable from Git history.

## Single source of truth for the application version

Only `MindMap/core-stability.js` defines the runtime semantic version (`const VERSION`). The module exposes `window.SWAMP_MINDMAP_VERSION`; `app.js` and `v2-experience.js` consume that value. HTML contains no separate semantic version. The product name "V3 preview" is a release-stage label, not an additional version number. Asset query build keys are cache invalidation identifiers, not application versions.

## What works now

- Complete V2 functionality: editing, templates, Writer's Navigator, Story Walk, focus, layout, relationships, story health, JSON/Word/PDF export, mobile UI.
- Local guided brainstorming panel, opened from **Guide**, with **Strict brainstorming ON by default for each map**, switchable without discarding content.
- One **neutral procedural question** at a time, with user-authored answers recorded verbatim in a persistent per-map question/answer history.
- Automatic creation of nodes under the chosen focus branch; an empty untitled root uses the first answer as its topic. The user can change focus to the selected idea or back to the root.
- User-entered review flags, explicit-uncertainty flags, visible node markers, and resolve actions. Flags appear in V2 Story Health via `writer.flags`.
- Local-first map persistence and offline service-worker precaching after first successful online visit; no server-side account/API requirement for guided capture.

## Important limitations

- **No language model is bundled.** The first guided experience is deterministic and cannot reliably infer semantic gaps, contradictions, or sophisticated organization. It does not invent content or pose leading questions. Full situational AI is a future phase.
- **Offline availability requires a successful initial asset precache** from an HTTPS origin. Browser cache eviction may remove the assets; backup your maps using JSON export. No offline installer is packaged yet.
- The app currently uses browser localStorage. V3's stronger persistent storage, sync/backup, and offline model integration are not complete.
- Strict Brainstorming uses the author's `story-rules.md`, captured locally in this directory. It conservatively collects and organizes user-authored text only.

## Remaining V3 implementation

1. Add interchangeable on-device inference; benchmark Qwen 3.5 2B and 4B on target laptops after licence and runtime validation.
2. Use the local inference layer to interpret answers, propose labels and relationships as unconfirmed, and detect possible contradictions/gaps without hijacking the current direction.
3. Build a validated Situation Model with established facts, user-approved decisions, inferred hypotheses, and explicit review flags; prevent unconfirmed inferences from becoming canon.
4. Add rigorous offline/restart/storage migration tests and durable offline packaging.
5. Run the 30–50-case model acceptance suite described in `V3_PLAN.md`.

## Testing

```bash
node MindMap/tests/regression-tests.js
node MindMap/tests/v3-smoke-tests.js
```

These tests are available in the repository; they must be run in a Node environment before release. No browser-based acceptance test has been performed in this initial promotion.
