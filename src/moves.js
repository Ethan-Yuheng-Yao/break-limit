import {roninSkill} from './ronin-moves.js';
import {FORMS,comboClip} from './forms.js';
import {specialMove,NYRA_FORMS} from './specials.js';
import {stormCombo} from './choreography.js';
// Timelines own body movement and victim restraint; damage never grants armor invulnerability.
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const point=(t,x,y)=>({t,x,y});
function cast(g,f,slot,duration,clip,armor=false){
  g.startCast(f,slot,duration,armor);g.animate(f,clip,duration);
  g.emit('sound',{kind:slot===4?'ultimate':'skill',tier:f.tier});
}
function impact(g,f,t,damage,radius,x,{down=.75,launch=0,direct=false,height=85}={}){
  const floor=g.surfaceAt(t.x,t.y);
  g.effect('fracture',f,{x,y:floor,radius});
  for(const target of g.enemies(f))if(Math.abs(target.x-x)<radius&&Math.abs(target.y-floor)<height)g.hit(f,target,damage,{knock:420,stun:.4,down,launch,direct});
}
function captured(g,f,t){return g.phase==='fight'&&t.capture?.owner===f.id&&t.capture.serial===f.attackSerial;}
function endSlam(g,f,t,damage,x,radius,down=1){
  const floor=g.surfaceAt(t.x,t.y);
  if(captured(g,f,t)){
    t.x=x;t.y=floor;g.hit(f,t,damage,{knock:0,unblockable:true,direct:false});
    if(g.phase==='fight')g.release(t,down);
  }
  g.effect('fracture',f,{x,y:floor,radius});
  for(const target of g.enemies(f))if(target!==t&&Math.abs(target.x-x)<radius&&Math.abs(target.y-floor)<85)g.hit(f,target,damage,{knock:420,stun:.4,down,direct:false});
}

function shield(g,f,slot){
  const aw=f.tier===4,storm=f.character==='kairo';
  cast(g,f,slot,.5,FORMS[f.character][f.tier-1].shield);
  const hp=storm?[42,58,74,100][f.tier-1]:[65,85,110,150][f.tier-1];
  f.shield={type:storm?'storm':'void',hp,max:hp,time:aw?3.1:2.5,stored:0};
  if(storm&&aw)g.effect('shieldBurst',f,{radius:190});
  g.emit('callout',{text:FORMS[f.character][f.tier-1].names[slot].toUpperCase(),color:storm?'#a7fff2':'#c99aff'});
}

// Repeated presses chain three short attacks; none grants armor or restraint.
function comboAttack(g,f,t){
  const kairo=f.character==='kairo',aw=f.tier===4,step=f.comboWindow>0?f.comboStep:0,finish=step===2;
  const duration=finish?.58:.4,reach=kairo?(aw?590:270+(f.tier-1)*65):(aw?390:230+f.tier*25);
  cast(g,f,0,duration,comboClip(f,step,finish));
  f.comboStep=0;f.comboWindow=0;
  g.strike(f,.07,()=>{
    const fromX=f.x,fromY=f.y-65;g.aimDash(f,t,reach,.13);
    const end=f.motion.frames.at(-1);g.effect('dashLine',f,{fromX,fromY,toX:end.x,toY:end.y-65});
    g.watchDash(f,t,()=>{
      g.animate(f,comboClip(f,step,finish),finish?.36:.23,.46);
      g.effect('comboStrike',f,{character:f.character,step,range:150,radius:90+step*25});
      const hit=g.hit(f,t,finish?16:aw?9:11,{knock:finish?520:65,stun:finish?.3:.12,launch:finish&&!kairo?330:0,down:finish&&kairo?.45:0});
      if(hit&&g.phase==='fight'){
        f.comboStep=(step+1)%3;f.comboWindow=1.5;
        g.emit('callout',{text:(finish?'COMBO FINISH':'CHAIN '+(step+1)+' / 3'),color:f.character==='nyra'?'#ffbb73':kairo?'#a7fff2':'#c99aff'});
        if(finish&&!kairo)t.landDown=.55;
        if(aw&&!finish)g.strike(f,.11,()=>{if(!g.inRange(f,t,175,190))return;g.animate(f,comboClip(f,1-step),.18,.46);g.effect(kairo?'stormCross':'shieldBurst',f,{fromX:f.x,fromY:f.y-80,x:t.x,y:t.y-65,radius:115});g.hit(f,t,4,{knock:80,stun:.1});});
      }
    });
  });
}

