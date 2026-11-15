import test from 'node:test';
import assert from 'node:assert/strict';
import {newFlight,stepFlight} from '../src/sky-journey.js';

test('pointer steering takes over the route and uses normal vertical collision resolution',()=>{
 const s=newFlight();s.y=400;s.speed=0;
 const initial={x:s.x,y:s.y,z:s.z,yaw:s.yaw};
 stepFlight(s,{yawDelta:-.12,lift:.5},.1);
 assert.equal(s.assisted,false);assert.equal(s.yaw,initial.yaw-.12);assert.ok(s.y>initial.y);
 const roof={min:{x:s.x-8,y:402,z:s.z-8},max:{x:s.x+8,y:408,z:s.z+8}};
 for(let i=0;i<60;i++)stepFlight(s,{lift:1},1/60,[roof]);
 assert.ok(s.y<=400.8,'Pointer climb cannot pass through a solid roof');
 assert.ok(s.hits>0);
});

test('keyboard altitude and braking keep priority over analog drag lift',()=>{
 const s=newFlight();s.assisted=false;s.y=400;
 stepFlight(s,{lift:1,down:true},.1);assert.ok(s.y<400);
 const y=s.y;stepFlight(s,{lift:1,brake:true},.1);assert.equal(s.y,y);
});
