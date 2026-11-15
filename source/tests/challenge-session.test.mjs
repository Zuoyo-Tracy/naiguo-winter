import test from 'node:test';import assert from 'node:assert/strict';import {startChallenge,advanceChallenge} from '../src/challenge-session.js';import {stationRace} from '../src/progress.js';import {newRace,stepRace,checkpoints} from '../src/rules.js';
import {sampleAt} from '../src/track.js';
import {stations} from '../src/station-layout.js';
test('challenge validates unlocked start and different valid destination',()=>{assert.throws(()=>startChallenge(2,0,0));assert.throws(()=>startChallenge(0,0,2));assert.throws(()=>startChallenge(0,8,2));assert.equal(startChallenge(0,2,0).challenge.to,2);});
test('at every departure station holding forward begins the timed journey toward the chosen station',()=>{
 for(const [from,to] of [[0,1],[0,2],[1,0],[1,2],[2,1],[2,0]]){
  const s=startChallenge(from,to,2),line=sampleAt(stations[from].s),parking=stationRace(from,2);
  assert.deepEqual([s.x,s.z],[line.x,line.z]);
  assert.notEqual(s.z,parking.z);
  for(let i=0;i<120;i++)stepRace(s,{accelerate:true},1/60,(i+1)/60);
  assert.equal(s.status,'running');assert.equal(s.hits,0);
  assert.ok((s.progress-stations[from].s)*Math.sign(to-from)>12,from+' → '+to);
 }
});
test('challenge ends at chosen station including reverse journeys; pauses do not add time',()=>{for(const [a,b] of [[0,2],[2,0],[1,2]]){const s=startChallenge(a,b,2);assert.equal(advanceChallenge(s,1),false);advanceChallenge(s,0);assert.equal(s.challenge.elapsed,1);const destination=stationRace(b,2);Object.assign(s,{x:destination.x,z:destination.z,groundY:destination.groundY});assert.equal(advanceChallenge(s,.5),true);assert.equal(s.challenge.elapsed,1.5);assert.equal(s.mode,'explore');assert.equal(advanceChallenge(s,1),false);}});
test('free exploration does not finish when all race checkpoints have been crossed',()=>{const s=newRace();Object.assign(s,{status:'running',mode:'explore',cp:checkpoints.length});stepRace(s,{},.01,1);assert.equal(s.status,'running');});
