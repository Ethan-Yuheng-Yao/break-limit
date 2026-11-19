import test from 'node:test';
import assert from 'node:assert/strict';
import {CLIPS,characterPose} from '../src/animation.js';
import {armRig} from '../src/rig.js';
import {Game,fighter} from '../src/engine.js';
import {effectRay} from '../src/visual-direction.js';
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
test('idle elbows bend outside the torso on all four fighters',()=>{
 for(const character of ['kairo','vex','nyra','ronin']){
  const pose=characterPose(fighter(0,character),0),{back,front}=armRig(pose,character);
  assert.ok(back.elbow.x<back.shoulder.x);assert.ok(front.elbow.x>front.shoulder.x);
 }
});
test('all animation frames keep fixed arm lengths and hands attached to their wrists',()=>{
 for(const character of ['kairo','vex','nyra','ronin'])for(const name of Object.keys(CLIPS).filter(n=>n.startsWith(character)||!n.includes('-')))for(let i=0;i<=40;i++){
  const pose=characterPose({...fighter(0,character),tier:4,animation:{name,duration:1,elapsed:i/41}},i/41),rig=armRig(pose,character);
  for(const arm of Object.values(rig)){
   assert.ok(Math.abs(distance(arm.shoulder,arm.elbow)-36)<1e-8,name);
   assert.ok(Math.abs(distance(arm.elbow,arm.hand)-36)<1e-8,name);
   assert.ok(distance(arm.shoulder,arm.hand)<72,name);
  }
  assert.ok(distance(rig.front.hand,{x:pose.hx,y:pose.hy})<1e-8);
  assert.ok(distance(rig.back.hand,{x:pose.bx,y:pose.by})<1e-8);
 }
});
test('Ronin slash visuals aim at their hit position from either side, through ultimate crossovers',()=>{
 for(const facing of [-1,1])for(const tier of [1,2,3,4])for(const slot of [0,4]){
  const seen=[],g=new Game({character:'ronin',mode:'local',onEvent:e=>{if(e.kind==='steelCut')seen.push(e);}});g.phase='fight';
  g.fighters.forEach((f,i)=>Object.assign(f,{x:i?720:720-facing*130,tier,hp:10000,maxHp:10000,meter:100}));g.action(0,slot);
  for(let i=0;i<480;i++){g.freeze=0;g.update(1/120);}
  if(tier!==3||slot===0)assert.ok(seen.length);
  for(const e of seen){const ray=effectRay(e,{x:-e.facing*100,y:0}),dx=e.x-e.fromX,dy=e.y-e.fromY;assert.ok(Math.cos(ray.angle)*dx+Math.sin(ray.angle)*dy>0);if(Math.abs(dx)>1)assert.equal(e.facing,Math.sign(dx));}
 }
});
test('scripted melee paths turn the fighter only when they actually cross their opponent',()=>{
 const g=new Game({character:'kairo',mode:'local'});g.phase='fight';const [f,t]=g.fighters;f.x=500;t.x=720;
 g.path(f,[{t:.5,x:900,y:300}],.5,t);f.lock=.6;
 for(let i=0;i<60;i++){g.update(1/120);if(f.motion&&Math.abs(t.x-f.x)>1)assert.equal(f.facing,Math.sign(t.x-f.x));}
});
test('a confirmed basic hit shows the strike pose rather than restarting its windup',()=>{
 for(const character of ['kairo','vex','nyra','ronin']){
  let progress;const g=new Game({character,mode:'local',onEvent:e=>{if(e.type==='damage'&&progress===undefined){const a=g.fighters[0].animation;progress=a.elapsed/a.duration;}}});g.phase='fight';g.fighters[1].x=g.fighters[0].x+100;
  g.action(0,0);for(let i=0;i<50;i++){g.freeze=0;g.update(1/120);}assert.ok(progress>=.46&&progress<.55,character+' '+progress);
 }
});
test('dash streaks end at the movement range, not at a distant off-screen enemy',()=>{
 const effects=[],g=new Game({character:'kairo',mode:'local',onEvent:e=>{if(e.kind==='dashLine')effects.push(e);}});g.phase='fight';g.width=6000;g.fighters[0].x=400;g.fighters[1].x=4400;
 g.action(0,0);for(let i=0;i<15;i++)g.update(1/120);assert.equal(effects.length,1);assert.ok(effects[0].toX-effects[0].fromX<=270);assert.ok(g.fighters[0].x<700);
});
