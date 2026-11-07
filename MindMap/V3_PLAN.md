# Swamp / MindMap V3 — Design Plan

**Created:** 2026-11-07  
**Updated:** 2026-11-07  
**Status:** Design requirements agreed; initial V3 offline-guided preview implemented in the Swamp GitHub repository (full local AI integration pending)  
**Project:** Swamp / MindMap V3 (evolution of MindMap V2)

## 1. Problem Statement

The first reaction to opening MindMap V2 may be: **“What am I going to brainstorm?”** A blank canvas assumes a topic already exists. V3 should help people discover a subject and develop it without taking control of their ideas.

## 2. Confirmed Requirements (Five-Question Discovery)

### R1 — Guided Idea Discovery

When the user does not have a topic, V3 should guide them toward something they want to brainstorm. The experience should be interactive, not merely a collection of random suggestions. The user may still start directly with their own idea.

### R2 — Apply Established Story-Writing Rules to Strict Brainstorming

Anything designated **Strict Brainstorming** must follow the user's established story-writing rules. Those rules should be treated as an authoritative input for the guidance process, not recreated from guesses. Exact rule text, precedence, and how the rules apply outside story writing need validation before implementation.

### R3 — Strict Brainstorming Is Default, but Can Be Toggled

- Start new brainstorming sessions with **Strict Brainstorming ON**.
- Allow the user to switch it OFF or ON while actively working.
- Switching modes must not discard the work in progress.
- The effect of toggling mode on previously generated content and subsequent AI responses should be specified during implementation design.

### R4 — Ask One Question at a Time

The guided assistant asks **one question per turn**. Each new question should build on the user's responses and current direction, rather than overwhelming them with multiple prompts.

### R5 — Create and Organize the Map Automatically

As answers are given, V3 should create nodes and organize their branches and relationships automatically. The user retains the ability to edit or rearrange them manually. Implementation must distinguish the user's stated ideas from AI-inferred grouping/labels to avoid introducing unsupported claims.

### R6 — Stay on Course, Flag Issues Without Interrupting

- Stay focused on the direction the user is currently exploring.
- Identify missing details, contradictions, inconsistencies and unexplored possibilities.
- Flag them visibly on the relevant node or relationship for later review.
- Do **not** derail the current question sequence to resolve flagged issues unless the user chooses to do so.
- Let the user review, resolve or dismiss flags later.

**Design principle:** Keep the ideas flowing; mark issues without hijacking the brainstorming.

### R7 — Offline Operation Is Required

- MindMap V3 must remain usable **without an internet connection**, including guided brainstorming, automatic node creation and organization, strict-mode rule enforcement, flagging, and saving/reopening maps.
- Cloud services may enhance the experience when connected, but may not be required for core functionality.
- Local software, story-writing rules, models, and map data must be available after initial installation/setup so the application works offline after a restart.
- Local-first persistence, failure recovery, and migration between versions must not require cloud access.
- The chosen offline AI capabilities must be verified on target hardware and browsers. The implementation must not promise sophisticated semantic guidance on devices that cannot run a suitable local model; capability fallback is an open design problem.

### R8 — PWA Is the Primary Application (Confirmed 2026-11-07)

- MindMap V3 remains a **Progressive Web App (PWA)**: installable from the browser, cross-platform, and usable offline after required application/model assets are installed.
- **No mandatory native Windows launcher, `llama.cpp` installation, Ollama installation, or separate local process** is acceptable as a prerequisite for the default PWA experience.
- Evaluate **browser-native on-device AI first** using WebGPU, and WebAssembly/CPU fallback where performance permits. The selected model and browser runtime must be validated before claiming full intelligent offline operation.
- `llama.cpp`/`llama-server` can be an **optional advanced companion backend** for users who choose to install and run it; Ollama is also optional, not a requirement.
- The PWA may communicate with an already-running local AI server, but browser JavaScript **cannot spawn native executables directly**. A native launcher is not part of the required architecture.
- The application must work without any cloud AI service. Capability limitations must be explicit until a browser-local model has passed acceptance tests.

**Implementation status:** PWA-first architecture is confirmed, but the current V3 preview has only a service-worker offline shell. An installable manifest, icons, robust model caching/storage, and true browser-AI inference are still to be built and tested.

## 3. Proposed Interaction Flow (Not Yet Approved in Detail)

1. User starts a new map or opens an existing one.
2. Strict Brainstorming starts ON by default, with an accessible toggle.
3. If no starting idea is provided, the assistant begins guided Idea Discovery.
4. Assistant asks one question, waits for an answer, and then creates/updates relevant nodes and relationships.
5. Assistant continues in the current direction while attaching non-interruptive review flags where appropriate.
6. User can manually edit the map, change mode, or review flags without losing work.

## 4. Candidate Brainstorming Areas (Proposals)

- Creative writing: story premises, characters, conflicts and plots.
- Problem solving: challenges, alternatives and trade-offs.
- Inventing: electronics, gadgets, game mechanics and concepts.
- Planning: projects and practical next steps.
- Exploring a question or unexpected topic.

