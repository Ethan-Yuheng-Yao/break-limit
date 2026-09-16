import { W,H,FLOOR,CHARACTERS,clamp } from './engine.js';
import { characterPose } from './animation.js';
const TAU=Math.PI*2;
function line(c,points,color,width=2){c.strokeStyle=color;c.lineWidth=width;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();}
function polygon(c,points,fill,stroke){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke();}}
function circle(c,x,y,r,color){c.beginPath();c.arc(x,y,Math.max(.01,r),0,TAU);c.fillStyle=color;c.fill();}
function glow(c,x,y,r,color){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);}
function lightning(c,x1,y1,x2,y2,color,width=2,seed=1){const points=[[x1,y1]];for(let i=1;i<12;i++){const t=i/12,noise=Math.sin(i*27+seed*16)*Math.sin(t*Math.PI);points.push([x1+(x2-x1)*t+noise*30,y1+(y2-y1)*t+Math.cos(i*17+seed)*noise*10]);}points.push([x2,y2]);line(c,points,color,width);}
function arm(c,sx,sy,hx,hy,color,bend=1){
  const dx=hx-sx,dy=hy-sy,d=Math.max(1,Math.hypot(dx,dy)),offset=Math.sqrt(Math.max(25,38*38-d*d/4));
  const ex=(sx+hx)/2-dy/d*offset*bend,ey=(sy+hy)/2+dx/d*offset*bend;
  line(c,[[sx,sy],[ex,ey],[hx,hy]],color,12);circle(c,ex,ey,6,color);
}

