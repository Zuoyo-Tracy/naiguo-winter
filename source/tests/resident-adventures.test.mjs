import test from 'node:test';
import assert from 'node:assert/strict';
import {createResidentAdventures,residentObjective,RESIDENT_STORIES_KEY} from '../src/resident-adventures.js';
import {residentAdventures} from '../src/resident-adventure-data.js';

function memoryStorage(initial){
 const values=new Map(initial===undefined?[]:[[RESIDENT_STORIES_KEY,typeof initial==='string'?initial:JSON.stringify(initial)]]);
 return {writes:0,failRead:false,failWrite:false,
  getItem(key){if(this.failRead)throw Error('storage unavailable');return values.get(key)??null;},
  setItem(key,value){if(this.failWrite)throw Error('quota exceeded');this.writes++;values.set(key,value);},
 };
}
function collect(model,quest){
 assert.equal(model.act(quest.id,'start').ok,true);
 for(const clue of quest.clues)assert.equal(model.act(quest.id,'inspect',clue.id).ok,true);
}
const correct=quest=>quest.decision.choices.find(choice=>choice.correct);
const wrong=quest=>quest.decision.choices.find(choice=>!choice.correct);

for(const quest of residentAdventures){
 test(quest.title+': every clue must be examined before a decision, and the ending needs a correct choice',()=>{
  const model=createResidentAdventures(memoryStorage());
  assert.deepEqual(model.act(quest.id,'choose',correct(quest).id),{ok:false,reason:'unstarted'});
  assert.deepEqual(model.act(quest.id,'inspect',quest.clues[0].id),{ok:false,reason:'unstarted'});
  model.act(quest.id,'start');
  for(const clue of quest.clues){
   assert.deepEqual(model.act(quest.id,'choose',correct(quest).id),{ok:false,reason:'clues'});
   assert.deepEqual(model.act(quest.id,'finish'),{ok:false,reason:'unsolved'});
   model.act(quest.id,'inspect',clue.id);
  }
  assert.deepEqual(model.act(quest.id,'finish'),{ok:false,reason:'unsolved'});
  assert.equal(model.get(quest.id).complete,false);
  assert.equal(model.act(quest.id,'choose',correct(quest).id).ok,true);
  assert.equal(model.get(quest.id).complete,false,'returning to the resident is a separate ending step');
 });

 test(quest.title+': a mistaken answer preserves clues and can be retried immediately or after reload',()=>{
  const storage=memoryStorage(),model=createResidentAdventures(storage);collect(model,quest);
  const before=model.get(quest.id),revision=model.revision;
  const result=model.act(quest.id,'choose',wrong(quest).id);
  assert.equal(result.ok,false);assert.equal(result.reason,'choice');assert.deepEqual(result.reply,wrong(quest).reply);
  assert.deepEqual(model.get(quest.id),before);assert.equal(model.revision,revision);
  const reloaded=createResidentAdventures(storage);
  assert.deepEqual(reloaded.get(quest.id),before);
  assert.equal(reloaded.act(quest.id,'choose',correct(quest).id).ok,true);
  assert.equal(reloaded.act(quest.id,'finish').award,'resident:'+quest.id);
 });

 test(quest.title+': completed endings award once, survive reload, and cannot be changed by revisiting',()=>{
  const storage=memoryStorage(),model=createResidentAdventures(storage);collect(model,quest);
  const choice=correct(quest);model.act(quest.id,'choose',choice.id);
  const result=model.act(quest.id,'finish');assert.equal(result.award,'resident:'+quest.id);
  const completed=model.get(quest.id),writes=storage.writes,revision=model.revision;
  for(let i=0;i<3;i++)assert.deepEqual(model.act(quest.id,'finish'),{ok:true,already:true});
  assert.deepEqual(model.act(quest.id,'choose',wrong(quest).id),{ok:true,already:true});
  model.act(quest.id,'start');model.act(quest.id,'inspect',quest.clues[0].id);
  assert.deepEqual(model.get(quest.id),completed);assert.equal(storage.writes,writes);assert.equal(model.revision,revision);
  const restored=createResidentAdventures(storage);
  assert.deepEqual(restored.get(quest.id),completed);
  assert.deepEqual(restored.act(quest.id,'finish'),{ok:true,already:true});
 });

 test(quest.title+': malformed completion flags, duplicated clues and invalid choices cannot skip the investigation',()=>{
  const full={started:true,clues:quest.clues.map(clue=>clue.id),solved:true,choice:correct(quest).id,complete:true};
  const cases=[
   {...full,started:false},
   {...full,started:'true'},
   {...full,clues:null},
   {...full,clues:[quest.clues[0].id,quest.clues[0].id,'unrelated-clue']},
   {...full,choice:wrong(quest).id},
   {...full,choice:'unknown-choice'},
   {...full,solved:'true'},
  ];
  for(const value of cases){
   const model=createResidentAdventures(memoryStorage({version:1,quests:{[quest.id]:value}}));
   const restored=model.get(quest.id);
   assert.equal(restored.solved,false,JSON.stringify(value));assert.equal(restored.complete,false);
   assert.equal(model.act(quest.id,'finish').ok,false);
   assert.ok(restored.clues.every(id=>quest.clues.some(clue=>clue.id===id)));
   assert.equal(restored.clues.length,new Set(restored.clues).size);
   collect(model,quest);assert.equal(model.act(quest.id,'choose',correct(quest).id).ok,true);
   assert.equal(model.act(quest.id,'finish').award,'resident:'+quest.id,'a bad save remains recoverable through normal play');
  }
 });
}

