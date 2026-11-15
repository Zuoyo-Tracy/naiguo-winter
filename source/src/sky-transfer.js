import * as T from 'three';
import {skyDeparture} from './sky-terminal.js';
const point=p=>new T.Vector3(p.x,p.y,p.z);
const compact=points=>points.filter((p,i)=>!i||p.distanceTo(points[i-1])>.05);
export function createSkyTransfer(from,to,{depart=false,landing=false}={}){
 const a=point(from),b=point(to),points=[a];
 if(depart)points.push(...skyDeparture.slice(1).map(p=>p.clone()));
 const last=points.at(-1);
 const approach=landing?skyDeparture.at(-1):b;
 if(landing&&last.distanceTo(approach)<=100){
  points.push(approach.clone());
 }else if(last.distanceTo(approach)>6){
  const ceiling=Math.max(last.y,approach.y)+55;
  points.push(new T.Vector3(last.x,ceiling,last.z),new T.Vector3(approach.x,ceiling,approach.z),approach.clone());
 }
 if(landing)points.push(...skyDeparture.slice(0,-1).reverse().map(p=>p.clone()));
 points.push(b);
 const curve=new T.CatmullRomCurve3(compact(points),false,'centripetal');curve.arcLengthDivisions=600;curve.updateArcLengths();
 return {curve,length:curve.getLength(),distance:0,speed:0,done:false,landing,depart,targetYaw:landing?to.yaw:undefined};
}
// An interrupted takeoff retraces only the part already flown, including the
// exact initial position; it must not climb to the sky route before returning.
export function reverseSkyDeparture(outbound,departure){
 const extent=outbound.length?outbound.distance/outbound.length:0;
 const curve={getPointAt:t=>outbound.curve.getPointAt(extent*(1-t)),getTangentAt:t=>outbound.curve.getTangentAt(extent*(1-t)).negate()};
 return {curve,length:outbound.distance,distance:0,speed:0,done:false,landing:true,depart:false,targetYaw:departure.yaw};
}
// Arc-length sampling keeps each frame bounded, including after a stalled tab.
// It also lets landing follow the same open air corridor in reverse.
export function stepSkyTransfer(transfer,pose,dt){
 if(transfer.done||!(dt>0))return;
 dt=Math.min(dt,.1);const remaining=transfer.length-transfer.distance;
 const desired=Math.min(36,Math.max(5,remaining*.8),8+transfer.distance*.35);
 transfer.speed+=(desired-transfer.speed)*(1-Math.exp(-2.5*dt));
 transfer.distance=Math.min(transfer.length,transfer.distance+transfer.speed*dt);
 const t=transfer.length?transfer.distance/transfer.length:1,p=transfer.curve.getPointAt(t),direction=transfer.curve.getTangentAt(t);
 pose.x=p.x;pose.y=p.y;pose.z=p.z;pose.speed=transfer.speed;
 let yaw=Math.atan2(direction.x,direction.z);
 if(transfer.landing&&Number.isFinite(transfer.targetYaw)){
  const blend=Math.max(0,1-(transfer.length-transfer.distance)/30);
  yaw+=Math.atan2(Math.sin(transfer.targetYaw-yaw),Math.cos(transfer.targetYaw-yaw))*blend*blend*(3-2*blend);
 }
 const delta=Math.atan2(Math.sin(yaw-pose.yaw),Math.cos(yaw-pose.yaw));pose.yaw+=delta*(1-Math.exp(-4*dt));
 transfer.done=t>=1;
 if(transfer.done)pose.speed=0;
}
