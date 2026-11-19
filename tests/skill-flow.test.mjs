import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,MAX_HEALTH,FLOOR} from '../src/engine.js';
function setup(character='kairo',tier=4){const events=[],g=new Game({character,mode:'local',onEvent:e=>events.push(e)});g.phase='fight';g.events=events;for(const [i,f] of g.fighters.entries())Object.assign(f,{x:550+i*100,tier,hp:MAX_HEALTH[tier-1],maxHp:MAX_HEALTH[tier-1],meter:100});return g;}
function tick(g,s){for(let i=0;i<Math.ceil(s*120);i++){g.freeze=0;g.update(1/120);}}
for(const character of ['kairo','vex'])for(const tier of [1,2,3,4])test(`${character} tier ${tier} chains quick skills into a control finisher`,()=>{
 const g=setup(character,tier),[a,b]=g.fighters;let last=b.hp;
 for(let step=0;step<3;step++){assert.equal(g.action(0,0),true);assert.equal(a.armor,0);assert.ok(a.cooldowns[0]<=.35);tick(g,.24);assert.ok(b.hp<last);last=b.hp;assert.equal(a.comboStep,(step+1)%3);assert.equal(b.capture,null);if(step<2){tick(g,.28);assert.equal(a.lock,0);assert.equal(a.skillDelay,0);}}
 assert.ok(character==='kairo'?b.down>0:b.vy<0);tick(g,2);assert.equal(a.comboWindow,0);
});
for(const character of ['kairo','vex'])test(`${character} combo follow-up is cancelled by an enemy skill hit`,()=>{
 const g=setup(character),[a,b]=g.fighters;g.action(0,0);tick(g,.09);const hp=b.hp;g.hit(b,a,10,{stun:.4});tick(g,.6);assert.equal(b.hp,hp);assert.equal(a.comboStep,0);assert.equal(a.comboWindow,0);assert.equal(a.motion,null);
});
for(const character of ['kairo','vex'])test(`${character} shields absorb remote attacks without recoiling their caster`,()=>{
 const g=setup(character),[d,a]=g.fighters;a.x=1100;g.action(0,2);g.hit(a,d,20,{direct:false});assert.equal(g.clash,null);assert.equal(d.shieldReaction.direct,false);assert.equal(d.hp,d.maxHp);const x=a.x;tick(g,1.5);assert.equal(a.x,x);assert.equal(a.down,0);assert.equal(a.recoilAfterArmor,0);assert.equal(d.shieldReaction,null);
});
test('Judgement lightning damages an armored target before the final spear without capture',()=>{
 const g=setup(),[a,b]=g.fighters;b.armor=4;g.action(0,4);tick(g,1.45);assert.equal(b.capture,null);assert.ok(b.hp<b.maxHp);assert.equal(g.events.filter(e=>e.type==='damage').length,1);const hp=b.hp;tick(g,.8);assert.ok(b.hp<hp);assert.equal(g.events.filter(e=>e.type==='damage').length,3);
});
test('Thunder God side pillars hit enemies outside the central slam',()=>{
 const g=setup(),[a,b]=g.fighters;const tx=b.x;g.action(0,3);b.x=tx+320;tick(g,1.95);assert.ok(b.hp<b.maxHp);assert.ok(g.events.some(e=>e.kind==='lightning'&&e.x===tx+230));
});
for(const tier of [1,4])test(`Vex tier ${tier} gravity well hurts armored targets during the pull`,()=>{
 const g=setup('vex',tier),[a,b]=g.fighters;b.armor=4;g.action(0,4);tick(g,1.05);assert.equal(b.capture,null);assert.ok(b.hp<b.maxHp);
});
for(const tier of [1,2,3,4])for(const character of ['kairo','vex'])for(const slot of [3,4])for(const enemySlot of [3,4])test(`${character} tier ${tier} slot ${slot} blocks airborne skill ${enemySlot} without retaliation`,()=>{
 const g=setup(character,tier),[d,a]=g.fighters,origin={x:a.x,y:a.y};g.action(1,enemySlot);tick(g,.15);assert.equal(g.action(0,slot),true);assert.equal(g.clash.kind,'sky');assert.ok(d.armor>0);if(slot===4)assert.equal(d.meter,0);
 tick(g,1.25);assert.equal(a.hp,a.maxHp);assert.equal(d.hp,d.maxHp);assert.ok(g.clash);tick(g,4);assert.equal(g.clash,null);assert.equal(a.x,origin.x);assert.equal(a.y,origin.y);assert.equal(a.hp,a.maxHp);assert.equal(d.hp,d.maxHp);assert.equal(a.motion,null);assert.equal(d.armor,0);
});
test('normal grounded opponent does not trigger aerial variant',()=>{const g=setup();g.action(0,4);assert.equal(g.fighters[0].cast.variant,undefined);});
test('stun, knockdown and restraint do not swallow a new knockback',()=>{
 for(const state of ['stun','down','capture']){const g=setup(),[a,b]=g.fighters;if(state==='capture')g.captureTarget(a,b,2,[{t:2,x:b.x,y:300}]);else b[state]=2;const x=b.x;g.hit(a,b,5,{knock:850,launch:300,stun:.3});assert.equal(b.capture,null);assert.equal(b.vx,850);assert.equal(b.vy,-300);tick(g,.1);assert.ok(b.x>x);assert.ok(b.y<FLOOR);}
});

