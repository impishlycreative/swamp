# Glittering — Project Plan

## Goal
Enter an address and watch a cinematic approach from space, zooming onto the location in aerial imagery, followed by a glitter descent and a colourful shower that covers the surrounding area.

## Project location
`Glittering/` in `impishlycreative/swamp`.

## Experience
1. Enter an address and confirm the selected location.
2. Reuse the introductory cinematic concept from the I Have No Clue project, adapting the camera destination to the address rather than the Colossus.
3. Zoom from the satellite approach into a clear aerial view of the selected property.
4. Animate the descending glitter delivery, including the fiery atmospheric entry effect.
5. Spread sparkling glitter over the area, with replay and reset controls.

## Imagery research
- Initial location: Newcastle, Ontario.
- Investigate Clarington's address-search maps and its aerial imagery service labelled 2025 for clarity and reuse permissions.
- Google Maps satellite imagery remains an alternative through its official APIs; assess applicable terms, attribution, billing, and overlay requirements before implementation.
- Keep imagery credits visible. Do not assume a publicly viewable map grants permission to reuse its imagery.
- Imagery provider and licensing remain undecided.

## Consolidated aerial imagery sources
Initial area: Newcastle, Ontario. Compare these three sources before selecting imagery:
- Clarington municipal maps: address search and aerial photography; a service labelled 2025 was found. https://www.clarington.net/planning-and-development/maps/
- Durham Region YourDurham: regional aerial imagery layer. https://geoapps.durham.ca/Geocortex/Essentials/REST/sites/YourDurham/map
- Geospatial Ontario imagery catalogue: publicly available orthophotography collections, including open data where Ontario owns the rights. https://data.ontario.ca/dataset/open-ontario-imagery
For each source, verify exact property coverage, capture date, pixel resolution, download/API availability, licence, attribution, and suitability for animated overlays. Viewing access alone is not reuse permission.

## Terrain and topography
- Add terrain elevation research for Newcastle, alongside aerial imagery.
- Ontario Digital Terrain Model (Lidar-Derived) represents bare-earth elevations. Verify local tile coverage and resolution: https://data.ontario.ca/dataset/ontario-digital-terrain-model-lidar-derived
- Durham YourDurham exposes contour layers; inspect Newcastle coverage and available contour intervals.
- Ontario Provincial Digital Elevation Model is a broader fallback: https://geohub.lio.gov.on.ca/maps/mnrf%3A%3Aprovincial-digital-elevation-model-pdem/about
- Proposed implementation: drape appropriately licensed aerial imagery over an elevation mesh to show actual hills and slopes during the approach.
- Bare-earth terrain does not provide detailed 3D houses or trees. Investigate surface models or classified lidar separately if building heights are needed.
- Verify download formats, coordinate systems, vertical datum, licence and attribution before combining datasets.
- Newcastle photorealistic Google 3D building coverage remains unverified: the coverage viewer's vector map failed in the research browser.

## Work stages
1. Locate and inspect the existing I Have No Clue cinematic code and reusable assets.
2. Verify imagery coverage, integration options, and licensing for the initial location.
3. Prototype address selection, camera approach, and glitter effects.
4. Refine visuals and verify desktop and mobile performance.
5. Review the completed experience and add repository index integration if requested.

## Naming
Use Glittering for this project's folder, documentation, and future interface labels.

## Status
Concept captured; implementation has not started. Source-code inspection and imagery licensing verification remain pending.
