(() => {
  'use strict';

  const VERSION = '0.1.1';
  const canvas = document.getElementById('gameCanvas');
  if (!canvas) return;

  document.title = `Space Fighters v${VERSION}`;

  const finePointer = window.matchMedia('(pointer: fine)');
  const held = new Set();
  const DEAD_ZONE = 0.08;

  function dispatchKey(code, down) {
    if (down && held.has(code)) return;
    if (!down && !held.has(code)) return;
    if (down) held.add(code); else held.delete(code);
    const key = code === 'ArrowLeft' ? 'ArrowLeft' : code === 'ArrowRight' ? 'ArrowRight' : code === 'KeyE' ? 'e' : '';
    window.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', {
      code,
      key,
      bubbles: true,
      cancelable: true
    }));
  }

  function releaseHorizontal() {
    dispatchKey('ArrowLeft', false);
    dispatchKey('ArrowRight', false);
  }

  function steerFromMouse(event) {
    if (!finePointer.matches || event.pointerType === 'touch') return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width) return;
    const normalizedX = (event.clientX - rect.left) / rect.width;
    const leftEdge = 0.5 - DEAD_ZONE;
    const rightEdge = 0.5 + DEAD_ZONE;

    if (normalizedX < leftEdge) {
      dispatchKey('ArrowRight', false);
      dispatchKey('ArrowLeft', true);
    } else if (normalizedX > rightEdge) {
      dispatchKey('ArrowLeft', false);
      dispatchKey('ArrowRight', true);
    } else {
      releaseHorizontal();
    }
  }

  canvas.addEventListener('pointerenter', steerFromMouse);
  canvas.addEventListener('pointermove', steerFromMouse);
  canvas.addEventListener('pointerleave', releaseHorizontal);

  canvas.addEventListener('pointerdown', event => {
    if (!finePointer.matches || event.pointerType === 'touch' || event.button !== 2) return;
    event.preventDefault();
    window.dispatchEvent(new KeyboardEvent('keydown', {
      code: 'KeyE',
      key: 'e',
      bubbles: true,
      cancelable: true
    }));
    window.dispatchEvent(new KeyboardEvent('keyup', {
      code: 'KeyE',
      key: 'e',
      bubbles: true,
      cancelable: true
    }));
  });

  canvas.addEventListener('contextmenu', event => {
    if (finePointer.matches) event.preventDefault();
  });

  window.addEventListener('blur', releaseHorizontal);
  finePointer.addEventListener?.('change', event => {
    if (!event.matches) releaseHorizontal();
  });
})();
