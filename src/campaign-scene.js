import {material,haze,lantern,scenicSky,surfaceDetail} from './atmosphere.js';
import {groundHeight} from './terrain.js';
const palettes={kairo:['#091c2b','#29465b','#395f70','#9ef9f2'],vex:['#130e28','#352849','#4d3967','#c39aff'],nyra:['#27131c','#57372d','#82503b','#ffbb73'],ronin:['#221c2b','#4a3943','#827078','#ffb6a0']};
function shape(c,points,fill,stroke){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}}
export function campaignSky(c,game){
 const [sky,rock,,accent]=palettes[game.terrain.theme],cam=game.cameraX;
 const gradient=c.createLinearGradient(0,0,0,810);gradient.addColorStop(0,sky);gradient.addColorStop(1,rock);c.fillStyle=gradient;c.fillRect(0,0,1440,810);
 c.fillStyle=accent+'20';c.beginPath();c.arc(1100-cam*.06,230,100,0,Math.PI*2);c.fill();
 for(let layer=0;layer<3;layer++){
  const shift=cam*(.13+layer*.13),points=[[-300,810]];
  for(let i=Math.floor(shift/180)-2;i<Math.floor(shift/180)+12;i++)points.push([i*180-shift,410+layer*75-Math.sin(i*2.7+layer)*65-(i%3===0?120:0)]);
  points.push([1800,810]);shape(c,points,[sky+'77',rock+'77',sky+'cc'][layer]);
 }
 scenicSky(c,game.time,cam,game.terrain.theme);
 for(let i=0;i<30;i++){const x=((i*173-cam*.35+game.time*5)%1540+1540)%1540-50,y=260+(i*97)%380;c.fillStyle=accent+'55';c.fillRect(x,y,2,2);}
}
export function campaignLand(c,game){
 const terrain=game.terrain,[sky,rock,edge,accent]=palettes[terrain.theme],left=game.cameraX-200,right=left+1840;
 // Unique landmarks travel at world speed, distant mountains at parallax speed.
 for(let x=300;x<terrain.width;x+=570){if(x<left-180||x>right+180)continue;const y=groundHeight(terrain,x),n=Math.floor(x/570);
  if(terrain.theme==='ronin'){
   shape(c,[[x-80,y],[x-66,y-245],[x-43,y-260],[x-33,y]],material(c,x-80,y-250,60,260,rock,edge),edge);
   shape(c,[[x-125,y-237],[x-132,y-260],[x+75,y-260],[x+100,y-278],[x+91,y-242]],rock,accent+'99');
   c.fillStyle='#984a51';c.fillRect(x-10,y-245,47,145);shape(c,[[x-10,y-100],[x+37,y-100],[x+37,y-60+Math.sin(game.time*2)*6],[x+13,y-80]],'#984a51');
   c.fillStyle='#efc48d';c.fillRect(x+10,y-215,4,83);lantern(c,x+70,y-208,game.time);
  }else if(terrain.theme==='vex'){
   shape(c,[[x-55,y-40],[x-35,y-210],[x+40,y-225],[x+70,y-65]],sky,edge);
   haze(c,x,y-145,95,accent+'25');
   c.strokeStyle=accent+'66';c.lineWidth=3;c.beginPath();c.ellipse(x,y-145,68,25,-.35,0,Math.PI*2);c.stroke();
  }else if(terrain.theme==='nyra'){
   shape(c,[[x-80,y],[x-40,y-160],[x-12,y-105],[x+30,y-240],[x+90,y]],rock,edge);
   haze(c,x+25,y-70,110,'#ff7c3533');
   shape(c,[[x-12,y-40],[x+15,y-185],[x+23,y-90],[x+55,y]],accent+'55');
  }else{
   for(const side of [-1,1])shape(c,[[x+side*65-14,y],[x+side*65-14,y-230-n%2*35],[x+side*65+16,y-230-n%2*35],[x+side*65+16,y]],rock,edge);
   lantern(c,x,y-183,game.time);
   for(let row=0;row<6;row++){c.strokeStyle=edge;c.beginPath();c.moveTo(x-78,y-row*34);c.lineTo(x-50,y-row*34);c.stroke();}
   shape(c,[[x-100,y-230],[x-90,y-250],[x+90,y-250],[x+100,y-230]],rock,accent+'66');
  }
 }
 shape(c,[[0,810],...terrain.ground.map(p=>[p.x,p.y]),[terrain.width,810]],material(c,0,550,100,300,rock,edge));
 c.strokeStyle=edge;c.lineWidth=7;c.beginPath();terrain.ground.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke();
 for(let x=Math.floor(left/95)*95;x<right;x+=95){const y=groundHeight(terrain,x);shape(c,[[x,y+18],[x+60,y+30],[x+35,y+100],[x-10,y+65]],sky+'66');}
 surfaceDetail(c,x=>groundHeight(terrain,x),left,right,game.time,terrain.theme);
 for(const p of terrain.platforms){if(p.x+p.width<left||p.x>right)continue;
  shape(c,[[p.x-10,p.y],[p.x+p.width+10,p.y],[p.x+p.width-20,p.y+34],[p.x+p.width*.65,p.y+55],[p.x+25,p.y+38]],material(c,p.x,p.y,p.width,60,rock,edge),edge);
  for(let i=25;i<p.width;i+=48){c.strokeStyle=sky+'aa';c.lineWidth=1;c.beginPath();c.moveTo(p.x+i,p.y+8);c.lineTo(p.x+i-12,p.y+28);c.lineTo(p.x+i+3,p.y+38);c.stroke();}
  surfaceDetail(c,()=>p.y,p.x,p.x+p.width,game.time,terrain.theme);
  c.fillStyle=accent+'99';c.fillRect(p.x,p.y-3,p.width,4);
  for(let i=30;i<p.width-20;i+=65){c.fillStyle=accent+'33';c.fillRect(p.x+i,p.y+12,25,3);}
 }
 const end=game.exitX??terrain.width-180,y=groundHeight(terrain,end),open=game.exitOpen;
 c.save();c.strokeStyle=open?accent:edge;c.lineWidth=5;c.beginPath();c.moveTo(end-50,y);c.lineTo(end-50,y-170);c.lineTo(end+50,y-170);c.lineTo(end+50,y);c.stroke();
 if(!game.stage.boss){
  if(open){haze(c,end,y-85,100,accent+'44');c.fillStyle=accent+'26';c.fillRect(end-47,y-167,94,167);for(let i=0;i<7;i++){const yy=y-((game.time*65+i*25)%165);c.strokeStyle=accent+'88';c.beginPath();c.moveTo(end-28,yy-9);c.lineTo(end,yy);c.lineTo(end-28,yy+9);c.stroke();}}
  else {c.strokeStyle=edge;c.lineWidth=2;for(let i=-30;i<=30;i+=20){c.beginPath();c.moveTo(end+i,y);c.lineTo(end+i,y-170);c.stroke();}}
  c.fillStyle=open?accent:'#a8b5c4';c.font='bold 12px Arial';c.textAlign='center';c.fillText(open?'EXIT →':'DEFEAT ALL ENEMIES',end,y-192);
 }c.restore();
}
