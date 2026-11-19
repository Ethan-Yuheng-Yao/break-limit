export const GRAVITY=1850,JUMP_SPEED=850;
export function bodyRadius(f){return f.enemyType?(f.enemyType.includes('-boss-')?75:[60,78,62][Number(f.enemyType.at(-1))]):36;}
export function bodyGap(a,b){return bodyRadius(a)+bodyRadius(b)+8;}

// Resolve the whole crowd repeatedly, including against arena walls. Keep the
// preceding frame's order so ordinary movement dashes cannot tunnel through bodies.
export function separateBodies(fighters,width){
 const ordered=fighters.filter(f=>f.hp>0).sort((a,b)=>(a.previousX??a.x)-(b.previousX??b.x)||a.id-b.id);
 for(let pass=0;pass<128;pass++){
  let overlap=0;
  for(let i=0;i<ordered.length;i++)for(let j=i+1;j<ordered.length;j++){
   const a=ordered[i],b=ordered[j];
   // Authored attack paths and restraints own their close-contact choreography.
   if(Math.abs(a.y-b.y)>=110||a.motion||b.motion||a.capture||b.capture||a.shieldReaction||b.shieldReaction)continue;
   const need=bodyGap(a,b)-(b.x-a.x);if(need<=.005)continue;
   const fixedA=a.armor>0||a.ultimateArmor>0,fixedB=b.armor>0||b.ultimateArmor>0;if(fixedA&&fixedB)continue;
   overlap=Math.max(overlap,need);
   const roomA=fixedA?0:Math.max(0,a.x-60),roomB=fixedB?0:Math.max(0,width-60-b.x);
   let left=Math.min(roomA,need*(fixedB?1:fixedA?0:.5)),right=Math.min(roomB,need-left);
   left=Math.min(roomA,need-right);a.x-=left;b.x+=right;
   if(a.vx>0&&a.stun<=0&&a.down<=0)a.vx=0;if(b.vx<0&&b.stun<=0&&b.down<=0)b.vx=0;
  }
  if(overlap<.01)break;
 }
}

// Travel drives the gait, rather than a clock that keeps feet running in place.
export function creatureMotion(f,time){
 const gait=f.gait||0,speed=f.moveBlend||0,clip=f.animation,p=clip?Math.min(1,clip.elapsed/clip.duration):0;
 const biting=clip?.name==='enemy-bite'||clip?.name==='enemy-clash',casting=clip?.name?.startsWith('enemy-');
 const wind=biting?Math.sin(Math.min(1,p/.48)*Math.PI/2):0,strike=biting?Math.max(0,1-Math.abs(p-.56)/.18):0;
 return {gait,speed,biting,casting,p,lunge:biting?-12*wind*(1-strike)+38*strike:0,
  bob:Math.sin(gait*2)*3*speed+Math.sin(time*2.6+f.id)*1.8,
  lean:Math.sin(gait)*.035*speed+(biting?strike*.22-wind*.08:0),
  flap:Math.sin(time*7+f.id*.9)*(18+speed*12)+(casting?-12*Math.sin(p*Math.PI):0),
  crouch:biting?wind*7-strike*9:casting?Math.sin(p*Math.PI)*6:Math.sin((f.landing||0)/.18*Math.PI)*9};
}
