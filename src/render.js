import {material,lantern,scenicSky,surfaceDetail} from './atmosphere.js';
import {drawRonin,steelPower,steelSword} from './steel-art.js';
import {campaignSky,campaignLand} from './campaign-scene.js';
import {specialMove} from './specials.js';
import { W,H,FLOOR,CHARACTERS,clamp,fighterDefinition } from './engine.js';
import { characterPose } from './animation.js';
import {solveArm} from './rig.js';
import {effectRay} from './visual-direction.js';
import {creatureMotion} from './locomotion.js';
import {castEffects,redirectEffect,bodyLed} from './cast-playback.js';
import {drawPower,drawMeteor,drawPowerCollision,powerWidth,defensePower,drawCelestial,drawEvolutionShield,drawComboStrike,drawVoidBurst} from './power-vfx.js';
const TAU=Math.PI*2;
function line(c,points,color,width=2){c.strokeStyle=color;c.lineWidth=width;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();}
function polygon(c,points,fill,stroke){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke();}}
function circle(c,x,y,r,color){c.beginPath();c.arc(x,y,Math.max(.01,r),0,TAU);c.fillStyle=color;c.fill();}
function glow(c,x,y,r,color){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);}
function lightning(c,x1,y1,x2,y2,color,width=2,seed=1){const points=[[x1,y1]];for(let i=1;i<12;i++){const t=i/12,noise=Math.sin(i*27+seed*16)*Math.sin(t*Math.PI);points.push([x1+(x2-x1)*t+noise*30,y1+(y2-y1)*t+Math.cos(i*17+seed)*noise*10]);}points.push([x2,y2]);line(c,points,color,width);}
function arm(c,sx,sy,hx,hy,color,bend=1){
  const {elbow:{x:ex,y:ey}}=solveArm(sx,sy,hx,hy,bend);
  line(c,[[sx,sy],[ex,ey],[hx,hy]],'#080f1b',15);line(c,[[sx,sy],[ex,ey],[hx,hy]],material(c,sx-7,sy,20,50,color,'#8d9ba7'),12);circle(c,ex,ey,6,color);
}


function drawEnemy(c,f,time){
  const d=fighterDefinition(f),color=d.color,storm=d.theme==='kairo',fire=d.theme==='nyra',steel=d.theme==='ronin',scale=f.boss?1.45:1;
  const clip=f.animation,m=creatureMotion(f,time),{p,biting,casting}=m;
  const thrust=m.lunge,breath=m.bob+m.crouch,stride=Math.sin(m.gait)*m.speed;
  const pose=characterPose(f,time),recoil=f.stun>0&&!casting?Math.sin(time*32)*5:0;
  c.save();c.translate(f.x,f.groundY??FLOOR);c.scale(1,.2);glow(c,0,0,75*scale*clamp(1-((f.groundY??FLOOR)-f.y)/700,.5,1),'#00000088');c.restore();
  c.save();c.translate(f.x,f.y);c.scale(f.facing*scale,scale);
  c.translate(thrust+recoil,-68+breath);c.rotate(m.lean+(f.y<(f.groundY??FLOOR)-2?clamp(f.vy/3000,-.25,.25):0));if(f.down>0||clip?.name==='tumble'||clip?.name==='knockdown')c.rotate(pose.turn||1.3);
  if(f.capture)c.rotate(Math.sin(time*8)*.15);
  if(casting&&!biting)glow(c,0,-15,90,color+'55');
  const jaw=biting?Math.sin(p*Math.PI)*15:3;
  if(d.shape==='crawler'){
    for(let i=0;i<3;i++)for(const side of [-1,1]){
      const x=-35+i*26,phase=m.gait+i*Math.PI*.7+(side<0?Math.PI:0),step=Math.cos(phase)*18*m.speed,lift=Math.max(0,Math.sin(phase))*22*m.speed;
      const tuck=f.y<(f.groundY??FLOOR)-2?24:0,foot=x+side*35+step,points=[[x,5],[x+side*22+step*.4,25-lift*.5-tuck*.4],[foot,65-lift-tuck-breath]];
      line(c,points,d.dark,9);line(c,points,color,2);circle(c,points[1][0],points[1][1],4,d.dark);
    }
    c.beginPath();c.ellipse(-7,-3,49,32,0,0,TAU);c.fillStyle=d.dark;c.fill();c.strokeStyle=color;c.lineWidth=2;c.stroke();
    if(storm){for(let i=0;i<4;i++)polygon(c,[[-40+i*20,-18],[-34+i*20,-55],[-19+i*20,-15]],'#315866',color);lightning(c,-45,-20,20,-30,color,2,time);}
    else if(fire){polygon(c,[[-45,-2],[-28,-39],[12,-38],[35,-6],[0,18]],'#9b4428',color);line(c,[[-8,-35],[-8,15]],'#ffe4a0',3);}
    else{circle(c,0,-7,26,'#050713');circle(c,0,-7,16,color);circle(c,6,-7,8,'#080616');for(let i=0;i<7;i++){const a=i*TAU/7;line(c,[[Math.cos(a)*40,Math.sin(a)*24],[Math.cos(a+Math.sin(time+i)*.3)*63,Math.sin(a)*45]],color,3);}}
    polygon(c,[[22,-15],[58,-19-jaw],[66,-4],[32,0]],d.dark,color);polygon(c,[[28,1],[62,12+jaw],[48,25],[19,14]],d.dark,color);circle(c,34,-12,4,'#fff7d5');
  }else if(d.shape==='wing'){
    const flap=m.flap;
    for(const side of [-1,1]){
      polygon(c,[[side*8,-22],[side*54,-62-flap],[side*95,-48-flap],[side*72,5],[side*32,22],[side*12,48]],d.dark,color);
      for(let i=0;i<3;i++)line(c,[[side*14,-14],[side*(45+i*18),-38-flap+i*12]],color,2);
      if(fire)polygon(c,[[side*24,-10],[side*92,-42-flap],[side*60,2],[side*34,28]],'#f5813d66','#ffda92');
      if(!fire&&!storm){circle(c,side*56,-16-flap*.3,15,color+'88');circle(c,side*56,-16-flap*.3,7,'#080514');}
    }
    polygon(c,[[0,-61],[-23,-23],[-14,33],[0,61],[20,22],[24,-20]],d.dark,color);circle(c,0,-26,13,color);circle(c,5,-27,6,'#111023');
    if(storm||fire&&f.boss){polygon(c,[[9,-42],[43,-25],[12,-20]],fire?'#fff0b1':'#eafffa',color);for(let i=0;i<3;i++){if(storm)lightning(c,-10+i*10,35,-25+i*23,70,color,2,time+i);else polygon(c,[[-17+i*12,25],[-35+i*35,88+Math.sin(time*7+i)*13],[4+i*12,26]],'#ff913e88',color);}}
    else for(let i=0;i<4;i++)line(c,[[-15+i*10,25],[-22+i*14,56+Math.sin(time*5+i)*15]],color,3);
  }else if(d.shape==='serpent'){
    for(let i=7;i>=0;i--){const x=-i*14,y=Math.sin(time*5-i*.65)*15+i*5,r=31-i*2;circle(c,x,y,r,d.dark);c.strokeStyle=color;c.lineWidth=2;c.beginPath();c.arc(x,y,r,0,TAU);c.stroke();polygon(c,[[x-10,y-r+5],[x-13,y-r-22],[x+10,y-r]],color+'aa');}
    polygon(c,[[0,-28],[42,-24-jaw],[56,-4],[38,9+jaw],[0,28]],d.dark,color);circle(c,23,-14,6,'#fff2c4');for(let i=0;i<4;i++)polygon(c,[[14+i*8,-2],[19+i*8,8+jaw],[23+i*8,-2]],color);
  }else{
    for(const side of [-1,1]){
      const phase=m.gait+(side<0?Math.PI:0),step=Math.cos(phase)*19*m.speed,lift=Math.max(0,Math.sin(phase))*16*m.speed;
      const leg=[[side*18,18],[side*31+step*.5,40-lift*.4],[side*39+step,68-lift-breath]];line(c,leg,d.dark,22);line(c,leg,color,2);
      const handX=side*(biting?65+thrust:58)-stride*side*9,handY=biting?-15-jaw:18+Math.sin(time*3+side)*3+stride*side*8;
      line(c,[[side*32,-38],[side*62,-18],[handX,handY]],d.dark,24);polygon(c,[[handX-15,handY-15],[handX+16,handY-18],[handX+20,handY+14],[handX-17,handY+18]],d.dark,color);
    }
    polygon(c,[[-40,-49],[0,-65],[40,-49],[36,19],[0,38],[-38,18]],d.dark,color);
    polygon(c,[[-18,-22],[0,-43],[20,-22],[0,9]],color);glow(c,0,-20,40,color+'88');
    polygon(c,[[-22,-65],[-30,-94],[0,-86],[30,-94],[21,-62]],d.dark,color);line(c,[[-15,-73],[15,-73]],'#fff4d6',5);
    if(fire)for(let i=0;i<5;i++)polygon(c,[[-34+i*16,-43],[-30+i*16,-85-Math.sin(time*8+i)*18],[-22+i*16,-43]],'#ff853b66',color);
    if(storm)lightning(c,-35,-45,35,-45,color,3,time);
    if(!fire&&!storm)for(let i=0;i<3;i++){c.strokeStyle=color+'99';c.beginPath();c.ellipse(0,-20,58+i*10,12+i*4,time*.4,0,TAU);c.stroke();}
  }
  if(steel){if(d.shape==='crawler'){for(let i=0;i<3;i++)steelSword(c,-35+i*26,-20,50,-.45+i*.4,1);}else if(d.shape==='wing'){for(const side of [-1,1])steelSword(c,side*40,-15,80,side*1.2,2);}else steelSword(c,60,20,115,.3,3);}
  if(f.boss){for(let i=0;i<3+d.rank;i++){const a=i*TAU/(3+d.rank)+time*.7;polygon(c,[[Math.cos(a)*85,Math.sin(a)*55-30],[Math.cos(a)*95,Math.sin(a)*65-42],[Math.cos(a)*102,Math.sin(a)*55-24]],color+'88');}}
  if(f.armor>0){c.strokeStyle=color+'77';c.lineWidth=2;c.beginPath();c.ellipse(0,-10,95,105,0,0,TAU);c.stroke();}
  c.restore();
}


