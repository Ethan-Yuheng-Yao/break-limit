import {renderSelection,selectionSummary} from './selection.js';
import {updateBossHUD} from './campaign-ui.js';
import { Game,CHARACTERS,COOLDOWNS,ACTIVE_SKILLS,skillNames,skillHints } from './engine.js';
import { CampaignGame,CAMPAIGNS,loadCampaign,recordProgress,saveCampaign,isUnlocked } from './campaign.js';
import { Renderer } from './render.js';
import { Audio } from './audio.js';
import { SLOTS,defaultKeys,keyLabel,bindingError,loadKeys,saveKeys,actionBindings } from './controls.js';
const $=s=>document.querySelector(s),canvas=$('#arena'),renderer=new Renderer(canvas),audio=new Audio();
let campaignFighter='kairo',selectedMode='ai',selected='kairo',game=null,paused=false,last=0,announceTime=0,lastPreview=false;
let opponentChoice='vex',selectionSlot='hero',previewTier=1;
const keys=new Set(),announcement=$('#announcement');
let storage;try{storage=window.localStorage;}catch{}
let campaignProgress=loadCampaign(storage),campaignSaved=true;
let customKeys=loadKeys(storage),bindings=actionBindings(customKeys),skillKeys=[],capturing=null;
const settingsDialog=$('#settings-dialog'),bindingNames=['Skill 1 · Attack','Skill 2 · Shield','Skill 3 · Slam','Ultimate'];
function refreshBindings(){
  bindings=actionBindings(customKeys);
  skillKeys=customKeys.map(row=>{const labels=[];row.forEach((code,i)=>labels[SLOTS[i]]=keyLabel(code));return labels;});
  for(let p=0;p<2;p++){
    $('#help-skills'+p).textContent=customKeys[p].slice(0,3).map(keyLabel).join(' · ');
    $('#help-ult'+p).textContent=keyLabel(customKeys[p][3]);
  }
  $('#help-shields').textContent=customKeys.map(row=>keyLabel(row[1])).join(' / ');
  $('#binding-columns').replaceChildren();
  for(let p=0;p<2;p++){
    const section=document.createElement('section'),heading=document.createElement('h3');heading.textContent='PLAYER '+(p+1);section.append(heading);
    customKeys[p].forEach((code,i)=>{
      const row=document.createElement('div'),label=document.createElement('span'),button=document.createElement('button');row.className='binding-row';label.textContent=bindingNames[i];
      button.className='binding-key';button.textContent=keyLabel(code);button.setAttribute('aria-label','Player '+(p+1)+', '+bindingNames[i]+', key '+keyLabel(code));
      button.onclick=()=>{cancelCapture();capturing={p,i,button};button.classList.add('listening');button.textContent='PRESS KEY';$('#binding-status').textContent='Press a new key for Player '+(p+1)+': '+bindingNames[i]+'. Esc to cancel.';};
      row.append(label,button);section.append(row);
    });$('#binding-columns').append(section);
  }
  if(game){buildSkills();updateHUD();}
}
function cancelCapture(){if(capturing){capturing.button.classList.remove('listening');capturing.button.textContent=keyLabel(customKeys[capturing.p][capturing.i]);capturing=null;}}
function persistBindings(){const saved=saveKeys(storage,customKeys);refreshBindings();$('#binding-status').textContent=saved?'Saved. Your new keys are ready.':'Keys updated for this session. Browser storage is unavailable.';}
function openSettings(){keys.clear();syncDirection();if(game)pause(true);cancelCapture();$('#binding-status').textContent='Click a key to change it. Changes save automatically on this browser.';settingsDialog.showModal();}
for(const id of ['settings','match-settings','pause-settings'])$('#'+id).onclick=openSettings;
for(const id of ['close-settings','done-settings'])$('#'+id).onclick=()=>settingsDialog.close();
settingsDialog.addEventListener('close',()=>{cancelCapture();keys.clear();if(game&&paused)$('#resume').focus();});
$('#reset-keys').onclick=()=>{cancelCapture();customKeys=defaultKeys();persistBindings();};
refreshBindings();
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
  if(e.type==='campaignProgress'){campaignProgress=recordProgress(campaignProgress,e.character,e.nextStage,e.complete);campaignSaved=saveCampaign(storage,campaignProgress);}
  if(e.type==='campaignStage'){renderer.fx=[];renderer.particles=[];renderer.labels=[];renderer.cinematic=null;renderer.callout=null;initHUD();buildSkills();updateHUD();}
  if(e.type==='campaignStageCleared'){buildSkills();updateHUD();}
  if(e.type==='campaignEnd'){
    $('#winner').textContent=e.won?'CAMPAIGN COMPLETE':'DEFEATED';
    $('#result-score').textContent=e.won?CHARACTERS[e.character].name+' IS UNLOCKED · ALL 3 BOSSES DEFEATED':'Level '+(e.stage+1)+' · Your checkpoint is ready.';
    $('#rematch').textContent=e.won?'PLAY AGAIN →':'RETRY LEVEL →';$('#result').hidden=false;$('#rematch').focus();
  }
  if(e.type==='matchEnd'){
    $('#winner').textContent=CHARACTERS[game.fighters[e.winner].character].name+' WINS';$('#result-score').textContent=game.fighters.map(f=>f.score).join(' — ');$('#result').hidden=false;$('#rematch').focus();
  }
}
function start(preview=false){
  const view=selectionSummary({mode:selectedMode,selected,opponent:opponentChoice,fighter:campaignFighter,progress:campaignProgress,slot:selectionSlot,tier:previewTier});
  if(!preview&&!view.ready)return;
  keys.clear();lastPreview=preview;renderer.fx=[];renderer.particles=[];renderer.labels=[];renderer.cinematic=null;renderer.callout=null;renderer.flash=0;renderer.shake=0;renderer.zoom=1;
  game=selectedMode==='campaign'&&!preview?new CampaignGame({character:campaignFighter,campaign:selected,progress:campaignProgress,stage:campaignProgress.checkpoints[selected]||0,onEvent}):new Game({character:preview?view.focus:selected,opponent:preview?(view.focus==='kairo'?'vex':'kairo'):opponentChoice,mode:selectedMode==='campaign'?'ai':selectedMode,preview,onEvent});paused=false;
  $('#home').hidden=true;$('#rematch').textContent='RUN IT BACK →';
  $('#menu').hidden=true;$('#game').hidden=false;$('#result').hidden=true;$('#pause-overlay').hidden=true;document.body.classList.add('playing');window.scrollTo(0,0);
  $('#arena-label').textContent=preview?'THE FRACTURED HEAVENS':'THE SILENT TEMPLE';$('#match-kind').textContent=(game.mode==='ai'?'SOLO':'LOCAL 2P')+' / FIRST TO THREE';
  $('#round-note').textContent=preview?'DUAL AWAKENING / The final confrontation.':'Win the round. Survive the comeback.';
  initHUD();buildSkills();updateHUD();canvas.focus();
}
function initHUD(){
  const campaign=game.mode==='campaign';document.body.classList.toggle('campaign-playing',campaign);
  $('#campaign-status').hidden=!campaign;$('.player-skills-right').hidden=campaign;
  $('#match-goal').textContent=campaign?'CAMPAIGN':'FIRST TO 3';
  for(const f of game.fighters.slice(0,campaign?1:2)){$('#hud'+f.id).innerHTML=`<div class="name-line"><strong>${CHARACTERS[f.character].name}</strong><span class="tier"></span></div><div class="hp-track"><div class="hp-fill"></div></div><div class="hp-info"><span class="health"></span><span class="energy-label"></span></div><div class="energy-track"><div class="energy-fill"></div></div>`;$('#hud'+f.id).style.setProperty('--fighter-color',CHARACTERS[f.character].color);}
  $('#hud1').hidden=campaign&&!game.stage.boss;
  if(campaign){
    updateBossHUD($('#hud1'),game);
    $('#match-kind').textContent=CAMPAIGNS[game.campaign].title.toUpperCase();$('#arena-label').textContent=game.stage.title.toUpperCase();
  }
}
function buildSkills(){
  if(game.mode==='campaign')$('#skillbar1').replaceChildren();
  for(const f of game.fighters.slice(0,game.mode==='campaign'?1:2)){
    if(!$('#hud'+f.id+' .state-label')){const label=document.createElement('div');label.className='state-label';$('#hud'+f.id).append(label);}
    const def=CHARACTERS[f.character],names=skillNames(f),computer=f.id===1&&game.mode==='ai';
    const bar=$('#skillbar'+f.id);bar.parentElement.style.setProperty('--fighter-color',def.color);
    $('#skill-owner'+f.id).textContent=`PLAYER ${f.id+1}${computer?' / CPU':''} · ${def.name}`;
    const hints=skillHints(f);
    bar.innerHTML=ACTIVE_SKILLS.map(i=>`<button class="skill" data-player="${f.id}" data-slot="${i}" ${computer?'disabled':''} aria-label="Player ${f.id+1}: ${names[i]}${computer?', CPU':', key '+skillKeys[f.id][i]}"><kbd>${computer?'CPU':skillKeys[f.id][i]}</kbd><b>${names[i].toUpperCase()}</b><small>${hints[i]}</small><div class="cd"></div></button>`).join('');
  }
  $('#player2-controls').textContent=game.mode==='ai'?'AI OPPONENT · LIVE ABILITIES & COOLDOWNS':'← / → · MOVE   ↑ · JUMP   U · DASH   K · GUARD';
  document.querySelectorAll('.skill').forEach(button=>button.addEventListener('click',()=>{const id=Number(button.dataset.player);if(!paused&&(id===0||game.mode==='local'))game.inputAction(id,Number(button.dataset.slot));canvas.focus();}));
}
function updateHUD(){
  for(const f of game.fighters.slice(0,game.mode==='campaign'?1:2)){const el=$('#hud'+f.id);el.querySelector('.tier').textContent=(f.tier===4?'IV / AWAKENED':`${['I','II','III'][f.tier-1]} / ${CHARACTERS[f.character].tiers[f.tier-1]}`);el.querySelector('.hp-fill').style.width=(100*f.hp/f.maxHp)+'%';el.querySelector('.health').textContent=`${Math.ceil(f.hp)} / ${f.maxHp} HP`;el.querySelector('.energy-label').textContent=`${f.id===1&&game.mode==='local'?skillKeys[f.id][4]+' · ':''}${Math.floor(f.meter)}% LIMIT`;el.querySelector('.energy-fill').style.width=f.meter+'%';}
  if(game.mode==='campaign'){
    const alive=game.enemies(game.fighters[0]);$('#score').textContent=String(game.stageIndex+1)+' / 9';$('#round-label').textContent='BOSSES '+Math.min(3,Math.floor(game.stageIndex/3)+(game.phase==='roundEnd'&&game.stage.boss?1:0))+' / 3';
    updateBossHUD($('#hud1'),game);
    $('#campaign-status').textContent=(game.stage.boss?'BOSS BATTLE':game.exitOpen?'EXIT OPEN · REACH THE GATE →':alive.length+' ENEMIES LEFT')+' · EXPLORE → '+Math.round(game.fighters[0].x/game.width*100)+'% · TAB: TARGET · '+(campaignSaved?'CHECKPOINT SAVED':'SAVING UNAVAILABLE · THIS SESSION ONLY');
  }else{$('#score').innerHTML=`${game.fighters[0].score} <i>:</i> ${game.fighters[1].score}`;$('#round-label').textContent='ROUND '+String(game.round).padStart(2,'0');}
  for(const f of game.fighters.slice(0,game.mode==='campaign'?1:2)){const status=$('#hud'+f.id+' .state-label');status.textContent=game.clash?(game.clash.kind==='sky'?(game.clash.sequence?.combo?'COMBO CLASH · ':'SPECIAL CLASH · ')+(game.clash.losing?'GIVING GROUND':'COUNTERING'):'FORCE CLASH · SLOW MOTION'):f.shieldReaction?(f.shieldReaction.losing?'SHIELD OVERWHELMED':'SHIELD DEFENDING'):f.armor>0?'UNSTOPPABLE · STILL TAKES DAMAGE':f.capture?'RESTRAINED':f.down>0?'KNOCKED DOWN':f.shield?`${f.character==='ronin'?'BLADE GUARD':f.character==='nyra'?'SOLAR SHIELD':f.shield.type==='storm'?'LIGHTNING SHIELD':'VOID SHIELD'} · ${Math.ceil(f.shield.hp)}`:f.skillDelay>0&&f.lock<=0?'SKILL RECOVERY':'';}
  document.querySelectorAll('.skill').forEach(button=>{const f=game.fighters[Number(button.dataset.player)],i=Number(button.dataset.slot),cd=f.cooldowns[i],def=CHARACTERS[f.character],hints=skillHints(f);
    const chain=f.chainWindow>0&&i!==f.lastSkill&&!game.ccImmune(f)&&(f.lock<=0||f.cast?.slot===0&&f.cast.elapsed>=.17)&&!f.stun&&!f.down&&!f.capture&&!f.shieldReaction&&!game.clash;
    button.classList.toggle('locked',f.skillDelay>0&&!chain||!!f.capture||f.down>0||f.stun>0||(i===4?f.meter<100:cd>0));
    button.querySelector('small').textContent=cd>0?`${cd.toFixed(1)}s`:i===4&&f.meter<100?`${Math.floor(f.meter)}% ENERGY`:chain?'CHAIN READY':f.skillDelay>0?`${f.lock>0?'CASTING':'RECOVERY'} ${f.skillDelay.toFixed(1)}s`:i===4?'ULTIMATE READY':i===0&&f.comboWindow>0?`CHAIN ${f.comboStep+1} / 3 READY`:hints[i];
    button.querySelector('.cd').style.width=(i===4?f.meter:100*(1-cd/(COOLDOWNS[i]*(f.tier===4?.85:1))))+'%';});
}
function pause(value=!paused){if(!game||game.phase==='matchEnd')return;paused=value;keys.clear();$('#pause-overlay').hidden=!paused;if(paused)$('#resume').focus();else canvas.focus();}
function menu(){game=null;keys.clear();paused=false;if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});document.body.classList.remove('playing','campaign-playing');$('#menu').hidden=false;$('#game').hidden=true;refreshSelection();$('#start').focus();}
function selectionFocus(selector){document.querySelector(selector)?.focus({preventScroll:true});}
function refreshSelection(){
  if(!isUnlocked(campaignProgress,campaignFighter))campaignFighter='kairo';
  renderSelection({mode:selectedMode,selected,opponent:opponentChoice,fighter:campaignFighter,progress:campaignProgress,slot:selectionSlot,tier:previewTier},{
    pick(id){if(selectedMode==='campaign'||selectionSlot==='hero')selected=id;else opponentChoice=id;previewTier=1;refreshSelection();selectionFocus('[data-character="'+id+'"]');},
    seat(value){selectionSlot=value;previewTier=1;refreshSelection();selectionFocus('[data-seat="'+value+'"]');},
    form(tier){previewTier=tier;refreshSelection();selectionFocus('[data-form="'+tier+'"]');},
    challenger(id){campaignFighter=id;refreshSelection();selectionFocus('[data-challenger="'+id+'"]');},
    route(id){selected=id;enterSelectionMode('campaign');}
  });
}
function enterSelectionMode(mode){
  selectedMode=mode;selectionSlot='hero';previewTier=1;$('#home').hidden=true;$('#menu').hidden=false;refreshSelection();window.scrollTo(0,0);$('#selection-title').setAttribute('tabindex','-1');$('#selection-title').focus({preventScroll:true});
}
document.querySelectorAll('[data-mode]').forEach(button=>button.onclick=()=>enterSelectionMode(button.dataset.mode));
document.querySelectorAll('[data-selection-mode]').forEach(button=>button.onclick=()=>enterSelectionMode(button.dataset.selectionMode));
$('#back-home').onclick=()=>{$('#menu').hidden=true;$('#home').hidden=false;document.querySelector('[data-mode="'+selectedMode+'"]').focus();};
$('#campaign-fighter').onchange=e=>{campaignFighter=e.target.value;refreshSelection();};
$('#opponent-select').onchange=e=>{opponentChoice=e.target.value;refreshSelection();};
$('#start').onclick=()=>start();$('#preview').onclick=()=>start(true);$('#rematch').onclick=()=>start(lastPreview);$('#select').onclick=menu;$('#quit').onclick=menu;$('#pause').onclick=()=>pause();$('#resume').onclick=()=>pause(false);
$('#restart-campaign').onclick=()=>{campaignProgress=recordProgress(campaignProgress,selected,0);campaignSaved=saveCampaign(storage,campaignProgress);start();};
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
  if(settingsDialog.open){
    if(capturing){
      if(e.code==='Tab'){cancelCapture();$('#binding-status').textContent='Key change cancelled.';return;}
      e.preventDefault();
      if(e.repeat)return;
      if(e.code==='Escape'){cancelCapture();$('#binding-status').textContent='Key change cancelled.';return;}
      if(e.ctrlKey||e.altKey||e.metaKey||e.shiftKey){$('#binding-status').textContent='Press a single key without modifier keys.';return;}
      const {p,i}=capturing,error=bindingError(customKeys,p,i,e.code);
      if(error){$('#binding-status').textContent=error;return;}
      customKeys[p][i]=e.code;capturing=null;persistBindings();
      $('#binding-columns').querySelectorAll('.binding-key')[p*4+i].focus();
    }
    return;
  }
  if($('#help-dialog').open)return;
  if(!game)return;
  if(e.code==='Escape'){e.preventDefault();if(!e.repeat)pause();return;}
  if(paused||game.phase==='matchEnd')return;
  if(game.mode==='campaign'&&e.code==='Tab'){e.preventDefault();if(!e.repeat)game.cycleTarget();return;}
  if(bindings[e.code]||['KeyA','KeyD','KeyF','KeyK','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
  keys.add(e.code);syncDirection();if(!e.repeat&&bindings[e.code]){const [id,action]=bindings[e.code];if(id===0||game.mode==='local')game.inputAction(id,action);}
});
function syncDirection(){if(!game)return;game.setMoveIntent(0,Number(keys.has('KeyD'))-Number(keys.has('KeyA')));if(game.mode==='local')game.setMoveIntent(1,Number(keys.has('ArrowRight'))-Number(keys.has('ArrowLeft')));}
window.addEventListener('keyup',e=>{keys.delete(e.code);if(game&&!paused){if((e.code==='Space'||e.code==='KeyW')&&!keys.has('Space')&&!keys.has('KeyW'))game.releaseJump(0);if(e.code==='ArrowUp'&&game.mode==='local')game.releaseJump(1);}syncDirection();});
window.addEventListener('blur',()=>{keys.clear();if(game)pause(true);});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&game)pause(true);});
canvas.addEventListener('pointerdown',()=>canvas.focus());
function frame(ms){
  const dt=Math.min((ms-last)/1000||0,.035);last=ms;
  if(game){if(!paused){game.update(dt,[{move:Number(keys.has('KeyD'))-Number(keys.has('KeyA')),guard:keys.has('KeyF')},{move:Number(keys.has('ArrowRight'))-Number(keys.has('ArrowLeft')),guard:keys.has('KeyK')}]);announceTime-=dt;if(announceTime<=0)announcement.classList.remove('show');renderer.render(game,dt);updateHUD();}}
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
