# Swamp Writing Games Design Plan

## Purpose

The writing games are first and foremost learning experiences wrapped in games. Fun supports engagement, but the game mechanic should serve a writing purpose rather than existing only for its own sake.

Games may fall into three broad purposes:

1. **Learning games** — built around a specific writing concept, with a mechanic that directly teaches or practises it.
2. **Exploration games** — encourage experimentation with character, plot, dialogue, description, language, structure, or other writing choices without necessarily centring on one formal lesson.
3. **Pure-play writing games** — primarily fun, but still rooted in writing or creative exploration rather than being generic games with a writing theme pasted on top.

## Standing Design Rules

1. **Learning comes first.** When a game teaches a concept, the learning objective is designed before the game mechanic.
2. **The mechanic should do the teaching.** Playing the game should directly exercise the skill or concept being taught.
3. **Mixed-skill audience.** Games should be easy for beginners to enter while still offering enough depth for experienced writers.
4. **Solo-friendly by default.** A normal game should work for a person playing alone or alongside others. Games that specifically require collaboration belong in a separate group-game category.
5. **Aim for about five minutes.** Setup and instructions should be minimal and the activity should reach its useful writing experience quickly.
6. **Explain the learning goal before play.** Each learning game should open with a short two- or three-sentence explanation of what the player is about to practise.
7. **No mandatory debrief.** Once the activity is complete, the game can end cleanly. The player already knows the learning goal before starting.
8. **Completion, not winning.** Games should not normally create winners and losers. The meaningful state is complete or not complete.
9. **Do not collect the player's writing.** The site may provide prompts, structure, timing, choices, and constraints, but actual writing happens off-site in the player's notebook, document, or preferred writing tool.
10. **Prompts should be loose but anchored.** Give creative freedom without allowing the activity to drift away from the writing concept being practised.
11. **Favor scenario variety.** Replays should offer substantially different situations while keeping the underlying concept strong and consistent.
12. **Vary the learning path, not just the story wrapper.** Different scenarios should not all reduce to the same question, same reasoning pattern, or same answer type. Replay variety must include different kinds of thinking, decisions, comparisons, sequencing, constraints, or applications of the concept.
13. **Genre is flexible.** Comedy, mystery, fantasy, horror, absurdity, and other genres are all valid if they support the concept.
14. **Keep content all-ages.** For horror, *Goosebumps* / R. L. Stine is the approximate ceiling for intensity: spooky, tense, creepy, or mildly gross is acceptable; graphic or adult material is not.
15. **Reward useful writing behaviour.** Avoid mechanics based mainly on guessing, arbitrary scoring, speed, or pleasing the computer unless those mechanics genuinely serve the writing skill being practised.
16. **Random generation is the default where appropriate.** When games use scenarios, prompts, changes, or complications, random selection should generally be preferred so players react to the exercise rather than optimize around a chosen answer.
17. **Game structure may vary by concept.** Some games may use one continuous piece of writing; others may use several short bursts. Fixed rounds, total-time limits, or other end conditions are all acceptable if they best serve the lesson.

## Timed-Game Rules

Timed games form a reusable family of mechanics, but the timed event itself must always serve the concept being taught.

1. **Prominent central countdown.** The timer should be visually central and easy to read on both desktop and mobile.
2. **Pulsing warning state.** The timer should visibly pulse, with stronger emphasis as the transition approaches.
3. **Consistent transition cue.** The final seconds should use the established `beep, beep, beep, BEEEEEEEP` audio pattern.
4. **Never rely on audio alone.** The same transition must be unmistakable visually and programmatically for accessibility.
5. **The timed event can change anything that serves the lesson.** It may change the situation, goal, constraint, point of view, permitted technique, relationship, or other writing condition.
6. **Continuous and burst structures are both valid.** Different timed games should deliberately vary between an evolving continuous piece and shorter separate writing bursts.
7. **End conditions are concept-driven.** A timed game may use a fixed number of shifts, a total duration, or another end condition depending on what best teaches the concept.

