import test from 'node:test';import assert from 'node:assert/strict';
import {newMushroomRound,startMushrooms,stepMushrooms,hitMushroom,mushroomCanHit} from '../src/mushroom-rules.js';
import {newCarnivalRound,stepCarnival,hitCarnivalTarget} from '../src/carnival-rules.js';
function advance(r,seconds){for(let t=0;t<seconds-1e-8;t+=.05)stepMushrooms(r,Math.min(.05,seconds-t));}
function put(r,type,index=0,hp=1){r.slots[index]={type,hp,maxHp:hp,born:r.time-.3,until:r.time+5,hitAt:-1,id:++r.serial};return index;}
test('mushroom party starts on demand, keeps its collection id, and ignores held/invalid targets',()=>{
 const r=newCarnivalRound('mushrooms');for(let i=0;i<200;i++)stepCarnival(r,.05,45);assert.equal(r.time,0);assert.equal(r.phase,'ready');assert.equal(hitCarnivalTarget(r,0),false);assert.equal(startMushrooms(r),true);assert.equal(startMushrooms(r),false);assert.equal(hitMushroom(r,9),false);assert.equal(hitMushroom(r,NaN),false);
});
test('seeded waves use all six holes, change pace, and include gold and time bonuses',()=>{
 const r=newMushroomRound(29);startMushrooms(r);const seen=new Set(),types=new Set(),stages=new Set();let simultaneous=0;for(let t=0;t<36;t+=.05){stepMushrooms(r,.05);stages.add(r.stage);r.slots.forEach((m,i)=>{if(m){seen.add(i);types.add(m.type);}});simultaneous=Math.max(simultaneous,r.slots.filter(Boolean).length);if(Math.floor(t*10)%5===0){const i=r.slots.findIndex((m,i)=>m&&mushroomCanHit(r,i));if(i>=0)hitMushroom(r,i);}}assert.equal(seen.size,6);for(const type of ['normal','gold','clock','king'])assert.ok(types.has(type),type);assert.equal(stages.size,3);assert.equal(simultaneous,3);
});
test('each pop scores once; five consecutive strikes activate doubles, empty strikes break the chain',()=>{
 const r=newMushroomRound(1);startMushrooms(r);r.nextSpawn=99;
 for(let i=0;i<5;i++){put(r,'normal');assert.equal(hitMushroom(r,0),true);const score=r.score;assert.equal(hitMushroom(r,0),false);assert.equal(r.score,score);advance(r,.3);}assert.equal(r.maxCombo,5);assert.ok(r.feverUntil>r.time);assert.equal(r.score,480);put(r,'gold');hitMushroom(r,0);assert.equal(r.score,880);advance(r,.2);hitMushroom(r,5);assert.equal(r.combo,0);assert.equal(r.score,880);
});
test('blue clocks extend the round at most nine seconds and missed pops remain recoverable',()=>{
 const r=newMushroomRound(1);startMushrooms(r);r.nextSpawn=99;for(let i=0;i<5;i++){put(r,'clock');hitMushroom(r,0);advance(r,.3);}assert.equal(r.bonusTime,9);assert.ok(r.remaining>45);put(r,'normal',2);r.slots[2].until=r.time+.1;advance(r,.2);assert.equal(r.slots[2],null);assert.equal(r.combo,0);assert.equal(r.finished,false);assert.ok(r.misses>0);
});
test('king takes six distinct strikes and changes holes twice without losing an existing target',()=>{
 const r=newMushroomRound(1);startMushrooms(r);r.time=32;stepMushrooms(r,.01);r.nextSpawn=99;assert.equal(r.slots[1].hp,6);put(r,'gold',4);let moved=false;
 for(let i=0;i<6;i++){advance(r,.3);const index=r.slots.findIndex(m=>m?.type==='king');assert.ok(index>=0);const hp=r.slots[index].hp;assert.equal(hitMushroom(r,index),true);assert.equal(hitMushroom(r,index),false);if(i===1){assert.equal(r.slots[4].hp,hp-1);assert.equal(r.slots[1].type,'gold');moved=true;}}
 assert.ok(moved);assert.equal(r.kingHits,6);assert.equal(r.kingDefeated,true);assert.equal(r.slots.some(m=>m?.type==='king'),false);assert.ok(r.score>=700);
});
test('round ends with stable results at common frame rates, and replay has fresh state',()=>{
 for(const dt of [1/30,1/60,1/120]){const r=newMushroomRound(5);startMushrooms(r);while(!r.finished)stepMushrooms(r,dt);assert.equal(r.phase,'finished');assert.ok(Math.abs(r.time-45)<dt+.001);assert.equal(r.slots.filter(Boolean).length,0);const score=r.score;assert.equal(hitMushroom(r,0),false);stepMushrooms(r,1);assert.equal(r.score,score);assert.equal(r.remaining,0);}const fresh=newMushroomRound(5);assert.equal(fresh.phase,'ready');assert.equal(fresh.maxCombo,0);assert.equal(fresh.kingStarted,false);
});
