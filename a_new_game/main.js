import * as THREE from 'three';
import {createSpectralGhost} from './ghost.js?v=0.7.0';
import {createPattycakerEncounter} from './pattycaker_encounter.js?v=0.6.0';
import {terrainAt,cricketPresence,cricketAttenuation,TOWN_EDGE_Z,WALK_SPEED,RUN_SPEED,STAMINA_MAX,canStartRun,staminaStep,classifyTap} from './gameplay.js';

// The scene is procedural, so it can run without licensed or downloaded art/audio assets.
// All audio starts only after explicit player interaction.
const canvas = document.getElementById('game');
const intro = document.getElementById('intro');
const statusEl = document.getElementById('status');
const compassEl = document.getElementById('compass');
const soundButton = document.getElementById('sound');
const lanternButton = document.getElementById('lantern');
const loadingEl = document.getElementById('loading');
const alertEl = document.getElementById('alert');
const staminaBar=document.getElementById('staminaBar'),staminaLabel=document.getElementById('staminaLabel'),staminaTrack=document.getElementById('staminaTrack');
const isTouch = matchMedia('(pointer: coarse)').matches;
const halfPI = Math.PI / 2;
const clamp = THREE.MathUtils.clamp;
const rand = (() => { let seed = 0x4d5f6a13; return () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) / 4294967296; }; })();
const between = (a,b) => a + rand()*(b-a);
const pick = xs => xs[Math.floor(rand()*xs.length)];
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x080e19);
scene.fog = new THREE.FogExp2(0x121824, 0.0058);
const camera = new THREE.PerspectiveCamera(69, 1, 0.08, 410);
camera.rotation.order = 'YXZ';
camera.position.set(0, 1.72, 24);
scene.add(camera);
const renderer = new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.65));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setClearColor(0x080e19);

function makeTexture(size, painter, repeatX=1, repeatY=1) {
  const c=document.createElement('canvas'); c.width=size; c.height=size;
  const x=c.getContext('2d'); painter(x,size);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace;
  t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(repeatX,repeatY);
  t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  return t;
}
const dirtTex=makeTexture(512,(ctx,n)=>{
  ctx.fillStyle='#51493e';ctx.fillRect(0,0,n,n);
  for(let i=0;i<90000;i++){
    const x=rand()*n,y=rand()*n,v=Math.floor(between(46,112));
    ctx.fillStyle=`rgba(${v+14},${v+8},${v},${between(.04,.27)})`;
    const r=between(.3,2.5);ctx.fillRect(x,y,r,r);
  }
  for(let i=0;i<240;i++){
    const x=rand()*n,y=rand()*n;ctx.fillStyle=`rgba(24,25,22,${between(.07,.21)})`;
    ctx.beginPath();ctx.ellipse(x,y,between(4,20),between(2,13),rand()*Math.PI,0,Math.PI*2);ctx.fill();
  }
  const roadLines=[[.24,.35],[.71,.82]];
  for(const [a,b] of roadLines){const g=ctx.createLinearGradient(a*n,0,b*n,0);g.addColorStop(0,'#17160f00');g.addColorStop(.4,'#27271f50');g.addColorStop(1,'#17160f00');ctx.fillStyle=g;ctx.fillRect(a*n,0,(b-a)*n,n);}
},1,42);
const grassTex=makeTexture(512,(ctx,n)=>{
  ctx.fillStyle='#28352c';ctx.fillRect(0,0,n,n);
  for(let i=0;i<110000;i++){
    let k=rand();let v=Math.round(between(30,82));
    ctx.fillStyle=`rgba(${Math.round(v*.82)},${v},${Math.round(v*.75)},${between(.05,.3)})`;
    ctx.fillRect(rand()*n,rand()*n,between(.3,2.1),between(.3,4.2));
  }
},25,25);
const terrain=new THREE.Mesh(new THREE.PlaneGeometry(310,420,26,36),new THREE.MeshStandardMaterial({map:grassTex,roughness:.98,metalness:0}));
terrain.rotation.x=-halfPI;terrain.position.set(0,-.09,-15);terrain.receiveShadow=true;scene.add(terrain);
const roadGeom=new THREE.PlaneGeometry(6.35,350,7,70);
const roadPos=roadGeom.attributes.position;
for(let i=0;i<roadPos.count;i++){
 const x=roadPos.getX(i),z=roadPos.getY(i);
 if(Math.abs(x)>2.9) roadPos.setZ(i,between(-.07,.04));
 else roadPos.setZ(i,between(-.017,.012));
}
roadGeom.computeVertexNormals();
const road=new THREE.Mesh(roadGeom,new THREE.MeshStandardMaterial({map:dirtTex,roughness:.9,color:0xb7ada0}));
road.rotation.x=-halfPI;road.position.set(0,.024,-24);road.receiveShadow=true;scene.add(road);
const shoulderMat=new THREE.MeshStandardMaterial({color:0x454b34,roughness:1});
for(const side of [-1,1]){
  const shoulder=new THREE.Mesh(new THREE.PlaneGeometry(.85,350),shoulderMat);
  shoulder.rotation.x=-halfPI;shoulder.position.set(side*3.45,-.025,-24);shoulder.receiveShadow=true;scene.add(shoulder);
}

