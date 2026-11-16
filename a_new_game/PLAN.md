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

## Golden-eyed watcher (November 16, 2026)
- Rare randomized distant encounter: two golden eyes begin low in the grass, then rise slowly as a black wolf-headed humanoid silhouette stands to full height.
- The figure watches without attacking. Sometimes it vanishes when approached; other times it remains watching before fading away.
- Keep it distant, subtle, and unsettling; no automatic jump scare or growl.
- Implemented in a_new_game/main.js, commit 9fd7b32b5384504e5dd5ddad4a619ea7983cb99d. Visual behaviour still requires browser testing.
