import test from 'node:test';import assert from 'node:assert/strict';
import {createEncounterTracker} from '../src/encounter-hints.js';
import {createHintChannel} from '../src/region-hints.js';
const state=(x=0,extra={})=>({x,z:0,groundY:0,speed:6,status:'running',...extra});
const a={id:'friend:a',x:18,y:0,z:0,text:'A'},b={id:'prop:b',x:20,y:0,z:0,text:'B',radius:20,minSpeed:3};
test('a fast pass shows only one nearby encounter, and requires leaving 45 m before another greeting',()=>{
 const seen=[],tracker=createEncounterTracker({show:e=>{seen.push(e.id);return true;}});
 assert.equal(tracker.update([a,b],state(),0)?.id,a.id);
 assert.equal(tracker.update([a,b],state(),15000),null);
 tracker.update([a,b],state(-50),16000);
 assert.equal(tracker.update([a,b],state(),18000)?.id,a.id);
 assert.deepEqual(seen,[a.id,a.id]);
});
test('resident and story updates share a cooldown instead of replacing each other every frame',()=>{
 const tracker=createEncounterTracker();assert.equal(tracker.update([a],state(),0)?.id,a.id);
 assert.equal(tracker.update([b],state(),10),null);assert.equal(tracker.update([b],state(),15000),null);
 tracker.update([b],state(-60),16000);assert.equal(tracker.update([b],state(),18000)?.id,b.id);
});
test('menus, slow arrival, other floors and ghost riding states do not produce delayed surprises',()=>{
 for(const extra of [{speed:0},{snow:true},{status:'riding'},{falling:true},{magnetic:true},{storyJournalOpen:true}]){
  const tracker=createEncounterTracker();assert.equal(tracker.update([a],state(0,extra),0),null);assert.equal(tracker.update([a],state(),15000),null);
 }
 const tracker=createEncounterTracker();assert.equal(tracker.update([a],state(),0,false),null);assert.equal(tracker.update([a],state(),15000,true),null);
 const floors=createEncounterTracker();assert.equal(floors.update([a],state(0,{groundY:5}),0),null);assert.equal(floors.update([a],state(),15000)?.id,a.id);
 floors.update([a],state(0,{groundY:5}),30000);assert.equal(floors.update([a],state(),45000),null);
});
test('failed display never consumes the shared cooldown and props retain their own speed threshold',()=>{
 let allowed=false;const tracker=createEncounterTracker({show:()=>allowed});assert.equal(tracker.update([a],state(),0),null);allowed=true;
 assert.equal(tracker.update([b],state(0,{speed:3.5}),10)?.id,b.id);
});
test('encounters preempt a region label, then cannot be replaced until their bounded duration ends',()=>{
 const channel=createHintChannel();assert.equal(channel.request(0),true);assert.equal(channel.request(100,{priority:2,duration:10000}),true);assert.equal(channel.until,2500);
 assert.equal(channel.request(1000),false);assert.equal(channel.request(1500,{priority:2}),false);assert.equal(channel.request(2500),true);
 channel.clear();assert.equal(channel.request(2600),true);
});