// The later cast spends its normal cooldown/energy on defense, not retaliation.
function skyIntercept(g,f,t,slot){
  const incoming=t.cast,origin=incoming.origin,attackSlot=incoming.slot,defense=specialMove(f,slot),attack=specialMove(t,attackSlot);
  cast(g,f,slot,1.9,defense.clips[0],true);f.cast.variant='sky-barrier';
  if(slot===4)f.meter=0;
  g.startSkyClash(f,t,{base:attack.damage,origin,attackSlot,defendSlot:slot,attack,defense});
}

function thunderfall(g,f,t){
  const floor=g.surfaceAt(t.x,t.y);
  const aw=f.tier===4,duration=aw?2.5:1.5,impactTime=aw?1.85:1.05;
  cast(g,f,3,duration,FORMS.kairo[f.tier-1].slam,true);
  const x=clamp(t.x,f.x-(aw?700:450),f.x+(aw?700:450)),tx=clamp(x,75,g.width-75),radius=aw?290:150+f.tier*18;
  const route=f.tier===2?[point(.36,tx-100,350),point(.63,tx+100,300),point(.76,tx,350),point(impactTime,tx,floor)]:f.tier===3?[point(.4,tx-100,290),point(.65,tx+100,250),point(.76,tx,300),point(impactTime,tx,floor)]:[point(.42,tx,aw?230:390),point(aw?1.55:.76,tx,aw?230:350),point(impactTime,tx,floor)];
  if(f.tier===3)route.splice(3,1,point(1.25,tx,300),point(duration,tx,floor));
  g.path(f,route,f.tier===3?duration:impactTime);
  g.effect('warning',f,{x:tx,y:floor,radius,delay:impactTime});
  if(aw)g.strike(f,1.2,()=>g.effect('skyCharge',f,{x:tx,y:230,radius:240,duration:.65}));
  if(f.tier===2||f.tier===3){
    const times=f.tier===2?[1.05,1.23]:[.85,1.05,1.25],damage=(24+f.tier*2)/times.length;
    for(const [i,at] of times.entries())g.strike(f,at,()=>{
      g.effect('lightning',f,{x:tx+(f.tier===2?(i?38:-38):(i-1)*75),y:floor,radius:radius*.75});
      impact(g,f,t,damage,radius+40,tx,{down:i===times.length-1?.85:0,height:600,direct:i===times.length-1&&g.inRange(f,t,100,150)});
      if(i===times.length-1)g.animate(f,f.tier===2?'kairo-twinfall':'kairo-arsenal-command',duration-at);
    });return;
  }
  g.strike(f,impactTime,()=>{
    f.y=floor;g.animate(f,'kairo-execution',duration-impactTime);
    g.effect('lightning',f,{x:tx,y:floor,radius});impact(g,f,t,aw?43:24+f.tier*2,radius,tx,{down:aw?1.35:.85,height:600,direct:g.inRange(f,t,100,150)});
    if(aw)for(const offset of [-230,230]){g.effect('lightning',f,{x:tx+offset,y:floor,radius:100});if(Math.abs(t.x-tx-offset)<100)g.hit(f,t,8,{direct:false,knock:180,stun:.2});}
  });
}