export function drawFighter(c,f,time,{portrait=false,ghost=false}={}){
  const kairo=f.character==='kairo',aw=f.tier===4,color=kairo?(aw?'#e1fffc':'#88ede9'):(aw?'#e1b8ff':'#b18bf0');
  const moving=f.pose==='run',attack=f.attackTime>0&&['attack','skill'].includes(f.pose),hurt=f.pose==='hurt';
  const pose=characterPose(portrait?{...f,y:FLOOR}:f,time);
  c.save();c.translate(f.x,f.y);if(!portrait){c.save();c.scale(1,.22);glow(c,0,10,85,aw?'#b094ff35':'#00000099');c.restore();}
  c.translate(0,aw?-9+Math.sin(time*3)*4:0);c.scale(f.facing,1);
  if(f.capture?.kind==='singularity'){const shrink=clamp(.4+f.capture.time*.35,.4,1);c.scale(shrink,shrink);}
  c.translate(pose.dx,pose.dy-65);c.rotate(pose.turn);c.translate(0,65);
  if(ghost)c.globalAlpha=.25;
  if((f.tier>=2||portrait)&&!f.down){glow(c,0,-65,aw?140:100,kairo?'#7ddfff22':'#9b60ff33');
    for(let i=0;i<(aw?9:4);i++){const a=time*(kairo?1.6:-.6)+i*TAU/(aw?9:4);const x=Math.cos(a)*56,y=-75+Math.sin(a)*75;
      if(kairo)lightning(c,x,y,x+12,y-28,color+'85',1,time+i);else polygon(c,[[x,y-6],[x+5,y],[x,y+6],[x-4,y]],color+'aa');}}
  if(aw&&!f.down){
    c.save();c.translate(0,-123);c.rotate(time*.4);c.strokeStyle=color+'bb';c.lineWidth=2;c.beginPath();c.ellipse(0,0,kairo?45:66,kairo?15:49,0,0,TAU);c.stroke();
    if(!kairo){circle(c,0,0,36,'#070914');c.strokeStyle='#9360da';c.beginPath();c.ellipse(0,0,27,12,0,0,TAU);c.stroke();circle(c,0,0,6,'#ddc5ff');}
    else for(let i=0;i<5;i++){const a=i*TAU/5;circle(c,Math.cos(a)*45,Math.sin(a)*15,4,color);}
    c.restore();
  }
  // Articulated legs stay below the rotating torso and bend during lunges/jumps.
  const kneeLift=Math.max(0,pose.dy)*.55,groundOffset=f.y>=FLOOR-1?pose.dy:0,ly=pose.ly-groundOffset,ry=pose.ry-groundOffset;
  line(c,[[-11,-46],[(pose.lf-11)*.5-8,-23-kneeLift+ly*.3],[pose.lf,ly]],aw&&kairo?'#b4c8d0':'#182738',13);
  line(c,[[10,-46],[(pose.rf+10)*.5+9,-23-kneeLift+ry*.3],[pose.rf,ry]],aw&&kairo?'#e6f2f4':'#2d3e50',13);
  line(c,[[pose.lf-4,ly],[pose.lf+10,ly]],'#82a8b8',6);line(c,[[pose.rf-3,ry],[pose.rf+12,ry]],color+'a0',6);
  c.save();c.translate(0,-55);c.rotate(pose.lean);c.translate(0,55);
  // Torso, head, scarf, arms, and weapon follow the same body pivot.
  const tail=moving?Math.sin(time*12)*8:Math.sin(time*3)*6;
  polygon(c,[[-15,-104],[-37,-99],[-70-(moving?14:0),-108+tail],[-54,-88+tail],[-21,-82]],kairo?(aw?'#d9f9f6':'#3e9fa8'):'#5e3a8d',color+'55');
  polygon(c,[[-19,-103],[14,-103],[24,-53],[35,-29],[6,-40],[0,-58],[-8,-38],[-32,-29],[-22,-55]],kairo?(aw?'#dce8ed':'#192d3f'):(aw?'#170e29':'#252038'),color+'80');
  polygon(c,[[-15,-98],[-5,-103],[4,-66],[-9,-61]],kairo?'#376276':'#624388');
  polygon(c,[[13,-103],[22,-93],[14,-71],[5,-67]],aw?'#bd93df':'#36455a');
  line(c,[[-20,-56],[22,-56]],kairo?'#76c9c9':'#b490d7',5);
  if(aw){for(let i=0;i<3;i++)line(c,[[-17+i*12,-89],[-12+i*12,-72],[-17+i*12,-66]],color,1.5);}
  // Neck, face, and silhouette-defining hair.
  polygon(c,[[-6,-111],[7,-111],[8,-101],[-8,-101]],'#b4b8bc');
  polygon(c,[[-14,-129],[8,-135],[17,-123],[13,-110],[4,-104],[-10,-111]],kairo?'#bdc6c9':'#a0a0b6','#405465');
  if(kairo)polygon(c,[[-16,-118],[-21,-134],[-13,-132],[-17,-147],[-6,-138],[-1,-153],[6,-138],[15,-146],[14,-132],[25,-131],[14,-122],[5,-130],[-3,-117]],aw?'#f1ffff':'#d1e3e7',color+'88');
  else polygon(c,[[-16,-116],[-22,-129],[-15,-145],[-5,-138],[6,-147],[19,-136],[17,-123],[8,-130],[-1,-120],[-6,-111]],aw?'#e0c9f5':'#3f344f',color+'66');
  line(c,[[5,-118],[13,-120]],color,aw?3:2);if(aw)glow(c,10,-119,13,color+'77');
  const armX=pose.hx,armY=pose.hy;
  arm(c,-17,-95,pose.bx,pose.by,kairo&&aw?'#9fb7c7':'#233448',-1);
  circle(c,pose.bx,pose.by,kairo?6:10,kairo?'#aabcc5':'#70518d');
  arm(c,17,-96,armX,armY,kairo&&aw?'#cedee4':'#3a465e',1);
  circle(c,armX,armY,7,kairo?'#bccbd1':'#8563a7');
  if(kairo){
    c.save();c.translate(armX,armY);c.rotate(pose.sword);
    line(c,[[0,10],[0,-8]],'#294759',5);line(c,[[-9,-8],[9,-8]],'#d2b98e',4);
    polygon(c,[[-2,-10],[-2,aw?-104:-86],[3,aw?-119:-97],[4,-10]],aw?'#edffff':'#a5dae2',color);
    line(c,[[4,-14],[4,aw?-110:-90]],color,2);if(aw)glow(c,0,-65,45,'#b1ffff30');c.restore();
  }else{
    polygon(c,[[armX-11,armY-14],[armX+8,armY-15],[armX+14,armY+2],[armX-5,armY+10]],aw?'#140d21':'#403252',color);
    if(attack||aw){glow(c,armX+3,armY,40,'#bb72ff55');circle(c,armX+3,armY,10,'#171026');}
  }
  c.restore();
  if(f.guard){c.strokeStyle=color+'b0';c.lineWidth=2;c.beginPath();c.ellipse(18,-76,46,70,0,-Math.PI/2,Math.PI/2);c.stroke();}
  if(f.shield&&(f.shield.hp>0||f.shieldReaction)){
    const storm=f.shield.type==='storm',strength=f.shield.hp/f.shield.max;c.strokeStyle=color;c.lineWidth=3;c.globalAlpha=.4+strength*.5;
    if(storm){
      if(aw){c.beginPath();c.ellipse(0,-76,77,106,0,0,TAU);c.stroke();}
      polygon(c,[[48,-157],[77,-124],[86,-71],[68,-19],[48,7],[36,-37],[34,-125]],color+'18',color);
      for(let i=0;i<4;i++)lightning(c,48,-147+i*35,72,-116+i*31,color,2,time*2+i);
    }else{
      glow(c,0,-70,128,'#b76fff28');c.beginPath();c.ellipse(0,-72,91,113,0,0,TAU);c.stroke();
      for(let i=0;i<6;i++){const a=time*.8+i*TAU/6;polygon(c,[[Math.cos(a)*80,Math.sin(a)*97-72],[Math.cos(a+.23)*91,Math.sin(a+.23)*108-72],[Math.cos(a+.46)*80,Math.sin(a+.46)*97-72]],'#a880ec20',color+'aa');}
      circle(c,0,-75,5+f.shield.stored*.18,'#dbb8ff');
    }c.globalAlpha=ghost?.25:1;
  }
  if(f.armor>0){c.strokeStyle=color+'88';c.lineWidth=1.5;for(let i=0;i<3;i++){const y=-145+((time*70+i*60)%175);line(c,[[-37,y],[-43,y-12]],color+'99',2);line(c,[[40,y],[46,y-12]],color+'99',2);}glow(c,0,-60,100,color+'16');}
  if(hurt){c.globalCompositeOperation='screen';glow(c,0,-75,70,'#ffffff44');}
  c.restore();
}

