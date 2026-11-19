import {solveTwoBone,gaitPhase,swingProgress} from './pattycaker_kinematics.js';
// Pattycaker: compact adult spider-like woman for The Road.
// A connected bone hierarchy deforms an actual weighted SkinnedMesh.
// All fourteen limbs and seventy fingers are physically articulated in the rig;
// six walking hands, six eyed/mouthed fan palms, and two ordinary human hands.
export function makePattycaker(THREE, options={}) {
  const root=new THREE.Group();
  root.name='Pattycaker';
  const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
  const groundMeshes=options.groundMeshes||[];
  const groundRay=new THREE.Raycaster();
  function groundY(x,z){
    if(!groundMeshes.length)return 0;
    groundRay.set(V(x,6,z),V(0,-1,0));
    const hits=groundRay.intersectObjects(groundMeshes,false);
    return hits.length?hits[0].point.y:0;
  }
  // Tileable, deterministic micro-relief, not a glossy flat colour.
  const pixels=new Uint8Array(128*128*4);
  for(let y=0;y<128;y++)for(let x=0;x<128;x++){
    const i=(y*128+x)*4;
    const h=(Math.sin(x*127.1+y*311.7)*43758.5453)%1;
    const pores=Math.abs(h-Math.trunc(h));
    const crease=Math.pow(Math.max(0,Math.sin(y*.49+Math.sin(x*.15)*1.4)),16);
    const v=Math.round(128+(pores-.5)*45-crease*35);
    pixels[i]=pixels[i+1]=pixels[i+2]=v;pixels[i+3]=255;
  }
  const micro=new THREE.DataTexture(pixels,128,128,THREE.RGBAFormat);
  micro.wrapS=micro.wrapT=THREE.RepeatWrapping;
  micro.repeat.set(3,5);micro.needsUpdate=true;
  const skin=new THREE.MeshPhysicalMaterial({
    color:0xa99b8f,roughness:.87,roughnessMap:micro,bumpMap:micro,bumpScale:.018,
    clearcoat:.035,clearcoatRoughness:.91,side:THREE.DoubleSide
  });
  const shadowSkin=new THREE.MeshPhysicalMaterial({color:0x877770,roughness:.93,bumpMap:micro,bumpScale:.014});
  const bruise=new THREE.MeshStandardMaterial({color:0x716269,roughness:.99});
  const dress=new THREE.MeshStandardMaterial({color:0x29262b,roughness:1,side:THREE.DoubleSide});
  const hem=new THREE.MeshStandardMaterial({color:0x554950,roughness:1,side:THREE.DoubleSide});
  const hair=new THREE.MeshStandardMaterial({color:0x36271f,roughness:1});
  const hairHighlight=new THREE.MeshStandardMaterial({color:0x584035,roughness:1});
  const hollow=new THREE.MeshStandardMaterial({color:0x30211e,roughness:1});
  const mouth=new THREE.MeshStandardMaterial({color:0x180d0e,roughness:.85});
  const teeth=new THREE.MeshPhysicalMaterial({color:0xc0ac8e,roughness:.53,clearcoat:.14});
  const gums=new THREE.MeshPhysicalMaterial({color:0x4c292e,roughness:.65,clearcoat:.1});
  const nail=new THREE.MeshPhysicalMaterial({color:0x7c7268,roughness:.57,clearcoat:.14});
  const white=new THREE.MeshPhysicalMaterial({color:0xd4ccba,roughness:.21,clearcoat:.58,clearcoatRoughness:.14});
  const iris=new THREE.MeshPhysicalMaterial({color:0x76513f,roughness:.29,clearcoat:.48});
  const pupil=new THREE.MeshStandardMaterial({color:0x110d0e,roughness:.08});
  const sphere=new THREE.SphereGeometry(1,24,18);
  function part(parent,geometry,material,x=0,y=0,z=0) {
    const m=new THREE.Mesh(geometry,material);
    m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m;
  }
  function oval(parent,material,x,y,z,sx,sy,sz) {
    const m=part(parent,sphere,material,x,y,z);
    m.scale.set(sx,sy,sz);return m;
  }
  function strand(parent,coords,radius,mat) {
    return part(parent,new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(coords.map(p=>V(p[0],p[1],p[2]))),
      14,radius,7,false),mat);
  }
  // Every joint is a THREE.Bone, with the skeleton parented through pelvis,
  // spine, shoulders, elbows, wrists, palms and each finger's phalanges.
  const bones=[],boneIndices=new Map(),spans=[];
  function joint(name,parent,x=0,y=0,z=0) {
    const b=new THREE.Bone();b.name=name;b.position.set(x,y,z);parent.add(b);
    boneIndices.set(b,bones.length);bones.push(b);return b;
  }
  function span(a,b,r0,r1) {spans.push({a,b,r0,r1});}
  const rig=joint('Root',root,0,0,0);
  const pelvis=joint('Pelvis',rig,0,1.11,0);
  const lumbar=joint('Lumbar_spine',pelvis,0,.29,.03);
  const chest=joint('Ribcage',lumbar,0,.38,.08);
  const neck=joint('Neck',chest,0,.27,.05);
  const head=joint('Head',neck,0,.26,.055);
  span(pelvis,lumbar,.37,.34);
  span(lumbar,chest,.34,.32);
  span(chest,neck,.18,.11);
  span(neck,head,.12,.17);
  const walkLegs=[],fanArms=[],humanArms=[],allHands=[];
  // The five fingers of each hand have a knuckle, middle, and tip bone.
  // Lower arms use the same hands as the upper arms, not feet or shoes.
  function makeFingers(palm,label,kind,side) {
    const fingers=[];
    for(let i=0;i<5;i++){
      const f=i-2;
      const support=kind==='walking';
      const base=joint(label+'_finger_'+i+'_knuckle',palm,
        support?side*(.035+.017*i):f*.042,
        support?-.006:.08,
        support?f*.053:.025);
      const middle=joint(label+'_finger_'+i+'_middle',base,
        support?side*(.10+.018*(2-Math.abs(f))):f*.008,
        support?-.020:.13+.014*(2-Math.abs(f)),
        support?f*.007:.027);
      const tip=joint(label+'_finger_'+i+'_tip',middle,
        support?side*.086:f*.005,
        support?-.015:.10+.016*(2-Math.abs(f)),
        support?f*.006:.015);
      const end=joint(label+'_finger_'+i+'_end',tip,
        support?side*.055:f*.003,support?-.014:.057,
        support?f*.005:.012);
      span(palm,base,support?.034:.028,support?.031:.026);
      span(base,middle,support?.036:.027,support?.026:.020);
      span(middle,tip,support?.027:.020,support?.017:.013);
      span(tip,end,support?.018:.014,support?.006:.005);
      oval(base,skin,0,0,0,support?.041:.031,.037,.034);
      oval(middle,skin,0,0,0,support?.031:.023,.026,.025);
      const plate=oval(tip,nail,0,support?-.013:.021,support?-.011:.020,
        support?.020:.016,support?.009:.028,support?.024:.010);
      plate.rotation.z=side*.12;
      fingers.push({base,middle,tip,end,index:i});
    }
    allHands.push({palm,fingers,kind,side});
    return fingers;
  }

  const palmFaces=[],hairLocks=[];
  function palmFeature(palm,id,level,side){
    const contour=new THREE.Shape();
    const n=40;
    for(let i=0;i<=n;i++){
      const a=2*Math.PI*i/n;
      const x=Math.cos(a)*(.146+.008*Math.sin(5*a+level));
      const y=Math.sin(a)*(.204+.007*Math.sin(3*a+side));
      if(!i)contour.moveTo(x,y);else contour.lineTo(x,y);
    }
    function aperture(x,y,rx,ry){
      const p=new THREE.Path();
      p.absellipse(x,y,rx,ry,0,Math.PI*2,true,0);
      contour.holes.push(p);
    }
    aperture(0,.067,.079,.068);
    aperture(0,-.100,.082,.045);
    const flesh=part(palm,new THREE.ExtrudeGeometry(contour,{
      depth:.074,steps:1,curveSegments:24,bevelEnabled:true,
      bevelSegments:3,bevelSize:.008,bevelThickness:.009
    }),skin,0,0,-.039);
    flesh.name=id+'_hollow_palm';
    // Real depth in the openings: the eyes and mouth sit behind the face plane.
    oval(palm,shadowSkin,0,.069,-.037,.088,.077,.030);
    const eyeballPivot=new THREE.Group();eyeballPivot.position.set(0,.067,.014);palm.add(eyeballPivot);
    oval(eyeballPivot,white,0,0,.012,.068,.064,.067);
    const gaze=new THREE.Group();gaze.position.set(0,0,.071);eyeballPivot.add(gaze);
    oval(gaze,iris,0,0,0,.039,.043,.014);
    oval(gaze,pupil,0,0,.013,.020,.029,.008);
    oval(gaze,white,-.015,.021,.020,.009,.011,.004);
    const top=oval(palm,skin,0,.123,.083,.087,.025,.021);
    const bottom=oval(palm,skin,0,.009,.083,.087,.019,.020);
    // A sunken cavity framed by asymmetrical lips, gums and separate upper/lower teeth.
    const cavity=oval(palm,mouth,0,-.100,-.001,.076,.039,.018);
    cavity.name=id+'_mouth_cavity';
    const lipPath=[];
    for(let i=0;i<=32;i++){
      const a=i/32*Math.PI*2;
      lipPath.push(V(Math.cos(a)*.084,-.100+Math.sin(a)*.048,.048));
    }
    strand(palm,lipPath.map(p=>p.toArray()),.0085,shadowSkin);
    oval(palm,gums,0,-.076,.029,.070,.012,.013);
    const jaw=new THREE.Group();jaw.position.set(0,-.114,.03);palm.add(jaw);
    oval(jaw,gums,0,-.008,.002,.072,.011,.012);
    for(let k=0;k<8;k++){
      const x=(k-3.5)*.0174;
      const len=.023+.011*(.5+.5*Math.sin(k*2.9+level));
      const up=part(palm,new THREE.ConeGeometry(.009,len,7),teeth,x,-.082,.049);
      up.rotation.z=Math.PI+Math.sin(k*7)*.13;
      const low=part(jaw,new THREE.ConeGeometry(.008,len*.78,7),teeth,x,-.003,.028);
      low.rotation.z=.08*Math.sin(k*4.1);
    }
    // Fine crow's-foot wrinkles belong to the actual palm, not floating decals.
    for(const sign of [-1,1])for(let i=0;i<3;i++){
      strand(palm,[
        [sign*.081,.075-i*.024,.052],
        [sign*(.102+i*.006),.081-i*.028,.057],
        [sign*.117,.097-i*.029,.046]
      ],.0024,shadowSkin);
    }
    palmFaces.push({palm,eyeballPivot,gaze,top,bottom,cavity,jaw,level,side});
  }
  // Three pairs of grounded walking arms with short, bent segments.
  for(const side of [-1,1])for(let level=0;level<3;level++){
    const id='Walking_'+(side<0?'L':'R')+'_'+level;
    const shoulder=joint(id+'_shoulder',pelvis,side*.40,-.035,(level-1)*.28);
    const elbow=joint(id+'_elbow',shoulder,side*(.36+.05*level),-.43,(level-1)*.19);
    const wrist=joint(id+'_wrist',elbow,side*(.43+.035*level),-.41,(level-1)*.12);
    const palm=joint(id+'_palm',wrist,side*.075,-.06,.01);
    span(shoulder,elbow,.165,.115);span(elbow,wrist,.125,.075);
    span(wrist,palm,.068,.09);
    oval(shoulder,skin,0,0,0,.19,.17,.16);
    oval(elbow,skin,0,0,0,.13,.13,.13);
    oval(palm,skin,0,0,0,.145,.072,.19);
    makeFingers(palm,id,'walking',side);
    walkLegs.push({shoulder,elbow,wrist,palm,side,level});
  }
  // Six extra arms fan from the back. Only these palms contain eyes and mouths.
  for(const side of [-1,1])for(let level=0;level<3;level++){
    const id='Back_'+(side<0?'L':'R')+'_'+level;
    const shoulder=joint(id+'_shoulder',chest,side*.28,.09-level*.11,-.24);
    const elbow=joint(id+'_elbow',shoulder,side*(.34+.06*level),.24-level*.08,-.10);
    const wrist=joint(id+'_wrist',elbow,side*(.40+.05*level),.13-level*.12,.28);
    const palm=joint(id+'_palm',wrist,side*.065,.012,.065);
    span(shoulder,elbow,.102,.069);span(elbow,wrist,.077,.050);
    span(wrist,palm,.051,.069);
    oval(shoulder,skin,0,0,0,.13,.13,.13);
    oval(elbow,skin,0,0,0,.079,.075,.075);
    palmFeature(palm,id,level,side);
    makeFingers(palm,id,'fan',side);
    fanArms.push({shoulder,elbow,wrist,palm,side,level});
  }
  // The original human arms are separate from the six extra arms.
  // These hands remain plain and lift to cover the eyeless face.
  for(const side of [-1,1]){
    const id='Human_'+(side<0?'L':'R');
    const shoulder=joint(id+'_shoulder',chest,side*.30,.02,.13);
    const elbow=joint(id+'_elbow',shoulder,side*.22,.16,.22);
    const wrist=joint(id+'_wrist',elbow,-side*.40,.32,.25);
    const palm=joint(id+'_palm',wrist,-side*.035,.07,.04);
    span(shoulder,elbow,.125,.084);span(elbow,wrist,.089,.054);
    span(wrist,palm,.056,.076);
    oval(shoulder,skin,0,0,0,.14,.13,.12);
    oval(elbow,skin,0,0,0,.095,.095,.091);
    oval(palm,skin,0,0,0,.105,.158,.067);
    makeFingers(palm,id,'human',side);
    humanArms.push({shoulder,elbow,wrist,palm,side});
  }
  // Build a SINGLE genuine weighted SkinnedMesh for the connective anatomy.
  // Each segment's rings blend the near and far joint bones.
  root.updateMatrixWorld(true);
  const position=[],uv=[],skinIndex=[],skinWeight=[],index=[];
  const p=V(),q=V(),dir=V(),u=V(),v=V(),center=V(),vert=V();
  for(const s of spans){
    s.a.getWorldPosition(p);s.b.getWorldPosition(q);
    dir.subVectors(q,p).normalize();
    u.set(0,0,1);
    if(Math.abs(u.dot(dir))>.94)u.set(1,0,0);
    u.addScaledVector(dir,-u.dot(dir)).normalize();
    v.crossVectors(dir,u).normalize();
    const first=position.length/3, rings=10, sides=12;
    for(let k=0;k<=rings;k++){
      const t=k/rings,r=(s.r0*(1-t)+s.r1*t)*(1+.14*Math.sin(t*Math.PI)+.022*Math.sin(t*13.2));
      center.copy(p).lerp(q,t);
      const blend=t*t*(3-2*t);
      for(let j=0;j<=sides;j++){
        const a=j/sides*Math.PI*2;
        vert.copy(center).addScaledVector(u,Math.cos(a)*r*(1+.035*Math.sin(a*3+t*8))).addScaledVector(v,Math.sin(a)*r*.90);
        position.push(vert.x,vert.y,vert.z);
        uv.push(j/sides,t);
        skinIndex.push(boneIndices.get(s.a),boneIndices.get(s.b),0,0);
        skinWeight.push(1-blend,blend,0,0);
      }
    }
    for(let k=0;k<rings;k++)for(let j=0;j<sides;j++){
      const a=first+k*(sides+1)+j,b=a+sides+1;
      index.push(a,b,a+1,b,b+1,a+1);
    }
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(position,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  g.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(skinIndex,4));
  g.setAttribute('skinWeight',new THREE.Float32BufferAttribute(skinWeight,4));
  g.setIndex(index);
  g.computeVertexNormals();
  const skeleton=new THREE.Skeleton(bones);
  const anatomy=new THREE.SkinnedMesh(g,skin);
  anatomy.name='Weighted body and articulated fingers';
  anatomy.castShadow=true;anatomy.receiveShadow=true;anatomy.frustumCulled=false;
  root.add(anatomy);anatomy.bind(skeleton);anatomy.normalizeSkinWeights();

  // The dress follows pelvis/spine. Hem deliberately irregular, not a plain cone.
  oval(chest,dress,0,-.125,.01,.37,.42,.30);
  const skirtGeo=new THREE.CylinderGeometry(.37,.70,.99,28,12,true);
  const ca=skirtGeo.attributes.position;
  for(let i=0;i<ca.count;i++){
    const x=ca.getX(i),y=ca.getY(i),z=ca.getZ(i),a=Math.atan2(z,x);
    if(y<-.34)ca.setY(i,y+.09*Math.sin(a*8)+.045*Math.sin(a*19));
    ca.setX(i,x*(1+.03*Math.sin(a*9+y*10)));
  }
  skirtGeo.computeVertexNormals();
  part(pelvis,skirtGeo,dress,0,-.15,.01);
  for(let i=0;i<18;i++){
    const a=2*Math.PI*i/18;
    const strip=part(pelvis,new THREE.PlaneGeometry(.13,.19+.04*(i%4)),
      i%4===0?hem:dress,Math.cos(a)*.64,-.62,Math.sin(a)*.64);
    strip.rotation.y=Math.PI/2-a;
    strip.rotation.z=.15*Math.sin(i*3.9);
  }
  for(const side of [-1,1]){
    strand(chest,[[side*.25,.13,.281],[side*.27,-.08,.30],[side*.30,-.36,.28]],.009,hem);
    for(let i=0;i<10;i++){
      const y=.13-i*.040;
      strand(chest,[[side*.28-.026,y,.293],[side*.28+.015,y-.014,.299]],.004,hem);
    }
  }
  // A slightly gaunt woman's head. There are NO eyeballs in the face.
  oval(head,skin,0,.044,.015,.255,.316,.235);
  oval(head,shadowSkin,0,-.177,.115,.142,.112,.14);
  for(const side of [-1,1]){
    oval(head,hollow,side*.103,.105,.224,.091,.063,.024);
    oval(head,shadowSkin,side*.104,.178,.222,.109,.029,.035);
    oval(head,skin,side*.186,-.018,.139,.064,.10,.065);
    oval(head,bruise,side*.148,-.085,.216,.061,.036,.014);
  }
  oval(head,skin,0,.006,.245,.055,.100,.062); // bent nose
  oval(head,mouth,0,-.145,.255,.135,.049,.024);
  for(let i=0;i<11;i++){
    const x=(i-5)*.022;
    const f=part(head,new THREE.ConeGeometry(.011,.060+(i%3)*.009,5),
      teeth,x,-.142,.280);
    f.rotation.z=i%2?Math.PI:0;
  }
  for(let i=0;i<15;i++){
    const x=((i*7)%13-6)*.026, y=.18-((i*3)%10)*.034;
    strand(head,[[x,y,.236],[x+.01,y-.021,.246],[x-.012,y-.037,.238]],.0035,bruise);
  }
  oval(head,hair,0,.322,-.025,.263,.11,.246);
  // Irregular brown strands hang from the scalp to shoulders and torn dress.
  for(let i=0;i<76;i++){
    const a=i*2.3999632297, r=.18+.07*(i%7)/6;
    const x=Math.cos(a)*r,z=Math.sin(a)*r-.02;
    const length=.36+((i*11)%19)*.036;
    const lock=strand(head,[[x,.32,z],[x*1.12,.12,z+.025*Math.sin(i)],
      [x*1.35+Math.sin(i*2)*.06,-length*.53,z+.06*Math.cos(i)],
      [x*1.58+.09*Math.sin(i*1.4),-length,z+.09*Math.sin(i*1.7)]],
    .008+(i%4)*.0025,i%5?hair:hairHighlight);
    if(i%6===0)hairLocks.push({lock,i});
  }
  // Knuckle creases emphasize human HANDS at the six ground contacts.
  for(const limb of walkLegs){
    for(let k=-1;k<=1;k++){
      strand(limb.palm,[[0,.014,k*.046],[limb.side*.105,.016,k*.046+.006]],.004,shadowSkin);
    }
  }
  // A compact silhouette: head just above an adult's eye line, not a towering giant.
  root.scale.setScalar(.78);
  root.visible=false;
  root.userData.rig={
    weightedMesh:true,boneCount:bones.length,walkingLimbs:6,
    fanArms:6,humanArms:2,articulatedHands:14,fingerCount:70,
    estimatedHeight:2.16,palmEyes:6,palmMouths:6,kinematics:'analytic-IK',groundedKnuckles:true
  };
  // Transparent contact penumbrae, tied to each planted knuckle rather than the torso.
  const contactGeometry=new THREE.CircleGeometry(.22,24);
  for(const leg of walkLegs){
    const m=new THREE.Mesh(contactGeometry,new THREE.MeshBasicMaterial({
      color:0x07080a,transparent:true,opacity:.19,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2
    }));
    m.rotation.x=-Math.PI/2;m.renderOrder=1;root.add(m);leg.contact=m;
    leg.footWorld=null;leg.inSwing=false;
  }
  let locomotionTime=0;
  function reset(){
    locomotionTime=0;
    for(const leg of walkLegs){
      leg.footWorld=null;leg.inSwing=false;leg.swingStart=null;leg.swingEnd=null;
    }
  }
  // Rotate the bone toward an IK destination in its PARENT'S space. The bind lengths
  // never change: both the skin mesh and all attached joints deform with the solution.
  function aimBone(bone,child,worldDestination){
    bone.parent.updateWorldMatrix(true,false);
    const local=bone.parent.worldToLocal(worldDestination.clone()).sub(bone.position);
    if(local.lengthSq()<1e-8)return;
    bone.quaternion.setFromUnitVectors(child.position.clone().normalize(),local.normalize());
    bone.updateWorldMatrix(false,true);
  }
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  function animate(t,phase='linger',dt=1/60,lookTarget=null,phaseAge=0){
    const stalking=phase==='stalk'||phase==='pursuit';
    locomotionTime+=Math.max(0,dt)*(phase==='pursuit'?1.65:1);
    const cycle=locomotionTime*Math.PI*2*1.55;
    const breathe=Math.sin(t*.95);
    const crouch=phase==='cover'?1:phase==='rise'?Math.max(0,1-phaseAge/1.6):0;
    rig.position.y=(stalking?.018:.006)*Math.sin(cycle*2)-.16*crouch;
    pelvis.rotation.z=.025*Math.sin(cycle)*(stalking?1:.2);
    pelvis.rotation.y=.028*Math.sin(cycle*.5);
    lumbar.rotation.x=.115+.032*breathe+.16*crouch;
    chest.rotation.z=.024*Math.sin(t*.80);
    chest.rotation.x=.035*Math.sin(t*.6);
    neck.rotation.x=-.11+.022*Math.sin(t*.67);
    head.rotation.y=.07*Math.sin(t*.63);
    head.rotation.z=.033*Math.sin(t*.78);
    root.updateMatrixWorld(true);

    // Six-beat alternating gait; planted targets remain in WORLD coordinates.
    // The analytic two-link solver determines the elbow bend from a forward pole.
    for(const leg of walkLegs){
      const homeX=leg.side*(.94+.04*leg.level);
      const homeZ=(leg.level-1)*.34+.12;
      const rest=()=>{
        const v=root.localToWorld(V(homeX,.15,homeZ));
        v.y=groundY(v.x,v.z)+.118;
        return v;
      };
      if(!leg.footWorld)leg.footWorld=rest();
      const gp=swingProgress(gaitPhase(locomotionTime,leg.level,leg.side));
      let wristTarget=leg.footWorld.clone();
      if(stalking && gp.swing){
        if(!leg.inSwing){
          leg.swingStart=leg.footWorld.clone();
          leg.swingEnd=root.localToWorld(V(homeX,.15,homeZ+.43));
          leg.swingEnd.y=groundY(leg.swingEnd.x,leg.swingEnd.z)+.118;
          leg.inSwing=true;
        }
        wristTarget.lerpVectors(leg.swingStart,leg.swingEnd,gp.progress);
        wristTarget.y+=.23*gp.lift;
      }else if(leg.inSwing){
        leg.footWorld.copy(leg.swingEnd);
        wristTarget.copy(leg.footWorld);
        leg.inSwing=false;
      }
      // If the root rotates sharply, the solver limits extension instead of
      // tearing limbs away from their pelvis or stretching the weighted skin.
      root.updateMatrixWorld(true);
      const shoulderWorld=leg.shoulder.getWorldPosition(V());
      const upper=leg.elbow.position.length()*root.scale.x;
      const lower=leg.wrist.position.length()*root.scale.x;
      const pole=root.localToWorld(V(leg.side*1.4,.64,(leg.level-1)*.36+.58));
      const {elbow,wrist}=solveTwoBone(
        shoulderWorld.toArray(),wristTarget.toArray(),upper,lower,pole.toArray()
      );
      aimBone(leg.shoulder,leg.elbow,V(...elbow));
      aimBone(leg.elbow,leg.wrist,V(...wrist));
      leg.palm.rotation.x=.035+(stalking?-.055*Math.sin(cycle+leg.level*2+leg.side):0);
      leg.palm.rotation.z=leg.side*(stalking?-.025:.012);
      // Contact shadows remain on the road, even while the finger joints lift.
      const contactPoint=root.worldToLocal(V(wristTarget.x,groundY(wristTarget.x,wristTarget.z)+.018,wristTarget.z));
      leg.contact.position.copy(contactPoint);
      leg.contact.material.opacity=gp.swing&&stalking?.09:.19;
      leg.contact.scale.setScalar(gp.swing&&stalking?.82:1);
    }
    for(const a of fanArms){
      const w=Math.sin(t*1.31+a.level*.8+(a.side>0?1.5:0));
      a.shoulder.rotation.z=a.side*(.045+.075*w);
      a.shoulder.rotation.x=.025*Math.sin(t*.85+a.level);
      a.elbow.rotation.x=.075*Math.sin(t*.90+a.level);
      a.elbow.rotation.y=.045*Math.sin(t*1.4+a.level*1.3);
      a.wrist.rotation.z=a.side*.11*Math.sin(t*1.10+a.level);
      a.palm.rotation.y=.085*Math.sin(t*.64+a.level);
    }
    const cover=phase==='cover'||phase==='stalk'?1:.5;
    for(const a of humanArms){
      a.shoulder.rotation.z=a.side*(-.11*cover+.045*breathe);
      a.elbow.rotation.x=-.13*cover;
      a.wrist.rotation.z=a.side*(.06+.06*cover);
      a.palm.rotation.x=-.15*cover;
    }
    for(const h of allHands){
      const walking=h.kind==='walking';
      for(const f of h.fingers){
        const pulse=.5+.5*Math.sin(t*(walking?2.7:1.25)+f.index*.55+(h.side>0?2:0));
        if(walking){
          // An actual three-knuckle curl under weight, flexing during push-off.
          f.base.rotation.z=h.side*(-.28-.14*pulse);
          f.middle.rotation.z=h.side*(.54+.16*pulse);
          f.tip.rotation.z=h.side*(-.23-.08*pulse);
          f.end.rotation.z=h.side*.08;
          f.base.rotation.x=(f.index-2)*.018;
        }else{
          f.base.rotation.x=-.10-.14*pulse;
          f.middle.rotation.x=-.20-.29*pulse;
          f.tip.rotation.x=-.17-.24*pulse;
          f.end.rotation.x=-.08-.12*pulse;
          f.base.rotation.z=(f.index-2)*.047;
        }
      }
    }
    // Six asynchronous eyes independently scan, track, and blink. Their cavities
    // and jaws are actual meshes, not flat decals on top of an oval hand.
    for(const f of palmFaces){
      const seed=f.level*2.1+f.side*1.73;
      const blink=Math.pow(Math.max(0,Math.sin(t*.71+seed)),26);
      f.top.position.y=.123-.051*blink;
      f.top.scale.y=.025+.021*blink;
      f.bottom.position.y=.009+.035*blink;
      f.bottom.scale.y=.019+.015*blink;
      let trackX=Math.sin(t*.37+seed)*.007;
      let trackY=Math.cos(t*.41+seed)*.006;
      if(lookTarget){
        f.palm.updateWorldMatrix(true,false);
        const v=f.palm.worldToLocal(lookTarget.clone());
        const distance=Math.max(1,v.length());
        trackX=clamp(v.x/distance*.048+trackX,-.016,.016);
        trackY=clamp(v.y/distance*.045+trackY,-.016,.016);
      }
      f.gaze.position.set(trackX,trackY,.071);
      f.eyeballPivot.rotation.y=trackX*2.7;
      f.eyeballPivot.rotation.x=-trackY*2.5;
      const opened=.42+.30*Math.sin(t*.83+seed)+.17*Math.sin(t*1.76+seed);
      f.jaw.position.y=-.114-.015*Math.max(0,opened);
      f.cavity.scale.y=.039*(.72+.31*Math.max(0,opened));
    }
    for(const {lock,i} of hairLocks){
      lock.rotation.z=.028*Math.sin(t*.89+i*1.73);
      lock.rotation.x=.018*Math.sin(t*.57+i*.81);
    }
  }
  return {group:root,animate,reset,skeleton,anatomy};
}
