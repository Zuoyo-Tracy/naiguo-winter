import test from 'node:test';
import assert from 'node:assert/strict';
import {newRace,stepRace} from '../src/rules.js';
import {parkCruiseActive,driveSpeedKmh} from '../src/park-driving.js';
import {parkSurface} from '../src/park-rules.js';
import {sampleAt} from '../src/track.js';
import {HAUNT_LIMIT} from '../src/haunt-route.js';
import {globe} from '../src/snow-globe.js';

function visitor(extra={}){
 return {...newRace(),status:'running',mode:'explore',snowDone:true,x:-50,z:780,yaw:0,groundY:parkSurface(-50,780),...extra};
}
function drive(state,input,seconds,dt=1/60){
 for(let t=0;t<seconds-1e-8;t+=dt)stepRace(state,{parkCruise:true,...input},dt,t);
 return state;
}

test('slow touring is opt-in at the physics boundary and only active for park exploration',()=>{
 const s=visitor(),input={parkCruise:true};
 assert.equal(parkCruiseActive(s,input),true);
 for(const extra of [{mode:'race'},{challenge:{finished:false}},{snow:true},{magnetic:true},{falling:true}])assert.equal(parkCruiseActive({...s,...extra},input),false,JSON.stringify(extra));
 assert.equal(parkCruiseActive({...s,challenge:{finished:true}},input),true);
 assert.equal(parkCruiseActive(s,{}),false);
 assert.equal(parkCruiseActive(s,{parkCruise:false}),false);
 const p=sampleAt(10);assert.equal(parkCruiseActive({...s,...p,groundY:p.y},input),false);
});

test('the main raceway stays fast even under park ground, with a stable border transition',()=>{
 const p=sampleAt(4480),s=visitor({...p,groundY:p.y}),input={parkCruise:true};
 assert.ok(parkSurface(s.x,s.z)!==undefined,'fixture is inside the shared park terrain');
 assert.equal(parkCruiseActive(s,input),false);
 stepRace(s,{...input,boost:true},1/60,0);assert.ok(s.speed>7);assert.equal(s.parkCruising,false);
 const border=visitor({x:84,z:464,groundY:parkSurface(84,464)});
 assert.equal(parkCruiseActive(border,input),false,'do not engage inside the outer buffer');
 assert.equal(parkCruiseActive({...border,parkCruising:true},input),true,'retain touring until reaching the inner border');
 assert.equal(parkCruiseActive({...border,z:462,parkCruising:true},input),false,'crossing onto the circuit restores racing');
 assert.equal(parkCruiseActive({...border,z:466},input),true,'departing past the buffer enables touring');
 assert.equal(parkCruiseActive({...border,z:450,groundY:32},input,true),true,'an elevated park is separate from the raceway beneath it');
});

test('park touring limits actual movement to 60 km/h, with 90 km/h Shift and gentle reverse',()=>{
 for(const [input,expected] of [[{accelerate:true},60],[{boost:true},90],[{reverse:true},17.28]]){
  const s=drive(visitor(),input,4);assert.equal(s.status,'running');assert.equal(s.parkCruising,true);
  assert.ok(Math.abs(driveSpeedKmh(s)-expected)<1e-9,JSON.stringify({input,speed:driveSpeedKmh(s)}));
  const before=s.z;stepRace(s,{parkCruise:true,...input},1/60,4);
  assert.ok(Math.abs(Math.abs(s.z-before)*60*3.6-expected)<1e-7,'speedometer matches metres actually travelled');
 }
});

test('entering the park and releasing Shift decelerate continuously without a speed snap',()=>{
 for(const start of [24,10]){
  const s=visitor({speed:start});stepRace(s,{parkCruise:true,accelerate:true},1/60,0);
  assert.ok(s.speed<start&&s.speed>start-.24,'one frame reduces speed gradually');
  drive(s,{accelerate:true},1.5);assert.equal(s.speed,60/7.2);assert.equal(s.status,'running');
 }
 const s=visitor();stepRace(s,{parkCruise:true,boost:true},1/60,0);
 assert.ok(s.speed>0&&s.speed<.13,'Shift has no seven-unit kick in a pedestrian park');
});

test('low-speed touring makes tight turns in either driving direction without spinning at rest',()=>{
 for(const speed of [1.5,-1.5]){
  const s=visitor({speed});stepRace(s,{parkCruise:true,steer:1},1/60,0);
  const distance=Math.hypot(s.x+50,s.z-780),radius=distance/Math.abs(s.yaw);
  assert.ok(radius>3.5&&radius<3.8,'turning radius '+radius);
  assert.equal(Math.sign(s.yaw),Math.sign(speed),'reverse steering follows vehicle direction');
 }
 const parked=visitor();stepRace(parked,{parkCruise:true,steer:1},.1,0);assert.equal(parked.yaw,0);
});

test('racing acceleration returns outside the park, during timed challenges, or when touring is disabled',()=>{
 const p=sampleAt(10);
 for(const [s,input] of [[visitor({...p,groundY:p.y}),{parkCruise:true}],[visitor({challenge:{finished:false}}),{parkCruise:true}],[visitor(),{parkCruise:false}]]){
  stepRace(s,{boost:true,...input},1/60,0);
  assert.ok(s.speed>7,'normal boost kick is retained');assert.equal(s.parkCruising,false);
 }
 const s=drive(visitor(),{accelerate:true},3),before=s.speed;
 Object.assign(s,p,{groundY:p.y});stepRace(s,{parkCruise:true,accelerate:true},1/60,3);
 assert.ok(s.speed>before);assert.equal(s.parkCruising,false);
});

test('cruise behaviour is stable across common frame rates',()=>{
 const a=drive(visitor(),{accelerate:true,steer:.2},2,1/60),b=drive(visitor(),{accelerate:true,steer:.2},2,1/30);
 assert.ok(Math.hypot(a.x-b.x,a.z-b.z)<1e-7);assert.ok(Math.abs(a.yaw-b.yaw)<1e-9);assert.equal(a.speed,b.speed);
});

test('the ghost-house speed limit and speedometer retain their one-metre movement scale',()=>{
 const s={...newRace(),status:'running',mode:'explore',x:globe.x,z:globe.z};
 stepRace(s,{parkCruise:true},.01,0);assert.equal(s.snow,true);
 for(let i=0;i<150;i++)stepRace(s,{parkCruise:true,boost:true},.02,i*.02);
 assert.equal(s.parkCruising,false);assert.ok(s.speed<=HAUNT_LIMIT);
 assert.equal(driveSpeedKmh({...s,speed:HAUNT_LIMIT,factor:1}),40);
 assert.equal(driveSpeedKmh({speed:6,factor:2,snow:false}),86.4);
});
