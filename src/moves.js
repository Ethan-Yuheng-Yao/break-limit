// Timelines own body movement and victim restraint; damage never grants armor invulnerability.
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const point=(t,x,y)=>({t,x,y});
function cast(g,f,slot,duration,clip,armor=false){
  g.startCast(f,slot,duration,armor);g.animate(f,clip,duration);
  g.emit('sound',{kind:slot===4?'ultimate':'skill',tier:f.tier});
}
function impact(g,f,t,damage,radius,x,{down=.75,launch=0}={}){
  g.effect('fracture',f,{x,y:g.floor,radius});
  if(Math.abs(t.x-x)<radius&&Math.abs(t.y-g.floor)<260)g.hit(f,t,damage,{knock:420,stun:.4,down,launch});
}
function captured(g,f,t){return g.phase==='fight'&&t.capture?.owner===f.id&&t.capture.serial===f.attackSerial;}
function endSlam(g,f,t,damage,x,radius,down=1){
  if(captured(g,f,t)){
    t.x=x;t.y=g.floor;g.hit(f,t,damage,{knock:0,unblockable:true});
    if(g.phase==='fight')g.release(t,down);
  }
  g.effect('fracture',f,{x,y:g.floor,radius});
}

function shield(g,f,slot){
  const aw=f.tier===4,storm=f.character==='kairo';
  cast(g,f,slot,.5,storm?'kairo-shield':'vex-shield');
  const hp=storm?[42,58,74,100][f.tier-1]:[65,85,110,150][f.tier-1];
  f.shield={type:storm?'storm':'void',hp,max:hp,time:aw?3.1:2.5,stored:0};
  if(storm&&aw){const t=g.enemy(f);g.effect('shieldBurst',f,{radius:190});if(g.inRange(f,t,190))g.displace(t,Math.sign(t.x-f.x||1)*500,.3);}
  g.emit('callout',{text:storm?(aw?'RAIJIN MANTLE':'STORM AEGIS'):(aw?'ABYSS CARAPACE':'VOID BASTION'),color:storm?'#a7fff2':'#c99aff'});
}

function flash(g,f,t){
  const aw=f.tier===4,dir=Math.sign(t.x-f.x)||f.facing,startX=f.x,reach=aw?590:270+(f.tier-1)*65;
  cast(g,f,0,aw?1.9:.8,aw?'kairo-godflash':'kairo-cut');
  g.strike(f,.12,()=>{
    g.aimDash(f,t,reach,.18);g.effect('dashLine',f,{fromX:startX,fromY:f.y-65,toX:t.x,toY:t.y-65});
    g.watchDash(f,t,()=>{
    f.facing=Math.sign(t.x-f.x)||dir;g.animate(f,'kairo-basic0',.3);g.effect('slash',f,{range:190});
    if(!aw){
      const confirm=f.tier>=2&&g.canControl(t)&&!t.guard;
      const hit=g.hit(f,t,17+f.tier*2,{knock:confirm?0:310,stun:.42});
      if(hit&&confirm&&g.phase==='fight'&&g.captureTarget(f,t,.55,[point(.5,t.x,t.y)],'flash-cut')){
        g.strike(f,.4,()=>{if(!captured(g,f,t))return;g.animate(f,'kairo-basic1',.28);g.effect('slash',f,{range:200});g.hit(f,t,8,{knock:0,unblockable:true});if(g.phase==='fight'){g.release(t);t.vx=dir*500;t.vy=f.tier>=3?-250:0;t.stun=.6;t.landDown=.6;g.animate(t,'tumble',.6);}});
      }return;
    }
    const cx=clamp(t.x,230,g.width-230);
    if(!g.captureTarget(f,t,1.42,[point(.18,cx,440),point(1.06,cx,360),point(1.34,cx,g.floor)],'assault')){
      g.hit(f,t,25,{knock:460,stun:.45});return;
    }
    const attacks=[[-160,470],[155,360],[-160,250],[140,380],[0,200]];
    attacks.forEach(([dx,y],i)=>g.strike(f,.10+i*.24,()=>{
      if(!captured(g,f,t))return;
      const fromX=f.x,fromY=f.y;f.x=clamp(cx+dx,70,g.width-70);f.y=y;f.facing=dx>0?-1:1;
      const dashTime=i===4?.28:.14;if(i===4)f.facing=-1;
      g.path(f,[point(dashTime,cx+(dx>0?-65:65),i===4?g.floor:y)],dashTime);
      g.animate(f,i===4?'kairo-execution':'kairo-basic'+i%3,.23);
      g.effect('dashLine',f,{fromX,fromY:fromY-60,toX:f.x,toY:y-60});
      g.hit(f,t,5,{knock:0,stun:0});
    }));
    g.strike(f,1.34,()=>{endSlam(g,f,t,21,cx,240,1.1);f.x=cx+75;f.y=g.floor;f.motion=null;g.animate(f,'kairo-execution',.3);});
    });
  });
}

