import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,CHARACTERS,skillNames,MAX_HEALTH} from '../src/engine.js';
import {CampaignGame} from '../src/campaign.js';
import {specialMove,NYRA_FORMS} from '../src/specials.js';
import {CLIPS} from '../src/animation.js';
function advance(g,s){for(let i=0;i<Math.ceil(s*120);i++){g.freeze=0;g.update(1/120);}}
function setup(c='kairo',tier=1,opponent='vex'){const events=[],g=new Game({character:c,opponent,mode:'local',onEvent:e=>events.push(e)});g.phase='fight';g.events=events;g.fighters.forEach((f,i)=>Object.assign(f,{tier,x:400+i*200,hp:10000,maxHp:10000,meter:100}));return g;}
for(let tier=1;tier<=4;tier++)test('Kairo tier '+tier+' ultimate ignores CC for its entire animation, still taking damage',()=>{
 const g=setup('kairo',tier),[a,b]=g.fighters;b.armor=30;g.action(0,4);const serial=a.attackSerial,duration=a.cast.duration;
 for(let i=0;i<Math.floor(duration*30)-1;i++){
  assert.ok(g.ccImmune(a));const hp=a.hp;g.hit(b,a,1,{knock:1200,launch:700,stun:2,down:2,direct:false});assert.ok(a.hp<hp);assert.equal(a.stun,0);assert.equal(a.down,0);assert.equal(a.attackSerial,serial);assert.equal(g.captureTarget(b,a,1,[{t:1,x:100,y:300}]),false);g.displace(a,900,2);assert.equal(a.attackSerial,serial);advance(g,1/30);
 }
 advance(g,1);assert.equal(a.ultimateArmor,0);assert.equal(a.cast,null);assert.equal(a.motion,null);
});
test('shield cannot queue knockback after Kairo ultimate',()=>{
 const g=setup('kairo',1,'kairo'),[a,d]=g.fighters;d.tier=4;g.action(1,2);g.action(0,4);advance(g,5);assert.equal(a.down,0);assert.equal(a.recoilAfterArmor,0);assert.equal(a.hp,a.maxHp);
});
test('second boss awakening persists at the next level and when retrying from checkpoint',()=>{
 for(const campaign of Object.keys(CHARACTERS)){const g=new CampaignGame({campaign,character:'vex',stage:5});g.phase='fight';g.hit(g.fighters[0],g.fighters[1],100000,{bypassShield:true,unblockable:true});assert.equal(g.fighters[0].tier,4);assert.equal(g.fighters[0].hp,400);advance(g,2.6);assert.equal(g.fighters[0].tier,4);assert.equal(new CampaignGame({campaign,stage:6}).fighters[0].tier,4);const final=new CampaignGame({campaign,stage:8});assert.equal(final.fighters[1].character,campaign);assert.equal(final.fighters[1].tier,4);}
});
test('campaign character bosses use CPU skills rather than creature attacks',()=>{
 for(const campaign of Object.keys(CHARACTERS)){const g=new CampaignGame({campaign,stage:8,random:()=>.6});g.phase='fight';const actions=[],action=g.action.bind(g);g.action=(id,move)=>{if(id===1)actions.push(move);return action(id,move);};g.fighters[1].meter=100;g.fighters[0].x=g.fighters[1].x-350;advance(g,8);assert.ok(actions.includes(4));assert.ok(actions.every(a=>typeof a==='number'||['dash','jump'].includes(a)));}
});
test('Nyra forms have different move names, special effects and animated casts',()=>{
 for(const slot of [0,2,3,4])assert.equal(new Set(NYRA_FORMS.map(f=>f.names[slot])).size,4);
 for(const slot of [3,4]){const kinds=new Set(),clips=new Set();for(let tier=1;tier<=4;tier++){const g=setup('nyra',tier),f=g.fighters[0],m=specialMove(f,slot);kinds.add(m.kind);clips.add(m.clips[0]);assert.ok(CLIPS[m.clips[0]]);assert.equal(skillNames(f)[slot],m.name);g.action(0,slot);advance(g,4);assert.ok(g.fighters[1].hp<10000);assert.ok(g.events.some(e=>e.type==='effect'&&['meteorFall','solarPillar','solarBeam','solarFlare'].includes(e.kind)));}assert.equal(kinds.size,4);assert.equal(clips.size,4);}
});
test('all 1024 special pairings retain both move identities, resolve, and apply only breakthrough damage',()=>{
 const variants=[];for(const character of Object.keys(CHARACTERS))for(let tier=1;tier<=4;tier++)for(const slot of [3,4])variants.push({character,tier,slot});
 for(const atk of variants)for(const def of variants){
  const g=setup(atk.character,atk.tier,def.character),[a,d]=g.fighters;d.tier=def.tier;g.action(0,atk.slot);advance(g,.15);assert.equal(g.action(1,def.slot),true);const q=g.clash;assert.ok(q,JSON.stringify([atk,def]));assert.equal(q.attack.id,specialMove(a,atk.slot).id);assert.equal(q.defense.id,specialMove(d,def.slot).id);assert.ok(q.defense.clips.includes(d.animation.name));assert.ok(!d.animation.name.includes('barrier'));
  const damage=q.losing?q.base*g.power(a)*.4:0;advance(g,1);assert.ok(q.attack.clips.includes(a.animation.name));assert.ok(q.defense.clips.includes(d.animation.name));advance(g,4);assert.ok(g.events.some(e=>e.type==='specialCollision')); 
  assert.equal(g.clash,null);assert.ok(Math.abs(10000-d.hp-damage)<.0001);assert.equal(a.hp,10000);assert.equal(a.motion,null);assert.equal(d.defendingSpecial,false);
 }
});
test('Thunder God intercepts Worldfall with lightning, and gravity ultimate absorbs meteors',()=>{
 for(const character of ['kairo','vex']){const g=setup('nyra',4,character);g.action(0,4);advance(g,.2);g.action(1,character==='kairo'?3:4);assert.equal(g.clash.attack.kind,'worldfall');assert.equal(g.clash.interaction.response,character==='kairo'?'lightning-intercept':'absorb');}
});
