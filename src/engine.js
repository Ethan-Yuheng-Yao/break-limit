import {FORMS} from './forms.js';
import {NYRA_FORMS,specialMove,shieldMove,clashInteraction,moveClip} from './specials.js';
import {clashSequence,samplePath} from './choreography.js';
import {ENEMIES,enemyAttack} from './enemies.js';
import { castSkill } from './moves.js';
import {GRAVITY,JUMP_SPEED,separateBodies} from './locomotion.js';
import {recordCast,castFrame,castImpactTimes,counterBody,incomingBody,bodyLed,comboCastTime} from './cast-playback.js';
export const W = 1440, H = 810, FLOOR = 644;
export const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
export const CHARACTERS = {
  kairo: { name: 'KAIRO', title: 'THE STORMBORN', color: '#9ef9f2', speed: 330,
    tiers: ['STORMBORN', 'STORMBLADE', "HEAVEN’S BLADE", 'RAIJIN KAIRO'],
    skills: ['Flash Cut', null, 'Storm Aegis', 'Thunderfall', 'Storm Severance'],
    awakened: ['Godflash', null, 'Raijin Mantle', 'Thunder God', 'Heaven’s Judgement'],
    hints: ['Rapid 3-step slash combo', '', 'Front shield / repel', 'Armored leap / ground slam', 'Sky launch / storm execution'],
    awakenedHints: ['Rapid cross-dash combo', '', 'Lightning shell / shock pulse', 'Sky ascent / thunder pillars', 'Sky prison / divine spear'] },
  vex: { name: 'VEX', title: 'THE ABYSS', color: '#c39aff', speed: 265,
    tiers: ['ABYSS WALKER', 'VOIDBORN', 'SINGULARITY', 'THE ABYSS'],
    skills: ['Gravity Grasp', null, 'Void Bastion', 'Crush', 'Void Collapse'],
    awakened: ['Event Horizon', null, 'Abyss Carapace', 'Zero', 'End of Everything'],
    hints: ['Rapid gravity fist combo', '', 'Absorb / stored blast', 'Armored lift / crush', 'Gravity well / detonation'],
    awakenedHints: ['Rapid void fist / launcher', '', 'Full dome / stored blast', 'Sky restraint / earth shatter', 'Singularity prison / supernova'] }
};
CHARACTERS.nyra={name:'NYRA',title:'THE SUNFORGED',color:'#ffbb73',speed:350,
  tiers:['EMBERKIN','SUNFORGED','SOLAR SOVEREIGN','PHOENIX NYRA'],
  skills:['Ember Rush',null,'Solar Guard','Phoenix Fall','Solar Requiem'],
  awakened:['Phoenix Rush',null,'Dawn Mantle','Starfall','Daybreak'],
  hints:['Flaming fist chain','','Radiant shield / repel','Flaming dive / eruption','Three solar bursts'],
  awakenedHints:['Blazing fist / launch','','Solar shell / repel','Phoenix dive / firestorm','Four suns / final nova']};
CHARACTERS.ronin={name:'RONIN',title:'THE OATHBLADE',color:'#ffb6a0',speed:315,
 tiers:['IRON WANDERER','CRIMSON DUELIST','BLADE SOVEREIGN','OATHBOUND RONIN'],
 skills:FORMS.ronin[0].names,awakened:FORMS.ronin[3].names,hints:FORMS.ronin[0].hints,awakenedHints:FORMS.ronin[3].hints};
