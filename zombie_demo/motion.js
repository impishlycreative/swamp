import * as THREE from 'three';

// Drive the actual skeleton; the viewer's pivot and model never translate.
export class ZombieMotion {
 constructor(model,pivot){
  this.model=model;this.pivot=pivot;this.mode='idle';this.time=0;this.blend=1;this.rest=new Map();this.bones={};
  model.updateMatrixWorld(true);
  model.traverse(b=>{if(b.isBone){this.bones[b.name]=b;this.rest.set(b,{q:b.quaternion.clone(),p:b.position.clone()});}});
  this.hips=this.bones.Hips;this.legs={};
  for(const side of ['Left','Right']){
   const hip=this.bones[side+'UpLeg'],knee=this.bones[side+'Leg'],foot=this.bones[side+'Foot'];
   const a=hip.getWorldPosition(new THREE.Vector3()),b=knee.getWorldPosition(new THREE.Vector3()),c=foot.getWorldPosition(new THREE.Vector3());
   this.legs[side]={hip,knee,foot,a:a.distanceTo(b),b:b.distanceTo(c),anchor:pivot.worldToLocal(c.clone())};
  }
  this.height=new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3()).y;
 }
 setMode(mode){if(!['idle','run','walk','shamble','chicken','robot'].includes(mode))throw Error('Unknown motion '+mode);this.mode=mode;this.time=0;this.blend=0;this.from=new Map();for(const b of this.rest.keys())this.from.set(b,b.quaternion.clone());this.fromHips=this.hips.position.clone();}
 axis(v){return new THREE.Vector3(...v).applyQuaternion(this.pivot.getWorldQuaternion(new THREE.Quaternion()));}
 aim(name,child,direction){
  const b=this.bones[name],end=this.bones[child];if(!b||!end)return;
  this.model.updateMatrixWorld(true);
  const current=end.getWorldPosition(new THREE.Vector3()).sub(b.getWorldPosition(new THREE.Vector3())).normalize();
  const q=b.getWorldQuaternion(new THREE.Quaternion());q.premultiply(new THREE.Quaternion().setFromUnitVectors(current,this.axis(direction).normalize()));
  b.quaternion.copy(b.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(q));
 }
 tilt(name,x,y,z){const b=this.bones[name];if(!b)return;const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(x,y,z));const parent=b.parent.getWorldQuaternion(new THREE.Quaternion());const w=b.getWorldQuaternion(new THREE.Quaternion());const frame=this.pivot.getWorldQuaternion(new THREE.Quaternion());q.premultiply(frame).multiply(frame.clone().invert());b.quaternion.copy(parent.invert().multiply(q.multiply(w)));this.model.updateMatrixWorld(true);}
 leg(side,z,lift){
  const l=this.legs[side];this.model.updateMatrixWorld(true);
  const h=l.hip.getWorldPosition(new THREE.Vector3());const target=this.pivot.localToWorld(l.anchor.clone().add(new THREE.Vector3(0,lift,z)));
  const d=target.clone().sub(h);const distance=THREE.MathUtils.clamp(d.length(),Math.abs(l.a-l.b)+.001,l.a+l.b-.001);d.normalize();
  // Knee bends forward, with the ankle target kept at its initial floor height.
  const forward=this.axis([0,0,1]);const bend=forward.addScaledVector(d,-forward.dot(d)).normalize();
  const along=(l.a*l.a+distance*distance-l.b*l.b)/(2*distance);const offset=Math.sqrt(Math.max(0,l.a*l.a-along*along));
  const knee=h.clone().addScaledVector(d,along).addScaledVector(bend,offset);
  const hipDir=knee.clone().sub(h).applyQuaternion(this.pivot.getWorldQuaternion(new THREE.Quaternion()).invert());this.aim(side+'UpLeg',side+'Leg',hipDir.toArray());
  this.model.updateMatrixWorld(true);const k=l.knee.getWorldPosition(new THREE.Vector3());const kneeDir=target.clone().sub(k).applyQuaternion(this.pivot.getWorldQuaternion(new THREE.Quaternion()).invert());this.aim(side+'Leg',side+'Foot',kneeDir.toArray());
  this.aim(side+'Foot',side+'Toes',[0,-.15,1]);
 }
 update(dt){
  this.time+=dt;const t=this.time,mode=this.mode;
  for(const [b,r] of this.rest){b.quaternion.copy(r.q);b.position.copy(r.p);}this.model.updateMatrixWorld(true);
  const run=mode==='run',walk=mode==='walk',shamble=mode==='shamble',chicken=mode==='chicken',robot=mode==='robot';
  const rate=run?2.5:walk?1.2:shamble?.55:chicken?1.8:robot?.8:.4;const phase=t*rate*Math.PI*2;const s=Math.sin(phase),c=Math.cos(phase);
  const root=this.rest.get(this.hips).p;const parentScale=this.hips.parent.getWorldScale(new THREE.Vector3()).y;
  this.hips.position.y=root.y+(run?.025*Math.abs(c):walk?.012*Math.abs(c):shamble?-.025+.008*c:chicken?.018*Math.abs(s):0)/parentScale;
  if(shamble){this.tilt('Chest',.12,0,.04*s);this.tilt('Neck',.06,0,.12);this.tilt('Head',.04,0,.18);}
  else if(run)this.tilt('Chest',.10,0,.025*s);
  else if(robot)this.tilt('Chest',0,Math.round(s*2)/2*.16,0);
  if(run||walk||shamble){
   const stride=run?.23:walk?.13:.09;
   const dragPhase=Math.sin(phase+Math.PI+.55);
   this.leg('Left',stride*s,(run?.12:walk?.055:.035)*Math.max(0,c));
   // Right foot trails with almost no clearance in the shamble.
   this.leg('Right',shamble?-.035+.045*dragPhase:-stride*s,shamble?.003*Math.max(0,Math.cos(phase+Math.PI+.55)):(run?.12:.055)*Math.max(0,-c));
  }else{this.leg('Left',0,chicken?.025*Math.max(0,s):0);this.leg('Right',0,chicken?.025*Math.max(0,-s):0);}
  for(const [side,sign] of [['Left',1],['Right',-1]]){
   if(shamble){this.aim(side+'Arm',side+'ForeArm',[sign*.18,-.16+.035*s,1]);this.aim(side+'ForeArm',side+'Hand',[sign*.07,.02,1]);this.tilt(side+'Hand',.18,0,0);}
   else if(chicken){const flap=.25+.4*(.5+.5*s);this.aim(side+'Arm',side+'ForeArm',[sign,-flap,.05]);this.aim(side+'ForeArm',side+'Hand',[-sign*.8,.15,.2]);this.tilt('Head',.025*c,0,0);}
   else if(robot){const step=Math.floor(t*4)%4;const a=[.1,.85,.85,.1][(step+(sign<0?2:0))%4];this.aim(side+'Arm',side+'ForeArm',[sign*.75,-a,.25]);this.aim(side+'ForeArm',side+'Hand',[0,step%2?1:-1,.04]);}
   else{const swing=(run?.65:walk?.32:.025)*s*sign;this.aim(side+'Arm',side+'ForeArm',[sign*.12,-1,swing]);this.aim(side+'ForeArm',side+'Hand',[0,run?-.12:-.8,run?.9:.35+swing]);}
  }
  if(this.blend<1&&this.from){this.blend=Math.min(1,this.blend+dt/.25);const w=this.blend*this.blend*(3-2*this.blend);for(const b of this.rest.keys())b.quaternion.slerpQuaternions(this.from.get(b),b.quaternion.clone(),w);this.hips.position.lerpVectors(this.fromHips,this.hips.position.clone(),w);}
  this.model.updateMatrixWorld(true);
 }
}
