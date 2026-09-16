// Character motion is sampled from timed joint keyframes, independently of VFX.
const neutral={dx:0,dy:0,lean:0,turn:0,hx:30,hy:-66,bx:-25,by:-61,sword:.46,lf:-11,ly:0,rf:17,ry:0,knee:0};
const frame=(t,pose)=>({t,...neutral,...pose});
const clip=(wind,hit,follow,end={})=>[frame(0,{}),frame(.23,wind),frame(.46,hit),frame(.7,follow),frame(1,end)];
const swordCombos=[
  clip({lean:-.2,hx:-18,hy:-137,sword:-1.5,lf:-25},{dx:15,lean:.32,hx:62,hy:-86,sword:1.65,lf:-32,rf:35},{lean:.18,hx:52,hy:-47,sword:2.6,rf:29}),
  clip({lean:.18,hx:13,hy:-44,sword:2.7,rf:29},{dx:12,lean:-.18,hx:54,hy:-124,sword:.15,lf:-30},{hx:22,hy:-144,sword:-.65,lean:-.12}),
  clip({lean:-.3,hx:-19,hy:-86,sword:1.2,bx:15,by:-90},{dx:22,lean:.4,hx:71,hy:-94,sword:1.58,lf:-36,rf:43},{lean:.23,hx:61,hy:-90,sword:1.58,rf:37}),
  clip({dy:9,hx:3,hy:-159,sword:-.5,bx:-1,by:-142,lf:-32,rf:30},{dy:10,lean:.46,hx:57,hy:-59,sword:2.65,rf:44,lf:-36},{dy:15,lean:.25,hx:44,hy:-44,sword:2.8,rf:38})
];
const fistCombos=[
  clip({lean:-.22,hx:-3,hy:-103,bx:-18,by:-94},{dx:13,lean:.3,hx:71,hy:-94,bx:-17,by:-106,rf:34,lf:-31},{lean:.13,hx:52,hy:-95,rf:27}),
  clip({lean:-.25,bx:-35,by:-112,hx:19,hy:-110},{dx:17,lean:.3,bx:61,by:-97,hx:22,hy:-117,lf:-30,rf:35},{lean:.17,bx:42,by:-91,hx:25,hy:-104}),
  clip({dy:13,lean:.17,hx:17,hy:-50,rf:28},{dy:-13,lean:-.2,hx:36,hy:-157,rf:28,ry:-19},{hx:25,hy:-147,lean:-.2,ry:-9}),
  clip({dy:5,lean:-.3,hx:-12,hy:-145,bx:-30,by:-113,lf:-30},{dx:23,dy:15,lean:.48,hx:65,hy:-51,bx:15,by:-80,rf:41,lf:-39},{dy:13,lean:.27,hx:43,hy:-40,rf:34})
];
export const CLIPS={
  ...Object.fromEntries(swordCombos.map((c,i)=>['kairo-basic'+i,c])),
  ...Object.fromEntries(fistCombos.map((c,i)=>['vex-basic'+i,c])),
  dash:clip({dy:14,lean:.4,hx:10,hy:-72,lf:-30,rf:30},{dy:17,lean:.9,hx:-27,hy:-70,bx:-47,by:-74,sword:-1.8,lf:-44,rf:22,ry:-12},{dy:10,lean:.45,hx:14,hy:-77,lf:-38,rf:30}),
  jump:clip({dy:14,lf:-24,rf:27,hx:15,hy:-65},{dy:0,hx:33,hy:-118,bx:-33,by:-92,lf:-27,ly:-22,rf:30,ry:-32},{lf:-25,ly:-22,rf:27,ry:-18,lean:.15}),
  hurt:clip({lean:-.33,dy:5,hx:7,hy:-105,bx:-35,by:-77},{dx:-10,lean:-.42,hx:22,hy:-117,rf:35,lf:-24},{lean:-.15,dy:6,hx:24,hy:-99}),
  'kairo-cut':clip({dy:11,lean:-.25,hx:-12,hy:-77,sword:1.4,bx:0,by:-74,lf:-35},{dx:20,dy:10,lean:.6,hx:68,hy:-86,sword:1.8,rf:46,lf:-48},{lean:.32,hx:48,hy:-58,sword:2.4,rf:37,lf:-32}),
  'kairo-launch':clip({dy:20,lean:.2,hx:14,hy:-43,sword:2.7,rf:29,lf:-30},{dy:-10,lean:-.2,hx:38,hy:-152,sword:-.1,lf:-29,ly:-22,rf:35,ry:-38},{turn:-.45,hx:25,hy:-143,sword:-.6,lf:-26,ly:-33,rf:31,ry:-25}),
  'kairo-counter':clip({dy:8,hx:20,hy:-90,sword:-.25,bx:10,by:-82,rf:27},{dy:9,hx:22,hy:-107,sword:-.4,bx:9,by:-93,rf:30,lf:-23},{dy:9,hx:22,hy:-107,sword:-.4,bx:9,by:-93,rf:30,lf:-23}),
  'kairo-reversal':clip({lean:-.2,hx:-8,hy:-117,sword:-1.2},{dx:25,lean:.45,hx:63,hy:-70,sword:2.1,rf:38,lf:-38},{lean:.1,hx:13,hy:-70,sword:1.5,bx:-2,by:-63}),
  'kairo-slam':[
    frame(0,{dy:14,lf:-26,rf:26}),frame(.18,{hx:5,hy:-153,sword:-.3,lf:-27,ly:-30,rf:27,ry:-35}),
    frame(.42,{turn:-Math.PI*1.8,hx:14,hy:-151,sword:-.3,lf:-22,ly:-36,rf:26,ry:-37}),
    frame(.58,{turn:-Math.PI*2,hx:15,hy:-147,sword:.1,lean:.3,lf:-25,ly:-17,rf:28}),
    frame(.74,{turn:-Math.PI*2,dy:23,lean:.6,hx:56,hy:-43,sword:2.8,lf:-44,rf:43}),
    frame(1,{turn:-Math.PI*2})],
  'kairo-ultimate':[
    frame(0,{}),frame(.2,{dy:10,lean:-.15,hx:14,hy:-80,sword:1.2,bx:-3,by:-71,lf:-30,rf:31}),
    frame(.5,{dy:-8,hx:12,hy:-160,sword:0,bx:2,by:-137,lf:-24,rf:28}),
    frame(.64,{dy:8,lean:.47,hx:59,hy:-60,sword:2.5,bx:41,by:-73,lf:-43,rf:43}),frame(.83,{dy:15,lean:.3,hx:46,hy:-45,sword:2.7,rf:38}),frame(1,{})],
  'vex-pull':[
    frame(0,{}),frame(.2,{lean:.2,hx:68,hy:-99,bx:9,by:-81,lf:-27,rf:32}),
    frame(.38,{lean:-.25,hx:1,hy:-105,bx:-32,by:-95,lf:-29,rf:29}),
    frame(.57,{dx:20,lean:.42,hx:73,hy:-88,bx:-11,by:-109,lf:-37,rf:39}),frame(.8,{lean:.2,hx:45,hy:-81,rf:32}),frame(1,{})],
  'vex-orb':clip({dy:8,lean:-.22,hx:9,hy:-81,bx:17,by:-108,lf:-26,rf:29},{dx:12,lean:.24,hx:69,hy:-96,bx:54,by:-101,lf:-32,rf:34},{lean:.12,hx:56,hy:-98,bx:31,by:-89,rf:28}),
  'vex-counter':clip({hx:31,hy:-118,bx:22,by:-85,dy:7,rf:28},{hx:43,hy:-112,bx:30,by:-79,lean:-.12,rf:30},{hx:43,hy:-112,bx:30,by:-79,lean:-.12,rf:30}),
  'vex-reversal':clip({lean:-.25,hx:21,hy:-132,bx:7,by:-110},{dx:20,lean:.35,hx:68,hy:-93,bx:38,by:-100,rf:37},{lean:.12,hx:43,hy:-95,bx:0,by:-85}),
  'vex-crush':[
    frame(0,{}),frame(.24,{dy:-5,hx:38,hy:-149,bx:-39,by:-143,lf:-27,rf:29}),
    frame(.5,{dy:-12,hx:27,hy:-163,bx:-24,by:-158,lf:-29,ly:-9,rf:31,ry:-12}),
    frame(.7,{dy:20,lean:.35,hx:46,hy:-46,bx:18,by:-46,lf:-35,rf:40}),frame(.87,{dy:15,lean:.18,hx:38,hy:-43,bx:2,by:-54}),frame(1,{})],
  'vex-ultimate':[
    frame(0,{}),frame(.22,{dy:-9,hx:36,hy:-139,bx:-46,by:-138,lf:-29,ly:-9,rf:31,ry:-8}),
    frame(.5,{dy:-22,hx:64,hy:-111,bx:-64,by:-113,lean:-.1,lf:-34,ly:-18,rf:35,ry:-20}),
    frame(.64,{dy:-10,hx:21,hy:-94,bx:19,by:-101,lean:.22,lf:-23,rf:27}),
    frame(.82,{dy:12,lean:.38,hx:65,hy:-83,bx:46,by:-90,lf:-35,rf:39}),frame(1,{})]
};
Object.assign(CLIPS,{
  'kairo-storm-draw':clip({dy:15,lean:-.22,hx:-15,hy:-61,bx:12,by:-65,sword:1.65,lf:-34,rf:35},{dy:13,lean:.65,hx:69,hy:-86,bx:-30,by:-78,sword:1.5,lf:-46,rf:36},{lean:.2,hx:62,hy:-92,sword:1.6}),
  'kairo-storm-rise':[frame(0,{dy:16,lean:.4,hx:24,hy:-35,sword:2.8,lf:-35,rf:42}),frame(.5,{lean:-.25,hx:46,hy:-162,sword:-.2,bx:-45,by:-118,lf:-32,ly:-28,rf:35,ry:-14}),frame(1,{lean:-.1,hx:22,hy:-158,sword:-.4,lf:-30,ly:-22,rf:32,ry:-28})],
  'kairo-storm-spin':[frame(0,{turn:0,hx:62,hy:-99,sword:1.4,lf:-35,ly:-20,rf:35,ry:-25}),frame(.5,{turn:Math.PI,hx:70,hy:-100,sword:1.55,bx:-47,by:-112,lf:-38,ly:-22,rf:38,ry:-22}),frame(1,{turn:Math.PI*2,hx:60,hy:-125,sword:.7,lf:-31,ly:-15,rf:33,ry:-30})],
  'kairo-storm-finish':[frame(0,{hx:10,hy:-170,bx:2,by:-148,sword:0,lf:-30,ly:-22,rf:34,ry:-30}),frame(.45,{lean:.2,hx:13,hy:-177,bx:9,by:-154,sword:.08,lf:-32,ly:-18,rf:35,ry:-24}),frame(.7,{lean:.7,dy:18,hx:63,hy:-43,bx:41,by:-58,sword:2.7,lf:-48,rf:47}),frame(1,{lean:.4,dy:20,hx:44,hy:-34,sword:2.8,lf:-38,rf:40})],
  'kairo-storm-sheathe':[frame(0,{dy:20,lean:.4,hx:44,hy:-34,sword:2.8,lf:-38,rf:40}),frame(.55,{lean:-.08,hx:-10,hy:-68,bx:-17,by:-63,sword:1.7,lf:-23,rf:24}),frame(1,{hx:-15,hy:-70,bx:-21,by:-65,sword:1.65})],
  'kairo-clash':clip({lean:.3,hx:60,hy:-95,bx:33,by:-85,sword:1.5,lf:-36,rf:39},{lean:.55,dy:12,hx:76,hy:-92,bx:49,by:-83,sword:1.55,lf:-43,rf:44},{lean:.4,hx:64,hy:-97,bx:38,by:-86,sword:1.5,lf:-40,rf:42}),
  'vex-clash':clip({lean:.3,hx:57,hy:-97,bx:35,by:-102,lf:-33,rf:38},{lean:.5,dy:13,hx:77,hy:-93,bx:59,by:-105,lf:-42,rf:45},{lean:.35,hx:66,hy:-94,bx:47,by:-104,lf:-39,rf:41}),
  'kairo-shield':clip({hx:20,hy:-108,sword:-.1,bx:17,by:-80,rf:29},{hx:30,hy:-123,sword:-.15,bx:19,by:-90,rf:32,lean:-.12},{hx:32,hy:-119,sword:-.2,bx:11,by:-90}),
  'vex-shield':clip({hx:15,hy:-88,bx:10,by:-114},{hx:56,hy:-130,bx:-50,by:-129,lean:-.15,lf:-25,rf:30},{hx:45,hy:-106,bx:-41,by:-105}),
  'kairo-godflash':clip({dy:12,lean:.45,hx:-10,hy:-75,sword:1.6,lf:-40,rf:40},{dy:8,lean:.85,hx:62,hy:-80,sword:1.6,lf:-48,rf:33},{hx:25,hy:-148,sword:.2,lf:-30,ly:-25,rf:30,ry:-35}),
  'kairo-execution':[frame(0,{hx:16,hy:-157,sword:0,lean:.3,lf:-30,rf:30}),frame(.3,{dy:20,lean:.6,hx:55,hy:-40,sword:2.8,lf:-46,rf:43}),frame(.75,{dy:14,lean:.3,hx:40,hy:-40,sword:2.7,lf:-34,rf:32}),frame(1,{})],
  'kairo-ascend':[frame(0,{dy:12,hx:10,hy:-89,sword:1.2,lf:-28,rf:28}),frame(.2,{hx:13,hy:-152,sword:0,bx:-35,by:-115,lf:-25,ly:-15,rf:28,ry:-19}),frame(.6,{hx:8,hy:-164,sword:0,bx:-51,by:-122,lf:-32,ly:-20,rf:30,ry:-24}),frame(.73,{turn:-Math.PI*2,hx:14,hy:-152,sword:.2,lean:.3,lf:-28,rf:28}),frame(.85,{turn:-Math.PI*2,dy:20,lean:.5,hx:51,hy:-45,sword:2.8,lf:-42,rf:42}),frame(1,{turn:-Math.PI*2})],
  'vex-horizon':[frame(0,{}),frame(.18,{hx:69,hy:-105,bx:-12,by:-94,lean:.25,lf:-29,rf:34}),frame(.5,{hx:4,hy:-112,bx:-42,by:-114,lean:-.3,lf:-35,rf:31}),frame(.73,{hx:72,hy:-89,bx:24,by:-104,lean:.4,lf:-40,rf:43}),frame(1,{})],
  'vex-zero':[frame(0,{}),frame(.2,{hx:48,hy:-139,bx:-45,by:-144,lf:-28,ly:-15,rf:28,ry:-20}),frame(.6,{hx:24,hy:-168,bx:-26,by:-165,lean:-.1,lf:-30,ly:-22,rf:30,ry:-22}),frame(.82,{hx:52,hy:-52,bx:25,by:-58,lean:.42,lf:-30,rf:33}),frame(1,{})],
  'vex-collapse':[frame(0,{hx:26,hy:-149,bx:-25,by:-145}),frame(.25,{dy:17,hx:46,hy:-43,bx:12,by:-48,lean:.45,lf:-35,rf:40}),frame(.7,{dy:12,hx:32,hy:-44,bx:-2,by:-54,lean:.25,lf:-29,rf:30}),frame(1,{})],
  'kairo-judgement':[frame(0,{hx:5,hy:-85,sword:1.2,lf:-28,rf:30}),frame(.24,{hx:12,hy:-162,sword:0,bx:-45,by:-125,lf:-28,ly:-14,rf:28,ry:-18}),frame(.65,{hx:9,hy:-170,sword:0,bx:-50,by:-135,lean:-.1,lf:-32,ly:-20,rf:31,ry:-24}),frame(.76,{hx:66,hy:-64,sword:2.3,lean:.4,bx:18,by:-80,lf:-32,rf:30}),frame(1,{})],
  'vex-apocalypse':[frame(0,{}),frame(.22,{hx:51,hy:-141,bx:-56,by:-141,lf:-33,ly:-18,rf:34,ry:-22}),frame(.6,{hx:68,hy:-103,bx:-70,by:-108,lean:-.1,lf:-35,ly:-23,rf:35,ry:-23}),frame(.75,{hx:18,hy:-105,bx:14,by:-109,lean:.2,lf:-24,rf:29}),frame(.86,{hx:72,hy:-103,bx:-71,by:-105,lean:-.1,lf:-37,ly:-15,rf:37,ry:-20}),frame(1,{})],
  captive:[frame(0,{lean:-.3,hx:48,hy:-141,bx:-43,by:-128,lf:-35,ly:-15,rf:32,ry:-22}),frame(.5,{lean:-.12,hx:57,hy:-135,bx:-52,by:-142,lf:-35,ly:-20,rf:36,ry:-24}),frame(.85,{lean:.25,hx:45,hy:-140,bx:-37,by:-139,lf:-28,ly:-32,rf:32,ry:-38}),frame(1,{turn:-1.3,dy:45})],
  tumble:[frame(0,{turn:-.5,hx:48,hy:-129,bx:-39,by:-119,lf:-35,ly:-19,rf:35,ry:-21}),frame(.5,{turn:-3.5,hx:48,hy:-135,bx:-42,by:-134,lf:-33,ly:-24,rf:35,ry:-29}),frame(1,{turn:-6.5,hx:45,hy:-125,bx:-35,by:-105})],
  knockdown:[frame(0,{turn:-Math.PI/2,dy:51,hx:43,hy:-87,bx:-33,by:-72,lf:-16,rf:25}),frame(.72,{turn:-Math.PI/2,dy:51,hx:43,hy:-87,bx:-33,by:-72,lf:-16,rf:25}),frame(.92,{dy:22,lean:.45,hx:35,hy:-42,bx:-20,by:-40,lf:-27,rf:29}),frame(1,{})]
});
for(const character of ['kairo','vex']){
  for(let tier=1;tier<=4;tier++)CLIPS[`${character}-defend-${tier}`]=[
    frame(0,{dy:5,lean:-.15,hx:31,hy:-119,bx:19,by:-95,sword:-.15,lf:-25,rf:30}),
    frame(.22,{dx:-4-tier*3,dy:7+tier*2,lean:-.18-tier*.04,hx:23,hy:-130,bx:17,by:-110,sword:-.25,lf:-32-tier*2,rf:35+tier*2}),
    frame(.58,{dy:tier>=3?-8-tier*2:8,lean:-.08,hx:character==='kairo'?35:60,hy:-132,bx:character==='kairo'?21:-55,by:-122,sword:-.05,lf:-30,ly:tier>=3?-12:0,rf:35,ry:tier>=3?-15:0}),
    frame(.83,{dx:5+tier*2,dy:3,lean:.1+tier*.03,hx:50+tier*4,hy:-108,bx:character==='kairo'?25:-45,by:-101,sword:.3,lf:-34,rf:37}),frame(1,{})
  ];
  CLIPS[`${character}-defend-lose`]=[
    frame(0,{hx:35,hy:-125,bx:20,by:-109,sword:-.15,lf:-30,rf:33}),
    frame(.25,{dx:-12,dy:10,lean:-.3,hx:24,hy:-130,bx:15,by:-116,sword:-.35,lf:-38,rf:40}),
    frame(.6,{dx:-25,dy:23,lean:-.45,hx:12,hy:-124,bx:4,by:-105,sword:-.6,lf:-42,rf:46}),
    frame(.84,{dx:-32,dy:29,lean:-.65,hx:1,hy:-130,bx:-8,by:-119,sword:-.9,lf:-44,rf:49}),
    frame(1,{dx:-43,turn:-.5,dy:12,lean:-.5,hx:12,hy:-148,bx:-35,by:-130,lf:-35,ly:-12,rf:45,ry:-10})
  ];
}
export function sampleClip(name,progress){
  const frames=CLIPS[name];if(!frames)return {...neutral};
  const p=Math.max(0,Math.min(1,progress));let i=1;while(i<frames.length-1&&p>frames[i].t)i++;
  const a=frames[i-1],b=frames[i],raw=(p-a.t)/(b.t-a.t),t=raw*raw*(3-2*raw),pose={};
  for(const k of Object.keys(neutral))pose[k]=a[k]+(b[k]-a[k])*t;
  return pose;
}
export function characterPose(f,time){
  if(f.animation&&f.animation.elapsed<f.animation.duration)return sampleClip(f.animation.name,f.animation.elapsed/f.animation.duration);
  const p={...neutral};
  if(f.guard)return sampleClip(f.character+'-shield',.55);
  if(f.y<643){p.lf=-27;p.ly=-18;p.rf=28;p.ry=-32;p.hx=34;p.hy=-110;p.bx=-36;p.by=-94;p.lean=f.vy<0?-.1:.16;return p;}
  if(f.pose==='run'){
    const stride=Math.sin(time*17),lift=Math.cos(time*17);p.lean=.21;p.dy=-Math.abs(stride)*5;
    p.lf=-12+stride*32;p.rf=17-stride*32;p.ly=-Math.max(0,lift)*24;p.ry=-Math.max(0,-lift)*24;
    p.hx=27-stride*20;p.hy=-83+stride*12;p.bx=-20+stride*22;p.by=-82-stride*11;p.sword=.8;
  }else{p.dy=Math.sin(time*3)*2;p.hy+=Math.sin(time*3)*2;}
  return p;
}