function crush(g,f,t){
  const floor=g.surfaceAt(t.x,t.y);
  const aw=f.tier===4,duration=aw?2.65:1.65,end=aw?2.15:1.18,tx=t.x,radius=aw?320:160+f.tier*15;
  cast(g,f,3,duration,FORMS.vex[f.tier-1].slam,true);
  const hover=[535,430,370,230][f.tier-1];
  g.path(f,[point(.6,f.x+(f.tier===2?65:0),hover),point(end-.15,f.x-(f.tier===2?45:0),hover),point(duration,f.x,floor)],duration);
  g.effect('warning',f,{x:tx,y:floor,radius,delay:.4});
  g.strike(f,.4,()=>{
    const inField=Math.abs(t.x-tx)<radius&&Math.abs(t.x-f.x)<(aw?900:650);
    if(!inField)return;
    g.effect('gravityColumn',f,{x:tx,y:floor,radius,duration:end-.4});
    g.hit(f,t,7,{direct:false,knock:0,stun:.12});
    if(g.phase!=='fight')return;
    const prison=f.tier===2?[point(.22,tx-90,380),point(.48,tx+90,320),point(end-.4,tx,floor)]:f.tier===3?[point(.18,tx,290),point(.38,tx,460),point(.55,tx,340),point(end-.4,tx,floor)]:[point(aw?.55:.28,tx,aw?200:390),point(end-.65,tx,aw?200:360),point(end-.4,tx,floor)];
    if(!g.captureTarget(f,t,end-.4+.08,prison,'zero')){
      g.strike(f,end-.4,()=>impact(g,f,t,aw?40:25,radius,tx));return;
    }
  });
  if(f.tier===2||f.tier===3)for(const at of f.tier===2?[.78]:[.65,.9])g.strike(f,at,()=>{
    if(captured(g,f,t)){g.effect('gravityColumn',f,{x:tx,y:floor,radius,duration:.25});g.hit(f,t,4,{knock:0,direct:false,unblockable:true});}
  });
  g.strike(f,end,()=>{
    g.animate(f,'vex-collapse',.45);
    if(captured(g,f,t))endSlam(g,f,t,aw?49:27+f.tier*2-(f.tier===2?4:f.tier===3?8:0),tx,aw?380:220,aw?1.45:.9);
    else g.effect('fracture',f,{x:tx,y:floor,radius});
  });
}

