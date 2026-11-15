import {newSkiRun,stepSki} from './ski-rules.js';
import {skiPose} from './ski-layout.js';
import {skiLiftPose,liftLength} from './ski-lift.js';

export function newSkiJourney(origin,returning=false){
 const liftRoute=returning?'return':'entrance',first=skiLiftPose(0,liftRoute);
 const liftOrigin={x:origin.x,y:origin.groundY??origin.y,z:origin.z,yaw:origin.yaw??first.yaw};
 return {...newSkiRun(),phase:'ascending',liftRoute,liftOrigin,liftS:0,liftSpeed:0,liftTime:0,liftHurry:false,awaitStartRelease:false,
  liftBoardLength:Math.hypot(first.x-liftOrigin.x,first.y-liftOrigin.y,first.z-liftOrigin.z)};
}
export function skiJourneyPose(r){
 if(r.phase!=='ascending')return skiPose(r.s,r.lateral);
 if(r.liftS<r.liftBoardLength){const t=r.liftBoardLength?r.liftS/r.liftBoardLength:1,p=skiLiftPose(0,r.liftRoute),a=r.liftOrigin;return {x:a.x+(p.x-a.x)*t,y:a.y+(p.y-a.y)*t,z:a.z+(p.z-a.z)*t,yaw:Math.atan2(p.x-a.x,p.z-a.z),pitch:0};}
 return {...skiLiftPose(r.liftS-r.liftBoardLength,r.liftRoute),pitch:0};
}
export function stepSkiJourney(r,input,dt){
 if(r.phase==='ascending'){
  dt=Math.max(0,Math.min(.05,dt));r.liftTime+=dt;
  const length=liftLength(r.liftRoute)+r.liftBoardLength,remaining=length-r.liftS;
  // Slow at boarding and disembarking; the player can speed up the middle section.
  const target=r.liftS<r.liftBoardLength+5?3:Math.min(input.hurry?40:24,3+remaining*.8);
  r.liftSpeed+=(target-r.liftSpeed)*(1-Math.exp(-2.4*dt));r.liftS=Math.min(length,r.liftS+r.liftSpeed*dt);
  if(r.liftS>=length){r.phase='ready';r.liftSpeed=0;r.awaitStartRelease=true;r.message='已到山顶 · 准备好再开始滑雪';}
  return;
 }
 if(r.awaitStartRelease){if(!input.start)r.awaitStartRelease=false;return;}
 stepSki(r,input,dt);
}
