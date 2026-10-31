(()=>{'use strict';

// Short, plain-English brainstorming examples for story-template beat help.
// story-arc.js owns the help button and focused-beat navigation.
const EXAMPLES={
  'Three-Act Structure':{
    'Act I — Setup':['Show the hero’s normal day.','Show what they want.'],
    'Inciting Incident':['A threat arrives.','A discovery changes everything.'],
    'First Plot Point':['The hero commits.','Going back is no longer easy.'],
    'Act II — Confrontation':['A plan fails.','A new problem appears.'],
    'Midpoint':['A big truth is revealed.','A win creates a bigger problem.'],
    'Second Plot Point':['The last safe option disappears.','The hero learns what must happen next.'],
    'Act III — Resolution':['Old clues pay off.','The final plan begins.'],
    'Climax':['The hero makes the hardest choice.','The main conflict is decided.'],
    'Denouement':['Show what changed.','Show the new normal.']
  },
  'Save the Cat':{
    'Opening Image':['Show life before the change.','Show what feels wrong.'],
    'Theme Stated':['Someone says a simple truth.','A moment hints at the lesson.'],
    'Setup':['Show the hero’s problem.','Plant something that matters later.'],
    'Catalyst':['Bad news arrives.','Something unexpected happens.'],
    'Debate':['The hero hesitates.','An easy fix fails.'],
    'Break into Two':['The hero chooses to act.','They enter a new situation.'],
    'B Story':['A new relationship begins.','Someone challenges the hero’s thinking.'],
    'Fun and Games':['Deliver the main story promise.','Give the hero a memorable win or loss.'],
    'Midpoint':['A major reveal changes the stakes.','A victory turns costly.'],
    'Bad Guys Close In':['Pressure gets worse.','An old mistake comes back.'],
    'All Is Lost':['The plan collapses.','The hero loses something important.'],
    'Dark Night of the Soul':['The hero sees what went wrong.','They admit what must change.'],
    'Break into Three':['A better plan forms.','The hero makes a new choice.'],
    'Finale':['The final plan is tested.','Earlier setup pays off.'],
    'Final Image':['Echo the opening.','Show how life is different now.']
  },
  "Hero's Journey":{
    'Ordinary World':['Show the hero at home.','Show what they could lose.'],
    'Call to Adventure':['A mission appears.','A problem reaches the hero.'],
    'Refusal of the Call':['The hero says no.','A duty keeps them home.'],
    'Meeting the Mentor':['Someone gives useful advice.','The hero receives a tool or warning.'],
    'Crossing the First Threshold':['The hero leaves the familiar world.','The rules change.'],
    'Tests, Allies, Enemies':['The hero meets an ally.','A small win creates trouble.'],
    'Approach to the Inmost Cave':['The group prepares for danger.','Options start running out.'],
    'Ordeal':['The hero faces a major crisis.','Survival costs something.'],
    'Reward':['The hero gains knowledge.','A victory brings something useful.'],
    'The Road Back':['The return becomes dangerous.','An unfinished promise matters.'],
    'Resurrection':['The hero faces the final test.','They respond differently this time.'],
    'Return with the Elixir':['The hero brings something back.','Home changes because of the journey.']
  }
};

function ensureUi(){
  if(!document.getElementById('templateHelpExampleStyles')){
    const style=document.createElement('style');style.id='templateHelpExampleStyles';style.textContent=`
      .template-help-examples{margin:0;padding-left:20px;color:var(--ink,#25231f)}
      .template-help-examples li{margin:0 0 5px;line-height:1.35}.template-help-examples li:last-child{margin-bottom:0}
    `;document.head.appendChild(style);
  }
  const grid=document.querySelector('#templateHelpDialog .template-help-grid');
  if(grid&&!document.getElementById('templateHelpExamples')){
    const block=document.createElement('div');block.className='template-help-block';block.innerHTML='<strong>Examples</strong><ul id="templateHelpExamples" class="template-help-examples"></ul>';grid.appendChild(block);
  }
}
function updateExamples(){
  ensureUi();const dialog=document.getElementById('templateHelpDialog'),list=document.getElementById('templateHelpExamples');if(!dialog||!list||dialog.classList.contains('hidden'))return;
  const template=document.getElementById('templateHelpKicker')?.textContent?.trim()||'';
  const title=document.getElementById('templateHelpTitle')?.textContent?.trim()||'';
  const items=EXAMPLES[template]?.[title]||['A new problem appears.','A choice changes what happens next.'];
  list.replaceChildren(...items.map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));
}
function watch(){
  ensureUi();updateExamples();
  const dialog=document.getElementById('templateHelpDialog');if(dialog&&!dialog._examplesObserver){const obs=new MutationObserver(updateExamples);obs.observe(dialog,{attributes:true,attributeFilter:['class']});dialog._examplesObserver=obs;}
}
window.addEventListener('DOMContentLoaded',watch);
setTimeout(watch,0);
})();