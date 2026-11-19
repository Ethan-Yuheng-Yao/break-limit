// Deterministic detail keeps the artwork stable as the camera moves.
const TAU=Math.PI*2;
export function material(c,x,y,w,h,base,light='#8193a2'){
 const g=c.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,light);g.addColorStop(.28,base);g.addColorStop(.72,base);g.addColorStop(1,'#0c1421');return g;
}
export function haze(c,x,y,r,color){const g=c.createRadialGradient(x,y,1,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);}
function stroke(c,points,color,width=1){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=width;c.stroke();}
export function lantern(c,x,y,time,color='#ffb578'){
 stroke(c,[[x,y-48],[x,y]],'#66717b',2);haze(c,x,y+12,75,color+'22');
 c.fillStyle='#17232e';c.fillRect(x-13,y-2,26,6);c.fillStyle='#dfad75';c.fillRect(x-8,y+4,16,24);c.fillStyle='#ffe7b4';c.fillRect(x-4,y+5,8,21);c.fillStyle='#25303a';c.fillRect(x-13,y+26,26,4);
 for(let i=0;i<3;i++)stroke(c,[[x-7+i*7,y+4],[x-7+i*7,y+26]],'#3f3b3b',1);
}
export function scenicSky(c,time,camera=0,theme='kairo'){
 const warm=theme==='nyra'||theme==='ronin',color=warm?'#e9ac8b':'#b2daef';
 haze(c,1010-camera*.05,190,270,warm?'#ee96571a':'#a3d9ff16');
 for(let i=0;i<7;i++){
  const x=((i*313-camera*.18+time*3)%1900+1900)%1900-240,y=235+i%3*70;
  c.save();c.translate(x,y);c.scale(1,.18);haze(c,0,0,190,color+'13');c.restore();
 }
 // Weathered towers and distant forest silhouettes form a finer horizon.
 for(let i=Math.floor(camera*.28/180)-2;i<Math.floor(camera*.28/180)+12;i++){
  const x=i*180-camera*.28,y=490+Math.sin(i*3)*25;
  c.fillStyle=warm?'#201d2b88':'#0b1d2b99';
  if(i%3===0){c.fillRect(x-20,y-105,40,130);c.fillRect(x-29,y-116,58,12);c.fillRect(x-12,y-143,24,28);}
  else for(let branch=0;branch<5;branch++)stroke(c,[[x,y],[x+Math.sin(i)*9,y-140],[x+(branch%2?1:-1)*(20+branch*7),y-110+branch*15]],'#142633aa',3);
 }
 for(let i=0;i<5;i++){const x=((i*287+time*8-camera*.22)%1700+1700)%1700-100,y=185+i%2*65;stroke(c,[[x-9,y+3],[x,y],[x+10,y+3]],'#0a182766',1.5);}
}
export function surfaceDetail(c,groundAt,left,right,time,theme){
 const green=theme==='kairo'?'#62938d':theme==='vex'?'#856d9b':theme==='ronin'?'#b48a71':'#b07045';
 for(let x=Math.floor(left/37)*37;x<right;x+=37){
  const y=groundAt(x),n=Math.abs(Math.sin(x*17.13));
  stroke(c,[[x,y+2],[x+12,y+2],[x+18,y+6]],'#d1c5a533',1);
  if(n>.45)for(let k=0;k<3;k++)stroke(c,[[x+k*5,y],[x+k*5-4+Math.sin(time*2+x)*2,y-7-n*13],[x+k*5-8,y-11-n*12]],green,1.5);
  if(n<.3){c.fillStyle='#10203088';c.beginPath();c.ellipse(x,y+6,10+n*20,4,0,0,TAU);c.fill();}
 }
}
