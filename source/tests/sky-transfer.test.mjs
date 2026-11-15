import test from 'node:test';
import assert from 'node:assert/strict';
import {skyLaunch,skyLaunchEntry,atSkyLaunch,skyDeparture} from '../src/sky-terminal.js';
import {createSkyTransfer,reverseSkyDeparture,stepSkyTransfer} from '../src/sky-transfer.js';
import {createNavigationWorld,planParkNavigation} from '../src/park-navigation.js';
import {sampleAt,TRACK_LENGTH} from '../src/track.js';
import {newFlight,skyStart} from '../src/sky-journey.js';
test('ferris launch is reachable on the existing ground bridge without crossing a prop',async()=>{
 const start=sampleAt(TRACK_LENGTH-10),world=createNavigationWorld();
 assert.ok(world.sample(skyLaunch.x,skyLaunch.z));
 const route=await planParkNavigation({...start,groundY:start.y},skyLaunchEntry,{yieldWork:()=>Promise.resolve()});
 assert.ok(route.points.length>2);for(let i=1;i<route.points.length;i++)assert.ok(world.clear(route.points[i-1],route.points[i]));
 assert.equal(atSkyLaunch({...skyLaunch,groundY:skyLaunch.y}),true);
 assert.equal(atSkyLaunch({...skyLaunch,groundY:skyLaunch.y+50}),false);
 assert.equal(atSkyLaunch({...start,groundY:start.y}),false);
});
test('takeoff and landing preserve position, use a visible continuous curve and work at different frame rates',()=>{
 for(const hz of [20,60,120]){
  const origin={x:skyLaunch.x+2,y:skyLaunch.y+1.5,z:skyLaunch.z-3,yaw:skyLaunch.yaw},state={...origin};
  const transfer=createSkyTransfer(origin,{x:skyStart[0],y:skyStart[1],z:skyStart[2]},{depart:true});
  assert.deepEqual(state,origin);let ticks=0;
  while(!transfer.done&&ticks++<hz*90){const before={...state};stepSkyTransfer(transfer,state,1/hz);assert.ok(Math.hypot(state.x-before.x,state.y-before.y,state.z-before.z)<=36/hz+.08);assert.ok(state.y>=origin.y-.01);}
  assert.ok(transfer.done);assert.ok(Math.hypot(state.x-skyStart[0],state.y-skyStart[1],state.z-skyStart[2])<.001);
  const landing=createSkyTransfer(state,origin,{landing:true});while(!landing.done&&ticks++<hz*180)stepSkyTransfer(landing,state,1/hz);
  assert.ok(landing.done);assert.ok(Math.hypot(state.x-origin.x,state.y-origin.y,state.z-origin.z)<.001);
 }
});
test('resume and chapter transfers never replace the current position with a distant checkpoint',()=>{
 const from=newFlight(0),to=newFlight(4),travel=createSkyTransfer(from,to);const before={...from};stepSkyTransfer(travel,from,1/60);
 assert.ok(Math.hypot(from.x-before.x,from.y-before.y,from.z-before.z)<1);assert.ok(!travel.done);assert.ok(skyDeparture.length>3);
});

test('cancelled takeoff reverses the flown corridor instead of climbing to the sky first',()=>{
 for(const seconds of [0,.5,3,6]){
  const origin={x:skyLaunch.x,y:skyLaunch.y+1.5,z:skyLaunch.z,yaw:skyLaunch.yaw},state={...origin};
  const outbound=createSkyTransfer(origin,{x:skyStart[0],y:skyStart[1],z:skyStart[2]},{depart:true});
  for(let i=0;i<seconds*60;i++)stepSkyTransfer(outbound,state,1/60);
  const turnHeight=state.y,home=reverseSkyDeparture(outbound,origin);let ticks=0;
  while(!home.done&&ticks++<6000){const previous={...state};stepSkyTransfer(home,state,1/60);assert.ok(state.y<=turnHeight+.01);assert.ok(Math.hypot(state.x-previous.x,state.y-previous.y,state.z-previous.z)<.7);}
  assert.ok(home.done);assert.ok(Math.hypot(state.x-origin.x,state.y-origin.y,state.z-origin.z)<.001);
  assert.ok(Math.abs(Math.atan2(Math.sin(state.yaw-origin.yaw),Math.cos(state.yaw-origin.yaw)))<.1);
 }
});
