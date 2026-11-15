import test from 'node:test';import assert from 'node:assert/strict';import {readProgress,writeProgress,stationRace,reachedStation} from '../src/progress.js';
test('unlocked stations persist and malformed save falls back',()=>{let data='invalid';const storage={getItem:()=>data,setItem:(k,v)=>data=v};assert.equal(readProgress(storage).unlocked,0);writeProgress(storage,{unlocked:2});assert.equal(readProgress(storage).unlocked,2);});
test('locked stations cannot be selected',()=>assert.throws(()=>stationRace(2,1)));
test('rest station spawn is flat and not magnetic',()=>{const s=stationRace(1,1);assert.equal(s.progress,2160);assert.equal(s.cp,6);assert.equal(s.magnetic,false);assert.equal(s.hits,0);assert.equal(s.speed,0);});
test('station unlock requires valid route checkpoint progress',()=>{const s=stationRace(1,1);s.cp=0;assert.equal(reachedStation(s,{unlocked:0}),null);s.cp=6;assert.equal(reachedStation(s,{unlocked:0}).id,1);});

