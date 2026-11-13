(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.MindMapV3Domain=api;
})(typeof window!=='undefined'?window:null,function(){
  'use strict';
  const MAX_CONTEXT_NODES=160;
  const QUESTIONS=Object.freeze({
    discover:'What would you like to brainstorm?',
    continue:'What would you like to explore next about this idea?',
    clarify:'What would you like to clarify about this idea?',
    detail:'What details would you like to establish here?',
    connect:'How does this relate to what you have already established?',
    review:'What would you like to review about this idea?',
    direction:'Which part would you like to explore next?'
  });
  const allowedCodes=Object.keys(QUESTIONS);
  function cleanText(value,max=500){return typeof value==='string'?value.trim().slice(0,max):'';}
  function validQuestion(text){
    const s=cleanText(text,240);
    if(!s||s.split('?').length!==2||!s.endsWith('?'))return null;
    if(/[\r\n]/.test(s)||/\b(for example|such as|imagine|what if|you could|you should|suppose|let's|perhaps you)\b/i.test(s))return null;
    return s;
  }
  function chooseQuestion(result,strict){
    if(strict)return QUESTIONS[allowedCodes.includes(result?.questionType)?result.questionType:'continue'];
    return validQuestion(result?.nextQuestion)||
      QUESTIONS[allowedCodes.includes(result?.questionType)?result.questionType:'continue'];
  }
  function branchPath(map,id){
    const list=[],seen=new Set();
    let node=map?.nodes?.[id],guard=0;
    while(node&&!seen.has(node.id)&&guard++<80){
      seen.add(node.id);list.unshift({id:node.id,text:cleanText(node.text),source:node.writer?.source||'unclassified'});
      node=node.parentId?map.nodes[node.parentId]:null;
    }
    return list;
  }
  function snapshot(map,guidance,latestAnswer='',createdNodeId=''){
    if(!map?.nodes||!map.nodes[map.rootId])throw Error('Invalid mind map');
    const focus=map.nodes[guidance?.focusNodeId]?guidance.focusNodeId:map.rootId;
    const nodes=Object.values(map.nodes).slice(0,MAX_CONTEXT_NODES).map(n=>({
      id:n.id,parentId:n.parentId||null,text:cleanText(n.text),
      description:cleanText(n.description,450),source:n.writer?.source||'unclassified',
      type:n.writer?.type||'general',approved:!!n.writer?.approved
    }));
    const turns=(guidance?.turns||[]).slice(-20).map(t=>({
      question:cleanText(t.question,240),answer:cleanText(t.answer,1500),
      nodeId:t.nodeId,source:'user'
    }));
    const flags=(guidance?.flags||[]).filter(f=>!f.resolved).slice(-25)
      .map(f=>({nodeId:f.nodeId,reason:cleanText(f.message,180),source:f.source||'author'}));
    const data={
      mapId:map.id,purpose:cleanText(map.nodes[map.rootId].text),
      activeBranch:branchPath(map,focus),strict:guidance?.strict!==false,
      establishedUserStatements:turns.map(t=>({nodeId:t.nodeId,text:t.answer})),
      existingNodes:nodes,reviewFlags:flags,
      lastAnswer:cleanText(latestAnswer,1500),latestNodeId:createdNodeId||null
    };
    return data;
  }
  function validSuggestions(result,map,createdNodeId){
    if(!result||typeof result!=='object'||!map?.nodes)return {flags:[],links:[],questionType:'continue',nextQuestion:null};
    const flags=[];
    for(const f of Array.isArray(result.flags)?result.flags.slice(0,4):[]){
      const id=typeof f?.nodeId==='string'?f.nodeId:createdNodeId;
      if(!map.nodes[id])continue;
      const reason=cleanText(f.reason,230);
      if(reason&&!flags.some(v=>v.nodeId===id&&v.reason===reason))
        flags.push({nodeId:id,reason,source:'ai-suggestion',kind:['inconsistency','missing','unexplored','review'].includes(f.kind)?f.kind:'review'});
    }
    const links=[];
    for(const rel of Array.isArray(result.links)?result.links.slice(0,5):[]){
      if(!map.nodes[rel?.from]||!map.nodes[rel?.to]||rel.from===rel.to)continue;
      if(links.some(x=>x.from===rel.from&&x.to===rel.to))continue;
      links.push({from:rel.from,to:rel.to,reason:cleanText(rel.reason,200),status:'unconfirmed',source:'ai-suggestion'});
    }
    return{flags,links,questionType:allowedCodes.includes(result.questionType)?result.questionType:'continue',nextQuestion:validQuestion(result.nextQuestion)};
  }
  return {QUESTIONS,chooseQuestion,validQuestion,branchPath,snapshot,validSuggestions,cleanText};
});