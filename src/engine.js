import { castSkill } from './moves.js';
export const W = 1440, H = 810, FLOOR = 644;
export const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
export const CHARACTERS = {
  kairo: { name: 'KAIRO', title: 'THE STORMBORN', color: '#9ef9f2', speed: 330,
    tiers: ['STORMBORN', 'STORMBLADE', "HEAVEN’S BLADE", 'RAIJIN KAIRO'],
    skills: ['Flash Cut', null, 'Storm Aegis', 'Thunderfall', 'Storm Severance'],
    awakened: ['Godflash', null, 'Raijin Mantle', 'Thunder God', 'Heaven’s Judgement'],
    hints: ['Homing lunge / stagger', '', 'Front shield / repel', 'Armored leap / ground slam', 'Sky launch / storm execution'],
    awakenedHints: ['Five-direction assault / slam', '', 'Lightning shell / shock pulse', 'Sky ascent / thunder pillars', 'Sky prison / divine spear'] },
  vex: { name: 'VEX', title: 'THE ABYSS', color: '#c39aff', speed: 265,
    tiers: ['ABYSS WALKER', 'VOIDBORN', 'SINGULARITY', 'THE ABYSS'],
    skills: ['Gravity Grasp', null, 'Void Bastion', 'Crush', 'Void Collapse'],
    awakened: ['Event Horizon', null, 'Abyss Carapace', 'Zero', 'End of Everything'],
    hints: ['Drag / grab / throw', '', 'Absorb / stored blast', 'Armored lift / crush', 'Gravity well / detonation'],
    awakenedHints: ['Black hole / violent ejection', '', 'Full dome / stored blast', 'Sky restraint / earth shatter', 'Singularity prison / supernova'] }
};
export const ACTIVE_SKILLS = [0,2,3,4];
export const COOLDOWNS = [5.5, 0, 8.5, 10, 0];
export const SKILL_RECOVERY = .4;
export const MAX_HEALTH = Object.freeze([200, 260, 320, 400]);
export function fighter(id, character) {
  return { id, character, x: id ? 1040 : 400, y: FLOOR, vx: 0, vy: 0, facing: id ? -1 : 1,
    hp: MAX_HEALTH[0], maxHp: MAX_HEALTH[0], score: 0, tier: 1, meter: 0, cooldowns: [0,0,0,0,0],
    dashCd: 0, dash: 0, invuln: 0, stun: 0, lock: 0, armor:0, skillDelay:0, down:0, controlGrace:0, moveDir:id?-1:1,
    shield:null, shieldReaction:null, dashContact:null, clashDefeat:null, recoilAfterArmor:0, motion:null, capture:null, cast:null, guard: false, guardTime: 0,
    attackTime: 0, pose: 'idle', animation:null, attackSerial:0, combo: 0, comboWindow: 0, aiClock: 0.6, lastSkill: -1 };
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
  constructor({ character = 'kairo', mode = 'ai', preview = false, onEvent = () => {}, random = Math.random } = {}) {
    this.fighters = [fighter(0,character),fighter(1,character==='kairo'?'vex':'kairo')];
    this.mode = mode; this.random = random; this.onEvent = onEvent;
    this.floor=FLOOR;this.width=W;
    this.phase = 'intro'; this.phaseTime = 2.5; this.round = 1; this.time = 0; this.roundTime = 90;
    this.clash=null;this.pending = []; this.projectiles = []; this.domain = preview; this.freeze = 0;
    if (preview) {this.round=5;this.fighters.forEach(f=>{ f.tier=4; f.maxHp=MAX_HEALTH[3]; f.hp=f.maxHp; f.score=2; f.meter=100; });}
    this.emit('announce', { title: preview?'DOMAIN COLLISION':'ROUND 01', subtitle: preview?'THE FRACTURED HEAVENS':'THE SILENT TEMPLE', detail: preview?'Both awakened. One final fight.':'First to three. Every loss is an evolution.', duration:2.5 });
  }
  emit(type, data = {}) { this.onEvent({type,...data}); }
  schedule(delay, fn) { if(this.phase==='fight')this.pending.push({delay,fn}); }
  animate(f,name,duration){f.animation={name,elapsed:0,duration};f.attackTime=duration;}
  strike(f,delay,fn){const serial=f.attackSerial;this.schedule(delay,()=>{if(f.hp>0&&f.attackSerial===serial)fn();});}
  setMoveIntent(id,move){if(move)this.fighters[id].moveDir=Math.sign(move);}
  startCast(f,slot,duration,armored=false){
    f.attackSerial++;f.cast={slot,duration,elapsed:0};f.lock=duration;f.skillDelay=duration+SKILL_RECOVERY;
    f.armor=armored?duration:0;f.vx=f.vy=0;f.dash=f.invuln=0;f.pose='skill';f.lastSkill=slot;
    f.cooldowns[slot]=COOLDOWNS[slot]*(f.tier===4?.85:1);
  }
  path(f,frames,duration){f.motion={frames:[{t:0,x:f.x,y:f.y},...frames],duration,elapsed:0};f.vx=f.vy=0;}
  aimDash(f,t,reach,duration){
    f.facing=Math.sign(t.x-f.x)||f.facing;
    this.path(f,[{t:duration,x:t.x,y:t.y}],duration);
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
  canControl(t){return t.hp>0&&t.armor<=0&&t.invuln<=0&&t.controlGrace<=0&&!t.capture&&!t.shieldReaction&&!(t.shield?.hp>0);}
  defendShield(f,attacker){
    const losing=attacker.tier>f.tier,duration=.9+f.tier*.12;
    f.shieldReaction={attacker:attacker.id,losing,duration,time:duration,dir:Math.sign(f.x-attacker.x)||-f.facing,waiting:f.armor>0};
    if(f.armor<=0)this.startShieldReaction(f);
  }
  startShieldReaction(f){
    const r=f.shieldReaction;r.waiting=false;this.interrupt(f);f.vx=f.vy=0;f.guard=false;f.facing=-r.dir;
    f.lock=f.stun=r.duration;this.animate(f,`${f.character}-defend-${r.losing?'lose':f.tier}`,r.duration);
    this.effect('shieldClash',f,{radius:80+f.tier*32,duration:r.duration,losing:r.losing});
    const attacker=this.fighters[r.attacker];
    this.clash={defender:f.id,attacker:attacker.id,elapsed:0,duration:r.duration,animation:attacker.animation,vx:attacker.vx,vy:attacker.vy};
    attacker.facing=-f.facing;this.animate(attacker,attacker.character+'-clash',r.duration);attacker.vx=attacker.vy=0;
    this.emit('callout',{text:'CLASH',color:'#f8edcf'});
  }
  updateClash(dt){
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
      if(a.armor>0)a.recoilAfterArmor=-f.shieldReaction.dir;
      else this.fling(a,-f.shieldReaction.dir);
    }
    this.endShieldReaction(f);
  }
  fling(f,dir){
    this.knockDown(f,1);f.vx=dir*(650+f.tier*50);f.vy=-310;f.landDown=1;
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
  knockDown(t,duration){if(t.armor>0||t.capture)return;this.interrupt(t);t.down=Math.max(t.down,duration);t.stun=Math.max(t.stun,duration);this.animate(t,'knockdown',duration);}
  interrupt(f){f.attackSerial++;f.cast=null;f.motion=null;f.dashContact=null;f.lock=0;}
  displace(t,vx,stun=.2){if(t.armor>0||t.capture||t.shieldReaction)return;this.interrupt(t);t.vx=vx;t.stun=Math.max(t.stun,stun);this.animate(t,'hurt',stun);}
  shieldBurst(f,shield){
    if(shield.type!=='void'||shield.stored<=0||this.phase!=='fight')return;
    const t=this.enemy(f);this.effect('shieldBurst',f,{radius:f.tier===4?310:190});
    if(this.inRange(f,t,f.tier===4?310:190,260))this.hit(f,t,Math.min(f.tier===4?30:20,shield.stored*.45),{knock:650,stun:.45,down:f.tier===4?.6:0,bypassShield:true});
  }
  enemy(f) { return this.fighters[1-f.id]; }
  power(f) { return [1,1.23,1.42,1.68][f.tier-1]; }
  effect(kind, f, extra = {}) { this.emit('effect',{kind,x:f.x,y:f.y-65,color:CHARACTERS[f.character].color,tier:f.tier,facing:f.facing,...extra}); }
  hit(attacker, target, base, { knock=180, launch=0, stun=.22, down=0, unblockable=false, bypassShield=false } = {}) {
    if (this.phase !== 'fight' || target.hp <= 0 || target.invuln > 0) return false;
    if(this.clash||attacker.clashDefeat?.serial===attacker.attackSerial&&attacker.clashDefeat.target===target.id)return false;
    if(target.shieldReaction)return false;
    const facingAttack = Math.sign(attacker.x-target.x)===target.facing;
    let raw=base*this.power(attacker);
    const shield=target.shield;
    if(!bypassShield&&shield?.hp>0&&(shield.type==='void'||target.tier===4||facingAttack)){
      const absorbed=Math.min(shield.hp,raw);shield.hp-=absorbed;shield.stored+=absorbed;raw-=absorbed;
      this.effect('shieldHit',target,{radius:90});this.emit('sound',{kind:'guard'});
      this.defendShield(target,attacker);
      return false;
    }
    const guarded = target.guard && facingAttack && !unblockable;
    if (guarded && target.guardTime < .15) {
      this.displace(attacker,attacker.vx,.32);target.meter=clamp(target.meter+8,0,100);
      this.effect('parry',target); this.emit('callout',{text:'PERFECT GUARD',color:'#e6efc9'}); return false;
    }
    const damage=raw*(guarded?.23:1);
    target.hp=Math.max(0,target.hp-damage);
    target.meter=clamp(target.meter+damage*.85,0,100); attacker.meter=clamp(attacker.meter+damage*.62,0,100);
    if(target.armor<=0&&!target.capture){
      target.vx=Math.sign(target.x-attacker.x||attacker.facing)*knock*(guarded?.3:1);target.stun=Math.max(target.stun,guarded?.08:stun);
      if(!guarded&&launch)target.vy=-launch;
      target.pose=guarded?'guard':'hurt';target.attackTime=.24;
      if(!guarded){this.interrupt(target);this.animate(target,'hurt',Math.max(.3,stun));if(down)this.knockDown(target,down);}
    }
    this.effect(guarded?'guard':'impact',target,{color:CHARACTERS[attacker.character].color,tier:attacker.tier});
    this.emit('damage',{x:target.x,y:target.y-125,value:Math.round(damage),guarded});
    this.emit('sound',{kind:guarded?'guard':'hit',tier:attacker.tier});
    this.freeze=Math.max(this.freeze,guarded?.018:.032+attacker.tier*.008);
    if(target.hp<=0) this.finishRound(attacker.id);
    return true;
  }
  inRange(f,t,range,height=150) { return Math.abs(t.x-f.x)<range && Math.abs(t.y-f.y)<height; }
  action(id, action) {
    const f=this.fighters[id],t=this.enemy(f);
    if(this.clash||this.phase!=='fight'||f.hp<=0||f.stun>0||f.down>0||f.capture||f.shieldReaction||f.lock>0||f.guard)return false;
    if(action==='dash'){
      if(f.dashCd>0)return false;
      f.facing=f.moveDir;f.dash=.18;f.invuln=.2;f.dashCd=f.tier===4?1:1.5;f.vx=f.moveDir*(f.tier===4?1450:1000);
      this.animate(f,'dash',.28);this.effect('dash',f);this.emit('sound',{kind:'dash'});return true;
    }
    if(action==='jump'){
      if(f.y<FLOOR-1)return false;
      f.vy=-660;this.animate(f,'jump',.4);this.effect('dust',f);return true;
    }
    if(action==='attack'){
      f.facing=t.x>=f.x?1:-1;f.attackSerial++;f.combo=f.comboWindow>0?(f.combo+1)%4:0;f.comboWindow=1.15;
      f.lock=f.character==='kairo'?.42:.52;f.pose='attack';f.vx=f.facing*95;
      this.animate(f,f.character+'-basic'+f.combo,f.lock);
      const range=f.character==='kairo'?145:125;
      this.strike(f,f.lock*.46,()=>{
        f.vx=f.facing*(f.combo===3?280:160);this.effect('slash',f,{range});this.emit('sound',{kind:'swing'});
        if(this.inRange(f,t,range))this.hit(f,t,(f.character==='kairo'?8:11)+(f.combo===3?5:0),{knock:f.combo===3?560:110,stun:f.combo===3?.45:.2,down:f.combo===3?.55:0});
      });return true;
    }
    const slot=Number(action);
    if(!ACTIVE_SKILLS.includes(slot)||f.cooldowns[slot]>0||f.skillDelay>0||slot===4&&f.meter<100)return false;
    f.facing=slot===0&&f.character==='kairo'?f.moveDir:t.x>=f.x?1:-1;
    castSkill(this,f,t,slot);return true;
  }
  finishRound(id) {
    if(this.phase!=='fight')return;
    this.clash=null;this.phase='roundEnd'; this.phaseTime=3.6; this.pending=[];this.projectiles=[];
    for(const f of this.fighters){f.recoilAfterArmor=0;f.clashDefeat=null;f.capture=f.motion=f.cast=f.shield=f.shieldReaction=f.dashContact=null;f.armor=0;f.vx=f.vy=0;f.y=FLOOR;}
    const winner=this.fighters[id],loser=this.fighters[1-id];
    this.emit('roundEnd',{winner:id});
    // Defer healing until the knockout has had time to read visually.
    this.roundWinner=id;
    this.emit('announce',{title:`${CHARACTERS[winner.character].name} TAKES THE ROUND`,subtitle:'KNOCKOUT',detail:winner.score===2?'The rivalry is settled.':`${CHARACTERS[loser.character].name} will return stronger.`,duration:3.5});
  }
  prepareRound() {
    const result=resolveRound(this.fighters,this.roundWinner);
    if(result.matchOver){this.phase='matchEnd';this.emit('matchEnd',result);return;}
    this.round++;this.roundTime=90;this.domain=result.domain;
    this.fighters.forEach(f=> {f.x=f.id?1040:400;f.y=FLOOR;f.vx=f.vy=f.stun=f.lock=f.armor=f.invuln=f.dash=f.down=f.skillDelay=f.controlGrace=0;f.recoilAfterArmor=0;f.clashDefeat=null;f.motion=f.capture=f.cast=f.shield=f.shieldReaction=f.dashContact=null;f.landDown=0;f.moveDir=f.id?-1:1;f.guard=false;f.guardTime=0;f.cooldowns=[0,0,0,0,0];f.dashCd=0;f.pose='idle';f.comboWindow=0;f.attackTime=0;f.meter=Math.min(100,f.meter+15);});
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
      else if(dist<145&&r()<.53)this.action(1,'attack');
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
    for(const f of this.fighters){
      const input=inputs[f.id]||{};this.setMoveIntent(f.id,input.move);
      if(f.animation){f.animation.elapsed+=dt;if(f.animation.elapsed>=f.animation.duration)f.animation=null;}
      if(f.cast){f.cast.elapsed+=dt;if(f.cast.elapsed>=f.cast.duration)f.cast=null;}
      const wasDown=f.down;
      for(const k of ['dashCd','dash','invuln','stun','lock','armor','down','skillDelay','controlGrace','attackTime','comboWindow'])f[k]=Math.max(0,f[k]-dt);
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
        if(f.motion.aim){const a=f.motion.aim,t=this.fighters[a.target],dx=t.x-a.x,dy=t.y-a.y,length=Math.hypot(dx,dy)||1,scale=Math.min(a.reach,length+65)/length,last=f.motion.frames.at(-1);last.x=clamp(a.x+dx*scale,60,W-60);last.y=clamp(a.y+dy*scale,190,FLOOR);f.facing=Math.sign(dx)||f.facing;}
        const m=f.motion;m.elapsed=Math.min(m.duration,m.elapsed+dt);let i=1;
        while(i<m.frames.length-1&&m.elapsed>m.frames[i].t)i++;
        const a=m.frames[i-1],b=m.frames[i],p=clamp((m.elapsed-a.t)/Math.max(.001,b.t-a.t),0,1),ease=p*p*(3-2*p);
        f.x=clamp(a.x+(b.x-a.x)*ease,60,W-60);f.y=clamp(a.y+(b.y-a.y)*ease,190,FLOOR);f.vx=f.vy=0;
        if(m.elapsed>=m.duration)f.motion=null;
      }else if(!f.capture&&(!f.shieldReaction||f.shieldReaction.waiting)){
        f.guard=!!input.guard&&f.stun===0&&f.lock===0&&f.down===0&&f.y>=FLOOR-2;
        f.guardTime=f.guard?f.guardTime+dt:0;
        if(f.stun===0&&f.lock===0&&f.dash===0&&f.down===0){
          f.facing=this.enemy(f).x>=f.x?1:-1;
          f.vx=(input.move||0)*CHARACTERS[f.character].speed*(1+(f.tier-1)*.075)*(f.guard?.3:1);
          if(f.attackTime===0)f.pose=f.guard?'guard':Math.abs(f.vx)>10?'run':'idle';
        }
        f.x=clamp(f.x+f.vx*dt,60,W-60);
        if(f.dash===0&&(f.stun>0||f.lock>0))f.vx*=Math.exp(-5*dt);
        f.vy+=1700*dt;f.y+=f.vy*dt;
        if(f.y>=FLOOR){f.y=FLOOR;f.vy=0;if(f.landDown){const duration=f.landDown;f.landDown=0;this.knockDown(f,duration);}}
      }
    }
    if(this.phase!=='fight')return;
    for(const f of this.fighters){this.checkDashContact(f);if(this.phase!=='fight'||this.clash)return;}
    const queued=this.pending;this.pending=[];
    for(let i=0;i<queued.length;i++){const job=queued[i];if(this.phase!=='fight')break;job.delay-=dt;if(job.delay<=0)job.fn();else this.pending.push(job);if(this.clash){this.pending.push(...queued.slice(i+1));return;}}
    if(this.phase!=='fight'){this.pending=[];return;}
    const [a,b]=this.fighters,gap=b.x-a.x;
    if(Math.abs(gap)<62&&Math.abs(a.y-b.y)<100&&a.dash<=0&&b.dash<=0&&!a.motion&&!b.motion&&!a.capture&&!b.capture&&!a.shieldReaction&&!b.shieldReaction){
      const push=62-Math.abs(gap),dir=gap>=0?1:-1;
      if(a.armor>0&&b.armor<=0)b.x=clamp(b.x+push*dir,60,W-60);
      else if(b.armor>0&&a.armor<=0)a.x=clamp(a.x-push*dir,60,W-60);
      else if(a.armor<=0&&b.armor<=0){a.x=clamp(a.x-push*dir/2,60,W-60);b.x=clamp(b.x+push*dir/2,60,W-60);}
    }
  }
}