// Sky: procedural color gradient, moon and subtle point stars.
const sky=new THREE.Mesh(new THREE.SphereGeometry(350,48,24),new THREE.ShaderMaterial({
  side:THREE.BackSide,depthWrite:false,fog:false,
  uniforms:{upper:{value:new THREE.Color(0x040812)},lower:{value:new THREE.Color(0x3d4760)}},
  vertexShader:`varying vec3 vWorld;void main(){vec4 p=modelMatrix*vec4(position,1.0);vWorld=p.xyz;gl_Position=projectionMatrix*viewMatrix*p;}`,
  fragmentShader:`uniform vec3 upper;uniform vec3 lower;varying vec3 vWorld;void main(){float h=normalize(vWorld).y;float t=smoothstep(-.13,.65,h);vec3 col=mix(lower,upper,t);col*=mix(.82,1.,smoothstep(.0,.5,h));gl_FragColor=vec4(col,1.0);}`
}));sky.position.copy(camera.position);sky.frustumCulled=false;scene.add(sky);
const stars=[];for(let i=0;i<1150;i++){const theta=rand()*Math.PI*2,y=between(.1,.96);const r=Math.sqrt(1-y*y);stars.push(r*Math.cos(theta)*320,y*320,r*Math.sin(theta)*320);}
const starGeo=new THREE.BufferGeometry();starGeo.setAttribute('position',new THREE.Float32BufferAttribute(stars,3));
const starField=new THREE.Points(starGeo,new THREE.PointsMaterial({color:0xc5d7e9,size:.53,sizeAttenuation:false,transparent:true,opacity:.67,depthWrite:false,fog:false}));scene.add(starField);
function moonTexture(){return makeTexture(256,(ctx,n)=>{
  const g=ctx.createRadialGradient(128,128,4,128,128,127);g.addColorStop(0,'rgba(250,250,231,1)');g.addColorStop(.42,'rgba(237,239,222,1)');g.addColorStop(.51,'rgba(234,237,229,1)');g.addColorStop(.525,'rgba(238,242,233,.92)');g.addColorStop(.55,'rgba(224,235,241,.18)');g.addColorStop(.66,'rgba(185,207,236,.075)');g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(0,0,n,n);
  for(let i=0;i<58;i++){const a=rand()*Math.PI*2,r=Math.sqrt(rand())*53,x=128+Math.cos(a)*r,y=128+Math.sin(a)*r;
   ctx.fillStyle=`rgba(95,99,105,${between(.016,.11)})`;ctx.beginPath();ctx.arc(x,y,between(1,9),0,Math.PI*2);ctx.fill();}
});}
const moon=new THREE.Sprite(new THREE.SpriteMaterial({map:moonTexture(),transparent:true,depthWrite:false,fog:false}));moon.position.set(-88,92,-190);moon.scale.set(48,48,1);scene.add(moon);
const moonLight=new THREE.DirectionalLight(0xb2c8ee,1.7);moonLight.position.set(-68,90,-100);moonLight.target.position.set(0,0,-55);moonLight.castShadow=true;moonLight.shadow.mapSize.set(2048,2048);moonLight.shadow.camera.near=3;moonLight.shadow.camera.far=280;moonLight.shadow.camera.left=-95;moonLight.shadow.camera.right=95;moonLight.shadow.camera.top=95;moonLight.shadow.camera.bottom=-95;moonLight.shadow.bias=-.0002;scene.add(moonLight,moonLight.target);
scene.add(new THREE.HemisphereLight(0x8194b5,0x26301d,1.22));
scene.add(new THREE.AmbientLight(0x52678e,.22));

// Long grass: colored mesh clusters instanced for inexpensive geometry and dense silhouettes.
function makeGrassBladeGeometry(){
 const verts=[],uvs=[],colors=[];
 for(let b=0;b<3;b++){
  const a=b*2*Math.PI/3;const dx=Math.cos(a),dz=Math.sin(a);
  const w=.055,y=between(.66,1.2),lean=between(.11,.3);
  const x0=dx*between(-.09,.09),z0=dz*between(-.09,.09);
  const p1=[x0-dz*w,0,z0+dx*w],p2=[x0+dz*w,0,z0-dx*w];
  const center=[x0+dx*lean,y,z0+dz*lean];
  verts.push(...p1,...p2,...center);uvs.push(0,0,1,0,.5,1);
  colors.push(.35,.45,.27,.35,.45,.27,.86,.98,.69);
 }
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.computeVertexNormals();return geo;
}
const bladeGeometry=makeGrassBladeGeometry();const grassCount=23000;
const grassMat=new THREE.MeshLambertMaterial({color:0x71916d,side:THREE.DoubleSide,vertexColors:true});
 // Animate only the grass tips in the GPU, including a local disturbance around the player's legs.
 // Instancing remains in place: this does not create thousands of per-frame CPU mesh updates.
 const grassUniforms={uGrassTime:{value:0},uWalker:{value:camera.position.clone()}};
 grassMat.onBeforeCompile=shader=>{
   Object.assign(shader.uniforms,grassUniforms);
   shader.vertexShader=shader.vertexShader.replace('void main() {',
     'uniform float uGrassTime;\nuniform vec3 uWalker;\nvoid main() {');
   shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`
     #include <begin_vertex>
     #ifdef USE_INSTANCING
       vec3 tuftOrigin=(modelMatrix*instanceMatrix*vec4(0.0,0.0,0.0,1.0)).xyz;
       float tip=smoothstep(0.0,1.15,position.y);
       float breeze=sin(tuftOrigin.x*0.47+tuftOrigin.z*0.16+uGrassTime*0.83)*0.075
                   +sin(tuftOrigin.z*0.59-uGrassTime*1.18)*0.035;
       vec2 away=tuftOrigin.xz-uWalker.xz;
       float distanceToWalker=length(away);
       float bend=(1.0-smoothstep(0.55,2.5,distanceToWalker))*0.31;
       transformed.x+=tip*(breeze+away.x/(distanceToWalker+0.001)*bend);
       transformed.z+=tip*(breeze*0.43+away.y/(distanceToWalker+0.001)*bend);
     #endif
   `);
 };
 grassMat.customProgramCacheKey=()=>'grass-wind-walker-v1';
const grassInst=new THREE.InstancedMesh(bladeGeometry,grassMat,grassCount);grassInst.frustumCulled=false;
const grassDummy=new THREE.Object3D();const grassColor=new THREE.Color();
for(let i=0;i<grassCount;i++){
  let x=between(-65,65),z=between(-155,105);
  if(Math.abs(x)<3.85) x=(x<0?-1:1)*between(3.85,10);
  // Extra grass at the road edges and near camera makes the transition clearly visible.
  if(i<9000){x=(rand()<.5?-1:1)*between(3.8,17);z=between(-98,77);}
  let s=between(.6,1.55);if(Math.abs(x)>30)s*=between(.75,1.2);
  grassDummy.position.set(x,-.04,z);grassDummy.rotation.set(0,between(0,Math.PI*2),0);grassDummy.scale.set(s*between(.65,1.15),s*between(.72,1.6),s);grassDummy.updateMatrix();
  grassInst.setMatrixAt(i,grassDummy.matrix);
  grassColor.setHSL(between(.19,.33),between(.17,.38),between(.35,.66));grassInst.setColorAt(i,grassColor);
}
grassInst.instanceMatrix.needsUpdate=true;scene.add(grassInst);