function kairoUltimate(g,f,t){
  const floor=g.surfaceAt(t.x,t.y);
  const aw=f.tier===4,dir=f.facing,start=f.x,tx=clamp(t.x,180,g.width-180);
  const first=f.tier===1,second=f.tier===2,duration=aw?3.8:first?3:4;
  cast(g,f,4,duration,aw?'kairo-judgement':'kairo-storm-draw',true);f.meter=0;
  g.emit('cinematic',{character:f.character,title:FORMS.kairo[f.tier-1].names[4].toUpperCase(),duration});
  if(!aw){
    g.effect('skyCharge',f,{x:f.x,y:f.y-70,radius:100,duration:.65});
    g.strike(f,.65,()=>{g.aimDash(f,t,720,.26);const end=f.motion.frames.at(-1);g.effect('dashLine',f,{fromX:f.x,fromY:f.y-80,toX:end.x,toY:end.y-80});
      g.watchDash(f,t,()=>{
      const guarded=t.guard&&Math.sign(f.x-t.x)===t.facing;
      if(guarded||!g.canControl(t)){g.hit(f,t,first?74:second?92:84,{knock:950,stun:.75,down:1});return;}
      if(!g.hit(f,t,14,{knock:0,stun:.35})||g.phase!=='fight')return;
      const cx=clamp(t.x,160,g.width-160),side=Math.sign(t.x-f.x)||dir;
      const choreography=stormCombo(f.tier,cx,side,floor);
      if(first){
        if(!g.captureTarget(f,t,1.55,choreography.defender,'storm-severance'))return;
        f.facing=side;g.animate(f,'kairo-storm-rise',.65);
        g.path(f,choreography.attacker,choreography.duration,t);
        g.strike(f,.4,()=>{if(!captured(g,f,t))return;g.effect('stormCrescent',f,{fromX:f.x,fromY:f.y-80,x:cx,y:400,radius:150,duration:.45});g.hit(f,t,12,{knock:0,unblockable:true});});
        g.strike(f,.85,()=>{if(!captured(g,f,t))return;g.animate(f,'kairo-storm-finish',.65);g.effect('lightning',f,{x:cx,y:floor,radius:140});g.hit(f,t,10,{knock:0,direct:false,unblockable:true});});
        g.strike(f,1.35,()=>{if(!captured(g,f,t))return;endSlam(g,f,t,38,cx,240,1.1);g.animate(f,'kairo-storm-sheathe',.55);});
        return;
      }
      if(!g.captureTarget(f,t,2.35,choreography.defender,'storm-severance'))return;
      f.facing=side;g.animate(f,'kairo-storm-rise',.75);
      g.path(f,choreography.attacker,choreography.duration,t);
      g.strike(f,.5,()=>{if(!captured(g,f,t))return;g.effect('stormCrescent',f,{fromX:f.x,fromY:f.y-80,x:cx,y:350,radius:220,duration:.55});g.hit(f,t,12,{knock:0,unblockable:true});});
      g.strike(f,1,()=>{if(!captured(g,f,t))return;g.animate(f,f.tier===3?'kairo-arsenal-command':'kairo-storm-spin',.6);g.effect('stormCross',f,{fromX:f.x,fromY:f.y-80,x:cx,y:290,radius:260,duration:.7});g.hit(f,t,16,{knock:0,unblockable:true});});
      if(second)g.strike(f,1.35,()=>{if(!captured(g,f,t))return;g.animate(f,'kairo-storm-spin',.45);g.effect('stormCross',f,{fromX:f.x,fromY:f.y-80,x:cx,y:235,radius:300,duration:.7});g.hit(f,t,8,{knock:0,unblockable:true});});
      g.strike(f,1.55,()=>{if(!captured(g,f,t))return;g.animate(f,'kairo-storm-finish',.9);g.effect('stormBlade',f,{x:cx,y:floor,radius:290,duration:.8});g.hit(f,t,10,{knock:0,direct:false,unblockable:true});});
      g.strike(f,2.1,()=>{if(!captured(g,f,t))return;g.effect('lightning',f,{x:cx,y:floor,radius:270});if(second)for(const offset of [-160,160])g.effect('lightning',f,{x:cx+offset,y:floor,radius:150});endSlam(g,f,t,32,cx,360,1.4);g.animate(f,'kairo-storm-sheathe',.65);});
      });
    });
    return;
  }
  g.path(f,[point(.75,tx-110,220),point(2.5,tx-110,220),point(3.3,tx-110,floor)],3.3);
  g.effect('warning',f,{x:tx,y:floor,radius:250,delay:.8});
  g.strike(f,.8,()=>{
    g.effect('skyCharge',f,{x:tx,y:180,radius:300,duration:1.8});
    if(Math.abs(t.x-tx)<250)g.captureTarget(f,t,1.95,[point(.6,tx,300),point(1.6,tx,300),point(1.86,tx,floor)],'judgement');
  });
  for(const delay of [1.3,1.7,2.1])g.strike(f,delay,()=>{g.effect('lightning',f,{x:tx,y:floor,radius:100});for(const enemy of g.enemies(f))if(Math.abs(enemy.x-tx)<100)g.hit(f,enemy,7,{knock:0,direct:false});});
  g.strike(f,2.65,()=>{
    g.effect('heavenSpear',f,{x:tx,y:floor,radius:340});
    if(captured(g,f,t))endSlam(g,f,t,54,tx,410,1.6);else impact(g,f,t,54,340,tx,{down:1.6,height:600});
  });
}

