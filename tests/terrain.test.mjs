import test from 'node:test';
import assert from 'node:assert/strict';
import {CampaignGame} from '../src/campaign.js';
import {W} from '../src/engine.js';
const create=(stage=0,character='kairo')=>{const g=new CampaignGame({stage,character,progress:{completed:['nyra']},random:()=>.5});g.phase='fight';return g;};
const tick=(g,seconds,inputs=[])=>{for(let i=0;i<seconds*120;i++){g.freeze=0;g.update(1/120,inputs);}};
test('all campaign stages have long worlds, varied ground and reachable platforms',()=>{
 for(let i=0;i<9;i++){const g=create(i);assert.ok(g.width>W*2);assert.ok(new Set(g.terrain.ground.map(p=>p.y)).size>=3);for(const p of g.terrain.platforms)assert.ok(g.groundAt(p.x+p.width/2)-p.y<190);}
});
test('distant enemies and bosses remain still without casting, then wake on approach',()=>{
 for(const stage of [0,2]){const g=create(stage),f=g.fighters[1],x=f.x;tick(g,5);assert.equal(f.x,x);assert.equal(f.awake,false);assert.equal(f.cast,null);g.fighters[0].x=x-350;tick(g,.2);assert.equal(f.awake,true);assert.notEqual(f.x,x);}
});
test('a ranged hit wakes only the struck distant enemy',()=>{
 const g=create(7),f=g.fighters[2];g.hit(g.fighters[0],f,1,{direct:false,knock:0});assert.equal(f.awake,true);assert.equal(g.fighters[1].awake,false);tick(g,.5);assert.ok(f.x<f.previousX);
});
test('jump passes through a platform from below, lands on top, and can jump again',()=>{
 const g=create(),f=g.fighters[0],p=g.terrain.platforms[0];g.fighters.slice(1).forEach(e=>e.x=g.width-100);f.x=p.x+80;g.action(0,'jump');tick(g,.3);assert.ok(f.y<p.y);tick(g,.6);assert.equal(f.y,p.y);assert.ok(g.grounded(f));assert.equal(g.action(0,'jump'),true);tick(g,.1);assert.ok(f.y<p.y-30);
});
test('walking off a platform falls to the ground; slopes keep feet planted',()=>{
 const g=create(),f=g.fighters[0];g.fighters.slice(1).forEach(e=>e.x=g.width-100);Object.assign(f,{x:1000,y:505,vy:0});tick(g,.8,[{move:1}]);assert.equal(f.y,g.groundAt(f.x));Object.assign(f,{x:1300,y:g.groundAt(1300),vy:0});tick(g,.7,[{move:1}]);assert.equal(f.y,g.groundAt(f.x));assert.ok(g.grounded(f));
});
test('camera follows travel beyond the old arena and stays inside stage boundaries',()=>{
 const g=create(),f=g.fighters[0];g.fighters.slice(1).forEach(e=>e.x=60);f.x=2000;tick(g,.5,[{move:1}]);assert.ok(f.x>W);assert.ok(g.cameraX>1000);assert.ok(f.x-g.cameraX<650);f.x=g.width-60;tick(g,2);assert.ok(g.cameraX<=g.width-W);
});
for(const character of ['kairo','vex','nyra'])test(character+' dash, slam and ultimate work beyond the first screen',()=>{
 for(const slot of [0,3,4]){const g=create(6,character),[f,t]=g.fighters;g.fighters.slice(2).forEach(e=>e.x=80);Object.assign(f,{x:3300,y:g.groundAt(3300),meter:100});Object.assign(t,{x:3430,y:g.groundAt(3430),hp:10000,maxHp:10000,aiClock:1000});assert.ok(g.action(0,slot));tick(g,5);assert.ok(t.hp<10000,slot);assert.ok(f.x>W,slot);assert.ok(Number.isFinite(f.y));}
});
test('platform defenders take slam damage and remain above the terrain',()=>{
 const g=create(),[f,t]=g.fighters;Object.assign(f,{x:760,y:505});Object.assign(t,{x:920,y:505,hp:1000,maxHp:1000,aiClock:1000});g.action(0,3);tick(g,1.1);assert.ok(t.hp<1000);assert.equal(f.y,505);
});
test('creature floor attacks hit a platform occupant but can be jumped over',()=>{
 for(const jump of [false,true]){const g=create(),[f,t]=g.fighters;Object.assign(f,{x:800,y:505});Object.assign(t,{x:970,y:505,enemyType:'kairo-2',aiClock:1000});g.action(1,'pulse');tick(g,.35);if(jump)g.action(0,'jump');tick(g,.42);assert.equal(f.hp===f.maxHp,jump);}
});
test('boss special clashes keep both combatants in the scrolled part of the world',()=>{
 const g=create(8),[f,t]=g.fighters;Object.assign(f,{x:3100,y:644,meter:100});Object.assign(t,{x:3350,y:644,meter:100,aiClock:1000});g.action(1,4);tick(g,.2);g.action(0,3);assert.equal(g.clash?.kind,'sky');for(let i=0;i<600;i++){tick(g,1/120);assert.ok(f.x>2000&&t.x>2000);}assert.equal(g.clash,null);
});
test('remote kills cannot skip the rest of the terrain, and walking through the gate advances just one level',()=>{
 const g=create(),hero=g.fighters[0],saved=[];g.onEvent=e=>{if(e.type==='campaignProgress')saved.push(e);};hero.hp=17;
 for(const enemy of g.fighters.slice(1))g.hit(hero,enemy,10000,{direct:false});
 tick(g,5);assert.equal(g.stageIndex,0);assert.equal(g.phase,'fight');assert.equal(saved.length,0);assert.equal(hero.hp,17);
 for(let i=0;i<2400&&g.phase==='fight';i++)tick(g,1/120,[{move:1}]);
 assert.equal(g.phase,'roundEnd');assert.equal(hero.hp,hero.maxHp);tick(g,2.6);
 assert.equal(g.stageIndex,1);assert.equal(saved.length,1);assert.equal(saved[0].nextStage,1);assert.equal(g.fighters[0].hp,g.fighters[0].maxHp);
 g.prepareRound();assert.equal(g.stageIndex,1,'a repeated transition cannot skip a stage');
});
test('the exit stays locked while any enemy survives, including a sleeping enemy behind the player',()=>{
 const g=create(),hero=g.fighters[0];hero.x=g.exitX;hero.y=g.groundAt(hero.x);g.finishRound();tick(g,.2);
 assert.equal(g.phase,'fight');assert.equal(g.exitOpen,false);assert.equal(g.stageIndex,0);
});
test('campaign specials cannot teleport to a selected enemy multiple screens away or spend energy doing so',()=>{
 for(const character of ['kairo','vex','nyra','ronin'])for(const slot of [3,4]){
  const g=new CampaignGame({character,progress:{completed:['nyra','ronin']},stage:6});g.phase='fight';const hero=g.fighters[0];hero.meter=100;hero.targetId=g.fighters.at(-1).id;
  assert.equal(g.action(0,slot),false,character+' '+slot);assert.equal(hero.motion,null);assert.equal(hero.cooldowns[slot],0);assert.equal(hero.meter,100);
  assert.equal(g.fighters.at(-1).awake,false);assert.equal(hero.x,260);
 }
});
test('an unfinished cinematic cannot trigger a level transition by crossing the exit in midair',()=>{
 const g=create(),hero=g.fighters[0];for(const enemy of g.fighters.slice(1))g.hit(hero,enemy,10000);
 g.path(hero,[{t:.5,x:g.exitX,y:300},{t:1,x:g.exitX-300,y:644}],1);hero.lock=1;tick(g,.6);assert.equal(g.phase,'fight');assert.equal(g.stageIndex,0);
});
test('regular campaign creatures survive a basic chain and hit substantially harder',()=>{
 const g=create(),[hero,enemy]=g.fighters;
 assert.equal(enemy.maxHp,80);assert.ok(enemy.maxHp>11+11+16);
 g.hit(enemy,hero,16,{knock:0,stun:0});assert.ok(hero.maxHp-hero.hp>=8.7);
});
