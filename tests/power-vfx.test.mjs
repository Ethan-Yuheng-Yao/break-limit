import {drawRonin} from '../src/steel-art.js';
import {fighter} from '../src/engine.js';
import {CLIPS} from '../src/animation.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {drawPower,defensePower,powerWidth} from '../src/power-vfx.js';
import {specialMove} from '../src/specials.js';
// A strict canvas stand-in catches invalid geometry that silently kills the live frame loop.
function canvas(){
 const stack=[],operations=[],state={globalAlpha:1};
 const c={save(){stack.push({...state});},restore(){assert.ok(stack.length,'unbalanced canvas restore');Object.assign(state,stack.pop());}};
 for(const name of ['translate','rotate','scale','moveTo','lineTo','arc','ellipse','fillRect'])c[name]=(...args)=>{assert.ok(args.every(Number.isFinite),name+' has invalid geometry');if(name==='arc')assert.ok(args[2]>=0);if(name==='ellipse')assert.ok(args[2]>=0&&args[3]>=0);operations.push([name,...args]);};
 for(const name of ['beginPath','closePath','fill','stroke'])c[name]=()=>operations.push([name]);
 for(const name of ['createLinearGradient','createRadialGradient'])c[name]=(...args)=>{assert.ok(args.every(Number.isFinite));return {addColorStop(offset,color){assert.ok(offset>=0&&offset<=1);assert.equal(typeof color,'string');}};};
 Object.defineProperty(c,'globalAlpha',{get:()=>state.globalAlpha,set:value=>{assert.ok(Number.isFinite(value)&&value>=0&&value<=1);state.globalAlpha=value;}});
 return {c,operations,stack};
}
test('every special has finite, balanced visuals in both directions and reduced effects',()=>{
 for(const character of ['kairo','vex','nyra','ronin'])for(let tier=1;tier<=4;tier++)for(const slot of [3,4])for(const reduced of [false,true])for(const to of [{x:700,y:200},{x:700,y:644},{x:400,y:644}]){
  const profile=specialMove({character,tier},slot),from={x:400,y:644},surface=canvas();
  for(const time of [0,.35,1.5,3.2])drawPower(surface.c,{...defensePower(profile,from,to,powerWidth(profile),time),color:'#9ef9f2',reduced});
  assert.equal(surface.stack.length,0);assert.equal(surface.c.globalAlpha,1);assert.ok(surface.operations.some(([op])=>op==='fill'));
 }
});
test('redirecting a move preserves its detailed artwork instead of selecting a simplified defensive effect',()=>{
 for(const character of ['kairo','vex','nyra','ronin'])for(let tier=1;tier<=4;tier++)for(const slot of [3,4]){
  const profile=specialMove({character,tier},slot),from={x:400,y:600},to={x:400,y:200},width=powerWidth(profile),normal=canvas(),defense=canvas();
  drawPower(normal.c,{kind:profile.kind,tier,from,to,width,time:.85});drawPower(defense.c,defensePower(profile,from,to,width,.85));
  assert.deepEqual(defense.operations,normal.operations);
 }
});
test('Thunder God keeps animating and changes spread while aiming upward',()=>{
 const profile=specialMove({character:'kairo',tier:4},3),from={x:500,y:600},to={x:610,y:220},a=canvas(),b=canvas(),wide=canvas();
 drawPower(a.c,defensePower(profile,from,to,280,.4));drawPower(b.c,defensePower(profile,from,to,280,2.4));drawPower(wide.c,defensePower(profile,from,to,650,.4));
 assert.notDeepEqual(a.operations,b.operations);assert.notDeepEqual(a.operations,wide.operations);
 assert.ok(a.operations.some(([op,angle])=>op==='rotate'&&angle===Math.PI));
});

test('Ronin articulated artwork stays finite and balanced across every sword pose',()=>{
 for(let tier=1;tier<=4;tier++)for(const name of Object.keys(CLIPS).filter(n=>n.startsWith('ronin-')))for(const elapsed of [0,.45,.95]){
  const surface=canvas(),f={...fighter(0,'ronin'),tier,animation:{name,elapsed,duration:1},armor:1,shield:{hp:100},dash:.1};
  drawRonin(surface.c,f,1);assert.equal(surface.stack.length,0);assert.equal(surface.c.globalAlpha,1);
 }
});