// Rocks, shallow puddles, shrubs, fences, trees and faint warm windows in the distant township.
const stoneMat=new THREE.MeshStandardMaterial({color:0x605b4e,roughness:.98});
const stones=new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1,0),stoneMat,1400);
const stoneD=new THREE.Object3D();
for(let i=0;i<1400;i++){
 stoneD.position.set(between(-3,3),.018,between(-105,90));let s=between(.018,.085);stoneD.scale.set(s,between(.01,.025),s*between(.6,1.6));stoneD.rotation.set(0,rand()*Math.PI,0);stoneD.updateMatrix();stones.setMatrixAt(i,stoneD.matrix);
}scene.add(stones);
const puddleMat=new THREE.MeshPhysicalMaterial({color:0x495d71,roughness:.12,metalness:.48,transparent:true,opacity:.7,depthWrite:false});
for(const [x,z,rx,rz] of [[-.8,15,.65,1.6],[1.7,8,.48,1.1],[-.3,-12,.95,2.3],[1.3,-26,.48,1.2],[-1.4,-47,.4,1.4],[1,-80,.3,.8]]){
 const p=new THREE.Mesh(new THREE.CircleGeometry(1,48),puddleMat);p.rotation.x=-halfPI;p.scale.set(rx,rz,1);p.position.set(x,.045,z);scene.add(p);
}
const trunkMat=new THREE.MeshStandardMaterial({color:0x302b24,roughness:1});
const twigMat=new THREE.MeshStandardMaterial({color:0x262b26,roughness:1});
const leafMaterials=[0x1b2825,0x222d27,0x2b352c,0x1b2624].map(c=>new THREE.MeshStandardMaterial({color:c,roughness:1}));
function cylinderBetween(parent,a,b,r1,r2,mat){const d=new THREE.Vector3().subVectors(b,a), m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,d.length(),6),mat);m.position.copy(a).addScaledVector(d,.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());m.castShadow=true;parent.add(m);return m;}
function addTree(x,z,scale){const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(scale);const h=between(6,13);
 cylinderBetween(g,new THREE.Vector3(0,0,0),new THREE.Vector3(0,h,0),.24,.47,trunkMat);
 for(let j=0;j<4;j++){
   const a=j/4*Math.PI*2+between(-.3,.3),ly=between(h*.57,h*.8),len=between(2.1,4.7),tip=new THREE.Vector3(Math.sin(a)*len,h+between(-.4,1.8),Math.cos(a)*len);
   cylinderBetween(g,new THREE.Vector3(0,ly,0),tip,.075,.15,twigMat);
   const foliage=new THREE.Mesh(new THREE.IcosahedronGeometry(between(1.9,3),1),pick(leafMaterials));foliage.scale.set(between(.9,1.4),between(.5,.88),between(.85,1.25));foliage.position.copy(tip);foliage.castShadow=true;g.add(foliage);
 }
 const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(between(2,4),1),pick(leafMaterials));crown.position.y=h;crown.scale.y=.85;crown.castShadow=true;g.add(crown);
 scene.add(g);
}
for(let i=0;i<46;i++){
 let x=(rand()<.5?-1:1)*between(13,75),z=between(-170,120);if(Math.abs(z-24)<8 && Math.abs(x)<18)continue;
 addTree(x,z,between(.7,1.42));
}
const fencePostMat=new THREE.MeshStandardMaterial({color:0x544635,roughness:1});
const fenceRailMat=new THREE.MeshStandardMaterial({color:0x4b3b2e,roughness:1});
for(const side of [-1,1]){
 for(let z=-151;z<94;z+=3.8){if(z>10&&z<31&&side===-1)continue;
  const x=side*between(9,12),post=new THREE.Mesh(new THREE.CylinderGeometry(.085,.13,between(.9,1.3),6),fencePostMat);
  post.position.set(x,.47,z);post.rotation.z=between(-.11,.11);post.castShadow=true;scene.add(post);
  if(z<90){let rail=new THREE.Mesh(new THREE.BoxGeometry(.10,.11,3.75),fenceRailMat);rail.position.set(side*10.1,.65,z+1.85);rail.rotation.y=between(-.07,.07);rail.castShadow=true;scene.add(rail);}
 }
}
function windowGlowTexture(){return makeTexture(64,(ctx,n)=>{const g=ctx.createRadialGradient(32,32,2,32,32,30);g.addColorStop(0,'rgba(255,208,116,.95)');g.addColorStop(.2,'rgba(255,170,73,.5)');g.addColorStop(.65,'rgba(230,112,26,.05)');g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(0,0,n,n);});}
const glowTexture=windowGlowTexture();
const townMat=new THREE.MeshStandardMaterial({color:0x282c32,roughness:.92});
const roofMat=new THREE.MeshStandardMaterial({color:0x1c2025,roughness:1});
const litWindowMat=new THREE.MeshBasicMaterial({color:0xe6aa64,toneMapped:false});
for(let i=0;i<26;i++){
 const x=(i-13)*between(3,4.7),z=between(-189,-160),w=between(3.7,7),h=between(5,12),d=between(3,7);
 const house=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),townMat);house.position.set(x,h/2,z);scene.add(house);
 const roof=new THREE.Mesh(new THREE.ConeGeometry(w*.83,between(2,4),4),roofMat);roof.rotation.y=Math.PI/4;roof.position.set(x,h+1.3,z);scene.add(roof);
 for(let j=0;j<3;j++){if(rand()<.23)continue;let wx=x+(j-1)*w*.25,wy=between(h*.42,h*.82);
   const win=new THREE.Mesh(new THREE.PlaneGeometry(.45,.8),litWindowMat);win.position.set(wx,wy,z+d/2+.01);scene.add(win);
   const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,color:0xffb45e,transparent:true,depthWrite:false,fog:false}));halo.position.set(wx,wy,z+d/2+.03);halo.scale.set(5,5,1);scene.add(halo);
 }
}
const steeple=new THREE.Mesh(new THREE.CylinderGeometry(1.15,1.4,20,4),townMat);steeple.position.set(15,15,-178);scene.add(steeple);
const spire=new THREE.Mesh(new THREE.ConeGeometry(2.4,8,4),roofMat);spire.rotation.y=Math.PI/4;spire.position.set(15,29,-178);scene.add(spire);
// Reach the town outskirts, where a closed fence makes the boundary clear.
const gateZ=-150,gateWood=new THREE.MeshStandardMaterial({color:0x554737,roughness:1});
for(let x=-60;x<=60;x+=3.5){
 const post=new THREE.Mesh(new THREE.CylinderGeometry(.09,.13,1.65,6),gateWood);
 post.position.set(x,.82,gateZ);scene.add(post);
}
for(const y of [.55,1.25]){
 const rail=new THREE.Mesh(new THREE.BoxGeometry(121,.12,.14),gateWood);
 rail.position.set(0,y,gateZ);scene.add(rail);
}
const townSignTex=makeTexture(256,(c,n)=>{
 c.fillStyle='#292019';c.fillRect(0,0,n,n);c.strokeStyle='#cfb48a';c.lineWidth=7;
 c.strokeRect(7,7,n-14,n-14);c.fillStyle='#e9d2af';
 c.font='bold 30px Georgia';c.textAlign='center';c.fillText('TOWN LIMITS',n/2,104);
 c.font='23px Georgia';c.fillText('ROAD CLOSED',n/2,156);
});
const townSign=new THREE.Mesh(new THREE.PlaneGeometry(3.4,1.7),
 new THREE.MeshBasicMaterial({map:townSignTex,side:THREE.DoubleSide}));
