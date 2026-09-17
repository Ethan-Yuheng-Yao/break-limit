import { Game,CHARACTERS,COOLDOWNS,ACTIVE_SKILLS,skillNames } from './engine.js';
import { Renderer,drawPortrait } from './render.js';
import { Audio } from './audio.js';
const $=s=>document.querySelector(s),canvas=$('#arena'),renderer=new Renderer(canvas),audio=new Audio();
let selected='kairo',game=null,paused=false,last=0,announceTime=0,lastPreview=false;
const keys=new Set(),announcement=$('#announcement');
const skillKeys=[['1','','2','3','~'],['8','','9','0','-']];
const bindings={KeyQ:[0,'dash'],Space:[0,'jump'],KeyW:[0,'jump'],Digit1:[0,0],Digit2:[0,2],Digit3:[0,3],Backquote:[0,4],KeyU:[1,'dash'],ArrowUp:[1,'jump'],Digit8:[1,0],Digit9:[1,2],Digit0:[1,3],Minus:[1,4]};
function onEvent(e){
  renderer.event(e);
  if(e.type==='sound')audio.play(e.kind,e.tier);
  if(e.type==='announce'){
    announcement.querySelector('p').textContent=e.subtitle;announcement.querySelector('h2').textContent=e.title;announcement.querySelector('span').textContent=e.detail;
    announcement.classList.add('show');announceTime=e.duration;
  }
  if(e.type==='evolution'){
    audio.play('ultimate');buildSkills();$('#arena-label').textContent=e.domain?'THE FRACTURED HEAVENS':'THE SILENT TEMPLE';
    $('#round-note').textContent=e.domain?'DUAL AWAKENING / The final confrontation.':'Evolution increases maximum health and fully heals. Victory heals 40% of missing health.';
  }
  if(e.type==='matchEnd'){
    $('#winner').textContent=CHARACTERS[game.fighters[e.winner].character].name+' WINS';$('#result-score').textContent=game.fighters.map(f=>f.score).join(' — ');$('#result').hidden=false;$('#rematch').focus();
  }
}
function start(preview=false){
  keys.clear();lastPreview=preview;renderer.fx=[];renderer.particles=[];renderer.labels=[];renderer.cinematic=null;renderer.callout=null;renderer.flash=0;renderer.shake=0;renderer.zoom=1;
  game=new Game({character:selected,mode:$('#mode').value,preview,onEvent});paused=false;
  $('#menu').hidden=true;$('#game').hidden=false;$('#result').hidden=true;$('#pause-overlay').hidden=true;document.body.classList.add('playing');window.scrollTo(0,0);
  $('#arena-label').textContent=preview?'THE FRACTURED HEAVENS':'THE SILENT TEMPLE';$('#match-kind').textContent=(game.mode==='ai'?'SOLO':'LOCAL 2P')+' / FIRST TO THREE';
  $('#round-note').textContent=preview?'DUAL AWAKENING / The final confrontation.':'Win the round. Survive the comeback.';
  for(const f of game.fighters){$('#hud'+f.id).innerHTML=`<div class="name-line"><strong>${CHARACTERS[f.character].name}</strong><span class="tier"></span></div><div class="hp-track"><div class="hp-fill"></div></div><div class="hp-info"><span class="health"></span><span class="energy-label"></span></div><div class="energy-track"><div class="energy-fill"></div></div>`;$('#hud'+f.id).style.setProperty('--fighter-color',CHARACTERS[f.character].color);}
  buildSkills();updateHUD();canvas.focus();
}
function buildSkills(){
  for(const f of game.fighters){
    if(!$('#hud'+f.id+' .state-label')){const label=document.createElement('div');label.className='state-label';$('#hud'+f.id).append(label);}
    const def=CHARACTERS[f.character],names=skillNames(f),computer=f.id===1&&game.mode==='ai';
    const bar=$('#skillbar'+f.id);bar.parentElement.style.setProperty('--fighter-color',def.color);
    $('#skill-owner'+f.id).textContent=`PLAYER ${f.id+1}${computer?' / CPU':''} · ${def.name}`;
    const hints=f.tier===4?def.awakenedHints:def.hints;
    bar.innerHTML=ACTIVE_SKILLS.map(i=>`<button class="skill" data-player="${f.id}" data-slot="${i}" ${computer?'disabled':''} aria-label="Player ${f.id+1}: ${names[i]}${computer?', CPU':', key '+skillKeys[f.id][i]}"><kbd>${computer?'CPU':skillKeys[f.id][i]}</kbd><b>${names[i].toUpperCase()}</b><small>${hints[i]}</small><div class="cd"></div></button>`).join('');
  }
  $('#player2-controls').textContent=game.mode==='ai'?'AI OPPONENT · LIVE ABILITIES & COOLDOWNS':'← / → · MOVE   ↑ · JUMP   U · DASH   K · GUARD';
  document.querySelectorAll('.skill').forEach(button=>button.addEventListener('click',()=>{const id=Number(button.dataset.player);if(!paused&&(id===0||game.mode==='local'))game.action(id,Number(button.dataset.slot));canvas.focus();}));
}
function updateHUD(){
  for(const f of game.fighters){const el=$('#hud'+f.id);el.querySelector('.tier').textContent=(f.tier===4?'IV / AWAKENED':`${['I','II','III'][f.tier-1]} / ${CHARACTERS[f.character].tiers[f.tier-1]}`);el.querySelector('.hp-fill').style.width=(100*f.hp/f.maxHp)+'%';el.querySelector('.health').textContent=`${Math.ceil(f.hp)} / ${f.maxHp} HP`;el.querySelector('.energy-label').textContent=`${f.id===1&&game.mode==='local'?'- · ':''}${Math.floor(f.meter)}% LIMIT`;el.querySelector('.energy-fill').style.width=f.meter+'%';}
  $('#score').innerHTML=`${game.fighters[0].score} <i>:</i> ${game.fighters[1].score}`;$('#round-label').textContent='ROUND '+String(game.round).padStart(2,'0');
  for(const f of game.fighters){const status=$('#hud'+f.id+' .state-label');status.textContent=game.clash?'FORCE CLASH · SLOW MOTION':f.shieldReaction?(f.shieldReaction.losing?'SHIELD OVERWHELMED':'SHIELD DEFENDING'):f.armor>0?'UNSTOPPABLE · STILL TAKES DAMAGE':f.capture?'RESTRAINED':f.down>0?'KNOCKED DOWN':f.shield?`${f.shield.type==='storm'?'LIGHTNING SHIELD':'VOID SHIELD'} · ${Math.ceil(f.shield.hp)}`:f.skillDelay>0&&f.lock<=0?'SKILL RECOVERY':'';}
  document.querySelectorAll('.skill').forEach(button=>{const f=game.fighters[Number(button.dataset.player)],i=Number(button.dataset.slot),cd=f.cooldowns[i],def=CHARACTERS[f.character],hints=f.tier===4?def.awakenedHints:def.hints;
    button.classList.toggle('locked',f.skillDelay>0||!!f.capture||f.down>0||(i===4?f.meter<100:cd>0));
    button.querySelector('small').textContent=cd>0?`${cd.toFixed(1)}s`:f.skillDelay>0?`${f.lock>0?'CASTING':'RECOVERY'} ${f.skillDelay.toFixed(1)}s`:i===4?f.meter>=100?'ULTIMATE READY':`${Math.floor(f.meter)}% ENERGY`:hints[i];
    button.querySelector('.cd').style.width=(i===4?f.meter:100*(1-cd/(COOLDOWNS[i]*(f.tier===4?.85:1))))+'%';});
}
function pause(value=!paused){if(!game||game.phase==='matchEnd')return;paused=value;keys.clear();$('#pause-overlay').hidden=!paused;if(paused)$('#resume').focus();else canvas.focus();}
function menu(){game=null;keys.clear();paused=false;if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});document.body.classList.remove('playing');$('#menu').hidden=false;$('#game').hidden=true;$('#start').focus();}
document.querySelectorAll('.fighter-card').forEach(card=>card.addEventListener('click',()=>{selected=card.dataset.character;document.querySelectorAll('.fighter-card').forEach(c=>{const yes=c===card;c.classList.toggle('selected',yes);c.setAttribute('aria-pressed',String(yes));c.querySelector('.selection').textContent=yes?'SELECTED ↗':'SELECT ↗';});$('#rival-name').textContent=selected==='kairo'?'VEX / THE ABYSS':'KAIRO / THE STORMBORN';}));
$('#start').onclick=()=>start();$('#preview').onclick=()=>start(true);$('#rematch').onclick=()=>start(lastPreview);$('#select').onclick=menu;$('#quit').onclick=menu;$('#pause').onclick=()=>pause();$('#resume').onclick=()=>pause(false);
$('#sound').onclick=()=>{try{const enabled=audio.toggle();$('#sound').textContent='SOUND '+(enabled?'ON':'OFF');$('#sound').setAttribute('aria-pressed',String(enabled));}catch{$('#sound').textContent='SOUND UNAVAILABLE';}};
renderer.reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function updateEffects(){$('#effects').textContent='REDUCED FX: '+(renderer.reduced?'ON':'OFF');$('#effects').setAttribute('aria-pressed',String(renderer.reduced));}updateEffects();
$('#effects').onclick=()=>{renderer.reduced=!renderer.reduced;updateEffects();};
$('#help').onclick=()=>{if(game)pause(true);$('#help-dialog').showModal();};$('#close-help').onclick=()=>$('#help-dialog').close();
$('#match-help').onclick=$('#help').onclick;
$('#fullscreen').hidden=!document.fullscreenEnabled;
$('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();canvas.focus();}catch{$('#fullscreen').textContent='FULL WINDOW';$('#fullscreen').disabled=true;}};
document.addEventListener('fullscreenchange',()=>{$('#fullscreen').textContent=document.fullscreenElement?'EXIT FULL SCREEN':'FULL SCREEN';});
window.addEventListener('keydown',e=>{
  if($('#help-dialog').open)return;
  if(!game)return;
  if(e.code==='Escape'){e.preventDefault();if(!e.repeat)pause();return;}
  if(paused||game.phase==='matchEnd')return;
  if(bindings[e.code]||['KeyA','KeyD','KeyF','KeyK','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
  keys.add(e.code);syncDirection();if(!e.repeat&&bindings[e.code]){const [id,action]=bindings[e.code];if(id===0||game.mode==='local')game.action(id,action);}
});
function syncDirection(){if(!game)return;game.setMoveIntent(0,Number(keys.has('KeyD'))-Number(keys.has('KeyA')));if(game.mode==='local')game.setMoveIntent(1,Number(keys.has('ArrowRight'))-Number(keys.has('ArrowLeft')));}
window.addEventListener('keyup',e=>{keys.delete(e.code);syncDirection();});
window.addEventListener('blur',()=>{keys.clear();if(game)pause(true);});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&game)pause(true);});
canvas.addEventListener('pointerdown',()=>canvas.focus());
function frame(ms){
  const dt=Math.min((ms-last)/1000||0,.035);last=ms;
  if(game){if(!paused){game.update(dt,[{move:Number(keys.has('KeyD'))-Number(keys.has('KeyA')),guard:keys.has('KeyF')},{move:Number(keys.has('ArrowRight'))-Number(keys.has('ArrowLeft')),guard:keys.has('KeyK')}]);announceTime-=dt;if(announceTime<=0)announcement.classList.remove('show');renderer.render(game,dt);updateHUD();}}
  requestAnimationFrame(frame);
}
drawPortrait($('#portrait-kairo'),'kairo');drawPortrait($('#portrait-vex'),'vex');requestAnimationFrame(frame);