function meteor(c,x,y,r,angle,time,color='#ffbf78'){
 drawMeteor(c,x,y,r,angle,time,color);
}
function sunRay(c,x1,y1,x2,y2,r,color,time){
 drawPower(c,{kind:'solar-lance',from:{x:x1,y:y1},to:{x:x2,y:y2},width:r*5,color,time});
}
function phoenixWings(c,x,y,r,color,time){
 c.save();c.translate(x,y);for(const side of [-1,1])for(let i=0;i<5;i++){const lift=Math.sin(time*7)*r*.12;polygon(c,[[side*12,0],[side*(r-i*r*.12),-r*.45+lift+i*10],[side*(r*.55-i*10),r*.2+i*5]],i%2?color+'99':'#ff7e4266',color);}c.restore();
}
function gravityRings(c,x,y,r,color,time,black=false){
 glow(c,x,y,r*1.3,color+'33');if(black)circle(c,x,y,r*.55,'#03030e');
 for(let i=0;i<4;i++){c.strokeStyle=color;c.lineWidth=2;c.beginPath();c.ellipse(x,y,r*(.6+i*.15),r*(.18+i*.1),time*.7+i*.55,0,TAU);c.stroke();}
}
function drawSignature(c,f,m,time){
 const color=fighterDefinition(f).color,x=f.x,y=f.y-125,k=m.kind;
 if(['meteor-orbit','worldfall'].includes(k)){const count=k==='worldfall'?5:3;for(let i=0;i<count;i++){const a=time*1.7+i*TAU/count;meteor(c,x+Math.cos(a)*95,y-70+Math.sin(a)*25,13+i%2*4,a,time,color);}if(k==='worldfall'){glow(c,x,y-75,95,'#ffbd6355');circle(c,x,y-75,28,'#ffe9ab');}}
 if(k==='meteor')meteor(c,x+f.facing*26,y-65,23,-Math.PI/2,time,color);
 if(!f.clashMove&&(k.startsWith('phoenix')||k==='flare-kick'))drawPower(c,{kind:k,from:{x:x-f.facing*80,y:y+70},to:{x:x+f.facing*60,y:y},width:m.tier===4?350:260,tier:m.tier,color,time,strength:.8});
 if(k==='solar-lance'){glow(c,x+f.facing*40,y+30,60,color+'66');circle(c,x+f.facing*40,y+30,16,'#fff6cd');}
 if(k==='corona'){for(let i=0;i<3;i++){const xx=x+(i-1)*60;line(c,[[xx,f.y],[xx,y-20-Math.sin(time*4+i)*25]],color+'88',3);}}
 if(['singularity','apocalypse'].includes(k))gravityRings(c,x,y-40,k==='apocalypse'?100:65,color,time,true);
 if(['gravity-lift','zero-crush'].includes(k)){for(const side of [-1,1])gravityRings(c,x+side*45,y,24,color,time);}
 if(k==='thunderstorm'||k==='divine-spear'){glow(c,x,y-55,75,color+'44');for(let i=0;i<3;i++)lightning(c,x-50+i*50,y-85,x,y-10,color,2,time+i);}
}
// Used for the normal dive and its redirected clash: same bolts, same fighter.
function drawDiveTrail(c,f,profile,time,contact=null,defending=false,reduced=false,effectTime=time){
 if(!bodyLed(profile))return;
 const strike=profile.character==='kairo'?(profile.tier===4?1.55:.76):profile.tier===4?1.7:profile.tier===2?1.05:.75;
 if(time<strike)return;
 const head=contact||{x:f.x,y:f.y-20};
 const from=defending?{x:head.x,y:FLOOR+25}:{x:f.x,y:Math.max(55,f.y-420)};
 const kind=profile.character==='kairo'?'lightning':profile.kind;
 drawPower(c,{kind,from,to:head,width:profile.character==='kairo'?(profile.tier===4?560:250):powerWidth(profile),tier:profile.tier,time:effectTime,color:fighterDefinition(f).color,reduced});
}
function drawSpecialClash(renderer,game,reduced=false){
 const c=renderer.c,q=game.clash,a=game.fighters[q.attacker],d=game.fighters[q.defender];
 const contact=q.sequence.combo?{x:(a.x+d.x)/2,y:d.y-95}:q.contact;
 const colors=[fighterDefinition(a).color,fighterDefinition(d).color];
 const paint=(record,time,defending)=>{
  if(!record)return;
  let effects=castEffects(record,time);
  // Sustain the move's own firing section while it counters successive impacts.
  // This reuses its actual meteor/bolt/field effects, never a generic barrier.
  if(defending&&!effects.some(e=>e.kind!=='skyCharge')){
   const hit=record.hits[0]||record.duration*.7;
   const next=q.sequence.beats[q.beatIndex]?.t??q.duration;
   effects=castEffects(record,Math.max(0,hit-.5+clamp((q.elapsed-next+.5)/.5,0,1)*.5));
  }
  c.save();c.beginPath();
  if(!q.sequence.combo)c.rect(0,defending?contact.y:0,game.width,defending?H-contact.y:contact.y);else c.rect(0,0,game.width,H);
  c.clip();
  for(const event of effects){const e=redirectEffect(event,record,contact,defending,FLOOR);renderer.drawEffect(e,time);}
  c.restore();
 };
 paint(q.attackCast,q.attackTime,false);
 paint(q.defenseCast,q.defenseTime,true);
 drawDiveTrail(c,a,q.attack,a.visualCastTime??q.attackTime,bodyLed(q.attack)?{x:a.x,y:a.y-20}:null,false,reduced,q.elapsed);
 if(q.defenseCast)drawDiveTrail(c,d,q.defense,d.visualCastTime,bodyLed(q.defense)?{x:d.x,y:d.y-140}:null,true,reduced,q.elapsed);
 if(q.beatIndex>0){
  drawPowerCollision(c,contact.x,contact.y,Math.min(450,powerWidth(q.attack)),q.elapsed,colors[0],colors[1],reduced);
  if(q.losing)for(let i=0;i<4;i++)lightning(c,contact.x+(i-1.5)*45,contact.y-30,contact.x+(i-1.5)*55,contact.y+35,'#ffcbb4',2,q.elapsed+i);
 }
}
export function drawFighter(c,f,time,{portrait=false,ghost=false}={}){
  if(f.character==='ronin')return drawRonin(c,f,time,{portrait,ghost});
  if(f.enemyType){c.save();if(ghost)c.globalAlpha*=.12;drawEnemy(c,f,time);c.restore();return;}
  const kairo=f.character==='kairo',solar=f.character==='nyra',aw=f.tier===4,color=solar?(aw?'#fff1ba':f.tier===3?'#fff0d0':f.tier===2?'#ff9f68':'#e89554'):kairo?(aw?'#e1fffc':'#88ede9'):(aw?'#e1b8ff':'#b18bf0');
  const moving=f.pose==='run',attack=f.attackTime>0&&['attack','skill'].includes(f.pose),hurt=f.pose==='hurt';
  const pose=characterPose(portrait?{...f,y:FLOOR}:f,time);
  c.save();if(!portrait&&!ghost){c.save();c.translate(f.x,f.groundY??FLOOR);c.scale(1,.22);glow(c,0,10,85*clamp(1-((f.groundY??FLOOR)-f.y)/700,.5,1),aw?(solar?'#ffa04d35':'#b094ff35'):'#00000099');c.restore();}c.translate(f.x,f.y);
  if(f.clashRotation){c.translate(0,-80);c.rotate(f.clashRotation);c.translate(0,80);}
  if(f.dash>0&&!portrait){
    c.save();c.scale(f.facing,1);const length=100+f.tier*45;
    glow(c,-40,-70,80+f.tier*18,color+'55');
    if(solar){
      for(let i=0;i<5+f.tier;i++){const y=-100+i*9;polygon(c,[[25,y],[-length*(.6+.3*Math.sin(time*30+i)),y+Math.sin(time*20+i)*16],[0,y+12]],i%2?'#ffc36daa':'#ff783e88');}
      if(aw){glow(c,0,-70,75,'#ffb64d99');polygon(c,[[38,-70],[-25,-109],[-4,-70],[-28,-31]],'#fff2b4');}
    }else if(kairo){
      for(let i=0;i<f.tier+1;i++)lightning(c,-length,-70+(i-f.tier/2)*15,35,-70,color,2+f.tier*.7,time*20+i);
      if(aw){polygon(c,[[-200,-75],[-50,-94],[-80,-65],[45,-78],[-35,-44],[-10,-70]],'#efffff',color);glow(c,0,-70,60,'#eaffff99');}
    }else{
      for(let i=0;i<f.tier+1;i++){c.strokeStyle=color;c.lineWidth=2;c.beginPath();c.ellipse(-i*45,-70,15+f.tier*3,35+f.tier*9,0,0,TAU);c.stroke();}
      if(aw){circle(c,0,-70,30,'#090412');c.strokeStyle=color;c.lineWidth=4;c.beginPath();c.ellipse(0,-70,48,22,-.35,0,TAU);c.stroke();}
    }
    c.restore();if(aw){c.restore();return;}
  }
  c.translate(0,aw?-9+Math.sin(time*3)*4:0);c.scale(f.facing,1);
  if(f.capture?.kind==='singularity'){const shrink=clamp(.4+f.capture.time*.35,.4,1);c.scale(shrink,shrink);}
  c.translate(pose.dx,pose.dy-65);c.rotate(pose.turn);c.translate(0,65);
  if(ghost)c.globalAlpha=.12;
  if((f.tier>=2||portrait)&&!f.down){glow(c,0,-65,aw?140:100,solar?'#ff983b33':kairo?'#7ddfff22':'#9b60ff33');
    for(let i=0;i<(aw?9:4);i++){const a=time*(kairo?1.6:-.6)+i*TAU/(aw?9:4);const x=Math.cos(a)*56,y=-75+Math.sin(a)*75;
      if(kairo)lightning(c,x,y,x+12,y-28,color+'85',1,time+i);else polygon(c,[[x,y-6],[x+5,y],[x,y+6],[x-4,y]],color+'aa');}}
  if(aw&&!f.down){
    c.save();c.translate(0,-123);c.rotate(time*.4);c.strokeStyle=color+'bb';c.lineWidth=2;c.beginPath();c.ellipse(0,0,kairo?45:66,kairo?15:49,0,0,TAU);c.stroke();
    if(solar){for(let i=0;i<12;i++){const a=i*TAU/12;line(c,[[Math.cos(a)*35,Math.sin(a)*35],[Math.cos(a)*58,Math.sin(a)*58]],color,3);}}
    else if(!kairo){circle(c,0,0,36,'#070914');c.strokeStyle='#9360da';c.beginPath();c.ellipse(0,0,27,12,0,0,TAU);c.stroke();circle(c,0,0,6,'#ddc5ff');}
    else for(let i=0;i<5;i++){const a=i*TAU/5;circle(c,Math.cos(a)*45,Math.sin(a)*15,4,color);}
    c.restore();
  }
  if(solar&&f.tier>=2&&!f.down){
    if(f.tier===2){phoenixWings(c,-10,-86,85,color,time);for(let i=0;i<2;i++){const a=time*1.3+i*Math.PI;circle(c,Math.cos(a)*60,-85+Math.sin(a)*35,7,'#ffc078');}}
    if(f.tier===3){for(let i=0;i<6;i++){const a=time*.6+i*TAU/6,x=Math.cos(a)*60,y=-105+Math.sin(a)*60;polygon(c,[[x,y-12],[x+8,y],[x,y+12],[x-8,y]],'#fff1c788',color);}polygon(c,[[-20,-105],[-32,-121],[-9,-111]],'#fff3d5',color);polygon(c,[[19,-105],[31,-121],[8,-111]],'#fff3d5',color);}
    if(aw)phoenixWings(c,0,-88,145,color,time);
  }
  // Articulated legs stay below the rotating torso and bend during lunges/jumps.
  const kneeLift=Math.max(0,pose.dy)*.55,groundOffset=f.y>=(f.groundY??FLOOR)-1?pose.dy:0,ly=pose.ly-groundOffset,ry=pose.ry-groundOffset;
  line(c,[[-11,-46],[(pose.lf-11)*.5-8,-23-kneeLift+ly*.3],[pose.lf,ly]],aw&&kairo?'#b4c8d0':'#182738',13);
  line(c,[[10,-46],[(pose.rf+10)*.5+9,-23-kneeLift+ry*.3],[pose.rf,ry]],aw&&kairo?'#e6f2f4':'#2d3e50',13);
  line(c,[[pose.lf-4,ly],[pose.lf+10,ly]],'#82a8b8',6);line(c,[[pose.rf-3,ry],[pose.rf+12,ry]],color+'a0',6);
  c.save();c.translate(0,-55);c.rotate(pose.lean);c.translate(0,55);
  // The rear arm belongs behind the chest, not across the front of the face.
  arm(c,-17,-95,pose.bx,pose.by,kairo&&aw?'#9fb7c7':'#233448',1);
  circle(c,pose.bx,pose.by,kairo?6:10,solar?'#d28a56':kairo?'#aabcc5':'#70518d');
  // Torso, head, scarf, arms, and weapon follow the same body pivot.
  const tail=moving?Math.sin(time*12)*8:Math.sin(time*3)*6;
  polygon(c,[[-15,-104],[-37,-99],[-70-(moving?14:0),-108+tail],[-54,-88+tail],[-21,-82]],solar?'#ca552e':kairo?(aw?'#d9f9f6':'#3e9fa8'):'#5e3a8d',color+'55');
  const coat=kairo?(aw?'#dce8ed':'#192d3f'):solar?(aw?'#fff1d4':f.tier===3?'#e6d2a7':f.tier===2?'#772f21':'#40251f'):aw?'#170e29':'#252038';
  polygon(c,[[-19,-103],[14,-103],[24,-53],[35,-29],[6,-40],[0,-58],[-8,-38],[-32,-29],[-22,-55]],material(c,-27,-107,65,85,coat,kairo?'#7ba2af':solar?'#c79470':'#82759b'),color+'80');
  polygon(c,[[-15,-98],[-5,-103],[4,-66],[-9,-61]],solar?'#ba653b':kairo?'#376276':'#624388');
  polygon(c,[[13,-103],[22,-93],[14,-71],[5,-67]],solar?(aw?'#ffe5a3':'#9e643c'):aw?'#bd93df':'#36455a');
  line(c,[[-20,-56],[22,-56]],solar?'#ffc580':kairo?'#76c9c9':'#b490d7',5);
  if(aw){for(let i=0;i<3;i++)line(c,[[-17+i*12,-89],[-12+i*12,-72],[-17+i*12,-66]],color,1.5);}
  for(let i=0;i<3;i++)line(c,[[-19+i*13,-90],[-13+i*12,-66],[-18+i*10,-40]],'#edf5f51f',1);
  polygon(c,[[-26,-96],[-17,-107],[-9,-100],[-14,-85]],material(c,-27,-109,20,30,coat,'#a5bac3'),color+'66');
  line(c,[[4,-64],[15,-48],[26,-37]],color+'66',1);
  // Neck, face, and silhouette-defining hair.
  polygon(c,[[-6,-111],[7,-111],[8,-101],[-8,-101]],'#b4b8bc');
  polygon(c,[[-14,-129],[8,-135],[17,-123],[13,-110],[4,-104],[-10,-111]],material(c,-14,-136,35,32,kairo?'#b5c1c6':'#ada5b8','#f0d5bd'),'#405465');
  if(kairo)polygon(c,[[-16,-118],[-21,-134],[-13,-132],[-17,-147],[-6,-138],[-1,-153],[6,-138],[15,-146],[14,-132],[25,-131],[14,-122],[5,-130],[-3,-117]],aw?'#f1ffff':'#d1e3e7',color+'88');
  else polygon(c,[[-16,-116],[-22,-129],[-15,-145],[-5,-138],[6,-147],[19,-136],[17,-123],[8,-130],[-1,-120],[-6,-111]],solar?(aw?'#ffffff':f.tier===3?'#ffeab7':f.tier===2?'#ffbd65':'#bd673f'):aw?'#e0c9f5':'#3f344f',color+'66');
  line(c,[[5,-118],[13,-120]],color,aw?3:2);if(aw)glow(c,10,-119,13,color+'77');
  const armX=pose.hx,armY=pose.hy;
  arm(c,17,-96,armX,armY,kairo&&aw?'#cedee4':'#3a465e',-1);
  circle(c,armX,armY,7,solar?'#e3a571':kairo?'#bccbd1':'#8563a7');
  if(kairo){
    c.save();c.translate(armX,armY);c.rotate(pose.sword);
    line(c,[[0,10],[0,-8]],'#294759',5);line(c,[[-9,-8],[9,-8]],'#d2b98e',4);
    polygon(c,[[-2,-10],[-2,aw?-104:-86],[3,aw?-119:-97],[4,-10]],aw?'#edffff':'#a5dae2',color);
    line(c,[[4,-14],[4,aw?-110:-90]],color,2);if(aw)glow(c,0,-65,45,'#b1ffff30');c.restore();
  }else{
    polygon(c,[[armX-11,armY-14],[armX+8,armY-15],[armX+14,armY+2],[armX-5,armY+10]],solar?(aw?'#fff0b4':'#854122'):aw?'#140d21':'#403252',color);
    if(attack||aw){glow(c,armX+3,armY,40,solar?'#ffad5555':'#bb72ff55');circle(c,armX+3,armY,10,solar?'#fff1bd':'#171026');}
  }
  c.restore();
  if(f.guard){c.strokeStyle=color+'b0';c.lineWidth=2;c.beginPath();c.ellipse(18,-76,46,70,0,-Math.PI/2,Math.PI/2);c.stroke();}
  if(f.shield&&(f.shield.hp>0||f.shieldReaction)){
    const storm=f.shield.type==='storm',strength=f.shield.hp/f.shield.max;c.strokeStyle=color;c.lineWidth=3;c.globalAlpha=.4+strength*.5;
    if(solar){
      if(f.tier===1){polygon(c,[[42,-133],[75,-110],[70,-45],[42,-15],[31,-75]],'#ed8c4833',color);for(let i=0;i<3;i++)line(c,[[42,-35-i*26],[68,-58-i*22]],color,3);}
      if(f.tier===2)for(let i=0;i<3;i++){const a=time*2.5+i*TAU/3;meteor(c,30+Math.cos(a)*64,-77+Math.sin(a)*76,19,a+Math.PI/2,time,color);}
      if(f.tier===3)for(let i=0;i<4;i++){const a=time+i*TAU/4,x=30+Math.cos(a)*65,y=-78+Math.sin(a)*80;polygon(c,[[x,y-29],[x+22,y+16],[x-22,y+16]],'#fff3cc33',color);line(c,[[30,-78],[x,y]],color+'88',2);}
      if(aw){phoenixWings(c,20,-85,165,color,time);c.beginPath();c.ellipse(30,-80,100,125,0,0,TAU);c.stroke();glow(c,30,-80,130,color+'22');}
    }else{drawEvolutionShield(c,f.character,f.tier,time,color,f.shield.stored);
    }c.globalAlpha=ghost?.25:1;
  }
  if(solar&&!f.down&&f.tier!==3){for(let i=0;i<(aw?9:f.tier===2?5:2);i++){const x=(i-(aw?4:1.5))*15,y=-70+Math.sin(time*6+i)*12;polygon(c,[[x-8,y+10],[x+Math.sin(time*9+i)*7,y-25-f.tier*5],[x+9,y+8]],'#ff8f3a44',color+'88');}}
  if(f.armor>0){c.strokeStyle=color+'88';c.lineWidth=1.5;for(let i=0;i<3;i++){const y=-145+((time*70+i*60)%175);line(c,[[-37,y],[-43,y-12]],color+'99',2);line(c,[[40,y],[46,y-12]],color+'99',2);}glow(c,0,-60,100,color+'16');}
  if(hurt){c.globalCompositeOperation='screen';glow(c,0,-75,70,'#ffffff44');}
  c.restore();
}

