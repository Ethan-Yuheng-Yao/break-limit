import {RONIN_FORMS} from './forms.js';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),point=(t,x,y)=>({t,x,y});
export function roninSkill(g,f,t,slot){
 const tier=f.tier,form=RONIN_FORMS[tier-1],side=Math.sign(t.x-f.x)||f.facing;
 const x=clamp(t.x,200,g.width-200),floor=g.surfaceAt(t.x,t.y);
 const begin=(duration,clip,armor=false)=>{g.startCast(f,slot,duration,armor);g.animate(f,clip,duration);g.emit('sound',{kind:slot===4?'ultimate':'skill',tier});};
 const cut=(at,damage,radius,final=false,variant=0)=>g.strike(f,at,()=>{
  f.facing=Math.sign(x-f.x)||f.facing;
  g.effect(tier===3||tier===4&&final?'steelFall':'steelCut',f,{x,y:floor-65,fromX:f.x,fromY:f.y-65,radius,duration:final?.65:.4,variant,final});
  for(const enemy of g.enemies(f))if(Math.abs(enemy.x-x)<radius&&Math.abs(enemy.y-(floor-70))<450){
   g.hit(f,enemy,damage,{direct:slot===0,knock:final?660:0,stun:final?.4:.16,down:final?.9:0});
  }
  if(final)g.effect('fracture',f,{x,y:floor,radius});
 });
 if(slot===0){
  const step=f.comboWindow>0?f.comboStep:0,final=step===2;
  begin(final?.58:.4,form.combo+step);f.comboStep=f.comboWindow=0;
  g.strike(f,.06,()=>{g.aimDash(f,t,220+tier*40,.11);g.watchDash(f,t,()=>{
   g.animate(f,form.combo+step,final?.35:.23,.46);
   g.effect('steelCut',f,{x:t.x,y:t.y-70,fromX:f.x,fromY:f.y-70,radius:105+tier*12,duration:.35,variant:step});
   if(g.hit(f,t,final?19:12,{knock:final?520:50,stun:final?.3:.12,down:final?.5:0})){f.comboStep=(step+1)%3;f.comboWindow=1.5;}
  });});return;
 }
 if(slot===2){
  begin(.55,form.shield);const hp=[60,82,105,145][tier-1];f.shield={type:'steel',hp,max:hp,time:2.8,stored:0};
  g.effect('steelWard',f,{radius:75+tier*20,duration:.65});return;
 }
 if(slot===3){
  const duration=tier===4?2.45:tier===3?2:1.6;begin(duration,form.slam,true);
  const tx=clamp(x,f.x-700,f.x+700),y=tier===4?210:290;
  g.path(f,[point(.45,tx-side*70,y),point(duration-.5,tx,tier===3?260:y),point(duration,tx,floor)],duration,t);
  g.effect('warning',f,{x:tx,y:floor,radius:180+tier*25,delay:.85});
  const count=tier===1?2:3,total=[32,40,48,66][tier-1];
  for(let i=0;i<count;i++){
   const at=.65+i*(duration-.9)/count,final=i===count-1;
   g.strike(f,at,()=>{
    g.effect(tier===2||tier===1&&!final?'steelCut':'steelFall',f,{x:tx,y:floor,fromX:f.x,fromY:f.y-65,radius:150+tier*30,duration:.5,variant:i,final});
    for(const enemy of g.enemies(f))if(Math.abs(enemy.x-tx)<210+tier*25&&Math.abs(enemy.y-floor)<600)g.hit(f,enemy,total/count,{direct:final&&tier!==3&&g.inRange(f,enemy,140,180),knock:final?420:0,launch:!final&&tier<3?340:0,down:final?.8:0});
    if(final)g.effect('fracture',f,{x:tx,y:floor,radius:220+tier*25});
   });
  }return;
 }
 const count=[3,5,6,7][tier-1],duration=2.2+count*.13,total=[76,88,96,116][tier-1];
 begin(duration,form.ultimate,true);f.meter=0;g.emit('cinematic',{character:'ronin',title:form.names[4],duration});
 g.path(f,[point(.4,x-side*100,350),point(duration-.45,x+side*100,280),point(duration,x+side*80,floor)],duration,t);
 // Contact begins the restraint, while every follow-up still damages armored targets.
 g.strike(f,.5,()=>{if(Math.abs(t.x-x)<260)g.captureTarget(f,t,duration-.6,[point(.35,x,360),point(duration-1,x,330),point(duration-.6,x,floor)],'oath');});
 for(let i=0;i<count;i++){
  const at=.65+i*(duration-1)/count,final=i===count-1;
  if(tier!==3)g.strike(f,at-.08,()=>{g.path(f,[point(.13,x+(i%2?1:-1)*(final?70:135),final?floor:330-i%2*70)],.13,t);g.animate(f,form.combo+i%3,.28);});
  cut(at,total/count,final?300+tier*20:250,final,i);
 }
 g.strike(f,duration-.15,()=>{if(t.capture?.owner===f.id)g.release(t,.8);g.path(f,[point(.15,clamp(x+side*100,60,g.width-60),floor)],.15);g.animate(f,'ronin-sheathe',.5);});
}
