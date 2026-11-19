import {steelPower} from './steel-art.js';
// Attack and defense share the same effect renderer. Only aim, spread and timing change.
const TAU=Math.PI*2;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function shape(c,points,fill){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=fill;c.fill();}
function orb(c,x,y,r,color){c.beginPath();c.arc(x,y,Math.max(.01,r),0,TAU);c.fillStyle=color;c.fill();}
function halo(c,x,y,r,color){r=Math.max(1,r);const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);}
function ring(c,x,y,rx,ry,color,width=2,angle=0){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.ellipse(x,y,Math.max(1,rx),Math.max(1,ry),angle,0,TAU);c.stroke();}
function ribbon(c,points,width,color){
 const left=[],right=[];
 for(let i=0;i<points.length;i++){const before=points[Math.max(0,i-1)],after=points[Math.min(points.length-1,i+1)],dx=after[0]-before[0],dy=after[1]-before[1],length=Math.hypot(dx,dy)||1,w=width*(.35+.65*Math.sin((i+1)/(points.length+1)*Math.PI));left.push([points[i][0]-dy/length*w,points[i][1]+dx/length*w]);right.push([points[i][0]+dy/length*w,points[i][1]-dx/length*w]);}
 shape(c,[...left,...right.reverse()],color);
}
function bolt(c,from,to,width,time,seed,color,reduced){
 const dx=to[0]-from[0],dy=to[1]-from[1],length=Math.hypot(dx,dy)||1,points=[];
 for(let i=0;i<=16;i++){const p=i/16,noise=i===0||i===16?0:Math.sin(i*47+seed*17+Math.floor(time*18))*Math.sin(p*Math.PI)*(13+width);points.push([from[0]+dx*p-dy/length*noise,from[1]+dy*p+dx/length*noise]);}
 ribbon(c,points,width*2.4,color+'18');ribbon(c,points,width,color+'bb');ribbon(c,points,Math.max(1,width*.28),'#efffff');
 if(!reduced)for(const index of [4,8,12]){const base=points[index],sign=index===8?-1:1,tip=[base[0]+sign*(25+width*4),base[1]+dy*.17];ribbon(c,[base,[base[0]+sign*15,base[1]+dy*.06],[tip[0]-sign*8,tip[1]-dy*.03],tip],Math.max(1,width*.22),color+'aa');}
}
function crown(c,x,y,r,color,time,reduced){
 halo(c,x,y,r,color+'55');
 for(let i=0;i<(reduced?5:12);i++){const a=i*TAU/12+time*.7,s=r*(.7+.3*Math.sin(time*9+i));shape(c,[[x+Math.cos(a)*12,y+Math.sin(a)*12],[x+Math.cos(a-.045)*s,y+Math.sin(a-.045)*s],[x+Math.cos(a+.05)*s*.65,y+Math.sin(a+.05)*s*.65]],color+'99');}
 orb(c,x,y,r*.12,'#f4fff6');
}
export function drawMeteor(c,x,y,r,angle,time,color='#ffbb73'){
 c.save();c.translate(x,y);c.rotate(angle);halo(c,-r*.5,0,r*2.4,color+'44');
 for(let layer=0;layer<3;layer++)for(let i=0;i<7;i++){
  const yy=(i-3)*r*.24,tail=r*(2.2+layer*.45+Math.sin(time*13+i)*.3);
  shape(c,[[r*.4,yy-r*.22],[-tail,yy*.35+Math.sin(time*12+i)*r*.18],[-r*.8,yy+r*.32],[r*.3,yy+r*.15]],['#f7653244','#ffab4c77','#ffe7a6aa'][layer]);
 }
 const vertices=Array.from({length:11},(_,i)=>{const a=i*TAU/11,rr=r*(.84+.13*Math.sin(i*19));return [Math.cos(a)*rr,Math.sin(a)*rr];});
 shape(c,vertices,'#40251f');
 for(let i=0;i<vertices.length;i++){const a=vertices[i],b=vertices[(i+1)%vertices.length];shape(c,[[r*.12,-r*.15],a,b],i%3===0?'#9c5339':i%3===1?'#5f3024':'#2a191e');}
 for(let i=0;i<5;i++){const a=i*TAU/5;ribbon(c,[[r*.1,0],[Math.cos(a)*r*.4+6,Math.sin(a)*r*.35],[Math.cos(a+.2)*r*.8,Math.sin(a+.2)*r*.8]],2.2,'#ffe1a2');}
 halo(c,r*.4,-r*.15,r*.75,'#ff963c55');c.restore();
}
function storm(c,length,width,time,color,tier,reduced,aimX=0){
 if(tier===1){
  bolt(c,[0,0],[aimX,length],15,time,0,color,reduced);
  for(const side of [-1,1])bolt(c,[side*width*.16,length*.2],[aimX,length],3,time,side,color,reduced);
  crown(c,aimX,length,55,color,time,reduced);return;
 }
 if(tier===2){
  for(const side of [-1,1]){
   const points=[];for(let i=0;i<=32;i++){const p=i/32;points.push([aimX*p+side*Math.cos(p*Math.PI*3+time*4)*width*.24,p*length]);}
   ribbon(c,points,12,color+'aa');ribbon(c,points,3,'#ffffff');
   shape(c,[[aimX+side*width*.15,length-90],[aimX+side*width*.3,length-120],[aimX,length+8],[aimX-side*8,length-70]],'#dffff5');
  }
  crown(c,aimX,length,70,color,time,reduced);return;
 }
 if(tier===3){
  for(let i=-1;i<=1;i++){
   const end=aimX+i*width*.3,offset=i*width*.48;
   bolt(c,[offset,0],[end,length],4,time,i,color,reduced);
   const lead=length*(.78+.12*Math.sin(time*8+i)),shaft=13;
   shape(c,[[end-shaft,lead-length*.5],[end+shaft,lead-length*.5],[end+shaft,lead-35],[end+32,lead-55],[end,lead+35],[end-32,lead-55],[end-shaft,lead-35]],'#d5ffff');
   ribbon(c,[[end,lead-length*.5],[end,lead+20]],3,'#ffffff');
  }
  return;
 }
 const count=tier===4?11:Math.max(3,tier*2+1),spread=width*.48;
 halo(c,aimX*.5,length*.48,Math.min(290,length*.8),color+'33');
 // A storm bank, branching white-hot pillars, rising motes and shock rings.
 for(let i=0;i<7;i++){const x=(i-3)*width*.13;halo(c,x,-12-Math.sin(time*3+i)*12,width*.2,'#5476a130');}
 for(let i=0;i<count;i++){
  const lane=(i/(count-1)-.5),pulse=.65+.35*Math.sin(time*19+i*2.7),sx=lane*width*.82,ex=lane*spread*2+aimX;
  const growth=clamp(((time*2.7+i*.37)%1)*3.5,0,1),endY=length*(.55+growth*.45);
  c.save();c.globalAlpha*=reduced?.7:Math.max(.4,pulse);
  bolt(c,[sx,0],[sx+(ex-sx)*endY/length,endY],(tier===4?12:7)*pulse,time,i,color,reduced);
  if(growth>.8){crown(c,ex,length,28+width*.035,color,time+i,reduced);ring(c,ex,length,20+pulse*22,8+pulse*9,color+'99',2);}
  c.restore();
 }
 for(let i=0;i<(reduced?8:24);i++){const p=(time*.8+i*.618)%1,x=Math.sin(i*19)*width*.5;shape(c,[[x,length*p],[x-3,length*p-13],[x+4,length*p-23]],color+'aa');}
 ring(c,0,0,width*.52,22,color+'88',3);ring(c,aimX,length,width*.56,28,color+'77',3);
}
function spear(c,length,width,time,color,reduced){
 const shaft=Math.max(12,width*.09);
 halo(c,0,length*.6,Math.min(210,length*.8),color+'44');
 shape(c,[[-shaft,-40],[shaft,-40],[shaft,length-80],[shaft*2.8,length-110],[0,length+30],[-shaft*2.8,length-110],[-shaft,length-80]],'#c3fefa');
 shape(c,[[-shaft*.25,-40],[shaft*.3,-40],[shaft*.3,length-50],[0,length+30],[-shaft*.25,length-50]],'#ffffff');
 for(let i=0;i<4;i++){const x=(i-1.5)*width*.17;bolt(c,[x,-15],[x*.25,length],3.5,time,i,color,reduced);}
 for(let i=0;i<5;i++){const p=(time*.7+i/5)%1;ring(c,0,length*p,width*.25*(1-p*.5),12,color+'88',2,time*.5);}
 crown(c,0,length,width*.42,color,time,reduced);
}
function solar(c,length,width,time,color){
 const core=Math.min(70,width*.16),points=[];
 halo(c,0,0,core*3,color+'55');
 for(let side of [-1,1]){for(let i=0;i<=20;i++){const p=i/20;points.push([side*(core+Math.sin(time*15+p*22)*core*.18),p*length]);}if(side===-1)points.reverse();}
 shape(c,points,color+'55');shape(c,[[-core*.6,0],[core*.6,0],[core,length],[0,length+25],[-core,length]],'#ffd88299');
 shape(c,[[-core*.25,0],[core*.25,0],[core*.35,length],[-core*.35,length]],'#fff8de');
 for(let i=0;i<7;i++){const p=(time*1.6+i/7)%1;ring(c,0,p*length,core*(1.1+Math.sin(p*Math.PI)*.4),core*.35,color+'aa',3);}
 crown(c,0,length,core*2.3,color,time,false);
}
function cage(c,x,y,r,time,color){
 const squeeze=.65+.18*Math.sin(time*7),vertices=[];
 for(const z of [-1,1])for(const yy of [-1,1])for(const xx of [-1,1]){
  const a=time*.7,px=(xx*Math.cos(a)-z*Math.sin(a))*r*.7,depth=(xx*Math.sin(a)+z*Math.cos(a));vertices.push([x+px,y+yy*r*squeeze+depth*r*.25]);
 }
 for(let i=0;i<8;i++)for(const bit of [1,2,4])if((i^bit)>i)ribbon(c,[vertices[i],vertices[i^bit]],3,color);
 for(const face of [[0,1,3,2],[4,5,7,6],[0,4,6,2]])shape(c,face.map(i=>vertices[i]),color+'18');
 for(const [px,py] of vertices){orb(c,px,py,5,'#f9e3ff');ribbon(c,[[px,py],[x+(px-x)*.2,y+(py-y)*.2]],1.4,color+'88');}
}
function gravity(c,length,width,time,color,black,zero,tier=4){
 const radius=width*(black?.35:.43),cy=black?length*.85:length*.7;
 if(tier===1){
  halo(c,0,cy,radius,color+'33');
  if(black){orb(c,0,cy,radius*.7,'#03020c');ring(c,0,cy,radius*.76,radius*.76,color,4);ring(c,0,cy,radius,12,color+'aa',3,time);}
  else{
   const press=radius*(.55+.25*Math.sin(time*6));
   for(const side of [-1,1])shape(c,[[-radius,cy+side*press],[-radius*.7,cy+side*(press+25)],[radius*.7,cy+side*(press+25)],[radius,cy+side*press]],'#443452');
   for(let i=-2;i<=2;i++)ribbon(c,[[i*radius*.3,cy-press],[i*radius*.3,cy+press]],2,color+'99');
   ring(c,0,cy,radius*.85,17,color,3);
  }return;
 }
 if(tier===2){
  const orbit=time*3;
  for(const side of [-1,1]){
   const x=Math.cos(orbit)*radius*.65*side,y=cy+Math.sin(orbit)*radius*.5*side;
   halo(c,x,y,radius*.75,color+'44');orb(c,x,y,radius*(black?.4:.23),black?'#03020c':'#42364f');
   ring(c,x,y,radius*.5,radius*.19,color,3,orbit*side);ring(c,0,cy,radius*1.12,radius*.52,color+'aa',3,side*.6);
  }
  for(let i=0;i<6;i++){const a=orbit+i*TAU/6,x=Math.cos(a)*radius,y=cy+Math.sin(a)*radius*.65;shape(c,[[x-10,y],[x,y-17],[x+14,y],[x,y+13]],'#69547a');}
  return;
 }
 if(tier===3){
  halo(c,0,cy,radius*1.4,color+'44');cage(c,0,cy,radius,time,color);
  if(black){shape(c,[[0,cy-radius*.6],[-radius*.45,cy],[0,cy+radius*.6],[radius*.45,cy]],'#03020b');cage(c,0,cy,radius*.45,-time*1.5,'#f3d9ff');}
  return;
 }
 halo(c,0,cy,radius*1.6,color+'55');
 if(black){orb(c,0,cy,radius*.66,'#02020b');ring(c,0,cy,radius*.7,radius*.7,'#f6d8ff',3);}
 else {const g=c.createLinearGradient(-radius,0,radius,0);g.addColorStop(0,'transparent');g.addColorStop(.5,color+'30');g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(-radius,0,radius*2,length);}
 for(let i=0;i<7;i++){
  const p=(time*.65+i/7)%1,y=black?cy:length*p,r=radius*(black?1+p*.5:1-p*.38),angle=black?time*.6+i*.3:0;
  ring(c,0,y,r,black?r*.24:17,color+'bb',2+(i%2),angle);
  if(black){const arc=[];for(let j=0;j<28;j++){const a=j/27*Math.PI+time+i*.6;arc.push([Math.cos(a)*r,cy+Math.sin(a)*r*.25]);}ribbon(c,arc,6,color+'44');}
 }
 for(let i=0;i<22;i++){const p=(i*.618+time*.45)%1,angle=i*7+time,rr=radius*(1.2-p*.7),x=Math.cos(angle)*rr,y=black?cy+Math.sin(angle)*rr:length*p,s=5+i%5;
  shape(c,[[x-s,y],[x-s*.3,y-s*1.4],[x+s,y-s*.5],[x+s*.6,y+s],[x-s*.4,y+s*.8]],'#49405b');ribbon(c,[[x-s,y],[x,y-s],[x+s,y]],1.5,color+'bb');
 }
 if(zero)for(const side of [-1,1]){const x=side*radius*.65*(.6+.2*Math.sin(time*8));shape(c,[[x-side*20,length-75],[x+side*22,length-55],[x+side*32,length+20],[x,length+55],[x-side*24,length+15]],color+'77');}
}
function phoenix(c,length,width,time,color){
 const y=length*.72,span=width*.58,flap=Math.sin(time*8)*.2;
 halo(c,0,y,span,color+'33');
 for(const side of [-1,1])for(let i=0;i<9;i++){
  const reach=span*(1-i*.065),tipY=y-length*.3+i*length*.025+flap*reach;
  shape(c,[[side*12,y-15],[side*reach,tipY],[side*reach*.79,tipY+42],[side*(22+i*4),y+45]],i%2?'#ff8c3c99':'#ffd37baa');
  shape(c,[[side*20,y],[side*reach*.93,tipY+9],[side*reach*.73,tipY+28]],'#fff4c588');
 }
 for(let i=0;i<5;i++){const x=(i-2)*12;shape(c,[[x-9,y-20],[x+Math.sin(time*9+i)*22,0],[x+12,y-20]],'#ff914577');}
 shape(c,[[0,y-50],[-23,y],[-15,y+48],[0,y+83],[18,y+55],[24,y],[0,y-50]],'#fff0b9');
 shape(c,[[0,y+82],[33,y+65],[11,y+57]],'#ffffff');orb(c,6,y+68,3,'#ff7039');
}
function blade(c,length,width,time,color,cross){
 const r=width*.5,cy=length*.75;
 for(const sign of cross?[-1,1]:[1]){
  const outer=[],inner=[];for(let i=0;i<=30;i++){const a=-1.25+i/30*2.6+Math.sin(time*8)*.12;outer.push([Math.sin(a)*r,cy+sign*Math.cos(a)*r*.55]);inner.push([Math.sin(a)*r*.84,cy+sign*Math.cos(a)*r*.39]);}
  shape(c,[...outer,...inner.reverse()],color+'aa');ribbon(c,outer,2.7,'#efffff');
 }
 halo(c,0,cy,r*.7,color+'33');
}
function flareKick(c,length,width,time){
 const r=width*.43,y=length*.65;
 for(let layer=0;layer<3;layer++){
  const outer=[],inner=[];
  for(let i=0;i<=24;i++){const a=-1.3+i/24*2.6+time*.4,s=r*(1-layer*.14);outer.push([Math.sin(a)*s,y+Math.cos(a)*s*.7]);inner.push([Math.sin(a)*s*.78,y+Math.cos(a)*s*.4]);}
  shape(c,[...outer,...inner.reverse()],['#fa713b99','#ffc471bb','#fff1bf'][layer]);
 }
 crown(c,0,y+r*.5,r*.4,'#ffb568',time,false);
}
export function powerWidth(profile){
 return ({thunderstorm:560,'divine-spear':300,'sword-burst':300,'blade-dive':280,'gravity-lift':330,'zero-crush':510,singularity:360,apocalypse:620,'flare-kick':280,'phoenix-dive':440,corona:460,'phoenix-rebirth':620,meteor:300,'meteor-orbit':420,'solar-lance':350,worldfall:650,shield:240})[profile.kind]||300;
}
export function defensePower(profile,from,to,incomingWidth,time,strength=1){
 return {kind:profile.kind,from,to,width:clamp(incomingWidth,180,700),tier:profile.tier,time,strength,defending:true};
}
export function drawPower(c,{kind,from,to,width=300,tier=1,time=0,strength=1,color='#9ef9f2',reduced=false}){
 const dx=to.x-from.x,dy=to.y-from.y,length=Math.max(30,Math.hypot(dx,dy));
 const verticalStorm=(kind==='thunderstorm'||kind==='lightning'||kind==='blade-rain')&&Math.abs(dy)>60;
 c.save();c.translate(from.x,from.y);c.rotate(verticalStorm?(dy<0?Math.PI:0):Math.atan2(dy,dx)-Math.PI/2);c.globalAlpha*=clamp(strength,0,1);
 if(kind.startsWith('steel-'))steelPower(c,length,width,time,tier,0,['steel-rise','steel-rain','steel-rend','steel-edges'].includes(kind));
 else if(kind==='thunderstorm'||kind==='lightning'||kind==='blade-rain')storm(c,verticalStorm?Math.abs(dy):length,width,time,color,tier,reduced,verticalStorm?(dy<0?-dx:dx):0);
 else if(tier===3&&(kind==='sword-burst'||kind==='divine-spear')){for(const side of [-1,0,1]){c.save();c.translate(side*width*.25,0);c.rotate(side*.25);spear(c,length,width*.38,time+side,color,reduced);c.restore();}}
 else if(kind==='divine-spear')spear(c,length,width,time,color,reduced);
 else if(kind==='solar-lance'||kind==='corona'){
  const lanes=kind==='corona'?3:1;for(let i=0;i<lanes;i++){c.save();c.translate((i-(lanes-1)/2)*width*.3,0);solar(c,length,width/lanes,time+i,color);c.restore();}
 }else if(['gravity-lift','zero-crush','singularity','apocalypse'].includes(kind))gravity(c,length,width,time,color,['singularity','apocalypse'].includes(kind),kind==='zero-crush',tier);
 else if(kind==='flare-kick')flareKick(c,length,width,time);
 else if(kind.startsWith('phoenix')){
  phoenix(c,length,width,time,kind==='phoenix-rebirth'?'#fff1ba':color);
  if(kind==='phoenix-rebirth'){ring(c,0,length*.7,width*.38,width*.38,'#fff2bbaa',3,time);halo(c,0,length*.7,width*.4,'#fff1ba22');}
 }
 else if(['meteor','meteor-orbit','worldfall'].includes(kind)){
  const count=kind==='meteor'?1:kind==='worldfall'?5:3;
  for(let i=0;i<count;i++){const p=(time*.85+i/count)%1,x=(i-(count-1)/2)*width/count*.7,r=kind==='meteor'?width*.2:width/(count*3.2);drawMeteor(c,x,length*(.2+.8*p),r,Math.PI/2,time+i,color);}
  if(kind==='worldfall'){const y=length*.8;halo(c,0,y,width*.28,color+'55');orb(c,0,y,width*.105,'#fff1be');ring(c,0,y,width*.14,width*.14,color+'aa',3);}
 }else blade(c,length,width,time,color,kind==='sword-burst');
 c.restore();
}
export function drawPowerCollision(c,x,y,width,time,color,other,reduced=false){
 const r=width*.25;
 halo(c,x,y,r*1.4,color+'33');ring(c,x,y,r*(.7+.1*Math.sin(time*12)),r*.55,other+'aa',3,time*.4);
 for(let i=0;i<(reduced?6:18);i++){const p=(time*1.8+i*.618)%1,a=i*7+time*.35,rr=r*(.4+p),sx=x+Math.cos(a)*rr,sy=y+Math.sin(a)*rr,s=(1-p)*8+2;shape(c,[[sx-s,sy],[sx,sy-s*1.2],[sx+s,sy],[sx,sy+s]],i%2?color:other);}
 crown(c,x,y,r*.45,other,time,reduced);
}