export class Renderer {
  constructor(canvas){this.canvas=canvas;this.c=canvas.getContext('2d');this.c.lineJoin='round';this.c.lineCap='round';this.fx=[];this.particles=[];this.labels=[];this.shake=0;this.flash=0;this.reduced=false;this.cinematic=null;this.callout=null;}
  event(e){
    if(e.type==='barrierStart'){this.fx=[];this.particles=[];this.cinematic=null;this.flash=0;}
    if(e.type==='specialCollision'){
      const radius=e.final?240:125+e.tier*20;
      this.fx.push({...e,kind:'forceImpact',radius,life:.55,max:.55});
      this.shake=Math.max(this.shake,e.final?23:10+e.tier*2);this.flash=Math.max(this.flash,e.final?.24:.09);
      for(let i=0;i<(this.reduced?8:40);i++){const angle=i*TAU/40,speed=180+(i%7)*85;this.particles.push({x:e.x,y:e.y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:.3+(i%4)*.1,color:i%2?e.color:e.defenseColor,size:i%3+1});}
    }
    if(e.type==='effect'){
      const durations={transform:3.5,ultimate:1.5,warning:e.delay||.7,vortex:1.0,lightning:.65,crush:.7,detonate:1.0,beam:.38,dash:.38,afterimage:.38,fracture:7,skyCharge:1,gravityColumn:1.8,blackHole:2,supernova:1.3,heavenSpear:1.1,dashLine:.32,shieldBurst:.7,shieldHit:.3};
      this.fx.push({...e,life:e.duration||durations[e.kind]||.4,max:e.duration||durations[e.kind]||.4});
      if(['steelCut','steelFall','stormCrescent','stormCross','stormBlade','heavenSpear','supernova','meteorBurst','solarPillar'].includes(e.kind)){
        this.fx.push({...e,kind:'forceImpact',defenseColor:'#effffa',radius:Math.min(260,e.radius||160),life:.4,max:.4});
        this.shake=Math.max(this.shake,8+e.tier*2);
      }
      if(['impact','detonate','lightning','crush','transform','fracture','supernova','heavenSpear','shieldBurst'].includes(e.kind)){
        const big=['detonate','transform','supernova','heavenSpear','fracture'].includes(e.kind);const count=this.reduced?9:(big?100:18+e.tier*9);
        for(let i=0;i<count;i++){const a=Math.random()*TAU,s=80+Math.random()*(big?800:350);this.particles.push({x:e.x,y:e.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-70,life:.25+Math.random()*.65,color:e.color,size:1+Math.random()*(big?5:3)});}
        this.shake=Math.max(this.shake,big?20:4+e.tier*2);this.flash=Math.max(this.flash,big?.35:.1);
      }
    }
    if(e.type==='damage')this.labels.push({...e,life:.85});
    if(e.type==='callout')this.callout={...e,life:1.1};
    if(e.type==='cinematic')this.cinematic={...e,life:e.duration||1.5};
  }
  backdrop(game){
    const paint=()=>{if(game.terrain)campaignSky(this.c,game);else this.background(game.time,game.domain);};
    // Reuse atmospheric layers between updates; characters and attacks remain full-rate.
    if(typeof OffscreenCanvas==='undefined'){paint();return;}
    const key=[!!game.terrain,game.terrain?.theme,game.domain,Math.floor(game.time*12),Math.round((game.cameraX||0)/6)].join(':');
    if(!this.skyBuffer)this.skyBuffer=new OffscreenCanvas(W,H);
    if(this.skyKey!==key){
      const screen=this.c;this.c=this.skyBuffer.getContext('2d');this.c.lineJoin='round';this.c.lineCap='round';
      try{paint();this.skyKey=key;}finally{this.c=screen;}
    }
    this.c.drawImage(this.skyBuffer,0,0);
  }
  background(time,domain){
    const c=this.c;
    const sky=c.createLinearGradient(0,0,0,H);sky.addColorStop(0,domain?'#100c25':'#0b1522');sky.addColorStop(.7,domain?'#23314b':'#243b4c');sky.addColorStop(1,'#0a1723');c.fillStyle=sky;c.fillRect(0,0,W,H);
    glow(c,domain?440:830,200,domain?440:300,domain?'#80d4eb30':'#9ecada15');
    if(domain){
      glow(c,1080,250,320,'#a163dd44');circle(c,1080,250,137,'#080812');
      c.save();c.translate(1080,250);c.rotate(-.3);for(let j=0;j<4;j++){c.strokeStyle=`rgba(181,133,255,${.3-j*.055})`;c.lineWidth=3-j*.5;c.beginPath();c.ellipse(0,0,165+j*17,44+j*9,0,0,TAU);c.stroke();}c.restore();
      for(let i=0;i<5;i++)lightning(c,110+i*146,0,170+i*113,300+Math.sin(time+i)*130,'#baf8ff'+(Math.sin(time*2+i)>0?'50':'18'),2,Math.floor(time*3)+i);
    }else{circle(c,870,185,60,'#d7e8e413');circle(c,883,173,57,'#112130');}
    for(let layer=0;layer<3;layer++){
      const pts=[[0,620]];for(let x=-100;x<=W+120;x+=120)pts.push([x,380+layer*60+Math.sin(x*.004+layer*7)*55+Math.cos(x*.013+layer)*34]);pts.push([W,700]);polygon(c,pts,['#182938','#142535','#112332'][layer]);
    }
    scenicSky(c,time,0,domain?'vex':'kairo');
    // Mist, distant shrines, and hanging architectural details.
    for(let i=0;i<7;i++){const x=(i*291+time*(domain?8:3))%(W+320)-160,y=410+i%3*43;const g=c.createLinearGradient(0,y-24,0,y+24);g.addColorStop(0,'transparent');g.addColorStop(.5,'#83aabc0b');g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(x,y-24,440,48);}
    for(const [x,scale]of [[150,.75],[1200,.6],[670,.4]]){
      c.save();c.translate(x,540);c.scale(scale,scale);c.fillStyle='#0d1c28';c.fillRect(-75,-200,16,200);c.fillRect(65,-200,16,200);polygon(c,[[-118,-220],[-108,-231],[-75,-214],[80,-214],[121,-231],[111,-213],[0,-202]],'#0d1c28');c.fillRect(-92,-180,185,10);c.restore();
    }
    for(let i=0;i<10;i++){
      let x=i*161+25,y=domain?420+Math.sin(i*7+time*.7)*80:630;
      if(domain){c.save();c.translate(x,y);c.rotate(Math.sin(i+time*.2)*.3);polygon(c,[[-32,-4],[4,-17],[44,0],[27,30],[-12,51]],'#1d293d','#58618088');line(c,[[-32,-4],[4,-17],[44,0]],'#88a0c36b');c.restore();}
    }
    for(const x of [135,1290])lantern(c,x,475,time);
    // The combat plane is deliberately clear and stable in both arenas.
    const floor=c.createLinearGradient(0,FLOOR,0,H);floor.addColorStop(0,domain?'#273145':'#233b49');floor.addColorStop(1,'#0c1722');c.fillStyle=floor;c.fillRect(0,FLOOR,W,H-FLOOR);
    line(c,[[0,FLOOR],[W,FLOOR]],domain?'#b5a9e680':'#8fbdcf66',2);
    for(let i=-5;i<15;i++)line(c,[[W/2+(i-5)*80,FLOOR],[W/2+(i-5)*230,H]],'#718ca119',1);
    for(let i=0;i<4;i++){const y=FLOOR+20+i*i*12;line(c,[[0,y],[W,y]],'#718ca11d',1);}
    for(let i=0;i<12;i++){const x=i*127+Math.sin(i*7)*30;line(c,[[x,FLOOR],[x+18,FLOOR+15],[x+8,FLOOR+22],[x+26,FLOOR+37]],'#06121eaa',2);}
    for(let i=0;i<38;i++){const x=(i*173+time*(10+i%8))%W,y=100+(i*83)%540+Math.sin(time+i)*15;circle(c,x,y,i%4===0?1.4:.7,domain?'#c4aeec55':'#aad8dc44');}
    surfaceDetail(c,()=>FLOOR,0,W,time,domain?'vex':'kairo');
    const vignette=c.createRadialGradient(W/2,H/2,250,W/2,H/2,830);vignette.addColorStop(0,'transparent');vignette.addColorStop(1,'#03081199');c.fillStyle=vignette;c.fillRect(0,0,W,H);
  }
  drawEffect(e,time){
    const c=this.c,p=1-e.life/e.max,color=e.color||'#bbfaff';
    c.save();c.globalAlpha=Math.min(1,e.life*5);c.translate(e.x,e.y);c.strokeStyle=color;c.lineWidth=2;
    if(e.kind==='steelCut'||e.kind==='steelFall'){
      const fall=e.kind==='steelFall',length=fall?390:100;c.save();
      if(fall){if(e.redirected&&e.direction<0)c.rotate(Math.PI);c.translate(0,-length);}
      else {const ray=effectRay(e,{x:-(e.facing||1)*100,y:0});c.rotate(ray.angle-Math.PI/2);c.translate(0,-length*.7);}
      steelPower(c,length,e.radius*2,time,e.tier,e.variant||0,fall);c.restore();c.restore();return;
    }
    if(e.kind==='steelWard'){c.save();c.globalAlpha*=1-p;steelSword(c,30,40,160+p*80,0,e.tier);c.restore();}
    const shared={lightning:'lightning',heavenSpear:'divine-spear',stormBlade:'divine-spear',stormCrescent:'blade-dive',stormCross:'sword-burst',gravityColumn:e.tier===4?'zero-crush':'gravity-lift',blackHole:e.tier===4?'apocalypse':'singularity'}[e.kind];
    if(shared){
      const melee=shared==='blade-dive'||shared==='sword-burst';
      const fallback=melee?{x:-(e.facing||1)*110,y:0}:{x:0,y:e.redirected?(e.direction<0?FLOOR-e.y:70-e.y):shared==='lightning'||shared==='divine-spear'?-720:-480};
      const {from,to}=effectRay(e,fallback),width=(e.radius||180)*(shared==='lightning'?1.5:1.6);
      drawPower(c,{kind:shared,from,to,width:clamp(width,140,700),tier:e.tier||1,time,color,strength:Math.min(1,(1-p)*2),reduced:this.reduced});
      c.restore();return;
    }
    if(e.kind==='meteorFall'){const x=e.fromX+(e.x-e.fromX)*p-e.x,y=e.fromY+(e.y-e.fromY)*p-e.y,angle=Math.atan2(e.y-e.fromY,e.x-e.fromX);if(e.celestial||e.shard)drawCelestial(c,x,y,e.radius||45,angle,time,!!e.shard);else meteor(c,x,y,e.radius||45,angle,time,color);}
    if(e.kind==='comboStrike'){c.save();c.scale(e.facing||1,1);drawComboStrike(c,e.character,e.tier,time,color,e.step);c.restore();}
    if(e.kind==='meteorBurst'&&e.celestial){drawCelestial(c,0,0,(e.radius||250)*(.15+p*.65),Math.PI/2,time);c.restore();return;}
    if(e.kind==='meteorBurst'){glow(c,0,0,(e.radius||250)*(.3+p),color+'66');for(let i=0;i<16;i++){const a=i*TAU/16,r=p*(e.radius||250);polygon(c,[[Math.cos(a)*r,Math.sin(a)*r*.6],[Math.cos(a)*r+15,Math.sin(a)*r*.6-10],[Math.cos(a)*r+8,Math.sin(a)*r*.6+12]],'#793923',color);}circle(c,0,0,30*(1-p),'#fff4cd');}
    if(e.kind==='solarBeam')sunRay(c,e.fromX-e.x,e.fromY-e.y,e.toX-e.x,e.toY-e.y,e.radius||30,color,time);
    if(e.kind==='alert'){c.font='bold 35px Arial';c.textAlign='center';c.fillStyle='#fff1ba';c.fillText('!',0,-100-p*25);}
    if(e.kind==='solarPillar'){const source=e.redirected?(e.direction<0?FLOOR-e.y:70-e.y):-480;sunRay(c,0,source,0,0,e.radius*.5,color,time);for(let i=0;i<6;i++){const y=source*((p+i/6)%1);polygon(c,[[-35,y],[0,y-55],[35,y]],'#ffb85766',color);}}
    if(e.kind==='enemySwipe'){

      c.save();c.scale(e.facing||1,1);for(let i=0;i<3;i++){c.strokeStyle=color;c.lineWidth=4*(1-p)+1;c.beginPath();c.arc(0,0,35+i*16+p*25,-1.3+p,1+p);c.stroke();}c.restore();
    }
    if(e.kind==='enemyBlast'){
      const r=(e.radius||100)*(.3+p*.7);glow(c,0,0,r,color+'55');
      if(e.theme==='kairo'){for(let i=0;i<4;i++)lightning(c,(i-1.5)*r*.35,-240,(i-1.5)*r*.35,60,color,4,time+i);}
      else if(e.theme==='vex'){circle(c,0,0,r*.4,'#090515');for(let i=0;i<3;i++){c.beginPath();c.ellipse(0,0,r,r*(.3+i*.2),time+i,0,TAU);c.stroke();}}
      else for(let i=0;i<8;i++){const x=(i-3.5)*r*.2;polygon(c,[[x-16,65],[x+Math.sin(i+time)*18,-r*(.5+Math.sin(i)*.25)],[x+20,65]],'#ff863c77',color);}
    }
    if(e.kind==='solarFlare'){

      const r=(e.radius||220)*(.25+p*.75);glow(c,0,0,r,'#ff9a3e77');circle(c,0,0,r*.25,'#fff0b9');for(let i=0;i<16;i++){const a=i*TAU/16+p*2;polygon(c,[[Math.cos(a)*r*.25,Math.sin(a)*r*.25],[Math.cos(a+.12)*r,Math.sin(a+.12)*r],[Math.cos(a+.25)*r*.4,Math.sin(a+.25)*r*.4]],'#ffad4b88','#ffe8a9');}
    }
    if(e.kind==='forceImpact'){
      const r=e.radius*(.12+p),other=e.defenseColor;
      glow(c,0,0,r*.7,(p<.15?'#ffffff':color)+'66');
      for(let i=0;i<3;i++){c.strokeStyle=i%2?other:color;c.lineWidth=(1-p)*(5-i)+1;c.beginPath();c.ellipse(0,0,r*(1-i*.16),r*(.48+i*.2),i*.7,0,TAU);c.stroke();}
      for(let i=0;i<16;i++){const angle=i*TAU/16,r1=r*.3,r2=r*(1.3+(i%3)*.2);line(c,[[Math.cos(angle)*r1,Math.sin(angle)*r1],[Math.cos(angle)*r2,Math.sin(angle)*r2]],i%2?other:color,(1-p)*3);}
      circle(c,0,0,Math.max(1,18*(1-p)),'#f4fff4');
    }
    if(e.kind==='defeat'){const r=p*150;for(let i=0;i<12;i++){const a=i*TAU/12;circle(c,Math.cos(a)*r,Math.sin(a)*r,5*(1-p),color);}}
    if(e.kind==='dashLaunch'||e.kind==='barrierBreak'||e.kind==='barrierPulse'){
      for(let i=0;i<10+e.tier*3;i++){const a=i*TAU/(10+e.tier*3),r=(e.radius||140)*p;line(c,[[Math.cos(a)*r*.5,Math.sin(a)*r*.5],[Math.cos(a)*r,Math.sin(a)*r]],color,3*(1-p)+1);}
    }
    if(e.kind==='dashLine'){
      const x1=e.fromX-e.x,y1=e.fromY-e.y,x2=e.toX-e.x,y2=e.toY-e.y;
      line(c,[[x1,y1],[x2,y2]],color+'88',(1-p)*16+1);lightning(c,x1,y1,x2,y2,'#e5ffff',2,p*20);
    }
    if(e.kind==='upwardStrike'){
      const ax=e.fromX-e.x,ay=e.fromY-e.y,bx=e.toX-e.x,by=e.toY-e.y;
      line(c,[[ax,ay],[bx,by]],color+'77',(1-p)*(e.radius/5)+3);
      if(e.gravity){for(let i=0;i<5;i++){const q=i/5;c.beginPath();c.ellipse(ax+(bx-ax)*q,ay+(by-ay)*q,20+q*40,8+q*15,Math.atan2(by-ay,bx-ax)+Math.PI/2,0,TAU);c.stroke();}}
      else lightning(c,ax,ay,bx,by,'#eaffff',5*(1-p)+1,time);
      glow(c,bx,by,e.radius,color+'66');circle(c,bx,by,10+p*e.radius,color+'33');
    }
    if(e.kind==='fracture'){
      const r=e.radius||250;c.globalAlpha=Math.min(1,e.life/2);c.save();c.scale(1,.25);
      for(let i=0;i<12;i++){const a=i*TAU/12,dist=r*(.6+Math.sin(i*6)*.2),x=Math.cos(a)*dist,y=Math.sin(a)*dist;
        line(c,[[0,0],[x*.28+13,y*.24],[x*.54-8,y*.58],[x,y]],'#030815',7);
        line(c,[[0,0],[x*.28+13,y*.24],[x*.54-8,y*.58],[x,y]],color+'aa',1.5);
        line(c,[[x*.54-8,y*.58],[x*.65+Math.cos(a+1)*40,y*.7+Math.sin(a+1)*40]],color+'77',1);
      }c.restore();if(p<.12){c.beginPath();c.ellipse(0,0,30+p*r*10,15+p*r*2,0,0,TAU);c.stroke();}
    }
    if(e.kind==='shieldHit'||e.kind==='shieldBurst'){
      c.beginPath();c.ellipse(0,0,50+p*(e.radius||90),80+p*(e.radius||90)*.6,0,0,TAU);c.stroke();glow(c,0,0,100+p*90,color+'33');
    }
    if(e.kind==='shieldClash'){
      const tier=e.tier||1,r=e.radius||110,losing=e.losing;
      c.strokeStyle=losing?'#ffc4a5':color;c.lineWidth=2+tier*.6;
      for(let i=0;i<tier;i++){const size=r*(.6+i*.18)*(losing?1-p*.2:1+Math.sin(p*Math.PI)*.18);c.beginPath();c.ellipse(Math.sin(p*45)*p*(losing?12:3),0,size,size*1.2,0,0,TAU);c.stroke();}
      if(losing){for(let i=0;i<7;i++){const a=i*TAU/7,x=Math.cos(a)*r,y=Math.sin(a)*r;line(c,[[x*.2,y*.2],[x*.45+Math.sin(i*4)*18,y*.48],[x*.7-12,y*.75],[x,y]],'#fff1db',1+p*3);}}
      else for(let i=0;i<tier*3;i++){const a=i*TAU/(tier*3)+p*1.5;line(c,[[Math.cos(a)*r,Math.sin(a)*r],[Math.cos(a)*r*(1+p*.6),Math.sin(a)*r*(1+p*.6)]],color,2);}
      glow(c,0,0,r*1.4,losing?'#ff9e6022':color+'22');
    }
    if(e.kind==='skyCharge'){
      const r=60+Math.sin(p*Math.PI)*80;glow(c,0,0,r*2,color+'66');
      for(let i=0;i<7;i++){const a=i*TAU/7+time;lightning(c,Math.cos(a)*r*2,Math.sin(a)*r,0,0,color,2,time+i);}
      circle(c,0,0,10+p*18,'#f4ffff');
    }
    if(e.kind==='supernova')drawVoidBurst(c,20+p*(e.radius||450),p,e.tier,time,color);
    if(['impact','guard','parry','detonate','transform','crush'].includes(e.kind)){
      const big=['detonate','transform','crush'].includes(e.kind),r=(big?80:10)+p*(big?430:90);
      c.save();if(e.kind==='crush')c.scale(1,.32);c.beginPath();c.arc(0,0,r,0,TAU);c.stroke();c.beginPath();c.arc(0,0,r*.68,0,TAU);c.stroke();c.restore();
      if(big){glow(c,0,0,r,color+'33');for(let i=0;i<12;i++){const a=i*TAU/12+e.x;line(c,[[Math.cos(a)*r*.3,Math.sin(a)*r*.3],[Math.cos(a)*r,Math.sin(a)*r]],color+'88',2);}}
      else for(let i=0;i<7;i++){const a=i*TAU/7;line(c,[[Math.cos(a)*r*.4,Math.sin(a)*r*.4],[Math.cos(a)*r,Math.sin(a)*r]],color,3);}
      if(e.kind==='transform')lightning(c,0,-700,0,0,color,5,time*10);
    }
    if(['slash','afterimage','counter'].includes(e.kind)){
      c.scale(e.facing||1,1);c.rotate(e.vertical?-1.1:-.3+p*.4);
      const r=e.range||100+e.tier*18;c.lineWidth=2+(1-p)*9;c.beginPath();c.ellipse(25,0,r,r*.6,0,-1.3+p*.6,1.5+p*.6);c.stroke();
      c.lineWidth=1;c.beginPath();c.ellipse(25,0,r+15,r*.65,0,-1.3,1.5);c.stroke();
      if(e.tier>=2)for(let i=0;i<e.tier;i++)lightning(c,-20,-40+i*25,r+20,20+i*9,color+'66',1,i+p);
    }
    if(e.kind==='beam'){
      c.translate(-e.x,0);glow(c,e.toX,0,100,color+'55');line(c,[[e.fromX,-18],[e.toX,18]],color,(1-p)*18);lightning(c,e.fromX,-18,e.toX,18,'#ffffff',2,Math.floor(time*25));
    }
    if(e.kind==='dash'){c.scale(e.facing,1);for(let i=0;i<6;i++)line(c,[[-40-i*22,-50+i*18],[-160-i*10,-50+i*18]],color+'88',2);}
    if(e.kind==='dust'){c.scale(1,.25);c.beginPath();c.arc(0,180,20+p*75,0,TAU);c.stroke();}
    if(e.kind==='counterStance'){c.rotate(p*TAU);c.beginPath();c.ellipse(0,0,64,90,0,0,TAU);c.stroke();}
    if(e.kind==='vortex'){
      const r=(e.radius||100)*(1+p*.6);glow(c,0,0,r*1.5,color+'33');circle(c,0,0,r*.4,'#080814');
      for(let i=0;i<4;i++){c.save();c.rotate(time*3+i*.8);c.beginPath();c.ellipse(0,0,r,r*.4,0,.2,5);c.stroke();c.restore();}
    }
    if(e.kind==='warning'){
      c.scale(1,.17);c.globalAlpha=.4+p*.4;c.setLineDash([15,12]);c.beginPath();c.arc(0,0,e.radius,0,TAU);c.stroke();c.setLineDash([]);c.globalAlpha=.12;c.fillStyle=color;c.fill();
    }
    if(e.kind==='ultimate'){
      if(color==='#9ef9f2'){lightning(c,0,-700,0,0,color,4,time*8);for(let i=0;i<5;i++)lightning(c,-350+i*160,-600,-200+i*100,100,color+'88',2,time+i);}
      else{glow(c,0,-80,250+p*120,color+'66');circle(c,0,-80,30+p*150,'#03040c');c.beginPath();c.ellipse(0,-80,100+p*200,40+p*60,-.3,0,TAU);c.stroke();}
    }
    c.restore();
  }
  render(game,dt){
    if(game.clash)dt*=game.clash.kind==='sky'?.7:.25;
    const c=this.c,time=game.time;c.save();this.shake*=Math.exp(-dt*10);
    if(!this.reduced&&this.shake>.2)c.translate(Math.sin(time*121)*this.shake,Math.cos(time*99)*this.shake*.6);
    this.backdrop(game);
    if(game.clash?.kind==='sky'){c.fillStyle='#02071655';c.fillRect(0,0,W,H);}
    // Pull back around the floor so aerial poses stay below the HUD and cinematic bars.
    const targetZoom=game.terrain?1:clamp(1-(FLOOR-Math.min(...game.fighters.map(f=>f.y)))/1800,.78,1);
    this.zoom=(this.zoom??1)+(targetZoom-(this.zoom??1))*(dt===0?1:1-Math.exp(-6*dt));
    c.translate(W/2,FLOOR);c.scale(this.zoom,this.zoom);c.translate(-W/2,-FLOOR);
    if(game.terrain){c.translate(-game.cameraX,0);campaignLand(c,game);}
    if(game.clash?.kind==='sky'){
      const q=game.clash,impact=q.beat||0;
      const focus=q.contact||{x:W/2,y:380};
      for(let i=0;i<22;i++){const angle=i*TAU/22,r=340+(i%3)*80;c.globalAlpha=(.12+impact*.28)*(this.reduced?.25:1);line(c,[[focus.x+Math.cos(angle)*r,focus.y+Math.sin(angle)*r],[focus.x+Math.cos(angle)*(r+150+impact*120),focus.y+Math.sin(angle)*(r+150+impact*120)]],i%2?'#d4fafa':'#bdadf1',i%3===0?3:1);}c.globalAlpha=1;
      if(this.trailClash!==q){this.trailClash=q;this.clashTrails=[];}
      this.clashTrails=this.clashTrails.filter(ghost=>(ghost.trailLife-=dt)>0);
      for(const ghost of this.clashTrails)drawFighter(c,ghost,game.time,{ghost:true});
      if(!this.reduced&&q.impactPause<=0){
        for(const id of [q.attacker,q.defender]){const f=game.fighters[id],last=this.clashTrails.findLast(g=>g.id===id);if(!last||Math.hypot(f.x-last.x,f.y-last.y)>18)this.clashTrails.push({...f,trailLife:.13,animation:{...f.animation}});}
        this.clashTrails=this.clashTrails.slice(-6);
      }
    }else {this.trailClash=null;this.clashTrails=[];}
    const behind=['warning','vortex','transform','fracture','gravityColumn','blackHole'];
    for(const e of this.fx.filter(e=>behind.includes(e.kind)))this.drawEffect(e,time);
    if(game.clash?.kind==='sky')drawSpecialClash(this,game,this.reduced);
    for(const f of game.fighters){
      if(f.hp<=0)continue;
      if(!f.clashMove&&!f.enemyType&&f.cast?.slot===3)drawDiveTrail(c,f,specialMove(f,3),f.cast.elapsed,null,false,this.reduced);
      if(!f.enemyType&&f.dash<=0&&(f.tier===4&&f.pose==='run'||f.character==='kairo'&&f.cast?.slot===0))for(let i=3;i>0;i--)drawFighter(c,{...f,x:f.x-f.facing*i*24},time,{ghost:true});
      drawFighter(c,game.clash?.shieldDefense&&f.id===game.clash.defender?{...f,shield:game.clash.shield}:f,time);
      if(!f.enemyType&&(f.clashMove||f.cast?.slot>=3))drawSignature(c,f,f.clashMove||specialMove(f,f.cast.slot),time);
      const color=fighterDefinition(f).color,head=f.enemyType?fighterDefinition(f).height+18:f.tier===4?197:172;
      c.fillStyle=color;c.font='bold 10px Arial';c.textAlign='center';
      if(!f.boss)c.fillText(f.id===0?'YOU':f.enemyType?f.name:game.mode==='ai'?'CPU':'P2',f.x,f.y-head);
      if(f.enemyType&&!f.boss){if(game.terrain&&!f.awake){c.fillStyle='#aab7c5';c.font='9px Arial';c.fillText('IDLE',f.x,f.y-head-14);}c.fillStyle='#080e18';c.fillRect(f.x-41,f.y-head+5,82,8);c.fillStyle=color;c.fillRect(f.x-40,f.y-head+6,80*f.hp/f.maxHp,6);}
      if(f.enemyType&&game.enemy(game.fighters[0])===f){c.strokeStyle='#fff3c3';c.lineWidth=2;c.beginPath();c.ellipse(f.x,f.y+3,f.boss?65:43,9,0,0,TAU);c.stroke();}
      if(!f.enemyType){c.beginPath();c.moveTo(f.x-4,f.y-head+7);c.lineTo(f.x+4,f.y-head+7);c.lineTo(f.x,f.y-head+11);c.fill();}
    }
    if(game.clash&&game.clash.kind!=='sky'){
      const clash=game.clash,a=game.fighters[clash.attacker],d=game.fighters[clash.defender],progress=clash.elapsed/clash.duration;
      const ac=fighterDefinition(a).color,dc=fighterDefinition(d).color,ax=a.x+a.facing*62,ay=a.y-95,dx=d.x+d.facing*57,dy=d.y-95;
      const push=Math.max(0,progress-.45)*.65*(d.shieldReaction.losing?1:-1),mix=clamp(.5+push,.15,.85),cx=ax+(dx-ax)*mix,cy=ay+(dy-ay)*mix;
      c.save();glow(c,cx,cy,170+progress*35,'#fff6da33');
      lightning(c,ax,ay,cx,cy,ac,7,clash.elapsed*2);lightning(c,dx,dy,cx,cy,dc,7,clash.elapsed*2+1);
      for(let i=0;i<5;i++){const r=24+i*15+Math.sin(clash.elapsed*8+i)*5;c.strokeStyle=i%2?ac:dc;c.lineWidth=3;c.beginPath();c.ellipse(cx,cy,r*.35,r,0,0,TAU);c.stroke();}
      for(let i=0;i<14;i++){const angle=i*TAU/14+clash.elapsed*.5,r=35+(i%3)*18;line(c,[[cx+Math.cos(angle)*r,cy+Math.sin(angle)*r],[cx+Math.cos(angle)*(r+32),cy+Math.sin(angle)*(r+32)]],i%2?ac:dc,2);}
      circle(c,cx,cy,9,'#fff9e8');c.restore();
    }
    for(const p of game.projectiles){glow(c,p.x,p.y,p.radius*2,'#b179ef55');circle(c,p.x,p.y,p.radius*.7,'#0b0916');c.strokeStyle='#c79aff';c.lineWidth=2;c.beginPath();c.ellipse(p.x,p.y,p.radius*1.4,p.radius*.6,time*3,0,TAU);c.stroke();}
    for(const e of this.fx.filter(e=>!behind.includes(e.kind)))this.drawEffect(e,time);
    for(const p of this.particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=480*dt;c.globalAlpha=clamp(p.life*2,0,1);line(c,[[p.x,p.y],[p.x-p.vx*.018,p.y-p.vy*.018]],p.color,p.size);}c.globalAlpha=1;
    this.particles=this.particles.filter(p=>p.life>0).slice(-650);
    for(const l of this.labels){l.life-=dt;l.y-=dt*35;c.globalAlpha=Math.min(1,l.life*3);c.font=`bold ${l.guarded?15:23}px 'Barlow Condensed',Arial`;c.fillStyle=l.guarded?'#92a7b5':'#f1faf5';c.textAlign='center';c.fillText(l.value,l.x,l.y);}c.globalAlpha=1;this.labels=this.labels.filter(l=>l.life>0);
    this.fx.forEach(e=>e.life-=dt);this.fx=this.fx.filter(e=>e.life>0).slice(-100);
    c.restore();
    if(game.clash?.kind==='sky'){
      const q=game.clash;c.fillStyle=fighterDefinition(game.fighters[q.defender]).color;c.textAlign='center';c.font='bold 13px Arial';
      c.fillText(q.defense.name.toUpperCase()+'  ×  '+q.attack.name.toUpperCase(),W/2,195);
      c.font='11px Arial';c.fillText(q.sequence.combo?(q.losing?'GIVING GROUND':'COUNTERING EACH HIT')+' · '+q.beatIndex+' / '+q.sequence.beats.length:q.interaction.caption,W/2,215);
    }
    if(this.flash>0){this.flash=Math.max(0,this.flash-dt*1.7);c.fillStyle=`rgba(197,232,249,${this.flash*(this.reduced?.12:1)})`;c.fillRect(0,0,W,H);}
    if(this.cinematic){
      this.cinematic.life-=dt;c.fillStyle='#020710da';c.fillRect(0,0,W,130);c.fillRect(0,H-95,W,95);
      const elapsed=(this.cinematic.duration||1.5)-this.cinematic.life;
      if(elapsed<.7){c.globalAlpha=clamp((.7-elapsed)/.2,0,1);c.fillStyle=CHARACTERS[this.cinematic.character].color;c.textAlign='center';c.font="italic 800 40px 'Barlow Condensed',Impact";c.fillText(this.cinematic.title.toUpperCase(),W/2,H*.32);c.globalAlpha=1;}
      if(this.cinematic.life<=0)this.cinematic=null;
    }
    if(this.callout&&game.clash?.kind!=='sky'){this.callout.life-=dt;c.globalAlpha=Math.min(1,this.callout.life*3);c.fillStyle=this.callout.color;c.textAlign='center';c.font="700 22px 'Barlow Condensed',Arial";c.fillText(this.callout.text,W/2,210);c.globalAlpha=1;if(this.callout.life<=0)this.callout=null;}
    if(game.phase==='fight'&&game.mode!=='campaign'&&!game.clash){c.fillStyle='#9bb2c0';c.font='11px monospace';c.textAlign='center';c.fillText(String(Math.ceil(game.roundTime)).padStart(2,'0'),W/2,190);}
  }
}
export function drawPortrait(canvas,character,time=0){
  const c=canvas.getContext('2d'),kairo=character==='kairo',solar=character==='nyra';c.clearRect(0,0,600,360);
  glow(c,405,160,250,solar?'#ff9a442e':kairo?'#78dbed22':'#ad60e733');
  c.save();c.translate(405,180);c.rotate(-.25);c.strokeStyle=solar?'#ffd38745':kairo?'#9adbe52a':'#b78bdb38';c.lineWidth=1;
  for(let i=0;i<5;i++){c.beginPath();c.ellipse(0,0,85+i*23,85+i*23,0,0,TAU);c.stroke();}c.restore();
  if(kairo){for(let i=0;i<4;i++)lightning(c,340+i*57,0,390+i*38,340,'#a9f8f84a',1,i);}
  else if(solar){glow(c,450,120,125,'#ffac6655');circle(c,450,120,62,'#ffcf9855');for(let i=0;i<12;i++){const a=i*TAU/12;line(c,[[450+Math.cos(a)*75,120+Math.sin(a)*75],[450+Math.cos(a)*115,120+Math.sin(a)*115]],'#ffb97488',3);}}
  else if(character==='ronin'){for(let i=0;i<3;i++)steelSword(c,380+i*60,270,235,-.4+i*.3,3);}
  else{circle(c,450,120,72,'#0c0c18');c.strokeStyle='#a878d777';c.beginPath();c.ellipse(450,120,116,32,-.4,0,TAU);c.stroke();}
  c.save();c.translate(420,345);c.scale(2.15,2.15);drawFighter(c,{character,id:0,x:0,y:0,facing:kairo?-1:1,tier:2,pose:'idle',attackTime:0},time,{portrait:true});c.restore();
  const g=c.createLinearGradient(0,0,520,0);g.addColorStop(0,character==='ronin'?'#35232a':character==='nyra'?'#372319':kairo?'#142b37':'#231f33');g.addColorStop(.36,character==='ronin'?'#35232acc':solar?'#372319cc':kairo?'#142b37cc':'#231f33cc');g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(0,0,600,360);
}

