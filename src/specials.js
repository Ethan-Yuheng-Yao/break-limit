import {KAIRO_FORMS,VEX_FORMS,RONIN_FORMS} from './forms.js';
export const NYRA_FORMS=[
 {names:['Ember Rush',null,'Cinder Guard','Flare Kick','Emberfall'],hints:['Fast burning fists','','Flame buckler','Rising kick / fireburst','One massive falling meteor']},
 {names:['Blazing Wheel',null,'Orbit Guard','Phoenix Dive','Meteor Crown'],hints:['Spinning flame kicks','','Three orbiting fire shields','Winged spiral / diving impact','Orbiting meteors / triple impact']},
 {names:['Sunbolt',null,'Prism Guard','Corona Eruption','Solar Lance'],hints:['Rapid ranged solar bolts','','Rotating solar prisms','Three erupting solar pillars','Focused sunbeam / final flare']},
 {names:['Phoenix Rush',null,'Dawn Wings','Phoenix Rebirth','Worldfall'],hints:['Twin phoenix claw strikes','','Phoenix wing shelter','Phoenix ascent / diving shockwaves','Meteor rain / falling miniature sun']}
];
export function specialMove(f,slot){
 const tier=f.tier,aw=tier===4,c=f.character;
 let name,kind,clips,damage,height=aw?230:350;
 if(c==='kairo'){
  if(slot===3){name=KAIRO_FORMS[tier-1].names[slot];kind=aw?'thunderstorm':tier===3?'blade-rain':'blade-dive';clips=[KAIRO_FORMS[tier-1].slam];damage=aw?59:24+tier*2;}
  else {name=aw?'Heaven’s Judgement':tier===2?'Tempest Execution':'Storm Severance';kind=aw?'divine-spear':'sword-burst';clips=aw?['kairo-judgement']:tier===1?['kairo-storm-draw','kairo-storm-rise','kairo-storm-finish']:['kairo-storm-draw','kairo-storm-rise','kairo-storm-spin','kairo-storm-finish'];damage=[74,92,84,75][tier-1];}
 }else if(c==='vex'){
  if(slot===3){name=VEX_FORMS[tier-1].names[slot];kind=aw?'zero-crush':'gravity-lift';clips=[VEX_FORMS[tier-1].slam];damage=aw?56:34+tier*2;}
  else {name=VEX_FORMS[tier-1].names[slot];kind=aw?'apocalypse':'singularity';clips=[VEX_FORMS[tier-1].ultimate];damage=aw?83:54;}
 }else if(c==='ronin'){
  name=RONIN_FORMS[tier-1].names[slot];kind=(slot===3?['steel-rise','steel-wheel','steel-rain','steel-rend']:['steel-oath','steel-requiem','steel-edges','steel-era'])[tier-1];clips=[RONIN_FORMS[tier-1][slot===3?'slam':'ultimate']];damage=(slot===3?[32,40,48,66]:[76,88,96,116])[tier-1];
 }else{
  name=NYRA_FORMS[tier-1].names[slot];
  kind=(slot===3?['flare-kick','phoenix-dive','corona','phoenix-rebirth']:['meteor','meteor-orbit','solar-lance','worldfall'])[tier-1];
  clips=['nyra-'+kind];damage=(slot===3?[30,38,60,70]:[62,78,78,108])[tier-1];
 }
 if(c==='kairo')name=KAIRO_FORMS[tier-1].names[slot];
 return {id:c+'-'+tier+'-'+slot,character:c,tier,slot,name,kind,clips,damage,height,direct:['blade-dive','sword-burst','flare-kick','phoenix-dive','phoenix-rebirth','steel-rise','steel-wheel','steel-rend'].includes(kind)};
}
export function clashInteraction(attack,defense){
 const kind=defense.kind;
 if(kind==='shield')return {response:'shield-counter',attack:attack.kind,defense:kind,caption:defense.name+' counters every impact'};
 const response=kind==='thunderstorm'?'lightning-intercept':kind==='divine-spear'?'spear-split':kind==='gravity-lift'?'suspend-crush':kind==='zero-crush'?'catch-slam':['singularity','apocalypse'].includes(kind)?'absorb':kind==='corona'?'pillar-burn':kind==='solar-lance'?'vaporize':['meteor','meteor-orbit','worldfall'].includes(kind)?'meteor-screen':kind.startsWith('phoenix')?'wing-deflect':'cleave';
 const verb={'lightning-intercept':'shoots down','spear-split':'splits','suspend-crush':'arrests','catch-slam':'catches and crushes',absorb:'swallows','pillar-burn':'burns through',vaporize:'vaporizes','meteor-screen':'collides with','wing-deflect':'deflects',cleave:'cuts through'}[response];
 return {response,attack:attack.kind,defense:kind,caption:defense.name+' '+verb+' '+attack.name};
}
export function shieldMove(f){
 const names={kairo:KAIRO_FORMS.map(form=>form.names[2]),vex:VEX_FORMS.map(form=>form.names[2]),nyra:NYRA_FORMS.map(form=>form.names[2]),ronin:RONIN_FORMS.map(form=>form.names[2])};
 return {id:f.character+'-'+f.tier+'-2',character:f.character,tier:f.tier,slot:2,name:names[f.character][f.tier-1],kind:'shield',clips:[f.character+'-defend-'+f.tier],direct:false};
}
export function moveClip(profile,p){
 const i=Math.min(profile.clips.length-1,Math.floor(p*profile.clips.length));
 return {name:profile.clips[i],progress:Math.min(.98,p*profile.clips.length-i)};
}
