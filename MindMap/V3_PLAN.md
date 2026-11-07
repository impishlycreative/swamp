# Swamp / MindMap V3 — Design Plan

**Created:** 2026-11-07  
**Updated:** 2026-11-07  
**Status:** Five discovery questions answered; offline operation confirmed; local AI model recommendation recorded for evaluation  
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

**Offline-first candidate implementation:** JavaScript state management and rules engine; local IndexedDB/OPFS persistence; service-worker/PWA asset caching; on-device language model via WebGPU or WebAssembly where supported. These technologies are options, **not approved implementation selections**. Models and associated assets must be installed and available locally before disconnected use. A browser, hardware, and performance feasibility study is needed.

**Key architectural separation:** Deterministic rules/state/persistence should work independently of any cloud API. Semantically rich interpretation and question generation need an adequate local model or a separately designed offline fallback.

## 6. Recommended Offline AI Approach (Recommendation — Not Yet Approved)

**Recommendation:** Design MindMap V3 to use an **interchangeable local language-model backend**. Begin the evaluation with **Qwen 3.5 2B** (lightweight baseline) and **Qwen 3.5 4B** (stronger-quality candidate), preferably with approximately 4-bit quantization. Model availability, exact variant names, compatibility, distribution terms and third-party quantization licences must be verified before adoption.

### Preferred architecture

- Retain the browser-based JavaScript mind-map UI.
- Prefer a **local inference runtime** (for example, `llama.cpp` with an appropriate compatible build), potentially delivered as a companion local service or packaged desktop app, for predictable offline operation.
- Evaluate an all-in-browser alternative (such as WebGPU/WebAssembly with WebLLM or another compatible runtime) if it can meet offline reliability, model support and deployment requirements.
- Keep the authoritative **Situation Model, strict-brainstorming rules, node graph, flags and persistence** in local application code and storage—not in the language model's conversational memory.
- Use the local AI to interpret responses, suggest node relationships, identify review flags, and produce **one relevant question at a time**. Validate its proposed state changes through application rules before applying them.
- Make local models replaceable without rewriting the map engine or losing saved maps.
- Treat cloud inference as an **optional enhancement**, never a dependency for core offline brainstorming.

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

**Decision status:** This is the current technical recommendation, **not a commitment** to a specific model, runtime, packaging method, or hardware requirement. Select only after results from the acceptance tests.

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
- Define the local model delivery/installation model, minimum hardware requirements, supported browsers, and what graceful fallback means when local inference is too slow or unsupported.
- Decide whether first-time installation may require internet access, versus requiring completely standalone setup, including model assets.

## 9. Scope and Change Control

- Items in Section 2 (R1–R7) are approved **design requirements**, not implemented functionality.
- The detailed interaction flow, workstreams and Section 6 technical recommendations remain provisional.
- No changes to the Swamp GitHub repository or deployment are part of this planning update.

## Implementation checkpoint — 2026-11-07

The canonical `MindMap/` folder now contains the V2 application baseline and a V3 preview layer. Implemented now: default-on strict toggle, one neutral question, user-authored node capture, per-map Q/A log and active branch, explicit/author-created review flags, basic local persistence, and a service-worker offline shell. Full AI semantic inference, local LLM distribution, reliable browser-cache persistence and full R1–R7 model-level acceptance testing **remain open**. The original V2 folder is preserved.


### Preview checkpoint refinement

The guide now opens automatically for a new, untitled map once the local workspace is unlocked, and remembers if the user dismisses it. Review-marker cleanup handles multiple flags on the same node. Supplemental V2 writer scripts that are present but absent from the original V2 HTML loader remain deferred pending integration and strict-mode compatibility tests.
