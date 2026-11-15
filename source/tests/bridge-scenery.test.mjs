import test from 'node:test';import assert from 'node:assert/strict';import {bridgeCrossingAt} from '../src/bridge-scenery.js';
test('bridge openings and their old floating gate supports are cleared without touching other levels',()=>{
 const bridges=[{x:-200,z:90,y:14,length:80}];
 assert.ok(bridgeCrossingAt(-211,14,90,bridges));
 assert.ok(bridgeCrossingAt(-211,13.9,69,bridges));assert.ok(bridgeCrossingAt(-211,13.9,111,bridges));
 assert.equal(bridgeCrossingAt(-211,32,90,bridges),undefined);
 assert.equal(bridgeCrossingAt(-300,14,90,bridges),undefined);assert.equal(bridgeCrossingAt(-200,14,180,bridges),undefined);
 assert.ok(bridgeCrossingAt(-211,14,90,[{x:-200,z:90,deck:14}]));
});
