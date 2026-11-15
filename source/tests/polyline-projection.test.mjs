import test from 'node:test';import assert from 'node:assert/strict';import {route,projectTrack} from '../src/track.js';import {createPolylineProjector} from '../src/polyline-projection.js';
// The pre-index exhaustive search is the oracle, independent of the bounding tree.
export function exhaustive(points,x,z){let best={distance:Infinity};for(let i=0;i<points.length-1;i++){const a=points[i],b=points[i+1],dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz||1))),px=a.x+t*dx,pz=a.z+t*dz,d=Math.hypot(x-px,z-pz);if(d<best.distance)best={distance:d,x:px,z:pz,y:a.y+t*(b.y-a.y),s:a.s+t*(b.s-a.s),yaw:Math.atan2(dx,dz)};}return best;}
test('indexed track projection exactly matches exhaustive projection on corners, lane ties and distant points',()=>{
 const samples=route.map(p=>[p.x,p.z]);for(let lane=0;lane<5;lane++)for(let x=-350;x<=350;x+=5)samples.push([x,lane*90+45]);samples.push([2000,450],[1e8,-1e8],[-1e8,1e8]);let seed=392;
 for(let i=0;i<3500;i++){seed=(seed*1664525+1013904223)>>>0;const x=seed/4294967296*2400-1200;seed=(seed*1664525+1013904223)>>>0;samples.push([x,seed/4294967296*1600-250]);}
 for(const [x,z]of samples)assert.deepEqual(projectTrack(x,z),exhaustive(route,x,z),`at ${x}, ${z}`);
});
test('overlapping levels and degenerate segments keep the earliest route segment',()=>{
 const points=Array.from({length:20},(_,i)=>({x:i%2?10:0,z:0,y:i,s:i*10})),project=createPolylineProjector(points);assert.deepEqual(project(5,2),exhaustive(points,5,2));points[1]={...points[0],y:4,s:1};const degenerate=createPolylineProjector(points);assert.deepEqual(degenerate(0,0),exhaustive(points,0,0));assert.deepEqual(createPolylineProjector([])(0,0),{distance:Infinity});
});
