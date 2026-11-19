// Shared body paths keep blocked combos recognisable as the original attack.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const point=(t,x,y)=>({t,x,y});
export function stormCombo(tier,x,side,floor){
 const first=tier===1;
 if(tier===3)return {
  duration:2.1,
  attacker:[point(.5,x-side*170,270),point(.85,x,190),point(1.2,x+side*170,280),point(1.8,x,190),point(2.1,x+side*70,floor)],
  defender:[point(.5,x,290),point(1.65,x,290),point(2.1,x,floor)],
  beats:[{t:.5,kind:'rise'},{t:1,kind:'cross'},{t:1.55,kind:'blade'},{t:2.1,kind:'slam'}],
  clips:[[0,'kairo-storm-rise'],[1,'kairo-arsenal-command'],[1.55,'kairo-storm-finish']]
 };
 return {
  duration:first?1.35:2.1,
  attacker:first?[point(.4,x-side*95,405),point(.9,x-side*95,360),point(1.35,x-side*65,floor)]:[point(.5,x-side*100,340),point(.8,x-side*100,340),point(1.2,x+side*110,260),point(1.8,x+side*110,220),point(2.1,x+side*70,floor)],
  defender:first?[point(.4,x,400),point(.95,x,400),point(1.35,x,floor)]:[point(.5,x,290),point(1.65,x,290),point(2.1,x,floor)],
  beats:first?[{t:.4,kind:'rise'},{t:.85,kind:'lightning'},{t:1.35,kind:'slam'}]:[{t:.5,kind:'rise'},{t:1,kind:'cross'},...(tier===2?[{t:1.35,kind:'cross'}]:[]),{t:1.55,kind:'blade'},{t:2.1,kind:'slam'}],
  clips:first?[[0,'kairo-storm-rise'],[.85,'kairo-storm-finish']]:[[0,'kairo-storm-rise'],[1,'kairo-storm-spin'],[1.55,'kairo-storm-finish']]
 };
}
export function samplePath(frames,time){
 let i=1;while(i<frames.length-1&&time>frames[i].t)i++;
 const a=frames[i-1],b=frames[i],p=clamp((time-a.t)/Math.max(.001,b.t-a.t),0,1),s=p*p*(3-2*p);
 return {x:a.x+(b.x-a.x)*s,y:a.y+(b.y-a.y)*s};
}
export function clashSequence(attack,from,defender,origin,floor,width){
 const side=Math.sign(defender.x-origin.x)||1,x=clamp(defender.x,230,width-230),k=attack.kind;
 const a=[point(0,from.x,from.y)],d=[point(0,defender.x,defender.y)];
 if(k==='sword-burst'){
  const combo=stormCombo(attack.tier,x,side,floor),lead=.24,stretch=1.28;
  a.push(point(lead,x-side*65,floor),...combo.attacker.map(p=>point(lead+p.t*stretch,p.x,p.y)));
  d.push(point(lead,x,floor),...combo.defender.map(p=>point(lead+p.t*stretch,p.x,p.y)));
  return {attacker:a,defender:d,duration:lead+combo.duration*stretch+.25,combo:true,
   beats:[{t:lead,kind:'entry'},...combo.beats.map(b=>({...b,t:lead+b.t*stretch}))],
   clips:[[0,'kairo-storm-draw'],...combo.clips.map(([t,name])=>[lead+t*stretch,name])],side};
 }
 const duration=2.4+attack.tier*.15,at=p=>p*duration;
 let beats;
 if(attack.direct){
  // Ascent, aerial wind-up, then the original diving strike into the defense.
  a.push(point(at(.3),x-side*120,attack.height),point(at(.56),x+side*70,attack.height-35),point(at(.75),x-side*65,floor-95),point(duration,x-side*95,floor-70));
  d.push(point(at(.35),x,floor),point(at(.76),x+side*65,floor),point(duration,x+side*125,floor));
  beats=[{t:at(.27),kind:'charge'},{t:at(.75),kind:'slam'},{t:at(.91),kind:'pressure'}];
 }else if(['gravity-lift','zero-crush','singularity','apocalypse'].includes(k)){
  const ultimate=['singularity','apocalypse'].includes(k),height=attack.tier===4?240:490;
  a.push(point(at(.25),clamp(origin.x,100,width-100),height),point(at(.8),clamp(origin.x,100,width-100),height),point(duration,clamp(origin.x,100,width-100),floor));
  d.push(point(at(.18),x,floor),point(at(.42),x+(ultimate?100:0),attack.tier===4?240:390),point(at(.65),x-(ultimate?85:0),attack.tier===4?230:360),point(at(.83),x,floor),point(duration,x+side*95,floor));
  beats=[{t:at(.25),kind:'lift'},{t:at(.47),kind:'crush'},{t:at(.67),kind:'crush'},{t:at(.83),kind:ultimate?'nova':'slam'}];
 }else{
  const height=k==='thunderstorm'?230:attack.tier===1?440:attack.tier===2?310:205;
  a.push(point(at(.23),clamp(origin.x,100,width-100),height),point(at(.83),clamp(origin.x,100,width-100),height),point(duration,clamp(origin.x,100,width-100),floor-50));
  d.push(point(at(.2),x,floor),point(at(.55),x+side*65,floor),point(duration,x+side*145,floor));
  const impacts=k==='meteor'?[.55]:k==='worldfall'?[.25,.35,.45,.55,.65,.75,.87]:k==='meteor-orbit'?[.3,.46,.62,.83]:[.28,.47,.66,.84];
  beats=[{t:at(.18),kind:'charge'},...impacts.map((p,i)=>({t:at(p),kind:i===impacts.length-1?'final':'shot'}))];
 }
 return {attacker:a,defender:d,duration,beats,side,combo:false};
}
