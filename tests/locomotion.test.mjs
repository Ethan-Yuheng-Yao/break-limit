import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,fighter,FLOOR,W} from '../src/engine.js';
import {CampaignGame} from '../src/campaign.js';
import {bodyGap,separateBodies,creatureMotion} from '../src/locomotion.js';
import {characterPose} from '../src/animation.js';
const tick=(g,s,inputs=[])=>{for(let i=0;i<Math.ceil(s*120);i++){g.freeze=0;g.update(1/120,inputs);}};
function arena(character='kairo',tier=1){const g=new Game({character,mode:'local'});g.phase='fight';g.fighters.forEach((f,i)=>Object.assign(f,{x:500+i*115,tier,hp:1000,maxHp:1000,meter:100}));return g;}

test('six bodies remain separated at either arena wall',()=>{
 for(const edge of [60,W-60]){
  const crowd=Array.from({length:6},(_,i)=>Object.assign(fighter(i,'kairo'),{x:edge,enemyType:i?'vex-'+i%3:undefined}));
  separateBodies(crowd,W);
  for(const f of crowd)assert.ok(f.x>=60&&f.x<=W-60);
  for(let i=1;i<crowd.length;i++)assert.ok(crowd[i].x-crowd[i-1].x>=bodyGap(crowd[i-1],crowd[i])-.02);
 }
});
test('opposing movement and high-speed ground dashes cannot cross through another body',()=>{
 const g=arena(),[a,b]=g.fighters;
 tick(g,1,[{move:1},{move:-1}]);assert.ok(b.x-a.x>=bodyGap(a,b)-.01);
 a.tier=4;g.action(0,'dash');tick(g,.3,[{move:1},{move:-1}]);assert.ok(b.x-a.x>=bodyGap(a,b)-.01);
});
test('campaign crowd stays separated during sustained pursuit and flank hops',()=>{
 const g=new CampaignGame({stage:7,random:()=>.5});g.phase='fight';g.fighters[0].hp=10000;
 for(let i=0;i<2400;i++){
  g.freeze=0;g.update(1/120,[{move:Math.sin(i/250)>.3?1:-1}]);
  const crowd=g.fighters.filter(f=>f.hp>0);
  for(let a=0;a<crowd.length;a++)for(let b=a+1;b<crowd.length;b++){
   const x=crowd[a],y=crowd[b];if(Math.abs(x.y-y.y)>=110||x.motion||y.motion||x.capture||y.capture)continue;
   assert.ok(Math.abs(x.x-y.x)>=bodyGap(x,y)-.05,`overlap ${x.id}/${y.id} at frame ${i}`);
  }
 }
});
test('creatures accelerate into running and their gait follows actual travel',()=>{
 const g=new CampaignGame({random:()=>.5});g.phase='fight';const f=g.fighters[1];f.aiClock=100;g.fighters[0].x=f.x-350;
 tick(g,1/120);const initial=f.vx;assert.ok(Math.abs(initial)>0&&Math.abs(initial)<20);
 tick(g,.15);assert.ok(Math.abs(f.vx)>Math.abs(initial));assert.ok(f.gait>0&&f.moveBlend>0);
 const before=creatureMotion(f,g.time);f.animation={name:'enemy-bite',elapsed:.42,duration:.75};const strike=creatureMotion(f,g.time);assert.ok(strike.lunge>30);assert.notEqual(before.lean,strike.lean);
});
test('held jump clears 180 pixels, tap jumps lower, and both land reliably',()=>{
 const heights=[];
 for(const release of [false,true]){
  const g=arena(),f=g.fighters[0];g.action(0,'jump');if(release)g.releaseJump(0);let top=FLOOR;
  for(let i=0;i<150;i++){tick(g,1/120);top=Math.min(top,f.y);}heights.push(FLOOR-top);assert.equal(f.y,FLOOR);assert.equal(f.jumpActive,false);
 }
 assert.ok(heights[0]>180);assert.ok(heights[1]<heights[0]*.6);
});
test('jump dodges real creature bites and floor pulses but does not grant invulnerability',()=>{
 for(const action of ['bite','pulse']){
  const g=arena(),[hero,enemy]=g.fighters;enemy.character=null;enemy.enemyType=action==='bite'?'vex-0':'vex-2';
  g.action(1,action);tick(g,action==='bite'?.05:.38);g.action(0,'jump');tick(g,.42);
  assert.equal(hero.hp,1000,action);assert.equal(hero.invuln,0);
  assert.equal(g.hit(enemy,hero,5,{direct:false,groundHeight:600}),true);assert.ok(hero.hp<1000);
 }
});
test('grounded creature pulse still hurts',()=>{
 const g=arena(),[hero,enemy]=g.fighters;enemy.enemyType='vex-2';g.action(1,'pulse');tick(g,.8);assert.ok(hero.hp<1000);
});
test('releasing jump cannot cancel an enemy launch after being hit',()=>{
 const g=arena(),[f,t]=g.fighters;g.action(0,'jump');tick(g,.1);g.hit(t,f,5,{launch:900});g.releaseJump(0);assert.equal(f.vy,-900);
});
test('air dash preserves the jump and can transition into an aimed skill',()=>{
 const g=arena(),f=g.fighters[0];g.action(0,'jump');tick(g,.2);const height=f.y;
 assert.equal(g.action(0,'dash'),true);tick(g,.12);assert.ok(f.y<height);assert.equal(g.action(0,0),true);assert.equal(f.cast.slot,0);assert.equal(f.dash,0);assert.equal(f.invuln,0);
});
for(const character of ['kairo','vex','nyra'])for(const next of ['jump','dash',3,4])test(`${character} confirms a basic hit into ${next}`,()=>{
 const g=arena(character),f=g.fighters[0];g.action(0,0);tick(g,.2);assert.ok(g.fighters[1].hp<1000);assert.ok(f.lock>0);
 const cooldown=f.cooldowns[0];assert.equal(g.action(0,next),true);assert.equal(f.cooldowns[0],cooldown);
 if(typeof next==='number'){assert.equal(f.cast.slot,next);if(next===4)assert.equal(f.meter,0);else assert.ok(f.cooldowns[next]>0);}
 else {assert.equal(f.cast,null);assert.equal(f.comboStep,1);assert.ok(f.comboWindow>0);}
});
test('a skill hit can chain into a different skill during recovery',()=>{
 const g=arena(),f=g.fighters[0];g.action(0,3);tick(g,1.52);assert.equal(f.lock,0);assert.ok(f.skillDelay>0&&f.chainWindow>0);assert.equal(g.action(0,0),true);
});
test('whiffs and armored cinematics cannot be cancelled, and interrupts erase queued actions',()=>{
 const g=arena(),[f,t]=g.fighters;t.x=1300;g.action(0,0);tick(g,.2);assert.equal(g.action(0,'dash'),false);
 tick(g,.4);g.action(0,3);tick(g,.2);f.chainWindow=2;for(const action of ['jump','dash',0,4])assert.equal(g.action(0,action),false);
 tick(g,2);g.action(0,2);tick(g,.7);g.inputAction(0,0);assert.ok(f.inputBuffer);g.hit(t,f,5,{bypassShield:true});assert.equal(f.inputBuffer,null);assert.equal(f.chainWindow,0);
});
test('a slightly early skill press is buffered and executes once recovery finishes',()=>{
 const g=arena(),f=g.fighters[0];g.action(0,2);tick(g,.7);assert.equal(g.inputAction(0,0),false);assert.ok(f.inputBuffer);tick(g,.23);assert.equal(f.cast.slot,0);assert.equal(f.inputBuffer,null);
});
test('jump rise, fall, and landing use different body poses',()=>{
 const f=fighter(0,'kairo');f.y=500;f.vy=-650;const rise=characterPose(f,0);f.vy=650;const fall=characterPose(f,0);assert.notEqual(rise.ly,fall.ly);assert.notEqual(rise.lean,fall.lean);f.y=FLOOR;f.landing=.09;assert.ok(characterPose(f,0).dy>10);
});
