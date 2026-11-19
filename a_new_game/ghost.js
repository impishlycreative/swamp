// The Road v0.8 — rigged, human-proportioned Amish-inspired farmer apparition.
// Physical clothes, separate legs and a true THREE.Skeleton; no skirt, billowing
// vertices, glassy joint primitives, imported mannequin or flowing smoke.
export const GHOST_HEIGHT=1.86;
export const HEAD_TURN_DISTANCE=12;
export const GHOST_PATROL_BOUNDS={north:-137,south:71};

export function chooseRoadGhostCount(random=Math.random){
  const r=random();
  if(!Number.isFinite(r)||r<0||r>1)throw new RangeError('Random must be in [0, 1]');
  return r<.5?1:2;
}
export function nextRoadPatrol(z,direction,speed,dt,north=GHOST_PATROL_BOUNDS.north,south=GHOST_PATROL_BOUNDS.south){
  if(![z,direction,speed,dt,north,south].every(Number.isFinite)||speed<0||dt<0||north>=south)
    throw new RangeError('Invalid ghost patrol');
  const sign=direction>=0?1:-1,span=south-north;
  const unfolded=sign>0?z-north:2*span-(z-north);
  // Mirror at both endpoints and retain the incoming travel direction.
  const phase=((unfolded+speed*dt)%(2*span)+2*span)%(2*span);
  const next=phase<=span?north+phase:south-(phase-span);
  const facing=phase<span?1:-1;
  return {z:next,direction:facing};
}
const smooth=(x,a,b)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
export function ghostOpacityAtHeight(y,fade=1){
  return Math.max(0,Math.min(.82,fade*(.40+.60*smooth(y,.03,.36))));
}

function clothTexture(THREE){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=64;
  const ctx=canvas.getContext('2d'),img=ctx.createImageData(64,64);
  for(let y=0;y<64;y++)for(let x=0;x<64;x++){
    const n=155+9*Math.sin(x*2.1)+7*Math.sin(y*.7)+(x*17+y*31)%13;
    const i=(y*64+x)*4;img.data[i]=img.data[i+1]=img.data[i+2]=n;img.data[i+3]=255;
  }
  ctx.putImageData(img,0,0);
  const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;
  t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(2,4);t.needsUpdate=true;
  return t;
}
function spectralMaterial(THREE,color,opacity=.82,map=null){
  const material=new THREE.MeshStandardMaterial({
    color,roughness:.97,metalness:0,emissive:0x1d2b31,emissiveIntensity:.12,
    transparent:true,opacity,depthWrite:true,depthTest:true,side:THREE.FrontSide,
    map
  });
  const state={fade:0,ground:0};
  material.userData.ghostState=state;
  material.onBeforeCompile=shader=>{
    shader.uniforms.uFarmerFade={value:state.fade};
    shader.uniforms.uFarmerGround={value:state.ground};
    material.userData.shader=shader;
    shader.vertexShader=shader.vertexShader
      .replace('#include <common>','#include <common>\nvarying vec3 vFarmerLocal;')
      .replace('#include <begin_vertex>','#include <begin_vertex>\nvFarmerLocal=position;');
    shader.fragmentShader=shader.fragmentShader
      .replace('#include <common>','#include <common>\nvarying vec3 vFarmerLocal;\nuniform float uFarmerFade;\nuniform float uFarmerGround;')
      .replace('#include <opaque_fragment>','#include <opaque_fragment>\n'+
        'float foot=smoothstep(0.06,0.42,vFarmerLocal.y);\n'+
        'gl_FragColor.a*=uFarmerFade*(0.39+0.61*foot);\n'+
        'if(gl_FragColor.a<0.022) discard;\n');
  };
  material.customProgramCacheKey=()=> 'rigged-farmer-v0.8';
  return material;
}
function loft(THREE,rings,rib=20){
  const p=[],uv=[],idx=[];
  for(let i=0;i<rings.length;i++){
    const [y,x,rx,rz,z=0]=rings[i];
    for(let j=0;j<=rib;j++){
      const a=j/rib*Math.PI*2;
      p.push(x+Math.cos(a)*rx,y,z+Math.sin(a)*rz);
      uv.push(j/rib,i/(rings.length-1));
      if(i<rings.length-1&&j<rib){
        const a0=i*(rib+1)+j,b=a0+rib+1;
        idx.push(a0,b,a0+1,a0+1,b,b+1);
      }
    }
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
  geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  geo.setIndex(idx);geo.computeVertexNormals();
  return geo;
}
function assignWeights(THREE,geometry,pick){
  const positions=geometry.attributes.position;
  const indices=[],weights=[];
  for(let i=0;i<positions.count;i++){
    const entries=pick(positions.getX(i),positions.getY(i),positions.getZ(i));
    const sum=entries.reduce((n,e)=>n+e[1],0)||1;
    for(let j=0;j<4;j++){
      indices.push(entries[j]?.[0]??0);
      weights.push((entries[j]?.[1]??0)/sum);
    }
  }
  geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(indices,4));
  geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
  return geometry;
}
function ringWeight(y,a,b,first,second){
  const t=smooth(y,a,b);
  return [[first,1-t],[second,t]];
}
function attachMesh(THREE,bone,geometry,material,name,x=0,y=0,z=0){
  const mesh=new THREE.Mesh(geometry,material);
  mesh.name=name;mesh.position.set(x,y,z);mesh.castShadow=false;
  bone.add(mesh);return mesh;
}

