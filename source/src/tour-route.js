import {sampleAt,projectTrack,TRACK_LENGTH} from './track.js';
import {outsideMagneticLane} from './tour-hazards.js';
export {outsideMagneticLane} from './tour-hazards.js';
import {createNavigationWorld} from './park-navigation.js';
import {findGroundPath} from './pathfinder.js';

const offsets=[0,-1.7,1.7,-3.4,3.4,-5.1,5.1,-6.8,6.8,-8.5,8.5];
const distance=(a,b)=>Math.hypot(b.x-a.x,b.z-a.z,b.y-a.y);
export function pathPose(points,s){
 s=Math.max(0,Math.min(points.at(-1).d,s));let lo=0,hi=points.length-1;
 while(lo+1<hi){const m=(lo+hi)>>1;if(points[m].d<s)lo=m;else hi=m;}
 const a=points[lo],b=points[hi],t=(s-a.d)/(b.d-a.d||1);
 return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t,yaw:Math.atan2(b.x-a.x,b.z-a.z)};
}
export function finishTourPath(raw){
 const points=[];for(const p of raw){if(points.length&&distance(points.at(-1),p)<.01)continue;points.push({...p,d:points.length?points.at(-1).d+distance(points.at(-1),p):0});}return points;
}
export async function planTourRoute(start,destination,{support,shape,cancelled=()=>false,yieldWork=()=>new Promise(r=>setTimeout(r,0))}={}){
 const runtime=createNavigationWorld(support,shape),base=createNavigationWorld(support,shape,.35),radius=(shape?Math.max(2.1,Math.hypot(shape.halfWidth+.08,shape.halfLength+.08)):2.1)+.35;
 const sample=(x,z)=>outsideMagneticLane(x,z,radius,shape?.height)?base.sample(x,z):null;
 function clear(a,b){const n=Math.ceil(distance(a,b));for(let i=0;i<=n;i++){const t=i/(n||1);if(!outsideMagneticLane(a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t,radius,shape?.height))return false;}return base.clear(a,b);}
 const world={sample,clear},from=projectTrack(start.x,start.z),to=sampleAt(destination.s),target={x:to.x,z:to.z+(destination.roadEnd?0:24),y:to.y};target.y=base.ground(target.x,target.z)??target.y;
 function refine(raw){
  if(!raw.length)return [];
  // Round corners only within verified space, then follow the actual deck
  // elevation rather than interpolating through a bridge lip or curved ramp.
  const smooth=[raw[0]];for(let i=1;i<raw.length-1;i++){const a=raw[i-1],b=raw[i],c=raw[i+1],mix=(p,q,t)=>({x:p.x+(q.x-p.x)*t,y:p.y+(q.y-p.y)*t,z:p.z+(q.z-p.z)*t});const enter=mix(b,a,.22),exit=mix(b,c,.22),curve=[enter];for(let j=1;j<=4;j++){const t=j/4,u=mix(enter,b,t),v=mix(b,exit,t);curve.push(mix(u,v,t));}if(curve.every((p,j)=>sample(p.x,p.z)&&clear(j?curve[j-1]:smooth.at(-1),p)))smooth.push(...curve);else smooth.push(b);}smooth.push(raw.at(-1));
  const grounded=[smooth[0]];for(let i=1;i<smooth.length;i++){const a=smooth[i-1],b=smooth[i],steps=Math.max(1,Math.ceil(distance(a,b)/.4));for(let j=1;j<=steps;j++){const t=j/steps,x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t;grounded.push({x,z,y:base.ground(x,z)??a.y+(b.y-a.y)*t});}}
  return finishTourPath(grounded);
 }
 if(from.distance>36||Math.abs(from.y-start.groundY)>4){const r=await findGroundPath({start:{...start,y:start.groundY},goals:[target],...world,cancelled,yieldWork});return {...r,points:refine(r.points),world:runtime};}
 const span=Math.abs(destination.s-from.s),direction=Math.sign(destination.s-from.s)||1,count=Math.max(1,Math.ceil(span/8));let previous=[],layers=[];
 for(let row=0;row<=count;row++){
  if(cancelled())return {reason:'cancelled',points:[]};
  const s=from.s+direction*span*row/count,p=sampleAt(s),current=[];
  for(const offset of offsets){const x=p.x+Math.cos(p.yaw)*offset,z=p.z-Math.sin(p.yaw)*offset,v=sample(x,z);if(!v||Math.abs(v.y-p.y)>2.4)continue;const next={x,z,y:v.y,offset,s,cost:Infinity,parent:null};
   if(row===0){const origin={x:start.x,z:start.z,y:start.groundY};if(clear(origin,next)){next.cost=distance(origin,next)+Math.abs(offset)*.2;next.parent=origin;}}
   else for(const old of previous){if(Math.abs(offset-old.offset)>3.5)continue;const cost=old.cost+distance(old,next)+Math.abs(offset)*.03+(offset-old.offset)**2*1.2;if(cost<next.cost&&clear(old,next)){next.cost=cost;next.parent=old;}}
   if(Number.isFinite(next.cost))current.push(next);
  }
  if(!current.length)return {reason:'blocked',blockedS:s,points:[],visited:row};
  previous=current;layers.push(current);if(row%16===0)await yieldWork();
 }
 const last=previous.sort((a,b)=>a.cost-b.cost).find(p=>clear(p,target));if(!last)return {reason:'station-approach',points:[]};
 const raw=[target];let cursor=last;while(cursor){raw.push({x:cursor.x,y:cursor.y,z:cursor.z});cursor=cursor.parent;}raw.reverse();
 return {points:refine(raw),world:runtime,visited:layers.length,destination};
}