function grasp(g,f,t){
  const aw=f.tier===4,reach=aw?720:430+(f.tier-1)*55,dir=f.facing;
  cast(g,f,0,aw?1.8:1.15,aw?'vex-horizon':'vex-pull');
  const x=f.x,center=clamp(x+dir*(aw?200:100),70,g.width-70);
  g.effect('vortex',f,{x:center,y:g.floor-120,radius:aw?240:100,duration:aw?1.5:.7});
  g.strike(f,.25,()=>{
    if((t.x-x)*dir<0||Math.abs(t.x-x)>reach||Math.abs(t.y-f.y)>370)return;
    if(!g.captureTarget(f,t,aw?1.05:.52,[point(aw?.45:.36,center,aw?370:g.floor),point(aw?1.05:.52,x+dir*100,aw?420:g.floor)],aw?'singularity':'grab')){g.hit(f,t,12,{knock:80});return;}
    g.strike(f,aw?.93:.43,()=>{
      if(!captured(g,f,t))return;
      g.hit(f,t,aw?31:21,{knock:0,unblockable:true});
      if(g.phase!=='fight')return;
      g.release(t);t.vx=dir*(aw?1100:760);t.vy=aw?-430:-180;t.stun=.7;
      g.animate(t,'tumble',.75);g.animate(f,'vex-basic3',.45);g.effect('shieldBurst',f,{x:t.x,y:t.y-70,radius:aw?220:100});
      t.landDown=aw?1:.6;
    });
  });
}

function thunderfall(g,f,t){
  const aw=f.tier===4,duration=aw?2.5:1.5,impactTime=aw?1.85:1.05;
  cast(g,f,3,duration,aw?'kairo-ascend':'kairo-slam',true);
  const x=clamp(t.x,f.x-(aw?700:450),f.x+(aw?700:450)),tx=clamp(x,75,g.width-75),radius=aw?290:150+f.tier*18;
  g.path(f,[point(.42,tx,aw?230:390),point(aw?1.55:.76,tx,aw?230:350),point(impactTime,tx,g.floor)],impactTime);
  g.effect('warning',f,{x:tx,y:g.floor,radius,delay:impactTime});
  if(aw)g.strike(f,1.2,()=>g.effect('skyCharge',f,{x:tx,y:230,radius:240,duration:.65}));
  g.strike(f,impactTime,()=>{
    f.y=g.floor;g.animate(f,'kairo-execution',duration-impactTime);
    g.effect('lightning',f,{x:tx,y:g.floor,radius});impact(g,f,t,aw?43:24+f.tier*2,radius,tx,{down:aw?1.35:.85});
    if(aw)for(const offset of [-230,230])g.effect('lightning',f,{x:tx+offset,y:g.floor,radius:100});
  });
}

