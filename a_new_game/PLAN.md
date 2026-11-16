# The Road — Prototype Plan

## Current scene
First-person moonlit dirt road, tall grass, lantern, distant town, movement and footsteps. The town remains intentionally unreachable; do not extend the movement boundary until requested.

## Approved atmosphere (November 16, 2026)
- Fireflies: sparse, randomized yellow-green lights above roadside grass; no more than roughly 5–10 visible at once, with independent slow drift and pulsing.
- Crickets: one moderately nearby but not adjacent cricket, quiet, slow intermittent chirps separated by several seconds of silence; remove the dense continuous chorus.
- Grass rustling: independent of player movement, distant and directional, irregularly every 30–120 seconds; suggest unseen movement.
- Werewolf howls: distant and subdued, randomized every 3–5 minutes; first howl within approximately 2 minutes of starting audio. Occasionally a second more distant answering howl.
- Preserve stretches of relative silence, existing player footsteps, and town boundary.

## Implementation
Implemented in a_new_game/main.js, commit c59a9f1c967843185f076318c487a77c55a4075a. Browser playback and acoustic balance still require live testing. The distant howl is synthesized, not a recorded animal sample.