townSign.position.set(0,2.2,gateZ+.2);scene.add(townSign);
// Large warm lantern, already in the player's hand at launch.
const lanternRig=new THREE.Group();lanternRig.position.set(.43,-.52,-.79);camera.add(lanternRig);
const brass=new THREE.MeshStandardMaterial({color:0x6c5132,metalness:.69,roughness:.32});
const glass=new THREE.MeshPhysicalMaterial({color:0xffe0a2,transparent:true,opacity:.26,roughness:.18,metalness:.08,depthWrite:false});
const beam=new THREE.Mesh(new THREE.CylinderGeometry(.19,.21,.34,8),glass);beam.position.y=.01;lanternRig.add(beam);
const cap=new THREE.Mesh(new THREE.CylinderGeometry(.22,.24,.07,8),brass);cap.position.y=.23;lanternRig.add(cap);
const foot=new THREE.Mesh(new THREE.CylinderGeometry(.24,.22,.08,8),brass);foot.position.y=-.21;lanternRig.add(foot);
for(let i=0;i<4;i++){const a=i*Math.PI/2,post=new THREE.Mesh(new THREE.CylinderGeometry(.013,.013,.42,6),brass);post.position.set(Math.cos(a)*.19,0,Math.sin(a)*.19);lanternRig.add(post);}
const hook=new THREE.Mesh(new THREE.TorusGeometry(.14,.022,6,16,Math.PI),brass);hook.position.y=.31;lanternRig.add(hook);
const flame=new THREE.Mesh(new THREE.SphereGeometry(.066,10,8),new THREE.MeshBasicMaterial({color:0xffdb8b,toneMapped:false}));flame.position.y=-.005;lanternRig.add(flame);
const lanternLight=new THREE.PointLight(0xffb66e,20,19,2);lanternLight.position.set(0,.015,0);lanternLight.castShadow=true;lanternLight.shadow.mapSize.set(512,512);lanternLight.shadow.bias=-.001;lanternRig.add(lanternLight);
const lightFill=new THREE.PointLight(0xfcb36f,1.5,4,2);lightFill.position.set(.02,0,0);lanternRig.add(lightFill);

// Destination controls: single tap walks, double tap runs; drag turns view.
const keys=new Set(),clock=new THREE.Clock();
let yaw=0,pitch=0,travel=0,bob=0,started=false,lanternOn=true;
let destination=null,walkedDistance=0,stepFoot=0,mouseDrag=false,mobileGesture=null,frameCount=0;
let stamina=STAMINA_MAX,runToDestination=false,keyboardRun=false,lastTap=null;
let mouseStart=null,suppressClick=false;
const cursorMarker=new THREE.Group();
const circle=new THREE.Mesh(new THREE.RingGeometry(.19,.25,32),
 new THREE.MeshBasicMaterial({color:0xffdb97,transparent:true,opacity:.75,side:THREE.DoubleSide,depthWrite:false}));
circle.rotation.x=-halfPI;cursorMarker.add(circle);cursorMarker.visible=false;scene.add(cursorMarker);
const pointer=new THREE.Vector2(),raycaster=new THREE.Raycaster();
const plane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
function goToPixel(px,py,run=false){
 pointer.set(px/innerWidth*2-1,-py/innerHeight*2+1);
 raycaster.setFromCamera(pointer,camera);
 const pos=new THREE.Vector3();
 if(!raycaster.ray.intersectPlane(plane,pos))return;
 destination=new THREE.Vector3(clamp(pos.x,-62,62),0,clamp(pos.z,TOWN_EDGE_Z,79));
 cursorMarker.position.set(destination.x,.06,destination.z);cursorMarker.visible=true;
 // Even with stamina left, a single tap cancels the current run immediately.
 runToDestination=run && canStartRun(stamina);
}
function popup(message){
 alertEl.textContent=message;alertEl.style.display='block';
 setTimeout(()=>{alertEl.style.display='none';},4000);
}
window.addEventListener('keydown',e=>{
 if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight','Space'].includes(e.code)){
  if((e.code==='ShiftLeft'||e.code==='ShiftRight')&&!keys.has(e.code)&&canStartRun(stamina))keyboardRun=true;
  keys.add(e.code);
  if(e.code!=='ShiftLeft'&&e.code!=='ShiftRight'){
   destination=null;runToDestination=false;cursorMarker.visible=false;
  }
  e.preventDefault();
 }
});
window.addEventListener('keyup',e=>{
 keys.delete(e.code);
 if(!keys.has('ShiftLeft')&&!keys.has('ShiftRight'))keyboardRun=false;
});
window.addEventListener('blur',()=>{keys.clear();keyboardRun=false;});
canvas.addEventListener('pointerdown',e=>{
 if(!started||isTouch||e.button!==0)return;
 mouseDrag=true;mouseStart={x:e.clientX,y:e.clientY};
 canvas.setPointerCapture?.(e.pointerId);
});
canvas.addEventListener('pointerup',()=>{mouseDrag=false;mouseStart=null;});
canvas.addEventListener('pointercancel',()=>{mouseDrag=false;mouseStart=null;});
canvas.addEventListener('mousemove',e=>{
 if(!started||isTouch)return;
 if(mouseStart&&Math.hypot(e.clientX-mouseStart.x,e.clientY-mouseStart.y)>9)suppressClick=true;
 if(document.pointerLockElement===canvas||mouseDrag){
  yaw-=e.movementX*.0025;pitch=clamp(pitch-e.movementY*.0025,-1.35,1.35);
 }
});
canvas.addEventListener('click',e=>{
 if(!started||isTouch)return;
 if(suppressClick){suppressClick=false;return;}
 const locked=document.pointerLockElement===canvas;
 goToPixel(locked?innerWidth/2:e.clientX,locked?innerHeight/2:e.clientY,e.detail>=2);
});
canvas.addEventListener('dblclick',e=>e.preventDefault());
canvas.addEventListener('contextmenu',e=>{
 e.preventDefault();if(!started)return;
 if(document.pointerLockElement===canvas)document.exitPointerLock?.();
 else canvas.requestPointerLock?.();
});
canvas.addEventListener('touchstart',e=>{
 if(!started)return;e.preventDefault();
 if(e.touches.length===1){
  const t=e.touches[0];
  mobileGesture={x:t.clientX,y:t.clientY,lastX:t.clientX,lastY:t.clientY,moved:false};
 }else{mobileGesture=null;lastTap=null;}
},{passive:false});
canvas.addEventListener('touchmove',e=>{
 if(!started||!mobileGesture||e.touches.length!==1)return;e.preventDefault();
 const t=e.touches[0],g=mobileGesture,dx=t.clientX-g.lastX,dy=t.clientY-g.lastY;
 g.lastX=t.clientX;g.lastY=t.clientY;
 if(Math.hypot(t.clientX-g.x,t.clientY-g.y)>13)g.moved=true;
 if(g.moved){yaw-=dx*.0035;pitch=clamp(pitch-dy*.0035,-1.3,1.3);}
},{passive:false});
canvas.addEventListener('touchend',e=>{
 if(!started||!mobileGesture)return;e.preventDefault();
 if(!mobileGesture.moved&&e.touches.length===0){
  const {x,y}=mobileGesture,tap=classifyTap(lastTap,performance.now(),x,y);
  lastTap=tap.previous;goToPixel(x,y,tap.double);
 }else lastTap=null;
 mobileGesture=null;
},{passive:false});
canvas.addEventListener('touchcancel',()=>{mobileGesture=null;lastTap=null;});