function crush(g,f,t){
  const aw=f.tier===4,duration=aw?2.65:1.65,end=aw?2.15:1.18,tx=t.x,radius=aw?320:160+f.tier*15;
  cast(g,f,3,duration,aw?'vex-zero':'vex-crush',true);
  g.path(f,[point(.6,f.x,aw?230:535),point(end-.15,f.x,aw?230:535),point(duration,f.x,g.floor)],duration);
  g.effect('warning',f,{x:tx,y:g.floor,radius,delay:.4});
  g.strike(f,.4,()=>{
    const inField=Math.abs(t.x-tx)<radius&&Math.abs(t.x-f.x)<(aw?900:650);
    if(!inField)return;
    g.effect('gravityColumn',f,{x:tx,y:g.floor,radius,duration:end-.4});
    if(!g.captureTarget(f,t,end-.4+.08,[point(aw?.55:.28,tx,aw?200:390),point(end-.65,tx,aw?200:360),point(end-.4,tx,g.floor)],'zero')){
      g.strike(f,end-.4,()=>impact(g,f,t,aw?40:25,radius,tx));return;
    }
  });
  g.strike(f,end,()=>{
    g.animate(f,'vex-collapse',.45);
    if(captured(g,f,t))endSlam(g,f,t,aw?49:27+f.tier*2,tx,aw?380:220,aw?1.45:.9);
    else g.effect('fracture',f,{x:tx,y:g.floor,radius});
  });
}

function kairoUltimate(g,f,t){
  const aw=f.tier===4,dir=f.facing,start=f.x,tx=clamp(t.x,180,g.width-180);
  cast(g,f,4,aw?3.6:3.5,aw?'kairo-judgement':'kairo-storm-draw',true);f.meter=0;
  g.emit('cinematic',{character:f.character,title:aw?'HEAVEN’S JUDGEMENT':'STORM SEVERANCE',duration:aw?3.6:3.5});
  if(!aw){
    g.effect('skyCharge',f,{x:f.x,y:f.y-70,radius:100,duration:.65});
    g.strike(f,.65,()=>{g.aimDash(f,t,720,.26);g.effect('dashLine',f,{fromX:start,fromY:f.y-80,toX:t.x,toY:t.y-80});
      g.watchDash(f,t,()=>{
      const guarded=t.guard&&Math.sign(f.x-t.x)===t.facing;
      if(guarded||!g.canControl(t)){g.hit(f,t,84,{knock:950,stun:.75,down:1});return;}
      if(!g.hit(f,t,14,{knock:0,stun:.35})||g.phase!=='fight')return;
      const cx=clamp(t.x,160,g.width-160),side=Math.sign(t.x-f.x)||dir;
      if(!g.captureTarget(f,t,2.35,[point(.5,cx,290),point(1.65,cx,290),point(2.1,cx,g.floor)],'storm-severance'))return;
      f.facing=side;g.animate(f,'kairo-storm-rise',.75);
      g.path(f,[point(.5,cx-side*100,340),point(.8,cx-side*100,340),point(1.2,cx+side*110,260),point(1.8,cx+side*110,220),point(2.1,cx+side*70,g.floor)],2.1);
      g.strike(f,.5,()=>{if(!captured(g,f,t))return;g.effect('stormCrescent',f,{x:cx,y:350,radius:220,duration:.55});g.hit(f,t,12,{knock:0,unblockable:true});});
      g.strike(f,1,()=>{if(!captured(g,f,t))return;f.facing=-side;g.animate(f,'kairo-storm-spin',.6);g.effect('stormCross',f,{x:cx,y:290,radius:260,duration:.7});g.hit(f,t,16,{knock:0,unblockable:true});});
      g.strike(f,1.55,()=>{if(!captured(g,f,t))return;g.animate(f,'kairo-storm-finish',.9);g.effect('stormBlade',f,{x:cx,y:g.floor,radius:290,duration:.8});});
      g.strike(f,2.1,()=>{if(!captured(g,f,t))return;g.effect('lightning',f,{x:cx,y:g.floor,radius:270});endSlam(g,f,t,42,cx,360,1.4);g.animate(f,'kairo-storm-sheathe',.65);});
      });
    });
    return;
  }
  g.path(f,[point(.75,tx-110,220),point(2.5,tx-110,220),point(3.3,tx-110,g.floor)],3.3);
  g.effect('warning',f,{x:tx,y:g.floor,radius:250,delay:.8});
  g.strike(f,.8,()=>{
    g.effect('skyCharge',f,{x:tx,y:180,radius:300,duration:1.8});
    if(Math.abs(t.x-tx)<250)g.captureTarget(f,t,1.95,[point(.6,tx,300),point(1.6,tx,300),point(1.86,tx,g.floor)],'judgement');
  });
  for(const delay of [1.3,1.7,2.1])g.strike(f,delay,()=>{g.effect('lightning',f,{x:tx,y:g.floor,radius:100});if(captured(g,f,t))g.hit(f,t,7,{knock:0});});
  g.strike(f,2.65,()=>{
    g.effect('heavenSpear',f,{x:tx,y:g.floor,radius:340});
    if(captured(g,f,t))endSlam(g,f,t,54,tx,410,1.6);else impact(g,f,t,54,260,tx,{down:1.6});
  });
}

