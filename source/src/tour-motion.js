import {pathPose} from './tour-route.js';
import {projectTrack} from './track.js';
export const tourGears=[90,180,240];
export const parkTourGears=[36,54,72];

// A guide may join the fast circuit and then turn back into the park. Plan
// braking in distance along that same path so speed changes before a corner,
// a plaza entrance, or the boarding dock, even when the player changes gear.
export function createLocalTourPace(points){
 const length=points.at(-1).d;
 const segments=Math.max(1,Math.ceil(length/3)),spacing=length/segments||1;
 const poses=Array.from({length:segments+1},(_,i)=>pathPose(points,i*spacing));
 const park=new Uint8Array(poses.length);
 const speedsSquared=tourGears.map(()=>new Float32Array(poses.length));
 for(let i=0;i<poses.length;i++){
  const p=poses[i],road=projectTrack(p.x,p.z);
  park[i]=road.distance>=10||Math.abs(road.y-p.y)>=3;
  let limit=Infinity;
  if(park[i]&&i>0&&i<segments){
   const a=poses[i-1],b=poses[i+1];
   const incoming=Math.atan2(p.x-a.x,p.z-a.z),outgoing=Math.atan2(b.x-p.x,b.z-p.z);
   const angle=Math.abs(Math.atan2(Math.sin(outgoing-incoming),Math.cos(outgoing-incoming)));
   if(angle>.001)limit=Math.sqrt(6*spacing/angle);
  }else if(!park[i]){
   limit=tourSpeedLimit(points,i*spacing,tourGears.length-1);
  }
  for(let gear=0;gear<tourGears.length;gear++){
   const posted=(park[i]?parkTourGears:tourGears)[gear]/3.6;
   speedsSquared[gear][i]=i===segments?0:Math.min(limit,posted)**2;
  }
 }
 for(const levels of speedsSquared){
  for(let i=segments-1;i>=0;i--){
   const deceleration=park[i]||park[i+1]?6:18;
   levels[i]=Math.min(levels[i],levels[i+1]+2*deceleration*spacing);
  }
 }
 function gearLimit(distance,gear){
  const sample=Math.max(0,Math.min(segments,Math.round(distance/spacing)));
  return (park[sample]?parkTourGears:tourGears)[gear];
 }
 function targetSpeed(distance,gear){
  const index=Math.max(0,Math.min(segments,distance/spacing)),low=Math.floor(index);
  const levels=speedsSquared[gear],fraction=index-low;
  const squared=levels[low]+(levels[Math.min(segments,low+1)]-levels[low])*fraction;
  return Math.min(Math.sqrt(squared),Math.max(0,length-distance-.1)*2.7);
 }
 return {gearLimit,targetSpeed};
}
export function tourSpeedLimit(points,s,gear){
 const remaining=points.at(-1).d-s,a=pathPose(points,s),b=pathPose(points,s+12),c=pathPose(points,s+28);
 const bend=Math.abs(Math.atan2(Math.sin(c.yaw-a.yaw),Math.cos(c.yaw-a.yaw))),grade=Math.abs(c.y-a.y)/28;
 return Math.max(0,Math.min(tourGears[gear]/3.6,Math.sqrt(2*18*Math.max(0,remaining-.2)),bend>.45?13:bend>.16?23:Infinity,grade>.35?18:Infinity));
}
export function advanceTour(motion,dt,{points,gear,stopping=false,blocked=()=>false,speedCap=Infinity,pace=null}){
 // Distance is integrated in small time steps; continuous collision sweeps
 // cover each segment, even after a long frame or at the fastest gear.
 const steps=Math.max(1,Math.ceil(Math.min(dt,.1)/.012)),h=Math.min(dt,.1)/steps;
 for(let i=0;i<steps;i++){
  const limit=pace?pace.targetSpeed(motion.s,gear):tourSpeedLimit(points,motion.s,gear);
  const target=stopping?0:Math.min(speedCap,limit),accel=target>motion.speed?13:stopping?72:25;
  motion.speed+=Math.sign(target-motion.speed)*Math.min(Math.abs(target-motion.speed),accel*h);
  const nextS=Math.min(points.at(-1).d,motion.s+motion.speed*h),from=pathPose(points,motion.s),to=pathPose(points,nextS);
  if(blocked(from,to)){motion.speed=0;motion.waiting=true;return from;}
  motion.waiting=false;motion.s=nextS;
 }
 return pathPose(points,motion.s);
}
