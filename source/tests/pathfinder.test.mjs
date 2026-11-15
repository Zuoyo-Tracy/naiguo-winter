import test from 'node:test';
import assert from 'node:assert/strict';
import {findGroundPath} from '../src/pathfinder.js';
const yieldWork=async()=>{};
test('ground route goes around an obstruction and never crosses a void between endpoints',async()=>{
 const sample=(x,z)=>Math.abs(x)<35&&Math.abs(z)<24&&!(Math.abs(x)<2&&z<10)?{y:0,cost:1}:null;
 const clear=(a,b)=>Array.from({length:21},(_,i)=>sample(a.x+(b.x-a.x)*i/20,a.z+(b.z-a.z)*i/20)).every(Boolean);
 const r=await findGroundPath({start:{x:-22,z:0,y:0},goals:[{x:22,z:0,y:0}],sample,clear,step:4,yieldWork});
 assert.ok(r.points.length>3);assert.ok(r.points.some(p=>p.z>=10));r.points.slice(1).forEach((p,i)=>assert.ok(clear(r.points[i],p)));
});
test('a destination on another floor cannot be reached through the floor below',async()=>{
 const r=await findGroundPath({start:{x:0,z:0,y:0},goals:[{x:8,z:0,y:20}],sample:()=>({y:0,cost:1}),clear:()=>true,yieldWork});assert.equal(r.reason,'destination');assert.deepEqual(r.points,[]);
});
test('a deferred search replans around a thin fence between otherwise open grid nodes',async()=>{
 const sample=(x,z)=>Math.abs(x)<=30&&Math.abs(z)<=20?{y:0,cost:1}:null;
 const clear=(a,b)=>{
  if((a.x-2)*(b.x-2)>=0)return true;
  const t=(2-a.x)/(b.x-a.x),crossingZ=a.z+t*(b.z-a.z);
  return crossingZ>=10;
 };
 const route=await findGroundPath({start:{x:-20,y:0,z:0},goals:[{x:20,y:0,z:0}],sample,clear,step:4,deferEdgeChecks:true,yieldWork});
 assert.ok(route.points.length>2);
 assert.ok(route.points.slice(1).every((point,i)=>clear(route.points[i],point)));
 assert.ok(route.points.some(p=>p.z>=10));
});
test('unreachable paths are bounded, and cancelled planning yields no route',async()=>{
 const base={start:{x:0,z:0,y:0},goals:[{x:1000,z:1000,y:0}],sample:()=>({y:0,cost:1}),clear:()=>true,yieldWork,maxVisited:40};
 assert.equal((await findGroundPath(base)).reason,'limit');assert.equal((await findGroundPath({...base,cancelled:()=>true})).reason,'cancelled');
});
