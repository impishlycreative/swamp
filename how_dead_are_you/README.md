# How Dead Are You?

A deliberately overdramatic two-person sick check-in app.

## Core interaction

Each person has a recovery slider. The far left is **100% dead** and the far right is **0% dead**.

- 🪦 86–100% dead — Tombstone
- 🛏️ 66–85% dead — Lying in bed
- 🧎 41–65% dead — Crawling
- 🚶 16–40% dead — Walking
- 💃 0–15% dead — Dancing

The percentage moves continuously, while the cinematic background switches at the major status thresholds.

## Features

- Two independently controlled sick-person cards
- Large live `% DEAD` display
- Photographic cinematic scene changes
- `Check in now` timestamp and history
- Self-operated **ESCALATE** button
- Escalation worsens the reported condition by 20 percentage points and flags the card
- Native mobile share sheet where available, clipboard fallback otherwise
- Editable patient names
- Local persistence with `localStorage`
- Responsive mobile/desktop layout
- Reduced-motion support

## Current architecture

This is a static client-side prototype suitable for GitHub Pages. State is stored in the current browser only. Real two-device synchronization will require a shared backend or realtime datastore in a later version.

## Photography

The prototype loads free stock photography remotely from Pexels:

- Tombstone / graveyard: https://www.pexels.com/photo/a-tombstone-on-a-cemetery-5953236/
- Bed: https://www.pexels.com/photo/woman-in-loungewear-lying-on-the-bed-8036757/
- Crawling / crouching: https://www.pexels.com/photo/woman-crouching-on-the-floor-11890374/
- Walking: https://www.pexels.com/photo/woman-walking-on-a-street-in-sunlight-19989394/
- Dancing: https://www.pexels.com/photo/a-woman-dancing-in-the-living-room-6599729/

## Safety note

The app is a humorous wellness check-in, not a medical assessment or emergency service. A real urgent situation should be handled through normal medical or emergency channels.
