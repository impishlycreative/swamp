// The Road — a self-contained, human-proportioned spectral figure.
// No external GLB request and no overlapping transparent primitive anatomy.
// The clothing, neck, face and cranium share one indexed loft surface. Arms are
// smoothly tapered, joint-driven sleeves; the lower silhouette dissolves away.
export const GHOST_PROFILE=[
  // height, half width, half depth, front offset
  [.09,.305,.205,0],[.14,.345,.228,0],[.22,.352,.232,0],
  [.36,.330,.220,0],[.53,.292,.195,0],[.68,.258,.185,0],
  [.82,.225,.165,0],[.98,.218,.162,0],[1.12,.255,.168,0],
  [1.24,.300,.170,0],[1.30,.312,.165,0],[1.36,.203,.125,0],
  [1.405,.100,.087,.012],[1.46,.075,.074,.010],
  [1.49,.083,.075,.010],[1.53,.095,.087,.012],
  [1.57,.111,.100,.012],[1.62,.115,.105,.015],
  [1.67,.113,.104,.015],[1.72,.108,.100,.015],
  [1.765,.094,.087,.013],[1.797,.060,.060,.010],[1.817,.007,.008,.006]
];
export const GHOST_HEIGHT=GHOST_PROFILE.at(-1)[0];

export function ghostOpacityAtHeight(y,fade=1){
  const floor=Math.max(0,Math.min(1,(y-.07)/.63));
  const lower=floor*floor*(3-2*floor);
  return Math.min(.70,Math.max(0,fade*(.20+.68*lower)));
}

