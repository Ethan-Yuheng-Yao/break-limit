import {ENEMIES,ENEMY_THEMES} from './enemies.js';
import {campaignTerrain,groundHeight,surfaceBelow,landingHeight} from './terrain.js';
import {bodyGap} from './locomotion.js';
import {Game,fighter,CHARACTERS,MAX_HEALTH,FLOOR,clamp} from './engine.js';

export const CAMPAIGN_KEY='break-limit.campaign.v1';
export const CAMPAIGNS={
  kairo:{title:'Path of the Storm',difficulty:'STANDARD',factor:1},
  vex:{title:'Into the Abyss',difficulty:'HARD',factor:1.12},
  nyra:{title:'Trial of the Sun',difficulty:'EXPERT',factor:1.4},
  ronin:{title:'The Broken Oath',difficulty:'MASTER',factor:1.55}
};
export function campaignStage(character,index){
  const route=CAMPAIGNS[character],theme=ENEMY_THEMES[character],chapter=Math.floor(index/3),boss=index%3===2;
  return {index,chapter,tier:[1,2,4][chapter],boss,count:boss?1:2+chapter+(index%3),
    title:boss?CHARACTERS[character].name+' · '+CHARACTERS[character].tiers[[1,2,4][chapter]-1]:theme.lands[chapter]+' · '+(index%3+1),
    factor:route.factor,theme:character};
}
export function loadCampaign(storage){
  const result={completed:[],checkpoints:{}};
  try{const data=JSON.parse(storage.getItem(CAMPAIGN_KEY));
    result.completed=Array.isArray(data?.completed)?Object.keys(CAMPAIGNS).filter(c=>data.completed.includes(c)):[];
    for(const c of Object.keys(CAMPAIGNS)){const n=data?.checkpoints?.[c];if(Number.isInteger(n)&&n>=0&&n<=8)result.checkpoints[c]=n;}
  }catch{}return result;
}
export function recordProgress(progress,character,nextStage,complete=false){
  const next={completed:[...progress.completed],checkpoints:{...progress.checkpoints}};
  if(complete){if(!next.completed.includes(character))next.completed.push(character);next.checkpoints[character]=0;}
  else next.checkpoints[character]=clamp(nextStage,0,8);
  return next;
}
export function saveCampaign(storage,progress){try{storage.setItem(CAMPAIGN_KEY,JSON.stringify(progress));return true;}catch{return false;}}
export function isUnlocked(progress,character){return character==='kairo'||character==='vex'||progress.completed.includes(character);}

