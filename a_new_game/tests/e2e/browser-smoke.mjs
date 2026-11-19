import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,readFile,stat} from 'node:fs/promises';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

// Run against an HTTP server at repository root: python3 -m http.server 8000
const folder=join(dirname(fileURLToPath(import.meta.url)),'../..');
const artifacts=join(folder,'artifacts');
const url=process.env.ROAD_TEST_URL||'http://127.0.0.1:8000/a_new_game/';

test('live WebGL scene starts, displays Pattycaker, and exports a valid GLB header',async()=>{
  await mkdir(artifacts,{recursive:true});
  const browser=await chromium.launch({headless:true,args:[
    '--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'
  ]});
  const page=await browser.newPage({viewport:{width:1200,height:750},acceptDownloads:true});
  const exceptions=[];
  page.on('pageerror',error=>exceptions.push(error.message));
  page.on('console',msg=>{
    if(msg.type()==='error' && /WebGLProgram|shader.*error|ERROR:\\s*0:/i.test(msg.text()))
      exceptions.push('WebGL shader: '+msg.text().slice(0,1200));
  });
  try{
    await page.goto(url+(url.includes('?')?'&':'?')+'debug=1',{waitUntil:'domcontentloaded',timeout:40000});
    try{
      await page.waitForFunction(()=>!document.getElementById('loading'),null,{timeout:40000});
    }catch(error){
      const report=await page.locator('#loading').textContent();
      throw new Error('3D startup failed or timed out: '+report);
    }
    const webgl=await page.evaluate(()=>{
      const canvas=document.querySelector('#game');
      const gl=canvas.getContext('webgl2')||canvas.getContext('webgl');
      return {width:canvas.width,height:canvas.height,version:gl?.getParameter(gl.VERSION)};
    });
    assert.ok(webgl.width>100 && webgl.height>100);
    assert.ok(webgl.version?.includes('WebGL'),JSON.stringify(webgl));
    await page.locator('#begin').click();
    await page.locator('#testGhost').click();
    await page.waitForFunction(()=>document.querySelector('#alert')?.textContent?.includes('pale figure'),null,{timeout:7000});
    await page.waitForTimeout(1900);
    await page.screenshot({path:join(artifacts,'ghost-v0.7-in-game.png')});
    const ghostDebug=await page.evaluate(()=>window.__roadGhostDebug?.());
    console.log('Ghost visual diagnostic:',JSON.stringify(ghostDebug));
    assert.ok(ghostDebug?.visible&&ghostDebug?.active,'ghost must be visible and active');
    assert.ok(ghostDebug.fade>.15,'ghost opacity envelope must be active');
    assert.ok(ghostDebug.projectedCenter[2]<1,'ghost must be in front of camera');
    assert.deepEqual(exceptions,[],'ghost must render without uncaught errors or shader compilation failures');
    await page.locator('#testPatty').click();
    await page.waitForFunction(()=>document.querySelector('#alert')?.textContent?.includes('Pattycaker'),null,{timeout:7000});
    await page.waitForTimeout(1700);
    await page.screenshot({path:join(artifacts,'pattycaker-in-game.png')});
    assert.deepEqual(exceptions,[],'browser must not throw during the encounter');
    const diagnostic=page.waitForFunction(()=>{
      const msg=document.querySelector('#alert')?.textContent||'';
      if(msg.includes('export failed'))return {error:msg};
      return null;
    },null,{timeout:20000}).then(handle=>handle.jsonValue());
    const downloadPromise=page.waitForEvent('download',{timeout:20000}).then(download=>({download}));
    await page.locator('#exportPatty').click();
    const outcome=await Promise.race([diagnostic,downloadPromise]).catch(error=>{
      throw new Error('Rig export timed out. UI: '+error.message);
    });
    if(outcome.error)throw new Error(outcome.error);
    const download=outcome.download;
    assert.equal(download.suggestedFilename(),'Pattycaker-rig-v0.6.0.glb');
    const path=join(artifacts,download.suggestedFilename());
    await download.saveAs(path);
    const header=await readFile(path);
    assert.equal(header.subarray(0,4).toString(),'glTF');
    assert.ok((await stat(path)).size>50000,'GLB must contain actual geometry and skinning');
    const chunkLen=header.readUInt32LE(12);
    assert.equal(header.toString('ascii',16,20),'JSON','GLB first chunk must be JSON');
    const gltf=JSON.parse(header.subarray(20,20+chunkLen).toString('utf8'));
    assert.ok(gltf.skins?.length>=1,'export must preserve a real deformable skeleton');
    assert.equal(gltf.animations?.length,2,'export must bake idle and stalking actions');
    assert.ok(gltf.meshes?.length>0,'export must contain actual geometric meshes');
    assert.deepEqual(exceptions,[],'browser must not throw during GLB export');
  }finally{
    await browser.close();
  }
});
