// Record the real move code, not a second approximation of its animation.
// The sandbox has no AI, persistence or external events; only its visuals escape.
export function recordCast(createGame,profile,origin,target){
 const effects=[],frames=[],hits=[];let time=0;
 const game=createGame(e=>{if(e.type==='effect')effects.push({...e,at:time});if(e.type==='damage')hits.push(time);});
 game.phase='fight';const [f,t]=game.fighters;
 Object.assign(f,{character:profile.character,tier:profile.tier,x:origin.x,y:origin.y,meter:100,hp:100000,maxHp:100000});
 Object.assign(t,{x:target.x,y:target.y,hp:100000,maxHp:100000});
 game.action(0,profile.slot);const duration=f.cast.duration;
 let animation={...f.animation};
 const save=()=>{if(f.animation)animation={...f.animation};frames.push({time,x:f.x,y:f.y,facing:f.facing,animation:{...animation}});};
 save();
 for(let i=1;i<=Math.ceil(duration*120);i++){time=i/120;game.freeze=0;game.update(1/120);save();}
 return {profile,origin,target,duration,frames,effects,hits};
}
export function castFrame(record,time){return record.frames[Math.min(record.frames.length-1,Math.max(0,Math.round(time*120)))];}
export function castImpactTimes(record){
 // A normal victim can be knocked away before a later meteor lands. The clash
 // still intercepts that projectile, so its arrival cannot depend on damage.
 const arrivals=record.effects.filter(e=>e.kind==='meteorBurst').map(e=>e.at);
 return [...new Set((arrivals.length?arrivals:record.hits).map(t=>Math.round(t*120)/120))];
}
export function comboCastTime(record,beats,time,start,duration){
 const points=[[0,start],...beats.map((beat,i)=>[beat.t,record.hits[i]??record.duration]),[duration,record.duration]];
 let i=1;while(i<points.length-1&&time>points[i][0])i++;
 const [at,value]=points[i-1],[end,next]=points[i];return value+(next-value)*Math.max(0,Math.min(1,(time-at)/Math.max(.001,end-at)));
}
export function effectDuration(e){return e.duration||({warning:e.delay||.7,lightning:.65,heavenSpear:1.1,stormBlade:.8,gravityColumn:1.8,blackHole:2,supernova:1.3,meteorBurst:.7,solarFlare:.6,solarPillar:.65,solarBeam:.4})[e.kind]||.4;}
const visible=new Set(['lightning','heavenSpear','stormBlade','stormCrescent','stormCross','gravityColumn','blackHole','supernova','meteorFall','meteorBurst','solarBeam','solarPillar','solarFlare','skyCharge','steelCut','steelFall']);
export function castEffects(record,time){return record.effects.filter(e=>visible.has(e.kind)&&time>=e.at&&time<e.at+effectDuration(e)).map(e=>({...e,max:effectDuration(e),life:effectDuration(e)-(time-e.at)}));}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const bodyLed=profile=>profile.slot===3&&(profile.direct||profile.kind==='thunderstorm');

// Keep each projectile's size, texture and lifetime. Only its trajectory changes.
export function redirectEffect(e,record,contact,defending,floor){
 const map=(x,y)=>({x:contact.x+x-record.target.x,y:defending?floor-(y-110)/(floor-110)*(floor-contact.y):80+(y-110)/(floor-110)*(contact.y-80)});
 const point=map(e.x,e.y),result={...e,...point,redirected:true};
 if(e.fromX!==undefined){const p=map(e.fromX,e.fromY);result.fromX=p.x;result.fromY=p.y;}
 if(e.toX!==undefined){const p=map(e.toX,e.toY);result.toX=p.x;result.toY=p.y;}
 if(e.kind==='meteorFall')result.y=contact.y+(defending?1:-1)*(e.radius||45)*.9;
 if(['blackHole','supernova','meteorBurst','solarFlare'].includes(e.kind)){result.x=contact.x+e.x-record.target.x;result.y=contact.y;}
 result.direction=defending?-1:1;result.contact=contact;
 return result;
}

// A diving move reverses the actual final dive, leading with its fighter. Its
// wind-up keeps the original joint animation; it does not become a shield pose.
export function counterBody(record,time,origin,contact,floor){
 const frame=castFrame(record,time),direct=bodyLed(record.profile);
 if(!direct)return {x:origin.x+(frame.x-record.origin.x)*.2,y:floor-(floor-frame.y)*.28,rotation:0};
 const hit=record.hits[0]||record.duration*.7;
 const start=Math.max(0,hit-.3),p=clamp((time-start)/.3,0,1),ease=p*p*(3-2*p);
 return {x:origin.x+(contact.x-origin.x)*ease,y:origin.y+(contact.y+140-origin.y)*ease,rotation:Math.PI*clamp(time/Math.max(.01,start),0,1)};
}
export function incomingBody(record,time,from,contact,floor,startTime=0){
 const frame=castFrame(record,time);
 if(!bodyLed(record.profile))return {x:frame.x,y:frame.y};
 const hit=record.hits[0]||record.duration*.7,start=Math.max(startTime,hit-.3);
 const p=clamp((time-startTime)/Math.max(.01,start-startTime),0,1),dive=clamp((time-start)/.3,0,1),ease=dive*dive*(3-2*dive);
 return {x:from.x+(contact.x-from.x)*clamp(p+dive,0,1),y:time<start?from.y+(190-from.y)*p:190+(contact.y+15-190)*ease};
}
