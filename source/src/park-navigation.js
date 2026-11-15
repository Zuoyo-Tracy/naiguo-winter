import {findGroundPath,yieldNavigationWork} from './pathfinder.js';
import {projectTrack} from './track.js';
import {parkSurface,parkDock,parkSolids} from './park-rules.js';
import {stationSurface} from './station-layout.js';
import {npcSurface,npcPlacements} from './naifrog-layout.js';
import {gardenPaths,segmentPosition} from './cohesion-layout.js';
import {carnivalWalkways} from './carnival-layout.js';
import {colliders} from './rules.js';
import {globe} from './snow-globe.js';
import {outsideMagneticLane} from './tour-hazards.js';
const pavedWalkways=[...gardenPaths,...carnivalWalkways];
function solidDistance(x,z,o){if(o.r)return Math.hypot(x-o.x,z-o.z)-o.r;const c=Math.cos(o.rotate||0),s=Math.sin(o.rotate||0),dx=x-o.x,dz=z-o.z,qx=Math.abs(dx*c-dz*s)-o.width/2,qz=Math.abs(dx*s+dz*c)-o.depth/2;return Math.hypot(Math.max(0,qx),Math.max(0,qz))+Math.min(0,Math.max(qx,qz));}
export function navigationDestination(entry){const p=entry.category==='ride'?parkDock(entry.p):entry.p.arrival||entry.p;return {...p,y:p.groundY??p.y};}
export function createNavigationWorld(support,shape,clearance=0){
 const radius=(shape?Math.max(2.1,Math.hypot(shape.halfWidth+.08,shape.halfLength+.08)):2.1)+clearance,height=shape?.height||3;
 const cells=new Map(),obstacles=[...colliders,...parkSolids.flatMap(g=>g.solids),...npcPlacements.map(n=>({x:n.x,z:n.z,y:n.y,r:3.4,height:3.2}))];
 for(const o of obstacles){const r=(o.r||Math.hypot(o.width,o.depth)/2)+radius;for(let ix=Math.floor((o.x-r)/24);ix<=Math.floor((o.x+r)/24);ix++)for(let iz=Math.floor((o.z-r)/24);iz<=Math.floor((o.z+r)/24);iz++){const key=ix+','+iz;if(!cells.has(key))cells.set(key,[]);cells.get(key).push(o);}}
 function ground(x,z){const park=npcSurface(x,z)??parkSurface(x,z);if(park!==undefined)return park;const station=stationSurface(x,z),p=projectTrack(x,z);if(station===undefined&&p.distance>12.5)return undefined;return support?.(x,z,p.y)??station??p.y;}
 function safeGround(x,z){
  if(x < -650||x > 680||z < -30||z > 1100)return null;
  if(!outsideMagneticLane(x,z,radius,height))return null;
  // Passing the rescue portal starts another scene. It is not a shortcut
  // through the park, even when its trigger has no solid collision shape.
  if(Math.hypot(x-globe.x,z-globe.z)<9+radius)return null;
  const y=ground(x,z);if(!Number.isFinite(y))return null;
  for(const [dx,dz] of [[radius,0],[-radius,0],[0,radius],[0,-radius]]){const edge=ground(x+dx,z+dz);if(!Number.isFinite(edge)||Math.abs(edge-y)>2.4)return null;}
  for(const o of cells.get(Math.floor(x/24)+','+Math.floor(z/24))||[])if(y<o.y+o.height&&y+height>o.y&&solidDistance(x,z,o)<radius)return null;
  return y;
 }
 function sample(x,z){
  const y=safeGround(x,z);
  if(y===null)return null;
  const paved=projectTrack(x,z).distance<10||pavedWalkways.some(w=>segmentPosition(x,z,w).d<w.width/2);
  return {y,cost:paved?1:1.32};
 }
 function clear(a,b){
  // Use the same deck-lip allowance for a whole route edge and its runtime
  // substeps. Otherwise a route accepted at 6 m is rejected at 0.4 m.
  const length=Math.hypot(b.x-a.x,b.z-a.z);if(Math.abs(b.y-a.y)>Math.max(1.2,length*.65))return false;
  const steps=Math.max(1,Math.ceil(length/.45));let prev=a;
  for(let i=1;i<=steps;i++){const t=i/steps,x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t,y=safeGround(x,z);if(y===null||Math.abs(y-prev.y)>Math.max(1.2,length/steps*.7))return false;const next={x,z,y};if(support?.blocked?.(prev.x,prev.z,x,z,y))return false;prev=next;}
  return true;
 }
 function inspect(x,z){const y=ground(x,z);return {sample:sample(x,z),ground:y,radius,edges:[[radius,0],[-radius,0],[0,radius],[0,-radius]].map(([dx,dz])=>({x:x+dx,z:z+dz,y:ground(x+dx,z+dz)})),overlaps:(cells.get(Math.floor(x/24)+','+Math.floor(z/24))||[]).filter(o=>y<o.y+o.height&&y+height>o.y&&solidDistance(x,z,o)<radius)};}
 return {sample,clear,ground,inspect};
}
export async function planParkNavigation(start,entry,{support,shape,cancelled=()=>false,yieldWork=yieldNavigationWork}={}){
 const world=createNavigationWorld(support,shape,.35),p=navigationDestination(entry),goals=[];
 // End near people, never directly inside an NPC or a ride mechanism.
 for(const r of entry.category==='friend'?[6.2,7.2]:[0,2,4])for(let i=0;i<(r?8:1);i++)goals.push({x:p.x+Math.sin(i*Math.PI/4)*r,z:p.z+Math.cos(i*Math.PI/4)*r,y:p.y});
 const result=await findGroundPath({start:{...start,y:start.groundY??start.y},goals,...world,deferEdgeChecks:true,cancelled,yieldWork});
 const points=await smoothParkRoute(result.points,world,cancelled,yieldWork);
 if(cancelled())return {reason:'cancelled',points:[]};
 const length=points.reduce((total,point,i)=>i?total+Math.hypot(point.x-points[i-1].x,point.y-points[i-1].y,point.z-points[i-1].z):0,0);
 return {...result,points,length,destination:p,renderGround:world.ground};
}

