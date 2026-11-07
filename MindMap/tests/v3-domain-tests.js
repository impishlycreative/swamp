'use strict';
const assert=require('assert');
const domain=require('../v3-domain.js');
const map={id:'map1',rootId:'root',nodes:{
  root:{id:'root',parentId:null,text:'My story',writer:{source:'user'}},
  hero:{id:'hero',parentId:'root',text:'The protagonist',writer:{source:'user'}},
  scene:{id:'scene',parentId:'hero',text:'Opening scene',writer:{source:'user'}},
  research:{id:'research',parentId:'root',text:'Research notes'}
}};
const situation={focusNodeId:'scene',strict:true,turns:[
  {question:'What would you like to explore?',answer:'A protagonist',nodeId:'hero'},
  {question:'What details are established?',answer:'An opening scene',nodeId:'scene'}
],flags:[]};
let checks=0;
function check(condition,message){assert(condition,message);checks++;}
check(domain.branchPath(map,'scene').map(x=>x.id).join('>')==='root>hero>scene','path correct');
check(domain.branchPath(map,'missing').length===0,'unknown path empty');
check(domain.snapshot(map,situation).strict===true,'strict state');
check(domain.snapshot(map,situation).establishedUserStatements[1].text==='An opening scene','author evidence retained');
check(domain.snapshot(map,situation).existingNodes.find(n=>n.id==='research').source==='unclassified','unclassified node not promoted to author fact');
check(domain.snapshot(map,situation).activeBranch[2].id==='scene','focused branch retained');
check(domain.chooseQuestion({questionType:'clarify',nextQuestion:'What if something magical happened?'},true)===domain.QUESTIONS.clarify,'strict AI may not invent question');
check(domain.chooseQuestion({nextQuestion:'What should we explore?'},false)==='What should we explore?','non-strict single question allowed');
for(const key of Object.keys(domain.QUESTIONS)){
  check(domain.chooseQuestion({questionType:key,nextQuestion:'Invent something?'},true)===domain.QUESTIONS[key],'approved neutral question '+key);
}
for(const bad of ['Why? Why not?','Make a guess','Imagine this?','What if we add a monster?','Could you make one, for example a queen?','',null,42,'What happens?\nWhat else?']){
  check(domain.validQuestion(bad)===null,'reject unsafe/multiple questions '+String(bad));
}
const suggestions=domain.validSuggestions({flags:[
 {nodeId:'scene',kind:'missing',reason:'Timing has not been established'},
 {nodeId:'fake',kind:'missing',reason:'HALLUCINATED'},
 {nodeId:'scene',kind:'missing',reason:'Timing has not been established'}
],links:[
 {from:'scene',to:'hero',reason:'Maybe related'},
 {from:'scene',to:'hero',reason:'duplicate'},
 {from:'scene',to:'absent',reason:'unknown'},
 {from:'hero',to:'hero',reason:'self'}
],questionType:'review',nextQuestion:'What needs attention?'},map,'scene');
check(suggestions.flags.length===1,'reject duplicate and hallucinated flags');
check(suggestions.links.length===1,'reject duplicate invalid self links');
check(suggestions.flags[0].source==='ai-suggestion','AI content remains unconfirmed');
check(suggestions.links[0].status==='unconfirmed','link remains unconfirmed');
check(suggestions.questionType==='review','question type validated');
check(map.nodes.scene.text==='Opening scene','suggestions do not mutate author text');
check(domain.validSuggestions({},map,'scene').flags.length===0,'absent suggestions');
check(domain.cleanText('  test  ',3)==='tes','trim and length bound');
check(domain.snapshot(map,situation,'x'.repeat(10000)).lastAnswer.length===1500,'context bounded');
check(domain.chooseQuestion({questionType:'unknown',nextQuestion:'Magic?'},true)===domain.QUESTIONS.continue,'unknown code falls back');
check(domain.validQuestion('What would you like to examine?')==='What would you like to examine?','single neutral question accepted');
const cyclic={id:'cyclic',rootId:'a',nodes:{a:{id:'a',text:'A',parentId:'b'},b:{id:'b',text:'B',parentId:'a'}}};
check(domain.branchPath(cyclic,'a').length===2,'cycle does not hang');
for(let i=0;i<12;i++){
 const s=domain.snapshot(map,{...situation,focusNodeId:i%2?'hero':'scene'});
 check(s.activeBranch.length===(i%2?2:3),'focus scenario '+i);
}
console.log('V3 domain / safety cases passed: '+checks);