export class CampaignGame extends Game{
  constructor({character='kairo',campaign=character,progress={completed:[]},stage=0,onEvent=()=>{},random=Math.random}={}){
    character=isUnlocked(progress,character)&&Object.hasOwn(CHARACTERS,character)?character:'kairo';
    super({character,mode:'campaign',onEvent:()=>{},random});this.onEvent=onEvent;
    this.character=character;this.campaign=Object.hasOwn(CAMPAIGNS,campaign)?campaign:'kairo';this.stageIndex=Number.isInteger(stage)?clamp(stage,0,8):0;this.loadStage();
  }
  loadStage(){
    this.stage=campaignStage(this.campaign,this.stageIndex);const s=this.stage;
    this.terrain=campaignTerrain(s);this.width=this.terrain.width;this.cameraX=0;
    this.exitX=this.width-180;this.exitOpen=false;
    this.pending=[];this.projectiles=[];this.clash=null;this.freeze=0;this.roundTime=Infinity;this.round=this.stageIndex+1;this.domain=s.chapter===2;
    const hero=fighter(0,this.character);Object.assign(hero,{x:260,tier:s.tier,maxHp:MAX_HEALTH[s.tier-1],hp:MAX_HEALTH[s.tier-1],meter:s.boss?70:25});
    this.fighters=[hero];
    for(let i=1;i<=s.count;i++){
      const rank=s.boss?s.chapter:s.chapter===0?0:(i-1)%(s.chapter+1),enemyType=s.theme+'-'+rank,def=s.boss?CHARACTERS[this.campaign]:ENEMIES[enemyType],f=fighter(i,s.boss?this.campaign:null);
      if(!s.boss)f.enemyType=enemyType;
      Object.assign(f,{x:s.boss?this.width-600:1100+(i-1)*(this.width-1850)/Math.max(1,s.count-1),awake:false,tier:s.tier,boss:s.boss,name:s.boss?s.title:def.name+' '+i,
        maxHp:s.boss?MAX_HEALTH[s.tier-1]:Math.round((80+s.chapter*27+(s.index%3)*8)*(1+rank*.22)*s.factor),
        damageScale:s.boss?1:(.55+s.chapter*.075+rank*.06)*s.factor,
        aiClock:.5+i*.2,meter:s.boss?55+s.chapter*20:0});
      f.y=this.groundAt(f.x);f.groundY=f.y;f.hp=f.maxHp;this.fighters.push(f);
    }
    this.phase='intro';this.phaseTime=2.2;
    this.emit('announce',{title:s.boss?s.title:'LEVEL '+(s.index+1),subtitle:CAMPAIGNS[this.campaign].title,detail:s.boss?'BOSS '+(s.chapter+1)+' / 3 · '+(s.chapter===0?'Victory evolves your fighter.':s.chapter===1?'Victory awakens your fighter.':'Defeat your awakened rival to complete the campaign.'):s.count+' enemies ahead · Defeat them all, then reach the exit on the right.',duration:2.2});
  }
  groundAt(x){return this.terrain?groundHeight(this.terrain,x):FLOOR;}
  surfaceAt(x,y){return this.terrain?surfaceBelow(this.terrain,x,y):FLOOR;}
  landingAt(f,previousY,nextY){return landingHeight(this.terrain,f.x,previousY,nextY);}
  wake(f){if(f.id&&f.hp>0&&!f.awake){f.awake=true;f.aiClock=Math.max(.35,f.aiClock);this.effect('alert',f,{duration:.8});}}
  hit(attacker,target,base,options={}){
    if(this.phase==='fight'&&target.hp>0&&this.groundAt(target.x)-target.y<=(options.groundHeight??Infinity))this.wake(target);
    return super.hit(attacker,target,base,options);
  }
  action(id,action){
    const f=this.fighters[id];
    if(f&&!f.enemyType&&[0,3,4].includes(action)){
      const targets=this.enemies(f);
      if(!targets.length)return false;
      // A homing cinematic must not transport the challenger across unexplored
      // screens to a sleeping enemy selected with Tab.
      const target=this.enemy(f),reach=f.tier===4?1100:900;
      if(action>=3&&Math.abs(target.x-f.x)>reach){
        if(id===0&&this.phase==='fight'&&!f.lock)this.emit('callout',{text:'MOVE CLOSER TO YOUR TARGET',color:CHARACTERS[f.character].color});
        return false;
      }
    }
    return super.action(id,action);
  }
  finishRound(){
    if(this.phase!=='fight')return;
    for(const f of this.fighters.filter(f=>f.hp<=0&&!f.defeated)){f.defeated=true;this.interrupt(f);f.capture=f.shield=f.shieldReaction=null;f.armor=f.ultimateArmor=0;f.clashMove=null;f.defendingSpecial=false;f.vx=f.vy=0;this.effect('defeat',f,{radius:100});}
    if(this.fighters[0].hp<=0){this.endCampaign(false);return;}
    if(this.fighters.slice(1).some(f=>f.hp>0))return;
    const hero=this.fighters[0];
    if(!this.stage.boss&&!this.exitOpen){this.exitOpen=true;this.emit('announce',{title:'EXIT OPEN',subtitle:'ALL ENEMIES DEFEATED',detail:'Reach the glowing gate on the right to finish this level.',duration:2});}
    if(!this.stage.boss&&(hero.x<this.exitX-35||!this.grounded(hero)||hero.motion||hero.cast))return;
    this.pending=[];this.projectiles=[];this.clash=null;this.phase='roundEnd';this.phaseTime=2.5;
    hero.capture=hero.motion=hero.cast=hero.shield=hero.shieldReaction=hero.dashContact=hero.inputBuffer=null;hero.clashMove=null;hero.defendingSpecial=false;hero.clashReplay=false;hero.clashRotation=0;hero.vx=hero.vy=hero.armor=hero.ultimateArmor=hero.stun=hero.down=hero.lock=hero.skillDelay=hero.dash=hero.attackTime=hero.chainWindow=hero.comboWindow=0;hero.animation=null;hero.pose='idle';hero.guard=false;hero.y=this.surfaceAt(hero.x,hero.y);
    if(this.stage.boss){hero.tier=hero.tier===1?2:4;hero.maxHp=MAX_HEALTH[hero.tier-1];this.effect('transform',hero);}
    hero.hp=hero.maxHp;
    const complete=this.stageIndex===8;
    this.emit('campaignProgress',{character:this.campaign,nextStage:this.stageIndex+1,complete});
    this.emit('campaignStageCleared',{boss:this.stage.boss});
    this.emit('announce',{title:complete?'CAMPAIGN COMPLETE':this.stage.boss?(hero.tier===4?'AWAKENED':'EVOLVED · PHASE '+hero.tier):'LEVEL CLEARED',subtitle:this.stage.title,detail:complete?CHARACTERS[this.campaign].name+' unlocked for Singleplayer and Local.':'FULL HEALTH RESTORED · Progress saved · Next battle incoming.',duration:2.5});
  }
  endCampaign(won){
    for(const f of this.fighters){f.inputBuffer=null;f.chainWindow=0;f.clashReplay=false;f.clashRotation=0;}
    this.phase='matchEnd';this.pending=[];this.clash=null;this.projectiles=[];
    for(const f of this.fighters){f.motion=f.cast=f.capture=f.shieldReaction=null;f.armor=0;f.vx=f.vy=0;}
    this.emit('campaignEnd',{won,character:this.campaign,stage:this.stageIndex});
  }
  prepareRound(){if(this.phase!=='roundEnd')return;if(this.stageIndex===8){this.endCampaign(true);return;}this.stageIndex++;this.loadStage();this.emit('campaignStage');}
  cycleTarget(){const targets=this.enemies(this.fighters[0]),current=this.enemy(this.fighters[0]);if(targets.length)this.fighters[0].targetId=targets[(targets.indexOf(current)+1)%targets.length].id;}
  update(dt,inputs=[{}]){
    if(this.phase==='fight'&&!this.clash&&this.freeze<=0){
      for(const f of this.fighters.slice(1))if(Math.hypot(this.fighters[0].x-f.x,(this.fighters[0].y-f.y)*.7)<(f.boss?620:420))this.wake(f);
      if(this.stage.boss&&this.fighters[1].awake){inputs[1]=this.ai(Math.min(dt,.035)*this.stage.factor*1.2);}
      for(const f of this.fighters.slice(1)){
        if(!f.awake){inputs[f.id]={};continue;}
        if(f.boss){if(this.fighters[0].y<f.y-65&&this.grounded(f)&&!f.lock&&!f.stun)this.action(f.id,'jump');continue;}
        if(f.hp<=0)continue;const hero=this.fighters[0],dist=Math.abs(hero.x-f.x),side=Math.sign(hero.x-f.x)||1;
        const def=ENEMIES[f.enemyType],ranged=def.abilities.includes('bolt'),reach=ranged?310:112;
        // Ease into personal attack range; ranged creatures retreat when crowded.
        const approach=ranged?(dist-reach)/110:Math.max(0,(dist-reach)/75);
        inputs[f.id]={move:side*clamp(approach,-1,1),guard:false};
        const blocked=this.fighters.some(other=>other!==f&&other!==hero&&other.hp>0&&Math.sign(other.x-f.x)===side&&Math.abs(other.x-f.x)<bodyGap(f,other)+25&&Math.abs(other.y-f.y)<100);
        f.flankWait=blocked&&def.shape==='crawler'?(f.flankWait||0)+Math.min(dt,.035):0;
        f.flankCooldown=Math.max(0,(f.flankCooldown||0)-Math.min(dt,.035));
        // A readable hop lets a rear creature take the other side instead of
        // shoving its teammates forever. Attacks wait until it lands.
        if(f.flankWait>.65+f.id*.12&&f.flankCooldown===0&&this.grounded(f)&&!f.lock&&!f.stun&&!f.down){
          f.vy=-950;f.flankTarget=clamp(hero.x+side*(125+f.id*12),80,this.width-80);f.flankCooldown=3.5;f.flankWait=0;
        }
        if(f.flankTarget!==undefined){
          inputs[f.id].move=clamp((f.flankTarget-f.x)/60,-1,1);
          if(this.grounded(f)&&f.vy>=0)f.flankTarget=undefined;
        }
        const ledge=this.terrain.platforms.find(p=>side>0?p.x>f.x&&p.x-f.x<150:p.x+p.width<f.x&&f.x-p.x-p.width<150);
        if(this.grounded(f)&&!f.lock&&!f.stun&&!f.down&&f.flankCooldown===0&&((hero.y<f.y-65&&dist<500)||(ledge&&hero.y<=ledge.y+30))){f.vy=-850;f.flankCooldown=1;}
        f.aiClock-=Math.min(dt,.035);
        if(f.aiClock<=0&&this.grounded(f)&&f.flankTarget===undefined){
          f.aiClock=.6/(this.stage.factor*(1+this.stage.chapter*.15))+this.random()*.3;
          if(def.abilities.length&&f.cooldowns[3]<=0&&dist<850){
            const choices=def.abilities.filter(a=>a!=='pulse'||dist<330);
            if(choices.length)this.action(f.id,choices[Math.floor(this.random()*choices.length)%choices.length]);
            else if(dist<165)this.action(f.id,'bite');
          }else if(dist<(f.boss?185:145))this.action(f.id,'bite');
        }
      }
    }
    super.update(dt,inputs);
    const hero=this.fighters[0],desired=clamp(hero.x-520,0,this.width-1440);
    this.cameraX+=(desired-this.cameraX)*(1-Math.exp(-Math.min(dt,.035)*8));
    for(const f of this.fighters){f.groundY=this.surfaceAt(f.x,f.y);if(!f.motion&&!f.capture&&f.y>this.groundAt(f.x)){f.y=this.groundAt(f.x);f.vy=0;}}
    if(this.phase==='fight'&&this.exitOpen&&hero.x>=this.exitX-35)this.finishRound();
  }
}
