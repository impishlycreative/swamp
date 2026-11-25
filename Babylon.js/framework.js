/* Swamp Babylon.js front end v0.1.0. Browser code is public. */
(function () {
  "use strict";
  const B = window.BABYLON;
  const profiles = {
    mobile: { scale: 1.65, shadows: 0, glow: false },
    desktop: { scale: 1, shadows: 1024, glow: true }
  };
  // Transport boundary: no secrets or authoritative rules belong here.
  class GameApi {
    constructor(baseUrl) {
      this.baseUrl = new URL(baseUrl, window.location.href);
      if (!["https:", "http:"].includes(this.baseUrl.protocol)) throw new Error("Invalid API URL");
    }
    async request(path, options = {}) {
      const url = new URL(path, this.baseUrl);
      if (url.origin !== this.baseUrl.origin) throw new Error("Unexpected API origin");
      const response = await fetch(url, { ...options, credentials: "same-origin", headers: { Accept: "application/json", ...options.headers } });
      if (!response.ok) throw new Error("API request failed: " + response.status);
      return response.json();
    }
  }
  function start(canvas, onStatus) {
    if (!B || !B.Engine.isSupported()) throw new Error("Babylon.js or WebGL is unavailable.");
    const engine = new B.Engine(canvas, true, { preserveDrawingBuffer: false, stencil: true }, false);
    const scene = new B.Scene(engine);
    scene.clearColor = new B.Color4(.035, .055, .085, 1);
    scene.fogMode = B.Scene.FOGMODE_EXP2;
    scene.fogColor = new B.Color3(.035, .055, .085);
    scene.fogDensity = .025;
    const camera = new B.ArcRotateCamera("camera", -Math.PI / 2, 1.1, 10, new B.Vector3(0, 1, 0), scene);
    camera.lowerRadiusLimit = 4;
    camera.upperRadiusLimit = 18;
    camera.attachControl(canvas, true);
    const ambient = new B.HemisphericLight("ambient", new B.Vector3(0, 1, 0), scene);
    ambient.intensity = .65;
    const light = new B.DirectionalLight("key", new B.Vector3(-1, -2, 1), scene);
    light.position = new B.Vector3(6, 9, -5);
    light.intensity = 1.25;
    const ground = B.MeshBuilder.CreateGround("ground", { width: 45, height: 45 }, scene);
    const floor = new B.StandardMaterial("floor", scene);
    floor.diffuseColor = new B.Color3(.13, .18, .22);
    ground.material = floor;
    ground.receiveShadows = true;
    const object = B.MeshBuilder.CreateTorusKnot("sample", { radius: 1, tube: .30, radialSegments: 64, tubularSegments: 24 }, scene);
    object.position.y = 1.65;
    const material = new B.StandardMaterial("sampleMaterial", scene);
    material.diffuseColor = new B.Color3(.08, .54, .72);
    material.emissiveColor = new B.Color3(.03, .17, .25);
    material.specularColor = new B.Color3(.8, .9, 1);
    object.material = material;
    let shadow = null, glow = null, quality = "";
    function setQuality(name) {
      const profile = profiles[name];
      if (!profile) return;
      quality = name;
      if (shadow) { shadow.dispose(); shadow = null; }
      if (glow) { glow.dispose(); glow = null; }
      engine.setHardwareScalingLevel(profile.scale);
      if (profile.shadows) {
        shadow = new B.ShadowGenerator(profile.shadows, light);
        shadow.addShadowCaster(object);
      }
      if (profile.glow) { glow = new B.GlowLayer("glow", scene, { mainTextureFixedSize: 512 }); glow.intensity = .55; }
      engine.resize();
    }
    function autoQuality() {
      const compact = matchMedia("(pointer: coarse)").matches || innerWidth < 800;
      return compact || engine.webGLVersion < 2 ? "mobile" : "desktop";
    }
    setQuality(autoQuality());
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let last = 0;
    engine.runRenderLoop(() => {
      if (!reduce) object.rotation.y += Math.min(engine.getDeltaTime(), 100) * .00035;
      scene.render();
      const now = performance.now();
      if (now - last > 500) {
        last = now;
        onStatus({ fps: Math.round(engine.getFps()), webgl: engine.webGLVersion, quality, version: B.Engine.Version });
      }
    });
    const resize = () => engine.resize();
    window.addEventListener("resize", resize);
    return { setQuality, autoQuality, dispose() { window.removeEventListener("resize", resize); engine.stopRenderLoop(); scene.dispose(); engine.dispose(); } };
  }
  window.SwampBabylon = { start, GameApi, version: "0.1.0" };
})();
