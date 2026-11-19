import test from 'node:test';
import assert from 'node:assert/strict';
import {CampaignGame,CAMPAIGNS,campaignStage,loadCampaign,recordProgress,saveCampaign,isUnlocked,CAMPAIGN_KEY} from '../src/campaign.js';
import {Game,MAX_HEALTH,ACTIVE_SKILLS,FLOOR} from '../src/engine.js';
import {ENEMIES} from '../src/enemies.js';
import {CHARACTERS} from '../src/engine.js';
import {CLIPS} from '../src/animation.js';
const empty=()=>({completed:[],checkpoints:{}});
function arena(character='kairo',stage=0){const events=[],g=new CampaignGame({character,stage,progress:{completed:['nyra','ronin']},random:()=>.5,onEvent:e=>events.push(e)});g.events=events;g.phase='fight';for(const f of g.fighters.slice(1))f.aiClock=1000;return g;}
function advance(g,seconds){for(let i=0;i<seconds*120;i++){g.freeze=0;g.update(1/120);}}
function clear(g){for(const target of g.fighters.slice(1))g.hit(g.fighters[0],target,10000,{unblockable:true,bypassShield:true,direct:false});if(!g.stage.boss){const hero=g.fighters[0];hero.x=g.exitX;hero.y=g.groundAt(hero.x);g.finishRound();}}

