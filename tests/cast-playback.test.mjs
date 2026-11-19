import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,FLOOR} from '../src/engine.js';
import {recordCast,castFrame,castEffects,redirectEffect,bodyLed} from '../src/cast-playback.js';
import {specialMove} from '../src/specials.js';
const tick=g=>{g.freeze=0;g.update(1/120);};
function arena(character='kairo',tier=1,opponent='kairo'){
 const g=new Game({character,opponent,mode:'local'});g.phase='fight';g.fighters.forEach((f,i)=>Object.assign(f,{x:400+i*300,tier,meter:100,hp:10000,maxHp:10000}));return g;
}
test('recorded casts preserve every normal animation sample and emitted attack effect',()=>{
 for(const character of ['kairo','vex','nyra','ronin'])for(const tier of [1,2,4])for(const slot of [3,4]){
  const effects=[],g=arena(character,tier);g.onEvent=e=>{if(e.type==='effect')effects.push(e);};
  const record=recordCast(onEvent=>{const sample=new Game({mode:'local',opponent:'kairo',onEvent});sample.fighters[1].tier=tier;return sample;},specialMove(g.fighters[0],slot),{x:400,y:FLOOR},{x:700,y:FLOOR});
  g.action(0,slot);
  for(let i=1;i<record.frames.length;i++){tick(g);const f=g.fighters[0],sample=castFrame(record,i/120);if(f.animation)assert.deepEqual(sample.animation,f.animation);assert.ok(Math.abs(f.x-sample.x)<.01);assert.ok(Math.abs(f.y-sample.y)<.01);}
  assert.deepEqual(record.effects.map(({at,...e})=>e),effects);
 }
});
test('Thunderfall defense uses its actual slam pose, rises to the collision, and holds there',()=>{
 const g=arena();g.action(0,3);for(let i=0;i<18;i++)tick(g);g.action(1,3);const q=g.clash,[a,d]=g.fighters,initial=d.y;
 for(let i=0;i<500&&q.beatIndex===0;i++)tick(g);
 assert.equal(g.clash,q);assert.equal(d.animation.name,'kairo-slam');assert.deepEqual(d.animation,castFrame(q.defenseCast,d.visualCastTime).animation);
 assert.ok(d.y<initial-120);assert.ok(Math.abs(d.y-140-q.contact.y)<5);assert.equal(d.clashRotation,Math.PI);
 assert.ok(a.y<q.contact.y+20);const positions=[a.x,a.y,d.x,d.y];
 for(let i=0;i<6;i++)tick(g);assert.deepEqual([a.x,a.y,d.x,d.y],positions);
});
test('incoming and defending meteors keep their artwork and end at the collision plane',()=>{
 const g=arena('nyra',4,'kairo');g.action(0,4);for(let i=0;i<18;i++)tick(g);g.action(1,3);const q=g.clash;
 const drops=q.attackCast.effects.filter(e=>e.kind==='meteorFall');assert.equal(drops.length,7);
 assert.equal(q.sequence.beats.length,7,'every meteor must collide, even when the normal move would miss a displaced target');
 for(const drop of drops)for(const defending of [false,true]){
  const mapped=redirectEffect(drop,q.attackCast,q.contact,defending,FLOOR);
  assert.equal(mapped.kind,drop.kind);assert.equal(mapped.radius,drop.radius);assert.equal(mapped.duration,drop.duration);assert.ok(Math.abs(mapped.y+(defending?-1:1)*drop.radius*.9-q.contact.y)<.001);
  assert.ok(defending?mapped.fromY>mapped.y:mapped.fromY<mapped.y);
  assert.equal(castEffects(q.attackCast,drop.at+drop.duration+.001).some(e=>e.kind==='meteorFall'&&e.at===drop.at),false);
 }
});
test('Kairo ultimates keep their combo animation instead of borrowing Thunderfall lightning',()=>{
 for(const tier of [1,2,3]){
  assert.equal(bodyLed(specialMove({character:'kairo',tier},4)),false);
  const g=arena('vex',tier,'kairo');g.action(0,3);for(let i=0;i<18;i++)tick(g);g.action(1,4);const q=g.clash,poses=new Set();
  for(let i=0;i<600&&g.clash;i++){tick(g);if(g.clash)poses.add(g.fighters[1].animation.name);}
  assert.ok(poses.has('kairo-storm-rise'));assert.ok(poses.has('kairo-storm-finish'));if(tier===2)assert.ok(poses.has('kairo-storm-spin'));
  assert.equal(g.clash,null);assert.equal(q.defense.kind,'sword-burst');
 }
});
test('projectile collisions follow actual impact times, without invented early hits',()=>{
 const g=arena('nyra',1,'kairo');g.action(0,4);for(let i=0;i<18;i++)tick(g);g.action(1,3);const q=g.clash;
 assert.equal(q.sequence.beats.length,q.attackCast.hits.length);
 const first=q.sequence.beats[0];while(q.elapsed<first.t-.02)tick(g);assert.equal(q.beatIndex,0);
 while(q.beatIndex===0)tick(g);assert.ok(Math.abs(q.attackTime-q.attackCast.hits[0])<.02);
});
test('ending a round clears the rotated interception pose',()=>{
 const g=arena();g.action(0,3);g.action(1,3);for(let i=0;i<150;i++)tick(g);assert.ok(g.fighters[1].clashRotation>0);g.finishRound(0);assert.ok(g.fighters.every(f=>!f.clashRotation&&!f.clashReplay));
});