These are examples, not an approved classification system.

## 5. Concept 2 — Situational Awareness (Architecture Under Discussion)

V3 may maintain a persistent **Situation Model** with current purpose, active branch, established facts, user intent, unconfirmed inferences, proposals, applicable rules, and unresolved flags. The goal is to understand the user's evolving activity instead of relying exclusively on a long conversation transcript.

A local interpretation component would identify changes in meaning and recommend state updates; a separate local state/rules component would validate them, preserve facts vs. guesses, and decide what to organize or flag. The guiding assistant would stay on the chosen direction and ask only one question at a time.

**PWA-first candidate implementation:** JavaScript state management and rules engine; local IndexedDB/OPFS persistence; a versioned service worker, manifest and installable offline assets; and a browser-native on-device language model via WebGPU with WebAssembly/CPU fallback where practical. Browser runtime and model choices remain subject to verification. Models and associated assets must be downloaded, verified and retained locally before disconnected use. An optional `llama.cpp` backend must not become a default dependency.

**Key architectural separation:** Deterministic rules/state/persistence should work independently of any cloud API. Semantically rich interpretation and question generation need an adequate local model or a separately designed offline fallback.

## 6. Recommended Offline AI Approach (Recommendation — Not Yet Approved)

**Recommendation:** Design MindMap V3 to use an **interchangeable local language-model backend**. Begin the evaluation with **Qwen 3.5 2B** (lightweight baseline) and **Qwen 3.5 4B** (stronger-quality candidate), preferably with approximately 4-bit quantization. Model availability, exact variant names, compatibility, distribution terms and third-party quantization licences must be verified before adoption.

### Confirmed PWA-first deployment direction

- **Primary deliverable:** Installable, cross-platform MindMap V3 PWA (browser UI and local-first data). No mandatory desktop wrapper, Windows `.exe`, background launcher, Ollama or `llama-server`.
- **Default AI evaluation path:** Run the language model **in the browser**, initially testing WebGPU-capable runtimes (for example, WebLLM or suitable alternatives), with WebAssembly/CPU support assessed where feasible. No browser/model combination is approved until measured.
- **Model evaluation:** Keep Qwen 3.5 2B and 4B as initial commercial-licence candidates, **not preselected browser-compatible implementations**. Verify model architecture support, quantization and tokenizer formats, licences, initial download size, working memory, latency, and quality in target browsers.
- **Interchangeable inference adapter:** Expose one internal interface for structured responses and tool validation, so a future browser runtime can be swapped without changing the map graph, rules engine or saved projects.
- **Optional native acceleration only:** `llama.cpp` via `llama-server` may be supported as a user-installed and user-started localhost backend. Ollama may be another optional backend. A PWA cannot itself launch these executables. Both are nonessential to the required default experience.
- **Authoritative local state:** Keep Situation Model, strict rules, confirmed user facts, node graph, flags, and persistence in application-controlled storage—not in language-model chat history.
- **Rule enforcement:** The local AI proposes interpretations, relationships, flags and **one neutral question**. Local deterministic application code validates changes, protects established facts from unsupported inferences, and enforces Strict Brainstorming.
- **Offline setup:** After the initial installation and model download, the complete required app/model assets must be available offline. Define a cache/storage strategy that survives a full browser restart, detects missing/evicted models, and handles updates/version migrations. A standalone first-time installer remains an optional separate distribution question, not a mandatory launcher.
- **Cloud inference:** May be offered only as an optional enhancement, never required for the default offline experience.

### PWA implementation and acceptance checklist

1. Add a web app manifest, production icons, browser installability testing, and a safe update path.
2. Harden the service-worker strategy for static assets; avoid breaking existing sessions on updates.
3. Use durable browser storage (such as IndexedDB and/or OPFS) for projects and downloaded model artifacts; check storage quotas, persistence requests, eviction handling and recovery.
4. Download and validate compatible model weights/tokenizer once, with visible progress and an explicit offline-readiness indicator.
5. Test WebGPU on supported desktop browsers, fallback paths on unsupported devices, and end-to-end airplane-mode/restart use.
6. Confirm model-licence conditions, notice/attribution requirements, privacy and local-inference behaviour.
7. Verify native-local-server support, if offered, is optional and securely restricted to loopback with appropriate origin controls.

### Initial hardware targets to test

- **2B quantized model:** initial default candidate for common 8–16 GB RAM laptops.
- **4B quantized model:** quality-focused option for devices with sufficient system memory and/or GPU capacity.
- Download sizes are not equivalent to peak RAM use; runtime overhead, context/KV cache and graphics-memory needs must be measured on representative laptops.
- Support CPU-only operation where feasible; test GPU acceleration separately. No model-performance promise is approved before benchmarking.

### Acceptance tests before choosing a model

Run **30–50 representative MindMap V3 scenarios**, including multi-turn and reopened-session cases. Measure:

