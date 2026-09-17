import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,fighter,resolveRound,FLOOR,MAX_HEALTH,ACTIVE_SKILLS,CHARACTERS,SKILL_RECOVERY} from '../src/engine.js';
import {CLIPS} from '../src/animation.js';
function active(character='kairo',tier=1){const events=[],g=new Game({character,mode:'local',onEvent:e=>events.push(e)});g.phase='fight';g.events=events;g.fighters.forEach((f,i)=>{f.x=500+i*100;f.tier=tier;f.maxHp=MAX_HEALTH[tier-1];f.hp=f.maxHp;});return g;}
// Ignore cosmetic hit-stop to inspect exact combat timelines.
function advance(g,seconds,inputs=[{},{}]){for(let i=0;i<Math.ceil(seconds*120);i++){g.freeze=0;g.update(1/120,inputs);}}

test('basic attacks are unavailable for both fighters at every tier; guard still works',()=>{
  for(const character of ['kairo','vex'])for(let tier=1;tier<=4;tier++){const g=active(character,tier);for(const id of [0,1])assert.equal(g.action(id,'attack'),false);advance(g,.3,[{guard:true},{guard:true}]);assert.ok(g.fighters.every(f=>f.guard));assert.ok(g.fighters.every(f=>f.hp===f.maxHp));}
});
test('a winning shield throws the attacker over 400 world units away',()=>{
  const g=active(),[d,a]=g.fighters;g.action(0,2);g.hit(a,d,10);advance(g,1.04);const x=a.x;advance(g,.5);assert.ok(a.x-x>400);assert.ok(a.down>0);assert.equal(d.hp,d.maxHp);
});