function vexUltimate(g,f,t){
  const floor=g.surfaceAt(t.x,t.y);
  const aw=f.tier===4,duration=aw?3.8:2.1,tx=clamp(t.x,250,g.width-250),end=aw?3.1:1.6;
  cast(g,f,4,duration,FORMS.vex[f.tier-1].ultimate,true);f.meter=0;
  g.emit('cinematic',{character:f.character,title:FORMS.vex[f.tier-1].names[4].toUpperCase(),duration});
  const hover=[490,400,310,240][f.tier-1];
  g.path(f,[point(.7,f.x,hover),point(end,f.x,hover),point(duration,f.x,floor)],duration);
  g.effect('warning',f,{x:tx,y:floor,radius:aw?440:260,delay:.65});
  g.strike(f,.65,()=>{
    g.effect('blackHole',f,{x:tx,y:350,radius:aw?320:f.tier===3?240:160,duration:end-.65});
    if(Math.abs(t.x-tx)<(aw?440:260)&&Math.abs(t.x-f.x)<(aw?1100:750)){
      const points=aw?[point(.5,tx+140,360),point(1.05,tx-100,270),point(1.55,tx+45,355),point(2.2,tx,350)]:f.tier===2?[point(.25,tx-110,320),point(.5,tx+110,440),point(.75,tx-65,360),point(.9,tx,350)]:f.tier===3?[point(.25,tx,270),point(.5,tx,460),point(.75,tx,310),point(.9,tx,350)]:[point(.45,tx,380),point(.9,tx,350)];
      g.captureTarget(f,t,end-.65+.12,points,'singularity');
    }
  });
  for(const delay of aw?[.9,1.25,1.8,2.4]:[.9,1.25])g.strike(f,delay,()=>{for(const enemy of g.enemies(f))if(Math.abs(enemy.x-tx)<(aw?320:160)&&Math.abs(enemy.y-415)<300)g.hit(f,enemy,aw?6:4,{knock:0,direct:false});});
  g.strike(f,end,()=>{
    g.effect('supernova',f,{x:tx,y:350,radius:aw?500:280});g.effect('fracture',f,{x:tx,y:floor,radius:aw?470:250});
    if(captured(g,f,t)){
      g.hit(f,t,aw?59:46,{knock:0,unblockable:true,direct:false});
      if(g.phase==='fight'){g.release(t);t.vx=Math.sign(t.x-f.x||1)*1100;t.vy=-250;t.stun=1.05;t.landDown=1.5;g.animate(t,'tumble',1.1);}
    }else if(Math.abs(t.x-tx)<(aw?500:280))g.hit(f,t,aw?59:46,{knock:1000,stun:.8,down:1.2,direct:false});
    for(const enemy of g.enemies(f))if(enemy!==t&&Math.abs(enemy.x-tx)<(aw?500:280))g.hit(f,enemy,aw?59:46,{knock:1000,stun:.8,down:1.2,direct:false});
    g.animate(f,'vex-collapse',.6);
  });
}

