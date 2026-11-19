import test from 'node:test';
import assert from 'node:assert/strict';
import {GHOST_PROFILE,GHOST_HEIGHT,ghostOpacityAtHeight,createSpectralGhost} from '../ghost.js';

let THREE;
try{THREE=await import('three');}catch{}

test('apparition uses plausibly adult proportions instead of an oversized mannequin head',()=>{
  assert.ok(GHOST_HEIGHT>=1.70&&GHOST_HEIGHT<2.1);
  const crown=GHOST_PROFILE.at(-1)[0];
  assert.equal(crown,GHOST_HEIGHT);
  const skull=GHOST_PROFILE.find(p=>p[0]===1.67);
  const shoulder=GHOST_PROFILE.find(p=>p[0]===1.30);
  assert.ok(skull[1]*2<.25,'head width is human-scaled');
  assert.ok(shoulder[1]*2>.55,'shoulders broader than head');
  assert.ok((skull[1]*2)/(shoulder[1]*2)<.44,'head cannot be a giant sphere');
});

test('hem vanishes smoothly while upper torso remains visible',()=>{
  const values=[.08,.30,.55,.75,1.25,1.70].map(y=>ghostOpacityAtHeight(y,.8));
  for(let i=1;i<values.length;i++)assert.ok(values[i]>=values[i-1],'hem opacity must grow monotonically');
  assert.ok(values[0]<values.at(-1)*.40);
  assert.equal(ghostOpacityAtHeight(1,0),0);
  assert.ok(ghostOpacityAtHeight(1,1)<=.7);
});

test('ghost source has no remote model request or primitive fallback',()=>{
  const source=createSpectralGhost.toString();
  assert.doesNotMatch(source,/GLTFLoader|cdn\.jsdelivr|makeFallbackPerson/);
  assert.match(source,/buildFigureGeometry/);
  assert.match(source,/makeSweptLimb/);
});

test('continuous face/clothing geometry, real sleeves and material fades build without WebGL',{
  skip:!THREE?'Install three@0.170.0 to run headless ghost geometry tests':false
},()=>{
  const previous=globalThis.document;
  globalThis.document={
    createElement(type){
      assert.equal(type,'canvas');
      return {width:128,height:128,getContext(){
        return {
          createImageData(w,h){return {data:new Uint8ClampedArray(w*h*4)};},
          putImageData(){}
        };
      }};
    }
  };
  try{
    const figure=createSpectralGhost(THREE);
    assert.equal(figure.group.userData.ghostVersion,'0.7.0');
    assert.equal(figure.metadata.externalDependencies,0);
    assert.equal(figure.metadata.bodyMeshCount,1);
    assert.equal(figure.arms.length,2);
    assert.equal(figure.mesh.geometry.groups.length,GHOST_PROFILE.length-1);
    assert.ok(figure.mesh.geometry.attributes.position.count>1000);
    const visibleParts=[];
    figure.group.traverse(o=>{
      if(o.isMesh)visibleParts.push(o);
      if(o.isMesh&&o.material){
        const mats=Array.isArray(o.material)?o.material:[o.material];
        for(const material of mats){
          assert.equal(material.transparent,true);
          assert.equal(material.depthWrite,true,'no see-through overlapping mannequin parts');
        }
      }
    });
    assert.ok(visibleParts.length<40,'limited mesh count prevents ghost primitive pile');
    figure.update(1.25,.7,.20);
    for(const mat of figure.materials)assert.equal(mat.userData.ghostControls.fade,.7);
    for(const attr of [figure.mesh.geometry.attributes.position,...figure.arms.map(a=>a.arm.mesh.geometry.attributes.position)]){
      assert.ok([...attr.array].every(Number.isFinite));
    }
  }finally{
    globalThis.document=previous;
  }
});