test('each campaign has nine levels, three solo bosses, and larger groups each chapter',()=>{
 for(const character of Object.keys(CAMPAIGNS)){
  const levels=Array.from({length:9},(_,i)=>campaignStage(character,i));
  assert.deepEqual(levels.filter(s=>s.boss).map(s=>[s.index,s.tier,s.count]),[[2,1,1],[5,2,1],[8,4,1]]);
  assert.deepEqual(levels.filter(s=>!s.boss).map(s=>s.count),[2,3,3,4,4,5]);
 }
});
test('campaign difficulty and later chapters make creatures progressively stronger',()=>{
 for(const stage of [0,2,3,5,6,8]){const games=Object.keys(CAMPAIGNS).map(character=>arena(character,stage));if(games[0].stage.boss){for(const g of games){assert.equal(g.fighters[1].hp,MAX_HEALTH[g.fighters[0].tier-1]);assert.equal(g.fighters[1].damageScale,1);}continue;}for(let i=1;i<3;i++){assert.ok(games[i].fighters[1].hp>games[i-1].fighters[1].hp);assert.ok(games[i].power(games[i].fighters[1])>games[i-1].power(games[i-1].fighters[1]));}}
 for(const c of Object.keys(CAMPAIGNS)){const a=arena(c,0),b=arena(c,3),d=arena(c,6);assert.ok(a.fighters[1].hp<b.fighters[1].hp&&b.fighters[1].hp<d.fighters[1].hp);}
});
test('group battles only advance after every enemy is defeated and the exit is reached',()=>{
 const g=arena(),[hero,a,b]=g.fighters;g.hit(hero,a,10000);assert.equal(g.phase,'fight');assert.equal(a.defeated,true);assert.deepEqual(g.enemies(hero),[b]);assert.equal(g.events.some(e=>e.type==='campaignProgress'),false);
 g.hit(hero,b,10000);assert.equal(g.phase,'fight');assert.equal(g.exitOpen,true);assert.equal(g.events.filter(e=>e.type==='campaignProgress').length,0);
 hero.x=g.exitX;hero.y=g.groundAt(hero.x);advance(g,.02);assert.equal(g.phase,'roundEnd');assert.equal(g.events.filter(e=>e.type==='campaignProgress').length,1);assert.equal(hero.tier,1);
 advance(g,2.6);assert.equal(g.stageIndex,1);assert.equal(g.fighters.length,4);assert.equal(g.fighters[0].hp,MAX_HEALTH[0]);assert.equal(g.phase,'intro');
});
test('target switching reaches every living enemy, skips dead enemies, and NPCs only target the hero',()=>{
 const g=arena('kairo',7),hero=g.fighters[0],ids=new Set();for(let i=0;i<5;i++){ids.add(g.enemy(hero).id);g.cycleTarget();}assert.equal(ids.size,5);
 for(const npc of g.fighters.slice(1))assert.deepEqual(g.enemies(npc),[hero]);
 const target=g.enemy(hero);g.hit(hero,target,10000);for(let i=0;i<6;i++){assert.notEqual(g.enemy(hero),target);g.cycleTarget();}
});
test('all group AI fighters independently approach and attack the hero',()=>{
 const g=arena('kairo',1),hero=g.fighters[0],seen=new Set();hero.hp=hero.maxHp=10000;hero.armor=100;hero.x=720;
 const original=g.hit.bind(g);g.hit=(a,t,...args)=>{if(t===hero)seen.add(a.id);return original(a,t,...args);};
 g.fighters.slice(1).forEach((f,i)=>{f.x=400+i*300;f.aiClock=.2+i*.2;});advance(g,12);assert.equal(seen.size,3);assert.ok(hero.hp<10000);assert.ok(g.fighters.slice(1).every(f=>f.hp===f.maxHp));
});
for(const character of Object.keys(CAMPAIGNS))test(character+' ground slam damages multiple enemies in its impact area',()=>{
 const g=arena(character),[hero,a,b]=g.fighters;hero.x=500;a.x=640;b.x=710;a.hp=a.maxHp=b.hp=b.maxHp=1000;
 assert.equal(g.action(0,3),true);advance(g,2);assert.ok(a.hp<1000);assert.ok(b.hp<1000);assert.equal(hero.hp,hero.maxHp);
});
for(const character of Object.keys(CAMPAIGNS))test(character+' awakens after the second boss and completes all levels and unlocks only at the end',()=>{
 let progress=empty();const g=arena(character);g.onEvent=e=>{g.events.push(e);if(e.type==='campaignProgress')progress=recordProgress(progress,e.character,e.nextStage,e.complete);};
 for(let stage=0;stage<9;stage++){
 g.phase='fight';assert.equal(g.stageIndex,stage);assert.equal(g.fighters[0].tier,[1,2,4][Math.floor(stage/3)]);
  g.fighters[0].hp=1;
  clear(g);assert.equal(g.phase,'roundEnd');assert.equal(g.fighters[0].tier,[1,1,2,2,2,4,4,4,4][stage]);assert.equal(progress.completed.includes(character),stage===8);
  assert.equal(g.fighters[0].hp,g.fighters[0].maxHp,'every cleared level immediately heals to full');
  if(stage<8){assert.equal(progress.checkpoints[character],stage+1);advance(g,2.6);}else advance(g,2.6);
 }
 assert.equal(g.phase,'matchEnd');assert.equal(g.fighters[0].tier,4);assert.equal(progress.checkpoints[character],0);assert.equal(isUnlocked(progress,character),true);assert.equal(g.events.filter(e=>e.type==='campaignEnd'&&e.won).length,1);
});
test('defeat preserves the checkpoint and clears all active attacks',()=>{
 const g=arena('nyra',5),hero=g.fighters[0];g.action(0,3);g.hit(g.fighters[1],hero,10000,{unblockable:true,bypassShield:true,direct:false});
 assert.equal(g.phase,'matchEnd');assert.equal(g.pending.length,0);assert.equal(g.clash,null);assert.equal(g.events.some(e=>e.type==='campaignProgress'),false);assert.equal(g.events.at(-1).won,false);
 const retry=new CampaignGame({character:'nyra',stage:5});assert.equal(retry.stageIndex,5);assert.equal(retry.fighters[0].tier,2);assert.equal(retry.fighters[0].hp,260);
});
test('campaign persistence validates saves and fails safely when storage is unavailable',()=>{
 const map=new Map(),storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};
 assert.deepEqual(loadCampaign(storage),empty());assert.equal(isUnlocked(empty(),'kairo'),true);assert.equal(isUnlocked(empty(),'vex'),true);assert.equal(isUnlocked(empty(),'nyra'),false);
 let progress=recordProgress(empty(),'nyra',8);assert.equal(isUnlocked(progress,'nyra'),false);assert.ok(saveCampaign(storage,progress));assert.deepEqual(loadCampaign(storage),progress);
 progress=recordProgress(progress,'nyra',9,true);saveCampaign(storage,progress);assert.equal(isUnlocked(loadCampaign(storage),'nyra'),true);
 storage.setItem(CAMPAIGN_KEY,JSON.stringify({completed:'nyra',checkpoints:{nyra:88,vex:-1,kairo:2.5}}));assert.deepEqual(loadCampaign(storage),empty());
 storage.setItem(CAMPAIGN_KEY,'bad json');assert.deepEqual(loadCampaign(storage),empty());assert.deepEqual(loadCampaign(undefined),empty());assert.equal(saveCampaign(undefined,progress),false);
});
for(let tier=1;tier<=4;tier++)for(const slot of ACTIVE_SKILLS)test('Nyra tier '+tier+' skill '+slot+' has an animation and resolves correctly',()=>{
 const g=new Game({character:'nyra',mode:'local'});g.phase='fight';const [hero,target]=g.fighters;hero.tier=tier;hero.x=500;hero.meter=100;target.x=640;target.hp=target.maxHp=1000;
 assert.equal(g.action(0,slot),true);assert.ok(CLIPS[hero.animation.name]);assert.equal(hero.armor>0,slot>=3);
 if(slot===2){g.hit(target,hero,20,{direct:false});assert.equal(hero.hp,hero.maxHp);}advance(g,4);
 if(slot!==2)assert.ok(target.hp<1000);if(slot===4)assert.ok(hero.meter<100);
 assert.equal(hero.motion,null);assert.ok(Number.isFinite(hero.x)&&Number.isFinite(hero.y));assert.equal(hero.y,FLOOR);
});
test('Nyra can be selected as the local or singleplayer opponent',()=>{for(const mode of ['ai','local']){const g=new Game({character:'vex',opponent:'nyra',mode});assert.equal(g.fighters[1].character,'nyra');g.phase='fight';g.fighters[1].meter=100;assert.equal(g.action(1,4),true);advance(g,5);assert.ok(g.fighters.every(f=>Number.isFinite(f.hp)));}});
test('every campaign stage runs with real AI without invalid positions or health',()=>{
 for(const character of Object.keys(CAMPAIGNS))for(let stage=0;stage<9;stage++){
  const g=new CampaignGame({character,stage,random:()=>.25});g.phase='fight';g.fighters[0].hp=g.fighters[0].maxHp=10000;
  advance(g,20);for(const f of g.fighters)for(const key of ['x','y','hp','maxHp','tier','vx','vy'])assert.ok(Number.isFinite(f[key]),character+' '+stage+' '+key);
 }
});

