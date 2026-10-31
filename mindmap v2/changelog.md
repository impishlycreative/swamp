# MindMap V2 Changelog

## 3.1.0 — 2026-10-31

### Rapidfire review and consolidation

- Bumped MindMap V2 from **3.0.0** to **3.1.0** because this release adds a new saved-data workflow rather than a cosmetic change or bug fix.
- Rapidfire-created child ideas are now marked as **raw brainstorming ideas**. They stay generic instead of automatically becoming Scene, Character, Clue, or another writer type while the writer is still capturing possibilities.
- When Rapidfire ends, the parent idea is selected again and the app points the writer to **More → Review Ideas**.
- Added **Review Ideas** for a parent with raw Rapidfire children. The review screen shows each idea, keeps it selected by default, and suggests a plain-English category based on the parent type and the idea text.
- Character review categories include Traits, Abilities, Goals, Backstory, Relationships, Secrets, and Other. Scene, Chapter, Location, Clue, Reveal, Setup, Payoff, Subplot, Research, story-beat, and general parents use their own smaller category sets.
- Category suggestions are only suggestions. The writer can change the category before consolidating.
- Added three review outcomes: **Move into parent**, **Group under headings**, and **Keep as nodes**.
- **Move into parent** stores the selected ideas as structured `writer.details` on the parent and removes the original raw child nodes when they are safe leaf nodes. A raw node with children, a linked map, or cross-links stays on the map so consolidation does not silently break existing structure.
- **Group under headings** creates or reuses category nodes such as Abilities or Backstory and moves the selected ideas beneath them instead of flattening them into parent details.
- **Keep as nodes** marks the selected ideas as reviewed so they remain on the map and stop appearing as unfinished Rapidfire material.
- Added a Details section to the normal Edit inspector. Consolidated parent details are shown by category, and a parent with raw children gets a direct **Review Ideas** button there as well.
- Added **Consolidate** to multi-select. Selected sibling ideas can open the same review screen, even when they were not created by Rapidfire.
- Added consolidation-specific Undo handling for Move, Group, and Keep actions. Undo restores the previous node/detail state when no later structural edit has replaced it.
- Added mobile-first review layout with a bottom-oriented review sheet, large category controls, and the primary Move action spanning the width on touch devices.
- Loaded the new workflow through `consolidation.js?v=3.1.0` and refreshed V2 asset cache keys to 3.1.0.

## 3.0.0 — 2026-10-31

### Foundation

- Forked the complete current `MindMap` application into `mindmap v2` so V2 can evolve independently while retaining the existing local-first project/map data model and browser storage compatibility.
- Set the HTML title to `MindMap 3.0.0 V2 — Swamp` directly in the document to avoid the old-version browser-tab flash during startup.
- Kept desktop and mobile on one data model while adding separate responsive treatments for the new V2 surfaces.
- Added **MindMap V2** to the repository root `index.html` under Visual experiments, linking directly to `mindmap v2/index.html`.

### Writer-first map interactions

- Added a context-sensitive writer action bar directly beside the selected map node on desktop and above the bottom toolbar on mobile.
- Kept common actions on the map itself: Add, Rapidfire, Lens, Link, Type, Thread, Health, and Branch actions are available from the selected idea without navigating to a separate application view.
- Added writer-specific node types for scenes, chapters, characters, locations, conflicts, themes, clues, reveals, subplots, objects, research, setups, and payoffs.
- Added unobtrusive type and story-thread badges directly to map bubbles.
- Added story threads with one-click map highlighting so Main Plot, Character Arc, Mystery, Romance, Subplot, Foreshadowing, and custom threads can be isolated without leaving the canvas.
- Added stronger map lenses that highlight the selected idea's useful story context and dim unrelated material. Character, scene, clue, setup, chapter, subplot, and template-beat lenses use their existing hierarchy and cross-links rather than creating duplicate views.
- Added writer-aware two-click relationships. Selecting **Link** and then another node immediately creates a sensible relationship such as Clue → Reveal, Setup → Payoff, Character → Scene, Scene → Location, Conflict, or Character Relationship when the node types make the intent clear.
- Added context-aware Rapidfire prompts so brainstorming stays short and changes with the selected idea type, including scene turns, character wants/secrets, location details, clue meanings, and template-beat possibilities.
- Made existing story-template beats recognizable as writer-aware map objects and added a direct **Ideas** action for linked beat brainstorming maps.
- Added Story Health overlays directly on the map for unresolved setups/clues, disconnected characters, empty template beats, explicitly marked needs-work ideas, and broken cross-links. Clicking a health item returns directly to the affected node.
- Added branch-level operations for collapse/expand, deep duplication, automatic positioning, and marking/clearing needs-work status. Duplicating a branch also duplicates relationships contained entirely inside that branch.
- Added smart child defaults so children created beneath Chapter or Subplot nodes become Scenes automatically while other contexts remain lightweight ideas.
- Enhanced the existing Writer's Navigator with node type and story-thread metadata while keeping the map as the source of truth.
- Applied the one-click/two-click interaction rule: frequent actions are immediate, variations use a second selection, and destructive actions remain outside the fast context bar.
- Added a mobile-first writer action strip with touch-sized controls rather than shrinking the desktop interaction model.

