(() => {
  'use strict';

  const VERSION = '0.2.0';
  const SAVE_KEY = 'space-fighters-save-v1';
  const LEGACY_SAVE_KEYS = ['space-fighters-save-v0.1.0'];

  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  const ids = ['hud','shieldBar','hullBar','livesValue','scoreValue','missionLabel','objectiveLabel','missileValue','startScreen','startButton','hangarButton','briefingScreen','briefingSector','briefingTitle','briefingText','briefingObjective','launchButton','skipButton','hangarScreen','creditsValue','upgradeGrid','hangarContinueButton','hangarResetButton','resultScreen','resultEyebrow','resultTitle','resultText','resultScore','resultCredits','resultKills','resultContinueButton','resultHangarButton','pauseScreen','resumeButton','touchControls','joystick','joystickKnob','fireButton','specialButton','toast'];
  const ui = Object.fromEntries(ids.map(id => [id, document.getElementById(id)]));

  const ENEMY = {
    scout:   { threat: 1, radius: 12, hp: 24, speed: 92,  score: 90,  fireRate: 0 },
    striker: { threat: 2, radius: 14, hp: 40, speed: 88,  score: 130, fireRate: 2.5 },
    bomber:  { threat: 3, radius: 18, hp: 82, speed: 60,  score: 210, fireRate: 2.0 },
    gunship: { threat: 4, radius: 21, hp: 138,speed: 48,  score: 330, fireRate: 1.55 },
    ace:     { threat: 5, radius: 15, hp: 72, speed: 118, score: 380, fireRate: 1.05 },
    carrier: { threat: 8, radius: 58, hp: 1700,speed: 20, score: 3000,fireRate: .85 }
  };

  const MISSIONS = {
    m1: {
      id:'m1', number:'01', sector:'ORION PERIMETER', title:'Patrol Intercept',
      text:'Long-range scans show a light fighter screen probing the perimeter. Break the patrol and learn their attack pattern.',
      objectiveText:'Destroy 26 enemy craft.', type:'kills', target:26, timeLimit:240, reward:180,
      successNext:'m2', failNext:'r1', tier:1, activeCap:5, shooterCap:2, bulletCap:8, bulletSpeed:145, threatCap:6,
      authored:true
    },
    r1: {
      id:'r1', number:'R1', sector:'ORION PERIMETER', title:'Emergency Screen',
      text:'The patrol line broke. Hold the emergency corridor while civilian traffic clears the sector.',
      objectiveText:'Survive 165 seconds.', type:'survive', target:165, timeLimit:165, reward:150,
      successNext:'m2', failNext:'r1', tier:1, activeCap:5, shooterCap:2, bulletCap:10, bulletSpeed:150, threatCap:6
    },
    m2: {
      id:'m2', number:'02', sector:'VEGA SHIPPING LANE', title:'Convoy Shield',
      text:'A supply convoy is pushing through contested space. Keep enemy fire away from the command transport.',
      objectiveText:'Protect the transport for 180 seconds.', type:'defend', target:180, timeLimit:180, reward:260,
      successNext:'m3', failNext:'r2', tier:2, activeCap:6, shooterCap:2, bulletCap:12, bulletSpeed:165, threatCap:8
    },
    r2: {
      id:'r2', number:'R2', sector:'VEGA SHIPPING LANE', title:'Salvage Run',
      text:'The convoy scattered. Clear the wreck zone and recover tactical data while the fleet regroups.',
      objectiveText:'Destroy 26 attackers.', type:'kills', target:26, timeLimit:225, reward:230,
      successNext:'m3', failNext:'r2', tier:2, activeCap:6, shooterCap:2, bulletCap:12, bulletSpeed:165, threatCap:8,
      recoveryBonus:true
    },
    m3: {
      id:'m3', number:'03', sector:'KHEPRI FRONT', title:'Carrier Strike',
      text:'The enemy carrier directing these raids has been located. Punch through its screen and destroy it.',
      objectiveText:'Destroy the enemy carrier.', type:'boss', target:1, timeLimit:285, reward:420,
      successNext:'m4', failNext:'r3', tier:3, activeCap:7, shooterCap:3, bulletCap:18, bulletSpeed:185, threatCap:11
    },
    r3: {
      id:'r3', number:'R3', sector:'KHEPRI FRONT', title:'Break Contact',
      text:'The strike failed. Survive the pursuit long enough for the squadron to regroup.',
      objectiveText:'Survive 165 seconds.', type:'survive', target:165, timeLimit:165, reward:320,
      successNext:'m4', failNext:'r3', tier:3, activeCap:7, shooterCap:3, bulletCap:18, bulletSpeed:185, threatCap:10,
      recoveryBonus:true
    },
    m4: {
      id:'m4', number:'04', sector:'HELIOS APPROACH', title:'Ace Trial',
      text:'Enemy aces are screening the Helios approach. Break them and prove you can lead the next offensive.',
      objectiveText:'Destroy 34 enemy craft.', type:'kills', target:34, timeLimit:270, reward:600,
      successNext:null, failNext:'m4', tier:4, activeCap:9, shooterCap:4, bulletCap:24, bulletSpeed:210, threatCap:14
    }
  };

  const UPGRADES = {
    guns:{name:'Pulse Cannons',description:'Increase primary weapon damage.',baseCost:120,max:5},
    engine:{name:'Vector Thrusters',description:'Increase movement speed inside the combat window.',baseCost:100,max:5},
    shield:{name:'Shield Matrix',description:'Increase maximum shield strength.',baseCost:110,max:5},
    hull:{name:'Reinforced Hull',description:'Increase maximum hull integrity.',baseCost:110,max:5}
  };

  const M1_SCRIPT = [
    {t:2,  wave:'scoutsLeft'},
    {t:22, wave:'scoutsRight'},
    {t:45, power:'weapon', toast:'FORMATION BONUS · WEAPON UPGRADE'},
    {t:52, wave:'scoutV'},
    {t:72, wave:'strikerIntro', toast:'NEW CONTACT · STRIKER'},
    {t:95, wave:'lightScouts'},
    {t:108, power:'shield', toast:'FIELD SUPPLY · SHIELD'},
    {t:118,wave:'strikerEscort'},
    {t:145,wave:'twoStrikers'},
    {t:165,power:'missile'},
    {t:175,wave:'climax'},
    {t:200,wave:'finish'}
  ];

  const state = {
    mode:'menu', lastTime:0, elapsed:0, missionElapsed:0,
    currentMissionId:'m1', currentMission:MISSIONS.m1, pendingMissionId:'m1',
    missionKills:0, missionScore:0, missionCredits:0, worldScroll:0,
    spawnTimer:0, powerupTimer:10, bossSpawned:false, defendTarget:null,
    scriptIndex:0, waveSerial:0,
    stars:[], particles:[], bullets:[], enemyBullets:[], enemies:[], missiles:[], powerups:[],
    player:null,
    input:{x:0,y:0,firing:false}, keyboard:new Set(), touch:{joystickId:null,fireId:null},
    mouse:{active:false,targetX:null}, toastTimer:null, hangarReturn:'menu',
    debug:{deaths:0,peakEnemies:0,peakBullets:0}
  };

  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const random=(a,b)=>a+Math.random()*(b-a);
  const distanceSq=(a,b)=>{const x=a.x-b.x,y=a.y-b.y;return x*x+y*y};
  const isTouchLikely=()=>matchMedia('(pointer: coarse)').matches||navigator.maxTouchPoints>0;
  const isFinePointer=()=>matchMedia('(pointer: fine)').matches;

  const defaultSave=()=>({credits:0,currentMissionId:'m1',upgrades:{guns:0,engine:0,shield:0,hull:0},bestScore:0});
  function loadSave(){
    let raw=localStorage.getItem(SAVE_KEY);
    if(!raw){
      for(const key of LEGACY_SAVE_KEYS){
        raw=localStorage.getItem(key);
        if(raw) break;
      }
    }
    try{
      const p=raw?JSON.parse(raw):null,b=defaultSave();
      if(!p||typeof p!=='object') return b;
      const merged={...b,...p,upgrades:{...b.upgrades,...(p.upgrades||{})},currentMissionId:MISSIONS[p.currentMissionId]?p.currentMissionId:'m1'};
      localStorage.setItem(SAVE_KEY,JSON.stringify(merged));
      return merged;
    }catch{return defaultSave()}
  }
  let save=loadSave();
  const persistSave=()=>localStorage.setItem(SAVE_KEY,JSON.stringify(save));

  function resizeCanvas(){
    const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);
    canvas.width=Math.max(1,Math.floor(r.width*d));
    canvas.height=Math.max(1,Math.floor(r.height*d));
    ctx.setTransform(d,0,0,d,0,0);
    state.viewWidth=r.width; state.viewHeight=r.height;
    seedStars(); if(state.player) keepPlayerInBounds();
  }
  function seedStars(){
    const n=clamp(Math.round(Math.max(1,state.viewWidth*state.viewHeight)/8500),70,230);
    state.stars=Array.from({length:n},()=>({x:Math.random()*state.viewWidth,y:Math.random()*state.viewHeight,z:random(.25,1),size:random(.7,1.8)}));
  }
  function createPlayer(){
    const maxShield=100+save.upgrades.shield*20,maxHull=100+save.upgrades.hull*20;
    return {x:state.viewWidth*.5,y:state.viewHeight*.72,visualRadius:14,hitRadius:9,speed:245+save.upgrades.engine*24,
      maxShield,shield:maxShield,maxHull,hull:maxHull,lives:3,missiles:2,fireCooldown:0,burstShots:0,
      invulnerable:1.5,tempWeaponLevel:0,rapidTimer:0,alive:true};
  }
  function showOnly(s){[ui.startScreen,ui.briefingScreen,ui.hangarScreen,ui.resultScreen,ui.pauseScreen].forEach(e=>e.classList.add('hidden'));if(s)s.classList.remove('hidden')}
  function showToast(m,d=1500){clearTimeout(state.toastTimer);ui.toast.textContent=m;ui.toast.classList.remove('hidden');state.toastTimer=setTimeout(()=>ui.toast.classList.add('hidden'),d)}

  function prepareBriefing(id){
    const m=MISSIONS[id]||MISSIONS.m1; state.pendingMissionId=m.id;
    ui.briefingSector.textContent=m.sector; ui.briefingTitle.textContent=`${m.number} · ${m.title}`;
    ui.briefingText.textContent=m.text; ui.briefingObjective.textContent=m.objectiveText;
    showOnly(ui.briefingScreen); state.mode='briefing';
  }

  function launchMission(){
    const m=MISSIONS[state.pendingMissionId]||MISSIONS.m1;
    Object.assign(state,{currentMissionId:m.id,currentMission:m,mode:'playing',missionElapsed:0,missionKills:0,missionScore:0,
      missionCredits:0,worldScroll:0,spawnTimer:m.authored?999:3,powerupTimer:m.recoveryBonus?18:12,bossSpawned:false,scriptIndex:0,waveSerial:0,
      bullets:[],enemyBullets:[],enemies:[],missiles:[],powerups:[],particles:[],debug:{deaths:0,peakEnemies:0,peakBullets:0}});
    state.player=createPlayer(); state.mouse.targetX=state.player.x;
    state.defendTarget=m.type==='defend'?{x:state.viewWidth*.5,y:Math.max(120,state.viewHeight*.22),radius:28,maxHull:400,hull:400}:null;
    showOnly(null); ui.hud.classList.remove('hidden'); ui.touchControls.classList.toggle('hidden',!isTouchLikely());
    updateHud(); state.lastTime=performance.now();
    showToast(m.authored?'PATROL · KEEP IT CLEAN':'MISSION START',900);
  }

  function openHangar(ret='menu'){
    state.hangarReturn=ret; state.mode='hangar'; renderHangar(); showOnly(ui.hangarScreen);
    ui.hud.classList.add('hidden'); ui.touchControls.classList.add('hidden');
  }
  function renderHangar(){
    ui.creditsValue.textContent=save.credits; ui.upgradeGrid.innerHTML='';
    for(const[k,u]of Object.entries(UPGRADES)){
      const level=save.upgrades[k]||0,cost=u.baseCost*(level+1),maxed=level>=u.max;
      const card=document.createElement('article'),copy=document.createElement('div'),button=document.createElement('button');
      card.className='upgrade-card'; copy.innerHTML=`<h3>${u.name} · Lv ${level}/${u.max}</h3><p>${u.description}</p>`;
      button.type='button'; button.textContent=maxed?'MAXED':`${cost} CR`; button.disabled=maxed||save.credits<cost;
      button.addEventListener('click',()=>{if(save.credits<cost||maxed)return;save.credits-=cost;save.upgrades[k]=level+1;persistSave();renderHangar()});
      card.append(copy,button); ui.upgradeGrid.append(card);
    }
  }
  function closeHangar(){if(state.hangarReturn==='result'){state.mode='result';showOnly(ui.resultScreen)}else if(state.hangarReturn==='briefing')prepareBriefing(state.pendingMissionId);else{state.mode='menu';showOnly(ui.startScreen)}}

  function keepPlayerInBounds(){
    const p=state.player;if(!p)return;const m=22,t=isTouchLikely()?96:82,b=isTouchLikely()?150:30;
    p.x=clamp(p.x,m,state.viewWidth-m);p.y=clamp(p.y,t,state.viewHeight-b);
  }

  function handleInput(dt){
    const p=state.player;if(!p)return;
    let y=0;if(state.keyboard.has('ArrowUp')||state.keyboard.has('KeyW'))y--;if(state.keyboard.has('ArrowDown')||state.keyboard.has('KeyS'))y++;
    if(state.touch.joystickId!==null){
      const l=Math.hypot(state.input.x,state.input.y)||1;p.x+=state.input.x/l*p.speed*dt;p.y+=state.input.y/l*p.speed*dt;
    }else{
      let keyX=0;if(state.keyboard.has('ArrowLeft')||state.keyboard.has('KeyA'))keyX--;if(state.keyboard.has('ArrowRight')||state.keyboard.has('KeyD'))keyX++;
      if(state.mouse.active&&isFinePointer()&&state.mouse.targetX!==null){
        const delta=state.mouse.targetX-p.x; const maxStep=p.speed*1.8*dt;
        p.x+=clamp(delta,-maxStep,maxStep);
      }else p.x+=keyX*p.speed*dt;
      p.y+=y*p.speed*dt;
    }
    if(state.touch.fireId===null) state.input.firing=state.keyboard.has('Space');
    keepPlayerInBounds();
  }

  function firePrimary(){
    const p=state.player;if(!p||!p.alive||p.fireCooldown>0)return false;
    const persistent=save.upgrades.guns,level=clamp(p.tempWeaponLevel,0,3),damage=14+persistent*3;
    p.fireCooldown=p.rapidTimer>0?.075:Math.max(.09,.14-persistent*.008);
    const patterns=[[{x:0,vx:0}],[{x:-8,vx:-18},{x:8,vx:18}],[{x:-11,vx:-45},{x:0,vx:0},{x:11,vx:45}],[{x:-13,vx:-85},{x:-5,vx:-20},{x:5,vx:20},{x:13,vx:85}]];
    for(const s of patterns[level])state.bullets.push({x:p.x+s.x,y:p.y-23,vx:s.vx,vy:-760,radius:3,damage});
    return true;
  }
  function fireMissile(){
    const p=state.player;if(state.mode!=='playing'||!p||!p.alive||p.missiles<=0)return;
    p.missiles--;state.missiles.push({x:p.x,y:p.y-24,vx:0,vy:-390,radius:5,damage:110,target:null,life:5});showToast('MISSILE AWAY',700);
  }

  function activeThreat(){return state.enemies.reduce((sum,e)=>sum+(e.alive?(ENEMY[e.type]?.threat||1):0),0)}
  function activeShooters(){return state.enemies.filter(e=>e.alive&&e.fireRate>0).length}
  function canSpawnType(type){
    const m=state.currentMission,p=ENEMY[type];
    if(!p)return false;
    if(state.enemies.filter(e=>e.alive).length>=m.activeCap)return false;
    if(activeThreat()+p.threat>m.threatCap)return false;
    if(p.fireRate>0&&activeShooters()>=m.shooterCap)return false;
    return true;
  }
  function enemyProfile(type){
    const base=ENEMY[type],tier=state.currentMission.tier;
    return {...base,hp:base.hp+(tier-1)*(type==='carrier'?0:Math.ceil(base.hp*.07)),speed:base.speed+(tier-1)*(type==='ace'?7:3)};
  }
  function spawnEnemy(type,x=null,y=null){
    if(!canSpawnType(type)&&type!=='carrier')return null;
    const q=enemyProfile(type),e={type,x:x??random(35,state.viewWidth-35),y:y??-70,radius:q.radius,hp:q.hp,maxHp:q.hp,speed:q.speed,score:q.score,
      fireRate:q.fireRate,fireTimer:random(.45,Math.max(.6,q.fireRate)),age:random(0,6),alive:true,baseX:x??0};
    e.baseX=e.x;state.enemies.push(e);return e;
  }
  function spawnFormation(types,positions){
    let spawned=0;
    for(let i=0;i<types.length;i++){
      if(state.enemies.filter(e=>e.alive).length>=state.currentMission.activeCap)break;
      const pos=positions[i]??.5,x=clamp(state.viewWidth*pos,35,state.viewWidth-35);
      if(spawnEnemy(types[i],x,-45-i*24))spawned++;
    }
    return spawned;
  }
  function runAuthoredWave(name){
    const W={
      scoutsLeft:()=>spawnFormation(['scout','scout','scout'],[.18,.24,.30]),
      scoutsRight:()=>spawnFormation(['scout','scout','scout'],[.82,.76,.70]),
      scoutV:()=>spawnFormation(['scout','scout','scout','scout'],[.35,.45,.55,.65]),
      strikerIntro:()=>spawnFormation(['striker','scout'],[.5,.68]),
      lightScouts:()=>spawnFormation(['scout','scout','scout'],[.25,.5,.75]),
      strikerEscort:()=>spawnFormation(['striker','scout','scout'],[.5,.35,.65]),
      twoStrikers:()=>spawnFormation(['striker','striker'],[.35,.65]),
      climax:()=>spawnFormation(['striker','scout','scout','scout'],[.5,.28,.5,.72]),
      finish:()=>spawnFormation(['striker','scout','scout','scout'],[.5,.2,.5,.8])
    };return W[name]?.()||0;
  }
  function spawnPowerup(type,x=state.viewWidth*.5,y=-24){state.powerups.push({type,x,y,radius:12,vy:78,spin:0,guaranteed:true})}

  function processM1Script(){
    while(state.scriptIndex<M1_SCRIPT.length){
      const ev=M1_SCRIPT[state.scriptIndex];if(state.missionElapsed<ev.t)break;
      if(ev.wave){
        const needed=ev.wave==='scoutV'?4:ev.wave==='climax'||ev.wave==='finish'?4:ev.wave==='scoutsLeft'||ev.wave==='scoutsRight'||ev.wave==='lightScouts'||ev.wave==='strikerEscort'?3:2;
        if(state.enemies.filter(e=>e.alive).length>Math.max(1,state.currentMission.activeCap-needed)||activeThreat()>=state.currentMission.threatCap-1)break;
        runAuthoredWave(ev.wave);
      }
      if(ev.power)spawnPowerup(ev.power);
      if(ev.toast)showToast(ev.toast,1400);
      state.scriptIndex++;
    }
  }

  function randomWaveTypes(){
    const m=state.currentMission,t=m.tier;
    const pool=t===1?['scout','scout','striker']:
      t===2?['scout','striker','striker','bomber']:
      t===3?['scout','striker','bomber','gunship']:
      ['striker','bomber','gunship','ace'];
    const desired=clamp(2+Math.floor(t/2)+(Math.random()<.35?1:0),2,4);
    const types=[];
    for(let i=0;i<desired;i++)types.push(pool[Math.floor(Math.random()*pool.length)]);
    return types;
  }
  function spawnRandomWave(){
    const m=state.currentMission;
    if(state.enemies.filter(e=>e.alive).length>=m.activeCap-1||activeThreat()>=m.threatCap-1)return false;
    const types=randomWaveTypes(),center=random(.25,.75),positions=types.map((_,i)=>clamp(center+(i-(types.length-1)/2)*.11,.08,.92));
    return spawnFormation(types,positions)>0;
  }
  function spawnBoss(){
    state.bossSpawned=true;const q=enemyProfile('carrier');
    state.enemies.push({type:'carrier',x:state.viewWidth*.5,y:-100,radius:q.radius,hp:q.hp,maxHp:q.hp,speed:q.speed,score:q.score,fireRate:q.fireRate,fireTimer:1,age:0,alive:true,baseX:state.viewWidth*.5});
    showToast('ENEMY CARRIER INBOUND',2200);
  }

  function enemyShoot(e){
    if(!state.player?.alive||!e.fireRate||e.y<20||e.y>state.viewHeight*.72)return;
    const m=state.currentMission;if(state.enemyBullets.length>=m.bulletCap)return;
    const t=m.type==='defend'&&state.defendTarget&&Math.random()<.32?state.defendTarget:state.player;
    const dx=t.x-e.x,dy=t.y-e.y,l=Math.hypot(dx,dy)||1;
    const speed=m.bulletSpeed*(e.type==='ace'?1.08:e.type==='carrier'?1.05:1);
    const damage=e.type==='bomber'?20:e.type==='carrier'?16:12;
    const shots=e.type==='carrier'&&state.enemyBullets.length<m.bulletCap-1?2:1;
    for(let i=0;i<shots;i++){
      if(state.enemyBullets.length>=m.bulletCap)break;
      const spread=shots===2?(i===0?-.12:.12):0,cs=Math.cos(spread),sn=Math.sin(spread),nx=dx/l,ny=dy/l;
      state.enemyBullets.push({x:e.x,y:e.y+e.radius,vx:(nx*cs-ny*sn)*speed,vy:(nx*sn+ny*cs)*speed,radius:e.type==='carrier'?5:4,damage});
    }
  }
  function maybePowerup(dt){
    if(state.currentMission.authored)return;
    state.powerupTimer-=dt;if(state.powerupTimer>0)return;
    state.powerupTimer=random(state.currentMission.recoveryBonus?10:12,state.currentMission.recoveryBonus?16:20);
    const r=Math.random(),type=r<.34?'weapon':r<.66?'shield':r<.82?'rapid':'missile';spawnPowerup(type,random(45,state.viewWidth-45));
  }
  function chooseTarget(m){let b=null,d=Infinity;for(const e of state.enemies)if(e.alive){const n=distanceSq(m,e);if(n<d){d=n;b=e}}m.target=b}

  function updateEntities(dt){
    const p=state.player;if(!p)return;handleInput(dt);
    p.fireCooldown=Math.max(0,p.fireCooldown-dt);p.invulnerable=Math.max(0,p.invulnerable-dt);p.rapidTimer=Math.max(0,p.rapidTimer-dt);
    if(state.input.firing||p.burstShots>0){const f=firePrimary();if(f&&p.burstShots>0)p.burstShots--}
    for(const b of state.bullets){b.x+=b.vx*dt;b.y+=b.vy*dt}
    for(const m of state.missiles){m.life-=dt;if(!m.target||!m.target.alive)chooseTarget(m);if(m.target){const dx=m.target.x-m.x,dy=m.target.y-m.y,ll=Math.hypot(dx,dy)||1,s=clamp(dt*5,0,1);m.vx+=(dx/ll*430-m.vx)*s;m.vy+=(dy/ll*430-m.vy)*s}m.x+=m.vx*dt;m.y+=m.vy*dt}
    for(const b of state.enemyBullets){b.x+=b.vx*dt;b.y+=b.vy*dt}
    for(const e of state.enemies){
      if(!e.alive)continue;e.age+=dt;
      if(e.type==='striker')e.x=clamp(e.baseX+Math.sin(e.age*2.0)*42,25,state.viewWidth-25);
      if(e.type==='ace')e.x=clamp(e.baseX+Math.sin(e.age*2.7)*80+Math.sin(e.age*.9)*25,25,state.viewWidth-25);
      if(e.type==='carrier'){e.y=Math.min(e.y+e.speed*dt,135);e.x=state.viewWidth*.5+Math.sin(e.age*.65)*Math.min(110,state.viewWidth*.16)}else e.y+=e.speed*dt;
      if(e.fireRate&&(e.fireTimer-=dt)<=0){e.fireTimer=e.fireRate*random(.9,1.25);enemyShoot(e)}
    }
    for(const q of state.powerups){q.y+=q.vy*dt;q.spin+=dt*4}
    for(const q of state.particles){q.life-=dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.vx*=.985;q.vy*=.985}
    resolveCollisions();
    state.bullets=state.bullets.filter(b=>b.y>-40&&b.y<state.viewHeight+40&&b.x>-40&&b.x<state.viewWidth+40);
    state.enemyBullets=state.enemyBullets.filter(b=>b.y>-50&&b.y<state.viewHeight+50&&b.x>-50&&b.x<state.viewWidth+50);
    state.missiles=state.missiles.filter(m=>m.life>0&&m.y>-80&&m.y<state.viewHeight+80&&m.x>-80&&m.x<state.viewWidth+80);
    state.powerups=state.powerups.filter(q=>q.y<state.viewHeight+40&&!q.dead);
    state.particles=state.particles.filter(q=>q.life>0);
    state.enemies=state.enemies.filter(e=>e.alive&&e.y<state.viewHeight+100);
    state.debug.peakEnemies=Math.max(state.debug.peakEnemies,state.enemies.length);state.debug.peakBullets=Math.max(state.debug.peakBullets,state.enemyBullets.length);
  }

  function resolveCollisions(){
    const p=state.player;if(!p)return;
    for(const b of state.bullets){for(const e of state.enemies){if(!e.alive)continue;const r=b.radius+e.radius;if(distanceSq(b,e)<=r*r){b.dead=true;damageEnemy(e,b.damage);break}}}
    state.bullets=state.bullets.filter(b=>!b.dead);
    for(const m of state.missiles){for(const e of state.enemies){if(!e.alive)continue;const r=m.radius+e.radius+4;if(distanceSq(m,e)<=r*r){m.dead=true;damageEnemy(e,m.damage);explode(m.x,m.y,'#ffd166',16);break}}}
    state.missiles=state.missiles.filter(m=>!m.dead);
    if(p.alive&&p.invulnerable<=0){
      for(const b of state.enemyBullets){const r=b.radius+p.hitRadius;if(distanceSq(b,p)<=r*r){b.dead=true;damagePlayer(b.damage);if(!p.alive)break}}
      for(const e of state.enemies){if(!e.alive||e.type==='carrier')continue;const r=e.radius+p.hitRadius;if(distanceSq(e,p)<=r*r){damagePlayer(34);damageEnemy(e,9999);break}}
    }
    if(state.currentMission.type==='defend'&&state.defendTarget){for(const b of state.enemyBullets){const r=b.radius+state.defendTarget.radius;if(distanceSq(b,state.defendTarget)<=r*r){b.dead=true;state.defendTarget.hull=Math.max(0,state.defendTarget.hull-b.damage);if(state.defendTarget.hull<=0)endMission(false,'The command transport was destroyed.')}}}
    for(const q of state.powerups){const r=q.radius+p.hitRadius+5;if(p.alive&&distanceSq(q,p)<=r*r){q.dead=true;applyPowerup(q.type)}}
    state.enemyBullets=state.enemyBullets.filter(b=>!b.dead);state.powerups=state.powerups.filter(q=>!q.dead);
  }

  function damageEnemy(e,a){
    if(!e.alive)return;e.hp-=a;spark(e.x,e.y,'#8fe8ff',3);
    if(e.hp<=0){
      e.alive=false;state.missionKills++;state.missionScore+=e.score;explode(e.x,e.y,e.type==='carrier'?'#ffd166':'#70dbff',e.type==='carrier'?45:12);
      if(e.type==='carrier'){state.missionScore+=2500;setTimeout(()=>{if(state.mode==='playing')endMission(true,'Enemy carrier destroyed.')},900)}
      else if(!state.currentMission.authored&&Math.random()<(state.currentMission.recoveryBonus ? .18 : .10)){
        const r=Math.random(),type=r<.42?'weapon':r<.74?'shield':'missile';spawnPowerup(type,e.x,e.y);
      }
    }
  }
  function damagePlayer(a){
    const p=state.player;if(!p?.alive||p.invulnerable>0)return;
    let r=a,shieldBefore=p.shield;
    if(p.shield>0){const q=Math.min(p.shield,r);p.shield-=q;r-=q}
    if(r>0)p.hull=Math.max(0,p.hull-r);
    spark(p.x,p.y,shieldBefore>0?'#8fe8ff':'#ff9e72',8);
    if(shieldBefore>0&&p.shield<=0)showToast('SHIELD DOWN',900);
    if(p.hull<=0)loseLife();
  }
  function loseLife(){
    const p=state.player;if(!p?.alive)return;p.alive=false;p.lives--;state.debug.deaths++;explode(p.x,p.y,'#ff6b6b',28);
    if(p.lives<=0){setTimeout(()=>{if(state.mode==='playing')endMission(false,'Your fighter was lost.')},900);return}
    setTimeout(()=>{
      if(state.mode!=='playing')return;p.alive=true;p.x=clamp(p.x,50,state.viewWidth-50);p.y=clamp(p.y,120,state.viewHeight-(isTouchLikely()?170:50));
      p.shield=p.maxShield;p.hull=p.maxHull;p.invulnerable=2.6;p.tempWeaponLevel=0;p.rapidTimer=0;p.burstShots=0;
      state.enemyBullets=state.enemyBullets.filter(b=>Math.hypot(b.x-p.x,b.y-p.y)>150);
      if(state.debug.deaths>=2&&!state.currentMission.authored&&Math.random()<.55)spawnPowerup('shield',p.x,Math.max(30,p.y-170));
      showToast('RESPAWN · TEMP POWER-UPS LOST',1700);
    },1000);
  }
  function applyPowerup(t){const p=state.player;if(t==='weapon'){p.tempWeaponLevel=clamp(p.tempWeaponLevel+1,0,3);showToast(`WEAPON LEVEL ${p.tempWeaponLevel+1}`)}else if(t==='shield'){p.shield=Math.min(p.maxShield,p.shield+60);showToast('SHIELD RESTORED')}else if(t==='rapid'){p.rapidTimer=Math.max(p.rapidTimer,12);showToast('RAPID FIRE · 12 SEC')}else{p.missiles=Math.min(6,p.missiles+1);showToast('MISSILE +1')}}
  function spark(x,y,c,n){for(let i=0;i<n;i++)state.particles.push({x,y,vx:random(-90,90),vy:random(-90,90),life:random(.15,.45),maxLife:.45,size:random(1,3),color:c})}
  function explode(x,y,c,n){for(let i=0;i<n;i++){const a=random(0,Math.PI*2),s=random(40,230);state.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:random(.3,1.1),maxLife:1.1,size:random(1.5,4.5),color:c})}}

  function updateMission(dt){
    state.missionElapsed+=dt;state.worldScroll+=dt*105;
    const m=state.currentMission;
    if(m.authored)processM1Script();
    else{
      state.spawnTimer-=dt;
      if(m.type==='boss'&&!state.bossSpawned&&state.missionElapsed>=55)spawnBoss();
      if(state.spawnTimer<=0){
        const interval={1:4.7,2:4.0,3:3.5,4:3.0}[m.tier]||4;
        state.spawnTimer=interval*random(.9,1.2);
        if(m.type!=='boss'||!state.bossSpawned||Math.random()<.6)spawnRandomWave();
      }
      maybePowerup(dt);
    }
    updateEntities(dt);
    if(m.type==='kills'&&state.missionKills>=m.target)endMission(true,'Enemy formation broken.');
    else if(m.type==='survive'&&state.missionElapsed>=m.target)endMission(true,'The corridor is clear.');
    else if(m.type==='defend'&&state.missionElapsed>=m.target&&state.defendTarget?.hull>0)endMission(true,'The transport escaped the combat zone.');
    else if(state.missionElapsed>=m.timeLimit&&!['survive','defend'].includes(m.type))endMission(false,'The objective window closed.');
    updateHud();
  }

  function endMission(success,message){
    if(state.mode!=='playing')return;state.mode='result';state.input.firing=false;state.keyboard.clear();state.mouse.active=false;
    ui.hud.classList.add('hidden');ui.touchControls.classList.add('hidden');
    const m=state.currentMission,base=success?m.reward:Math.max(50,Math.round(m.reward*.42)),credits=base+Math.floor(state.missionScore/500)*10;
    state.missionCredits=credits;save.credits+=credits;save.bestScore=Math.max(save.bestScore||0,state.missionScore);
    save.currentMissionId=success?(m.successNext||m.id):(m.failNext||m.id);persistSave();
    ui.resultEyebrow.textContent=success?'MISSION COMPLETE':'MISSION FAILED';ui.resultTitle.textContent=success?'Objective Secured':'Campaign Diverted';
    ui.resultText.textContent=`${message} ${success?'The campaign advances.':'Command has routed you to a recovery mission at the same difficulty tier.'}`;
    ui.resultScore.textContent=state.missionScore;ui.resultCredits.textContent=`+${credits}`;ui.resultKills.textContent=state.missionKills;
    ui.resultContinueButton.textContent=m.successNext===null&&success?'FLY AGAIN':'NEXT MISSION';showOnly(ui.resultScreen);
  }

  function updateHud(){
    const p=state.player;if(!p)return;ui.shieldBar.style.transform=`scaleX(${clamp(p.shield/p.maxShield,0,1)})`;ui.hullBar.style.transform=`scaleX(${clamp(p.hull/p.maxHull,0,1)})`;
    ui.livesValue.textContent=p.lives;ui.scoreValue.textContent=state.missionScore;ui.missionLabel.textContent=state.currentMission.number;ui.missileValue.textContent=p.missiles;
    const m=state.currentMission;if(m.type==='kills')ui.objectiveLabel.textContent=`${state.missionKills} / ${m.target}`;else if(m.type==='survive')ui.objectiveLabel.textContent=`${Math.floor(state.missionElapsed)} / ${m.target}s`;else if(m.type==='defend')ui.objectiveLabel.textContent=`TRANSPORT ${Math.ceil((state.defendTarget?.hull||0)/(state.defendTarget?.maxHull||1)*100)}%`;else{const b=state.enemies.find(e=>e.type==='carrier'&&e.alive);ui.objectiveLabel.textContent=b?`CARRIER ${Math.ceil(b.hp/b.maxHp*100)}%`:'REACH TARGET'}
  }

  function updateStars(dt){for(const s of state.stars){s.y+=105*s.z*dt;if(s.y>state.viewHeight+4){s.y=-4;s.x=Math.random()*state.viewWidth}}}
  function drawBackground(){
    const w=state.viewWidth,h=state.viewHeight,g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,'#07132b');g.addColorStop(.55,'#050a18');g.addColorStop(1,'#02040b');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
    ctx.fillStyle='rgba(46,105,156,.07)';ctx.beginPath();ctx.ellipse(w*.22,(state.worldScroll*.20)%(h+260)-130,w*.38,130,-.25,0,Math.PI*2);ctx.fill();
    for(const s of state.stars){ctx.globalAlpha=.25+s.z*.65;ctx.fillStyle=s.z>.78?'#b8edff':'#d7dfef';ctx.fillRect(s.x,s.y,s.size,s.size*(1+s.z*1.5))}ctx.globalAlpha=1;
  }
  function drawPlayer(){
    const p=state.player;if(!p?.alive||(p.invulnerable>0&&Math.floor(p.invulnerable*12)%2===0))return;ctx.save();ctx.translate(p.x,p.y);ctx.strokeStyle='#a9efff';ctx.fillStyle='#1c7bb0';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(0,-22);ctx.lineTo(10,-5);ctx.lineTo(22,10);ctx.lineTo(8,9);ctx.lineTo(0,19);ctx.lineTo(-8,9);ctx.lineTo(-22,10);ctx.lineTo(-10,-5);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='#d9f7ff';ctx.beginPath();ctx.moveTo(0,-15);ctx.lineTo(4,-2);ctx.lineTo(-4,-2);ctx.closePath();ctx.fill();ctx.fillStyle='#ffd166';ctx.fillRect(-6,15,4,random(8,16));ctx.fillRect(2,15,4,random(8,16));
    if(p.shield>0){ctx.strokeStyle=`rgba(99,216,255,${.18+.22*(p.shield/p.maxShield)})`;ctx.beginPath();ctx.arc(0,0,25,0,Math.PI*2);ctx.stroke()}ctx.restore();
  }
  function drawEnemy(e){
    ctx.save();ctx.translate(e.x,e.y);
    if(e.type==='carrier'){ctx.fillStyle='#632f4a';ctx.strokeStyle='#ff8eb7';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,55);ctx.lineTo(-50,25);ctx.lineTo(-42,-28);ctx.lineTo(-15,-55);ctx.lineTo(15,-55);ctx.lineTo(42,-28);ctx.lineTo(50,25);ctx.closePath();ctx.fill();ctx.stroke()}
    else{const c={scout:'#934d78',striker:'#a64760',bomber:'#8d4b3f',gunship:'#684b83',ace:'#d65d3b'};ctx.fillStyle=c[e.type]||'#8f4c6f';ctx.strokeStyle=e.type==='ace'?'#ffd166':'#ff9ec8';const r=e.radius;ctx.beginPath();ctx.moveTo(0,r);ctx.lineTo(r*.95,-r*.65);ctx.lineTo(r*.35,-r*.45);ctx.lineTo(0,-r);ctx.lineTo(-r*.35,-r*.45);ctx.lineTo(-r*.95,-r*.65);ctx.closePath();ctx.fill();ctx.stroke()}
    if(e.hp<e.maxHp){const w=e.radius*2;ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(-w/2,e.radius+7,w,3);ctx.fillStyle='#ff6b82';ctx.fillRect(-w/2,e.radius+7,w*clamp(e.hp/e.maxHp,0,1),3)}ctx.restore();
  }
  function drawProjectiles(){ctx.fillStyle='#78eaff';for(const b of state.bullets)ctx.fillRect(b.x-1.5,b.y-8,3,11);ctx.fillStyle='#ff5f8a';for(const b of state.enemyBullets){ctx.beginPath();ctx.arc(b.x,b.y,b.radius,0,Math.PI*2);ctx.fill();ctx.strokeStyle='rgba(255,220,230,.8)';ctx.lineWidth=1;ctx.stroke()}for(const m of state.missiles){ctx.fillStyle='#ffd166';ctx.fillRect(m.x-3,m.y-9,6,15);ctx.fillStyle='#ff7b57';ctx.fillRect(m.x-2,m.y+6,4,8)}}
  function drawPowerups(){const l={weapon:'W',shield:'S',rapid:'R',missile:'M'};for(const q of state.powerups){ctx.save();ctx.translate(q.x,q.y);ctx.rotate(q.spin);ctx.fillStyle='rgba(8,29,50,.92)';ctx.strokeStyle=q.type==='weapon'?'#63d8ff':q.type==='shield'?'#66f2b4':q.type==='rapid'?'#ffd166':'#ff9e72';ctx.fillRect(-10,-10,20,20);ctx.strokeRect(-10,-10,20,20);ctx.rotate(-q.spin);ctx.fillStyle='#fff';ctx.font='bold 11px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(l[q.type],0,0);ctx.restore()}}
  function drawDefendTarget(){const t=state.defendTarget;if(!t)return;ctx.save();ctx.translate(t.x,t.y);ctx.fillStyle='#2d5f70';ctx.strokeStyle='#8fe8ff';ctx.beginPath();ctx.moveTo(0,-30);ctx.lineTo(20,-8);ctx.lineTo(28,18);ctx.lineTo(0,26);ctx.lineTo(-28,18);ctx.lineTo(-20,-8);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#66f2b4';ctx.fillRect(-28,34,56*clamp(t.hull/t.maxHull,0,1),4);ctx.restore()}
  function drawParticles(){for(const q of state.particles){ctx.globalAlpha=clamp(q.life/q.maxLife,0,1);ctx.fillStyle=q.color;ctx.fillRect(q.x,q.y,q.size,q.size)}ctx.globalAlpha=1}
  function draw(){
    if(!state.viewWidth)return;drawBackground();
    if(['playing','result','pause'].includes(state.mode)){drawDefendTarget();for(const e of state.enemies)drawEnemy(e);drawPowerups();drawProjectiles();drawPlayer();drawParticles()}
    else{const t=state.elapsed,x=state.viewWidth*.5+Math.sin(t*.45)*Math.min(130,state.viewWidth*.22),y=state.viewHeight*.62+Math.sin(t*.7)*12;ctx.save();ctx.translate(x,y);ctx.globalAlpha=.42;ctx.strokeStyle='#70dbff';ctx.fillStyle='#123c62';ctx.beginPath();ctx.moveTo(0,-28);ctx.lineTo(15,6);ctx.lineTo(34,16);ctx.lineTo(8,15);ctx.lineTo(0,26);ctx.lineTo(-8,15);ctx.lineTo(-34,16);ctx.lineTo(-15,6);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();ctx.globalAlpha=1}
  }

  function togglePause(){if(!['playing','pause'].includes(state.mode))return;if(state.mode==='playing'){state.mode='pause';state.input.firing=false;showOnly(ui.pauseScreen);ui.touchControls.classList.add('hidden')}else{state.mode='playing';showOnly(null);ui.touchControls.classList.toggle('hidden',!isTouchLikely());state.lastTime=performance.now()}}
  function frame(t){const dt=clamp(state.lastTime?(t-state.lastTime)/1000:0,0,.034);state.lastTime=t;state.elapsed+=dt;updateStars(dt);if(state.mode==='playing')updateMission(dt);draw();requestAnimationFrame(frame)}

  function updateJoystick(e){const r=ui.joystick.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,rad=r.width*.34;let dx=e.clientX-cx,dy=e.clientY-cy,l=Math.hypot(dx,dy);if(l>rad){dx=dx/l*rad;dy=dy/l*rad}state.input.x=clamp(dx/rad,-1,1);state.input.y=clamp(dy/rad,-1,1);ui.joystickKnob.style.transform=`translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`}
  ui.joystick.addEventListener('pointerdown',e=>{if(state.touch.joystickId!==null)return;state.touch.joystickId=e.pointerId;ui.joystick.setPointerCapture(e.pointerId);updateJoystick(e)});
  ui.joystick.addEventListener('pointermove',e=>{if(e.pointerId===state.touch.joystickId)updateJoystick(e)});
  const endJoy=e=>{if(e.pointerId!==state.touch.joystickId)return;state.touch.joystickId=null;state.input.x=state.input.y=0;ui.joystickKnob.style.transform='translate(-50%, -50%)'};
  ui.joystick.addEventListener('pointerup',endJoy);ui.joystick.addEventListener('pointercancel',endJoy);
  ui.fireButton.addEventListener('pointerdown',e=>{if(state.touch.fireId!==null)return;state.touch.fireId=e.pointerId;ui.fireButton.setPointerCapture(e.pointerId);ui.fireButton.classList.add('is-held');state.input.firing=true;if(state.player)state.player.burstShots=Math.max(state.player.burstShots,3)});
  const endFire=e=>{if(e.pointerId!==state.touch.fireId)return;state.touch.fireId=null;ui.fireButton.classList.remove('is-held');state.input.firing=false};
  ui.fireButton.addEventListener('pointerup',endFire);ui.fireButton.addEventListener('pointercancel',endFire);ui.specialButton.addEventListener('click',fireMissile);

  canvas.addEventListener('pointermove',e=>{if(!isFinePointer()||e.pointerType==='touch'||state.mode!=='playing')return;const r=canvas.getBoundingClientRect();state.mouse.active=true;state.mouse.targetX=clamp(e.clientX-r.left,22,r.width-22)});
  canvas.addEventListener('pointerenter',e=>{if(isFinePointer()&&e.pointerType!=='touch')state.mouse.active=true});
  canvas.addEventListener('pointerleave',()=>{state.mouse.active=false});
  canvas.addEventListener('pointerdown',e=>{
    if(!isFinePointer()||e.pointerType==='touch'||state.mode!=='playing')return;
    if(e.button===2){e.preventDefault();fireMissile()}
  });
  canvas.addEventListener('contextmenu',e=>{if(isFinePointer())e.preventDefault()});

  addEventListener('keydown',e=>{
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();
    if(e.code==='KeyP'||e.code==='Escape'){e.preventDefault();togglePause();return}
    if(e.code==='KeyE'&&!e.repeat)fireMissile();
    if(e.code==='Space'&&!e.repeat&&state.player)state.player.burstShots=Math.max(state.player.burstShots,3);
    state.keyboard.add(e.code);
  });
  addEventListener('keyup',e=>state.keyboard.delete(e.code));
  addEventListener('blur',()=>{state.keyboard.clear();state.mouse.active=false;if(state.mode==='playing')togglePause()});
  addEventListener('resize',resizeCanvas);

  ui.startButton.addEventListener('click',()=>prepareBriefing(save.currentMissionId||'m1'));
  ui.hangarButton.addEventListener('click',()=>openHangar('menu'));ui.launchButton.addEventListener('click',launchMission);ui.skipButton.addEventListener('click',launchMission);
  ui.hangarContinueButton.addEventListener('click',closeHangar);ui.hangarResetButton.addEventListener('click',()=>{save=defaultSave();persistSave();renderHangar();showToast('Save reset')});
  ui.resultContinueButton.addEventListener('click',()=>prepareBriefing(save.currentMissionId));ui.resultHangarButton.addEventListener('click',()=>openHangar('result'));ui.resumeButton.addEventListener('click',togglePause);

  document.title=`Space Fighters v${VERSION}`;resizeCanvas();requestAnimationFrame(frame);
})();
