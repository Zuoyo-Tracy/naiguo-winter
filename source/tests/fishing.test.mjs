import test from 'node:test';import assert from 'node:assert/strict';
import {newFishingRound,stepFishing,fishingAction,canFishAct,fishingButton,fishingPond} from '../src/fishing-rules.js';
import {newCarnivalRound,stepCarnival,hitCarnivalTarget} from '../src/carnival-rules.js';
import {attractions,parkDock,parkBlocksVehicle,parkSurface} from '../src/park-rules.js';
function until(r,phase,dt=1/60){for(let i=0;i<1200&&r.phase!==phase;i++)stepFishing(r,dt);assert.equal(r.phase,phase);}
test('fishing waits for explicit cast and does not inherit the old countdown or numbered targets',()=>{
 const r=newCarnivalRound('ducks');for(let i=0;i<12000;i++)stepCarnival(r,.05,35);assert.equal(r.phase,'ready');assert.equal(r.finished,false);assert.equal(r.catches.length,0);for(let i=0;i<6;i++)assert.equal(hitCarnivalTarget(r,i),false);assert.equal(r.score,0);
});
test('cast, float nibbles, bite and landing are distinct; early or duplicate actions do not score',()=>{
 const r=newFishingRound();assert.equal(canFishAct(r),true);assert.equal(fishingAction(r),true);assert.equal(fishingAction(r),false);until(r,'waiting');assert.equal(canFishAct(r),false);assert.equal(fishingAction(r),false);until(r,'nibbling');assert.equal(fishingAction(r),false);until(r,'bite');assert.equal(fishingButton(r),'收竿！');assert.equal(fishingAction(r),true);assert.equal(r.catches.length,0);assert.equal(fishingAction(r),false);until(r,'caught');assert.equal(r.catches.length,1);assert.equal(r.score,100);assert.equal(r.catches[0].name,'金尾鲫');for(let i=0;i<300;i++)stepFishing(r,.05);assert.equal(r.catches.length,1);
});
test('missing a bite is recoverable without damage, score loss or ending the activity',()=>{
 const r=newFishingRound();fishingAction(r);until(r,'bite');for(let i=0;i<55;i++)stepFishing(r,.05);assert.equal(r.phase,'bite');until(r,'missed');assert.equal(r.finished,false);assert.equal(r.score,0);assert.equal(canFishAct(r),true);fishingAction(r);until(r,'bite');fishingAction(r);until(r,'caught');assert.equal(r.catches.length,1);assert.ok(r.score>0);
});
test('three landed fish complete one round, freeze score, and a new round starts clean',()=>{
 for(const dt of [1/30,1/60,1/120]){const r=newFishingRound();for(let i=0;i<3;i++){fishingAction(r);until(r,'bite',dt);fishingAction(r);until(r,'caught',dt);}assert.equal(r.finished,true);assert.equal(r.score,450);assert.equal(new Set(r.catches.map(f=>f.name)).size,3);assert.equal(fishingAction(r),false);const t=r.time;stepFishing(r,1);assert.equal(r.time,t);assert.equal(r.score,450);}const again=newFishingRound();assert.equal(again.score,0);assert.equal(again.phase,'ready');
});
test('pointer casting stays within fishable water and malformed aim falls back safely',()=>{
 for(const aim of [{x:100,z:100},{x:0,z:-100},{x:NaN,z:Infinity},undefined]){const r=newFishingRound();fishingAction(r,aim);assert.ok(Math.hypot(r.aim.x,r.aim.z)<=10.001);assert.ok(r.aim.z>=-7);assert.ok(Number.isFinite(r.aim.x));}
});
test('expanded pond blocks driving but preserves the approach and legacy attraction id',()=>{
 const a=attractions.find(a=>a.id==='ducks'),d=parkDock(a);assert.equal(a.name,'星溪垂钓');assert.equal(a.duration,0);assert.equal(fishingPond.radius*2,30);assert.equal(parkBlocksVehicle(d.x,d.z,d.x,d.z,d.groundY,d.yaw),false);
 for(let i=0;i<20;i++){const z=a.anchor.z+(d.z-a.anchor.z)*i/20;assert.equal(parkSurface(d.x,z),32);assert.equal(parkBlocksVehicle(d.x,z,d.x,z,32,d.yaw),false);}
 assert.equal(parkBlocksVehicle(d.x,d.z,a.x,a.z-14,32,d.yaw),true);assert.equal(parkBlocksVehicle(a.x,a.z-16,a.x,a.z-19,32,d.yaw),false);
});
