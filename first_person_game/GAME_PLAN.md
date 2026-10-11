# First-Person Game Plan

## Goal
Build a small, responsive first-person game in Godot that runs well on modest hardware, including an 8th-generation Intel system with integrated graphics. Keep it license-free, lightweight, and simple enough to expand without turning into an engine-development project.

## Phase 1 — Foundation
Set up the Godot project inside `first_person_game/` with the Compatibility renderer as the default.

Create a basic first-person controller with:
- mouse-look
- WASD movement
- jumping
- gravity
- collision
- a simple test room

The first milestone is deliberately simple but important: walk around a room smoothly at a stable frame rate.

## Phase 2 — Interaction
Add a reusable interaction system based on a raycast from the camera.

The player should be able to look at objects and interact with them using one key.

This should become the common system for:
- doors
- buttons
- switches
- pickups
- notes
- NPC interaction
- other interactable objects

## Phase 3 — Game Structure
Use a simple scene structure:

- Player
- World
- Level
- Interactables
- UI
- Audio

Levels should be separate scenes so experiments can be built without changing the core player code.

## Phase 4 — Performance Baseline
Before building actual gameplay, establish limits appropriate for Intel integrated graphics:

- Compatibility renderer
- simple materials
- mostly static lighting
- limited dynamic shadows
- modest texture sizes
- restrained particle effects
- minimal post-processing
- configurable resolution and quality settings

Add a small FPS/debug display so performance problems are immediately visible.

## Phase 5 — First Actual Game
Once movement and interaction feel good, build one very small playable experience rather than attempting a full game immediately.

Target approximately 5–10 minutes of gameplay:

1. Enter a location.
2. Explore it.
3. Discover what happened.
4. Interact with several objects.
5. Encounter one gameplay complication.
6. Reach an ending.

This provides a real test of movement, atmosphere, interaction, level design, audio, and performance without producing months of infrastructure first.

## Phase 6 — Reusable Systems
Only after the prototype works should reusable systems be extracted or expanded, such as:

- inventory, if needed
- dialogue
- objectives
- save/load
- doors
- triggers
- sound zones
- reusable interaction components
- level transitions

Avoid building systems until the game demonstrates that they are actually needed.

## Proposed Repository Structure

```text
first_person_game/
├── README.md
├── GAME_PLAN.md
├── project.godot
├── scenes/
│   ├── player/
│   ├── levels/
│   ├── interactables/
│   └── ui/
├── scripts/
│   ├── player/
│   ├── interaction/
│   └── systems/
├── assets/
│   ├── models/
│   ├── textures/
│   ├── audio/
│   └── fonts/
├── docs/
│   ├── PERFORMANCE_TARGETS.md
│   └── ARCHITECTURE.md
└── tests/
```

## First Concrete Deliverable
Build only these pieces first:

- Player
- Test Room
- Interaction Raycast
- FPS Counter

Do not expand the architecture until those pieces work and feel good.

## Design Warning
The main risk is spending too much time building architecture before there is an actual game.

Godot makes it easy to create reusable systems before knowing whether they are needed. Keep the first implementation deliberately small and practical. Build the first playable room quickly and let the game itself determine which systems deserve to become reusable infrastructure.
