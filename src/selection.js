import {CHARACTERS,MAX_HEALTH,ACTIVE_SKILLS,skillNames,skillHints,fighter} from './engine.js';
import {CAMPAIGNS,isUnlocked} from './campaign.js';
import {drawFighter} from './render.js';
import {ENEMY_THEMES} from './enemies.js';
const profiles={
 kairo:{role:'LIGHTNING / RUSHDOWN',description:'Close the distance in a flash. Turn quick sword cuts into sky-splitting lightning.'},
 vex:{role:'GRAVITY / CONTROL',description:'Control the space around you. Lift, imprison, and crush opponents with the weight of the void.'},
 nyra:{role:'SOLAR / AREA ATTACKS',description:'Set the arena ablaze. Command fire, falling meteors, and the wings of a phoenix.'},
 ronin:{role:'SWORD / PRECISION',description:'Master the blade. Chain precise cuts, brace behind steel, and finish with a colossal cleave.'}
};
const roman=['I','II','III','IV'];
export function selectionSummary({mode,selected,opponent,fighter:challenger,progress,slot='hero',tier=1}){
 const campaign=mode==='campaign',focus=campaign||slot==='hero'?selected:opponent,def=CHARACTERS[focus];
 const locked=!isUnlocked(progress,focus),checkpoint=progress.checkpoints?.[selected]||0,complete=progress.completed.includes(selected);
 return {campaign,focus,def,locked,checkpoint,complete,tier,
  ready:campaign?isUnlocked(progress,challenger):isUnlocked(progress,selected)&&isUnlocked(progress,opponent),
  moves:ACTIVE_SKILLS.map((id,i)=>({id,label:['ATTACK','GUARD SKILL','SPECIAL','ULTIMATE'][i],name:skillNames({character:focus,tier})[id],hint:skillHints({character:focus,tier})[id]}))};
}
export function drawSelectionPortrait(canvas,character,tier=1,mini=false){
 const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height,color=CHARACTERS[character].color;
 c.clearRect(0,0,w,h);c.lineJoin='round';c.lineCap='round';
 const aura=c.createRadialGradient(w*.58,h*.43,5,w*.58,h*.43,w*.55);aura.addColorStop(0,color+'26');aura.addColorStop(1,'transparent');c.fillStyle=aura;c.fillRect(0,0,w,h);
 if(!mini){
  c.save();c.translate(w*.57,h*.43);c.strokeStyle=color+'1c';c.lineWidth=1;
  for(const r of [120,155,210]){c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.stroke();}
  for(let i=0;i<12;i++){const a=i*Math.PI/6;c.beginPath();c.moveTo(Math.cos(a)*146,Math.sin(a)*146);c.lineTo(Math.cos(a)*165,Math.sin(a)*165);c.stroke();}c.restore();
  c.save();c.translate(w*.57,h*.83);c.scale(1,.16);const floor=c.createRadialGradient(0,0,10,0,0,145);floor.addColorStop(0,color+'44');floor.addColorStop(1,'transparent');c.fillStyle=floor;c.fillRect(-150,-150,300,300);c.restore();
 }
 const f={...fighter(0,character),x:0,y:0,tier,facing:1,pose:'idle'};
 c.save();c.translate(mini?w*.55:w*.65,mini?h*1.06:h*.79);const scale=mini?h/163:Math.min(w/240,h/250);c.scale(scale,scale);drawFighter(c,f,.35,{portrait:true});c.restore();
}
export function renderSelection(state,handlers){
 const $=s=>document.querySelector(s),m=selectionSummary(state),{mode,selected,opponent,progress,tier,slot}=state;
 $('#menu').dataset.mode=mode;$('#menu').style.setProperty('--selection-color',m.def.color);
 $('#selection-mode').textContent=m.campaign?'STORY / UNLOCK NEW FIGHTERS':mode==='local'?'SIDE BY SIDE / ONE KEYBOARD':'SOLO / TAKE ON THE CPU';
 $('#selection-title').textContent=m.campaign?'Choose your path.':slot==='opponent'?(mode==='local'?'Player 2. Your turn.':'Choose your rival.'):(mode==='local'?'Player 1. Your turn.':'Choose your fighter.');
 document.querySelectorAll('[data-selection-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.selectionMode===mode)));
 $('#selection-targets').hidden=m.campaign;
 $('#selection-targets').innerHTML=[['hero',selected,mode==='local'?'PLAYER 1':'YOU'],['opponent',opponent,mode==='local'?'PLAYER 2':'CPU RIVAL']].map(([target,id,label],i)=>`<button class="selection-seat ${slot===target?'active':''}" data-seat="${target}" aria-pressed="${slot===target}" style="--seat-color:${CHARACTERS[id].color}"><span class="seat-label">${label}</span><strong>${CHARACTERS[id].name}</strong><span class="seat-detail">${!isUnlocked(progress,id)?'LOCKED':slot===target?'CHOOSING…':'CHANGE FIGHTER'}</span><span class="seat-number" aria-hidden="true">0${i+1}</span></button>`).join('<span class="versus" aria-hidden="true">VS</span>');
 document.querySelectorAll('[data-seat]').forEach(b=>b.onclick=()=>handlers.seat(b.dataset.seat));
 $('#roster-label').textContent=m.campaign?'CAMPAIGN ROUTES':'THE ROSTER';$('#roster').setAttribute('aria-label',m.campaign?'Choose a campaign route':`Choose ${slot==='hero'?'your':mode==='local'?'Player 2’s':'the CPU’s'} fighter`);
 $('#roster').innerHTML=Object.entries(CHARACTERS).map(([id,def],index)=>{
  const owned=isUnlocked(progress,id),active=m.focus===id;
  return `<button class="roster-fighter ${active?'selected':''} ${owned?'':'locked'}" data-character="${id}" aria-pressed="${active}" aria-label="${def.name}, ${m.campaign?CAMPAIGNS[id].difficulty:owned?'unlocked':'locked'}" style="--card-color:${def.color}"><canvas width="160" height="150" id="portrait-${id}" aria-hidden="true"></canvas><span class="roster-copy"><small>${m.campaign?CAMPAIGNS[id].difficulty:profiles[id].role.split(' / ')[0]}</small><strong>${def.name}</strong><span>${m.campaign?(progress.completed.includes(id)?'CLEARED':CAMPAIGNS[id].title):owned?'AVAILABLE':'LOCKED · VIEW TO UNLOCK'}</span></span><span class="roster-mark" aria-hidden="true">${active?'◈':String(index+1).padStart(2,'0')}</span></button>`;
 }).join('');
 for(const id of Object.keys(CHARACTERS))drawSelectionPortrait($('#portrait-'+id),id,1,true);
 document.querySelectorAll('[data-character]').forEach(b=>b.onclick=()=>handlers.pick(b.dataset.character));
 $('#fighter-archetype').textContent=profiles[m.focus].role;$('#fighter-access').textContent=m.locked?'LOCKED FIGHTER':'UNLOCKED';$('#fighter-access').className=m.locked?'access-locked':'';
 $('#selection-portrait').setAttribute('aria-label',`${m.def.name}, ${m.def.tiers[tier-1]}`);drawSelectionPortrait($('#selection-portrait'),m.focus,tier);
 $('#fighter-title').textContent=m.def.title;$('#fighter-name').textContent=m.def.name;$('#fighter-description').textContent=profiles[m.focus].description;$('#fighter-index').textContent=String(Object.keys(CHARACTERS).indexOf(m.focus)+1).padStart(2,'0');
 $('#form-selector').innerHTML=roman.map((r,i)=>`<button data-form="${i+1}" aria-pressed="${tier===i+1}" aria-label="Preview phase ${r}${i===3?', awakened':''}">${r}${i===3?'<span>AWAKENED</span>':''}</button>`).join('');
 document.querySelectorAll('[data-form]').forEach(b=>b.onclick=()=>handlers.form(Number(b.dataset.form)));
 $('#form-name').textContent=m.def.tiers[tier-1];$('#form-health').textContent=MAX_HEALTH[tier-1]+' HP';
 $('#move-list').innerHTML=m.moves.map((move,i)=>`<div class="move-entry ${i===3?'ultimate-entry':''}"><span class="move-icon" aria-hidden="true">${['╱','◇','↑','✦'][i]}</span><div><small>${move.label}</small><strong>${move.name}</strong><p>${move.hint}</p></div></div>`).join('');
 $('#unlock-panel').hidden=!m.locked;$('#unlock-description').textContent=`Clear ${CAMPAIGNS[m.focus].title} with a fighter you own to unlock ${m.def.name}. You can try their awakened form now.`;$('#unlock-route').hidden=m.campaign;$('#unlock-route').onclick=()=>handlers.route(m.focus);
 $('#campaign-overview').hidden=!m.campaign;$('#campaign-fighter-choice').hidden=!m.campaign;
 $('#campaign-map').hidden=!m.campaign;$('#restart-campaign').hidden=!m.campaign||m.checkpoint===0;
 if(m.campaign){
  const route=CAMPAIGNS[selected];$('#route-title').textContent=route.title;$('#route-difficulty').textContent=route.difficulty+' CAMPAIGN · 9 STAGES';$('#route-progress').textContent=m.complete?'CAMPAIGN CLEARED · FIGHTER UNLOCKED':`NEXT: LEVEL ${m.checkpoint+1} / 9 · ${Math.floor(m.checkpoint/3)} BOSSES DEFEATED`;
  $('#campaign-map').innerHTML=Array.from({length:3},(_,chapter)=>`<section class="campaign-chapter"><div><span>CHAPTER 0${chapter+1}</span><strong>${ENEMY_THEMES[selected].lands[chapter].toUpperCase()}</strong></div><ol>${Array.from({length:3},(_,j)=>{const n=chapter*3+j,cleared=m.complete||n<m.checkpoint,current=!m.complete&&n===m.checkpoint;return `<li class="${cleared?'cleared':current?'current':''}" ${current?'aria-current="step"':''}><b>${cleared?'✓':String(n+1).padStart(2,'0')}</b><span>${j===2?'BOSS '+(chapter+1):'EXPLORE'}</span></li>`;}).join('')}</ol><p>${['Boss reward: Phase II','Boss reward: Awakening',m.complete?'Unlocked: ':'Final reward: Unlock '][chapter]}${chapter===2?m.def.name:''}</p></section>`).join('');
  const available=Object.keys(CHARACTERS).filter(id=>isUnlocked(progress,id));$('#campaign-fighter').innerHTML=available.map(id=>`<option value="${id}">${CHARACTERS[id].name}</option>`).join('');$('#campaign-fighter').value=state.fighter;
  $('#campaign-fighter-cards').innerHTML=available.map(id=>`<button data-challenger="${id}" aria-pressed="${id===state.fighter}" style="--seat-color:${CHARACTERS[id].color}"><span>${id===state.fighter?'✓':'+'}</span>${CHARACTERS[id].name}</button>`).join('');
  document.querySelectorAll('[data-challenger]').forEach(b=>b.onclick=()=>handlers.challenger(b.dataset.challenger));
 }
 $('#opponent-select').innerHTML=Object.keys(CHARACTERS).map(id=>`<option value="${id}">${CHARACTERS[id].name}</option>`).join('');$('#opponent-select').value=opponent;
 $('#preview').textContent=`TRY ${m.def.name} · AWAKENED ↗`;
 $('#start').disabled=!m.ready;$('#start').textContent=m.campaign?(m.checkpoint?'CONTINUE · LEVEL '+(m.checkpoint+1)+' →':'START CAMPAIGN →'):m.ready?(mode==='local'?'START LOCAL MATCH →':'FIGHT THE CPU →'):'CHOOSE UNLOCKED FIGHTERS';
 $('#selection-note').textContent=m.campaign?`${CHARACTERS[state.fighter].name} takes on ${m.def.name}’s campaign. Progress saves after each level.`:m.ready?`${CHARACTERS[selected].name} vs ${CHARACTERS[opponent].name} · First to 3 · Every loss is an evolution.`:'Locked fighters are available to preview. Clear their campaign to use them in matches.';
 return m;
}
