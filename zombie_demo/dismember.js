import * as THREE from 'three';

const joints=['LeftArm','RightArm','LeftForeArm','RightForeArm','LeftUpLeg','RightUpLeg','LeftLeg','RightLeg'];
const labels={LeftArm:'left arm at the shoulder',RightArm:'right arm at the shoulder',LeftForeArm:'left forearm at the elbow',RightForeArm:'right forearm at the elbow',LeftUpLeg:'left leg at the hip',RightUpLeg:'right leg at the hip',LeftLeg:'left lower leg at the knee',RightLeg:'right lower leg at the knee'};
export class Dismemberment {
 constructor(model,pivot,scene){this.model=model;this.pivot=pivot;this.scene=scene;this.sources=[];this.pieces=[];this.removed=new Set();model.traverse(mesh=>{if(mesh.isSkinnedMesh){const geometry=mesh.geometry;this.sources.push({mesh,geometry,index:geometry.index?.clone()??null,remaining:geometry.index?Array.from(geometry.index.array):Array.from({length:geometry.attributes.position.count},(_,i)=>i)});mesh.geometry=geometry.clone();}});}
 available(){return joints.filter(name=>{const b=this.model.getObjectByName(name);for(let p=b;p;p=p.parent)if(this.removed.has(p.name))return false;return true;});}
 detach(name){
  if(!this.available().includes(name))return null;
  const joint=this.model.getObjectByName(name),descendants=new Set();joint.traverse(b=>descendants.add(b.name));
  const chunk=new THREE.Group();const origin=joint.getWorldPosition(new THREE.Vector3());chunk.position.copy(origin);let triangles=0;
  this.model.updateMatrixWorld(true);
  for(const source of this.sources){
   const {mesh}=source;mesh.skeleton.update();const a=mesh.geometry.attributes;const taken=[],keep=[];
   const coverage=i=>{let w=0;for(let k=0;k<4;k++){const index=a.skinIndex.getComponent(i,k);if(descendants.has(mesh.skeleton.bones[index]?.name))w+=a.skinWeight.getComponent(i,k);}return w;};
   for(let i=0;i<source.remaining.length;i+=3){const tri=source.remaining.slice(i,i+3);((coverage(tri[0])+coverage(tri[1])+coverage(tri[2]))/3>=.5?taken:keep).push(...tri);}
   if(!taken.length)continue;
   source.remaining=keep;mesh.geometry.setIndex(keep);const positions=[],uv=[],colors=[];
   for(const i of taken){const p=mesh.getVertexPosition(i,new THREE.Vector3()).applyMatrix4(mesh.matrixWorld).sub(origin);positions.push(...p.toArray());if(a.uv)uv.push(a.uv.getX(i),a.uv.getY(i));if(a.color)colors.push(a.color.getX(i),a.color.getY(i),a.color.getZ(i));}
   const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));if(uv.length)geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));if(colors.length)geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.computeVertexNormals();geo.computeBoundingBox();chunk.add(new THREE.Mesh(geo,mesh.material));triangles+=taken.length/3;
  }
  if(!triangles)return null;
  this.removed.add(name);this.scene.add(chunk);const side=name.startsWith('Left')?1:-1;
  const velocity=new THREE.Vector3(side*.2,.1,.24).applyQuaternion(this.pivot.getWorldQuaternion(new THREE.Quaternion()));const piece={object:chunk,velocity,spin:new THREE.Vector3(.8,side*.6,.5),age:0,settled:false,name,leg:name.includes('Leg'),label:labels[name]};this.pieces.push(piece);return piece;
 }
 random(){const options=this.available();if(!options.length)return null;return this.detach(options[Math.floor(Math.random()*options.length)]);}
 update(dt){for(const p of this.pieces){p.age+=dt;if(p.settled)continue;p.velocity.y-=3*dt;p.object.position.addScaledVector(p.velocity,dt);p.object.rotation.x+=p.spin.x*dt;p.object.rotation.y+=p.spin.y*dt;p.object.rotation.z+=p.spin.z*dt;const box=new THREE.Box3().setFromObject(p.object);if(box.min.y<0){p.object.position.y-=box.min.y;if(p.velocity.y<-.15&&p.age<1.5){p.velocity.y*=-.18;p.velocity.x*=.5;p.velocity.z*=.5;p.spin.multiplyScalar(.35);}else{p.velocity.set(0,0,0);p.spin.set(0,0,0);p.settled=true;}}}}
 target(piece){return new THREE.Box3().setFromObject(piece.object).getCenter(new THREE.Vector3());}
 groundBody(){this.model.updateMatrixWorld(true);let minY=Infinity;for(const {mesh,remaining} of this.sources){mesh.skeleton.update();for(const i of new Set(remaining))minY=Math.min(minY,mesh.getVertexPosition(i,new THREE.Vector3()).applyMatrix4(mesh.matrixWorld).y);}if(Number.isFinite(minY))this.pivot.position.y-=minY;}
 reset(){for(const p of this.pieces){this.scene.remove(p.object);p.object.traverse(n=>n.geometry?.dispose());}this.pieces=[];this.removed.clear();for(const s of this.sources){s.mesh.geometry.dispose();s.mesh.geometry=s.geometry.clone();s.remaining=s.index?Array.from(s.index.array):Array.from({length:s.geometry.attributes.position.count},(_,i)=>i);}this.pivot.rotation.x=0;this.pivot.rotation.z=0;this.pivot.position.y=0;}
}