// Brighter, longer-lasting fireflies with pearly halos and curved flight.
const fireflyGeometry=new THREE.SphereGeometry(.09,8,6),fireflies=[];
const fireflyGlowTex=makeTexture(64,(c,n)=>{
 const g=c.createRadialGradient(32,32,1,32,32,31);
 g.addColorStop(0,'rgba(255,255,238,1)');
 g.addColorStop(.2,'rgba(231,255,209,.8)');
 g.addColorStop(.57,'rgba(186,243,193,.22)');
 g.addColorStop(1,'rgba(172,240,194,0)');
 c.fillStyle=g;c.fillRect(0,0,n,n);
});
for(let i=0;i<20;i++){
 const x=(i%2?-1:1)*between(5,22),z=between(-141,76);
 const dot=new THREE.Mesh(fireflyGeometry,
  new THREE.MeshBasicMaterial({color:0xeaffd8,transparent:true,opacity:0,depthWrite:false,toneMapped:false}));
 const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:fireflyGlowTex,color:0xf0ffe5,
  transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,fog:false}));
 glow.scale.set(.9,.9,1);scene.add(dot,glow);
 fireflies.push({dot,glow,x,z,y:between(.6,2.2),phase:between(0,Math.PI*2),period:between(19,28)});
}
function updateFireflies(t){
 let visible=0;
 for(const f of fireflies){
  const wave=Math.sin(t*2*Math.PI/f.period+f.phase);
  const near=Math.hypot(f.x-camera.position.x,f.z-camera.position.z)<65;
  const envelope=clamp((wave+.68)*1.7,0,1);
  const shimmer=.88+.12*Math.sin(t*3.2+f.phase*3);
  const alpha=near&&visible<8?envelope*shimmer:0;
  if(alpha>.05)visible++;
  f.dot.position.set(
   f.x+Math.sin(t*.29+f.phase)*.72+Math.sin(t*.12+f.phase*2)*.35,
   f.y+Math.sin(t*.47+f.phase)*.32+Math.cos(t*.19+f.phase)*.14,
   f.z+Math.cos(t*.23+f.phase)*.64+Math.sin(t*.41+f.phase*1.3)*.25
  );
  f.glow.position.copy(f.dot.position);
  f.dot.material.opacity=alpha;f.glow.material.opacity=alpha*.7;
 }
}

// v0.7: no third-party GLB and no translucent capsule-and-sphere mannequin.
// The actual person-shaped mesh is a continuous garment / neck / head surface
// with subtle articulated sleeves, dim facial features and fading lower edges.
const ghostFigure=createSpectralGhost(THREE);
const ghost={
  group:ghostFigure.group,figure:ghostFigure,
  age:0,duration:0,side:1,fade:0,active:false,test:false
};
scene.add(ghost.group);
ghost.group.visible=false;
let nextGhost=18;
const ghostFacing=new THREE.Object3D();
function placeGhost(test=false){
  const g=ghost;
  const forward=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw));
  const right=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));
  const side=Math.random()<.5?-1:1;
  const d=test?10.5:19+Math.random()*19,offset=test?2.3:7+Math.random()*8;
  const p=camera.position.clone().addScaledVector(forward,d).addScaledVector(right,offset*side);
  g.group.position.set(clamp(p.x,-58,58),.16,clamp(p.z,-141,76));
  g.side=side;g.age=0;g.duration=test?28:20+Math.random()*11;
  g.active=true;g.test=test;g.group.visible=true;
  ghostFacing.position.copy(g.group.position);
  ghostFacing.lookAt(camera.position.x,g.group.position.y,camera.position.z);
  g.group.quaternion.copy(ghostFacing.quaternion);
  g.figure.update(0,0,g.group.position.y);
  nextGhost=80+Math.random()*110;
  if(test)popup('A pale figure stands in the grass. Its feet never quite touch the ground.');
}
function updateGhosts(dt,t){
  if(!started)return;
  const g=ghost;
  if(!g.active){nextGhost-=dt;if(nextGhost<=0)placeGhost();return;}
  g.age+=dt;
  const distance=Math.hypot(g.group.position.x-camera.position.x,g.group.position.z-camera.position.z);
  g.fade=THREE.MathUtils.smoothstep(g.age,0,2.4)*
    (1-THREE.MathUtils.smoothstep(g.age,g.duration-4.2,g.duration));
  g.group.position.y=.16+.046*Math.sin(t*.57+g.side);
  g.group.position.x+=dt*.095*g.side;
  // A slow, deliberate facing change. A hovering person should not snap its
  // entire mannequin body or move its limbs in perfect synchrony.
  ghostFacing.position.copy(g.group.position);
  ghostFacing.lookAt(camera.position.x,g.group.position.y,camera.position.z);
  if(distance<20)g.group.quaternion.slerp(ghostFacing.quaternion,Math.min(1,dt*.24));
  g.figure.update(t,g.fade,g.group.position.y);
  if(g.age>=g.duration){g.active=false;g.group.visible=false;}
}
const pattycakerEncounter=createPattycakerEncounter(THREE,scene,camera,TOWN_EDGE_Z,popup,()=>({ctx,soundEnabled,noiseBuffer,master}),[road,terrain]);

