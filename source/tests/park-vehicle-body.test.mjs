import test from 'node:test';import assert from 'node:assert/strict';
import * as park from '../src/park-rules.js';import {newRace,stepRace} from '../src/rules.js';
const a=park.attractions.find(a=>a.id==='teacups');
function support(){const sample=()=>undefined;sample.vehicleBlocked=park.parkBlocksVehicle;sample.vehicleContact=park.parkVehicleContact;return sample;}
function drive(start,input,steps=140){const s={...newRace(),groundY:a.y,status:'running',mode:'explore',hits:1,snowDone:true,...start};const world=support();for(let i=0;i<steps;i++)stepRace(s,input,1/60,0,world);return s;}
test('front wheel stops outside the visible tea deck and can reverse away without damage',()=>{const s=drive({x:a.x,z:a.z-23,yaw:0},{accelerate:true});assert.ok(a.z-s.z-1.7>=17.949,'front wheel penetrates visible deck');assert.equal(s.hits,1);assert.equal(s.status,'running');const before=s.z;for(let i=0;i<45;i++)stepRace(s,{reverse:true},1/60,0,support());assert.ok(s.z<before-1);});
test('reversing toward a ride also protects the rear cargo bed',()=>{const s=drive({x:a.x,z:a.z-23,yaw:Math.PI},{reverse:true});assert.ok(a.z-s.z-1.7>=17.949,'rear of tricycle penetrates visible deck');assert.equal(s.hits,1);});

test('side clearance uses vehicle width rather than an inflated all-direction radius',()=>{
 assert.equal(park.parkBlocksVehicle(a.x,a.z-19.5,a.x,a.z-19.4,a.y,Math.PI/2),false);
 assert.equal(park.parkBlocksVehicle(a.x,a.z-19.5,a.x,a.z-19.4,a.y,0),true);
});
test('turning toward a ride is blocked while outward rotation from overlap is allowed',()=>{
 assert.equal(park.parkBlocksVehicle(a.x,a.z+19.4,a.x,a.z+19.4,a.y,0,Math.PI/2),true);
 assert.equal(park.parkBlocksVehicle(a.x,a.z+19.4,a.x,a.z+19.4,a.y,Math.PI/2,Math.PI/3),false);
});
test('all attraction docks and entry paths accommodate the entire tricycle',()=>{for(const a of park.attractions){const e=park.parkEntrance(a),d=park.parkDock(a);let x=e.x+e.ux*10,z=e.z+e.uz*10;for(let i=1;i<=80;i++){const t=i/80,nx=e.x+e.ux*10+(d.x-e.x-e.ux*10)*t,nz=e.z+e.uz*10+(d.z-e.z-e.uz*10)*t;assert.equal(park.parkBlocksVehicle(x,z,nx,nz,a.y,e.yaw),false,a.id+' entry '+i);x=nx;z=nz;}assert.equal(park.parkBlocksVehicle(d.x,d.z,d.x,d.z,a.y,e.yaw),false,a.id+' dock');}});
test('swept full-body checks catch a high-speed crossing of a narrow lamp post',()=>{const a=park.attractions.find(a=>a.id==='carousel'),lamp=park.parkProps(a).find(p=>p.id==='lamp'),x=a.x+lamp.x,z=a.z+lamp.z;assert.equal(park.parkBlocksVehicle(x-6,z,x+6,z,a.y,Math.PI/2),true);});

test('holding forward while grazing the Ferris platform carries the rider along its side',()=>{
 const ride=park.attractions.find(a=>a.id==='ferris');
 const start={x:ride.x-24,z:ride.z-12,groundY:ride.y,yaw:.28,speed:6};
 const s={...newRace(),...start,status:'running',mode:'explore',snowDone:true};
 const world=support();
 let maxTurn=0;
 for(let i=0;i<100;i++){
  const before=s.yaw;
  stepRace(s,{parkCruise:true,safeExplore:true,accelerate:true},1/60,i/60,world);
  assert.equal(park.parkBlocksVehicle(s.x,s.z,s.x,s.z,s.groundY,s.yaw),false,'whole vehicle stays outside the platform');
  maxTurn=Math.max(maxTurn,Math.abs(s.yaw-before));
 }
 assert.ok(s.z-start.z>14,'distance alongside the platform: '+(s.z-start.z).toFixed(2)+' m');
 assert.ok(maxTurn<.05,'contact should not snap the viewpoint');
 assert.ok(s.speed>4);assert.equal(s.hits,0);
});
