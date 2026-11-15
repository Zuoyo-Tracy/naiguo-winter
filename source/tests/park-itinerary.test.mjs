import test from 'node:test';import assert from 'node:assert/strict';
import {parkItinerary,welcomeDirection} from '../src/park-itinerary.js';
const entry=(id,category,x=0,unlocked=true)=>({id,category,unlocked,p:{x,z:0},subtitle:'独特的朋友'});
const entries=[...['post','photos','music','finale'].map(id=>entry('story:'+id,'story')),entry('journey:rescue','story'),entry('friend:known','friend',1),entry('friend:far','friend',10),entry('friend:near','friend',3),entry('ride:locked','ride',0,false),entry('ride:open','ride',8)];
test('itinerary follows the causal story and never suggests locked rides or already recorded friends',()=>{
 const has=id=>id==='friend:known',first=parkItinerary(entries,{has});
 assert.deepEqual(first.map(s=>s.entry.id),['story:post','friend:near','ride:open']);
 assert.equal(parkItinerary(entries,{has,festival:{letter:true}})[0].entry.id,'story:photos');
 const relay=parkItinerary(entries,{has,festival:{letter:true,photos:true,rhythm:true,relayStep:2}})[0];
 assert.equal(relay.entry.id,'story:music');assert.match(relay.note,/2\/3/);
 assert.equal(parkItinerary(entries,{has,festival:{letter:true,photos:true,rhythm:true,relay:true}})[0].entry.id,'story:finale');
});
test('completed stories lead to the rescue, and a complete album has no fabricated tasks',()=>{
 const festival={letter:true,photos:true,rhythm:true,relay:true,finale:true};
 assert.equal(parkItinerary(entries,{festival})[0].entry.id,'journey:rescue');
 assert.deepEqual(parkItinerary(entries,{festival,has:()=>true}),[]);
});
test('the greeter follows story progress without sending a normal visitor to locked content',()=>{
 const first=welcomeDirection(entries,{has:id=>id==='friend:known'});
 assert.equal(first.entry.id,'story:post');
 const normal=entries.map(e=>({...e,unlocked:!e.id.startsWith('story:')&&e.id!=='journey:rescue'&&e.id!=='ride:locked'}));
 assert.equal(welcomeDirection(normal,{has:id=>id==='friend:known'}).entry.id,'friend:near');
 const scenery=[entry('friend:welcome','friend'),entry('scenic:locked','scenic',0,false),entry('scenic:far','scenic',30),entry('scenic:near','scenic',5)];
 assert.equal(welcomeDirection(scenery).entry.id,'scenic:near');
 assert.equal(welcomeDirection([entry('friend:welcome','friend')]),null);
});
