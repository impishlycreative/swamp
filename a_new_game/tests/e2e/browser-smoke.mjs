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
  try{
    await page.goto(url,{waitUntil:'domcontentloaded',timeout:40000});
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
    await page.locator('#testPatty').click();
    await page.waitForFunction(()=>document.querySelector('#alert')?.textContent?.includes('Pattycaker'),null,{timeout:7000});
    await page.waitForTimeout(1700);
    await page.screenshot({path:join(artifacts,'pattycaker-in-game.png')});
    assert.deepEqual(exceptions,[],'browser must not throw during the encounter');
    const downloadPromise=page.waitForEvent('download',{timeout:45000});
    await page.locator('#exportPatty').click();
    const download=await downloadPromise;
    assert.equal(download.suggestedFilename(),'Pattycaker-rig-v0.6.0.glb');
    const path=join(artifacts,download.suggestedFilename());
    await download.saveAs(path);
    const header=await readFile(path);
    assert.equal(header.subarray(0,4).toString(),'glTF');
    assert.ok((await stat(path)).size>50000,'GLB must contain actual geometry and skinning');
    assert.deepEqual(exceptions,[],'browser must not throw during GLB export');
  }finally{
    await browser.close();
  }
});
