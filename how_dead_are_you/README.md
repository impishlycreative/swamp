# How Dead Are You?

A deliberately overdramatic sick-person check-in app for **zero or more people**.

## Core interaction

Each sick person gets a recovery slider. The far left is **100% dead** and the far right is **0% dead**.

- 🪦 86–100% dead — Tombstone
- 🛏️ 66–85% dead — Lying in bed
- 🧎 41–65% dead — Crawling
- 🚶 16–40% dead — Walking
- 💃 0–15% dead — Dancing

The percentage moves continuously, while the cinematic background switches at the major status thresholds. The Tombstone state also renders a large, high-contrast RIP headstone with the sick person's name so the lowest state is unmistakable.

## Features

- Dynamic sick-person roster: zero or more people
- Add each person as a **Woman** or **Man**
- Gender-matched photographic scene sets
- Remove individual people at any time
- Large live `% DEAD` display
- Photographic cinematic scene changes
- Explicit RIP tombstone treatment for the dead end of the scale
- `Check in now` timestamp and history
- Native mobile share sheet where available, clipboard fallback otherwise
- Local persistence with `localStorage`
- Responsive mobile/desktop layout
- Reduced-motion support

## Current architecture

This is a static client-side prototype suitable for GitHub Pages. State is stored in the current browser only. Real multi-device synchronization will require a shared backend or realtime datastore in a later version.

## Photography

The prototype loads free stock photography remotely from Pexels. The scene sets include separate man/woman photography for bed, crawling, walking, and dancing, with a shared cemetery photograph for the tombstone state.

Woman scene references:

- Bed: https://www.pexels.com/photo/woman-in-loungewear-lying-on-the-bed-8036757/
- Crawling / crouching: https://www.pexels.com/photo/woman-crouching-on-the-floor-11890374/
- Walking: https://www.pexels.com/photo/woman-walking-on-a-street-in-sunlight-19989394/
- Dancing: https://www.pexels.com/photo/a-woman-dancing-in-the-living-room-6599729/

Man scene references:

- Bed: https://www.pexels.com/photo/man-in-white-shirt-lying-on-bed-4114023/
- Crawling / crouching: https://www.pexels.com/photo/man-in-baggy-jeans-crouching-on-the-floor-18681152/
- Walking: https://www.pexels.com/photo/man-in-shirt-walking-on-street-in-sunlight-13743142/
- Dancing: https://www.pexels.com/photo/man-dancing-in-living-room-10331639/

Shared tombstone / graveyard:

- https://www.pexels.com/photo/a-tombstone-on-a-cemetery-5953236/

## Safety note

The app is a humorous wellness check-in, not a medical assessment or emergency service. A real urgent situation should be handled through normal medical or emergency channels.
