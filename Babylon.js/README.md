# Swamp Babylon.js front-end framework v0.2.0

Open index.html on a static HTTP(S) host. No build step or backend is required for the rendering demo. The pinned Babylon.js 8.0.0 dependency is fetched from jsDelivr; an internet connection is required. Babylon.js is Apache-2.0 licensed; see https://github.com/BabylonJS/Babylon.js/blob/master/license.md . If self-hosting the library, retain the applicable notices.

- index.html: responsive browser UI, graphics profile switch and diagnostics.
- framework.js: WebGL engine, scene lifecycle, touch/mouse camera, fog, optional glow and shadows, and a reusable HTTP JSON transport boundary.
- Mobile mode: lower rendering resolution and 256-pixel shadow and glow buffers; desktop uses larger buffers. Desktop: higher quality. Auto selects a conservative initial preset based on input/screen and WebGL version, not an FPS benchmark.

## Automatic showcase
Six 12-second stages loop continuously: baseline, dynamic lighting, distance fog, emissive glow, dynamic shadows, and combined effects. Previous, pause/play and next controls are available. Reduced-motion users start paused. The displayed version is the framework release, separate from the Babylon engine version. The versioned script URL helps prevent stale browser caches.

## Server boundary
The demo is intentionally public and contains no game logic worth protecting. GameApi is an unused transport helper, not a deployed backend or authentication system. Prefer a same-origin HTTPS API; implement server-side authorization, game state validation, purchases and persistence in a separate private service. Never ship secrets, server keys or proprietary rules with this front end. Assets and code delivered to a browser can be copied. Add WebSocket state synchronization when the game requires it.

## Validation checklist
Open from Swamp's Visual experiments index. Confirm scene renders, drag/pinch/scroll camera works, graphics profile changes, status updates and resizing works. Test on iPhone XR Safari, Android Chrome, desktop Chrome/Edge/Firefox/Safari. Check frame rate and memory on real devices before asserting compatibility. For production, consider self-hosting the pinned library and adding a restrictive Content Security Policy.
