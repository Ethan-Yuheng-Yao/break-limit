// Campaign creatures have their own roster and attacks; never selectable as fighters.
export const ENEMY_THEMES={
 ronin:{color:'#ffb6a0',dark:'#402833',names:['Blade Mite','Razor Wraith','Ironbound Sentinel'],bosses:['Broken Blade','Oath Eater','Iron Monarch'],lands:['Field of Blades','Crimson Citadel','Throne of Steel']},
 kairo:{color:'#9ef9f2',dark:'#163948',names:['Spark Skitter','Storm Ray','Thunder Shell'],bosses:['The Volt Devourer','Tempest Serpent','Crown of Thunder'],lands:['Storm Nest','Shattered Conductors','Eye of the Storm']},
 vex:{color:'#c39aff',dark:'#302044',names:['Rift Maw','Void Seer','Gravity Sentinel'],bosses:['The Watching Hunger','Abyss Leviathan','The Hollow Monolith'],lands:['Rift Depths','Weightless Tomb','Heart of the Abyss']},
 nyra:{color:'#ffbb73',dark:'#54291d',names:['Cinder Scarab','Ember Moth','Furnace Golem'],bosses:['The Cinder Colossus','Ash Wyrm','The Unsetting Phoenix'],lands:['Ash Fields','Molten Sanctum','Crown of the Sun']}
};
export const ENEMIES={};
for(const [theme,t] of Object.entries(ENEMY_THEMES)){
 for(let rank=0;rank<3;rank++)ENEMIES[theme+'-'+rank]={theme,rank,name:t.names[rank],color:t.color,dark:t.dark,speed:[235,205,165][rank],shape:['crawler','wing','brute'][rank],height:[125,145,160][rank],abilities:rank===0?[]:rank===1?['bolt']:['pulse']};
 for(let rank=0;rank<3;rank++)ENEMIES[theme+'-boss-'+rank]={theme,rank,name:t.bosses[rank],color:t.color,dark:t.dark,speed:175+rank*15,shape:['brute','serpent','wing'][rank],height:[205,175,235][rank],abilities:rank===0?['pulse']:rank===1?['bolt','charge']:['pulse','charge','barrage']};
}
export function enemyAttack(g,f,t,action){
 const def=ENEMIES[f.enemyType],basic=action==='bite',slot=basic?0:3;
 if(!basic&&!def.abilities.includes(action)||f.cooldowns[slot]>0||f.skillDelay>0)return false;
 const floor=g.surfaceAt(t.x,t.y);
 const duration=basic?.75:action==='charge'?1.25:action==='barrage'?2:1.25;
 g.startCast(f,slot,duration,!basic&&f.boss);f.cast.aerial=false;f.cast.enemyAction=action;
 f.cooldowns[slot]=basic?.95:f.boss?3.6:4.8;f.facing=Math.sign(t.x-f.x)||f.facing;
 g.animate(f,basic?'enemy-bite':'enemy-'+action,duration);g.emit('sound',{kind:'skill',tier:f.tier});
 const pulse=(x,radius,damage)=>{g.effect('enemyBlast',f,{x,y:floor-65,radius,theme:def.theme,duration:.6});if(Math.abs(t.x-x)<radius)g.hit(f,t,damage,{direct:false,knock:210,stun:.22,groundHeight:action==='pulse'?85:145,groundY:floor});};
 if(basic){
  g.strike(f,.4,()=>{f.facing=Math.sign(t.x-f.x)||f.facing;g.effect('enemySwipe',f,{x:f.x+f.facing*65,y:f.y-65,theme:def.theme,radius:90});if(g.inRange(f,t,f.boss?185:145,100))g.hit(f,t,f.boss?22:16,{knock:125,stun:.18});});
 }else if(action==='charge'){
  g.effect('warning',f,{x:t.x,y:floor,radius:100,delay:.65});
  g.strike(f,.65,()=>{g.aimDash(f,t,620,.35);g.watchDash(f,t,()=>{g.effect('enemySwipe',f,{theme:def.theme,radius:140});g.hit(f,t,27,{knock:560,down:.55});});});
 }else{
  const count=action==='barrage'?3:1,radius=action==='pulse'?230:action==='barrage'?125:95,origin=action==='pulse'?f.x:t.x;
  for(let i=0;i<count;i++){const x=Math.max(70,Math.min(g.width-70,origin+(i-1)*(count>1?180:0))),delay=.75+i*.35;
   g.effect('warning',f,{x,y:floor,radius,delay});
   g.strike(f,delay,()=>pulse(x,radius,action==='pulse'?25:action==='barrage'?18:15));
  }
 }
 return true;
}