test('both original poster captions are valid endings, with the first completed choice preserved',()=>{
 const quest=residentAdventures.find(quest=>quest.id==='poster');
 for(const choice of quest.decision.choices.filter(choice=>choice.correct)){
  const storage=memoryStorage(),model=createResidentAdventures(storage);collect(model,quest);
  assert.equal(model.act(quest.id,'choose',choice.id).ok,true);model.act(quest.id,'finish');
  const restored=createResidentAdventures(storage);
  assert.equal(restored.get(quest.id).choice,choice.id);assert.equal(restored.get(quest.id).complete,true);
 }
});

test('missing, corrupt and incompatible saved data begin with a playable fresh world',()=>{
 for(const data of [undefined,'{broken','null','[]','true',{version:2,quests:{}},{version:1,quests:null}]){
  const model=createResidentAdventures(memoryStorage(data));
  for(const quest of residentAdventures){assert.equal(model.get(quest.id).started,false);assert.equal(model.act(quest.id,'start').ok,true);}
 }
 const inaccessible=memoryStorage();inaccessible.failRead=true;
 assert.equal(createResidentAdventures(inaccessible).act(residentAdventures[0].id,'start').ok,true);
});

test('storage failure does not block play or repeat rewards, and a later successful save catches up',()=>{
 const storage=memoryStorage(),model=createResidentAdventures(storage),quest=residentAdventures[0];storage.failWrite=true;
 collect(model,quest);assert.equal(model.saved,false);
 model.act(quest.id,'choose',correct(quest).id);
 assert.equal(model.act(quest.id,'finish').award,'resident:'+quest.id);
 assert.deepEqual(model.act(quest.id,'finish'),{ok:true,already:true});
 assert.equal(model.get(quest.id).complete,true);assert.equal(storage.writes,0);
 storage.failWrite=false;model.act(residentAdventures[1].id,'start');assert.equal(model.saved,true);
 const restored=createResidentAdventures(storage);
 assert.equal(restored.get(quest.id).complete,true);assert.deepEqual(restored.act(quest.id,'finish'),{ok:true,already:true});
});

test('separate accounts and trial instances never share mutable progress or writes',()=>{
 const aStorage=memoryStorage(),bStorage=memoryStorage(),a=createResidentAdventures(aStorage),b=createResidentAdventures(bStorage),quest=residentAdventures[0];
 collect(a,quest);a.act(quest.id,'choose',correct(quest).id);a.act(quest.id,'finish');
 assert.equal(a.get(quest.id).complete,true);assert.equal(b.get(quest.id).started,false);assert.equal(bStorage.writes,0);
 collect(b,residentAdventures[1]);
 assert.equal(a.get(residentAdventures[1].id).started,false);
 assert.equal(createResidentAdventures(aStorage).get(quest.id).complete,true);
 assert.equal(createResidentAdventures(bStorage).get(quest.id).started,false);
});

test('UI snapshots and unknown actions cannot mutate quest progress',()=>{
 const storage=memoryStorage(),model=createResidentAdventures(storage),quest=residentAdventures[0];
 const state=model.state,snapshot=model.get(quest.id);state[quest.id].started=true;snapshot.clues.push(quest.clues[0].id);
 assert.equal(model.get(quest.id).started,false);assert.deepEqual(model.get(quest.id).clues,[]);
 assert.equal(model.act('unknown-quest','start').ok,false);model.act(quest.id,'start');
 const revision=model.revision;
 for(const [action,value] of [['inspect','unknown-clue'],['delete'],['choose','unknown-choice']])assert.equal(model.act(quest.id,action,value).ok,false);
 assert.equal(model.revision,revision);assert.deepEqual(model.get(quest.id).clues,[]);
});

test('objectives point to a resident, undiscovered clues, the workbench and the ending in order',()=>{
 const model=createResidentAdventures(memoryStorage()),quest=residentAdventures[0];
 assert.match(residentObjective(quest,model.get(quest.id)),new RegExp(quest.name));
 model.act(quest.id,'start');
 for(const clue of quest.clues){assert.ok(residentObjective(quest,model.get(quest.id)).includes(clue.title));model.act(quest.id,'inspect',clue.id);}
 assert.match(residentObjective(quest,model.get(quest.id)),/操作台/);
 model.act(quest.id,'choose',correct(quest).id);assert.match(residentObjective(quest,model.get(quest.id)),new RegExp(quest.name));
 model.act(quest.id,'finish');assert.match(residentObjective(quest,model.get(quest.id)),/结局/);
});