// The grid supplies the safe corridor. Remove its stair steps, then round the
// remaining corners only when the complete vehicle can sweep through the arc.
async function smoothParkRoute(route,world,cancelled,yieldWork){
 if(route.length<3)return route;
 const span=(a,b)=>Math.hypot(b.x-a.x,b.z-a.z);
 function distanceFromChord(point,a,b){
  const dx=b.x-a.x,dz=b.z-a.z;
  const t=Math.max(0,Math.min(1,((point.x-a.x)*dx+(point.z-a.z)*dz)/(dx*dx+dz*dz||1)));
  return Math.hypot(point.x-a.x-t*dx,point.z-a.z-t*dz);
 }
 const corners=[route[0]];
 let start=0,nextYield=performance.now()+8;
 async function pause(){await yieldWork();nextYield=performance.now()+8;}
 while(start<route.length-1){
  let end=start+1;
  for(let next=start+2;next<route.length&&span(route[start],route[next])<38;next++){
   if(route.slice(start+1,next).some(p=>distanceFromChord(p,route[start],route[next])>3))break;
   if(world.clear(route[start],route[next]))end=next;
  }
  corners.push(route[end]);start=end;
  if(performance.now()>=nextYield)await pause();
  if(cancelled())return [];
 }
 const smooth=[corners[0]];
 const mix=(a,b,t)=>({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t});
 for(let i=1;i<corners.length-1;i++){
  const a=corners[i-1],b=corners[i],c=corners[i+1];
  const cut=Math.min(7,.4*span(a,b),.4*span(b,c));
  if(cut<.3){smooth.push(b);continue;}
  const enter=mix(b,a,cut/span(a,b)),exit=mix(b,c,cut/span(b,c)),arc=[];
  const pieces=Math.ceil(2*cut/1.2);
  for(let j=0;j<=pieces;j++){
   const t=j/pieces,p=mix(mix(enter,b,t),mix(b,exit,t),t);
   p.y=world.ground(p.x,p.z);
   if(!Number.isFinite(p.y)||!world.clear(arc.at(-1)??smooth.at(-1),p))break;
   arc.push(p);
  }
  if(arc.length===pieces+1&&world.clear(arc.at(-1),c))smooth.push(...arc);
  else smooth.push(b);
  if(performance.now()>=nextYield)await pause();
  if(cancelled())return [];
 }
 smooth.push(corners.at(-1));
 return smooth;
}
