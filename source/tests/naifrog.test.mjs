import test from 'node:test';import assert from 'node:assert/strict';
import {npcPlacements,npcBlocksTravel,npcSurface,npcPocket,npcLines} from '../src/naifrog-layout.js';
import {railClearanceSamples} from '../src/train-rules.js';
import {parkCollision,parkSurface} from '../src/park-rules.js';
import {stationSurface} from '../src/station-layout.js';
test('residents stand on reachable ground, outside railway and operating rides',()=>{assert.equal(npcPlacements.length,9);assert.equal(new Set(npcPlacements.map(n=>n.kind)).size,9);for(const n of npcPlacements){const ground=npcSurface(n.x,n.z)??parkSurface(n.x,n.z)??stationSurface(n.x,n.z);assert.ok(ground!==undefined&&Math.abs(ground-n.y)<.2,n.id+' has support');assert.equal(parkCollision(n.x,n.z,n.y),false,n.id+' outside ride');for(const p of railClearanceSamples){if(Math.abs(p.y-n.y)<6)assert.ok(Math.hypot(p.x-n.x,p.z-n.z)>5.5,n.id+' rail clearance');}}});
test('resident collision blocks approach but always allows retreat from overlap',()=>{const n=[{x:0,z:0,y:0,radius:1}];assert.equal(npcBlocksTravel(n,0,3,0,1.8,0),true);assert.equal(npcBlocksTravel(n,0,1.5,0,1.6,0),false);assert.equal(npcBlocksTravel(n,0,3,0,1.8,5),false);});
test('visitor turnout overlaps the supported road edge for safe access',()=>{assert.equal(npcSurface(npcPocket.x,461),12);assert.equal(npcSurface(npcPocket.x,477),undefined);});
test('traveler responds to completed rescue without granting story progress',()=>{const s={snowDone:false};const before=structuredClone(s);assert.ok(npcLines('traveler',s,'入口').join('').includes('尾巴'));assert.deepEqual(s,before);assert.ok(npcLines('traveler',{snowDone:true},'入口').join('').includes('回来了'));});
