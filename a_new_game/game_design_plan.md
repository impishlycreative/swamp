# A New Game — Initial Design Plan

**Created:** November 16, 2026  
**Status:** Early concept and discovery  
**Project folder:** `/A New Game/`

## 1. Creative vision

Create an **18+ first-person urban horror game** that combines an explorable open world, strong narrative, high-quality graphics and effects, compelling sound, and both single-player and multiplayer experiences.

The defining goal is **fear through uncertainty and sustained suspense**, not through cheap or frequent jump scares. A player should be able to feel genuinely scared even when no antagonist is visible.

## 2. Preferences established in conversation

| Aspect | Current direction | Confidence / qualification |
| --- | --- | --- |
| Genre | Horror, with a strong psychological/atmospheric feel | Strong preference |
| World | Urban, preferably an explorable open world | Strong preference |
| Historical aesthetic | Victorian-era settings are especially appealing | Strong preference; exact era and city not chosen |
| Camera | First person | Chosen for the described opening experience; whether this applies to all modes remains to be discussed |
| Visuals | Good graphics and excellent visual special effects | Strong preference |
| Audio | Strong environmental sound design and sound effects that reinforce horror | Strong preference |
| Story | A good plot and storyline are important | Strong preference; actual story not yet decided |
| Play modes | Both single player and multiplayer | Strong preference; multiplayer structure undecided |
| Player character | For the initial imagined scene, just an ordinary man; no defined powers or elaborate identity | Provisional; backstory, traits, and character choice not decided |
| Audience | Adults, 18+ | Explicitly chosen |
| Fear style | Intense enough to make players jump out of their seats **without relying on jump scares** | Explicitly chosen |
| Threat | Something may be following the character, but nothing needs to be visible | Example of intended atmosphere; identity and reality of threat undecided |

## 3. Reference scene — the emotional target

A possible scene described by the player: the game is viewed in **first person**, on an urban street at around **2:00–3:00 a.m.** The protagonist is an ordinary man, possibly on his way home. There may be someone following him. Nothing is clearly visible ahead, and he cannot be sure whether anyone is behind him either. The tension comes from the possibility of a presence and from not knowing what is real, where danger lies, or whether danger exists at all.

A **Victorian-era** version of this scene is an appealing possible direction, but the final setting has not been decided.

This is a **mood and experience reference**, **not a locked opening sequence or finalized plot**.

## 4. Core design principles

1. **The unknown is frightening.** Preserve ambiguity rather than revealing every threat or explaining each strange occurrence immediately.
2. **Suspense earns the reaction.** The aim is startling emotional responses created by tension and consequences, not by arbitrary audiovisual shocks.
3. **Sound is central to fear.** Audio cues and environmental sound should work with visuals and silence to create a believable, unsettling space.
4. **Visual quality supports immersion.** Strong graphical and special effects are important, especially when they reinforce atmosphere rather than distract from it.
5. **The city should feel like a place.** Urban exploration is a central appeal; the size, density, interactivity, and openness of the world require later decisions.
6. **A meaningful story matters.** The game should have a compelling plot and unfolding mystery, though story specifics are still open.
7. **Solo and group play both matter.** Both modes are intended; their relationship to narrative, world state, and horror pacing must be designed deliberately.

## 5. Proposed development approach — not yet approved

Before committing to a large open world, consider making a **small first-person playable prototype** focused on the reference scene: one atmospheric street or neighbourhood, convincing lighting, detailed ambient sound, movement, and a sense of being followed without necessarily showing a pursuer. Test whether the moment creates unease *without* conventional jump scares.

If it works, use that as a foundation for expanding world design, story systems, and later multiplayer. This is a scope-control suggestion, **not a final decision about technology, engine, or feature limits**.

## 6. Important decisions still open

- **Place and time:** Actual Victorian city, fictional Victorian-style city, or another urban era?
- **Nature of horror:** Psychological, supernatural, human threat, or a deliberate blend/ambiguity?
- **Player identity:** Ordinary fixed protagonist, customizable character, or multiple viewpoints?
- **Central plot:** Why is the protagonist in the city, and what draws the player into the mystery?
- **Open world:** Size, neighbourhoods, accessibility, dynamic events, and what the player can do between story moments.
- **Gameplay loop:** Exploring, investigating, surviving, solving mysteries, interacting with people, or other actions?
- **Danger and consequences:** Can the player be harmed, pursued, trapped, or killed? How often should threats become tangible?
- **Multiplayer:** Cooperative story, shared exploration, competitive elements, separate mode, or some combination?
- **Horror pacing:** How will fear work when several people play together, and how do we avoid repetitive scares?
- **Presentation and technology:** Visual target, sound system, platform(s), engine, performance requirements, and development capacity.

## 7. Recommended next design discussion

**Choose the game's setting more precisely.** The Victorian aesthetic is appealing, but selecting a historical city, a fictional city, or a different era will shape the world, characters, sounds, architecture, and story possibilities.

---

*Planning record: This document records what has been said so far. Proposed material is clearly marked; no unspoken story, gameplay, or technical choices should be treated as approved.*

## 8. November 16 continuation — rural opening scene and technical targets

### Confirmed opening environment