export function createSpectralGhost(THREE){
  const group=new THREE.Group();group.name='GhostAmishFarmer';
  group.userData.ghostVersion='0.8.0';
  const texture=clothTexture(THREE);
  const coat=spectralMaterial(THREE,0x464e4a,.82,texture);
  const trousers=spectralMaterial(THREE,0x303a3b,.82,texture);
  const skin=spectralMaterial(THREE,0x999b92,.73);
  const black=spectralMaterial(THREE,0x171b1d,.86);
  const beard=spectralMaterial(THREE,0x252724,.77);
  beard.side=THREE.DoubleSide;
  const shirt=spectralMaterial(THREE,0x89908c,.72);
  const materials=[coat,trousers,skin,black,beard,shirt];

  const bones=[];
  function bone(name,parent,x,y,z){
    const b=new THREE.Bone();b.name=name;b.position.set(x,y,z);
    if(parent)parent.add(b);else group.add(b);
    bones.push(b);return b;
  }
  const hips=bone('Ghost_Hips',null,0,.94,0);
  const spine=bone('Ghost_Spine',hips,0,.19,0);
  const chest=bone('Ghost_Chest',spine,0,.22,0);
  const neck=bone('Ghost_Neck',chest,0,.15,0);
  const head=bone('Ghost_Head',neck,0,.16,0);
  const leftShoulder=bone('Ghost_L_UpperArm',chest,-.275,-.015,0);
  const leftElbow=bone('Ghost_L_Elbow',leftShoulder,-.18,-.275,.006);
  const leftWrist=bone('Ghost_L_Wrist',leftElbow,.06,-.265,.026);
  const rightShoulder=bone('Ghost_R_UpperArm',chest,.275,-.015,0);
  const rightElbow=bone('Ghost_R_Elbow',rightShoulder,.18,-.275,.006);
  const rightWrist=bone('Ghost_R_Wrist',rightElbow,-.06,-.265,.026);
  const leftHip=bone('Ghost_L_Thigh',hips,-.13,-.07,0);
  const leftKnee=bone('Ghost_L_Knee',leftHip,0,-.41,.01);
  const leftAnkle=bone('Ghost_L_Ankle',leftKnee,0,-.38,-.005);
  const rightHip=bone('Ghost_R_Thigh',hips,.13,-.07,0);
  const rightKnee=bone('Ghost_R_Knee',rightHip,0,-.41,.01);
  const rightAnkle=bone('Ghost_R_Ankle',rightKnee,0,-.38,-.005);
  // Wrist articulation and separate neck/head controls are genuine Bones, not group twists.
  const W={hips:0,spine:1,chest:2,neck:3,head:4,
    leftUpper:5,leftElbow:6,leftHand:7,rightUpper:8,rightElbow:9,rightHand:10,
    leftThigh:11,leftKnee:12,leftFoot:13,rightThigh:14,rightKnee:15,rightFoot:16};

  const clothing=loft(THREE,[
    [.70,0,.145,.13],[.76,0,.178,.135],[.92,0,.190,.140],
    [1.09,0,.183,.139],[1.18,0,.207,.147],[1.30,0,.288,.166],
    [1.36,0,.286,.160],[1.42,0,.245,.145],[1.47,0,.106,.090],
    [1.51,0,.083,.073]
  ],32);
  assignWeights(THREE,clothing,(x,y)=>y<1.08?ringWeight(y,.88,1.19,W.hips,W.spine):
    ringWeight(y,1.08,1.36,W.spine,W.chest));
  const faceGeo=loft(THREE,[
    [1.51,0,.075,.073],[1.56,0,.079,.080],
    [1.60,0,.104,.091],[1.66,0,.111,.096],
    [1.71,0,.113,.094],[1.76,0,.108,.093],
    [1.805,0,.090,.075],[1.83,0,.030,.032]
  ],32);
  assignWeights(THREE,faceGeo,(_,y)=>ringWeight(y,1.52,1.63,W.neck,W.head));

  const weighted=[{geo:clothing,material:coat,name:'Human fitted coat torso'},
    {geo:faceGeo,material:skin,name:'Animated human face and neck'}];
  const sleeveRings=side=>[
    [1.36,side*.277,.071,.082],[1.29,side*.322,.088,.088],
    [1.18,side*.397,.078,.076],[1.07,side*.444,.071,.069],
    [.98,side*.444,.060,.061],[.89,side*.418,.052,.051],
    [.81,side*.396,.037,.038]
  ];
  for(const side of [-1,1]){
    const left=side<0;
    const upper=left?W.leftUpper:W.rightUpper;
    const elbow=left?W.leftElbow:W.rightElbow;
    const wrist=left?W.leftHand:W.rightHand;
    const geo=loft(THREE,sleeveRings(side),16);
    assignWeights(THREE,geo,(_,y)=>{
      if(y>=1.14)return [[upper,1]];
      if(y<=.87)return [[wrist,1]];
      return ringWeight(y,.87,1.14,elbow,upper);
    });
    weighted.push({geo,material:coat,name:(left?'Left':'Right')+' rigged coat sleeve'});
    const leg=loft(THREE,[
      [.085,side*.14,.094,.109],[.15,side*.14,.090,.106],
      [.32,side*.14,.100,.110],[.48,side*.14,.118,.118],
      [.66,side*.14,.119,.120],[.82,side*.13,.125,.125],
      [.91,side*.13,.130,.132]
    ],20);
    const thigh=left?W.leftThigh:W.rightThigh,knee=left?W.leftKnee:W.rightKnee,
      foot=left?W.leftFoot:W.rightFoot;
    assignWeights(THREE,leg,(_,y)=>y<=.25?ringWeight(y,.13,.37,foot,knee):
      ringWeight(y,.39,.64,knee,thigh));
    weighted.push({geo:leg,material:trousers,name:(left?'Left':'Right')+' separate trouser leg'});
    // Human hands, visibly attached to wrists rather than detached balls.
    const hand=loft(THREE,[
      [.72,side*.39,.039,.030],[.76,side*.391,.041,.032],[.82,side*.398,.036,.033]
    ],12);
    assignWeights(THREE,hand,()=>[[wrist,1]]);
    weighted.push({geo:hand,material:skin,name:(left?'Left':'Right')+' rigged hand'});
  }
  const built=[];
  group.updateMatrixWorld(true);
  const skeleton=new THREE.Skeleton(bones);
  for(const item of weighted){
    const skinned=new THREE.SkinnedMesh(item.geo,item.material);
    skinned.name=item.name;
    skinned.frustumCulled=false;
    group.add(skinned);
    skinned.bind(skeleton);
    built.push(skinned);
  }
  // Plain broad-brim, dark farmer's hat. As a child of the Head bone it turns
  // with the face. Keep shape solid and unbillowing.
  attachMesh(THREE,head,new THREE.CylinderGeometry(.292,.292,.018,28),black,
    'Wide brim plain farmer hat',0,.193,.008);
  attachMesh(THREE,head,new THREE.CylinderGeometry(.151,.165,.145,24),black,
    'Hat crown',0,.270,.004);
  attachMesh(THREE,head,new THREE.CylinderGeometry(.165,.166,.019,24),coat,
    'Plain hat band',0,.206,.004);
  // The Amish-inspired beard is long but close to the chin: no flowing tendrils.
  attachMesh(THREE,head,new THREE.ConeGeometry(.099,.153,18),beard,
    'Short full chin beard',0,-.095,.050).rotation.x=Math.PI;
  // Nose and sunken eyes stay anchored to the rotating head bone.
  attachMesh(THREE,head,new THREE.SphereGeometry(.026,10,8),skin,'Nose',0,-.009,.108)
    .scale.set(.70,1.35,1);
  for(const side of [-1,1]){
    attachMesh(THREE,head,new THREE.SphereGeometry(.021,10,8),beard,
      'Shadowed eye socket '+side,side*.050,.036,.089).scale.set(1.15,.53,.30);
    const wrist=side<0?leftWrist:rightWrist;
    for(let i=0;i<4;i++){
      const x=side*.010+(i-1.5)*.016;
      attachMesh(THREE,wrist,new THREE.CapsuleGeometry(.007,.051,3,6),skin,
        'Finger '+side+'-'+i,x,-.076,.018);
    }
    attachMesh(THREE,wrist,new THREE.CapsuleGeometry(.010,.031,3,6),skin,
      'Thumb '+side,side*.041,-.018,.025).rotation.z=side*.56;
    const ankle=side<0?leftAnkle:rightAnkle;
    attachMesh(THREE,ankle,new THREE.BoxGeometry(.174,.105,.235),black,
      'Plain boot '+side,0,-.012,.043);
  }
  // Narrow unadorned shirt collar and coat front (not a billowing robe).
  attachMesh(THREE,chest,new THREE.BoxGeometry(.088,.110,.022),shirt,
    'Plain work shirt at collar',0,.086,.157);
  for(const side of [-1,1]){
    attachMesh(THREE,chest,new THREE.BoxGeometry(.020,.29,.020),black,
      'Plain suspender '+side,side*.119,-.080,.149).rotation.z=-side*.045;
  }

  const headPoint=new THREE.Vector3(),localPlayer=new THREE.Vector3();
  const damp=(current,target,dt,speed)=>current+(target-current)*(1-Math.exp(-speed*Math.max(0,dt)));
  let headTarget=0,headPitch=0;
  function lookAtPlayer(player,distance,dt){
    if(player&&distance<HEAD_TURN_DISTANCE){
      group.updateWorldMatrix(true,true);
      // Player is transformed into torso-space; head yaw is independent of body yaw.
      localPlayer.copy(player);
      group.worldToLocal(localPlayer);
      head.getWorldPosition(headPoint);group.worldToLocal(headPoint);
      const rel=localPlayer.sub(headPoint);
      headTarget=Math.max(-1.05,Math.min(1.05,Math.atan2(rel.x,rel.z)));
      headPitch=Math.max(-.19,Math.min(.19,-Math.atan2(rel.y,Math.hypot(rel.x,rel.z))));
    }else{headTarget=0;headPitch=0;}
    head.rotation.y=damp(head.rotation.y,headTarget,dt,1.8);
    head.rotation.x=damp(head.rotation.x,headPitch,dt,1.3);
    neck.rotation.y=damp(neck.rotation.y,headTarget*.20,dt,1.25);
  }
  function update(t,fade=1,ground=0,options={}){
    const delta=options.dt??1/60;
    const move=options.moving??false;
    const visibility=Math.max(0,Math.min(1,fade));
    for(const mat of materials){
      const state=mat.userData.ghostState;
      state.fade=visibility;state.ground=ground;
      if(mat.userData.shader){
        mat.userData.shader.uniforms.uFarmerFade.value=visibility;
        mat.userData.shader.uniforms.uFarmerGround.value=ground;
      }
    }
    hips.rotation.z=.006*Math.sin(t*.43);
    chest.rotation.x=.006*Math.sin(t*.69);
    leftShoulder.rotation.x=.013*Math.sin(t*.58);
    rightShoulder.rotation.x=.012*Math.sin(t*.48+1.4);
    leftElbow.rotation.x=.015+.014*Math.sin(t*.50);
    rightElbow.rotation.x=.012+.012*Math.sin(t*.48+.6);
    leftHip.rotation.x=move?-.014:.002;
    rightHip.rotation.x=move?.014:-.002;
    lookAtPlayer(options.player||null,options.distance??Infinity,delta);
    return {headYaw:head.rotation.y,headPitch:head.rotation.x};
  }
  update(0,0,0);
  return {group,skeleton,bones,head,neck,hips,meshes:built,materials,update,
    get headYaw(){return head.rotation.y;},
    get headTargetYaw(){return headTarget;},
    metadata:{source:'rigged-procedural-human',rigged:true,headIndependent:true,
      separateLegs:2,patrolCapable:true,limbBones:bones.length,bodyMeshCount:built.length}};
}