export function drawCelestial(c,x,y,r,angle,time,shard=false){
 c.save();c.translate(x,y);c.rotate(angle);
 if(shard){
  halo(c,0,0,r*2,'#ffb86c55');shape(c,[[-r*3,0],[-r*.4,-r*.6],[r,0],[-r*.4,r*.6]],'#ffca7666');
  shape(c,[[-r*.75,-r*.65],[r,0],[-r*.75,r*.65],[-r*.4,0]],'#f4934f');
  shape(c,[[-r*.75,-r*.65],[r,0],[-r*.4,0]],'#fff1c9');ring(c,0,0,r*1.2,r*.75,'#ffbf7f',2,time);
 }else{
  halo(c,0,0,r*2.4,'#ffa65266');orb(c,0,0,r,'#ffb85e');orb(c,0,0,r*.72,'#fff7d3');
  for(let i=0;i<12;i++){const a=i*TAU/12+time*.7;shape(c,[[Math.cos(a)*r*.7,Math.sin(a)*r*.7],[Math.cos(a+.12)*r*(1.5+.15*Math.sin(time*8+i)),Math.sin(a+.12)*r*1.6],[Math.cos(a+.22)*r,Math.sin(a+.22)*r]],'#ffe2a899');}
  for(let i=0;i<3;i++)ring(c,0,0,r*(1.05+i*.15),r*.35,'#fff0bb',3,time+i);
  ribbon(c,[[-r*4,0],[-r*1.4,-r*.3],[0,0]],r*.4,'#ffc57255');
 }c.restore();
}
export function drawEvolutionShield(c,character,tier,time,color,stored=0){
 c.save();c.translate(18,-78);
 if(character==='kairo'){
  if(tier===1){shape(c,[[25,-75],[60,-46],[67,10],[37,75],[16,25]],color+'33');for(let i=0;i<3;i++)bolt(c,[28,-65+i*40],[53,-35+i*40],2,time,i,color,true);}
  if(tier===2)for(const side of [-1,1]){c.save();c.rotate(time*1.5+side*Math.PI/2);shape(c,[[-7,-106],[7,-106],[7,45],[24,28],[0,84],[-24,28],[-7,45]],'#d9fff1');ring(c,0,0,95,40,color+'88',2);c.restore();}
  if(tier===3)for(let i=0;i<6;i++){const a=i*TAU/6+time*.5;c.save();c.translate(Math.cos(a)*88,Math.sin(a)*104);c.rotate(a+Math.PI/2);shape(c,[[-5,-35],[5,-35],[5,14],[15,7],[0,39],[-15,7],[-5,14]],'#d9ffff');c.restore();ribbon(c,[[Math.cos(a)*88,Math.sin(a)*104],[Math.cos(a+TAU/6)*88,Math.sin(a+TAU/6)*104]],2,color+'99');}
  if(tier===4){halo(c,0,0,150,color+'33');for(let i=0;i<9;i++){const a=i*TAU/9+time;bolt(c,[Math.cos(a)*85,-95],[Math.cos(a+.4)*95,95],3,time,i,color,false);}ring(c,0,0,110,125,'#eeffff',3);}
 }else{
  if(tier===1){shape(c,[[35,-78],[72,-48],[65,49],[35,79],[16,0]],'#080515');ribbon(c,[[35,-78],[72,-48],[65,49],[35,79]],4,color);orb(c,41,0,15+stored*.1,'#bd88ff');}
  if(tier===2)for(const side of [-1,1]){ring(c,side*24,0,86,110,color,4,side*(.4+Math.sin(time*2)*.2));orb(c,side*35,Math.sin(time*3)*side*55,20,'#080515');ring(c,side*35,Math.sin(time*3)*side*55,24,12,'#e9cfff',3);}
  if(tier===3)cage(c,0,0,105,time*.5,color);
  if(tier===4){halo(c,0,0,165,color+'33');for(let i=0;i<5;i++)ring(c,0,0,100+i*6,35+i*16,color+'cc',3,time*.6+i*.6);orb(c,0,0,18+stored*.12,'#090314');for(const side of [-1,1])shape(c,[[side*90,-70],[side*135,-50],[side*128,40],[side*90,75],[side*108,0]],'#a481dd88');}
 }c.restore();
}
export function drawComboStrike(c,character,tier,time,color,step=0){
 const width=180+step*25;
 if(character==='kairo'){
  if(tier===1){c.save();c.rotate(-Math.PI/2);blade(c,40,width,time,color,false);c.restore();}
  if(tier===2){c.save();c.rotate(.55-Math.PI/2);blade(c,40,width,time,color,true);c.restore();}
  if(tier===3){c.save();c.rotate(-Math.PI/2);spear(c,170,width*.45,time,color,true);c.restore();}
  if(tier===4){c.save();c.rotate(-Math.PI/2);blade(c,60,width*1.2,time,color,true);c.restore();for(let i=0;i<4;i++)bolt(c,[-70,-70+i*35],[100,50-i*30],3,time,i,color,false);}
 }else if(character==='vex'){
  if(tier===1){shape(c,[[0,-35],[60,-40],[92,-12],[80,32],[10,35]],'#30203f');ribbon(c,[[0,-35],[60,-40],[92,-12],[80,32]],5,color);halo(c,50,0,70,color+'44');}
  if(tier===2)gravity(c,30,width,time,color,false,false,2);
  if(tier===3)cage(c,45,0,65,time*2,color);
  if(tier===4){orb(c,45,0,42,'#04020a');for(let i=0;i<4;i++)ring(c,45,0,55+i*10,20+i*5,color,3,time+i);crown(c,95,0,70,color,time,false);}
 }else{
  if(tier===1){c.save();c.rotate(-Math.PI/2);flareKick(c,30,width,time);c.restore();}
  if(tier===2){c.save();c.rotate(time*7);flareKick(c,30,width,time);c.rotate(Math.PI);flareKick(c,30,width,time);c.restore();}
  if(tier===4)for(const side of [-1,1])for(let i=0;i<3;i++)ribbon(c,[[-65,side*(20+i*16)],[10,side*(55+i*16)],[100,side*(5+i*8)]],5-i,'#ffe7bb');
 }
}
export function drawVoidBurst(c,r,p,tier,time,color){
 if(tier===1){orb(c,0,0,r*.45,p<.15?'#030410':'#ead8ff88');ring(c,0,0,r,r,color,3);}
 if(tier===2)for(const side of [-1,1]){halo(c,side*r*.3,0,r*.7,color+'44');ring(c,side*r*.3,0,r*.7,r*.7,color,4);ring(c,0,0,r*1.2,r*.4,'#eacfff',3,side*.65);}
 if(tier===3){cage(c,0,0,r,time*2,color);for(let i=0;i<8;i++){const a=i*TAU/8;shape(c,[[Math.cos(a)*r*.6,Math.sin(a)*r*.6],[Math.cos(a+.1)*r*1.2,Math.sin(a+.1)*r*1.2],[Math.cos(a+.25)*r*.8,Math.sin(a+.25)*r*.8]],color+'99');}}
 if(tier===4){halo(c,0,0,r*1.5,'#c699ff66');orb(c,0,0,r*.55,p<.15?'#030410':'#ead8ff66');for(let i=0;i<16;i++){const a=i*TAU/16;ribbon(c,[[Math.cos(a)*r*.2,Math.sin(a)*r*.2],[Math.cos(a)*r,Math.sin(a)*r]],4*(1-p),color);}ring(c,0,0,r,r,color,3);}
}
