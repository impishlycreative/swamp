(() => {
  'use strict';
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const leftHud = document.getElementById('left');
  const rightHud = document.getElementById('right');
  const message = document.getElementById('message');
  const TAU = Math.PI * 2;
  const keys = new Set();
  let W = 1280, H = 720, dpr = 1, last = performance.now(), msgTimer = 0;

  const req = { fluxRing:3, gravCore:2, capacitor:4, cryoPump:2, phaseCPU:1 };
  const labels = { fluxRing:'Flux Rings', gravCore:'Gravitic Cores', capacitor:'Supercapacitors', cryoPump:'Cryo Pumps', phaseCPU:'Phase Computer', exoticCell:'Exotic Cells' };
  const state = {
    score:0, wave:1, kills:0, slingBuilt:false, slingCharges:0, planetUnlocked:false, win:false,
    inv:{fluxRing:0,gravCore:0,capacitor:0,cryoPump:0,phaseCPU:0,exoticCell:0},
    stars:[], asteroids:[], enemies:[], lasers:[], salvage:[], particles:[], planet:null
  };

  const ship = { x:W*.5, y:H*.55, vx:0, vy:0, a:-Math.PI/2, r:13, hp:100, grapple:null, tether:130, laserCd:0 };
  const beacon = { x:W*.5, y:H*.5, r:30 };

  const rand = (a,b)=>a+Math.random()*(b-a);
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const wrap=o=>{ if(o.x<-60)o.x=W+60; if(o.x>W+60)o.x=-60; if(o.y<-60)o.y=H+60; if(o.y>H+60)o.y=-60; };
  function resize(){ dpr=Math.min(devicePixelRatio||1,2); W=innerWidth; H=innerHeight; canvas.width=W*dpr; canvas.height=H*dpr; canvas.style.width=W+'px'; canvas.style.height=H+'px'; ctx.setTransform(dpr,0,0,dpr,0,0); beacon.x=W*.5; beacon.y=H*.5; }
  addEventListener('resize', resize); resize();

  function say(t, seconds=2.5){ message.textContent=t; message.classList.add('show'); msgTimer=seconds; }
  function burst(x,y,n=24,s=160){ for(let i=0;i<n;i++){ const a=rand(0,TAU),v=rand(20,s); state.particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:rand(.3,1.1),max:1.1}); } }
  function initStars(){ state.stars=Array.from({length:160},()=>({x:Math.random(),y:Math.random(),z:rand(.2,1)})); }
  function spawnAsteroid(){ const edge=Math.floor(rand(0,4)); let x,y; if(edge===0){x=-30;y=rand(0,H)} else if(edge===1){x=W+30;y=rand(0,H)} else if(edge===2){x=rand(0,W);y=-30}else{x=rand(0,W);y=H+30}; const r=rand(18,38); state.asteroids.push({x,y,vx:rand(-38,38),vy:rand(-38,38),r,mass:r*r*.12,spin:rand(-.8,.8),rot:rand(0,TAU),rel:false,trail:0}); }
  function spawnEnemy(type){
    const side=Math.random()<.5?-1:1, x=side<0?-80:W+80, y=rand(80,H-80);
    if(type==='station') state.enemies.push({type,x,y,vx:-side*10,vy:rand(-5,5),r:46,hp:520,max:520,score:1600});
    else state.enemies.push({type:'cruiser',x,y,vx:-side*rand(20,42),vy:rand(-12,12),r:30,hp:240,max:240,score:700});
  }
  function spawnPlanet(){ state.planet={x:W*.78,y:H*.48,r:96,hp:2400,max:2400,damage:0,disrupted:false,marks:[]}; state.planetUnlocked=true; say('PLANETARY TARGET ACQUIRED — relativistic strike recommended',4); }
  function reset(){
    Object.assign(state,{score:0,wave:1,kills:0,slingBuilt:false,slingCharges:0,planetUnlocked:false,win:false,planet:null});
    state.inv={fluxRing:0,gravCore:0,capacitor:0,cryoPump:0,phaseCPU:0,exoticCell:0}; state.asteroids=[];state.enemies=[];state.lasers=[];state.salvage=[];state.particles=[];
    Object.assign(ship,{x:W*.5,y:H*.7,vx:0,vy:0,a:-Math.PI/2,hp:100,grapple:null,tether:130,laserCd:0});
    for(let i=0;i<9;i++)spawnAsteroid(); spawnEnemy('cruiser'); spawnEnemy('cruiser'); spawnEnemy('station'); say('DRAG_EM: use the field as ammunition',3.5);
  }
  initStars(); reset();

  function nearestAsteroid(){ let best=null,bd=220; for(const a of state.asteroids){ const d=dist(ship,a); if(d<bd && !a.rel){best=a;bd=d;} } return best; }
  function grapple(){ if(ship.grapple){ ship.grapple=null; say('Grapple released'); return; } const a=nearestAsteroid(); if(a){ship.grapple=a;ship.tether=clamp(dist(ship,a),80,220);say('Asteroid tethered');} else say('No asteroid in grapple range'); }
  function canBuild(){ return Object.entries(req).every(([k,v])=>state.inv[k]>=v); }
  function atBeacon(){ return dist(ship,beacon)<80; }
  function buildSling(){
    if(state.slingBuilt){ say('Relativistic Sling Array already assembled'); return; }
    if(!atBeacon()){ say('Return to fabrication beacon to assemble the Sling Array'); return; }
    if(!canBuild()){ say('Missing rare Sling Array components'); return; }
    for(const [k,v] of Object.entries(req)) state.inv[k]-=v;
    state.slingBuilt=true; say('RELATIVISTIC SLING ARRAY ONLINE',4); burst(beacon.x,beacon.y,50,220);
  }
  function loadCharge(){
    if(!state.slingBuilt) return;
    while(state.inv.exoticCell>=3){ state.inv.exoticCell-=3; state.slingCharges++; }
  }
  function fireRelativistic(){
    loadCharge();
    if(!state.slingBuilt){ say('Build the Relativistic Sling Array first'); return; }
    if(state.slingCharges<1){ say('Relativistic shot requires 3 Exotic Cells'); return; }
    if(!ship.grapple){ say('Grapple an asteroid before charging a relativistic shot'); return; }
    const a=ship.grapple; ship.grapple=null; state.slingCharges--;
    const speed=1900; a.rel=true; a.vx=Math.cos(ship.a)*speed; a.vy=Math.sin(ship.a)*speed; a.trail=1;
    say('RELATIVISTIC RELEASE — simulated 0.33c',3); burst(a.x,a.y,60,320);
  }

  function shoot(){ if(ship.laserCd>0)return; ship.laserCd=.16; const sp=560; state.lasers.push({x:ship.x+Math.cos(ship.a)*18,y:ship.y+Math.sin(ship.a)*18,vx:ship.vx+Math.cos(ship.a)*sp,vy:ship.vy+Math.sin(ship.a)*sp,life:1.2}); }
  function dropSalvage(e, asteroidKill){
    const count=e.type==='station'?7:3;
    const pool=['fluxRing','gravCore','capacitor','cryoPump','phaseCPU'];
    for(let i=0;i<count;i++){
      let type=pool[Math.floor(rand(0,pool.length))];
      if(!asteroidKill && Math.random()<.72) type='capacitor';
      if(e.type==='station' && asteroidKill && Math.random()<.35) type='exoticCell';
      state.salvage.push({x:e.x+rand(-20,20),y:e.y+rand(-20,20),vx:rand(-30,30),vy:rand(-30,30),r:7,type});
    }
    if(e.type==='station' && asteroidKill){ state.salvage.push({x:e.x,y:e.y,vx:20,vy:-10,r:7,type:'exoticCell'}); }
  }
  function damageEnemy(e, amount, asteroidKill=false){ e.hp-=amount; if(e.hp<=0){ state.score+=e.score;state.kills++;dropSalvage(e,asteroidKill);burst(e.x,e.y,50,260);e.dead=true; if(state.kills%3===0){state.wave++; spawnEnemy('station');spawnEnemy('cruiser');} if(state.wave>=4&&!state.planetUnlocked)spawnPlanet(); } }
  function hitPlanet(a){
    if(!state.planet || state.planet.disrupted)return;
    const p=state.planet;
    if(a.rel){ p.hp=0;p.damage=3;p.disrupted=true;state.win=true;state.score+=25000;burst(p.x,p.y,180,520);say('PLANETARY DISRUPTION — TARGET NO LONGER COHERENT',6); }
    else { const power=Math.max(120,Math.hypot(a.vx,a.vy)*a.mass*.012); p.hp-=power;p.damage=clamp(p.damage+1,0,2);p.marks.push({x:rand(-45,45),y:rand(-40,40),r:rand(8,20)});burst(a.x,a.y,60,300);say('Planetary impact: oceans, atmosphere and crust destabilized',3); if(p.hp<=0){p.damage=2;state.score+=8000;say('Surface civilization eliminated — deep refuges may remain',5);} }
    a.dead=true;
  }

  addEventListener('keydown',e=>{ if(['Space','KeyW','KeyS','KeyA','KeyD','KeyQ','KeyE','KeyR','KeyF'].includes(e.code))e.preventDefault(); keys.add(e.code); if(e.repeat)return; if(e.code==='KeyG')grapple(); if(e.code==='Space')shoot(); if(e.code==='KeyB')buildSling(); if(e.code==='KeyX')fireRelativistic(); if(e.code==='KeyN')reset(); });
  addEventListener('keyup',e=>keys.delete(e.code));

  function update(dt){
    if(msgTimer>0){msgTimer-=dt;if(msgTimer<=0)message.classList.remove('show');}
    ship.laserCd=Math.max(0,ship.laserCd-dt);
    const turn=2.7; if(keys.has('KeyA'))ship.a-=turn*dt;if(keys.has('KeyD'))ship.a+=turn*dt;
    const thrust=190; if(keys.has('KeyW')){ship.vx+=Math.cos(ship.a)*thrust*dt;ship.vy+=Math.sin(ship.a)*thrust*dt;} if(keys.has('KeyS')){ship.vx-=Math.cos(ship.a)*thrust*.55*dt;ship.vy-=Math.sin(ship.a)*thrust*.55*dt;}
    if(keys.has('KeyQ')){ship.vx+=Math.cos(ship.a-Math.PI/2)*thrust*.7*dt;ship.vy+=Math.sin(ship.a-Math.PI/2)*thrust*.7*dt;} if(keys.has('KeyE')){ship.vx+=Math.cos(ship.a+Math.PI/2)*thrust*.7*dt;ship.vy+=Math.sin(ship.a+Math.PI/2)*thrust*.7*dt;}
    const s=Math.hypot(ship.vx,ship.vy), max=270; if(s>max){ship.vx*=max/s;ship.vy*=max/s;} ship.vx*=Math.pow(.994,dt*60);ship.vy*=Math.pow(.994,dt*60);ship.x+=ship.vx*dt;ship.y+=ship.vy*dt;wrap(ship);
    if(keys.has('Space'))shoot(); if(ship.grapple){ if(keys.has('KeyR'))ship.tether=Math.max(60,ship.tether-65*dt); if(keys.has('KeyF'))ship.tether=Math.min(250,ship.tether+65*dt); }

    for(const a of state.asteroids){ a.x+=a.vx*dt;a.y+=a.vy*dt;a.rot+=a.spin*dt;if(!a.rel)wrap(a); if(a.rel && (a.x<-300||a.x>W+300||a.y<-300||a.y>H+300))a.dead=true; }
    if(ship.grapple && !ship.grapple.dead){ const a=ship.grapple,dx=a.x-ship.x,dy=a.y-ship.y,d=Math.max(1,Math.hypot(dx,dy)); const stretch=d-ship.tether; const k=.72; const f=stretch*k; const nx=dx/d,ny=dy/d; a.vx-=nx*f*dt*(100/a.mass);a.vy-=ny*f*dt*(100/a.mass);ship.vx+=nx*f*dt*.12;ship.vy+=ny*f*dt*.12; } else ship.grapple=null;

    for(const l of state.lasers){l.x+=l.vx*dt;l.y+=l.vy*dt;l.life-=dt;}
    for(const e of state.enemies){e.x+=e.vx*dt;e.y+=e.vy*dt;wrap(e);}
    for(const s of state.salvage){s.x+=s.vx*dt;s.y+=s.vy*dt;s.vx*=.995;s.vy*=.995;wrap(s);if(dist(ship,s)<26){state.inv[s.type]++;s.dead=true;say('Recovered '+labels[s.type],1.2);}}
    for(const p of state.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.985;p.vy*=.985;p.life-=dt;}

    for(const l of state.lasers){ for(const e of state.enemies){if(!e.dead&&Math.hypot(l.x-e.x,l.y-e.y)<e.r){damageEnemy(e,22,false);l.life=0;break;}} if(state.planet&&!state.planet.disrupted&&Math.hypot(l.x-state.planet.x,l.y-state.planet.y)<state.planet.r){state.planet.hp-=3;l.life=0;} }
    for(const a of state.asteroids){
      for(const e of state.enemies){ if(!e.dead&&Math.hypot(a.x-e.x,a.y-e.y)<a.r+e.r){ const speed=Math.hypot(a.vx,a.vy); const dmg=a.rel?99999:Math.max(50,speed*a.mass*.018); damageEnemy(e,dmg,true); const nx=(a.x-e.x)/(Math.hypot(a.x-e.x,a.y-e.y)||1),ny=(a.y-e.y)/(Math.hypot(a.x-e.x,a.y-e.y)||1);a.vx+=nx*80;e.vx-=nx*12;burst(a.x,a.y,a.rel?70:20,a.rel?420:160);if(a.rel)a.dead=true; } }
      if(state.planet&&!a.dead&&Math.hypot(a.x-state.planet.x,a.y-state.planet.y)<a.r+state.planet.r) hitPlanet(a);
    }
    for(const e of state.enemies){ if(Math.hypot(ship.x-e.x,ship.y-e.y)<ship.r+e.r){ship.hp-=22*dt;} }
    if(ship.hp<=0){say('SHIP LOST — press N to restart',999);ship.hp=0;}
    state.lasers=state.lasers.filter(x=>x.life>0);state.enemies=state.enemies.filter(x=>!x.dead);state.salvage=state.salvage.filter(x=>!x.dead);state.asteroids=state.asteroids.filter(x=>!x.dead);state.particles=state.particles.filter(x=>x.life>0);
    while(state.asteroids.length<8)spawnAsteroid(); while(state.enemies.length<Math.min(5,2+state.wave)&&!state.win)spawnEnemy(Math.random()<.25?'station':'cruiser');
    loadCharge();
  }

  function rock(a){ ctx.save();ctx.translate(a.x,a.y);ctx.rotate(a.rot);ctx.beginPath();for(let i=0;i<9;i++){const ang=i/9*TAU,rr=a.r*(.75+.25*Math.sin(i*2.17+3));const x=Math.cos(ang)*rr,y=Math.sin(ang)*rr;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.fillStyle=a.rel?'#fff4c4':'#3a3a3a';ctx.strokeStyle=a.rel?'#ffffff':'#8c8c8c';ctx.lineWidth=a.rel?3:1.4;ctx.fill();ctx.stroke();ctx.restore(); if(a.rel){ctx.strokeStyle='rgba(255,220,150,.75)';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(a.x-a.vx*.12,a.y-a.vy*.12);ctx.stroke();}}
  function drawPlanet(p){
    ctx.save();ctx.translate(p.x,p.y);
    if(p.disrupted){ for(let i=0;i<16;i++){const a=i/16*TAU+performance.now()*.00004,rr=p.r*(.5+(i%4)*.28);ctx.fillStyle=i%3===0?'#ffb45a':'#8d4f37';ctx.beginPath();ctx.arc(Math.cos(a)*rr,Math.sin(a)*rr,8+(i%5)*3,0,TAU);ctx.fill();} ctx.restore();return; }
    const g=ctx.createRadialGradient(-25,-30,10,0,0,p.r);g.addColorStop(0,p.damage===0?'#4fc3ff':'#ffb04a');g.addColorStop(.55,p.damage===0?'#176db0':p.damage===1?'#6f4b2c':'#4b3c35');g.addColorStop(1,'#07111d');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,p.r,0,TAU);ctx.fill();
    if(p.damage===0){ctx.fillStyle='rgba(72,160,84,.82)';const land=[[-38,-12,25,11,.4],[20,-35,22,10,-.3],[34,9,30,13,.6],[-12,35,18,9,-.4],[-50,28,14,7,.1]];for(const [x,y,rx,ry,rot] of land){ctx.beginPath();ctx.ellipse(x,y,rx,ry,rot,0,TAU);ctx.fill();}}
    if(p.damage>=1){ctx.strokeStyle='rgba(255,110,55,.9)';ctx.lineWidth=5;for(const m of p.marks){ctx.beginPath();ctx.arc(m.x,m.y,m.r,0,TAU);ctx.stroke();}ctx.fillStyle='rgba(190,175,165,.22)';ctx.beginPath();ctx.arc(0,0,p.r+12,0,TAU);ctx.fill();}
    ctx.restore();
  }
  function draw(){
    ctx.clearRect(0,0,W,H);ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);
    for(const s of state.stars){ctx.globalAlpha=.25+.75*s.z;ctx.fillStyle='#fff';ctx.fillRect(s.x*W,s.y*H,s.z*1.5,s.z*1.5);}ctx.globalAlpha=1;
    if(state.planet)drawPlanet(state.planet);
    ctx.strokeStyle='rgba(130,245,255,.35)';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(beacon.x,beacon.y,beacon.r+6,0,TAU);ctx.stroke();ctx.beginPath();ctx.arc(beacon.x,beacon.y,beacon.r-8,0,TAU);ctx.stroke();ctx.fillStyle='rgba(130,245,255,.1)';ctx.beginPath();ctx.arc(beacon.x,beacon.y,beacon.r,0,TAU);ctx.fill();
    if(ship.grapple){ctx.strokeStyle='rgba(120,235,255,.8)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(ship.x,ship.y);ctx.lineTo(ship.grapple.x,ship.grapple.y);ctx.stroke();}
    state.asteroids.forEach(rock);
    for(const e of state.enemies){ctx.save();ctx.translate(e.x,e.y);ctx.rotate(Math.atan2(e.vy,e.vx));ctx.fillStyle=e.type==='station'?'#6a445e':'#563a3a';ctx.strokeStyle='#e6a3a3';ctx.lineWidth=2;if(e.type==='station'){ctx.beginPath();ctx.arc(0,0,e.r,0,TAU);ctx.fill();ctx.stroke();ctx.strokeRect(-55,-9,110,18);}else{ctx.beginPath();ctx.moveTo(-e.r,-14);ctx.lineTo(e.r,0);ctx.lineTo(-e.r,14);ctx.closePath();ctx.fill();ctx.stroke();}ctx.restore();ctx.fillStyle='#351414';ctx.fillRect(e.x-e.r,e.y-e.r-10,e.r*2,4);ctx.fillStyle='#ff7777';ctx.fillRect(e.x-e.r,e.y-e.r-10,e.r*2*(e.hp/e.max),4);}
    for(const l of state.lasers){ctx.strokeStyle='#69eaff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(l.x,l.y);ctx.lineTo(l.x-l.vx*.03,l.y-l.vy*.03);ctx.stroke();}
    for(const s of state.salvage){ctx.fillStyle=s.type==='exoticCell'?'#f2d96b':'#9ac9d1';ctx.strokeStyle='#fff';ctx.beginPath();ctx.rect(s.x-5,s.y-5,10,10);ctx.fill();ctx.stroke();}
    for(const p of state.particles){ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.fillStyle='#ffb36a';ctx.fillRect(p.x,p.y,2,2);}ctx.globalAlpha=1;
    ctx.save();ctx.translate(ship.x,ship.y);ctx.rotate(ship.a);ctx.strokeStyle='#d9ffff';ctx.fillStyle='#0d252b';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(18,0);ctx.lineTo(-12,-10);ctx.lineTo(-7,0);ctx.lineTo(-12,10);ctx.closePath();ctx.fill();ctx.stroke();if(keys.has('KeyW')){ctx.strokeStyle='#ffb15e';ctx.beginPath();ctx.moveTo(-10,-5);ctx.lineTo(-23,0);ctx.lineTo(-10,5);ctx.stroke();}ctx.restore();
    updateHud();
  }
  function updateHud(){
    const build=state.slingBuilt?'<span class="good">ONLINE</span>':(canBuild()?'<span class="good">READY — return to beacon and press B</span>':'INCOMPLETE');
    leftHud.innerHTML=`<div class="title">DRAG_EM</div><div>Hull ${Math.ceil(ship.hp)}% · Score ${state.score} · Wave ${state.wave}</div><div>Grapple ${ship.grapple?'LOCKED':'idle'} · Tether ${Math.round(ship.tether)}</div><div>Relativistic Sling ${build} · Loaded shots ${state.slingCharges}</div>`;
    const parts=Object.keys(req).map(k=>`${labels[k]} ${state.inv[k]}/${req[k]}`).join(' · ');
    rightHud.innerHTML=`<div>${parts}</div><div>Exotic Cells ${state.inv.exoticCell} <span class="muted">(3 per shot)</span></div><div class="muted">Rare parts drop best from asteroid-killed heavy targets.</div>${state.planet?`<div>Planetary target: ${state.planet.disrupted?'<span class="bad">DISRUPTED</span>':Math.max(0,Math.ceil(state.planet.hp))+' integrity'}</div>`:''}`;
  }

  function loop(now){const dt=Math.min(.033,(now-last)/1000);last=now;if(ship.hp>0&&!state.win)update(dt);else{if(msgTimer>0){msgTimer-=dt;if(msgTimer<=0)message.classList.remove('show');}}draw();requestAnimationFrame(loop);} requestAnimationFrame(loop);
})();
