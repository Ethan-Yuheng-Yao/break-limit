// Forms change silhouettes, choreography and attack patterns, not just scale.
export const KAIRO_FORMS=[
 {names:['Flash Cut',null,'Storm Aegis','Thunderfall','Storm Severance'],hints:['Quick draw / three-hit chain','','Lightning buckler','Single descending thunderbolt','Rising draw / storm execution'],slam:'kairo-slam',shield:'kairo-shield',combo:'kairo-basic'},
 {names:['Twin Flash',null,'Twinblade Ward','Storm Guillotine','Tempest Execution'],hints:['Spinning cross-cut chain','','Two orbiting lightning blades','Corkscrew dive / twin impacts','Cross-dash aerial execution'],slam:'kairo-twinfall',shield:'kairo-twinward',combo:'kairo-twin'},
 {names:['Blade Step',null,'Heaven’s Arsenal','Heavenfall','Skyblade Requiem'],hints:['Precision thrust / spectral blades','','Six floating sword sentries','Three descending sword volleys','Triangular pursuit / sword rain'],slam:'kairo-sword-rain',shield:'kairo-arsenal',combo:'kairo-pierce'},
 {names:['Godflash',null,'Raijin Mantle','Thunder God','Heaven’s Judgement'],hints:['Lightning cross-dash chain','','Full-body lightning mantle','Sky ascent / eleven thunder pillars','Sky prison / divine spear'],slam:'kairo-ascend',shield:'kairo-raijin-ward',combo:'kairo-divine'}
];
export const VEX_FORMS=[
 {names:['Gravity Grasp',null,'Void Bastion','Crush','Void Collapse'],hints:['Heavy gravity fist chain','','Dense gravity plate','Lift / stone press','One collapsing gravity well'],slam:'vex-crush',shield:'vex-shield',combo:'vex-basic',ultimate:'vex-ultimate'},
 {names:['Orbit Breaker',null,'Binary Guard','Orbital Crush','Binary Collapse'],hints:['Alternating palm / orbit chain','','Two counter-rotating disks','Swing / compress / slam','Twin wells / figure-eight prison'],slam:'vex-orbital-crush',shield:'vex-binary-guard',combo:'vex-orbit',ultimate:'vex-binary-collapse'},
 {names:['Rift Claw',null,'Event Cage','Prison Crush','Tesseract Collapse'],hints:['Claw strikes / crushing planes','','Interlocking gravity cube','Three-stage cage compression','Fold space / shatter the prison'],slam:'vex-prison-crush',shield:'vex-cube-guard',combo:'vex-claw',ultimate:'vex-tesseract'},
 {names:['Event Horizon',null,'Abyss Carapace','Zero','End of Everything'],hints:['Void fist / double-hit launcher','','Living singularity shell','Sky restraint / enormous void hands','Event horizon / catastrophic collapse'],slam:'vex-zero',shield:'vex-abyss-guard',combo:'vex-horizon-fist',ultimate:'vex-apocalypse'}
];
export const RONIN_FORMS=[
 {names:['Draw Cut',null,'Iron Ward','Rising Cleave','Last Oath'],hints:['Quick sword draw / three-cut chain','','Brace behind the blade','Rising slash / falling cleave','Draw / launch / execution'],slam:'ronin-rise',shield:'ronin-ward-1',combo:'ronin-cut',ultimate:'ronin-oath'},
 {names:['Twin Fang',null,'Crossguard','Crimson Wheel','Scarlet Requiem'],hints:['Alternating twin sword cuts','','Crossed steel defense','Spinning twin-blade ascent','Four crossing cuts / heavy finisher'],slam:'ronin-wheel',shield:'ronin-ward-2',combo:'ronin-twin',ultimate:'ronin-requiem'},
 {names:['Royal Thrust',null,'Blade Court','Sovereign Rain','Thousand Edges'],hints:['Long thrust / summoned blade finish','','Orbiting sword sentries','Command three falling greatswords','Sword formation / six converging strikes'],slam:'ronin-rain',shield:'ronin-ward-3',combo:'ronin-thrust',ultimate:'ronin-edges'},
 {names:['World Splitter',null,'Oathkeeper','Heaven Rend','End of an Era'],hints:['Heavy greatsword / rupture finisher','','Colossal sword bastion','Skyward greatsword / earth split','Six sword passes / colossal final cleave'],slam:'ronin-rend',shield:'ronin-ward-4',combo:'ronin-world',ultimate:'ronin-era'}
];
export const FORMS={kairo:KAIRO_FORMS,vex:VEX_FORMS,ronin:RONIN_FORMS};
export function comboClip(f,step,finish=false){
 if(f.character==='nyra')return f.tier===2?'nyra-wheel':f.tier===4?'nyra-claws':'nyra-basic'+(finish?2:step);
 const index=finish?(f.character==='kairo'?3:2):step;
 return FORMS[f.character][f.tier-1].combo+index;
}
