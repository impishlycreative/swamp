# Writing Games Audit — 2026-10-12

## Scope

This audit reviewed every writing-game folder other than `ambush_reimagined`, which had just completed its own dedicated 36-scenario continuity audit. The `revelation` folder was checked but is a redirect to `reveal_reframe`, not a separate canonical game.

Review pipeline used for active games:

**Vale → Skeptic → Professor → Continuity Auditor → Editor → Vale reconciliation**

The audit applied the standing learning-game rules plus the evidence/context, human-logic, reason-for-now, prior-plan, character-collision, structural-variety, all-ages, and accessibility requirements in `PLAN.md`.

## Minimum-bank interpretation

An active canonical game must expose at least **30 meaningfully distinct playable examples, paths, plans, or coherent combinations**.

A raw array does not need 30 entries when a carefully designed combinatorial or branching system already produces more than 30 distinct writing tasks. Cosmetic noun swaps and random combinations that can produce incoherent prompts do not count.

## Results

| Game | Bank after audit | Result |
| --- | ---: | --- |
| Original Ambush | 30 complete scenarios | Expanded from 10 to 30 |
| Cause & Effect | 30 causal chains | Expanded from 10 to 30 |
| Character Collision | 30 complete collisions | Expanded from 10 to 30 |
| Character Filter | 10 subjects × 10 filters × 10 voice moves | Passed; coherent combinatorial bank well over 30 |
| Choice Cost | 10 dilemmas × 10 consequence lenses | Passed; 100 meaningful combinations |
| Constraint | 30 four-stage craft challenges | Expanded from 10 to 30 |
| Escalation | 6 starting scenarios × 8 five-step plans | Passed; 48 complete escalation plans |
| Foreshadow Seed | 10 reveals × 10 ordinary details | Passed; 100 usable pairings |
| Goal Under Pressure | 30 complete scenarios | Expanded from 10 to 30 |
| Hidden Motive | 30 complete setups | Expanded from 10 to 30 |
| Limited Resources | Multi-stage resource scenarios with many branching decision paths | Passed; branching bank exceeds 30 meaningful paths |
| Pacing Pulse | 30 scene seeds | Expanded from 10 to 30 |
| POV Shift | 10 events × 10 viewpoints × 10 missions | Passed; coherent combinatorial bank well over 30 |
| Reveal Reframe | 30 curated opening/reveal pairs | Rebuilt from 10 to 30; legacy pairs repaired for evidence, source, and why-now logic |
| Revelation | Redirect to Reveal Reframe | Not a separate canonical bank |
| Scene Compression | 10 events × 10 required surviving elements | Passed; 100 meaningful combinations across three compression cuts |
| Sensory Lens | 10 settings × 10 states × 10 loose details × 10 lenses | Passed; large coherent combinatorial bank, with permission to reject irrelevant loose details |
| Story Pressure | 10 scenes × 3 scene-specific four-shift plans | Structurally rebuilt; 30 curated pressure plans replaced generic pressure cards |
| Subtext Signal | 10 setups × 10 subtext constraints | Passed; 100 meaningful combinations |
| Worst Possible Choice | 10 situations × 3 fully developed bad-choice paths | Passed; exactly 30 complete paths |

## Change count

### Games

- **19 active canonical games reviewed in this pass** (excluding the already-audited Ambush Reimagined).
- **9 games required changes.**
- **10 active games passed without bank expansion or structural repair.**
- **1 additional folder (`revelation`) was confirmed as a redirect rather than a separate game.**

### Content

Eight games had ten-item curated banks and needed twenty additional examples each:

- Original Ambush
- Cause & Effect
- Character Collision
- Constraint
- Goal Under Pressure
- Hidden Motive
- Pacing Pulse
- Reveal Reframe

That required **160 net new curated examples**.

Reveal Reframe also required its **10 legacy opening/reveal pairs to be repaired or replaced** so the reveal had a believable source, a reason to become known now, and a clear reinterpretation of prior details.

Story Pressure required a **mechanic-level continuity repair**. Its old generic pressure deck could introduce facts that did not exist in the chosen scene, such as an unestablished trusted helper or arbitrary authority figure. The generic deck was removed and replaced with **30 scene-specific four-shift pressure plans** (three plans for each of ten scenes).

Using scenario/plan-level changes as the unit, this pass therefore made:

- **160 new examples added** to under-sized banks;
- **10 legacy Reveal Reframe examples repaired/replaced**;
- **30 new curated Story Pressure plans** replacing the invalid generic-pressure approach;
- for **200 scenario/plan content changes total**, plus the Story Pressure mechanic redesign itself.

### Repository files

Game files changed:

1. `ambush/game_index.html`
2. `cause_effect/game_index.html`
3. `character_collision/game_index.html`
4. `constraint/game_index.html`
5. `goal_under_pressure/game_index.html`
6. `hidden_motive/game_index.html`
7. `pacing_pulse/game_index.html`
8. `reveal_reframe/game_index.html`
9. `story_pressure/game_index.html`

Documentation changed/created:

- `PLAN.md` — added the 30-example standard and permanent persona/continuity review rules.
- `AUDIT.md` — this audit record.

## Key defects caught by the personas

### Skeptic

The main risk was false variety: games with ten examples could feel larger because of random presentation while still repeating the same reasoning. The new standard counts meaningful playable variation, not raw string combinations.

### Professor

Expansions were required to preserve the core teaching mechanic. New examples were not accepted when they merely changed setting or profession without changing the reasoning, tactic, craft restriction, or consequence pattern.

### Continuity Auditor

The most serious defect was Story Pressure. Generic pressure cards were able to introduce unestablished helpers, plans, authority figures, or secrets. Those cards could not reliably answer “why is this a problem now?” The game now chooses from pressure sequences written specifically for the selected scene.

Reveal Reframe also needed stronger information flow. Reveals now identify how the truth becomes known and why the earlier evidence reasonably supported the initial interpretation.

### Editor

New examples were checked for missing context, artificial exposition, repeated structure, vague stakes, and unnecessary genre shorthand. Concision was preserved, but not at the cost of causal comprehension.

## Current state

Together with the previously completed Ambush Reimagined audit, every active canonical writing game now meets the standing **30 meaningful examples/paths/combinations** requirement under the current interpretation in `PLAN.md`.