// Fleeting shadow runners are deliberately hard to distinguish from moonlit terrain.
const runnerMat=new THREE.MeshBasicMaterial({color:0x010204,transparent:true,opacity:.09,depthWrite:false});
const runner=new THREE.Group();
function shadowPart(geometry,x,y,z){const m=new THREE.Mesh(geometry,runnerMat);m.position.set(x,y,z);runner.add(m);return m;}
shadowPart(new THREE.CapsuleGeometry(.27,.72,4,8),0,1.04,0);
shadowPart(new THREE.SphereGeometry(.23,10,7),0,1.85,0);
for(const s of [-1,1]){
 const arm=shadowPart(new THREE.CapsuleGeometry(.075,.58,3,6),s*.35,1.14,0);arm.rotation.z=s*.37;
 const leg=shadowPart(new THREE.CapsuleGeometry(.10,.65,3,6),s*.16,.38,0);leg.rotation.z=s*.19;
}
runner.visible=false;scene.add(runner);
let runnerAge=0,runnerDuration=0,runnerStart=null,runnerEnd=null,runnerTest=false,nextRunner=55;
function spawnRunner(test=false){
 const forward=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw));
 const right=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));
 const far= test?18:22+Math.random()*18;
 const side=Math.random()<.5?-1:1;
 const center=camera.position.clone().addScaledVector(forward,far);
 runnerStart=center.clone().addScaledVector(right,side*(test?8:18));
 runnerEnd=center.clone().addScaledVector(right,-side*(test?8:18));
 runnerStart.y=0;runnerEnd.y=0;runner.position.copy(runnerStart);
 runner.rotation.y=Math.atan2(runnerEnd.x-runnerStart.x,runnerEnd.z-runnerStart.z);
 runner.scale.setScalar(test?1.2:.86+Math.random()*.32);
 runnerAge=0;runnerDuration=test?3.2:1.4+Math.random()*.8;runnerTest=test;runner.visible=true;
 nextRunner=80+Math.random()*140;
}
function updateRunners(dt){
 if(!started)return;
 if(!runner.visible){nextRunner-=dt;if(nextRunner<=0)spawnRunner();return;}
 runnerAge+=dt;const f=Math.min(1,runnerAge/runnerDuration);
 runner.position.lerpVectors(runnerStart,runnerEnd,f);
 runner.position.y=.03+Math.abs(Math.sin(f*14*Math.PI))*.075;
 runnerMat.opacity=(runnerTest?.34:.10)*Math.min(1,f*8, (1-f)*8);
 if(f>=1)runner.visible=false;
}

// Web Audio: individually positioned synthetic cricket chirps + dirt/grass movement effects.
let ctx=null, master=null, noiseBuffer=null, soundEnabled=false, cricketVoices=[], grassBrushGain=null,nextRustle=0,nextVoice=0;
const spokenClips=new Map();
const voiceNames=['mommy','daddy','have-you-seen-my-mummy','hello','child-laugh'];
async function loadSpokenClips(){
 for(const name of voiceNames){
  try{
   const response=await fetch('./audio/'+name+'.ogg');
   if(!response.ok)continue;
   const decoded=await ctx.decodeAudioData(await response.arrayBuffer());
   spokenClips.set(name,decoded);
  }catch(e){/* An optional recording is absent or the device cannot decode it. */}
 }
}

function noise(time){const len=Math.round(ctx.sampleRate*time),b=ctx.createBuffer(1,len,ctx.sampleRate),a=b.getChannelData(0);
 for(let i=0;i<len;i++)a[i]=Math.random()*2-1;return b;}
function initAudio(){if(ctx){ctx.resume();return;}try{
 ctx=new (window.AudioContext||window.webkitAudioContext)();master=ctx.createGain();master.gain.value=.75;master.connect(ctx.destination);noiseBuffer=noise(1.5);
 const wind=ctx.createBufferSource();wind.buffer=noiseBuffer;wind.loop=true;const low=ctx.createBiquadFilter();low.type='lowpass';low.frequency.value=390;const windGain=ctx.createGain();windGain.gain.value=.022;wind.connect(low).connect(windGain).connect(master);wind.start();
 // Continuous grass contact is separate from individual steps, so movement through long
 // grass sounds like brushing stems instead of isolated crunches.
 const grassBrush=ctx.createBufferSource();grassBrush.buffer=noiseBuffer;grassBrush.loop=true;
 const grassFilter=ctx.createBiquadFilter();grassFilter.type='bandpass';grassFilter.frequency.value=1650;grassFilter.Q.value=.48;
 grassBrushGain=ctx.createGain();grassBrushGain.gain.value=0;
 grassBrush.connect(grassFilter).connect(grassBrushGain).connect(master);grassBrush.start();
 // Single cricket, slow and relatively nearby.
 const osc=ctx.createOscillator();osc.type='sine';osc.frequency.value=4800;
 const pulse=ctx.createGain();pulse.gain.value=0;
 const gain=ctx.createGain();gain.gain.value=.018;
 const pan=ctx.createStereoPanner();osc.connect(pulse).connect(gain).connect(pan).connect(master);osc.start();
 cricketVoices.push({x:8,z:camera.position.z-12,pulse,gain,pan,next:ctx.currentTime+5});
 nextRustle=ctx.currentTime+30;nextVoice=ctx.currentTime+55;void loadSpokenClips();
 soundEnabled=true;soundButton.textContent='Sound: ON';soundButton.setAttribute('aria-pressed','true');
 }catch(error){console.error('Audio initialization:',error);popup('Audio unavailable in this browser. The scene remains playable.');}}
