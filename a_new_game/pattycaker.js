// Pattycaker: an original, procedural six-legged creature for The Road.
// No network asset or prerecorded audio is required for the visual encounter.
export function makePattycaker(THREE) {
  const root=new THREE.Group();
  root.name='Pattycaker';
  const skin=new THREE.MeshStandardMaterial({color:0xbdb0a1,roughness:.96,side:THREE.DoubleSide});
  const dress=new THREE.MeshStandardMaterial({color:0x25212a,roughness:1,side:THREE.DoubleSide});
  const hair=new THREE.MeshStandardMaterial({color:0x35241e,roughness:1});
  const mouth=new THREE.MeshStandardMaterial({color:0x130b0c,roughness:.8});
  const teeth=new THREE.MeshStandardMaterial({color:0xd7c7ac,roughness:.72});
  const eyes=new THREE.MeshStandardMaterial({color:0xd7cfb9,roughness:.44});
  const irises=new THREE.MeshStandardMaterial({color:0x69523a,roughness:.39});
  const pupils=new THREE.MeshBasicMaterial({color:0x100e0c});
  const up=new THREE.Vector3(0,1,0);
  function part(parent,geometry,material,x=0,y=0,z=0) {
    const m=new THREE.Mesh(geometry,material);
    m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m;
  }
  function ellipsoid(parent,material,x,y,z,sx,sy,sz) {
    const m=part(parent,new THREE.SphereGeometry(1,14,10),material,x,y,z);
    m.scale.set(sx,sy,sz);return m;
  }
  function bone(parent,material,radius) {
    return part(parent,new THREE.CylinderGeometry(radius*.82,radius,1,8),material);
  }
  function join(mesh,a,b) {
    const d=new THREE.Vector3().subVectors(b,a);
    mesh.position.copy(a).addScaledVector(d,.5);
    mesh.quaternion.setFromUnitVectors(up,d.clone().normalize());
    mesh.scale.set(1,d.length(),1);
  }
  const V=(x,y,z)=>new THREE.Vector3(x,y,z);
  // Body: a bent human silhouette above the six load-bearing walking limbs.
  ellipsoid(root,skin,0,2.83,.06,.45,.65,.32);
  ellipsoid(root,skin,0,2.08,-.16,.55,.44,.43);
  const skirt=part(root,new THREE.CylinderGeometry(.38,.87,1.53,18,6),dress,0,2.35,.06);
  const sp=skirt.geometry.attributes.position;
  for(let i=0;i<sp.count;i++)if(sp.getY(i)<-.6)sp.setY(i,sp.getY(i)+Math.sin(i*2.13)*.16);
  skirt.geometry.computeVertexNormals();
  ellipsoid(root,dress,0,3.07,0,.43,.46,.34);
  ellipsoid(root,skin,0,3.79,.17,.325,.425,.30);
  ellipsoid(root,skin,0,3.57,.42,.135,.08,.13); // angular chin
  ellipsoid(root,hair,0,4.09,.10,.36,.21,.33);
  for(let i=0;i<24;i++){
    const a=i/24*Math.PI*2;
    const sx=Math.cos(a)*.33,sz=Math.sin(a)*.26+.08;
    const p0=V(sx,4.04,sz),p1=V(sx*1.16,3.57,sz-.03),p2=V(sx*1.4,2.91+Math.sin(i*1.7)*.2,sz-.06);
    const strand=part(root,new THREE.TubeGeometry(new THREE.CatmullRomCurve3([p0,p1,p2]),6,.024+(.01*(i%3)),4,false),hair);
    strand.castShadow=false;
  }
  // Her face intentionally has NO eyes. There are small irregular teeth in its mouth.
  ellipsoid(root,mouth,0,3.63,.465,.20,.075,.035);
  for(let i=0;i<11;i++){
    const x=(i-5)*.034;
    const tooth=part(root,new THREE.ConeGeometry(.019,.09,4),teeth,x,3.62+(i%2)*.017,.507);
    tooth.rotation.z=i%2?Math.PI:0;
  }

  const walkLegs=[];
  // Exactly three matching pairs of strong support limbs, ending in five-fingered hands.
  for(const side of [-1,1])for(let level=0;level<3;level++){
    const upper=bone(root,skin,.19),lower=bone(root,skin,.15);
    const palm=ellipsoid(root,skin,0,0,0,.19,.12,.29);
    const fingers=[];
    for(let finger=0;finger<5;finger++){
      const f=bone(root,skin,.027);
      fingers.push(f);
    }
    walkLegs.push({side,level,upper,lower,palm,fingers});
  }

  const fanArms=[];
  // Exactly six additional arms fan out of her back in three symmetric pairs.
  // ONLY these six palms have the eyeball and tooth-rimmed mouth.
  for(const side of [-1,1])for(let level=0;level<3;level++){
    const pivot=new THREE.Group();
    pivot.position.set(side*.28,3.15-level*.12,-.31);
    root.add(pivot);
    const elbow=V(side*(.55+.10*level),.52+(2-level)*.18,-.12);
    const handPos=V(side*(1.65+.16*(2-level)),1.22-level*.42,-.04);
    join(bone(pivot,skin,.10),V(0,0,0),elbow);
    join(bone(pivot,skin,.085),elbow,handPos);
    const hand=ellipsoid(pivot,skin,handPos.x,handPos.y,handPos.z,.17,.26,.085);
    // Visible forward-facing ocular palm, separate from its tiny lower mouth.
    ellipsoid(hand,eyes,0,.075,.97,.45,.38,.28);
    ellipsoid(hand,irises,0,.075,1.22,.22,.23,.10);
    ellipsoid(hand,pupils,0,.075,1.32,.105,.13,.045);
    ellipsoid(hand,mouth,0,-.47,1.02,.43,.22,.23);
    for(let tooth=0;tooth<5;tooth++){
      const fang=part(hand,new THREE.ConeGeometry(.085,.27,4),teeth,(tooth-2)*.15,-.48,1.23);
      fang.rotation.z=tooth%2?0:Math.PI;
    }
    for(let f=0;f<5;f++){
      const x=(f-2)*.15;
      const finger=part(pivot,new THREE.CapsuleGeometry(.028,.21+(.06*(f%2)),3,5),skin,
        handPos.x+x,handPos.y+.32+(.04*(f%2)),handPos.z);
      finger.rotation.z=-side*.13;
    }
    fanArms.push({pivot,side,level});
  }
  const humanArms=[];
  // Original two hands are plain: they cover the eyeless face during the encounter.
  for(const side of [-1,1]){
    const upper=bone(root,skin,.10),lower=bone(root,skin,.085);
    const hand=ellipsoid(root,skin,0,0,0,.115,.17,.065);
    const fingers=[];
    for(let i=0;i<5;i++)fingers.push(bone(root,skin,.018));
    humanArms.push({side,upper,lower,hand,fingers});
  }

  root.visible=false;
  function animate(t,phase) {
    const walking=phase==='stalk';
    const cover=phase==='cover'?1:walking?.86:0;
    const gait=walking?t*4.1:0;
    root.position.y=Math.sin(gait*1.4)*.045+(walking?0:Math.sin(t*.8)*.025);
    root.rotation.z=Math.sin(gait*.55)*.032;
    for(const leg of walkLegs){
      const {side,level,upper,lower,palm,fingers}=leg;
      const wave=Math.sin(gait+level*Math.PI*.66+(side===1?Math.PI:0));
      const lift=walking?Math.max(0,wave)*.26:0;
      const hip=V(side*.52,1.95,-.34+level*.34);
      const knee=V(side*(1.17+level*.19),1.18+lift*.3,-.9+level*.8);
      const foot=V(side*(2.02+level*.24),.13+lift,-1.35+level*1.2+(walking?Math.cos(gait+level*2)*.22:0));
      join(upper,hip,knee);join(lower,knee,foot);
      palm.position.copy(foot);
      for(let f=0;f<5;f++){
        const x=foot.x+side*(.16+.04*(4-Math.abs(2-f)));
        const z=foot.z+(f-2)*.115;
        join(fingers[f],V(foot.x,foot.y,foot.z+(f-2)*.075),V(x,foot.y-.045,z));
      }
    }
    for(const arm of fanArms)arm.pivot.rotation.z=arm.side*.065*Math.sin(t*.9+arm.level*.8);
    for(const a of humanArms){
      const s=a.side;
      const shoulder=V(s*.42,3.1,.13);
      const elbow=V(s*(.74-cover*.23),2.60+cover*.65,.31+cover*.04);
      const end=V(s*(.72-cover*.54),2.17+cover*1.61,.42+cover*.13);
      join(a.upper,shoulder,elbow);join(a.lower,elbow,end);
      a.hand.position.copy(end);
      for(let f=0;f<5;f++){
        const x=end.x+(f-2)*.038;
        join(a.fingers[f],V(x,end.y+.09,end.z),V(x+(f-2)*.015,end.y+.27,end.z+.018));
      }
    }
  }
  return {group:root,animate};
}
