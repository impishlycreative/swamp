<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">
  <meta name="theme-color" content="#0b111b">
  <meta name="description" content="A New Game: first-person moonlit countryside horror scene prototype">
  <title>The Road — v0.1.0</title>
  <style>
    :root{font-family:Georgia,serif;color:#ecede4;color-scheme:dark}*{box-sizing:border-box}
    html,body{height:100%;margin:0;overflow:hidden;background:#070b12;touch-action:none}
    #game{display:block;width:100%;height:100%;touch-action:none;cursor:crosshair}
    #shade{position:fixed;inset:0;pointer-events:none;background:radial-gradient(ellipse at 52% 45%,transparent 32%,rgba(3,6,11,.33) 100%)}
    #hud{position:fixed;inset:0;pointer-events:none;display:flex;flex-direction:column;justify-content:space-between;padding:max(18px,env(safe-area-inset-top)) max(20px,env(safe-area-inset-right)) max(18px,env(safe-area-inset-bottom)) max(20px,env(safe-area-inset-left))}
    #hud header{display:flex;justify-content:space-between;align-items:start;gap:15px}
    .eyebrow{color:#c8ab7e;font-family:system-ui,sans-serif;font-size:11px;letter-spacing:.18em;text-transform:uppercase}
    h1{font-size:clamp(19px,3vw,34px);font-weight:400;letter-spacing:.09em;margin:5px 0 0;text-shadow:0 2px 8px #000}
    .muted{font:12px/1.6 system-ui,sans-serif;color:#d4d9d4;text-shadow:0 2px 5px #000}
    #hud footer{display:flex;justify-content:space-between;align-items:end;gap:12px}
    #status{max-width:400px}
    #compass{font:13px/1.2 system-ui,sans-serif;color:#efcf99;text-shadow:0 2px 10px #000;letter-spacing:.12em}
    .controls{pointer-events:auto;display:flex;gap:8px}
    button{background:rgba(13,17,23,.7);border:1px solid #918368;color:#f4e9d3;padding:12px 17px;font:13px system-ui,sans-serif;letter-spacing:.045em;border-radius:5px;cursor:pointer;min-height:42px;touch-action:manipulation}
    button:hover,button:focus-visible{background:rgba(103,78,46,.75);outline:2px solid #d5b079;outline-offset:2px}
    #intro{position:fixed;inset:0;background:linear-gradient(90deg,rgba(4,7,13,.84),rgba(4,7,13,.33));display:flex;align-items:center;padding:clamp(26px,8vw,100px)}
    #intro[hidden]{display:none}
    #intro article{max-width:530px}
    #intro h2{font-size:clamp(36px,6vw,70px);font-weight:400;line-height:1.04;letter-spacing:.015em;margin:16px 0 22px}
    #intro p{font-size:clamp(15px,2.1vw,19px);color:#d8d9d2;line-height:1.7;margin:0 0 24px}
    #begin{background:#d4ad77;color:#12110e;border-color:#f1d1a3;font-weight:700;letter-spacing:.04em;padding:15px 24px}
    #intro small{display:block;margin-top:18px;color:#b9b7b0;font:12px/1.7 system-ui,sans-serif}
    #alert{position:fixed;left:50%;top:20%;transform:translateX(-50%);max-width:80vw;background:#231e1b;border:1px solid #ac885b;padding:12px 15px;font:14px system-ui,sans-serif;display:none;pointer-events:none}
    #loading{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#070b12;color:#e4d4b7;font:13px system-ui,sans-serif;letter-spacing:.16em;z-index:20}
    @media(max-width:620px){#hud{padding:15px}#hud header{gap:5px}h1{font-size:18px}#hud footer{align-items:flex-end}#status{font-size:11px;max-width:60%}button{padding:10px 12px}#intro{padding:30px}#intro h2{font-size:45px}}
  </style>
</head>
<body>
  <canvas id="game" aria-label="Interactive first-person moonlit road"></canvas>
  <div id="shade" aria-hidden="true"></div>
  <div id="hud" aria-live="polite">
    <header><div><div class="eyebrow">A New Game · First playable scene</div><h1>THE ROAD</h1></div><div id="compass" aria-label="Compass">N · 000°</div></header>
    <footer><div id="status" class="muted">WASD to walk · Mouse to look · Shift to hurry<br>On touchscreens, tap the ground to walk; drag to look.</div><div class="controls"><button id="lantern" type="button" aria-pressed="true">Lantern: ON</button><button id="sound" type="button" aria-pressed="false">Sound: OFF</button></div></footer>
  </div>
  <div id="intro"><article><div class="eyebrow">A first-person horror atmosphere prototype · v0.1.0</div><h2>There's a road.<br>Somewhere, a town.</h2><p>It is after midnight. The moon is full. The grass is moving, and the crickets sound close enough to touch. You are already holding a lantern.</p><button id="begin" type="button">BEGIN WALKING</button><small>Desktop: WASD, mouse look, Shift to hurry. Tap or click the ground to walk there; drag to look. Sound begins after interaction. This is a procedural WebGL prototype, not the final photorealistic target.</small></article></div>
  <div id="alert" role="status"></div>
  <div id="loading">BUILDING THE NIGHT…</div>
  <script>
    // A blocked CDN module or unsupported WebGL should never leave a permanent
    // unexplained "BUILDING THE NIGHT" screen.
    function showStartupProblem() {
      const loading = document.getElementById('loading');
      if (!loading) return; // The game removed it after a successful start.
      loading.textContent = 'The 3D scene could not start. Check WebGL support and your internet connection, then reload the page.';
      loading.setAttribute('role', 'alert');
      loading.style.padding = '2rem';
      loading.style.textAlign = 'center';
      loading.style.lineHeight = '1.7';
      loading.style.letterSpacing = '.02em';
    }
    window.addEventListener('error', showStartupProblem);
    window.addEventListener('unhandledrejection', showStartupProblem);
    window.setTimeout(showStartupProblem, 20000);
  </script>
  <script type="module" src="./main.js"></script>
</body>
</html>