- The game opens in **first person** with an ordinary man **standing in the middle of a dirt road** in the countryside or township outskirts of the city, late at night (roughly 2–3 a.m. is the earlier mood reference).
- The dirt road runs away in both directions. Looking one way, the road stretches into darkness; looking the other, the lights of a **distant town** are visible.
- **Long grass borders both sides of the road**, and the player can leave the road and walk among it.
- A **full moon** lights the scene. The surroundings should resemble how a human perceives a real landscape at night under strong moonlight: convincing low-light exposure, material detail, depth, and restrained contrast, not an artificially bright daylight scene tinted blue.
- The urban city remains part of the larger intended world, but its exact geography, period, and identity are undecided.

### Absolute presentation priority

**Priority 1 is photorealistic, high-resolution nighttime visuals and excellent, realistic sound.** This must look and sound like a premium game, not a crude browser demonstration. HTML/JavaScript/WebGL/WebGPU or another technology may be evaluated, but no engine has been chosen. The first playable version should prove visual and audio quality before expanding scope.

Lighting targets include physically plausible moonlight, soft/complex shadows, detailed long grass, believable dirt-road materials, atmospheric depth, and natural low-light adaptation. Maintain a convincing first-person camera perspective.

### Interactive cricket soundscape — required

- Cricket sounds should surround the player in **spatial stereo or 3D audio**, with individual chirps/pulsing patterns rather than one flat ambient loop.
- The crickets **nearest the player's current location noticeably quiet or stop** as the player comes close, whether the player walks along the road or steps into the long grass.
- Crickets farther away continue; the environmental sound should change as the player moves through it.
- Previously disturbed crickets resume about **one to two seconds after the player has passed**. This recovery timing is an intended design target to test and tune for naturalism.
- Direction, distance, and relative loudness should track the player's position. The effect should be audible in the first playable scene.

### Movement and input — confirmed direction

- **First-person view.** The player can travel along the dirt road or move into the surrounding grass.
- **Touchscreens:** movement based on touching/tapping the screen in the direction of travel; **no on-screen joystick**. Exact touch camera and path-following behavior remains to be designed and tested.
- **Windows:** conventional **WASD** keyboard movement; exact mouse-look and interactions remain to be decided.

### Starting lantern — confirmed decision

- **The player starts the game already carrying a lantern.** It is equipped at the beginning; it is not something the player must first find.
- The lantern provides **dynamic local lighting** as the player walks, realistically illuminating dirt, grass, and nearby objects, and causing moving shadows as the viewpoint and lantern position change.
- The lantern complements rather than replaces moonlight: it reveals nearby detail while distance remains uncertain.
- Lantern type, fuel mechanics, brightness, whether it can be turned off, and any gameplay penalties are **not yet decided**.

### Initial prototype acceptance criteria

1. The scene reads immediately as a credible **photorealistic nighttime rural road under a full moon**, with distant town lights and tall grass.
2. The player starts in the **road's middle with a working lantern**; lantern light and shadows visibly react to movement.
3. The player can move along the road and into the grass using the intended platform controls.
4. The player hears distinct cricket layers around them; nearby crickets become quiet with approach and return around **1–2 seconds** after the player passes.
5. The environment stays unsettling without needing a visible monster or scripted jump scare.

### Status and boundaries

These are **design requirements, not implemented gameplay**. A generated reference image can illustrate the desired look, but is **concept art, not a real in-engine screenshot**. No engine, assets, budget, performance target, exact town, story, or multiplayer implementation has yet been chosen.

## 9. First playable browser prototype — November 16, 2026

**Code location:** `impishlycreative/swamp/a_new_game/` (`index.html`, `main.js`, `README.md`). This is an implementation milestone, not a claim that the intended visual quality has been achieved. The desired concept image remains the **actual gameplay-quality target**.

### Walking and surface-specific audio — confirmed

- The player hears footsteps **only while actually moving**. Their timing follows distance travelled rather than a permanently repeating loop.
- Dirt-road footsteps should be distinct, heavier and grittier, with surface-appropriate impacts.
- When the player steps into long grass, the audio changes to softer footfalls accompanied by blades of grass brushing and rustling against the character.
- Transition between dirt and grass should occur when crossing the road edge, and motion sounds stop promptly when the player stops.
- This is part of the **initial playable scene**, not something to defer until an expanded game.

### Prototype code now written

- Procedural WebGL scene with moonlit dirt road, long grass, trees, fences, puddles, full moon, distant township lights and a lantern equipped at the beginning.
- Desktop WASD movement and mouse look; touchscreen tap-a-ground-destination to walk and drag to look, without an on-screen joystick.
- Dynamic warm lantern light and shadows; lantern can be toggled.
- Procedurally synthesized cricket voices with relative stereo pan and proximity suppression; approximate 1.5-second return delay after leaving an area.
- Movement-triggered footsteps, with different synthesized dirt and grass effects.

**Verification status:** files committed and JavaScript syntax checked. In-browser visual and audio behavior are **not yet device-tested**. Scene geometry, synthetic sound and placeholder materials are not photorealistic; professional assets, high-quality field audio and visual calibration are required before claiming the desired quality standard.