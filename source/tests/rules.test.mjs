import test from 'node:test';import assert from 'node:assert/strict';import {flowFactor,nextCheckpoint,newRace,stepRace,checkpoints} from '../src/rules.js';import {TRACK_LENGTH,OLD_TRACK_LENGTH,sampleAt,route} from '../src/track.js';
test('cloud multiplier is direction independent',()=>{for(const v of [[1,0],[-1,0],[0,1],[0,-1]])assert.equal(flowFactor(...v,true),2);assert.equal(flowFactor(1,0,false),1);});
test('first level exceeds ten times original length with continuous geometry',()=>{assert.ok(TRACK_LENGTH>=10*OLD_TRACK_LENGTH);for(let i=1;i<route.length;i++)assert.ok(Math.hypot(route[i].x-route[i-1].x,route[i].z-route[i-1].z)<5.1);});
test('checkpoint order cannot be skipped',()=>assert.equal(nextCheckpoint(0,...checkpoints.at(-1),checkpoints),0));
test('entire geometry is traversable including magnetic lane, at a safe meteor phase',()=>{const s=newRace();s.status='running';s.snowDone=true;for(let i=0;i<35000&&s.status==='running';i++){const p=sampleAt(Math.min(TRACK_LENGTH,s.progress+12)),desired=Math.atan2(p.x-s.x,p.z-s.z),error=Math.atan2(Math.sin(desired-s.yaw),Math.cos(desired-s.yaw));stepRace(s,{accelerate:true,steer:s.magnetic?0:Math.max(-1,Math.min(1,error*2))},1/60,0);}assert.equal(s.status,'won',s.reason+' at '+s.progress);assert.equal(s.hits,0);});