export function fighterDefinition(f){return f.enemyType?ENEMIES[f.enemyType]:CHARACTERS[f.character];}
export const ACTIVE_SKILLS = [0,2,3,4];
export function skillNames(f){return f.character==='nyra'?NYRA_FORMS[f.tier-1].names:FORMS[f.character][f.tier-1].names;}
export function skillHints(f){return f.character==='nyra'?NYRA_FORMS[f.tier-1].hints:FORMS[f.character][f.tier-1].hints;}
export const COOLDOWNS = [.35, 0, 8.5, 10, 0];
export const SKILL_RECOVERY = .4;
export const MAX_HEALTH = Object.freeze([200, 260, 320, 400]);
export function fighter(id, character) {
  return { id, character, x: id ? 1040 : 400, y: FLOOR, vx: 0, vy: 0, facing: id ? -1 : 1,
    hp: MAX_HEALTH[0], maxHp: MAX_HEALTH[0], score: 0, tier: 1, meter: 0, cooldowns: [0,0,0,0,0],
    dashCd: 0, dash: 0, invuln: 0, stun: 0, lock: 0, armor:0, skillDelay:0, down:0, controlGrace:0, moveDir:id?-1:1,
    ultimateArmor:0, shield:null, shieldReaction:null, dashContact:null, clashDefeat:null, recoilAfterArmor:0, motion:null, capture:null, cast:null, guard: false, guardTime: 0,
    chainWindow:0, inputBuffer:null, jumpActive:false, landing:0, gait:0, moveBlend:0,
    comboStep:0, comboWindow:0, attackTime: 0, pose: 'idle', animation:null, attackSerial:0, shieldFlight:0, aiClock: 0.6, lastSkill: -1 };
}
// Kept separate from rendering so the comeback rules can be verified directly.
export function resolveRound(fighters, winnerIndex) {
  const winner = fighters[winnerIndex], loser = fighters[1-winnerIndex];
  winner.score++;
  if (winner.score >= 3) return { matchOver: true, winner: winnerIndex, awakened: [], domain: false };
  const old = fighters.map(f => f.tier);
  loser.tier = Math.min(4, loser.tier + 1);
  winner.hp = Math.min(winner.maxHp, winner.hp + (winner.maxHp-winner.hp)*0.4);
  loser.hp = loser.maxHp;
  fighters.forEach((f,i) => {
    if (fighters[1-i].score === 2) f.tier = 4;
    f.maxHp = MAX_HEALTH[f.tier-1];
    if (f.tier > old[i]) f.hp = f.maxHp;
  });
  return { matchOver: false, winner: winnerIndex, awakened: fighters.filter((f,i)=>f.tier===4&&old[i]<4).map(f=>f.id), domain: fighters.every(f=>f.tier===4) };
}
export class Game {
  constructor({ character = 'kairo', mode = 'ai', preview = false, onEvent = () => {}, random = Math.random, opponent } = {}) {
    this.fighters = [fighter(0,character),fighter(1,opponent|| (character==='kairo'?'vex':'kairo'))];
    this.mode = mode; this.random = random; this.onEvent = onEvent;
    this.floor=FLOOR;this.width=W;
    this.phase = 'intro'; this.phaseTime = 2.5; this.round = 1; this.time = 0; this.roundTime = 90;
    this.clash=null;this.pending = []; this.projectiles = []; this.domain = preview; this.freeze = 0;
    if (preview) {this.round=5;this.fighters.forEach(f=>{ f.tier=4; f.maxHp=MAX_HEALTH[3]; f.hp=f.maxHp; f.score=2; f.meter=100; });}
    this.emit('announce', { title: preview?'DOMAIN COLLISION':'ROUND 01', subtitle: preview?'THE FRACTURED HEAVENS':'THE SILENT TEMPLE', detail: preview?'Both awakened. One final fight.':'First to three. Every loss is an evolution.', duration:2.5 });
  }
  groundAt(x){return this.floor;}
  surfaceAt(x,y){return this.groundAt(x);}
  grounded(f){return Math.abs(f.y-this.surfaceAt(f.x,f.y))<2&&f.vy>=0;}
  landingAt(f,previousY,nextY){return this.groundAt(f.x);}
  emit(type, data = {}) { this.onEvent({type,...data}); }
  schedule(delay, fn) { if(this.phase==='fight')this.pending.push({delay,fn}); }
  animate(f,name,duration,start=0){const total=duration/Math.max(.01,1-start);f.animation={name,elapsed:total*start,duration:total};f.attackTime=duration;}
  strike(f,delay,fn){const serial=f.attackSerial;this.schedule(delay,()=>{if(f.hp>0&&f.attackSerial===serial)fn();});}
  setMoveIntent(id,move){if(move)this.fighters[id].moveDir=Math.sign(move);}
  startCast(f,slot,duration,armored=false){
    f.chainWindow=0;f.inputBuffer=null;f.jumpActive=false;
    if(slot!==0){f.comboStep=0;f.comboWindow=0;}
    f.attackSerial++;f.cast={slot,duration,elapsed:0,aerial:slot===3||slot===4,origin:{x:f.x,y:f.y}};f.lock=duration;f.skillDelay=duration+(slot===0?.1:SKILL_RECOVERY);
    f.armor=armored?duration:0;if(f.character==='kairo'&&slot===4)f.ultimateArmor=duration;f.vx=f.vy=0;f.dash=f.invuln=0;f.pose='skill';f.lastSkill=slot;
    f.cooldowns[slot]=COOLDOWNS[slot]*(f.tier===4?.85:1);
  }
  path(f,frames,duration,target=null){f.motion={frames:[{t:0,x:f.x,y:f.y},...frames],duration,elapsed:0,faceTarget:target?.id};f.vx=f.vy=0;}
  aimDash(f,t,reach,duration){
    f.facing=Math.sign(t.x-f.x)||f.facing;
    const dx=t.x-f.x,dy=t.y-f.y,length=Math.hypot(dx,dy)||1,scale=Math.min(reach,length+65)/length;
    this.path(f,[{t:duration,x:clamp(f.x+dx*scale,60,this.width-60),y:clamp(f.y+dy*scale,190,this.groundAt(f.x+dx*scale))}],duration);
    f.motion.aim={target:t.id,x:f.x,y:f.y,reach};
  }
  watchDash(f,t,onHit){f.dashContact={serial:f.attackSerial,target:t.id,x:f.x,y:f.y,tx:t.x,ty:t.y,onHit};}
  checkDashContact(f){
    const d=f.dashContact;if(!d)return;
    if(d.serial!==f.attackSerial){f.dashContact=null;return;}
    const t=this.fighters[d.target];let entry=0,exit=1;
    // Sweep relative motion through the enemy's body, including between frames.
    for(const [a,b,r] of [[d.x-d.tx,f.x-t.x,65],[d.y-d.ty,f.y-t.y,150]]){
      const delta=b-a;if(Math.abs(delta)<.00001){if(Math.abs(a)>r){entry=2;break;}continue;}
      const u=(-r-a)/delta,v=(r-a)/delta;entry=Math.max(entry,Math.min(u,v));exit=Math.min(exit,Math.max(u,v));
    }
    if(entry<=exit&&entry<=1&&exit>=0){
      f.x=d.x+(f.x-d.x)*entry;f.y=d.y+(f.y-d.y)*entry;f.motion=null;f.vx=f.vy=0;f.dashContact=null;d.onHit();
    }else if(!f.motion)f.dashContact=null;
    else Object.assign(d,{x:f.x,y:f.y,tx:t.x,ty:t.y});
  }
  ccImmune(f){return f.armor>0||f.ultimateArmor>0;}
  canControl(t){return t.hp>0&&!this.ccImmune(t)&&t.invuln<=0&&t.controlGrace<=0&&!t.capture&&!t.shieldReaction&&!(t.shield?.hp>0);}
  defendShield(f,attacker,direct=true){
    if(direct&&attacker.character==='kairo'&&attacker.tier<4&&attacker.cast?.slot===4){
      this.startSkyClash(f,attacker,{base:specialMove(attacker,4).damage,origin:attacker.cast.origin,attackSlot:4,defense:shieldMove(f),shieldDefense:true});return;
    }
    const losing=attacker.tier>f.tier,duration=.9+f.tier*.12;
    f.shieldReaction={attacker:attacker.id,direct,losing,duration,time:duration,dir:Math.sign(f.x-attacker.x)||-f.facing,waiting:f.armor>0};
    if(f.armor<=0)this.startShieldReaction(f);
  }
  startShieldReaction(f){
    const r=f.shieldReaction;r.waiting=false;this.interrupt(f);f.vx=f.vy=0;f.guard=false;f.facing=-r.dir;
    f.lock=f.stun=r.duration;this.animate(f,`${f.character}-defend-${r.losing?'lose':f.tier}`,r.duration);
    this.effect('shieldClash',f,{radius:80+f.tier*32,duration:r.duration,losing:r.losing});
    if(!r.direct)return;
    const attacker=this.fighters[r.attacker];
    this.clash={defender:f.id,attacker:attacker.id,elapsed:0,duration:r.duration,animation:attacker.animation,ultimateProtected:attacker.ultimateArmor>0,vx:attacker.vx,vy:attacker.vy};
    attacker.facing=-f.facing;this.animate(attacker,attacker.cast?.slot>=3?attacker.animation.name:attacker.enemyType?'enemy-clash':attacker.character+'-clash',r.duration);attacker.vx=attacker.vy=0;
    this.emit('callout',{text:'CLASH',color:'#f8edcf'});
  }
  startSkyClash(d,a,{base,origin,attackSlot,defendSlot=3,attack=specialMove(a,attackSlot),defense=specialMove(d,defendSlot),shieldDefense=false}){
    const direct=attack.direct;
    const from={x:a.x,y:a.y},defenderOrigin={x:d.x,y:d.y},attackAnimation=a.animation?{...a.animation}:null;
    const sequence=clashSequence(attack,from,defenderOrigin,origin,FLOOR,this.width),duration=sequence.duration,shield=d.shield;
    const attackStart=a.cast?.elapsed||0;
    const create=onEvent=>{const game=new Game({mode:'local',onEvent,random:()=>.5});game.width=this.width;return game;};
    const attackCast=recordCast(create,attack,origin,defenderOrigin);
    const defenseCast=shieldDefense?null:recordCast(create,defense,defenderOrigin,{x:origin.x,y:FLOOR});
    for(const record of [attackCast,defenseCast])if(record)record.profile.clips=[...new Set([...record.profile.clips,...record.frames.map(frame=>frame.animation.name)])];
    const contact={x:clamp(defenderOrigin.x,210,this.width-210),y:FLOOR*.53};
    if(!sequence.combo){
      const hits=castImpactTimes(attackCast).filter(t=>t>attackStart);
      sequence.beats=hits.map((t,i)=>({t:(t-attackStart)/(attackCast.duration-attackStart)*duration,kind:i===hits.length-1?(attack.direct?'slam':'final'):'shot'}));
      if(!sequence.beats.length)sequence.beats=[{t:duration*.72,kind:'final'}];
    }
    const protectedUlt=[a,d].map(f=>f.ultimateArmor>0);
    for(const f of [a,d]){this.interrupt(f);f.capture=null;f.shieldReaction=null;f.shield=null;f.vx=f.vy=f.dash=f.invuln=0;f.guard=false;f.armor=f.lock=duration;f.skillDelay=duration+.4;}
    a.clashMove=attack;d.clashMove=defense;d.defendingSpecial=true;
    this.animate(d,defense.clips[0],duration);this.animate(a,attackAnimation?.name||attack.clips[0],duration);
    this.clash={kind:'sky',attacker:a.id,defender:d.id,elapsed:0,duration,base,origin,from,defenderOrigin,direct,losing:a.tier>d.tier,barrierY:FLOOR-310,attack,defense,interaction:clashInteraction(attack,defense),protectedUlt,sequence,beatIndex:0,impactPause:0,impactAge:1,shieldDefense,shield};
    Object.assign(this.clash,{attackCast,defenseCast,attackStart,contact,attackTime:attackStart,defenseTime:0});
    a.clashReplay=d.clashReplay=true;a.clashRotation=d.clashRotation=0;
    this.emit('barrierStart');this.emit('callout',{text:defense.name.toUpperCase()+' · INTERCEPT',color:fighterDefinition(d).color});
  }
  updateSkyClash(dt){
    const c=this.clash,a=this.fighters[c.attacker],d=this.fighters[c.defender];
    c.impactAge+=dt;this.time+=dt*.45;
    if(c.impactPause>0){c.impactPause=Math.max(0,c.impactPause-dt);return;}
    c.elapsed=Math.min(c.duration,c.elapsed+dt);
    const p=c.elapsed/c.duration,sequence=c.sequence;
    const ap=samplePath(sequence.attacker,c.elapsed),dp=samplePath(sequence.defender,c.elapsed);
    const recoil=Math.sin(clamp(c.impactAge/.32,0,1)*Math.PI)*(c.losing?32:16);
    a.x=clamp(ap.x-sequence.side*recoil*.3,60,this.width-60);a.y=clamp(ap.y,190,FLOOR);
    d.x=clamp(dp.x+sequence.side*recoil,60,this.width-60);d.y=clamp(dp.y,190,FLOOR);
    a.facing=Math.sign(d.x-a.x)||a.facing;d.facing=-a.facing;
    c.visualBarrierY=sequence.combo?d.y-90:Math.min(d.y-145,FLOOR-220)+(c.losing?p*55:0);
    c.beat=Math.max(0,1-c.impactAge/.36);
    for(const [f,profile] of [[a,c.attack],[d,c.defense]]){const sample=moveClip(profile,clamp(p,0,.98));f.animation={name:sample.name,duration:1,elapsed:sample.progress};}
    if(sequence.clips){
      let i=0;while(i<sequence.clips.length-1&&c.elapsed>=sequence.clips[i+1][0])i++;
      const [at,name]=sequence.clips[i],end=sequence.clips[i+1]?.[0]??c.duration;
      a.animation={name,duration:1,elapsed:clamp((c.elapsed-at)/(end-at),0,.98)};
    }
    d.defenseBeat=c.beat;d.defenseDirection=sequence.combo?'front':'above';d.defenseLosing=c.losing;
    c.attackTime=sequence.combo?comboCastTime(c.attackCast,sequence.beats,c.elapsed,c.attackStart,c.duration):c.attackStart+p*(c.attackCast.duration-c.attackStart);
    const firstImpact=sequence.beats[0]?.t||c.duration*.7;
    const defenseHit=c.defenseCast?.hits[0]||c.defenseCast?.duration*.7;
    c.defenseTime=c.defenseCast?(c.elapsed<=firstImpact?c.elapsed/Math.max(.01,firstImpact)*defenseHit:defenseHit+(c.defenseCast.duration-defenseHit)*(c.elapsed-firstImpact)/Math.max(.01,c.duration-firstImpact)):0;
    if(!sequence.combo){
      c.contact={x:clamp(c.defenderOrigin.x,210,this.width-210),y:FLOOR*.53+(c.losing?Math.max(0,p-.4)*115:0)};c.visualBarrierY=c.contact.y;
      const attackPoseTime=bodyLed(c.attack)?Math.min(c.attackTime,(c.attackCast.hits[0]||c.attackCast.duration)-1/120):c.attackTime;
      const body=incomingBody(c.attackCast,attackPoseTime,c.from,c.contact,FLOOR,c.attackStart);
      a.x=clamp(body.x,60,this.width-60);a.y=clamp(body.y,190,FLOOR);a.animation={...castFrame(c.attackCast,attackPoseTime).animation};
      a.visualCastTime=attackPoseTime;
    }
    if(c.defenseCast){
      const defensePoseTime=bodyLed(c.defense)?Math.min(c.defenseTime,defenseHit-1/120):c.defenseTime;
      d.animation={...castFrame(c.defenseCast,defensePoseTime).animation};
      d.visualCastTime=defensePoseTime;
      const body=counterBody(c.defenseCast,defensePoseTime,c.defenderOrigin,c.contact,FLOOR);
      if(!sequence.combo){d.x=clamp(body.x,60,this.width-60);d.y=clamp(body.y,190,FLOOR);d.clashRotation=body.rotation;}
      else d.clashRotation=0;
    }
    // Playback can cross the opponent after the original sequence position was
    // sampled. Face the final body positions, not the provisional path points.
    if(Math.abs(d.x-a.x)>5){a.facing=Math.sign(d.x-a.x);d.facing=-a.facing;}
    const next=sequence.beats[c.beatIndex];
    if(next&&c.elapsed>=next.t){
      c.beatIndex++;c.impactAge=0;c.impactPause=next.kind==='slam'||next.kind==='final'?.14:.085;c.beat=1;d.defenseBeat=1;
      c.lastBeat=next;if(sequence.combo)c.contact={x:(a.x+d.x)/2,y:c.visualBarrierY};
      this.emit('specialCollision',{attack:c.attack.id,defense:c.defense.id,response:c.interaction.response,kind:next.kind,x:c.contact.x,y:c.contact.y,tier:Math.max(a.tier,d.tier),color:fighterDefinition(a).color,defenseColor:fighterDefinition(d).color,final:c.beatIndex===sequence.beats.length});
      this.emit('sound',{kind:'guard',tier:d.tier});
    }
    if(c.elapsed<c.duration)return;
    this.clash=null;
    for(const [i,f] of [a,d].entries()){f.armor=f.lock=f.stun=0;f.ultimateArmor=c.protectedUlt[i]?.8:0;f.skillDelay=.4;f.animation=null;f.pose='idle';f.clashMove=null;f.defendingSpecial=false;f.defenseBeat=0;f.defenseLosing=false;}
    for(const f of [a,d]){f.clashReplay=false;f.clashRotation=0;}
    if(c.shieldDefense){
      // Shielded hits stay harmless, including the forced movement through the combo.
      this.emit('callout',{text:c.losing?'SHIELD OVERWHELMED':'COMBO COUNTERED',color:fighterDefinition(d).color});
      if(c.losing)this.fling(d,sequence.side);
      else {d.shield=c.shield;d.shield.time=Math.min(d.shield.time,.5);this.animate(d,c.defense.clips[0],.45);d.lock=.45;}
      this.path(a,[{t:.3,x:(a.x+c.origin.x)/2,y:Math.max(190,a.y-130)},{t:.75,x:c.origin.x,y:c.origin.y}],.75);a.lock=.75;a.skillDelay=1.15;this.animate(a,'backflip',.75);return;
    }
    if(c.losing){
      this.emit('callout',{text:'BARRIER BROKEN · 40% POWER',color:fighterDefinition(a).color});
      this.effect('barrierBreak',d,{x:d.x,y:c.barrierY,radius:230});
      this.effect(a.character==='nyra'?'meteorBurst':a.character==='kairo'?'lightning':'gravityColumn',a,{x:d.x,y:d.y,radius:140,duration:.5});
      this.hit(a,d,c.base*.4,{knock:450,stun:.5,down:.7,unblockable:true,bypassShield:true,direct:false});
      if(this.phase!=='fight')return;
      this.path(a,[{t:.5,x:a.x,y:FLOOR}],.5);a.lock=.5;this.animate(a,'jump',.5);
    }else{
      this.emit('callout',{text:'ATTACK STOPPED',color:fighterDefinition(d).color});
      this.effect('shieldBurst',d,{x:d.x,y:c.barrierY,radius:240});
      this.animate(d,c.defense.clips.at(-1),.45);d.lock=.45;d.skillDelay=.55;
      if(d.y<FLOOR||!sequence.combo&&Math.abs(d.x-c.defenderOrigin.x)>.1)this.path(d,[{t:.45,x:c.defenderOrigin.x,y:FLOOR}],.45);
      this.path(a,[{t:.3,x:(a.x+c.origin.x)/2,y:Math.max(190,a.y-100)},{t:.75,x:c.origin.x,y:c.origin.y}],.75);
      a.lock=.75;a.skillDelay=1.15;this.animate(a,'backflip',.75);
    }
  }
  updateClash(dt){
    if(this.clash.kind==='sky'){this.updateSkyClash(dt);return;}
    const c=this.clash,f=this.fighters[c.defender],a=this.fighters[c.attacker];
    c.elapsed+=dt;this.time+=dt*.08;
    // Hold the exact impact first, then let both bodies strain in slow motion.
    const progress=Math.max(0,c.elapsed-.2)/Math.max(.01,c.duration-.2);
    if(f.animation)f.animation.elapsed=f.animation.duration*(.23+progress*.54);
    if(a.animation)a.animation.elapsed=a.animation.duration*(.25+progress*.5);
    if(c.elapsed<c.duration)return;
    this.clash=null;a.animation=c.animation;a.vx=c.vx;a.vy=c.vy;
    if(!f.shieldReaction.losing){
      a.clashDefeat={serial:a.attackSerial,target:f.id};
      if(!c.ultimateProtected){if(a.armor>0)a.recoilAfterArmor=-f.shieldReaction.dir;else this.fling(a,-f.shieldReaction.dir);}
    }
    this.endShieldReaction(f);
  }
  fling(f,dir){
    if(f.ultimateArmor>0)return;
    this.knockDown(f,1);f.vx=dir*(1400+f.tier*150);f.vy=-410;f.landDown=1;f.shieldFlight=.8;
    this.animate(f,'tumble',.6);this.effect('shieldBurst',f,{radius:150+f.tier*30});
  }
  endShieldReaction(f){
    const r=f.shieldReaction;f.shieldReaction=null;f.lock=f.stun=0;
    if(r.losing){
      f.shield=null;this.fling(f,r.dir);
    }else if(f.shield?.hp<=0||f.shield?.time<=0){const shield=f.shield;f.shield=null;if(shield)this.shieldBurst(f,shield);}
  }
  captureTarget(f,t,duration,frames,kind='lift'){
    if(!this.canControl(t))return false;
    this.interrupt(t);t.capture={owner:f.id,serial:f.attackSerial,time:duration,kind};t.guard=false;t.stun=duration;
    this.path(t,frames,duration);this.animate(t,'captive',duration);return true;
  }
  release(t,down=0){t.capture=null;t.motion=null;t.animation=null;t.vx=t.vy=0;t.stun=0;if(down)this.knockDown(t,down);else t.controlGrace=.3;}
  knockDown(t,duration){if(this.ccImmune(t)||t.capture)return;this.interrupt(t);t.down=Math.max(t.down,duration);t.stun=Math.max(t.stun,duration);this.animate(t,'knockdown',duration);}
  interrupt(f){f.clashReplay=false;f.clashRotation=0;f.visualCastTime=0;f.jumpActive=false;f.chainWindow=0;f.inputBuffer=null;f.comboWindow=0;f.comboStep=0;f.attackSerial++;f.cast=null;f.motion=null;f.dashContact=null;f.lock=0;}
  displace(t,vx,stun=.2){if(this.ccImmune(t)||t.capture||t.shieldReaction)return;this.interrupt(t);t.vx=vx;t.stun=Math.max(t.stun,stun);this.animate(t,'hurt',stun);}
  shieldBurst(f,shield){
    if(shield.type!=='void'||shield.stored<=0||this.phase!=='fight')return;
    const t=this.enemy(f);this.effect('shieldBurst',f,{radius:f.tier===4?310:190});
    if(this.inRange(f,t,f.tier===4?310:190,260))this.hit(f,t,Math.min(f.tier===4?30:20,shield.stored*.45),{knock:shield.directContact?650:0,stun:.12,down:shield.directContact&&f.tier===4?.6:0,bypassShield:true,direct:false});
  }
  enemies(f){return this.mode==='campaign'?this.fighters.filter(t=>t.hp>0&&(f.id===0?t.id!==0:t.id===0)):[this.fighters[1-f.id]];}
  enemy(f) { const targets=this.enemies(f);return targets.find(t=>t.id===f.targetId)||targets.sort((a,b)=>Math.abs(a.x-f.x)-Math.abs(b.x-f.x))[0]||this.fighters[f.id===0?1:0]; }
  power(f) { return [1,1.23,1.42,1.68][f.tier-1]*(f.damageScale??1)*(f.character==='nyra'?1.12:1); }
  effect(kind, f, extra = {}) { this.emit('effect',{kind,x:f.x,y:f.y-65,color:fighterDefinition(f).color,tier:f.tier,facing:f.facing,...extra}); }
  hit(attacker, target, base, { knock=180, launch=0, stun=.22, down=0, unblockable=false, bypassShield=false, direct=true, groundHeight=Infinity, groundY=this.groundAt(target.x) } = {}) {
    if (this.phase !== 'fight' || target.hp <= 0 || target.invuln > 0) return false;
    if(groundY-target.y>groundHeight)return false;
    if(this.clash||attacker.clashDefeat?.serial===attacker.attackSerial&&attacker.clashDefeat.target===target.id)return false;
    if(target.shieldReaction?.direct)return false;
    const facingAttack = Math.sign(attacker.x-target.x)===target.facing;
    let raw=base*this.power(attacker);
    const shield=target.shield;
    if(!bypassShield&&shield?.hp>0&&(shield.type==='void'||target.tier===4||facingAttack)){
      if(direct)shield.directContact=true;
      const absorbed=Math.min(shield.hp,raw);shield.hp-=absorbed;shield.stored+=absorbed;raw-=absorbed;
      this.effect('shieldHit',target,{radius:90});this.emit('sound',{kind:'guard'});
      if(!target.shieldReaction)this.defendShield(target,attacker,direct);
      return false;
    }
    const guarded = target.guard && facingAttack && !unblockable;
    if (guarded && target.guardTime < .15) {
      this.displace(attacker,attacker.vx,.32);target.meter=clamp(target.meter+8,0,100);
      this.effect('parry',target); this.emit('callout',{text:'PERFECT GUARD',color:'#e6efc9'}); return false;
    }
    const damage=raw*(guarded?.23:1);
    target.hp=Math.max(0,target.hp-damage);
    if(!guarded&&!attacker.enemyType)attacker.chainWindow=Math.max(.65,attacker.lock+.3);
    target.meter=clamp(target.meter+damage*.85,0,100); attacker.meter=clamp(attacker.meter+damage*(['nyra','ronin'].includes(attacker.character)&&attacker.cast?.slot===4?.22:.62),0,100);
    if(!this.ccImmune(target)&&target.capture&&(knock||launch||down))this.release(target);
    if(!this.ccImmune(target)&&!target.capture){
      target.vx=Math.sign(target.x-attacker.x||attacker.facing)*knock*(guarded?.3:1);target.stun=Math.max(target.stun,guarded?.08:stun);
      if(!guarded&&launch)target.vy=-launch;
      target.pose=guarded?'guard':'hurt';target.attackTime=.24;
      if(!guarded){this.interrupt(target);this.animate(target,'hurt',Math.max(.3,stun));if(down)this.knockDown(target,down);}
    }
    this.effect(guarded?'guard':'impact',target,{color:fighterDefinition(attacker).color,tier:attacker.tier});
    this.emit('damage',{x:target.x,y:target.y-125,value:Math.round(damage),guarded});
    this.emit('sound',{kind:guarded?'guard':'hit',tier:attacker.tier});
    this.freeze=Math.max(this.freeze,guarded?.018:.032+attacker.tier*.008);
    if(target.hp<=0) this.finishRound(attacker.id);
    return true;
  }
  inRange(f,t,range,height=150) { return Math.abs(t.x-f.x)<range && Math.abs(t.y-f.y)<height; }
  releaseJump(id){const f=this.fighters[id];if(f?.jumpActive&&f.vy<-420)f.vy=-420;if(f?.inputBuffer?.action==='jump')f.inputBuffer.released=true;}
  inputAction(id,action){
    if(this.action(id,action))return true;
    const f=this.fighters[id];
    if(this.phase!=='fight'||this.clash||!f||f.hp<=0||f.stun>0||f.down>0||f.capture||f.shieldReaction||f.guard)return false;
    const wait=Math.max(f.lock,f.skillDelay);
    if(wait>0&&wait<=.28)f.inputBuffer={action,time:.3};
    return false;
  }
  action(id, action) {
    const f=this.fighters[id],t=this.enemy(f);
    if(this.clash||this.phase!=='fight'||f.hp<=0||f.stun>0||f.down>0||f.capture||f.shieldReaction||f.guard)return false;
    const movement=action==='dash'||action==='jump',slot=Number(action);
    if(!f.enemyType){
      if(action==='dash'&&f.dashCd>0||action==='jump'&&!this.grounded(f))return false;
      if(!movement&&(!ACTIVE_SKILLS.includes(slot)||f.cooldowns[slot]>0||slot===4&&f.meter<100))return false;
      const confirmed=f.chainWindow>0&&!this.ccImmune(f);
      const cancel=confirmed&&f.cast?.slot===0&&f.cast.elapsed>=.17&&(movement||slot!==0);
      if(f.lock>0&&!cancel)return false;
      if(!movement&&f.skillDelay>0&&!cancel&&!(confirmed&&slot!==f.lastSkill))return false;
      if(cancel){const step=f.comboStep,window=f.comboWindow;this.interrupt(f);f.comboStep=step;f.comboWindow=window;f.animation=null;f.attackTime=0;f.skillDelay=0;}
      f.inputBuffer=null;
    }else if(f.lock>0)return false;
    if(f.enemyType)return enemyAttack(this,f,t,action);
    if(action==='dash'){
      if(f.dashCd>0)return false;
      f.facing=f.moveDir;f.dash=.28;f.invuln=.28;f.dashCd=f.tier===4?1:1.5;f.vx=f.moveDir*[1400,1600,1800,2200][f.tier-1];f.dashOrigin={x:f.x,y:f.y};
      this.animate(f,'dash',.32);this.effect('dashLaunch',f,{character:f.character,radius:65+f.tier*20});this.emit('sound',{kind:'dash'});return true;
    }
    if(action==='jump'){
      if(!this.grounded(f))return false;
      f.vy=-JUMP_SPEED;f.jumpActive=true;f.landing=0;this.animate(f,'jump',.18);this.effect('dust',f);return true;
    }
    f.facing=slot===0&&f.character==='kairo'?f.moveDir:t.x>=f.x?1:-1;
    castSkill(this,f,t,slot);return true;
  }
  finishRound(id) {
    for(const f of this.fighters){f.inputBuffer=null;f.chainWindow=0;f.jumpActive=false;f.landing=0;}
    if(this.phase!=='fight')return;
    this.clash=null;this.phase='roundEnd'; this.phaseTime=3.6; this.pending=[];this.projectiles=[];
    for(const f of this.fighters){f.clashMove=null;f.defendingSpecial=false;f.clashReplay=false;f.clashRotation=0;f.comboStep=f.comboWindow=0;f.shieldFlight=0;f.recoilAfterArmor=0;f.clashDefeat=null;f.capture=f.motion=f.cast=f.shield=f.shieldReaction=f.dashContact=null;f.armor=f.ultimateArmor=0;f.vx=f.vy=0;f.y=FLOOR;}
    const winner=this.fighters[id],loser=this.fighters[1-id];
    this.emit('roundEnd',{winner:id});
    // Defer healing until the knockout has had time to read visually.
    this.roundWinner=id;
    this.emit('announce',{title:`${CHARACTERS[winner.character].name} TAKES THE ROUND`,subtitle:'KNOCKOUT',detail:winner.score===2?'The rivalry is settled.':`${CHARACTERS[loser.character].name} will return stronger.`,duration:3.5});
  }
  prepareRound() {
    for(const f of this.fighters){f.inputBuffer=null;f.chainWindow=0;f.jumpActive=false;f.landing=0;f.gait=0;f.moveBlend=0;}
    const result=resolveRound(this.fighters,this.roundWinner);
    if(result.matchOver){this.phase='matchEnd';this.emit('matchEnd',result);return;}
    this.round++;this.roundTime=90;this.domain=result.domain;
    this.fighters.forEach(f=> {f.x=f.id?1040:400;f.y=FLOOR;f.vx=f.vy=f.stun=f.lock=f.armor=f.ultimateArmor=f.invuln=f.dash=f.down=f.skillDelay=f.controlGrace=0;f.comboStep=f.comboWindow=0;f.recoilAfterArmor=0;f.clashDefeat=null;f.motion=f.capture=f.cast=f.shield=f.shieldReaction=f.dashContact=null;f.landDown=0;f.moveDir=f.id?-1:1;f.guard=false;f.guardTime=0;f.cooldowns=[0,0,0,0,0];f.dashCd=0;f.pose='idle';f.shieldFlight=0;f.attackTime=0;f.meter=Math.min(100,f.meter+15);});
    this.phase='intro';this.phaseTime=result.awakened.length?3.8:2.7;
    this.fighters.forEach(f=>{f.animation=null;f.attackSerial++;});
    result.awakened.forEach(id=>this.effect('transform',this.fighters[id]));
    const evolved=this.fighters[1-this.roundWinner];
    this.emit('announce',{title:result.domain?'DOMAIN COLLISION':result.awakened.length?'AWAKENED':`${CHARACTERS[evolved.character].name} EVOLVES`,subtitle:result.domain?'THE FRACTURED HEAVENS':`ROUND ${String(this.round).padStart(2,'0')} / ${this.fighters[0].score} — ${this.fighters[1].score}`,detail:result.domain?'Two gods. 400 maximum HP each. One final fight.':result.awakened.length?`${CHARACTERS[this.fighters[result.awakened[0]].character].tiers[3]} · 400 maximum HP. Fully healed.`:`${CHARACTERS[evolved.character].name}: ${evolved.maxHp} maximum HP + full heal. Winner recovers 40% of missing HP.`,duration:this.phaseTime});
    this.emit('evolution',result);
  }
  ai(dt) {
    const f=this.fighters[1],t=this.fighters[0],dist=Math.abs(f.x-t.x),r=this.random;
    const input={move:dist>(f.character==='kairo'?115:240)?Math.sign(t.x-f.x):dist<95&&f.character==='vex'?-Math.sign(t.x-f.x):0,guard:false};
    this.setMoveIntent(1,input.move);
    f.aiClock-=dt;
    if(f.aiClock<=0){
      f.aiClock=.23+r()*.4;
      if(t.attackTime>0&&dist<230&&r()<.5) { if(r()<.4)this.action(1,2);else f.aiGuard=.32; }
      else if(f.meter>=100&&r()<.7)this.action(1,4);
      else if(dist<260&&r()<.53){const ready=[0,3].find(slot=>f.cooldowns[slot]===0);if(ready!==undefined)this.action(1,ready);}
      else if(dist>470&&r()<.4)this.action(1,'dash');
      else if(r()<.12)this.action(1,'jump');
      else {const options=[0,2,3];this.action(1,options[Math.floor(r()*options.length)]);}
    }
    f.aiGuard=Math.max(0,(f.aiGuard||0)-dt);input.guard=f.aiGuard>0;return input;
  }
  update(dt,inputs=[{},{}]) {
    if(this.clash){this.updateClash(Math.min(dt,.035));return;}
    dt=Math.min(dt,.035);this.time+=dt;
    if(this.phase==='matchEnd')return;
    if(this.freeze>0){this.freeze-=dt;return;}
    if(this.phase==='intro'||this.phase==='roundEnd'){
      this.phaseTime-=dt;
      if(this.phaseTime<=0){if(this.phase==='roundEnd')this.prepareRound();else{this.phase='fight';this.emit('announce',{title:'FIGHT',subtitle:'BREAK YOUR LIMIT',detail:'',duration:.65});}}
      return;
    }
    this.roundTime-=dt;
    if(this.roundTime<=0){const [a,b]=this.fighters;if(Math.abs(a.hp-b.hp)<.01){this.roundTime=15;this.emit('announce',{title:'SUDDEN DEATH',subtitle:'TIED HEALTH',detail:'15 more seconds.',duration:1.3});}else this.finishRound(a.hp>b.hp?0:1);return;}
    if(this.mode==='ai')inputs=[inputs[0],this.ai(dt)];
    for(const f of this.fighters)f.previousX=f.x;
    for(const f of this.fighters){
      if(f.hp<=0)continue;
      const input=inputs[f.id]||{};this.setMoveIntent(f.id,input.move);
      if(f.animation){f.animation.elapsed+=dt;if(f.animation.elapsed>=f.animation.duration)f.animation=null;}
      if(f.cast){f.cast.elapsed+=dt;if(f.cast.elapsed>=f.cast.duration)f.cast=null;}
      const wasDown=f.down;
      for(const k of ['dashCd','dash','invuln','stun','lock','armor','ultimateArmor','down','skillDelay','controlGrace','attackTime','shieldFlight','comboWindow','chainWindow','landing'])f[k]=Math.max(0,f[k]-dt);
      if(wasDown>0&&f.down===0)f.controlGrace=.4;
      if(f.recoilAfterArmor&&f.armor<=0){const dir=f.recoilAfterArmor;f.recoilAfterArmor=0;this.fling(f,dir);}
      f.cooldowns=f.cooldowns.map(cd=>Math.max(0,cd-dt));
      if(f.shield){f.shield.time-=dt;if(f.shield.time<=0&&!f.shieldReaction){const shield=f.shield;f.shield=null;this.shieldBurst(f,shield);}}
      if(f.shieldReaction){const r=f.shieldReaction;if(r.waiting){if(f.armor<=0)this.startShieldReaction(f);}else{r.time-=dt;if(r.time<=0)this.endShieldReaction(f);}}
      if(this.clash)return;
      if(f.capture){
        f.capture.time-=dt;const owner=this.fighters[f.capture.owner];
        if(f.capture.time<=0||owner.hp<=0||owner.attackSerial!==f.capture.serial)this.release(f);
      }
      if(f.motion){
        if(f.motion.aim){const a=f.motion.aim,t=this.fighters[a.target],dx=t.x-a.x,dy=t.y-a.y,length=Math.hypot(dx,dy)||1,scale=Math.min(a.reach,length+65)/length,last=f.motion.frames.at(-1);last.x=clamp(a.x+dx*scale,60,this.width-60);last.y=clamp(a.y+dy*scale,190,this.groundAt(last.x));f.facing=Math.sign(dx)||f.facing;}
        const m=f.motion;m.elapsed=Math.min(m.duration,m.elapsed+dt);let i=1;
        while(i<m.frames.length-1&&m.elapsed>m.frames[i].t)i++;
        const a=m.frames[i-1],b=m.frames[i],p=clamp((m.elapsed-a.t)/Math.max(.001,b.t-a.t),0,1),ease=p*p*(3-2*p);
        f.x=clamp(a.x+(b.x-a.x)*ease,60,this.width-60);f.y=clamp(a.y+(b.y-a.y)*ease,190,this.surfaceAt(f.x,Math.min(a.y,b.y)));f.vx=f.vy=0;
        if(m.faceTarget!==undefined)f.facing=Math.sign(this.fighters[m.faceTarget].x-f.x)||f.facing;
        if(m.elapsed>=m.duration)f.motion=null;
      }else if(!f.capture&&(!f.shieldReaction||f.shieldReaction.waiting)){
        f.guard=!!input.guard&&f.stun===0&&f.lock===0&&f.down===0&&this.grounded(f);
        f.guardTime=f.guard?f.guardTime+dt:0;
        if(f.stun===0&&f.lock===0&&f.dash===0&&f.down===0){
          f.facing=this.enemy(f).x>=f.x?1:-1;
          const desired=(input.move||0)*fighterDefinition(f).speed*(1+(f.tier-1)*.075)*(f.guard?.3:1)*(f.flankTarget!==undefined?2.2:1);
          f.vx=f.enemyType?f.vx+clamp(desired-f.vx,-1000*dt,1000*dt):desired;
          if(f.attackTime===0)f.pose=f.guard?'guard':Math.abs(f.vx)>10?'run':'idle';
        }
        const wasGrounded=this.grounded(f);
        f.x=clamp(f.x+f.vx*dt,60,this.width-60);
        if(f.dash===0&&(f.stun>0||f.lock>0))f.vx*=Math.exp(-(f.shieldFlight>0?1.2:5)*dt);
        const airborne=!wasGrounded,previousY=f.y,oldGround=this.groundAt(f.previousX);
        f.vy+=GRAVITY*dt*(f.dash>0&&airborne?.18:1);f.y+=f.vy*dt;
        const floor=this.landingAt(f,previousY,f.y);
        if(f.y>=floor||!airborne&&Math.abs(previousY-oldGround)<2){f.y=floor;f.vy=0;if(airborne||f.jumpActive){f.landing=.18;f.jumpActive=false;this.effect('dust',f,{y:floor,radius:45});}if(f.landDown){const duration=f.landDown;f.landDown=0;this.knockDown(f,duration);}}
      }
    }
    for(const f of this.fighters)f.groundY=this.surfaceAt(f.x,f.y);
    if(this.phase!=='fight')return;
    for(const f of this.fighters){this.checkDashContact(f);if(this.phase!=='fight'||this.clash)return;}
    const queued=this.pending;this.pending=[];
    for(let i=0;i<queued.length;i++){const job=queued[i];if(this.phase!=='fight')break;job.delay-=dt;if(job.delay<=0)job.fn();else this.pending.push(job);if(this.clash){this.pending.push(...queued.slice(i+1));return;}}
    if(this.phase!=='fight'){this.pending=[];return;}
    separateBodies(this.fighters,this.width);
    for(const f of this.fighters){
      const travel=Math.min(30,Math.abs(f.x-f.previousX)),walking=f.stun===0&&f.lock===0&&!f.motion&&!f.capture&&this.grounded(f);
      if(walking)f.gait+=travel/(f.enemyType?24:20);
      const speed=walking?Math.min(1,travel/(fighterDefinition(f).speed*dt)):0;
      f.moveBlend+=(speed-f.moveBlend)*(1-Math.exp(-dt*12));
      if(f.inputBuffer){const buffered=f.inputBuffer;buffered.time-=dt;if(buffered.time<=0||f.hp<=0)f.inputBuffer=null;else if(this.action(f.id,buffered.action)&&buffered.released)this.releaseJump(f.id);}
    }
  }
}