### Selected-node UI refinement

- Changed normal node selection so it no longer opens the full inspector automatically; selecting a node now keeps the map visible and shows the compact writer action bar only.
- Added a direct **Edit** action to the writer bar. Clicking node text also opens the inspector intentionally, so detailed editing is available when requested rather than competing with the map.
- Removed the redundant **Add Idea** action from the writer bar because the selected node already has the one-click `+` child control on the canvas.
- Moved **Story Health** out of the fast bar and into **More**, keeping it available in two interactions while reducing clutter.
- Renamed ordinary **Branch** access to **More**; linked template beats retain the direct one-click **Ideas** action.
- Added a desktop drag handle to the writer bar. The bar can be dragged anywhere in the viewport and remembers its dropped position locally.
- Added double-click on the drag handle to reattach the writer bar to the selected node.
- Consolidated mobile selected-node actions into the writer action strip and hid the older duplicate mobile bottom toolbar, leaving one touch-oriented action surface.
- Added a new cache key for the writer loader so browsers fetch the updated interaction model immediately.

### Story template initial viewport

- Changed newly created story-template overviews so they no longer begin by shrinking the complete storyline to fit on screen.
- The initial view now centers on the opening section of the story and chooses a readable zoom that shows a useful chunk of beats: roughly three beats on a phone and about five to seven on wider screens.
- The initial framing is applied only once to newly created template overviews and is saved with the map so later navigation and zoom choices are preserved.
- After the opening view is framed, the temporary centered beat is deselected so the template opens as a clean canvas.
- Kept the existing **Fit** command unchanged; writers can still fit the complete template whenever they explicitly ask for it.
- The minimap remains the intended way to understand and navigate the parts of a long story structure that begin outside the main viewport.

### Writer feature review and consolidation

- Simplified the selected-node writer bar to its strongest everyday actions: **Edit, Rapidfire, Lens, Link, More**. Type and Thread were removed from the permanent bar so the canvas stays primary.
- Made desktop type badges actionable: clicking a node's type badge opens the type picker directly. On mobile, **Idea type** is available under **More** as a two-tap variation.
- Made existing thread badges actionable on desktop and added **Story thread** under **More** for assigning or changing a thread, including on mobile.
- Reduced the normal type picker to types that currently change application behavior: **Idea, Scene, Chapter, Character, Location, Clue, Reveal, Subplot, Research, Setup, Payoff**. Conflict, Theme, and Object are no longer offered as new dedicated types until they have a stronger behavioral use case.
- Added concise explanations to each offered type so the writer can see why that type exists before choosing it.
- Upgraded active Story Threads from simple tags/highlighting into visible paths drawn through their mapped nodes. Thread paths show clear start/end points; single-point threads are visibly identified and can be surfaced by Story Health.
- Added writer-specific visual semantics to cross-branch relationships so Clue → Reveal, Setup → Payoff, Character → Scene, and Scene → Location links are easier to distinguish directly on the canvas.
- Expanded Rapidfire beyond placeholder changes by adding short context prompts. Scene brainstorming offers Obstacle/Reversal/Consequence; Character offers Want/Fear/Secret/Contradiction/Choice; Clue, Location, Setup, Payoff, Research, Subplot, Chapter, Reveal, and story beats each get similarly concise writer-focused directions.
- Narrowed Story Health to objective structural facts the map can prove. It now checks needs-work markers, clues without reveal/payoff relationships, setups without payoffs, empty template beats, broken relationships, and threads with only one mapped point. It no longer treats a disconnected character as automatically being a story problem.
- Added a clear Health statement that the checks are structural facts only and do not judge writing quality.
- Renamed **Duplicate branch** to **Explore alternative**, keeping the same deep-copy behavior and internal relationship preservation but making the writing use case explicit.
- Corrected smart-child behavior so **Chapter → Scene** remains automatic, while a Subplot no longer silently forces every new child to become a Scene.
- Simplified the Writer's Navigator footer so Navigator stays a navigation surface: select an idea to return to and center it on the map; writing actions remain on the map itself.
- Added a fresh cache key for the reviewed writer feature layer.