export class LossReaction {
 constructor(motion,parts,selectMode,onStatus){this.motion=motion;this.parts=parts;this.selectMode=selectMode;this.onStatus=onStatus;this.state='ready';this.age=0;}
 start(piece,resume){if(!piece)return;this.piece=piece;this.resume=resume==='jump'?'idle':resume;this.age=0;this.state='looking';this.selectMode('idle');this.onStatus('Looking down at the fallen '+piece.label+'…');}
 get busy(){return this.state!=='ready';}
 update(dt){
  if(this.state==='ready')return false;this.age+=dt;const {motion,parts,piece}=this;
  // Idle updates only the pose. Physics and rendering continue independently.
  if(this.state!=='fallen'){
   motion.update(dt);const lean=THREE.MathUtils.smoothstep(this.age,.15,.9);const target=parts.target(piece);const head=motion.bones.Head.getWorldPosition(new THREE.Vector3());const delta=target.sub(head).applyQuaternion(parts.pivot.getWorldQuaternion(new THREE.Quaternion()).invert());
   const turn=THREE.MathUtils.clamp(Math.atan2(delta.x,Math.max(.1,delta.z)),-.45,.45)*lean;
   const down=THREE.MathUtils.clamp(Math.atan2(-delta.y,Math.hypot(delta.x,delta.z)),0,1.20)*lean;
   motion.tilt('Chest',down*.25,turn*.25,0);motion.tilt('Neck',down*.28,turn*.35,0);motion.tilt('Head',down*.47,turn*.40,0);
  }
  if(this.state==='looking'&&this.age>=3.4){if(piece.leg){this.state='falling';this.age=0;this.onStatus('Lost a leg — toppling over.');}else{this.state='ready';this.selectMode(this.resume);this.onStatus('Arm lost. Movement resumed.');}}
  if(this.state==='falling'){const f=THREE.MathUtils.smoothstep(this.age,0,1.1);parts.pivot.rotation.z=(piece.name.startsWith('Left')?-1:1)*f*Math.PI/2;parts.groundBody();if(this.age>=1.1){this.state='fallen';this.onStatus('Fallen. Press Reassemble to stand up and restore the limbs.');}}
  return true;
 }
 reset(){this.state='ready';this.age=0;this.parts.reset();this.selectMode('idle');this.onStatus('Reassembled.');}
}
