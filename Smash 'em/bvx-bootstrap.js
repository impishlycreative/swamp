const B = window.BABYLON;

if (!B?.Mesh?.prototype?.dispose) {
  throw new Error('Babylon.js failed to load before BVX bootstrap.');
}

const originalDispose = B.Mesh.prototype.dispose;
B.Mesh.prototype.dispose = function patchedDispose(doNotRecurse, disposeMaterialAndTextures) {
  // BVX chunk meshes all share one PBR material. Babylon's dispose(false, true)
  // would destroy that shared material on the first remesh, breaking later chunks.
  if (typeof this.name === 'string' && this.name.startsWith('bvx-')) {
    return originalDispose.call(this, doNotRecurse, false);
  }
  return originalDispose.call(this, doNotRecurse, disposeMaterialAndTextures);
};

await import('./bvx-app.js');