export class Renderer {
  constructor(canvas){this.canvas=canvas;this.c=canvas.getContext('2d');this.fx=[];this.particles=[];this.labels=[];this.shake=0;this.flash=0;this.reduced=false;this.cinematic=null;this.callout=null;}
  event(e){
    if(e.type==='effect'){
      const durations={transform:3.5,ultimate:1.5,warning:e.delay||.7,vortex:1.0,lightning:.65,crush:.7,detonate:1.0,beam:.38,dash:.38,afterimage:.38,fracture:7,skyCharge:1,gravityColumn:1.8,blackHole:2,supernova:1.3,heavenSpear:1.1,dashLine:.32,shieldBurst:.7,shieldHit:.3};
      this.fx.push({...e,life:e.duration||durations[e.kind]||.4,max:e.duration||durations[e.kind]||.4});
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
    // Mist, distant shrines, and hanging architectural details.
    for(let i=0;i<7;i++){const x=(i*291+time*(domain?8:3))%(W+320)-160,y=410+i%3*43;const g=c.createLinearGradient(0,y-24,0,y+24);g.addColorStop(0,'transparent');g.addColorStop(.5,'#83aabc0b');g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(x,y-24,440,48);}
    for(const [x,scale]of [[150,.75],[1200,.6],[670,.4]]){
      c.save();c.translate(x,540);c.scale(scale,scale);c.fillStyle='#0d1c28';c.fillRect(-75,-200,16,200);c.fillRect(65,-200,16,200);polygon(c,[[-118,-220],[-108,-231],[-75,-214],[80,-214],[121,-231],[111,-213],[0,-202]],'#0d1c28');c.fillRect(-92,-180,185,10);c.restore();
    }
    for(let i=0;i<10;i++){
      let x=i*161+25,y=domain?420+Math.sin(i*7+time*.7)*80:630;
      if(domain){c.save();c.translate(x,y);c.rotate(Math.sin(i+time*.2)*.3);polygon(c,[[-32,-4],[4,-17],[44,0],[27,30],[-12,51]],'#1d293d','#58618088');line(c,[[-32,-4],[4,-17],[44,0]],'#88a0c36b');c.restore();}
    }
    // The combat plane is deliberately clear and stable in both arenas.
    const floor=c.createLinearGradient(0,FLOOR,0,H);floor.addColorStop(0,domain?'#273145':'#233b49');floor.addColorStop(1,'#0c1722');c.fillStyle=floor;c.fillRect(0,FLOOR,W,H-FLOOR);
    line(c,[[0,FLOOR],[W,FLOOR]],domain?'#b5a9e680':'#8fbdcf66',2);
    for(let i=-5;i<15;i++)line(c,[[W/2+(i-5)*80,FLOOR],[W/2+(i-5)*230,H]],'#718ca119',1);
    for(let i=0;i<4;i++){const y=FLOOR+20+i*i*12;line(c,[[0,y],[W,y]],'#718ca11d',1);}
    for(let i=0;i<12;i++){const x=i*127+Math.sin(i*7)*30;line(c,[[x,FLOOR],[x+18,FLOOR+15],[x+8,FLOOR+22],[x+26,FLOOR+37]],'#06121eaa',2);}
    for(let i=0;i<38;i++){const x=(i*173+time*(10+i%8))%W,y=100+(i*83)%540+Math.sin(time+i)*15;circle(c,x,y,i%4===0?1.4:.7,domain?'#c4aeec55':'#aad8dc44');}
    const vignette=c.createRadialGradient(W/2,H/2,250,W/2,H/2,830);vignette.addColorStop(0,'transparent');vignette.addColorStop(1,'#03081199');c.fillStyle=vignette;c.fillRect(0,0,W,H);
  }
  drawEffect(e,time){
    const c=this.c,p=1-e.life/e.max,color=e.color||'#bbfaff';
    c.save();c.globalAlpha=Math.min(1,e.life*5);c.translate(e.x,e.y);c.strokeStyle=color;c.lineWidth=2;
    if(e.kind==='dashLine'){
      const x1=e.fromX-e.x,y1=e.fromY-e.y,x2=e.toX-e.x,y2=e.toY-e.y;
      line(c,[[x1,y1],[x2,y2]],color+'88',(1-p)*16+1);lightning(c,x1,y1,x2,y2,'#e5ffff',2,p*20);
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
    if(e.kind==='stormCrescent'||e.kind==='stormCross'){
      const r=e.radius||220;c.lineWidth=9*(1-p)+2;c.strokeStyle='#d9fff8';
      if(e.kind==='stormCrescent'){c.beginPath();c.arc(0,0,r*(.55+p*.45),Math.PI*.15+p,Math.PI*1.55+p);c.stroke();}
      else for(const sign of [-1,1]){lightning(c,-r,-r*sign,r,r*sign,color,7*(1-p)+2,time);line(c,[[-r*.75,-r*.75*sign],[r*.75,r*.75*sign]],'#f0fffb',3);}
      glow(c,0,0,r*.8,color+'33');
    }
    if(e.kind==='stormBlade'){
      const length=420,tip=-length*(1-Math.min(1,p*1.4)),width=10+Math.sin(p*Math.PI)*35;
      polygon(c,[[-width,-length-85],[width,-length-85],[width*.6,tip-30],[0,tip],[-width*.6,tip-30]],'#e7fff4',color);
      for(const sign of [-1,1])lightning(c,sign*width,-length-75,sign*width*.5,tip-20,color,4,time+sign);
      glow(c,0,tip-35,110,color+'55');
    }
    if(e.kind==='gravityColumn'){
      const radius=e.radius||220;
      for(let i=0;i<5;i++){const y=-((p*480+i*100)%520);c.beginPath();c.ellipse(0,y,radius*(.8-i*.1),24,0,0,TAU);c.stroke();}
      for(let i=0;i<14;i++){const x=Math.sin(i*8)*radius,y=-((p*550+i*43)%480);polygon(c,[[x-9,y],[x+2,y-11],[x+13,y+3],[x,y+15]],'#354058',color+'88');}
    }
    if(e.kind==='skyCharge'){
      const r=60+Math.sin(p*Math.PI)*80;glow(c,0,0,r*2,color+'66');
      for(let i=0;i<7;i++){const a=i*TAU/7+time;lightning(c,Math.cos(a)*r*2,Math.sin(a)*r,0,0,color,2,time+i);}
      circle(c,0,0,10+p*18,'#f4ffff');
    }
    if(e.kind==='heavenSpear'){
      glow(c,0,-260,320,'#c7ffff66');polygon(c,[[-20,-900],[20,-900],[38,-100],[0,30],[-38,-100]],'#efffff');
      for(let i=-2;i<=2;i++)lightning(c,i*90,-800,i*28,0,color,4,time*3+i);
      c.beginPath();c.ellipse(0,0,80+p*500,25+p*120,0,0,TAU);c.stroke();
    }
    if(e.kind==='blackHole'){
      const r=(e.radius||230)*(.3+Math.sin(p*Math.PI)*.7);glow(c,0,0,r*1.8,'#b761f755');circle(c,0,0,r*.6,'#02030a');
      for(let i=0;i<4;i++){c.save();c.rotate(time*.6+i*.32);c.beginPath();c.ellipse(0,0,r+i*10,r*.32,0,0,TAU);c.stroke();c.restore();}
      for(let i=0;i<16;i++){const a=i*TAU/16+time*.7,dist=r*(1.3+(1-p)*1.3);polygon(c,[[Math.cos(a)*dist,Math.sin(a)*dist],[Math.cos(a)*dist+12,Math.sin(a)*dist-8],[Math.cos(a)*dist+17,Math.sin(a)*dist+10]],'#7c6497');}
    }
    if(e.kind==='supernova'){
      const r=20+p*(e.radius||450);glow(c,0,0,r*1.5,'#c699ff66');circle(c,0,0,r*.55,p<.15?'#030410':'#ead8ff66');
      for(let i=0;i<16;i++){const a=i*TAU/16;line(c,[[Math.cos(a)*r*.2,Math.sin(a)*r*.2],[Math.cos(a)*r,Math.sin(a)*r]],color,4*(1-p));}c.beginPath();c.arc(0,0,r,0,TAU);c.stroke();
    }
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
    if(e.kind==='lightning'){
      const count=e.tier===4?5:1;
      for(let i=0;i<count;i++){const x=(i-(count-1)/2)*75;glow(c,x,-250,180,color+'44');lightning(c,x-60,-800,x,0,color,12*(1-p),Math.floor(time*20)+i);lightning(c,x-60,-800,x,0,'#f5ffff',3,Math.floor(time*20)+i);}
      c.scale(1,.3);c.beginPath();c.arc(0,0,p*e.radius*2,0,TAU);c.stroke();
    }
    if(e.kind==='ultimate'){
      if(color==='#9ef9f2'){lightning(c,0,-700,0,0,color,4,time*8);for(let i=0;i<5;i++)lightning(c,-350+i*160,-600,-200+i*100,100,color+'88',2,time+i);}
      else{glow(c,0,-80,250+p*120,color+'66');circle(c,0,-80,30+p*150,'#03040c');c.beginPath();c.ellipse(0,-80,100+p*200,40+p*60,-.3,0,TAU);c.stroke();}
    }
    c.restore();
  }
  render(game,dt){
    if(game.clash)dt*=.08;
    const c=this.c,time=game.time;c.save();this.shake*=Math.exp(-dt*10);
    if(!this.reduced&&this.shake>.2)c.translate(Math.sin(time*121)*this.shake,Math.cos(time*99)*this.shake*.6);
    this.background(time,game.domain);
    // Pull back around the floor so aerial poses stay below the HUD and cinematic bars.
    const targetZoom=clamp(1-(FLOOR-Math.min(...game.fighters.map(f=>f.y)))/1800,.78,1);
    this.zoom=(this.zoom??1)+(targetZoom-(this.zoom??1))*(dt===0?1:1-Math.exp(-6*dt));
    c.translate(W/2,FLOOR);c.scale(this.zoom,this.zoom);c.translate(-W/2,-FLOOR);
    const behind=['warning','vortex','transform','fracture','gravityColumn','blackHole'];
    for(const e of this.fx.filter(e=>behind.includes(e.kind)))this.drawEffect(e,time);
    for(const f of game.fighters){
      if(f.dash>0||f.tier===4&&f.pose==='run'||f.character==='kairo'&&f.cast?.slot===0)for(let i=3;i>0;i--)drawFighter(c,{...f,x:f.x-f.facing*i*24},time,{ghost:true});
      drawFighter(c,f,time);
      c.fillStyle=CHARACTERS[f.character].color;c.font='bold 10px Arial';c.textAlign='center';c.fillText(f.id===0?'YOU':game.mode==='ai'?'CPU':'P2',f.x,f.y-(f.tier===4?197:172));
      c.beginPath();c.moveTo(f.x-4,f.y-165);c.lineTo(f.x+4,f.y-165);c.lineTo(f.x,f.y-161);c.fill();
    }
    if(game.clash){
      const clash=game.clash,a=game.fighters[clash.attacker],d=game.fighters[clash.defender],progress=clash.elapsed/clash.duration;
      const ac=CHARACTERS[a.character].color,dc=CHARACTERS[d.character].color,ax=a.x+a.facing*62,ay=a.y-95,dx=d.x+d.facing*57,dy=d.y-95;
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
    if(this.flash>0){this.flash=Math.max(0,this.flash-dt*1.7);c.fillStyle=`rgba(197,232,249,${this.flash*(this.reduced?.12:1)})`;c.fillRect(0,0,W,H);}
    if(this.cinematic){
      this.cinematic.life-=dt;c.fillStyle='#020710da';c.fillRect(0,0,W,130);c.fillRect(0,H-95,W,95);
      const elapsed=(this.cinematic.duration||1.5)-this.cinematic.life;
      if(elapsed<.7){c.globalAlpha=clamp((.7-elapsed)/.2,0,1);c.fillStyle=CHARACTERS[this.cinematic.character].color;c.textAlign='center';c.font="italic 800 40px 'Barlow Condensed',Impact";c.fillText(this.cinematic.title.toUpperCase(),W/2,H*.32);c.globalAlpha=1;}
      if(this.cinematic.life<=0)this.cinematic=null;
    }
    if(this.callout){this.callout.life-=dt;c.globalAlpha=Math.min(1,this.callout.life*3);c.fillStyle=this.callout.color;c.textAlign='center';c.font="700 22px 'Barlow Condensed',Arial";c.fillText(this.callout.text,W/2,210);c.globalAlpha=1;if(this.callout.life<=0)this.callout=null;}
    if(game.phase==='fight'){c.fillStyle='#9bb2c0';c.font='11px monospace';c.textAlign='center';c.fillText(String(Math.ceil(game.roundTime)).padStart(2,'0'),W/2,190);}
  }
}
export function drawPortrait(canvas,character,time=0){
  const c=canvas.getContext('2d'),kairo=character==='kairo';c.clearRect(0,0,600,360);
  glow(c,405,160,250,kairo?'#78dbed22':'#ad60e733');
  c.save();c.translate(405,180);c.rotate(-.25);c.strokeStyle=kairo?'#9adbe52a':'#b78bdb38';c.lineWidth=1;
  for(let i=0;i<5;i++){c.beginPath();c.ellipse(0,0,85+i*23,85+i*23,0,0,TAU);c.stroke();}c.restore();
  if(kairo){for(let i=0;i<4;i++)lightning(c,340+i*57,0,390+i*38,340,'#a9f8f84a',1,i);}
  else{circle(c,450,120,72,'#0c0c18');c.strokeStyle='#a878d777';c.beginPath();c.ellipse(450,120,116,32,-.4,0,TAU);c.stroke();}
  c.save();c.translate(420,345);c.scale(2.15,2.15);drawFighter(c,{character,id:0,x:0,y:0,facing:kairo?-1:1,tier:2,pose:'idle',attackTime:0},time,{portrait:true});c.restore();
  const g=c.createLinearGradient(0,0,520,0);g.addColorStop(0,kairo?'#142b37':'#231f33');g.addColorStop(.36,kairo?'#142b37cc':'#231f33cc');g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(0,0,600,360);
}