1. Adherence to the user's actual **Strict Brainstorming** rules without silently inventing story facts.
2. Ability to understand a user's answer and maintain the current topic and active branch.
3. Exactly **one contextual question** per response.
4. Accurate classification of **established facts vs. inferences vs. proposals**.
5. Valid node creation, organization and relationships with no unauthorized edits.
6. Detection and non-interruptive flagging of contradictions, gaps and unexplored issues.
7. Reliable saving, reloading and continuation entirely **offline**.
8. Latency, RAM/VRAM use, startup time, and stability on target laptops.

**Licence gate:** Prefer model weights and runtimes with commercially usable permissive licensing (for example, Apache 2.0 or MIT where applicable). Before shipping, review the *exact* model revision, quantized files, runtime and dependencies, plus their required attribution/notices and any other use or redistribution conditions.

**Decision status:** **PWA-first and browser-AI-first evaluation are confirmed architectural decisions.** Choice of browser runtime, specific model, quantization, supported hardware, and optional `llama.cpp` compatibility remains provisional until tested.

## 7. Additional V3 Workstreams (Proposals)

- Mind map navigation, focus behavior, node editing, relationships and layout.
- AI help that supports rather than dominates user thinking.
- Optional templates and idea-discovery launch choices (such as “I have an idea”, “Help me find an idea”, or “Surprise me”). None of these labels or choices have been approved.
- Saving and organization so sessions can be revisited and expanded.

## 8. Open Design Details

- Confirm the exact source and wording of the established story-writing rules and how strict mode interprets them for non-story topics.
- Define an unambiguous set of review-flag types, presentation, severity, and resolution behavior.
- Decide how the assistant categorizes, revises or links nodes without changing the meaning of the user's answer.
- Decide whether the one-question-at-a-time conversation lives next to the canvas, in a panel, or in another arrangement.
- Decide what is saved per map and whether the strict-mode toggle is per map, per session or global.
- Review V2 behavior to preserve it unless superseded by an explicit V3 decision.
- Evaluate the recommended Qwen 3.5 2B/4B candidates against 30–50 offline brainstorming scenarios; decide the local model and runtime only after measuring quality, speed and memory use.
- Define browser model delivery/download, persistent storage, minimum hardware/browser requirements, WebGPU/CPU fallback, offline-readiness checks, and graceful behaviour when inference is unsupported or too slow.
- Decide whether first-time PWA/model installation may require internet access, or whether a separate fully offline initial-install distribution is also needed (without changing the PWA-first default).

## 9. Scope and Change Control

- Items in Section 2 (R1–R7) are approved **design requirements**. Some have partial preview implementations; none should be considered fully accepted until end-to-end validation.
- The detailed interaction flow, AI model/runtime selections and optional companion integration remain provisional; the PWA-first direction is confirmed.
- Repository implementation began 2026-11-07 in `impishlycreative/swamp` on `master`; see the implementation checkpoint below. Browser deployment and offline acceptance have not been confirmed.


## 10. Implementation Checkpoint — 2026-11-07

**Repository:** `impishlycreative/swamp`  
**Canonical app:** `MindMap/` (`MindMap/index.html`)  
**Current preview commit:** `3ab88ae58b970cee5bedb582d7bfaafd26be2fba`  
**Runtime version:** `3.4.0-alpha.1`, defined in one place: `MindMap/core-stability.js`. Other runtime modules consume the exported value.  
**Rollback:** Original app recoverable from Git history; `mindmap v2/` remains intact as the baseline/reference.

Implemented in the V3 preview:

- Promoted all tracked files from `mindmap v2/` into `MindMap/`, replacing the earlier canonical application contents, and reduced the Swamp landing page to one canonical MindMap entry.
- Added guided brainstorming that opens for newly created untitled maps and can be reopened from the Guide button.
- Strict Brainstorming starts on by default per map and can be toggled during a session.
- Captures user answers verbatim, asks only a neutral procedural question at a time, and creates map nodes under the current focus branch.
- Persists the branch focus and a local question-answer history on each map.
- Adds non-interruptive manual review flags and flags for the user's explicit uncertainty; unresolved issues receive node markers and can be resolved later.
- Added the actual `story rules.md` as `MindMap/story-rules.md` for offline reference.
- Added service-worker precaching of the static application for offline reuse after a successful first online load.
- Added V3 smoke checks and preserved V2 regression tests. JavaScript syntax and regression/smoke checks passed in a JavaScript harness, but a browser/device acceptance pass remains outstanding.

**Not yet implemented:** Browser-native on-device Qwen or other model; an installable PWA manifest/icons and complete offline model delivery; semantic contradiction and relationship detection; model-driven adaptive questions; guarantee of durable offline storage where the browser may evict assets; and full offline model-performance tests. The guided implementation is intentionally deterministic and must not be represented as having those capabilities. Supplemental V2 writer modules exist in the V2 file set but were not wired into the original V2 HTML loader; enabling them remains a separate integration test, particularly under Strict Brainstorming.