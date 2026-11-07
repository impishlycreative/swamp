'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const core=require('../core-stability.js');

function project({collapsed=false,relationships=[],details=null,view={x:1,y:2,scale:1}}={}){
  const child={id:'child',text:'Child',description:'',parentId:'root',collapsed,created:'x',x:null,y:null};
  if(details)child.writer={details};
  return{version:core.VERSION,id:'p',title:'Test',created:'x',updated:'x',currentMapId:'m',sessions:{m:{version:core.VERSION,id:'m',title:'Map',created:'x',updated:'x',rootId:'root',view,nodes:{root:{id:'root',text:'Root',description:'',parentId:null,collapsed:false,created:'x',x:null,y:null},child},relationships}}};
}
const raw=p=>JSON.stringify(p);
const parsed=r=>JSON.parse(r);

(function undoOrder(){
  const h=new core.UnifiedHistory();
  const open=project({collapsed:false});
  const collapsed=project({collapsed:true});
  const expanded=project({collapsed:false});
  const linked=project({collapsed:false,relationships:[{id:'r1',from:'child',to:'root',label:'related to'}]});
  h.record(raw(open),raw(collapsed),1);
  h.record(raw(collapsed),raw(expanded),2);
  h.record(raw(expanded),raw(linked),3);
  const linkUndo=h.takeUndo(raw(linked));
  assert(linkUndo,'link should be undoable');
  assert.strictEqual(parsed(linkUndo.beforeRaw).sessions.m.nodes.child.collapsed,false,'undoing link must leave branch expanded');
  assert.strictEqual(parsed(linkUndo.beforeRaw).sessions.m.relationships.length,0,'undoing link must remove link');
  const expandUndo=h.takeUndo(linkUndo.beforeRaw);
  assert(expandUndo,'expand should still be next undo');
  assert.strictEqual(parsed(expandUndo.beforeRaw).sessions.m.nodes.child.collapsed,true,'second undo should restore collapsed branch');
})();

(function viewChangesAreNotHistory(){
  const h=new core.UnifiedHistory();
  const a=project({view:{x:0,y:0,scale:1}}),b=project({view:{x:500,y:-200,scale:.5}});
  assert.strictEqual(h.record(raw(a),raw(b),1),false,'pan/zoom must not create an undo entry');
  assert.strictEqual(h.length,0);
})();

(function textEditsCoalesce(){
  const h=new core.UnifiedHistory();
  const a=project(),b=project(),c=project();
  b.sessions.m.nodes.child.text='H';c.sessions.m.nodes.child.text='Hello';
  h.record(raw(a),raw(b),100);
  h.record(raw(b),raw(c),500);
  assert.strictEqual(h.length,1,'typing should coalesce into one undo action');
  const entry=h.takeUndo(raw(c));
  assert.strictEqual(parsed(entry.beforeRaw).sessions.m.nodes.child.text,'Child');
})();

(function groupSpacingIsUndoable(){
  const h=new core.UnifiedHistory();
  const a=project(),b=project();
  b.sessions.m.nodes.child.x=120;b.sessions.m.nodes.child.y=-40;
  h.record(raw(a),raw(b),100);
  assert.strictEqual(h.length,1,'group spacing manual positions must enter unified Undo');
  assert.strictEqual(core.inferChange(raw(a),raw(b)).label,'manual position');
})();

(function addIdeaAbsorbsImmediateWriterMetadata(){
  const h=new core.UnifiedHistory();
  const before=project();
  const added=JSON.parse(JSON.stringify(before));
  added.sessions.m.nodes.idea={id:'idea',text:'New idea',description:'',parentId:'child',collapsed:false,created:'x',x:null,y:null};
  const tagged=JSON.parse(JSON.stringify(added));
  tagged.sessions.m.nodes.idea.writer={rawBrainstorm:true,type:'general'};
  h.record(raw(before),raw(added),100);
  h.record(raw(added),raw(tagged),400);
  assert.strictEqual(h.length,1,'Rapidfire/smart-type metadata should stay in the Add Idea undo action');
  const entry=h.takeUndo(raw(tagged));
  assert(!parsed(entry.beforeRaw).sessions.m.nodes.idea,'one undo should remove the newly added idea and its derived metadata');
})();

(function consolidationRestoresRawNode(){
  const h=new core.UnifiedHistory();
  const before=project();
  before.sessions.m.nodes.idea={id:'idea',text:'Uses magic',description:'',parentId:'child',collapsed:false,created:'x',x:null,y:null,writer:{rawBrainstorm:true}};
  const after=JSON.parse(JSON.stringify(before));
  delete after.sessions.m.nodes.idea;
  after.sessions.m.nodes.child.writer={details:{abilities:[{id:'d1',text:'Uses magic',description:'',sourceNodeId:'idea'}]}};
  h.record(raw(before),raw(after),1);
  const entry=h.takeUndo(raw(after));
  const restored=parsed(entry.beforeRaw);
  assert(restored.sessions.m.nodes.idea,'undo consolidation must restore the raw idea node');
  assert(!restored.sessions.m.nodes.child.writer,'undo consolidation must restore the previous parent details');
})();

(function labelsAreUseful(){
  const a=project(),b=project({collapsed:true});
  assert.strictEqual(core.inferChange(raw(a),raw(b)).label,'collapse branch');
  const c=project({relationships:[{id:'r',from:'root',to:'child'}]});
  assert.strictEqual(core.inferChange(raw(a),raw(c)).label,'link added');
})();

