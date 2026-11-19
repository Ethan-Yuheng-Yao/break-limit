export const SLOTS=[0,2,3,4];
export const STORAGE_KEY='break-limit.skill-keys.v1';
export const FIXED_BINDINGS={KeyQ:[0,'dash'],Space:[0,'jump'],KeyW:[0,'jump'],KeyU:[1,'dash'],ArrowUp:[1,'jump']};
const defaults=[['Digit1','Digit2','Digit3','Backquote'],['Digit8','Digit9','Digit0','Minus']];
const reserved=new Set([...Object.keys(FIXED_BINDINGS),'KeyA','KeyD','KeyF','KeyK','ArrowLeft','ArrowRight']);
const punctuation={Backquote:'~',Minus:'-',Equal:'=',BracketLeft:'[',BracketRight:']',Backslash:'\\',Semicolon:';',Quote:"'",Comma:',',Period:'.',Slash:'/'};
export const defaultKeys=()=>defaults.map(row=>[...row]);
export function keyLabel(code){return punctuation[code]??code.replace(/^Key|^Digit/,'').replace(/^Numpad/,'Num ');}
export function bindingError(bindings,player,index,code){
  if(reserved.has(code))return 'That key is used for movement or guard. Choose another key.';
  if(!/^(Key[A-Z]|Digit[0-9]|Numpad[0-9])$/.test(code)&&!Object.hasOwn(punctuation,code))return 'Choose a letter, number, or punctuation key.';
  for(let p=0;p<2;p++)for(let i=0;i<4;i++)if((p!==player||i!==index)&&bindings[p][i]===code)return `That key is already assigned to Player ${p+1}. Choose another key.`;
  return '';
}
export function loadKeys(storage){
  try{const keys=JSON.parse(storage.getItem(STORAGE_KEY));
    if(!Array.isArray(keys)||keys.length!==2||keys.some(row=>!Array.isArray(row)||row.length!==4))return defaultKeys();
    if(keys.some((row,p)=>row.some((code,i)=>typeof code!=='string'||bindingError(keys,p,i,code))))return defaultKeys();
    return keys;
  }catch{return defaultKeys();}
}
export function saveKeys(storage,keys){try{storage.setItem(STORAGE_KEY,JSON.stringify(keys));return true;}catch{return false;}}
export function actionBindings(keys){const result={...FIXED_BINDINGS};keys.forEach((row,p)=>row.forEach((code,i)=>{result[code]=[p,SLOTS[i]];}));return result;}
