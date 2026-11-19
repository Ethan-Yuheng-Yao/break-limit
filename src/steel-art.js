import {characterPose} from './animation.js';
import {armRig} from './rig.js';
const TAU=Math.PI*2;
function shape(c,p,fill,stroke){c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=1.2;c.stroke();}}
function line(c,p,color,width=2){c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=width;c.stroke();}
function metal(c,x,y,w,h){const g=c.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,'#313642');g.addColorStop(.35,'#b5b9ba');g.addColorStop(.48,'#fff7e6');g.addColorStop(.54,'#707987');g.addColorStop(1,'#20232e');return g;}
export function steelSword(c,x,y,length=115,angle=0,tier=1){
 c.save();c.translate(x,y);c.rotate(angle);const w=tier===4?length*.085:tier===3?length*.045:5;
 line(c,[[0,15],[0,-12]],'#161c29',7);for(let i=0;i<4;i++)line(c,[[-3,12-i*5],[3,9-i*5]],'#c99078',1.5);
 shape(c,[[-18,-9],[-16,-16],[-5,-12],[5,-12],[16,-16],[18,-9],[6,-5],[-6,-5]],'#dbbd88','#fff0c9');
 shape(c,[[-w,-13],[-w,-length+20],[0,-length],[w,-length+20],[w,-13]],metal(c,-w,-length,w*2,length),'#f7eddb');
 line(c,[[0,-20],[0,-length+8]],tier>=3?'#ff735f':'#cac8c0',tier===4?3:1);
 if(tier>=3)for(let i=0;i<4;i++)shape(c,[[0,-32-i*17],[-3,-38-i*17],[0,-42-i*17],[3,-38-i*17]],'#ffcfac');
 c.restore();
}
export function steelPower(c,length,width,time,tier=1,variant=0,fall=false){
 if(fall){
  const count=tier===3?3:tier===2?2:1;
  for(let i=0;i<count;i++){
   const x=(i-(count-1)/2)*width*.35,tip=length;
   shape(c,[[x-width*.08,0],[x+width*.08,0],[x+10,tip],[x-10,tip]],'#ec624b33');
   const bladeLength=length*(tier===4?.98:tier===3?.63:.42);
   steelSword(c,x,tip-bladeLength,bladeLength,Math.PI,tier);
   if(tier===4)for(const side of [-1,1])line(c,[[side*width*.32,tip-40],[side*width*.12,tip+15],[side*width*.46,tip+40]],'#ffd3a7',3);
   line(c,[[x-18,0],[x-18,tip-30]],'#ffc7a077',2);
  }
 }else{
  const count=tier===2?2:tier===3?3:1,r=width*.5;
  for(let j=0;j<count;j++){
   c.save();c.translate(0,length*.7);c.rotate((variant%2?-.6:.6)+j*.7);
   const outer=[],inner=[];for(let i=0;i<=35;i++){const a=-1.45+i/35*2.9+Math.sin(time*5)*.06;outer.push([Math.sin(a)*r,Math.cos(a)*r]);inner.push([Math.sin(a)*r*.66,Math.cos(a)*r*.66+12]);}
   shape(c,[...outer,...inner.reverse()],'#c6364155');
   line(c,outer,'#fff3df',tier===4?7:4);
   line(c,outer.map(([x,y])=>[x+6,y]),'#ff9c77',2);
   for(let i=0;i<7;i++){const a=-1.4+i*.43;line(c,[[Math.sin(a)*r,Math.cos(a)*r],[Math.sin(a)*(r+20),Math.cos(a)*(r+20+i%3*10)]],'#ffcb99',2);}
   c.restore();
  }
 }
}
export function steelWard(c,tier,time){
 c.save();c.globalAlpha*=.65;
 const n=tier===1?1:tier===2?2:tier===3?6:3;
 for(let i=0;i<n;i++){const a=tier===3?time+i*TAU/n:(i-(n-1)/2)*.5;
  const x=tier===3?30+Math.cos(a)*75:43+(i-(n-1)/2)*28,y=tier===3?-75+Math.sin(a)*80:0;
  steelSword(c,x,y,tier===4?210:145,tier===3?a+Math.PI/2:a,tier);
 }c.restore();
}
export function drawRonin(c,f,time,{portrait=false,ghost=false}={}){
 const tier=f.tier||1,p=characterPose(portrait?{...f,y:644}:f,time),aw=tier===4,red=aw?'#e2b27b':'#b95451';
 c.save();if(ghost)c.globalAlpha=.14;
 if(!portrait){c.save();c.translate(f.x,f.groundY??644);c.scale(1,.18);c.fillStyle='#03061288';c.beginPath();c.arc(0,0,65,0,TAU);c.fill();c.restore();}
 c.translate(f.x,f.y);if(f.clashRotation){c.translate(0,-80);c.rotate(f.clashRotation);c.translate(0,80);}c.scale(f.facing,1);
 if(f.dash>0){c.save();c.translate(-160,-70);c.rotate(-Math.PI/2);c.globalAlpha*=.55;steelPower(c,160,110+tier*20,time,tier,0,false);c.restore();}
 c.translate(p.dx,p.dy-65);c.rotate(p.turn);c.translate(0,65);const grounded=f.y>=(f.groundY??644)-1,ly=p.ly-(grounded?p.dy:0),ry=p.ry-(grounded?p.dy:0);
 for(const [hip,foot,y] of [[-12,p.lf,ly],[12,p.rf,ry]]){
  line(c,[[hip,-49],[(foot+hip)/2+7,-23+y*.4],[foot,y]],'#090f1a',17);
  line(c,[[hip,-49],[(foot+hip)/2+7,-23+y*.4],[foot,y-6]],'#48505d',10);
  shape(c,[[foot-9,y-20],[foot+6,y-20],[foot+10,y-4],[foot+18,y],[foot-10,y]],metal(c,foot-9,y-20,20,20),'#c1b6a1');
 }
 c.save();c.translate(0,-55);c.rotate(p.lean);c.translate(0,55);
 const wind=Math.sin(time*6)*9+(f.pose==='run'?18:0);
 shape(c,[[-17,-112],[-48,-113],[-105-wind,-80],[-69,-88],[-85-wind,-53],[-29,-89]],red,'#f0b19088');
 shape(c,[[-17,-104],[20,-104],[27,-50],[38,-27],[12,-37],[-3,-56],[-29,-22],[-26,-57]],'#1b2231','#bdafa1');
 for(let i=0;i<4;i++)shape(c,[[-19,-95+i*10],[19,-95+i*10],[22,-87+i*10],[-18,-86+i*10]],metal(c,-20,-100,45,60),'#7e7775');
 shape(c,[[-29,-103],[-12,-109],[-11,-88],[-36,-86]],metal(c,-36,-109,25,25),'#dec09c');
 shape(c,[[17,-108],[36,-98],[37,-83],[17,-86]],metal(c,15,-109,25,25),'#dec09c');
 line(c,[[-23,-55],[25,-55]],red,7);shape(c,[[-3,-60],[8,-60],[8,-50],[-3,-50]],'#d6b489');
 shape(c,[[-10,-136],[7,-137],[16,-126],[10,-110],[-4,-107],[-14,-117]],'#d2af9d','#5b4d50');
 shape(c,[[-15,-115],[-22,-131],[-14,-145],[6,-149],[19,-138],[18,-125],[8,-130],[0,-123],[-10,-122]],aw?'#ece2c8':'#27303d','#a8acaf');
 line(c,[[-12,-127],[16,-126]],red,5);line(c,[[4,-118],[12,-119]],'#fff0d1',2);
 if(tier>=3)shape(c,[[-16,-140],[-19,-160],[-5,-147],[4,-165],[11,-145],[23,-155],[17,-135]],'#c6a56e','#ffe2ac');
 for(const {shoulder,elbow,hand:{x:hx,y:hy}} of Object.values(armRig(p,'ronin'))){
  const points=[[shoulder.x,shoulder.y],[elbow.x,elbow.y],[hx,hy]];line(c,points,'#121824',16);line(c,points,'#777c83',10);
  shape(c,[[hx-7,hy-10],[hx+7,hy-10],[hx+9,hy+6],[hx-6,hy+7]],'#ba9c85','#f3d7ac');
 }
 steelSword(c,p.hx,p.hy,aw?155:tier===3?130:112,p.sword,tier);
 if(tier===2)steelSword(c,p.bx,p.by,92,-p.sword,2);
 if(tier===3)for(let i=0;i<3;i++){c.save();c.globalAlpha*=.55;steelSword(c,-45-i*20,-80-i*15,78,-.4-i*.3,3);c.restore();}
 c.restore();
 if(f.shield||f.guard)steelWard(c,tier,time);
 if(f.armor>0){c.strokeStyle='#ffe0ae77';c.lineWidth=2;c.beginPath();c.ellipse(0,-75,58,100,0,0,TAU);c.stroke();}
 c.restore();
}
