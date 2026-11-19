import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,skillNames} from '../src/engine.js';
import {CampaignGame,isUnlocked,recordProgress,loadCampaign,saveCampaign} from '../src/campaign.js';
import {CLIPS} from '../src/animation.js';
const advance=(g,s)=>{for(let i=0;i<s*120;i++){g.freeze=0;g.update(1/120);}};
function arena(tier=1){const events=[],g=new Game({character:'ronin',mode:'local',onEvent:e=>events.push(e)});g.events=events;g.phase='fight';g.fighters.forEach((f,i)=>Object.assign(f,{x:500+i*120,tier,meter:100,hp:10000,maxHp:10000}));return g;}
for(let tier=1;tier<=4;tier++)for(const slot of [0,2,3,4])test(`Ronin phase ${tier}, skill ${slot} animates, resolves and recovers`,()=>{
 const g=arena(tier),[f,t]=g.fighters;assert.ok(g.action(0,slot));assert.ok(CLIPS[f.animation.name]);assert.ok(skillNames(f)[slot]);assert.equal(f.armor>0,slot>=3);advance(g,5);if(slot!==2)assert.ok(t.hp<10000);if(slot===4)assert.ok(f.meter<100);assert.equal(f.motion,null);assert.equal(f.cast,null);assert.equal(f.lock,0);assert.equal(t.capture,null);assert.ok(g.fighters.every(f=>Number.isFinite(f.x+f.y+f.hp)));
});
test('Ronin quick cuts chain and enemy skills interrupt their pending hits',()=>{
 const g=arena(),[f,t]=g.fighters;g.action(0,0);advance(g,.52);assert.equal(f.comboStep,1);g.action(0,0);advance(g,.52);assert.equal(f.comboStep,2);g.action(0,0);advance(g,.35);assert.ok(t.down>0);
 const h=arena();h.action(0,0);h.hit(h.fighters[1],h.fighters[0],10);advance(h,.5);assert.equal(h.fighters[1].hp,10000);
});
test('Ronin blade guard repels contact while absorbing remote attacks without recoil',()=>{
 for(const direct of [false,true]){const g=arena(),[f,t]=g.fighters;g.action(0,2);advance(g,.6);g.hit(t,f,20,{direct});assert.equal(f.hp,10000);assert.equal(!!g.clash,direct);advance(g,2);if(direct)assert.ok(t.x>1100);else assert.equal(t.down,0);}
});
test('Ronin ultimates damage armored targets on every visible cut',()=>{
 for(let tier=1;tier<=4;tier++){const g=arena(tier),[f,t]=g.fighters;t.armor=20;g.action(0,4);advance(g,4);const cuts=g.events.filter(e=>['steelCut','steelFall'].includes(e.kind)),hits=g.events.filter(e=>e.type==='damage');assert.equal(cuts.length,[3,5,6,7][tier-1]);assert.equal(hits.length,cuts.length);assert.ok(Math.abs((10000-t.hp)/g.power(f)-[76,88,96,116][tier-1])<.001);}
});
test('Ronin has a locked, themed campaign and its unlock persists',()=>{
 const empty={completed:[],checkpoints:{}};assert.equal(isUnlocked(empty,'ronin'),false);
 const g=new CampaignGame({campaign:'ronin',character:'vex',stage:8});assert.equal(g.fighters[1].character,'ronin');assert.equal(g.fighters[1].tier,g.fighters[0].tier);
 const unlocked=recordProgress(empty,'ronin',9,true),storage={getItem(){return this.value;},setItem(k,value){this.value=value;}};saveCampaign(storage,unlocked);assert.equal(isUnlocked(loadCampaign(storage),'ronin'),true);
 const play=new CampaignGame({campaign:'ronin',character:'ronin',progress:unlocked});assert.equal(play.fighters[0].character,'ronin');assert.ok(play.fighters.slice(1).every(f=>f.enemyType.startsWith('ronin-')));
});