function pulseCricket(v,t){const p=v.pulse.gain;p.cancelScheduledValues(t);p.setValueAtTime(0,t);
 const pulses=3+Math.round(rand()*3);for(let k=0;k<pulses;k++){
  const at=t+k*.062;const loud=between(.55,1.0);p.setValueAtTime(0,at);p.linearRampToValueAtTime(loud,at+.012);p.exponentialRampToValueAtTime(.0001,at+.045);
 }
}
function movingRustle(test=false){
 if(!ctx||!soundEnabled)return;
 const t=ctx.currentTime+.04,duration=test?3.8:2.4+Math.random()*1.4;
 const source=ctx.createBufferSource();source.buffer=noiseBuffer;source.loop=true;
 const filter=ctx.createBiquadFilter();filter.type='bandpass';filter.frequency.value=860;filter.Q.value=.6;
 const gain=ctx.createGain(),pan=ctx.createStereoPanner(),direction=Math.random()<.5?-1:1;
 pan.pan.setValueAtTime(direction*.76,t);
 pan.pan.linearRampToValueAtTime(-direction*.76,t+duration);
 gain.gain.setValueAtTime(.0001,t);
 gain.gain.linearRampToValueAtTime(test?.065:.014,t+.38);
 gain.gain.setValueAtTime(test?.065:.014,t+duration*.68);
 gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
 source.connect(filter).connect(gain).connect(pan).connect(master);
 source.start(t);source.stop(t+duration+.02);
 // A voice may occasionally follow the running sound, but only if prerecorded.
 if(Math.random()<.46 && spokenClips.size){
  const name=Math.random()<.3?'child-laugh':(['mommy','daddy','have-you-seen-my-mummy','hello'][Math.floor(Math.random()*4)]);
  setTimeout(()=>playRecordedVoice(name,direction*.58),550+Math.random()*550);
 }
}
function playRecordedVoice(name,position=0){
 if(!ctx||!soundEnabled)return false;
 const buffer=spokenClips.get(name);
 if(!buffer)return false; // No synthesized device voice substitution.
 const t=ctx.currentTime+.04;
 const voice=ctx.createBufferSource();voice.buffer=buffer;
 const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=1400;
 const gain=ctx.createGain(),pan=ctx.createStereoPanner();pan.pan.value=position;
 gain.gain.setValueAtTime(.0001,t);
 gain.gain.linearRampToValueAtTime(.10,t+.18);
 gain.gain.setValueAtTime(.10,t+Math.max(.2,buffer.duration-.27));
 gain.gain.exponentialRampToValueAtTime(.0001,t+buffer.duration);
 voice.connect(filter).connect(gain).connect(pan).connect(master);
 voice.start(t);return true;
}

function updateAudio(){if(!ctx||!soundEnabled)return;const t=ctx.currentTime;
 for(const c of cricketVoices){
  const dx=c.x-camera.position.x,dz=c.z-camera.position.z,dist=Math.hypot(dx,dz);
  c.pan.pan.setTargetAtTime(clamp((dx*Math.cos(yaw)-dz*Math.sin(yaw))/Math.max(8,dist),-1,1),t,.15);
  const ghostDist=ghost.active?Math.hypot(ghost.group.position.x-camera.position.x,ghost.group.position.z-camera.position.z):100;
  const hush=1-THREE.MathUtils.clamp((12-ghostDist)/12,0,1)*.78;
  const chirping=cricketPresence(dist,t,c.holdUntil);
  c.holdUntil=chirping.holdUntil;
  c.gain.gain.setTargetAtTime(.018*Math.min(1,18/Math.max(8,dist))*hush*(chirping.audible?1:0),t,.3);
  if(t>=c.next){pulseCricket(c,t+.015);c.next=t+7+Math.random()*10;}
 }
 if(t>=nextRustle){movingRustle();nextRustle=t+65+Math.random()*110;}
 if(t>=nextVoice){
  if(spokenClips.size && Math.random()<.65){
   const name=voiceNames[Math.floor(Math.random()*voiceNames.length)];
   playRecordedVoice(name,Math.random()*1.5-.75);
  }
  nextVoice=t+80+Math.random()*150;
 }
}
function footstep(inGrass){if(!ctx||!soundEnabled)return;const t=ctx.currentTime;
 const source=ctx.createBufferSource();source.buffer=noiseBuffer;
 const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.setValueAtTime(inGrass?1550:620,t);
 const gain=ctx.createGain();gain.gain.setValueAtTime(.0001,t);gain.gain.linearRampToValueAtTime(inGrass?.085:.26,t+.013);gain.gain.exponentialRampToValueAtTime(.001,t+(inGrass?.25:.17));
 const pan=ctx.createStereoPanner();pan.pan.value=stepFoot%2===0?-.15:.15;source.connect(filter).connect(gain).connect(pan).connect(master);source.start(t,Math.random()*.6);source.stop(t+.31);
 if(inGrass){const sw=ctx.createBufferSource();sw.buffer=noiseBuffer;const hp=ctx.createBiquadFilter();hp.type='highpass';hp.frequency.value=900;const v=ctx.createGain();v.gain.setValueAtTime(.0001,t);v.gain.linearRampToValueAtTime(.03,t+.07);v.gain.exponentialRampToValueAtTime(.001,t+.43);sw.connect(hp).connect(v).connect(master);sw.start(t);sw.stop(t+.44);}
 else {const th=ctx.createOscillator();th.type='sine';th.frequency.setValueAtTime(113,t);th.frequency.exponentialRampToValueAtTime(58,t+.09);const v=ctx.createGain();v.gain.setValueAtTime(.07,t);v.gain.exponentialRampToValueAtTime(.001,t+.11);th.connect(v).connect(master);th.start(t);th.stop(t+.12);}
}
soundButton.addEventListener('click',async()=>{if(!ctx){initAudio();return;}soundEnabled=!soundEnabled;master.gain.setTargetAtTime(soundEnabled?.75:0,ctx.currentTime,.1);soundButton.textContent=`Sound: ${soundEnabled?'ON':'OFF'}`;soundButton.setAttribute('aria-pressed',String(soundEnabled));if(soundEnabled)ctx.resume();});
lanternButton.addEventListener('click',()=>{lanternOn=!lanternOn;lanternLight.visible=lanternOn;lightFill.visible=lanternOn;flame.visible=lanternOn;lanternButton.textContent=`Lantern: ${lanternOn?'ON':'OFF'}`;lanternButton.setAttribute('aria-pressed',String(lanternOn));});
document.getElementById('begin').addEventListener('click',()=>{
 started=true;intro.hidden=true;initAudio();
 if(!isTouch)popup('Click to walk · Double-click to run · Drag to look · Right-click to lock view');
});
function ensureTestAudio(){
 if(!ctx)initAudio();
 if(!ctx)return false;
 if(!soundEnabled){
  soundEnabled=true;master.gain.setTargetAtTime(.75,ctx.currentTime,.1);
  soundButton.textContent='Sound: ON';
  soundButton.setAttribute('aria-pressed','true');
 }
 void ctx.resume();return true;
}
document.getElementById('testPatty').addEventListener('click',()=>pattycakerEncounter.show(started,true));
document.getElementById('exportPatty').addEventListener('click',async()=>{
  try{
    popup('Preparing Pattycaker rig and baked animation clips…');
    const {exportPattycakerGLB}=await import('./pattycaker_export.js?v=0.6.0');
    const result=await exportPattycakerGLB(THREE);
    popup('Pattycaker GLB saved: '+result.bones+' bones, '+result.clips.length+' animation clips.');
  }catch(error){
    console.error('Pattycaker export failed',error);
    popup('Pattycaker export failed: '+(error?.message||String(error)));
  }
});
document.getElementById('testGhost').addEventListener('click',()=>{
 if(!started)return;placeGhost(true);
});
document.getElementById('testShadow').addEventListener('click',()=>{
 if(!started)return;spawnRunner(true);
});
document.getElementById('testRustle').addEventListener('click',()=>{
 if(!started||!ensureTestAudio())return;movingRustle(true);
});
document.getElementById('testVoice').addEventListener('click',()=>{
 if(!started||!ensureTestAudio())return;
 if(!spokenClips.size){popup('Child voice clips not yet packaged. Connect audio generation to finish them.');return;}
 void ctx.resume().then(()=>playRecordedVoice('have-you-seen-my-mummy',-.35));
});

