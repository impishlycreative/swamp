// On-demand export of the ORIGINAL weighted mesh/skeleton and two baked animation clips.
// Three.js's exporter is deliberately lazy-loaded to keep gameplay startup lean.
import {makePattycaker} from './pattycaker.js?v=0.6.0';

function bakeClip(THREE,model,name,phase,duration,frames=30) {
  const bones=model.skeleton.bones;
  const times=[],values=bones.map(()=>[]);
  model.reset();
  for(let i=0;i<=frames;i++){
    const t=duration*i/frames;
    model.animate(t,phase,Math.min(duration/frames,1/30));
    times.push(t);
    for(let j=0;j<bones.length;j++){
      const q=bones[j].quaternion;
      values[j].push(q.x,q.y,q.z,q.w);
    }
  }
  const tracks=bones.map((bone,j)=>
    new THREE.QuaternionKeyframeTrack(bone.name+'.quaternion',times,values[j])
  );
  return new THREE.AnimationClip(name,duration,tracks);
}

export async function exportPattycakerGLB(THREE){
  const [{GLTFExporter}]=await Promise.all([
    import('three/addons/exporters/GLTFExporter.js')
  ]);
  const asset=makePattycaker(THREE),root=asset.group;
  root.visible=true;root.position.set(0,0,0);root.rotation.set(0,0,0);
  root.updateMatrixWorld(true);
  // glTFExporter expects browser images/canvases. Our procedural skin uses
  // DataTexture for WebGL, whose {data,width,height} payload drawImage rejects.
  // Convert only in this separate export instance; live game materials stay intact.
  const textureCache=new Map();
  function portableTexture(texture){
    if(!texture?.isDataTexture)return texture;
    if(textureCache.has(texture))return textureCache.get(texture);
    const {width,height,data}=texture.image;
    const canvas=document.createElement('canvas');
    canvas.width=width;canvas.height=height;
    const ctx=canvas.getContext('2d');
    const bytes=new Uint8ClampedArray(data.buffer,data.byteOffset,data.byteLength);
    ctx.putImageData(new ImageData(new Uint8ClampedArray(bytes),width,height),0,0);
    const replacement=new THREE.CanvasTexture(canvas);
    replacement.colorSpace=texture.colorSpace;
    replacement.wrapS=texture.wrapS;replacement.wrapT=texture.wrapT;
    replacement.repeat.copy(texture.repeat);
    replacement.offset.copy(texture.offset);
    replacement.needsUpdate=true;
    textureCache.set(texture,replacement);
    return replacement;
  }
  root.traverse(object=>{
    if(!object.isMesh||!object.material)return;
    const materials=Array.isArray(object.material)?object.material:[object.material];
    for(const material of materials){
      for(const key of ['map','roughnessMap','metalnessMap','normalMap','bumpMap','aoMap','emissiveMap']){
        if(material[key]?.isDataTexture)material[key]=portableTexture(material[key]);
      }
      material.needsUpdate=true;
    }
  });
  const animations=[
    bakeClip(THREE,asset,'Pattycaker_idle', 'linger',4,40),
    bakeClip(THREE,asset,'Pattycaker_stalk_in_place','stalk',1/1.55,32)
  ];
  // Reset the exported skeleton to a neutral pose; clips retain authored motion.
  asset.reset();asset.animate(0,'linger');
  root.userData.assetVersion='0.6.0';
  root.userData.exportNote='Procedural prototype: reusable rig and baked clips; animation polish and visual approval pending';
  const exporter=new GLTFExporter();
  const buffer=await new Promise((resolve,reject)=>{
    exporter.parse(root,resolve,reject,{
      binary:true,trs:true,onlyVisible:false,animations,includeCustomExtensions:false
    });
  });
  const blob=new Blob([buffer],{type:'model/gltf-binary'});
  const uri=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=uri;link.download='Pattycaker-rig-v0.6.0.glb';
  document.body.appendChild(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(uri),60000);
  return {bytes:buffer.byteLength,clips:animations.map(a=>a.name),bones:asset.skeleton.bones.length};
}
