import test from 'node:test';
import assert from 'node:assert/strict';
import {createNavigationWorld,planParkNavigation,navigationDestination} from '../src/park-navigation.js';
import {parkDock,attractions} from '../src/park-rules.js';
import {globe} from '../src/snow-globe.js';
import {sampleAt} from '../src/track.js';
test('ride navigation ends at the boarding dock, never the solid ride center',()=>{
 for(const p of attractions){const end=navigationDestination({category:'ride',p}),dock=parkDock(p);assert.equal(end.x,dock.x);assert.equal(end.z,dock.z);assert.equal(end.y,p.y);assert.ok(Math.hypot(end.x-p.x,end.z-p.z)>14);}
});
test('ordinary park routes cannot accidentally enter the rescue portal',async()=>{
 const world=createNavigationWorld();assert.equal(world.sample(globe.x,globe.z),null);
 const result=await planParkNavigation(sampleAt(3980),{category:'ride',p:attractions.find(a=>a.id==='bumper')},{yieldWork:async()=>{}});assert.ok(result.points.length>2);
 for(let i=1;i<result.points.length;i++){const a=result.points[i-1],b=result.points[i];for(let j=0;j<=10;j++)assert.ok(Math.hypot(a.x+(b.x-a.x)*j/10-globe.x,a.z+(b.z-a.z)*j/10-globe.z)>9);}
});

test('the carousel approach rounds grid corners inside the collision-checked corridor',async()=>{
 const ride=attractions.find(a=>a.id==='carousel'),world=createNavigationWorld();
 const result=await planParkNavigation({x:505,z:170,y:ride.y},{category:'ride',p:ride},{yieldWork:async()=>{}});
 assert.ok(result.points.length>=3);
 let previousHeading;
 for(let i=1;i<result.points.length;i++){
  const a=result.points[i-1],b=result.points[i];
  assert.ok(world.clear(a,b),'every rounded segment must fit the vehicle');
  const heading=Math.atan2(b.x-a.x,b.z-a.z);
  if(previousHeading!==undefined){
   const change=Math.abs(Math.atan2(Math.sin(heading-previousHeading),Math.cos(heading-previousHeading)));
   assert.ok(change<Math.PI/6,'the boarding approach should not kink at grid corners');
  }
  previousHeading=heading;
 }
});
