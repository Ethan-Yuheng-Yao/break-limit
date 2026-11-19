import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultKeys,actionBindings,bindingError,loadKeys,saveKeys,STORAGE_KEY} from '../src/controls.js';
test('rebinding replaces old skill triggers and preserves movement',()=>{
  const keys=defaultKeys();keys[0][0]='KeyR';keys[1][3]='KeyP';
  const actions=actionBindings(keys);
  assert.deepEqual(actions.KeyR,[0,0]);assert.deepEqual(actions.KeyP,[1,4]);
  assert.equal(actions.Digit1,undefined);assert.equal(actions.Minus,undefined);
  assert.deepEqual(actions.KeyQ,[0,'dash']);assert.deepEqual(actions.Digit9,[1,2]);
  assert.equal(defaultKeys()[0][0],'Digit1');
});
test('conflicting, reserved and navigation keys are rejected',()=>{
  const keys=defaultKeys();
  for(const code of ['Digit8','Digit2','KeyA','KeyK','Space','Escape','Tab','Enter','ShiftLeft'])assert.ok(bindingError(keys,0,0,code),code);
  for(const code of ['Digit1','KeyR','Numpad5','Quote'])assert.equal(bindingError(keys,0,0,code),'');
});
test('custom keys survive storage round trip',()=>{
  const map=new Map(),storage={getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)},keys=defaultKeys();keys[1][2]='KeyO';
  assert.equal(saveKeys(storage,keys),true);assert.deepEqual(loadKeys(storage),keys);
  map.set(STORAGE_KEY,'broken');assert.deepEqual(loadKeys(storage),defaultKeys());
  for(const invalid of [null,{},[[]],[[null,null,null,null],keys[1]],[[...keys[1]],[...keys[1]]]]){
    map.set(STORAGE_KEY,JSON.stringify(invalid));assert.deepEqual(loadKeys(storage),defaultKeys());
  }
});
test('unavailable storage still allows session controls',()=>{
  assert.deepEqual(loadKeys(undefined),defaultKeys());assert.equal(saveKeys(undefined,defaultKeys()),false);
});
