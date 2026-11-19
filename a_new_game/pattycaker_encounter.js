import {makePattycaker} from './pattycaker.js?v=0.6.0';

// Live town-limits encounter: discover, cover face, follow, close-range pause.
// All geometry and clapping are procedural; no third-party character assets.
export function createPattycakerEncounter(THREE,scene,camera,townEdge,popup,audio,groundMeshes=[]) {
  const patty=makePattycaker(THREE,{groundMeshes}),group=patty.group;
  const facing=new THREE.Object3D();
  scene.add(group);
  let phase='waiting',age=0,nextClap=.5;
  const clamp=THREE.MathUtils.clamp;
  function show(started=false,test=false) {
    if(!started || (phase!=='waiting'&&phase!=='gone'&&!test))return false;
    phase='cover';age=0;nextClap=.35;group.visible=true;patty.reset();
    group.position.set(test?camera.position.x:0,0,
      test?Math.max(townEdge+6,camera.position.z-13):townEdge+5.5);
    group.lookAt(camera.position.x,group.position.y,camera.position.z);
    popup(test?'Pattycaker covers her face. Watch her hands.':'A many-armed figure waits at the town limits.');
    return true;
  }
  function clap(){
    const {ctx,soundEnabled,noiseBuffer,master}=audio();
    if(!ctx||!soundEnabled||!noiseBuffer||!master)return;
    const time=ctx.currentTime,src=ctx.createBufferSource();
    src.buffer=noiseBuffer;
    const band=ctx.createBiquadFilter();band.type='bandpass';
    band.frequency.value=1100;band.Q.value=.7;
    const gain=ctx.createGain(),pan=ctx.createStereoPanner();
    const dx=group.position.x-camera.position.x;
    const distance=Math.hypot(dx,group.position.z-camera.position.z);
    pan.pan.value=clamp(dx/12,-.85,.85);
    gain.gain.setValueAtTime(.0001,time);
    gain.gain.linearRampToValueAtTime(.12*Math.min(1,12/Math.max(2,distance)),time+.012);
    gain.gain.exponentialRampToValueAtTime(.0001,time+.135);
    src.connect(band).connect(gain).connect(pan).connect(master);
    src.start(time,Math.random()*.4);src.stop(time+.145);
  }
  function tick(dt,t,started){
    if(!started)return;
    if(phase==='waiting'&&camera.position.z<=townEdge+43)show(true);
    if(phase==='waiting'||phase==='gone')return;
    age+=dt;
    if(phase==='cover'&&age>=2.8){phase='rise';age=0;}
    if(phase==='rise'&&age>=1.6){phase='stalk';age=0;}
    const dx=camera.position.x-group.position.x,dz=camera.position.z-group.position.z;
    const distance=Math.hypot(dx,dz);
    if(phase==='stalk'&&age>4&&distance>17){phase='pursuit';age=0;}
    if(phase==='pursuit'&&distance<9){phase='stalk';age=0;}
    if(phase==='stalk'||phase==='pursuit'){
      if(distance>2.6){
        const step=Math.min((phase==='pursuit'?2.7:1.6)*dt,distance-2.6);
        group.position.x+=dx/distance*step;
        group.position.z+=dz/distance*step;
      }else{
        phase='linger';age=0;
        popup('Pattycaker has reached you. Her hands go silent.');
      }
      nextClap-=dt;
      if(nextClap<=0&&distance<27){clap();nextClap=phase==='pursuit'?.24+Math.random()*.34:.45+Math.random()*.50;}
    }
    // IK must be evaluated AFTER both the root translation and facing update.
    // Otherwise planted hand-feet lag behind a rotating/sliding body.
    facing.position.copy(group.position);
    facing.lookAt(camera.position.x,group.position.y,camera.position.z);
    group.quaternion.slerp(facing.quaternion,Math.min(1,dt*4.6));
    patty.animate(t,phase,dt,camera.position,age);
    if(phase==='linger'&&age>5){phase='gone';group.visible=false;}
  }
  return {show,tick,get phase(){return phase;}};
}
