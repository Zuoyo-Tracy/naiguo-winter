import test from 'node:test';
import assert from 'node:assert/strict';
import {createSnowTrail,snowContact} from '../src/snow-imprint-model.js';
import {cohesionSurface} from '../src/cohesion-layout.js';
const state=(x,z=0,extra={})=>({x,z,yaw:0,groundY:32,jumpY:0,status:'running',...extra});
test('marks follow actual movement, not throttle, and never draw a trail across a teleport or jump',()=>{
 const trail=createSnowTrail();assert.deepEqual(trail.advance(state(0)),[]);
 assert.deepEqual(trail.advance(state(0)),[]);
 assert.ok(trail.advance(state(2)).length>=2);
 assert.deepEqual(trail.advance(state(100)),[]);
 assert.deepEqual(trail.advance(state(101,0,{jumpY:1})),[]);
 assert.deepEqual(trail.advance(state(102)),[]);
 assert.ok(trail.advance(state(104)).every(p=>p.x>102));
 assert.deepEqual(trail.advance(state(105),{enabled:false}),[]);
 assert.deepEqual(trail.advance(state(106)),[]);
});
test('changing mounts resets the stride and all marks retain the new mount type',()=>{
 const trail=createSnowTrail();trail.advance(state(0));trail.advance(state(2));
 assert.deepEqual(trail.advance(state(2.4),{skin:'kangaroo'}),[]);
 assert.deepEqual(trail.advance(state(3),{skin:'kangaroo'}),[]);
 const marks=trail.advance(state(5.8),{skin:'kangaroo'});assert.equal(marks.length,2);assert.ok(marks.every(p=>p.skin==='kangaroo'));
});
test('snow contact excludes paved paths, rides, absent ground and wrong elevation',()=>{
 assert.equal(snowContact(-50,805,31.7),null);
 assert.equal(snowContact(-380,820,32),null);
 assert.equal(snowContact(-310,750,32),null);
 assert.equal(snowContact(2000,0,0),null);
 const x=-305,z=785,y=cohesionSurface(x,z);assert.ok(Number.isFinite(y));assert.equal(snowContact(x,z,y),y);assert.equal(snowContact(x,z,y+5),null);
});
