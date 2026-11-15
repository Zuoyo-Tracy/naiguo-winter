import test from 'node:test';import assert from 'node:assert/strict';
import {pushOutsideBox,safeSkyCamera} from '../src/sky-clearance.js';import {newFlight,stepFlight} from '../src/sky-journey.js';
const box={min:{x:-4,y:210,z:690},max:{x:4,y:260,z:700}};
test('a glancing contact slides on the expanded building face',()=>{assert.equal(pushOutsideBox({x:8,y:230,z:695},box),null);const p=pushOutsideBox({x:4.5,y:230,z:695},box);assert.equal(p.x,5.2);assert.equal(p.z,695);});
test('flight cannot tunnel through a thin wall at boost speed',()=>{const s=newFlight();Object.assign(s,{x:0,y:230,z:680,yaw:0,speed:28,assisted:false});for(let i=0;i<80;i++)stepFlight(s,{forward:true,boost:true},.1,[box]);assert.ok(s.z<=688.8+.0001);assert.ok(s.hits>0);});
test('follow camera shortens before a building but retains its view on an open route',()=>{const o={x:0,y:230,z:680},d={x:0,y:235,z:710},p=safeSkyCamera(o,d,[box]);assert.ok(p.z<689.5);assert.deepEqual(safeSkyCamera(o,d,[]),d);});
