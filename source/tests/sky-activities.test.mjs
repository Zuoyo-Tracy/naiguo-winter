import {createCollection} from '../src/collection.js';
import test from 'node:test';import assert from 'node:assert/strict';
import {skyActivities,activityKinds,newActivity,activityAction,tickActivity,activitySequence,activityCursor,starTarget,readActivities,cupAnswer} from '../src/sky-activities.js';
import {newFlight,stepFlight,skyBounds} from '../src/sky-journey.js';
test('15 unique side stories have ten real activities and remain within the world',()=>{assert.equal(skyActivities.length,15);assert.equal(new Set(skyActivities.map(e=>e.title)).size,15);assert.equal(new Set(skyActivities.map(e=>e.kind)).size,10);assert.equal(skyActivities.filter(e=>e.resident).length,5);for(const e of skyActivities){assert.ok(e.x>skyBounds.minX&&e.x<skyBounds.maxX&&e.z>skyBounds.minZ&&e.z<skyBounds.maxZ);assert.ok(e.opening.length>35);}});
test('all 15 activities can be completed through their normal controls and recover from mistakes',()=>{for(const e of skyActivities){const a=newActivity(e);if(a.kind==='sort'){activityAction(a,String((a.seed+1)%3));assert.equal(a.round,0);while(!a.done)activityAction(a,String((a.seed+a.round)%3));}
 if(a.kind==='bells'){activityAction(a,String((activitySequence(a)[0]+1)%3));assert.equal(a.round,0);for(const n of activitySequence(a))activityAction(a,String(n));}
 if(a.kind==='garden'){activityAction(a,'pour');tickActivity(a,.1);activityAction(a,'release');assert.equal(a.round,0);for(let i=0;i<3;i++){activityAction(a,'pour');for(let t=0;t<26;t++)tickActivity(a,.1);activityAction(a,'release');}}
 if(a.kind==='kite'){for(let i=0;i<1000&&!a.done;i++){tickActivity(a,.03);if(Math.abs(activityCursor(a)-.5)<.15)activityAction(a,'catch');}}
 if(a.kind==='stars'){for(let i=0;i<2000&&!a.done;i++){if(Math.abs(a.aim-starTarget(a))>=.06)activityAction(a,a.aim<starTarget(a)?'right':'left');tickActivity(a,.03);}}
 if(a.kind==='circuit')for(const key of ['0','2'])activityAction(a,key);
 if(a.kind==='balance')for(let i=0;i<2000&&!a.done;i++){activityAction(a,(-2*a.balance-1.5*a.velocity)>0?'right':'left');tickActivity(a,.03);}
 if(a.kind==='ballast')for(const keys of [['2'],['3'],['1','3']]){for(const key of keys)activityAction(a,key);activityAction(a,'confirm');}
 if(a.kind==='cups')for(let round=0;round<3;round++){for(let t=0;t<50;t++)tickActivity(a,.1);activityAction(a,String(cupAnswer(a)));}
 if(a.kind==='grid')for(const key of ['right','right','right','right','down','down','down','down'])activityAction(a,key);
 assert.equal(a.done,true,e.id);const before=a.round;activityAction(a,'0');tickActivity(a,1);assert.equal(a.round,before);}});
test('optional navigation does not consume main-line checkpoints or deliveries',()=>{for(const e of skyActivities){const s=newFlight(e.chapter);for(let i=0;i<20000;i++){stepFlight(s,{target:e,interact:true},.03);if(Math.hypot(s.x-e.x,s.y-e.y,s.z-e.z)<14&&s.speed<9)break;}assert.ok(Math.hypot(s.x-e.x,s.y-e.y,s.z-e.z)<14,e.id);assert.equal(s.node,0);assert.equal(s.nav,0);assert.equal(s.done,false);}});
test('stamps survive reload once, discard unknown or duplicate ids',()=>{assert.deepEqual(readActivities({getItem:()=>'{'}),{done:[]});assert.deepEqual(readActivities({getItem:()=>JSON.stringify({done:['sky-outing:0','bad','sky-outing:0']})}),{done:['sky-outing:0']});});

test('earned cloud stamps restore the atlas if its separate record is missing',()=>{const data=new Map([['milk-sky-outings-v1',JSON.stringify({done:['sky-outing:2','sky-outing:8']})]]),storage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)},book=createCollection(storage);assert.equal(book.count,2);assert.ok(book.has('sky-outing:8'));assert.equal(book.mark('sky-outing:8'),null);});