function vexUltimate(g,f,t){
  const aw=f.tier===4,duration=aw?3.8:2.1,tx=clamp(t.x,250,g.width-250),end=aw?3.1:1.6;
  cast(g,f,4,duration,aw?'vex-apocalypse':'vex-ultimate',true);f.meter=0;
  g.emit('cinematic',{character:f.character,title:aw?'END OF EVERYTHING':'VOID COLLAPSE',duration});
  g.path(f,[point(.7,f.x,aw?240:490),point(end,f.x,aw?240:490),point(duration,f.x,g.floor)],duration);
  g.effect('warning',f,{x:tx,y:g.floor,radius:aw?440:260,delay:.65});
  g.strike(f,.65,()=>{
    g.effect('blackHole',f,{x:tx,y:350,radius:aw?320:160,duration:end-.65});
    if(Math.abs(t.x-tx)<(aw?440:260)&&Math.abs(t.x-f.x)<(aw?1100:750)){
      const points=aw?[point(.5,tx+140,360),point(1.05,tx-100,270),point(1.55,tx+45,355),point(2.2,tx,350)]:[point(.45,tx,380),point(.9,tx,350)];
      g.captureTarget(f,t,end-.65+.12,points,'singularity');
    }
  });
  if(aw)for(const delay of [1.25,1.8,2.4])g.strike(f,delay,()=>{if(captured(g,f,t))g.hit(f,t,6,{knock:0});});
  g.strike(f,end,()=>{
    g.effect('supernova',f,{x:tx,y:350,radius:aw?500:280});g.effect('fracture',f,{x:tx,y:g.floor,radius:aw?470:250});
    if(captured(g,f,t)){
      g.hit(f,t,aw?59:46,{knock:0,unblockable:true});
      if(g.phase==='fight'){g.release(t);t.vx=Math.sign(t.x-f.x||1)*1100;t.vy=-250;t.stun=1.05;t.landDown=1.5;g.animate(t,'tumble',1.1);}
    }else if(Math.abs(t.x-tx)<(aw?350:240))g.hit(f,t,aw?59:46,{knock:1000,stun:.8,down:1.2});
    g.animate(f,'vex-collapse',.6);
  });
}

export function castSkill(g,f,t,slot){
  f.facing=Math.sign(t.x-f.x)||f.facing;
  if(slot===2)return shield(g,f,slot);
  if(slot===0)return f.character==='kairo'?flash(g,f,t):grasp(g,f,t);
  if(slot===3)return f.character==='kairo'?thunderfall(g,f,t):crush(g,f,t);
  if(slot===4)return f.character==='kairo'?kairoUltimate(g,f,t):vexUltimate(g,f,t);
}
