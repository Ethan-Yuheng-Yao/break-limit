import test from 'node:test';
import assert from 'node:assert/strict';
import {selectionSummary} from '../src/selection.js';
import {CHARACTERS,ACTIVE_SKILLS,skillNames} from '../src/engine.js';
const progress={completed:[],checkpoints:{ronin:6}};
const state={mode:'ai',selected:'kairo',opponent:'vex',fighter:'kairo',progress,slot:'hero',tier:1};

test('duel selection previews either fighter while preserving the matchup',()=>{
 assert.equal(selectionSummary(state).focus,'kairo');
 const rival=selectionSummary({...state,mode:'local',slot:'opponent'});
 assert.equal(rival.focus,'vex');assert.equal(rival.ready,true);
 for(const mode of ['ai','local'])for(const seat of ['selected','opponent']){
  assert.equal(selectionSummary({...state,mode,[seat]:'ronin'}).ready,false);
 }
 assert.equal(selectionSummary({...state,opponent:'ronin',progress:{completed:['ronin'],checkpoints:{}}}).ready,true);
});
test('campaign route and owned challenger remain independent of duel slot and preview form',()=>{
 const campaign=selectionSummary({...state,mode:'campaign',selected:'ronin',opponent:'nyra',slot:'opponent',tier:4});
 assert.equal(campaign.focus,'ronin');assert.equal(campaign.locked,true);assert.equal(campaign.ready,true);
 assert.equal(campaign.checkpoint,6);assert.equal(campaign.complete,false);
 assert.equal(selectionSummary({...state,mode:'campaign',selected:'ronin',fighter:'nyra'}).ready,false);
 assert.deepEqual(progress,{completed:[],checkpoints:{ronin:6}});
});
test('every fighter form previews the real four skills without changing progression',()=>{
 for(const selected of Object.keys(CHARACTERS))for(let tier=1;tier<=4;tier++){
  const summary=selectionSummary({...state,selected,tier});
  assert.deepEqual(summary.moves.map(m=>m.id),ACTIVE_SKILLS);
  assert.deepEqual(summary.moves.map(m=>m.name),ACTIVE_SKILLS.map(id=>skillNames({character:selected,tier})[id]));
  assert.ok(summary.moves.every(m=>m.name&&m.hint));
 }
 assert.deepEqual(progress,{completed:[],checkpoints:{ronin:6}});
});