function solarSkill(g,f,t,slot){
  const floor=g.surfaceAt(t.x,t.y);
  const tier=f.tier,aw=tier===4,profile=slot>=3?specialMove(f,slot):null;
  if(slot===0){
    if(tier!==3)return comboAttack(g,f,t);
    const step=f.comboWindow>0?f.comboStep:0,final=step===2;cast(g,f,0,final?.58:.4,'nyra-sunbolt');f.comboStep=f.comboWindow=0;
    g.strike(f,.15,()=>{const x=clamp(t.x,f.x-450,f.x+450);g.effect('solarBeam',f,{fromX:f.x,fromY:f.y-95,toX:x,toY:t.y-65,radius:final?16:8,duration:.18});if(g.inRange(f,t,460,180)&&g.hit(f,t,final?18:11,{knock:final?420:65,stun:final?.3:.12,down:final?.4:0})){f.comboStep=(step+1)%3;f.comboWindow=1.5;}});return;
  }
  if(slot===2){cast(g,f,slot,.6,'nyra-guard-'+tier);const hp=[65,85,110,145][tier-1];f.shield={type:'storm',hp,max:hp,time:3,stored:0,form:tier};g.effect('solarFlare',f,{radius:70+tier*25,duration:.5});return;}
  const x=clamp(t.x,120,g.width-120);
  if(slot===3){
    const end=[1.05,1.35,1.5,2][tier-1],duration=end+.6;cast(g,f,slot,duration,profile.clips[0],true);
    if(tier===3){
      g.path(f,[point(.5,f.x,490),point(1.5,f.x,490),point(duration,f.x,floor)],duration);
      for(const [i,offset]of [-150,0,150].entries()){g.effect('warning',f,{x:x+offset,y:floor,radius:125,delay:.85+i*.18});g.strike(f,.85+i*.18,()=>{g.effect('solarPillar',f,{x:x+offset,y:floor,radius:100,duration:.65});impact(g,f,t,12,140,x+offset,{height:600,down:.25});});}
      g.strike(f,end,()=>{g.effect('solarFlare',f,{x,y:floor-100,radius:300,duration:.8});impact(g,f,t,24,320,x,{height:600});});return;
    }
    const y=aw?200:tier===2?270:400;
    g.path(f,[point(.4,x-f.facing*100,y),point(end-.3,x+(tier===2?f.facing*100:0),y),point(end,x,floor)],end);
    g.effect('warning',f,{x,y:floor,radius:aw?330:tier===2?260:200,delay:end});
    g.strike(f,end,()=>{g.effect('solarFlare',f,{x,y:floor-70,radius:aw?350:tier===2?260:200,duration:.8});impact(g,f,t,aw?50:tier===2?38:30,aw?350:260,x,{height:600,down:1,direct:g.inRange(f,t,100,150)});});
    if(aw)for(const i of [1,2])g.strike(f,end+i*.18,()=>{g.effect('solarFlare',f,{x:x+(i===1?-210:210),y:floor-70,radius:220,duration:.6});impact(g,f,t,10,220,x+(i===1?-210:210),{height:550,down:.5});});return;
  }
  const duration=[2.4,3.1,2.7,3.4][tier-1];cast(g,f,4,duration,profile.clips[0],true);f.meter=0;
  g.emit('cinematic',{character:'nyra',title:profile.name,duration});
  g.path(f,[point(.55,f.x,[440,310,280,205][tier-1]),point(duration-.5,f.x,[440,310,280,205][tier-1]),point(duration,f.x,floor)],duration);
  const drop=(at,damage,radius,offset=0,big=false)=>{
    const tx=clamp(x+offset,80,g.width-80);g.effect('warning',f,{x:tx,y:floor,radius,delay:at});
    g.strike(f,at-.55,()=>g.effect('meteorFall',f,{x:tx,y:floor,fromX:tx+(offset||-220),fromY:110,radius:big?95:45,duration:.55,celestial:big&&aw,shard:tier===2}));
    g.strike(f,at,()=>{g.effect('meteorBurst',f,{x:tx,y:floor-50,radius,duration:.7,celestial:big&&aw});impact(g,f,t,damage,radius,tx,{height:600,down:big?1:.25});});
  };
  if(tier===1)drop(1.35,62,260,0,true);
  if(tier===2){for(let i=0;i<3;i++)drop(.95+i*.42,18,250,(i-1)*110);drop(2.25,24,340,0,true);}
  if(tier===3){for(let i=0;i<4;i++)g.strike(f,.8+i*.38,()=>{g.animate(f,'nyra-solar-lance',.5);g.effect('solarBeam',f,{fromX:f.x+f.facing*35,fromY:f.y-95,toX:x,toY:floor-40,radius:i===3?48:28,duration:.4});g.effect('solarFlare',f,{x,y:floor-80,radius:180+i*35,duration:.45});impact(g,f,t,i===3?30:16,320,x,{height:600,down:i===3?1:0});});}
  if(aw){for(let i=0;i<6;i++)drop(.85+i*.23,10,230,(i%3-1)*140);drop(2.65,48,480,0,true);}
}

export function castSkill(g,f,t,slot){
  f.facing=Math.sign(t.x-f.x)||f.facing;
  if(f.character==='ronin'){
    if(slot>=3&&t.cast?.aerial&&Math.abs(f.x-t.x)<1100)return skyIntercept(g,f,t,slot);
    return roninSkill(g,f,t,slot);
  }
  if(f.character==='nyra'){
    if((slot===3||slot===4)&&t.cast?.aerial&&Math.abs(f.x-t.x)<1000)return skyIntercept(g,f,t,slot);
    return solarSkill(g,f,t,slot);
  }
  if(slot===2)return shield(g,f,slot);
  if(slot===0)return comboAttack(g,f,t);
  if((slot===3||slot===4)&&t.cast?.aerial){
    const aw=t.tier===4,reach=t.cast.slot===3?(t.character==='kairo'?(aw?1220:650):(aw?900:650)):(t.character==='kairo'?(aw?1440:785):(aw?1100:750));
    if(Math.abs(f.x-t.cast.origin.x)<=reach)return skyIntercept(g,f,t,slot);
  }
  if(slot===3)return f.character==='kairo'?thunderfall(g,f,t):crush(g,f,t);
  if(slot===4)return f.character==='kairo'?kairoUltimate(g,f,t):vexUltimate(g,f,t);
}