function resize(){const w=innerWidth,h=innerHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);}
window.addEventListener('resize',resize);resize();
function animate(){
 requestAnimationFrame(animate);
 const dt=Math.min(clock.getDelta(),.06),t=clock.elapsedTime;
 sky.position.copy(camera.position);sky.position.y=0;
 grassUniforms.uGrassTime.value=t;grassUniforms.uWalker.value.copy(camera.position);
 updateFireflies(t);updateGhosts(dt,t);updateRunners(dt);pattycakerEncounter.tick(dt,t,started);
 if(started){
  let mvx=0,mvz=0;
  const f=Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown'));
  const side=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'));
  if(f||side){
   destination=null;runToDestination=false;cursorMarker.visible=false;
   mvx=-Math.sin(yaw)*f+Math.cos(yaw)*side;
   mvz=-Math.cos(yaw)*f-Math.sin(yaw)*side;
  }else if(destination){
   const dx=destination.x-camera.position.x,dz=destination.z-camera.position.z,d=Math.hypot(dx,dz);
   if(d<.42){destination=null;runToDestination=false;cursorMarker.visible=false;}
   else{mvx=dx/d;mvz=dz/d;}
  }
  const len=Math.hypot(mvx,mvz);
  const wantsRun=len>.01&&((f||side)?keyboardRun:runToDestination)&&stamina>0;
  const speed=wantsRun?RUN_SPEED:WALK_SPEED;
  let moving=false;
  if(len>.01){
   const dx=mvx/len*speed*dt,dz=mvz/len*speed*dt,oldx=camera.position.x,oldz=camera.position.z;
   camera.position.x=clamp(oldx+dx,-62,62);
   camera.position.z=clamp(oldz+dz,TOWN_EDGE_Z,79);
   const advanced=Math.hypot(camera.position.x-oldx,camera.position.z-oldz);
   if(advanced>.0001){
    moving=true;walkedDistance+=advanced;travel+=advanced;bob+=dt*speed*6.7;
    if(travel>=.75){travel%=.75;stepFoot++;footstep(terrainAt(camera.position.x)==='grass');}
   }
  }
  const state=staminaStep(stamina,wantsRun,moving,dt);
  stamina=state.stamina;
  if(wantsRun&&!state.running){runToDestination=false;keyboardRun=false;}
  staminaBar.style.width=stamina.toFixed(1)+'%';
  staminaLabel.textContent='STAMINA · '+Math.round(stamina)+'%';
  staminaTrack.setAttribute('aria-valuenow',String(Math.round(stamina)));
  if(!moving){travel=0;bob*=Math.exp(-dt*4);}
  if(ctx&&grassBrushGain){
   grassBrushGain.gain.setTargetAtTime(
    moving&&terrainAt(camera.position.x)==='grass'&&soundEnabled?.009:0,ctx.currentTime,.16
   );
  }
  const walkBob=moving?Math.sin(bob)*.032:Math.sin(t*.82)*.009;
  camera.position.y=1.72+walkBob;
  lanternRig.position.y=-.52+(moving?Math.sin(bob-1)*.035:Math.sin(t*1.6)*.009);
  lanternRig.rotation.z=(moving?Math.sin(bob*.5)*.04:0);
  const ghostDistance=ghost.active?Math.hypot(ghost.group.position.x-camera.position.x,ghost.group.position.z-camera.position.z):100;
  const ghostNear=THREE.MathUtils.clamp((12-ghostDistance)/12,0,1);
  lanternLight.intensity=lanternOn?(20+Math.sin(t*17)*.34+Math.sin(t*9)*.3)*(1-ghostNear*.12*(.5+.5*Math.sin(t*8))):0;

  camera.rotation.set(pitch,yaw,0);
  if(frameCount++%3===0)updateAudio();
  const heading=(((-yaw*180/Math.PI)%360)+360)%360;
  compassEl.textContent=(heading<45||heading>=315?'N':heading<135?'E':heading<225?'S':'W')+
   ' · '+Math.round(heading).toString().padStart(3,'0')+'°';
  if(isTouch){
   statusEl.textContent=destination?(runToDestination?'Running toward marker · Tap to walk':'Walking toward marker · Double-tap to run'):
    'Tap to walk · Double-tap to run · Drag to look';
  }else{
   statusEl.textContent='Click to walk · Double-click to run · Shift + WASD to run';
  }
 }
 renderer.render(scene,camera);
}
loadingEl.remove();animate();