test('a void shield charged only by remote damage does not knock back on discharge',()=>{
 const g=setup('vex'),[d,a]=g.fighters;g.action(0,2);g.hit(a,d,12,{direct:false});tick(g,3.3);assert.equal(a.down,0);assert.equal(a.vx,0);assert.ok(a.hp<a.maxHp);
});

for(const character of ['kairo','vex'])for(const slot of [3,4])test(`higher-phase ${character} skill ${slot} breaks the barrier at exactly 40% power`,()=>{
 const g=setup(character,3),[a,d]=g.fighters;d.tier=1;g.action(0,slot);tick(g,.15);g.action(1,3);const expected=g.clash.base*g.power(a)*.4,hp=d.hp;tick(g,1);assert.equal(d.hp,hp);assert.ok(g.clash.losing);tick(g,4);assert.ok(Math.abs(hp-d.hp-expected)<.00001);assert.equal(a.hp,a.maxHp);assert.equal(g.clash,null);assert.equal(g.events.filter(e=>e.type==='damage').length,1);
});
test('stronger defense blocks without turning into an offensive counter',()=>{
 const g=setup('kairo',1),[a,d]=g.fighters;d.tier=4;g.action(0,3);g.action(1,3);tick(g,5);assert.equal(a.hp,a.maxHp);assert.equal(d.hp,d.maxHp);
});
test('round end cancels barrier resolution and return movement',()=>{
 const g=setup();g.action(0,3);g.action(1,3);assert.ok(g.clash);g.finishRound(0);assert.equal(g.clash,null);assert.ok(g.fighters.every(f=>!f.motion&&!f.armor));
});
for(const character of ['kairo','vex'])test(`${character} movement dash travels farther at each evolution and obeys boundaries`,()=>{
 let previous=0;for(let tier=1;tier<=4;tier++){const g=setup(character,tier),[f,t]=g.fighters;f.x=100;t.x=1350;g.setMoveIntent(0,1);g.action(0,'dash');tick(g,.28);const distance=f.x-100;assert.ok(distance>350);assert.ok(distance>previous);previous=distance;tick(g,2);f.x=1375;g.action(0,'dash');tick(g,.4);assert.ok(f.x<=1380);}
});

test('blocked Thunderfall returns through a backflip, not a teleport or delayed hit',()=>{
 const g=setup('kairo',1),[a,d]=g.fighters,origin=a.x;g.action(0,3);tick(g,.15);g.action(1,3);
 // Impact pauses deliberately extend the wall-clock duration of the exchange.
 for(let i=0;i<600&&g.clash;i++)tick(g,1/120);
 assert.equal(g.clash,null);assert.equal(a.animation.name,'backflip');assert.ok(a.motion);assert.notEqual(a.x,origin);tick(g,1);assert.equal(a.x,origin);assert.equal(d.hp,d.maxHp);assert.equal(g.events.filter(e=>e.type==='damage').length,0);
});
test('out-of-range casts cannot force a damaging barrier confrontation',()=>{
 const g=setup('kairo',1),[a,d]=g.fighters;a.x=60;d.x=1380;g.action(0,3);g.action(1,3);assert.equal(g.clash,null);tick(g,5);assert.equal(a.hp,a.maxHp);assert.equal(d.hp,d.maxHp);
});