test('each route has themed creatures and bosses using its unlockable character',()=>{
 for(const campaign of Object.keys(CAMPAIGNS))for(let stage=0;stage<9;stage++){
  const g=new CampaignGame({character:'vex',campaign,stage});assert.equal(g.fighters[0].character,'vex');
  for(const f of g.fighters.slice(1)){if(f.boss){assert.equal(f.character,campaign);assert.equal(f.tier,g.fighters[0].tier);assert.equal(f.enemyType,undefined);continue;}assert.ok(ENEMIES[f.enemyType]);assert.equal(ENEMIES[f.enemyType].theme,campaign);assert.equal(f.character,null);assert.equal(Object.hasOwn(CHARACTERS,f.enemyType),false);}
 }
 assert.equal(Object.keys(ENEMIES).length,24);
});
test('locked fighters cannot enter campaigns, but owned fighters can clear any route',()=>{
 const locked=new CampaignGame({character:'nyra',campaign:'vex'});assert.equal(locked.fighters[0].character,'kairo');assert.equal(locked.campaign,'vex');
 const owned=new CampaignGame({character:'nyra',campaign:'vex',progress:{completed:['nyra','ronin']}});assert.equal(owned.fighters[0].character,'nyra');
 for(const character of ['kairo','vex']){const g=new CampaignGame({character,campaign:'nyra',stage:8});g.phase='fight';const events=[];g.onEvent=e=>events.push(e);clear(g);assert.equal(g.fighters[0].character,character);assert.equal(g.fighters[0].tier,4);assert.equal(events.find(e=>e.type==='campaignProgress').character,'nyra');assert.equal(events.find(e=>e.type==='campaignProgress').complete,true);}
});
test('early creatures only bite, while elites and bosses have limited dedicated abilities',()=>{
 for(const theme of Object.keys(CAMPAIGNS)){
  assert.deepEqual(ENEMIES[theme+'-0'].abilities,[]);assert.equal(ENEMIES[theme+'-1'].abilities.length,1);assert.equal(ENEMIES[theme+'-2'].abilities.length,1);
  assert.equal(ENEMIES[theme+'-boss-0'].abilities.length,1);assert.equal(ENEMIES[theme+'-boss-2'].abilities.length,3);
  const g=arena(theme),f=g.fighters[1];for(const action of [0,2,3,4,'dash','jump','bolt','pulse','barrage'])assert.equal(g.action(f.id,action),false);assert.equal(g.action(f.id,'bite'),true);
 }
});
for(const [type,def] of Object.entries(ENEMIES))test(type+' attacks have windup, damage, and recovery',()=>{
 for(const action of ['bite',...def.abilities]){
  const g=arena('kairo'),[hero,enemy]=g.fighters;enemy.enemyType=type;enemy.boss=type.includes('boss');enemy.x=620;hero.x=500;hero.hp=hero.maxHp=10000;hero.armor=10;
  assert.equal(g.action(1,action),true);assert.equal(g.action(1,action),false);advance(g,.2);assert.equal(hero.hp,10000);advance(g,2.5);assert.ok(hero.hp<10000,type+' '+action);assert.equal(enemy.cast,null);
 }
});
test('interrupting a creature basic attack cancels its pending hit',()=>{
 const g=arena(),[hero,enemy]=g.fighters;hero.x=500;enemy.x=620;g.action(1,'bite');advance(g,.2);g.hit(hero,enemy,1,{knock:100,stun:.5});advance(g,1);assert.equal(hero.hp,hero.maxHp);
});
test('creature contact attacks clash with shields, remote abilities do not recoil',()=>{
 for(const direct of [true,false]){const g=arena(),[hero,enemy]=g.fighters;hero.x=500;enemy.x=620;enemy.enemyType=direct?'kairo-0':'kairo-1';g.action(0,2);g.action(1,direct?'bite':'bolt');advance(g,.85);assert.equal(hero.hp,hero.maxHp);assert.equal(!!g.clash,direct);advance(g,1.8);if(direct)assert.ok(enemy.x>900);else assert.equal(enemy.down,0);}
});
