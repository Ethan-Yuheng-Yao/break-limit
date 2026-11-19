import test from 'node:test';import assert from 'node:assert/strict';
import {Game,skillNames,skillHints} from '../src/engine.js';
import {FORMS,comboClip} from '../src/forms.js';import {CLIPS,sampleClip} from '../src/animation.js';import {specialMove} from '../src/specials.js';
const advance=(g,time)=>{for(let i=0;i<Math.ceil(time*120);i++){g.freeze=0;g.update(1/120);}};
function arena(character,tier){const events=[],g=new Game({character,mode:'local',onEvent:e=>events.push(e)});g.events=events;g.phase='fight';g.fighters.forEach((f,i)=>Object.assign(f,{x:500+i*150,tier,hp:10000,maxHp:10000,meter:100}));return g;}
test('every Kairo and Vex phase has distinct move names, hints, and actual casting poses',()=>{
 for(const character of ['kairo','vex']){
  for(const slot of [0,2,3,4]){assert.equal(new Set(FORMS[character].map(form=>form.names[slot])).size,4);assert.equal(new Set(FORMS[character].map(form=>form.hints[slot])).size,4);}
  for(const category of ['slam','shield','combo']){
   const poses=[];for(let tier=1;tier<=4;tier++){
    const f={character,tier},name=category==='combo'?comboClip(f,0):FORMS[character][tier-1][category];assert.ok(CLIPS[name],name);poses.push(JSON.stringify(sampleClip(name,.45)));assert.deepEqual(skillNames(f),FORMS[character][tier-1].names);assert.deepEqual(skillHints(f),FORMS[character][tier-1].hints);
   }assert.equal(new Set(poses).size,4,character+' '+category+' poses');
  }
 }
});
test('Storm Guillotine and Heavenfall have distinct damaging patterns without inflating their damage budget',()=>{
 for(const tier of [1,2,3]){const g=arena('kairo',tier),target=g.fighters[1];target.armor=10;g.action(0,3);advance(g,2);const damage=g.events.filter(e=>e.type==='damage');assert.equal(damage.length,tier);assert.ok(Math.abs(10000-target.hp-(24+tier*2)*g.power(g.fighters[0]))<.001);}
 assert.equal(specialMove({character:'kairo',tier:3},3).kind,'blade-rain');
});
test('Vex middle forms add orbital and cage hits while retaining total crush damage',()=>{
 const fingerprints=[];
 for(const tier of [1,2,3]){const g=arena('vex',tier),target=g.fighters[1];g.action(0,3);advance(g,.6);fingerprints.push([Math.round(target.x),Math.round(target.y)].join(','));advance(g,1.5);assert.equal(g.events.filter(e=>e.type==='damage').length,tier+1);assert.ok(Math.abs(10000-target.hp-(34+tier*2)*g.power(g.fighters[0]))<.001);}
 assert.equal(new Set(fingerprints).size,3);
});
test('Nyra throws molten rock, orbiting shards, then an actual miniature sun',()=>{
 for(const tier of [1,2,4]){const g=arena('nyra',tier);g.action(0,4);advance(g,4);const projectiles=g.events.filter(e=>e.kind==='meteorFall');assert.ok(projectiles.length);if(tier===1)assert.ok(projectiles.every(e=>!e.shard&&!e.celestial));if(tier===2)assert.ok(projectiles.every(e=>e.shard));if(tier===4){assert.equal(projectiles.filter(e=>e.celestial).length,1);assert.equal(projectiles.at(-1).celestial,true);}}
});
