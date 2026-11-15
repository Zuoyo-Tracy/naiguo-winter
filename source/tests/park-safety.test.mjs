import test from 'node:test';
import assert from 'node:assert/strict';
import {attractions,parkCollision,parkDock,parkEntrance,parkBlocksTravel,parkBlocksVehicle,parkProps,parkProtected,parkSurface} from '../src/park-rules.js';
import {newRace,stepRace} from '../src/rules.js';
test('after each ride the driver can hold forward through the gate for twenty metres',()=>{
 for(const attraction of attractions){
  const dock=parkDock(attraction,{facingExit:true}),dx=Math.sin(dock.yaw),dz=Math.cos(dock.yaw);
  let previous=dock;
  for(let step=.25;step<=20;step+=.25){
   const x=dock.x+dx*step,z=dock.z+dz*step,y=parkSurface(x,z);
   assert.ok(Number.isFinite(y),attraction.id+' exit should have walkable ground at '+step);
   assert.equal(parkBlocksVehicle(previous.x,previous.z,x,z,y,dock.yaw),false,attraction.id+' exit obstructed at '+step);
   previous={x,z};
  }
 }
});
test('ticket booth has a solid footprint',()=>{for(const a of attractions){const kiosk=parkProps(a).find(p=>p.id==='ticket');if(kiosk)assert.equal(parkCollision(a.x+kiosk.x,a.z+kiosk.z,a.y),true,a.id);}});
test('park collision stops the vehicle without consuming remaining life',()=>{const a=attractions[1],s={...newRace(),...parkDock(a),status:'running',mode:'explore',hits:1,snowDone:true,speed:8};const support=()=>undefined;support.blocked=()=>true;const old={x:s.x,z:s.z};stepRace(s,{accelerate:true},1/60,0,support);assert.equal(s.status,'running');assert.equal(s.hits,1);assert.equal(s.x,old.x);assert.equal(s.z,old.z);});

test('all entrances admit a full vehicle from the approach to a clear arrival dock',()=>{for(const a of attractions){const e=parkEntrance(a),dock=parkDock(a);let prev={x:e.x+e.ux*12,z:e.z+e.uz*12};for(let i=1;i<=80;i++){const t=i/80,x=e.x+e.ux*12+(dock.x-e.x-e.ux*12)*t,z=e.z+e.uz*12+(dock.z-e.z-e.uz*12)*t;assert.equal(parkBlocksTravel(prev.x,prev.z,x,z,a.y),false,a.id+' path '+i);prev={x,z};}assert.ok(parkProtected(dock.x,dock.z,a.y));assert.equal(parkProtected(dock.x,dock.z,a.y+10),false);}});
test('solid props stop approach, permit retreat and remain protected on repeated hits',()=>{for(const a of attractions){const o=parkProps(a).find(p=>p.id==='ticket');if(!o)continue;const x=a.x+o.x,z=a.z+o.z;assert.ok(parkBlocksTravel(x-6,z,x-3.9,z,a.y));assert.equal(parkBlocksTravel(x-3.8,z,x-3.9,z,a.y),false);const s={...newRace(),x:x-6,z,groundY:a.y,yaw:Math.PI/2,status:'running',mode:'explore',hits:1,snowDone:true,speed:0};const support=()=>undefined;support.blocked=parkBlocksTravel;for(let i=0;i<120;i++)stepRace(s,{accelerate:true},1/60,0,support);assert.equal(s.status,'running');assert.equal(s.hits,1);assert.ok(s.x<=x-4.04);const before=s.x;for(let i=0;i<45;i++)stepRace(s,{reverse:true},1/60,0,support);assert.ok(s.x<before-1);}});
test('ordinary race route still damages vehicle on wall impacts',()=>{const s={...newRace(),status:'running',mode:'explore',hits:1,snowDone:true,speed:8};assert.equal(parkProtected(s.x,s.z,s.groundY),false);const support=()=>undefined;support.blocked=()=>true;stepRace(s,{accelerate:true},1/60,0,support);assert.equal(s.status,'lost');});
