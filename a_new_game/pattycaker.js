// Pattycaker: compact adult spider-like woman for The Road.
// A connected bone hierarchy deforms an actual weighted SkinnedMesh.
// All fourteen limbs and seventy fingers are physically articulated in the rig;
// six walking hands, six eyed/mouthed fan palms, and two ordinary human hands.
export function makePattycaker(THREE) {
  const root=new THREE.Group();
  root.name='Pattycaker';
  const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
  const skin=new THREE.MeshStandardMaterial({color:0xa99b8f,roughness:.94,side:THREE.DoubleSide});
  const shadowSkin=new THREE.MeshStandardMaterial({color:0x887971,roughness:1});
  const bruise=new THREE.MeshStandardMaterial({color:0x716269,roughness:.99});
  const dress=new THREE.MeshStandardMaterial({color:0x29262b,roughness:1,side:THREE.DoubleSide});
  const hem=new THREE.MeshStandardMaterial({color:0x554950,roughness:1,side:THREE.DoubleSide});
  const hair=new THREE.MeshStandardMaterial({color:0x36271f,roughness:1});
  const hairHighlight=new THREE.MeshStandardMaterial({color:0x584035,roughness:1});
  const hollow=new THREE.MeshStandardMaterial({color:0x30211e,roughness:1});
  const mouth=new THREE.MeshStandardMaterial({color:0x180d0e,roughness:.85});
  const teeth=new THREE.MeshStandardMaterial({color:0xd3c2a9,roughness:.7});
  const white=new THREE.MeshPhysicalMaterial({color:0xd4ccba,roughness:.35});
  const iris=new THREE.MeshStandardMaterial({color:0x76513f,roughness:.48});
  const pupil=new THREE.MeshBasicMaterial({color:0x110d0e});
  const sphere=new THREE.SphereGeometry(1,18,12);
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
      8,radius,5,false),mat);
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
      span(base,middle,support?.033:.026,support?.024:.019);
      span(middle,tip,support?.025:.018,support?.013:.011);
      oval(base,skin,0,0,0,support?.039:.029,.035,.032);
      fingers.push({base,middle,tip,index:i});
    }
    allHands.push({palm,fingers,kind,side});
    return fingers;
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
    oval(palm,skin,0,0,0,.14,.192,.074);
    // Organic eye above a tiny tooth-bordered mouth, both facing forwards.
    oval(palm,white,0,.064,.070,.088,.078,.035);
    oval(palm,iris,0,.064,.102,.050,.050,.017);
    oval(palm,pupil,0,.064,.117,.024,.031,.009);
    oval(palm,mouth,0,-.096,.073,.093,.046,.023);
    for(let k=0;k<7;k++){
      const f=part(palm,new THREE.ConeGeometry(.010,.048,5),teeth,(k-3)*.025,-.094,.096);
      f.rotation.z=(k%2?1:-1)*.28;
    }
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
    const first=position.length/3, rings=7, sides=9;
    for(let k=0;k<=rings;k++){
      const t=k/rings,r=(s.r0*(1-t)+s.r1*t)*(1+.025*Math.sin(t*6.283));
      center.copy(p).lerp(q,t);
      const blend=t*t*(3-2*t);
      for(let j=0;j<=sides;j++){
        const a=j/sides*Math.PI*2;
        vert.copy(center).addScaledVector(u,Math.cos(a)*r).addScaledVector(v,Math.sin(a)*r);
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
  part(abdomen,skirtGeo,dress,0,-.15,.01);
  for(let i=0;i<18;i++){
    const a=2*Math.PI*i/18;
    const strip=part(abdomen,new THREE.PlaneGeometry(.13,.19+.04*(i%4)),
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
    strand(head,[[x,.32,z],[x*1.12,.12,z+.025*Math.sin(i)],
      [x*1.35+Math.sin(i*2)*.06,-length*.53,z+.06*Math.cos(i)],
      [x*1.58+.09*Math.sin(i*1.4),-length,z+.09*Math.sin(i*1.7)]],
    .008+(i%4)*.0025,i%5?hair:hairHighlight);
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
    estimatedHeight:2.16
  };
  function animate(t,phase='linger'){
    const stalking=phase==='stalk';
    const cycle=t*3.8;
    const breathe=Math.sin(t*.95);
    rig.position.y=(stalking?.027:.008)*Math.sin(cycle*2);
    pelvis.rotation.z=.026*Math.sin(cycle)*(stalking?1:.3);
    lumbar.rotation.x=.07+.025*breathe;
    chest.rotation.z=.025*Math.sin(t*.8);
    neck.rotation.x=-.09+.025*Math.sin(t*.67);
    head.rotation.y=.09*Math.sin(t*.63);
    head.rotation.z=.04*Math.sin(t*.78);
    for(const a of walkLegs){
      const phaseOffset=a.level*2*Math.PI/3+(a.side>0?Math.PI:0);
      const swing=Math.sin(cycle+phaseOffset);
      const lift=stalking?Math.max(0,swing):0;
      a.shoulder.rotation.z=a.side*.10*swing*(stalking?1:.18);
      a.shoulder.rotation.y=.065*Math.sin(cycle+phaseOffset);
      a.elbow.rotation.x=.13*lift;
      a.elbow.rotation.z=a.side*(stalking?-.08*swing:0);
      a.wrist.rotation.x=-.21*lift;
      a.palm.rotation.x=.10*Math.sin(cycle+phaseOffset);
    }
    for(const a of fanArms){
      const w=Math.sin(t*1.3+a.level*.8+(a.side>0?1.5:0));
      a.shoulder.rotation.z=a.side*(.065+.09*w);
      a.elbow.rotation.x=.08*Math.sin(t*.9+a.level);
      a.wrist.rotation.z=a.side*.13*Math.sin(t*1.1+a.level);
      a.palm.rotation.y=.10*Math.sin(t*.64+a.level);
    }
    const cover=phase==='cover'||phase==='stalk'?1:.55;
    for(const a of humanArms){
      a.shoulder.rotation.z=a.side*(-.11*cover+.055*breathe);
      a.elbow.rotation.x=-.13*cover;
      a.wrist.rotation.z=a.side*(.06+.07*cover);
      a.palm.rotation.x=-.17*cover;
    }
    for(const h of allHands){
      for(const f of h.fingers){
        const pulse=.5+.5*Math.sin(t*(h.kind==='walking'?2.7:1.25)+f.index*.55+(h.side>0?2:0));
        f.base.rotation.x=(h.kind==='walking'?-.12:-.11)*pulse;
        f.middle.rotation.x=(h.kind==='walking'?-.40:-.30)*pulse;
        f.tip.rotation.x=(h.kind==='walking'?-.28:-.24)*pulse;
        f.base.rotation.z=(f.index-2)*.045;
      }
    }
  }
  return {group:root,animate,skeleton,anatomy};
}
