import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {teacupLayout,attractions,parkDock,defaultParkVehicle} from '../src/park-rules.js';
test('every vertex of the generated tea deck stays inside the protected rotating envelope',()=>{
 const b=fs.readFileSync(new URL('../public/assets/park/park-teacup-deck.glb',import.meta.url)),jsonLength=b.readUInt32LE(12),g=JSON.parse(b.subarray(20,20+jsonLength).toString()),bin=20+jsonLength+8;
 const a=g.accessors[g.meshes[0].primitives[0].attributes.POSITION],v=g.bufferViews[a.bufferView],start=bin+(v.byteOffset||0)+(a.byteOffset||0),stride=v.byteStride||12,cx=(a.min[0]+a.max[0])/2,cz=(a.min[2]+a.max[2])/2,scale=teacupLayout.deckWidth/(a.max[0]-a.min[0]);assert.equal(a.componentType,5126);
 let radius=0;for(let i=0;i<a.count;i++)radius=Math.max(radius,Math.hypot(b.readFloatLE(start+i*stride)-cx,b.readFloatLE(start+i*stride+8)-cz)*scale);
 assert.ok(radius<=teacupLayout.operatingRadius,'visible rotating mesh exceeds its collision envelope');
 const ride=attractions.find(a=>a.id==='teacups'),dock=parkDock(ride);assert.ok(Math.hypot(dock.x-ride.x,dock.z-ride.z)-defaultParkVehicle.halfLength>radius+.1,'entire vehicle must fit at arrival / exit');
});
