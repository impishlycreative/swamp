/* Swamp Babylon.js front end v0.2.0. Browser code is public. */
(function () {
  "use strict";
  const B = window.BABYLON;
  const profiles = {
    mobile: { scale: 1.65, shadows: 256, glowSize: 256 },
    desktop: { scale: 1, shadows: 1024, glowSize: 512 }
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
    const landmarks = [];
    const stone = new B.StandardMaterial("stone", scene);
    stone.diffuseColor = new B.Color3(.42, .48, .52);
    for (let i = 0; i < 6; i++) {
      const pillar = B.MeshBuilder.CreateBox("pillar" + i, {width: .8, depth: .8, height: 2.5}, scene);
      pillar.position.set((i % 2 ? 1 : -1) * (3 + Math.floor(i / 2) * .6), 1.25, 2 + Math.floor(i / 2) * 3);
      pillar.material = stone;
      pillar.receiveShadows = true;
      landmarks.push(pillar);
    }
    const point = new B.PointLight("accent", new B.Vector3(2, 2.5, -1), scene);
    point.diffuse = new B.Color3(1, .38, .1);
    point.range = 8;
    const demos = [
      {name: "01 · Baseline", description: "Neutral lighting, no fog, no glow or shadows."},
      {name: "02 · Dynamic lighting", description: "Warm and cool moving lights reveal shape and surface."},
      {name: "03 · Distance fog", description: "Fog thickens and recedes around the background pillars."},
      {name: "04 · Emissive glow", description: "The object pulses with a visible halo."},
      {name: "05 · Dynamic shadows", description: "Moving directional light casts shadows across the floor."},
      {name: "06 · Combined effects", description: "Lighting, fog, glow and shadows working together."}
    ];
    const duration = 12000;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let shadow = null, glow = null, quality = "", index = 0, elapsed = 0, playing = !reduced;
    function applyEffects() {
      const useFog = index === 2 || index === 5;
      const useGlow = index === 3 || index === 5;
      const useShadow = index === 4 || index === 5;
      scene.fogMode = useFog ? B.Scene.FOGMODE_EXP2 : B.Scene.FOGMODE_NONE;
      glow.isEnabled = useGlow;
      scene.shadowsEnabled = useShadow;
      ambient.intensity = index === 1 || index === 5 ? .28 : .65;
      point.intensity = 0;
      light.intensity = 1.25;
      light.diffuse = new B.Color3(1, 1, 1);
      light.direction = new B.Vector3(-1, -2, 1);
      material.emissiveColor = new B.Color3(.025, .07, .09);
      if (useGlow) material.emissiveColor = new B.Color3(.12, .65, .9);
    }
    function selectDemo(n) {
      index = (n + demos.length) % demos.length;
      elapsed = 0;
      applyEffects();
    }
    function animateEffects(t) {
      const wave = .5 + .5 * Math.sin(t * Math.PI * 2 / 6);
      if (index === 1 || index === 5) {
        point.position.set(Math.cos(t) * 3, 2.5, Math.sin(t) * 3);
        point.intensity = .6 + wave * 2;
        light.diffuse = new B.Color3(.5 + wave * .5, .7 + wave * .3, 1);
      }
      if (index === 2 || index === 5) scene.fogDensity = .012 + wave * .14;
      if (index === 3 || index === 5) glow.intensity = .25 + wave * 1.1;
      if (index === 4 || index === 5) light.direction = new B.Vector3(Math.sin(t * .8), -1.5, Math.cos(t * .8));
    }
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
        landmarks.forEach(mesh => shadow.addShadowCaster(mesh));
      }
      glow = new B.GlowLayer("glow", scene, { mainTextureFixedSize: profile.glowSize });
      glow.intensity = .55;
      applyEffects();
      engine.resize();
    }
    function autoQuality() {
      const compact = matchMedia("(pointer: coarse)").matches || innerWidth < 800;
      return compact || engine.webGLVersion < 2 ? "mobile" : "desktop";
    }
    setQuality(autoQuality());
    let last = 0;
    engine.runRenderLoop(() => {
      const dt = Math.min(engine.getDeltaTime(), 100);
      if (playing && !document.hidden) {
        elapsed += dt;
        if (elapsed >= duration) selectDemo(index + 1);
        object.rotation.y += dt * .00035;
        animateEffects(elapsed / 1000);
      }
      scene.render();
      const now = performance.now();
      if (now - last > 500) {
        last = now;
        onStatus({ fps: Math.round(engine.getFps()), webgl: engine.webGLVersion, quality, version: B.Engine.Version, demo: demos[index], index, total: demos.length, remaining: Math.ceil((duration - elapsed) / 1000), playing });
      }
    });
    const resize = () => engine.resize();
    window.addEventListener("resize", resize);
    return { setQuality, autoQuality, next() { selectDemo(index + 1); }, previous() { selectDemo(index - 1); }, toggle() { playing = !playing; }, dispose() { window.removeEventListener("resize", resize); engine.stopRenderLoop(); scene.dispose(); engine.dispose(); } };
  }
  window.SwampBabylon = { start, GameApi, version: "0.2.0" };
})();