for(const tier of [1,2])test(`Kairo form ${tier} ultimate confirms into restraint and deals stronger combo damage`,()=>{
  const g=active('kairo',tier),[f,t]=g.fighters,hp=t.hp;f.meter=100;g.action(0,4);advance(g,.75);
  assert.equal(t.capture?.kind,'storm-severance');
  for(const action of ['dash','jump','attack',0,2,3,4])assert.equal(g.action(1,action),false);
  advance(g,.5,[{},{move:1,guard:true}]);assert.ok(t.capture);assert.ok(t.y<FLOOR);
  advance(g,tier===1?1:1.8);assert.equal(t.capture,null);assert.ok(t.down>0);assert.equal(t.y,FLOOR);
  assert.ok(Math.abs(hp-t.hp-(tier===1?74:92)*g.power(f))<.001);assert.equal(g.events.some(e=>e.kind==='stormBlade'),tier===2);assert.equal(g.events.some(e=>e.kind==='stormCross'),tier===2);advance(g,1.5);assert.equal(t.stun,0);
});
test('Storm Severance still misses an enemy outside its reach',()=>{
  const g=active(),[f,t]=g.fighters;f.x=100;t.x=1350;f.meter=100;f.moveDir=-1;g.action(0,4);advance(g,4);assert.equal(t.capture,null);assert.equal(t.hp,t.maxHp);
});
test('early Raijin Draw respects invulnerability and armor',()=>{
  for(const immune of ['invuln','armor']){const g=active(),[f,t]=g.fighters;f.meter=100;t[immune]=3;g.action(0,4);advance(g,1.7);assert.equal(t.capture,null);assert.equal(t.hp,t.maxHp-(immune==='armor'?74:0));}
});
for(let tier=1;tier<=4;tier++)for(const slot of tier===4?[0]:[0,4])test(`Kairo tier ${tier} slot ${slot} connects throughout the dash in either direction at 30 FPS`,()=>{
  const reach=slot===4?650:tier===4?590:270+(tier-1)*65;
  for(const dir of [-1,1])for(const distance of [90,220,reach-30]){
    const g=active('kairo',tier),[f,t]=g.fighters;f.x=720;f.moveDir=dir;f.meter=100;t.x=720+dir*distance;
    g.action(0,slot);for(let i=0;i<120;i++){g.freeze=0;g.update(1/30);}
    assert.ok(t.hp<t.maxHp,`distance ${distance}, direction ${dir}`);
    const hits=g.events.filter(e=>e.type==='damage');assert.equal(hits.length,slot===4?(tier===1?3:tier===2?5:4):tier===4?6:tier>=2?2:1);
    assert.equal(t.capture,null);assert.equal(f.dashContact,null);
  }
});
test('dash catches a moving enemy crossing between frame positions',()=>{
  const g=active('kairo',2),[f,t]=g.fighters;t.x=820;g.path(t,[{t:.3,x:560,y:FLOOR}],.3);g.action(0,0);advance(g,.8);assert.ok(t.hp<t.maxHp);assert.equal(g.events.filter(e=>e.type==='damage').length,2);
});
test('homing dashes retain a finite reach',()=>{
  for(const slot of [0,4]){const g=active(),[f,t]=g.fighters;f.x=100;f.meter=100;t.x=1370;g.action(0,slot);advance(g,4);assert.equal(t.hp,t.maxHp);assert.equal(t.capture,null);}
});
for(const character of ['kairo','vex'])for(let tier=1;tier<=4;tier++)test(`${character} tier ${tier} shield braces in place and blocks oversized damage`,()=>{
  const g=active(character,tier),[f,t]=g.fighters,x=f.x,y=f.y,hp=f.hp;g.action(0,2);g.hit(t,f,1000);
  assert.equal(f.hp,hp);assert.equal(f.animation.name,`${character}-defend-${tier}`);assert.ok(CLIPS[f.animation.name]);
  for(const action of ['dash','jump','attack',0,2,3,4])assert.equal(g.action(0,action),false);
  advance(g,.2,[{move:-1},{}]);assert.equal(f.x,x);assert.equal(f.y,y);g.hit(t,f,1000);assert.equal(f.hp,hp);
  advance(g,1.3);assert.equal(f.shieldReaction,null);assert.equal(f.down,0);assert.equal(f.shield,null);assert.ok(t.down>0);
});
for(const character of ['kairo','vex'])for(let tier=1;tier<=3;tier++)test(`${character} tier ${tier} loses a shield clash to a higher form without damage`,()=>{
  const g=active(character,tier),[f,t]=g.fighters,hp=f.hp,x=f.x;t.tier=tier+1;g.action(0,2);g.hit(t,f,1000);
  assert.ok(f.shieldReaction.losing);assert.equal(f.animation.name,`${character}-defend-lose`);advance(g,.2,[{move:1},{}]);assert.equal(f.x,x);assert.equal(f.hp,hp);
  advance(g,1.3);assert.equal(f.shieldReaction,null);assert.equal(f.shield,null);assert.ok(f.x<x);assert.ok(f.down>0);assert.equal(f.hp,hp);
  advance(g,2);assert.equal(f.down,0);assert.equal(g.action(0,'jump'),true);
});
test('shield reaction waits for an armored slam to finish',()=>{
  const g=active(),[f,t]=g.fighters;g.action(0,2);advance(g,1);g.action(0,3);const serial=f.attackSerial;g.hit(t,f,10);assert.equal(f.attackSerial,serial);assert.ok(f.motion);assert.ok(f.shieldReaction.waiting);advance(g,2.8);assert.equal(f.shieldReaction,null);assert.equal(f.armor,0);
});
test('round end clears shield reactions and pending dash contacts',()=>{
  const g=active(),[f,t]=g.fighters;g.action(0,2);g.hit(t,f,5);g.watchDash(t,f,()=>assert.fail('stale dash'));g.finishRound(0);for(const p of g.fighters){assert.equal(p.shieldReaction,null);assert.equal(p.dashContact,null);}
});
test('all skills face the opponent despite previous movement or facing',()=>{
  for(const character of ['kairo','vex'])for(let tier=1;tier<=4;tier++)for(const slot of ACTIVE_SKILLS){const g=active(character,tier),[f,t]=g.fighters;f.x=800;t.x=600;f.facing=f.moveDir=1;f.meter=100;assert.equal(g.action(0,slot),true);assert.equal(f.facing,-1);}
});
for(let tier=1;tier<=4;tier++)test(`Kairo tier ${tier} homing dash catches an airborne opponent while moving away`,()=>{
  const g=active('kairo',tier),[f,t]=g.fighters;f.moveDir=-1;t.x=650;t.y=480;g.path(t,[{t:1,x:730,y:480}],1);g.action(0,0);advance(g,2.5);assert.ok(t.hp<t.maxHp);assert.equal(f.dashContact,null);
});
test('shield clash freezes both fighters, cooldowns, and scheduled attacks before slow-motion release',()=>{
  const g=active(),[d,a]=g.fighters;g.action(0,2);g.action(1,0);advance(g,.27);assert.ok(g.clash);
  const snapshot=g.fighters.map(f=>({x:f.x,y:f.y,cd:f.cooldowns[2],cast:f.cast?.elapsed})),timer=g.roundTime;let fired=false;g.schedule(.05,()=>{fired=true;});
  for(const id of [0,1])for(const action of ['attack','dash','jump',0,2,3,4])assert.equal(g.action(id,action),false);
  advance(g,.12,[{move:-1},{move:1}]);const poses=g.fighters.map(f=>f.animation.elapsed);advance(g,.04);assert.deepEqual(g.fighters.map(f=>f.animation.elapsed),poses);
  assert.equal(fired,false);assert.equal(g.roundTime,timer);
  assert.deepEqual(g.fighters.map(f=>({x:f.x,y:f.y,cd:f.cooldowns[2],cast:f.cast?.elapsed})),snapshot);
  advance(g,.4);assert.ok(g.fighters.every((f,i)=>f.animation.elapsed>poses[i]));assert.equal(fired,false);
  advance(g,1);assert.equal(g.clash,null);assert.ok(a.down>0);assert.equal(d.hp,d.maxHp);assert.equal(fired,true);
});
test('an armored losing attacker completes its move before clash recoil',()=>{
  const g=active(),[a,d]=g.fighters;d.tier=4;g.action(1,2);g.action(0,3);const serial=a.attackSerial;g.hit(a,d,20);assert.ok(g.clash);advance(g,1.45);assert.equal(a.attackSerial,serial);assert.ok(a.armor>0);assert.ok(a.recoilAfterArmor);advance(g,1.7);assert.equal(a.armor,0);assert.ok(a.down>0);assert.equal(d.hp,d.maxHp);
});
test('round end clears the shared clash and pending recoil',()=>{
  const g=active(),[d,a]=g.fighters;g.action(0,2);g.hit(a,d,5);g.finishRound(0);assert.equal(g.clash,null);assert.ok(g.fighters.every(f=>!f.recoilAfterArmor));advance(g,4);assert.equal(g.clash,null);
});
test('winner heals 40% missing HP; loser gains max health and a full heal',()=>{const fs=[fighter(0,'kairo'),fighter(1,'vex')];fs[0].hp=40;fs[1].hp=0;resolveRound(fs,0);assert.equal(fs[0].hp,104);assert.equal(fs[1].maxHp,260);assert.equal(fs[1].hp,260);});
test('2–0 awakens the loser and 2–2 awakens both with retained winner health',()=>{const fs=[fighter(0,'kairo'),fighter(1,'vex')];resolveRound(fs,0);resolveRound(fs,0);assert.equal(fs[1].tier,4);resolveRound(fs,1);fs[1].hp=20;const end=resolveRound(fs,1);assert.deepEqual(fs.map(f=>f.score),[2,2]);assert.deepEqual(fs.map(f=>f.maxHp),[400,400]);assert.equal(fs[0].hp,400);assert.equal(fs[1].hp,172);assert.equal(end.domain,true);});
test('all possible match sequences honor first-to-three and evolution',()=>{
  function visit(fs){for(const winner of [0,1]){const next=structuredClone(fs);next[winner].hp=35;next[1-winner].hp=0;const result=resolveRound(next,winner);if(result.matchOver){assert.equal(next[winner].score,3);assert.equal(next[winner].hp,35);continue;}assert.equal(next[1-winner].hp,next[1-winner].maxHp);for(const f of next)assert.equal(f.maxHp,MAX_HEALTH[f.tier-1]);if(next.every(f=>f.score===2))assert.equal(result.domain,true);visit(next);}}visit([fighter(0,'kairo'),fighter(1,'vex')]);
});
test('both removed second skills are unavailable at every evolution',()=>{assert.deepEqual(ACTIVE_SKILLS,[0,2,3,4]);for(const char of ['kairo','vex'])for(let tier=1;tier<=4;tier++){const g=active(char,tier);assert.equal(g.action(0,1),false);assert.equal(g.fighters[0].lock,0);assert.equal(CHARACTERS[char].skills[1],null);}});
test('dash remembers movement direction despite automatic enemy-facing',()=>{const g=active();g.setMoveIntent(0,-1);advance(g,.03);assert.equal(g.fighters[0].facing,1);assert.equal(g.action(0,'dash'),true);advance(g,.15);assert.ok(g.fighters[0].x<400);});
test('Flash Cut ignores previous movement and aims at the enemy',()=>{const g=active();g.setMoveIntent(0,-1);g.action(0,0);advance(g,.9);assert.ok(g.fighters[0].x>500);assert.ok(g.fighters[1].hp<200);});
test('Godflash hits from multiple heights and finishes with grounded knockdown',()=>{const g=active('kairo',4),t=g.fighters[1];g.action(0,0);advance(g,.31);assert.ok(t.capture);advance(g,1.35);assert.ok(t.hp<400);assert.equal(t.y,FLOOR);assert.ok(t.down>0);assert.equal(t.capture,null);const dashes=g.events.filter(e=>e.kind==='dashLine');assert.ok(dashes.length>=6);assert.ok(new Set(dashes.map(e=>Math.round(e.toY))).size>=4);});
test('Storm Aegis blocks the front and repels without teleporting',()=>{const g=active(),[f,t]=g.fighters;g.action(0,2);const x=f.x;g.hit(t,f,20);assert.equal(f.hp,200);assert.equal(f.x,x);assert.equal(f.shield.type,'storm');assert.ok(g.clash);advance(g,1.1);assert.ok(t.vx>0);assert.ok(t.down>0);t.attackSerial++;t.x=f.x-100;g.hit(t,f,10);assert.equal(f.hp,190);});
test('awakened lightning mantle also blocks attacks from behind',()=>{const g=active('kairo',4),[f,t]=g.fighters;g.action(0,2);t.x=f.x-100;g.hit(t,f,10);assert.equal(f.hp,400);});
test('Void Bastion absorbs every direction and releases stored damage',()=>{const g=active('vex'),[f,t]=g.fighters;g.action(0,2);t.x=f.x-100;g.hit(t,f,20);assert.equal(f.hp,200);assert.equal(f.shield.stored,20);assert.equal(t.hp,200);advance(g,3.4);t.x=f.x+100;advance(g,.3);assert.equal(f.shield,null);assert.ok(t.hp<200);});
for(const character of ['kairo','vex'])for(let tier=1;tier<=4;tier++)test(`${character} tier ${tier} slam takes damage but resists knockback, stun and capture`,()=>{
  const g=active(character,tier),[f,t]=g.fighters;g.action(0,3);advance(g,.1);const serial=f.attackSerial,motion=f.motion,anim=f.animation.name,hp=f.hp,x=f.x,y=f.y;
  g.hit(t,f,9,{knock:1800,launch:1500,stun:5,down:3});assert.ok(f.hp<hp);assert.equal(f.attackSerial,serial);assert.equal(f.motion,motion);assert.equal(f.animation.name,anim);assert.equal(f.stun,0);assert.equal(f.down,0);assert.equal(f.x,x);assert.equal(f.y,y);assert.equal(g.captureTarget(t,f,1,[{t:1,x:900,y:200}]),false);
  advance(g,tier===4?1.1:.35);assert.ok(f.armor>0);if(tier===4)assert.ok(f.y<=240);
});
test('Zero locks all victim inputs, launches upward and slams a cracked floor',()=>{const g=active('vex',4),[f,t]=g.fighters;g.action(0,3);advance(g,.5);assert.ok(t.capture);for(const action of ['jump','dash','attack',0,2,3,4])assert.equal(g.action(1,action),false);advance(g,.7,[{},{move:1,guard:true}]);assert.ok(t.y<240);assert.ok(f.y<=240);assert.equal(t.guard,false);advance(g,1.05);assert.equal(t.y,FLOOR);assert.ok(t.down>1);assert.ok(t.hp<400);assert.ok(g.events.some(e=>e.kind==='fracture'));});
test('armored enemy resists Zero restraint',()=>{const g=active('vex',4),[f,t]=g.fighters;g.action(1,3);g.action(0,3);advance(g,.5);assert.equal(t.capture,null);assert.ok(t.armor>0);});
test('restraint releases when its unarmored owner is interrupted',()=>{const g=active('kairo',4),[f,t]=g.fighters;g.action(0,0);advance(g,.4);assert.ok(t.capture);g.hit(t,f,10);advance(g,.03);assert.equal(t.capture,null);assert.equal(t.motion,null);assert.equal(t.stun,0);});
test('skills require 0.4 seconds of recovery after the animation',()=>{assert.equal(SKILL_RECOVERY,.4);const g=active();g.action(0,2);advance(g,.52);assert.equal(g.fighters[0].lock,0);assert.equal(g.action(0,3),false);advance(g,.42);assert.equal(g.action(0,3),true);});
test('a hit during an unarmored attack wind-up cancels the strike',()=>{const g=active(),[f,t]=g.fighters;g.action(0,0);assert.equal(t.hp,200);g.hit(t,f,5);advance(g,.6);assert.equal(t.hp,200);assert.equal(f.hp,195);});
for(const character of ['kairo','vex'])test(`${character} ultimate uses meter, its own restraint and releases everyone`,()=>{const g=active(character,4),[f,t]=g.fighters;assert.equal(g.action(0,4),false);f.meter=100;g.action(0,4);assert.equal(f.meter,0);advance(g,1.1);assert.equal(t.capture?.kind,character==='kairo'?'judgement':'singularity');assert.ok(f.y<=260);advance(g,4.9);assert.ok(t.hp<400);assert.equal(t.capture,null);assert.equal(f.motion,null);assert.equal(f.armor,0);assert.equal(f.skillDelay,0);assert.ok(g.events.some(e=>e.kind===(character==='kairo'?'heavenSpear':'supernova')));});
test('round end clears all restraints, cinematic movement and pending damage',()=>{const g=active('vex',4);g.action(0,3);advance(g,.5);assert.ok(g.fighters[1].capture);g.finishRound(1);assert.equal(g.pending.length,0);for(const f of g.fighters){assert.equal(f.capture,null);assert.equal(f.motion,null);assert.equal(f.y,FLOOR);}});
test('every skill at every tier has valid animation and finite movement',()=>{for(const character of ['kairo','vex'])for(let tier=1;tier<=4;tier++)for(const slot of ACTIVE_SKILLS){const g=active(character,tier);g.fighters[0].meter=100;assert.equal(g.action(0,slot),true);assert.ok(CLIPS[g.fighters[0].animation.name]);advance(g,5);for(const f of g.fighters){assert.ok(Number.isFinite(f.x)&&Number.isFinite(f.y));assert.ok(f.y<=FLOOR);assert.ok(f.hp>=0&&f.hp<=f.maxHp);}}});
test('a complete AI match stays finite and awards a winner',()=>{const g=new Game({random:()=>.4});for(let i=0;i<60*600&&g.phase!=='matchEnd';i++){g.freeze=0;g.update(1/60,[{move:Math.sign(g.fighters[1].x-g.fighters[0].x)},{}]);if(i%113===0)g.action(0,0);if(i%197===0)g.action(0,3);if(i%139===0)g.action(0,4);for(const f of g.fighters){assert.ok(Number.isFinite(f.x)&&Number.isFinite(f.hp));assert.ok(f.hp>=0&&f.hp<=f.maxHp);}}assert.equal(g.phase,'matchEnd');assert.ok(g.fighters.some(f=>f.score===3));});
