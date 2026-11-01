(() => {
  'use strict';

  const app = document.getElementById('app');
  const canvas = document.getElementById('gameCanvas');
  const controls = document.getElementById('touchControls');
  if (!app || !canvas || !controls) return;

  const touchDevice = navigator.maxTouchPoints > 0 || matchMedia('(pointer: coarse)').matches;
  if (!touchDevice) return;

  const prevent = event => {
    if (event.cancelable) event.preventDefault();
  };

  // iOS Safari exposes non-standard gesture events for pinch zoom.
  ['gesturestart', 'gesturechange', 'gestureend'].forEach(type => {
    document.addEventListener(type, prevent, { passive: false });
  });

  // During gameplay, finger drags belong to the game, not to Safari scrolling/zooming.
  [canvas, controls].forEach(target => {
    target.addEventListener('touchmove', prevent, { passive: false });
    target.addEventListener('touchstart', event => {
      if (event.touches && event.touches.length > 1) prevent(event);
    }, { passive: false });
  });

  // Stop Safari's rapid-tap zoom without interfering with normal single taps.
  let lastTouchEnd = 0;
  [canvas, controls].forEach(target => {
    target.addEventListener('touchend', event => {
      const now = performance.now();
      if (now - lastTouchEnd < 350) prevent(event);
      lastTouchEnd = now;
    }, { passive: false });
  });

  // Some Safari versions can still synthesize dblclick zoom behavior.
  app.addEventListener('dblclick', prevent, { passive: false });
})();
