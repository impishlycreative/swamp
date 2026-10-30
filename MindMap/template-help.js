(()=>{'use strict';

// Adds brainstorming examples and beat-help access inside linked template maps
// without duplicating the core purpose/context/percentage help in story-arc.js.
const EXAMPLES={
  'Three-Act Structure':{
    'Act I — Setup':['A normal routine that quietly reveals what the protagonist wants and what is already wrong.','A relationship or obligation that will become costly once the main conflict arrives.'],
    'Inciting Incident':['A discovery that makes continuing the old routine dangerous or impossible.','An offer, threat, loss, or arrival that creates a problem the protagonist cannot simply ignore.'],
    'First Plot Point':['A choice that burns a bridge back to the old normal.','A consequence that forces the protagonist into the main conflict even if they would rather retreat.'],
    'Act II — Confrontation':['Attempts that solve one problem while creating a harder one.','A relationship, clue, rival, or resource that changes how the protagonist approaches the struggle.'],
    'Midpoint':['A victory that exposes a larger danger or hidden cost.','A revelation that makes the protagonist reinterpret what they thought the conflict was about.'],
    'Second Plot Point':['The final missing fact, loss, decision, or tool that makes the endgame unavoidable.','A reversal that removes the protagonist’s last comfortable option and points directly at the climax.'],
    'Act III — Resolution':['Payoffs for earlier promises, clues, relationships, or sacrifices.','A sequence of final choices that resolves both the external problem and the protagonist’s internal conflict.'],
    'Climax':['A decisive choice where success requires the protagonist to act differently than they would have at the beginning.','A confrontation where earlier skills, failures, relationships, and planted information all matter.'],
    'Denouement':['A small consequence that proves the world has genuinely changed.','A final relationship beat that shows what was repaired, lost, accepted, or left unresolved.']
  },
  'Save the Cat':{
    'Opening Image':['A visual routine that exposes the protagonist’s imbalance before the plot changes anything.','A contradiction between how the protagonist appears and what their life is actually costing them.'],
    'Theme Stated':['A casual comment from another character that the protagonist dismisses but the story later proves meaningful.','A situation that raises the thematic question without stating a moral outright.'],
    'Setup':['A recurring problem that shows the protagonist’s current strategy is already failing.','A relationship, object, promise, or flaw that can later become a payoff rather than background decoration.'],
    'Catalyst':['News that instantly changes what the protagonist can safely assume.','An arrival, loss, demand, accident, or discovery that forces a response.'],
    'Debate':['A practical reason to stay put that is stronger than simple fear.','An attempted workaround that fails and makes commitment increasingly necessary.'],
    'Break into Two':['A concrete choice that puts the protagonist in the story’s main arena.','A commitment that costs something immediately, proving this is more than curiosity.'],
    'B Story':['A relationship that challenges the protagonist’s worldview instead of merely distracting from the plot.','A secondary goal whose emotional lesson becomes useful in the main conflict.'],
    'Fun and Games':['A scene that delivers the premise in a way only this story could.','A success or failure that is entertaining on its own but also changes later options.'],
    'Midpoint':['A false victory that creates a more dangerous obligation.','A false defeat or revelation that raises both the external and emotional stakes.'],
    'Bad Guys Close In':['An earlier shortcut returning as a consequence.','Pressure from an antagonist, flaw, relationship, deadline, or system that removes another easy option.'],
    'All Is Lost':['The protagonist loses the thing their current plan was built around.','A failure that proves their old belief or strategy cannot carry them through the ending.'],
    'Dark Night of the Soul':['A realization that connects the external failure to the protagonist’s internal mistake.','A quiet decision point where the protagonist identifies what must change before trying again.'],
    'Break into Three':['A new plan that combines hard-won plot information with the emotional lesson of the B Story.','A choice the beginning-version of the protagonist would not have been capable of making.'],
    'Finale':['A sequence where each step of the final plan forces a harder test or sacrifice.','A payoff that turns an earlier weakness, relationship, clue, or failure into something decisive.'],
    'Final Image':['A visual echo of the opening that makes the change obvious without explaining it.','A final ordinary action that now carries a different meaning because of what the protagonist endured.']
  },
  "Hero's Journey":{
    'Ordinary World':['A daily responsibility that reveals both competence and limitation.','A relationship that shows what the hero stands to lose by leaving the familiar world.'],
    'Call to Adventure':['A problem that reaches into the hero’s normal life instead of waiting politely outside it.','An invitation or discovery that offers something the hero wants but demands an uncomfortable cost.'],
    'Refusal of the Call':['A legitimate duty, fear, debt, or relationship that makes refusal understandable.','An attempt to avoid the journey that produces a consequence or proves avoidance will not work.'],
    'Meeting the Mentor':['Advice that helps the hero decide rather than solving the problem for them.','A tool, warning, lesson, failure story, or demonstration that becomes useful later.'],
    'Crossing the First Threshold':['A choice that places the hero under unfamiliar rules or consequences.','A moment where retreat is still physically possible but no longer emotionally or practically neutral.'],
    'Tests, Allies, Enemies':['A trial that reveals an ally’s value and a separate weakness at the same time.','A minor victory whose method creates an enemy, debt, or future complication.'],
    'Approach to the Inmost Cave':['A preparation choice that reveals what the hero fears most about the coming ordeal.','A narrowing of options that forces the group to decide what or whom they can risk losing.'],
    'Ordeal':['A crisis where surviving requires sacrifice rather than just greater effort.','A confrontation that destroys the hero’s previous understanding of the journey or of themselves.'],
    'Reward':['Knowledge or reconciliation that matters more than a physical prize.','A victory that gives the hero something powerful but also creates responsibility for what comes next.'],
    'The Road Back':['A consequence of the ordeal that follows the hero into what looked like an escape.','An unfinished promise, pursuit, or moral debt that turns return into another active choice.'],
    'Resurrection':['A final test that resembles an earlier failure but demands a changed response.','A confrontation where the hero must risk the very thing they once protected most rigidly.'],
    'Return with the Elixir':['A concrete way the hero’s community changes because of what they bring back.','A final action showing the hero can now use what they learned in ordinary life, not only during adventure.']
  }
};

const app=()=>window.MindMapApp;
const project=()=>app()?.getProject?.()||null;
const map=()=>app()?.getCurrentMap?.()||null;

function profileName(m){
  const title=String(m?.nodes?.[m.rootId]?.text||m?.title||'');
  return ['Three-Act Structure','Save the Cat',"Hero's Journey"].find(name=>title===`${name} — Overview`||title.startsWith(`${name} — Overview`))||null;
}
function findOverviewForMap(mapId){
  const p=project();if(!p?.sessions||!mapId)return null;
  for(const h of p.templateHistory||[]){
    const overview=p.sessions[h.overviewMapId||h.overviewSessionId];if(!overview)continue;
    const node=Object.values(overview.nodes||{}).find(n=>n.targetMapId===mapId||n.targetSessionId===mapId);
    if(node)return{overview,node,name:h.name||profileName(overview)};
  }
  for(const overview of Object.values(p.sessions)){
    const name=profileName(overview);if(!name)continue;
    const node=Object.values(overview.nodes||{}).find(n=>n.targetMapId===mapId||n.targetSessionId===mapId);
    if(node)return{overview,node,name};
  }
  return null;
}
function ensureUi(){
  if(!document.getElementById('templateHelpEnhancementStyles')){
    const style=document.createElement('style');style.id='templateHelpEnhancementStyles';style.textContent=`
      .template-focus-help-btn{position:absolute;left:18px;top:66px;z-index:45;box-shadow:0 8px 24px rgba(41,36,30,.16)}
      .template-help-examples{margin:0;padding-left:20px;color:var(--ink,#25231f)}
      .template-help-examples li{margin:0 0 8px;line-height:1.42}.template-help-examples li:last-child{margin-bottom:0}
      @media(max-width:850px),(hover:none) and (pointer:coarse){.template-focus-help-btn{left:10px;top:58px}}
    `;document.head.appendChild(style);
  }
  const workspace=document.getElementById('workspace');
  if(workspace&&!document.getElementById('templateFocusHelpBtn')){
    const b=document.createElement('button');b.id='templateFocusHelpBtn';b.className='btn template-focus-help-btn hidden';b.type='button';b.textContent='? Beat help';workspace.appendChild(b);b.addEventListener('click',openFocusedHelp);
  }
  const grid=document.querySelector('#templateHelpDialog .template-help-grid');
  if(grid&&!document.getElementById('templateHelpExamples')){
    const block=document.createElement('div');block.className='template-help-block';block.innerHTML='<strong>Brainstorming ideas</strong><ul id="templateHelpExamples" class="template-help-examples"></ul>';grid.appendChild(block);
  }
}
function updateExamples(){
  ensureUi();const dialog=document.getElementById('templateHelpDialog'),list=document.getElementById('templateHelpExamples');if(!dialog||!list||dialog.classList.contains('hidden'))return;
  const template=document.getElementById('templateHelpKicker')?.textContent?.trim()||'';
  const title=document.getElementById('templateHelpTitle')?.textContent?.trim()||'';
  const items=EXAMPLES[template]?.[title]||['What could happen here that changes the next decision?','What specific choice, consequence, relationship, or discovery would make this beat unique to your story?'];
  list.innerHTML='';for(const text of items){const li=document.createElement('li');li.textContent=text;list.appendChild(li);}
}
function updateFocusButton(){
  ensureUi();const b=document.getElementById('templateFocusHelpBtn'),ctx=findOverviewForMap(map()?.id);if(!b)return;b.classList.toggle('hidden',!ctx);if(ctx)b.textContent=`? ${ctx.node?.text||'Beat'} help`;
}
function openFocusedHelp(){
  const current=map();const ctx=findOverviewForMap(current?.id);if(!current||!ctx)return;
  const returnId=current.id;
  app()?.setCurrentMap?.(ctx.overview.id,false);
  let attempts=0;
  const open=()=>{
    const selector=`#nodes .node[data-id="${CSS.escape(ctx.node.id)}"] .template-help-icon`;
    const icon=document.querySelector(selector);
    if(icon){
      icon.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));
      requestAnimationFrame(()=>{app()?.setCurrentMap?.(returnId,false);updateFocusButton();updateExamples();});
      return;
    }
    if(++attempts<12)requestAnimationFrame(open);else app()?.setCurrentMap?.(returnId,false);
  };
  requestAnimationFrame(open);
}

function watch(){
  ensureUi();updateFocusButton();updateExamples();
  const dialog=document.getElementById('templateHelpDialog');if(dialog&&!dialog._examplesObserver){const obs=new MutationObserver(updateExamples);obs.observe(dialog,{attributes:true,attributeFilter:['class'],subtree:true,childList:true,characterData:true});dialog._examplesObserver=obs;}
  const nodes=document.getElementById('nodes');if(nodes&&!nodes._focusHelpObserver){const obs=new MutationObserver(updateFocusButton);obs.observe(nodes,{childList:true});nodes._focusHelpObserver=obs;}
  document.getElementById('mapSelect')?.addEventListener('change',()=>setTimeout(updateFocusButton,0));
}

window.addEventListener('DOMContentLoaded',watch);
setTimeout(watch,0);
})();