function gaussian(x,sigma){return Math.exp(-(x*x)/(sigma*sigma));}
function profilePoint(y,rx,rz,offset,angle){
  const x0=Math.cos(angle)*rx,z0=Math.sin(angle)*rz+offset;
  if(y<1.40){
    const folds=.014*Math.sin(angle*9+y*3.6)+.008*Math.sin(angle*17-y*7);
    const hem=.011*Math.sin(angle*7+y*10)*Math.max(0,(.65-y)/.65);
    return [(rx+folds)*Math.cos(angle),y+hem,(rz+folds*.70)*Math.sin(angle)+offset];
  }
  let z=z0;
  if(z0>offset){
    // Eyes live in the face surface as hollows; bridge, cheeks and chin do not
    // rely on separately intersecting eyeballs/balls.
    const eye=gaussian(y-1.675,.026)*(gaussian(x0-.046,.029)+gaussian(x0+.046,.029));
    const nose=gaussian(x0,.032)*gaussian(y-1.605,.068);
    const cheek=(gaussian(x0-.080,.031)+gaussian(x0+.080,.031))*gaussian(y-1.586,.065);
    const chin=gaussian(x0,.074)*gaussian(y-1.515,.036);
    z+=.029*nose+.008*cheek+.009*chin-.010*eye;
  }
  return [x0,y,z];
}
function buildFigureGeometry(THREE){
  const sides=48,positions=[],uv=[],triangles=[],groups=[];
  const rows=GHOST_PROFILE.length;
  for(let row=0;row<rows;row++){
    const [height,rx,rz,offset]=GHOST_PROFILE[row];
    for(let j=0;j<=sides;j++){
      const a=j/sides*Math.PI*2;
      const [x,y,z]=profilePoint(height,rx,rz,offset,a);
      positions.push(x,y,z);uv.push(j/sides,height/GHOST_HEIGHT);
    }
  }
  for(let row=0;row<rows-1;row++){
    const start=triangles.length;
    for(let j=0;j<sides;j++){
      const a=row*(sides+1)+j,b=a+sides+1;
      triangles.push(a,b,a+1,a+1,b,b+1);
    }
    // Face and throat use a distinct, almost unlit skin tint, but the mesh
    // remains a continuous surface: no ghostly circular self-overdraw.
    groups.push({start,count:triangles.length-start,materialIndex:row>=11?1:0});
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  geo.setIndex(triangles);
  for(const g of groups)geo.addGroup(g.start,g.count,g.materialIndex);
  geo.computeVertexNormals();
  return {geometry:geo,base:new Float32Array(positions),sides,rows};
}
function createClothTexture(THREE){
  // Physical canvas texture: subtle woven fibres, NOT luminous white plastic.
  const c=document.createElement('canvas');c.width=c.height=128;
  const ctx=c.getContext('2d');
  const image=ctx.createImageData(128,128);
  for(let y=0;y<128;y++)for(let x=0;x<128;x++){
    const i=(y*128+x)*4;
    const fibres=12*Math.sin(x*1.9)+7*Math.sin(y*.37+x*.17);
    const grain=((x*17+y*47+(x*y)%31)%21)-10;
    const v=Math.max(0,Math.min(255,165+fibres+grain));
    image.data[i]=v;image.data[i+1]=v;image.data[i+2]=v;image.data[i+3]=255;
  }
  ctx.putImageData(image,0,0);
  const tex=new THREE.CanvasTexture(c);
  tex.colorSpace=THREE.SRGBColorSpace;
  tex.wrapS=tex.wrapT=THREE.RepeatWrapping;
  tex.repeat.set(2,4);
  tex.anisotropy=4;tex.needsUpdate=true;
  return tex;
}
function makeSpectralMaterial(THREE,colour,baseAlpha,texture=null,isFace=false){
  const material=new THREE.MeshStandardMaterial({
    color:colour,roughness:.96,metalness:0,side:THREE.FrontSide,
    emissive:0x405561,emissiveIntensity:.24,
    map:texture,transparent:true,opacity:baseAlpha,
    depthWrite:true,depthTest:true,alphaTest:.015
  });
  const controls={fade:0,time:0,ground:0,isFace:isFace?1:0};
  material.userData.ghostControls=controls;
  material.onBeforeCompile=shader=>{
    shader.uniforms.uGhostFade={value:controls.fade};
    shader.uniforms.uGhostTime={value:controls.time};
    shader.uniforms.uGhostFloor={value:controls.ground};
    shader.uniforms.uGhostFace={value:controls.isFace};
    material.userData.shader=shader;
    shader.vertexShader=shader.vertexShader.replace('#include <common>',
      '#include <common>\nvarying vec3 vSpectralWorld;\nvarying vec3 vSpectralNormal;\nvarying vec3 vSpectralLocal;');
    shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>',
      '#include <worldpos_vertex>\nvSpectralWorld=(modelMatrix*vec4(transformed,1.0)).xyz;\nvSpectralNormal=normalize(mat3(modelMatrix)*objectNormal);\nvSpectralLocal=transformed;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>',
      '#include <common>\nvarying vec3 vSpectralWorld;\nvarying vec3 vSpectralNormal;\nuniform float uGhostFade;\nuniform float uGhostTime;\nuniform float uGhostFloor;\nuniform float uGhostFace;\nvarying vec3 vSpectralLocal;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',
      '#include <opaque_fragment>\n' +
      'float lower=smoothstep(uGhostFloor+0.05,uGhostFloor+0.75,vSpectralWorld.y);\n' +
      'float fresnel=pow(1.0-clamp(abs(dot(normalize(vSpectralNormal),normalize(cameraPosition-vSpectralWorld))),0.0,1.0),2.3);\n' +
      'float breath=0.92+0.065*sin(uGhostTime*0.72+vSpectralWorld.y*4.0);\n' +
      'float interference=0.95+0.045*sin(vSpectralWorld.y*33.0+uGhostTime*0.48);\n' +
      'gl_FragColor.a*=uGhostFade*(0.17+0.83*lower)*breath*interference;\n' +
      'gl_FragColor.a=clamp(gl_FragColor.a+fresnel*0.065*uGhostFade*lower,0.0,0.70);\n' +
      // Features are shaded on the already sculpted face surface, not attached
      // glossy circular eyeballs. Visible only on the forward-facing cheeks.
      'float front=smoothstep(0.078,0.115,vSpectralLocal.z);\n' +
      'float eyeHollow=exp(-pow((abs(vSpectralLocal.x)-0.048)/0.022,2.0)-pow((vSpectralLocal.y-1.669)/0.020,2.0));\n' +
      'float mouthCrease=exp(-pow(vSpectralLocal.x/0.060,2.0)-pow((vSpectralLocal.y-1.524)/0.009,2.0));\n' +
      'gl_FragColor.rgb*=1.0-uGhostFace*front*(0.46*eyeHollow+0.27*mouthCrease);\n' +
      'gl_FragColor.rgb+=vec3(0.035,0.064,0.078)*fresnel*uGhostFade;\n' +
      'if(gl_FragColor.a<0.025) discard;\n');
  };
  material.customProgramCacheKey=()=> 'ghost-veil-v0.7';
  return material;
}
function makeSweptLimb(THREE,material,side){
  const rings=20,sides=12;
  const geo=new THREE.BufferGeometry();
  const points=new Float32Array((rings+1)*(sides+1)*3);
  const uv=new Float32Array((rings+1)*(sides+1)*2);
  const ids=[];
  for(let i=0;i<=rings;i++)for(let j=0;j<=sides;j++){
    const idx=i*(sides+1)+j;uv[idx*2]=j/sides;uv[idx*2+1]=i/rings;
  }
  for(let i=0;i<rings;i++)for(let j=0;j<sides;j++){
    const a=i*(sides+1)+j,b=a+sides+1;
    ids.push(a,a+1,b,a+1,b+1,b);
  }
  geo.setAttribute('position',new THREE.BufferAttribute(points,3));
  geo.setAttribute('uv',new THREE.BufferAttribute(uv,2));
  geo.setIndex(ids);
  const mesh=new THREE.Mesh(geo,material);mesh.castShadow=false;mesh.frustumCulled=false;
  function update(t){
    const elbowShift=Math.sin(t*.64+(side>0?1:0))*0.024;
    const wristShift=Math.sin(t*.71+(side>0?2:0))*0.037;
    // Four anatomical pivots with believable elbow and wrist placement.
    const knots=[
      new THREE.Vector3(side*.285,1.285,.003),
      new THREE.Vector3(side*(.388+elbowShift),1.068,.025),
      new THREE.Vector3(side*(.406+wristShift),.829,.075),
      new THREE.Vector3(side*(.404+wristShift),.728,.086)
    ];
    const curve=new THREE.CatmullRomCurve3(knots,false,'centripetal');
    const up=new THREE.Vector3(0,0,1),normal=new THREE.Vector3(),binormal=new THREE.Vector3();
    for(let i=0;i<=rings;i++){
      const u=i/rings,center=curve.getPoint(u),tangent=curve.getTangent(u).normalize();
      normal.crossVectors(tangent,up).normalize();
      binormal.crossVectors(tangent,normal).normalize();
      const radius=u<.33?.106-(u/.33)*.025:
        u<.72?.081-((u-.33)/.39)*.028:.053-((u-.72)/.28)*.013;
      for(let j=0;j<=sides;j++){
        const a=j/sides*Math.PI*2,k=(i*(sides+1)+j)*3;
        const fold=1+.043*Math.sin(a*5+i*.83);
        const v=center.clone().addScaledVector(normal,Math.cos(a)*radius*fold)
          .addScaledVector(binormal,Math.sin(a)*radius*.87*fold);
        points[k]=v.x;points[k+1]=v.y;points[k+2]=v.z;
      }
    }
    geo.attributes.position.needsUpdate=true;
    geo.computeVertexNormals();
    return knots[3];
  }
  return {mesh,update};
}
function hairRibbon(THREE,material,seed){
  const positions=[],indices=[];
  const x0=(seed%7-3)*.033,back=seed<13;
  const z0=back?-.064+Math.sin(seed*2.8)*.030:.052;
  const length=.30+(seed*7%6)*.038;
  const segments=7;
  for(let i=0;i<=segments;i++){
    const t=i/segments,y=1.777-length*t;
    const x=x0*(1+.30*t)+.017*Math.sin(seed*1.9+t*5)*t;
    const z=z0+(.04+.020*Math.sin(seed))*t*(back?-1:1);
    const width=(.028-.015*t)*(1+.1*Math.sin(seed));
    positions.push(x-width/2,y,z,x+width/2,y,z+.008);
    if(i<segments){
      const k=i*2;indices.push(k,k+2,k+1,k+1,k+2,k+3);
    }
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geo.setIndex(indices);geo.computeVertexNormals();
  const mesh=new THREE.Mesh(geo,material);mesh.frustumCulled=false;
  return {mesh,seed};
}
export function createSpectralGhost(THREE){
  const group=new THREE.Group();group.name='SpectralWitness';
  group.userData.ghostVersion='0.7.0';
  const clothTex=createClothTexture(THREE);
  const cloth=makeSpectralMaterial(THREE,0x9dadb2,.70,clothTex);
  const face=makeSpectralMaterial(THREE,0xa7aca8,.59,null,true);
  const hair=makeSpectralMaterial(THREE,0x292d32,.52);
  hair.side=THREE.DoubleSide;
  const fingertip=makeSpectralMaterial(THREE,0x879299,.43);
  const ghostMaterials=[cloth,face,hair,fingertip];
  const form=buildFigureGeometry(THREE);
  const mesh=new THREE.Mesh(form.geometry,[cloth,face]);
  mesh.name='Continuous garment neck and anatomically scaled face';
  mesh.castShadow=false;mesh.receiveShadow=false;mesh.frustumCulled=false;
  group.add(mesh);
  const arms=[-1,1].map(side=>{
    const arm=makeSweptLimb(THREE,cloth,side);group.add(arm.mesh);
    const digits=[];
    for(let digit=0;digit<4;digit++){
      // Slender, tapered fingers, not spheres for knuckles or a paddle hand.
      const fingerMesh=new THREE.Mesh(new THREE.BufferGeometry(),fingertip);
      // Finger contour attaches to the same moving wrist. No sphere joints.
      const curve=new THREE.CatmullRomCurve3([
        new THREE.Vector3(0,0,0),
        new THREE.Vector3(.004,.025,-.003),
        new THREE.Vector3(.005,.057,-.001),
        new THREE.Vector3(.006,.079,.002)
      ]);
      const g=new THREE.TubeGeometry(curve,8,.0085,6,false);
      fingerMesh.geometry.dispose();fingerMesh.geometry=g;group.add(fingerMesh);
      digits.push(fingerMesh);
    }
    return {side,arm,digits};
  });
  const ribbons=[];
  for(let i=0;i<17;i++){
    const r=hairRibbon(THREE,hair,i);
    group.add(r.mesh);ribbons.push(r);
  }
  // No straight translucent line segments across the dress: those read as wireframe.
  const base=form.base,position=form.geometry.attributes.position;
  function update(t,fade=1,floor=0){
    const visibility=Math.max(0,Math.min(1,fade));
    for(const mat of ghostMaterials){
      const controls=mat.userData.ghostControls;
      controls.fade=visibility;controls.time=t;controls.ground=floor;
      const sh=mat.userData.shader;
      if(sh){
        sh.uniforms.uGhostFade.value=visibility;
        sh.uniforms.uGhostTime.value=t;
        sh.uniforms.uGhostFloor.value=floor;
      }
      // A parallel CPU-side value is intentional: headless tests can inspect
      // opacity without requiring a compiled shader.
      mat.opacity=Math.max(.015,mat.opacity);
    }
    // Controlled, low-amplitude cloth drift with a slight head-turn. Almost
    // motionless at rest; no upright mannequin bobbing or T-pose.
    for(let i=0;i<position.count;i++){
      const j=i*3,x=base[j],y=base[j+1],z=base[j+2];
      const hem=Math.max(0,1-y/.88),upper=Math.max(0,(y-.7)/1.12);
      const clothDrift=hem*(.019*Math.sin(t*.68+y*6.1+x*8)+.013*Math.sin(t*.31+x*11));
      const headYaw=upper*upper*.075*Math.sin(t*.37);
      position.setXYZ(i,
        x*Math.cos(headYaw)+z*Math.sin(headYaw)+clothDrift,
        y+hem*.007*Math.sin(t*.55+x*7),
        -x*Math.sin(headYaw)+z*Math.cos(headYaw)+.008*upper*Math.sin(t*.50));
    }
    position.needsUpdate=true;form.geometry.computeVertexNormals();
    for(const limb of arms){
      const end=limb.arm.update(t);
      for(let i=0;i<limb.digits.length;i++){
        const d=limb.digits[i];
        const offset=(i-1.5)*.022;
        d.position.set(end.x+offset,end.y-.069+Math.sin(t*.91+i)*.008,end.z+.014);
        d.rotation.z=Math.PI+(i-1.5)*.06+Math.sin(t*.74+i)*.07;
      }
    }
    for(const r of ribbons){
      r.mesh.rotation.z=.012*Math.sin(t*.58+r.seed*1.2);
      r.mesh.rotation.x=.014*Math.cos(t*.68+r.seed);
    }
  }
  update(0,0,0);
  return {group,mesh,update,materials:ghostMaterials,arms,height:GHOST_HEIGHT,
    metadata:{source:'procedural-continuous-surface',externalDependencies:0,
      headWidth:GHOST_PROFILE[17][1]*2,height:GHOST_HEIGHT,
      independentlyAnimatedArms:2,bodyMeshCount:1}};
}
