import {fighterDefinition} from './engine.js';
// This panel is reserved for the one boss; creatures are labeled in the arena.
export function updateBossHUD(panel,game){
 const boss=game.stage.boss?game.fighters[1]:null;
 panel.hidden=!boss;
 if(!boss){panel.replaceChildren();return;}
 if(!panel.querySelector('.boss-hp'))panel.innerHTML='<div class="name-line"><strong></strong><span></span></div><div class="hp-track boss-hp" role="progressbar" aria-label="Boss health" aria-valuemin="0"><div class="hp-fill"></div></div><div class="hp-info"><span class="boss-health"></span></div>';
 panel.style.setProperty('--fighter-color',fighterDefinition(boss).color);
 panel.querySelector('.name-line strong').textContent=boss.name;
 panel.querySelector('.name-line span').textContent='BOSS '+(game.stage.chapter+1)+' / 3';
 panel.querySelector('.hp-fill').style.width=100*boss.hp/boss.maxHp+'%';
 panel.querySelector('.boss-health').textContent=Math.ceil(boss.hp)+' / '+boss.maxHp+' HP';
 panel.querySelector('.boss-hp').setAttribute('aria-valuemax',boss.maxHp);
 panel.querySelector('.boss-hp').setAttribute('aria-valuenow',Math.ceil(boss.hp));
}