### Contextual help and guided tours

- Replaced the existing `?` shortcut entry point with **Help & guided tours** while retaining keyboard shortcuts as a searchable help topic.
- Added user-chosen guided tours for **Learn the map**, **Build a story**, **Develop a character**, **Develop a scene**, **Track clues and payoffs**, **Develop a subplot**, and **Use a story template**.
- Kept the tour flow inside the click-count rule: open Help in one click and select a tour context in the second click; choosing the context starts the tour immediately without an extra confirmation screen.
- Added live spotlight tours that point at the actual canvas, selected nodes, writer action bar, minimap, template controls, and Navigator when those controls are available.
- Added context detection based on the selected writer node type and current map, so Help surfaces a matching tour such as Character, Scene, Mystery/Setup-Payoff, Subplot, or Template.
- Added **Help for this idea** under the selected node's **More** menu for contextual explanations without adding another permanent writer-bar control.
- Added searchable function help for the map, editing, Rapidfire, Lens, writer links, writer types, Story Threads, Story Health, templates, minimap, Navigator, Focus/Collapse, branch tools, Story Walk, save/export, mobile use, and keyboard shortcuts.
- Kept help content short and practical, explaining what a feature is for, when to use it, and the few actions needed to use it.
- Added mobile-first help presentation: the help hub becomes a bottom-oriented sheet and tour steps stay above safe areas while spotlighting the relevant touch target.
- Added `?` keyboard access to Help & guided tours when focus is not inside an editable control.
- Tours do not auto-start; the writer explicitly chooses the context they want help with.
- Loaded the help system through `guide-help.js?v=3.0.0-guide1` so the new functionality receives its own cache key.

### More menu hang fix

- Fixed a MutationObserver loop that could freeze the page when **More** opened. The writer-feature review layer was repeatedly rewriting the Story Health description, and that rewrite retriggered the same observer indefinitely.
- Made the More-sheet decorator idempotent: the Story Health description is now changed only when its text actually differs.
- Cache-busted `writer-feature-review.js` to `review2` so browsers do not retain the looping version after refresh.

### Plain-English help and tours

- Rewrote the guided tours in short, plain-English steps instead of textbook-style explanations.
- Cut most tours to three focused steps so each screen explains one thing at a time.
- Reworked searchable help copy to use everyday wording and direct instructions rather than terms such as hierarchy, semantic links, structural facts, or narrative strands where they were not needed.
- Simplified help headings to **Right now**, **Show me**, **What do you want to do?**, **Good for**, and **Do this**.
- Kept feature names such as Lens, Rapidfire, Story Threads, and Story Health where the user needs to recognize the actual control.
- Simplified **Help for this idea** to say what it does rather than describe the help system itself.

### Writer's Navigator

- Added a synchronized hierarchical outline with breadcrumbs.
- Added live map statistics for ideas, notes, relationships, and hierarchy depth.
- Added idea/description filtering.
- Added note, child-count, and relationship indicators.
- Added map selection/centering from the outline.
- Added branch collapse/expand controls from the navigator.
- Added a mobile-first full-screen navigator and a compact desktop slide-in panel.

### Cross-branch relationships

- Added labelled free relationships between ideas without changing the parent/child hierarchy.
- Added forward, bidirectional, and non-directional relationship modes.
- Added relationship line/label editing and deletion.
- Added relationship rendering that follows node positions while the map changes.
- Persisted relationships in the map JSON as `relationships`, which is retained by local save and JSON export/import.
- Added immediate Ctrl/Cmd+Z support for relationship edits.

### Story Walk

- Added an immersive hierarchy walkthrough for presenting and reviewing a map.
- Added previous/next, parent, breadcrumb, child, and related-idea navigation.
- Added keyboard arrow navigation and horizontal swipe navigation on touch devices.
- Added linked-map navigation inside Story Walk.
- Added **Show on map** to exit and center the current idea.

### Zen Canvas

- Added distraction-free canvas mode with one-tap/one-key exit.
- Added `Z` shortcut.

### Access and shortcuts

- Added desktop toolbar controls for Navigator, Link, Story Walk, and Zen.
- Added a direct Navigator control to the mobile top toolbar.
- Added V2 actions to the mobile utility sheet and selected-idea inspector.
- Added `Ctrl/Cmd+Shift+O`, `Ctrl/Cmd+Shift+L`, and `Ctrl/Cmd+Shift+P` shortcuts and documented them in the existing shortcuts dialog.