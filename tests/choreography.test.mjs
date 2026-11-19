import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,FLOOR} from '../src/engine.js';
import {stormCombo} from '../src/choreography.js';
import {characterPose} from '../src/animation.js';
const tick=g=>{g.freeze=0;g.update(1/120);};
function arena(tier,character='vex',defenderTier=tier){
 const events=[],g=new Game({character:'kairo',opponent:character,mode:'local',onEvent:e=>events.push(e)});g.phase='fight';g.events=events;
 g.fighters.forEach((f,i)=>Object.assign(f,{x:400+i*240,tier:i?defenderTier:tier,meter:100,hp:10000,maxHp:10000}));return g;
}
for(const tier of [1,2])for(const character of ['kairo','vex','nyra'])for(const shield of [false,true])test(`phase ${tier} ultimate carries ${character}'s ${shield?'shield':'special'} through the entire defended combo`,()=>{
 const g=arena(tier,character),[a,d]=g.fighters;
 if(shield){g.action(1,2);g.action(0,4);for(let i=0;i<150&&!g.clash;i++)tick(g);}
 else{g.action(0,4);for(let i=0;i<18;i++)tick(g);g.action(1,3);}
 assert.ok(g.clash?.sequence.combo);const clash=g.clash,poses=new Set();let highest=FLOOR,left=false,right=false,paused=false;
 for(let i=0;i<650&&g.clash;i++){
  highest=Math.min(highest,d.y);left||=a.x<d.x;right||=a.x>d.x;
  if(clash.impactPause>.02){const before=[a.x,a.y,d.x,d.y,clash.elapsed];tick(g);assert.deepEqual([a.x,a.y,d.x,d.y,clash.elapsed],before);paused=true;}
  else tick(g);
  poses.add(a.animation?.name);assert.equal(g.action(1,0),false);assert.equal(d.hp,10000);
  for(const f of [a,d])for(const value of Object.values(characterPose(f,g.time)))assert.ok(Number.isFinite(value));
 }
 assert.equal(g.clash,null);assert.ok(paused);assert.ok(highest<(tier===1?410:300));assert.ok(left);if(tier===2)assert.ok(right);
 assert.ok(poses.has('kairo-storm-rise'));assert.ok(poses.has('kairo-storm-finish'));if(tier===2)assert.ok(poses.has('kairo-storm-spin'));
 const beats=g.events.filter(e=>e.type==='specialCollision');assert.deepEqual(beats.map(b=>b.kind),['entry',...stormCombo(tier,640,1,FLOOR).beats.map(b=>b.kind)]);
 assert.equal(a.hp,10000);for(let i=0;i<150;i++)tick(g);assert.equal(a.x,400);assert.equal(d.y,FLOOR);assert.equal(a.down,0);assert.equal(d.defendingSpecial,false);
});
for(const attackerTier of [1,2,3])for(const defenderTier of [1,2,4])test(`shield phase ${defenderTier} vs ultimate phase ${attackerTier} blocks damage through launch and landing`,()=>{
 const g=arena(attackerTier,'vex',defenderTier),[a,d]=g.fighters;g.action(1,2);g.action(0,4);
 for(let i=0;i<160&&!g.clash;i++)tick(g);assert.ok(g.clash?.shieldDefense);
 let knockedDown=false;
 for(let i=0;i<800;i++){tick(g);knockedDown||=d.down>0;assert.equal(d.hp,10000);assert.equal(a.down,0);}
 assert.equal(knockedDown,attackerTier>defenderTier);assert.equal(g.clash,null);assert.equal(d.capture,null);assert.equal(d.motion,null);
});
test('lethal campaign or round interruption cancels defended combo beats',()=>{
 const g=arena(2);g.action(0,4);g.action(1,3);for(let i=0;i<80;i++)tick(g);g.finishRound(0);
 const count=g.events.filter(e=>e.type==='specialCollision').length;for(let i=0;i<120;i++)tick(g);
 assert.equal(g.events.filter(e=>e.type==='specialCollision').length,count);assert.equal(g.clash,null);assert.ok(g.fighters.every(f=>!f.defendingSpecial&&!f.motion));
});