function readIfExists(name){const file=path.resolve(__dirname,'..',name);return fs.existsSync(file)?fs.readFileSync(file,'utf8'):null;}

(function staticRepoChecks(){
  const index=readIfExists('index.html');
  if(index){
    assert(index.includes('core-stability.js'),'index must load centralized core stability/version code');
    assert(index.indexOf('core-stability.js')<index.indexOf('app.js'),'core stability must load before app.js');
    assert(index.includes('group-layout.js'),'group layout feature must be loaded');
    assert(index.includes('mobile-shell.js'),'mobile shell repair must be loaded');
    assert(index.includes('mobile-shell.js?build=20261107v35'),'mobile shell repair must have a fresh asset key');
    assert(index.includes('core-stability.js?build=20261107v35'),'3.3.1 core must have a fresh asset key');
    assert(index.indexOf('mobile-shell.js')>index.indexOf('group-layout.js'),'mobile shell must load after group layout so it can override desktop-only chrome on mobile');
    assert(index.includes('relationship-routing.js'),'routing-only relationship layer must be loaded');
    assert(index.includes('lens-clear-fix.js'),'Lens clear fix must be loaded');
    assert(index.includes('lens-clear-fix.js?build=20261107v35'),'desktop Lens Clear fix must have a fresh asset key');
    assert(!index.includes('relationship-integrity.js'),'old feature-specific relationship undo layer must not be loaded');
    assert.strictEqual(readIfExists('relationship-integrity.js'),null,'obsolete relationship-specific undo file must stay removed');
    assert(!/MindMap\s+\d+\.\d+\.\d+\s+V2/.test(index),'index title must not duplicate the semantic version source');
  }
  const mobileShell=readIfExists('mobile-shell.js');
  if(mobileShell){
    assert(mobileShell.includes('body #mobileToolbar{display:flex!important'),'mobile top toolbar must be forced visible in the mobile shell');
    assert(mobileShell.includes('body #mobileBottomToolbar{display:flex!important'),'mobile bottom toolbar must be forced visible in the mobile shell');
    assert(mobileShell.includes('body #writerContext{display:none!important'),'desktop floating writer bar must stay hidden on mobile');
    for(const action of ["key:'edit'","key:'rapid'","key:'lens'","key:'link'","key:'more'"])assert(mobileShell.includes(action),`mobile selected-node bar must keep ${action}`);
    assert(mobileShell.includes('clickFirst'),'mobile actions must proxy one existing writer action instead of firing multiple paths');
    assert(!mobileShell.includes("?.click()||"),'mobile action fallbacks must not double-fire because click() returns undefined');
    assert(mobileShell.includes('env(safe-area-inset-bottom)'),'mobile bottom toolbar must respect the device safe area');
    assert(mobileShell.includes('z-index:110!important'),'permanent mobile chrome must stay below modal/sheet layers');
  }
  const groupLayout=readIfExists('group-layout.js');
  if(groupLayout){
    assert(groupLayout.includes('groupSelectBtn'),'desktop must expose a mouse area-selection control');
    assert(groupLayout.includes('e.shiftKey'),'Shift-drag must remain available as a fast area-selection shortcut');
    assert(groupLayout.includes('groupSpaceBtn'),'area selection must expose a one-click Space action');
    assert(groupLayout.includes('multiSpaceBtn'),'existing desktop/mobile multi-select must also expose Space');
    assert(groupLayout.includes("id===m.rootId"),'area selection must exclude the central/root idea');
    assert(groupLayout.includes("classList.contains('writer-dim')"),'Lens-muted ideas must stay out of group layout operations');
    assert(groupLayout.includes('node.x=Math.round'),'spacing must persist normal manual map positions');
  }
  const lensFix=readIfExists('lens-clear-fix.js');
  if(lensFix){
    assert(lensFix.includes('[data-clear-lens]'),'Lens clear control must be handled');
    assert(lensFix.includes('[data-clear-all]'),'combined Lens/Thread clear control must be handled');
    assert(lensFix.includes("document.addEventListener('click'"),'Lens clear must observe rebuilt strip controls');
    assert(lensFix.includes('verifyClearAfterNativeHandler'),'Lens clear fallback must run after the writer module gets the click');
    assert(!lensFix.includes('stopImmediatePropagation()'),'Lens safety handler must not block the writer module desktop click handler');
    assert(!lensFix.includes('e.preventDefault()'),'Lens safety handler must not cancel the normal desktop Clear click');
    assert(lensFix.includes('writer.focus(source)'),'Lens clear fallback must still be able to reset stuck Lens state');
    assert(lensFix.includes('pointer-events:none!important'),'muted Lens content must remain non-interactive');
    assert(lensFix.includes("replaceChildren()"),'Lens clear must remove the thread-path overlay too');
  }
  const change=readIfExists('changelog.md');
  if(change){
    ['XMind','Obsidian','Heptabase','MindNode','Plottr','Aeon Timeline'].forEach(name=>assert(!change.includes(name),`changelog must not name other products: ${name}`));
  }
  for(const name of ['export-tools.js','word-export-linked.js']){
    const text=readIfExists(name);if(text)assert(text.includes('writer?.details')||text.includes('writer.details'),`${name} must export consolidated details`);
  }
  const consolidationFix=readIfExists('consolidation-selection-fix.js');
  if(consolidationFix)assert(consolidationFix.includes('Review Ideas'),'selected parent must expose Review Ideas');
})();

console.log('MindMap V3 preview baseline regression tests passed');