## Accessibility Standard

Accessibility is a release requirement, not a best-effort enhancement.

- Every writing game must conform to **WCAG 2.2 Level AA** at minimum.
- Applicable Level A and AA success criteria must be satisfied before a game is considered finished.
- Useful Level AAA practices should be adopted where practical, but AAA is not required as a whole-site conformance target.
- Accessibility must cover the complete experience: perceivable, operable, understandable, and robust.
- Keyboard access, visible focus, semantic controls, screen-reader-compatible status updates, sufficient contrast, appropriate target sizing, touch usability, reduced-motion support, and alternatives to sound-only or color-only information must be addressed.
- Games must remain usable on small screens and should not depend on hover-only interaction, dragging without alternatives, or motion that cannot be reduced.

### What WCAG 2.2 AA Means for Presentation

WCAG 2.2 AA should not be treated as a requirement to make the site visually bland or generic. It constrains inaccessible techniques, not creativity.

Common visible effects may include:

- stronger text and control contrast;
- visible keyboard focus states;
- sufficiently large and well-spaced interactive targets;
- controls and information that remain understandable without relying only on colour, sound, animation, or hover;
- reduced-motion behaviour for users who request it;
- layouts that remain functional at narrow widths and higher zoom levels.

The main costs are implementation and testing discipline rather than presentation quality. Some visual ideas may need adjustment if they depend on very low contrast, tiny controls, hidden focus, hover-only interaction, sound-only cues, aggressive motion, or inaccessible dragging. In general, the large controls, simple layouts, prominent timers, and mobile-first direction already used by the writing games are compatible with strong accessibility.

## Responsive Layout and KCW Visual Direction

The games should feel like part of the Kemptville Creative Writers site while still behaving like purpose-built games.

1. **Mobile remains a first-class experience.** Preserve the strong stacked mobile layouts and large touch-friendly controls unless a specific game mechanic requires a different treatment.
2. **Desktop must not be a stretched phone layout.** At wider breakpoints, use the extra horizontal space to create a game workspace or game board. Related information, controls, prompts, timers, characters, or consequences should sit side by side when that improves play.
3. **Choose the desktop layout by mechanic.** Comparison games, sequence/chain games, reveal games, timed-pressure games, and prompt/reflection games may use different desktop compositions. Do not force every game into one generic grid.
4. **Reduce unnecessary vertical travel on desktop.** Important game state and primary controls should generally remain visible together without long scrolling where practical.
5. **Match the KCW main-site visual language.** Typography, spacing rhythm, card treatment, control styling, border radius, visual hierarchy, and general polish should feel related to the KCW main site.
6. **Allow game-specific accents.** Individual games may retain their own accent colour or mood where useful, provided contrast and other WCAG 2.2 AA requirements are met.
7. **Accessibility survives every breakpoint.** Reflow, horizontal grouping, larger desktop canvases, sticky regions, animations, and visual emphasis must not reduce keyboard usability, focus visibility, reading order, zoom support, reduced-motion behaviour, touch usability, or screen-reader clarity.
8. **Responsive changes must preserve logical order.** The DOM and focus order should remain meaningful even when desktop CSS visually rearranges the interface.

## Design Test for Every New Game

Before a game is considered ready, ask:

- What writing concept or writing behaviour is this game meant to support?
- Does the mechanic itself make the player practise that concept or behaviour?
- Can a beginner start quickly without making the activity shallow for an experienced writer?
- Does it work solo unless it is intentionally categorized as a group game?
- Can a normal round fit roughly within five minutes?
- Is the learning goal clear before play begins?
- Does the site avoid collecting the player's writing?
- Does replay vary the thinking, not just the wording of scenarios?
- Is the content appropriate for an all-ages audience?
- Does the game meet WCAG 2.2 AA before release?
- Does the desktop layout use wider screens intentionally rather than merely stretching the mobile stack?
- Does the game feel visually related to the KCW main site without losing the identity of its own mechanic?
