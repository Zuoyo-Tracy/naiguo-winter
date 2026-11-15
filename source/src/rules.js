import {npcSurface} from './naifrog-layout.js';
import {parkCruiseActive,cruiseSpeed} from './park-driving.js';
import {parkSurface,parkProtected} from './park-rules.js';
import {stationSurface,stationSolids} from './station-layout.js';
import {stepSnow} from './snow-globe.js';
import {speedFactor,approachSpeedFactor,meteorsAt,dreamObstacles,stepMagnetic,outsideLoopApproach} from './challenges.js';
import {projectTrack,sampleAt,TRACK_LENGTH,modules} from './track.js';
export const checkpointDistances=Array.from({length:14},(_,i)=>(i+1)*TRACK_LENGTH/14);
export const checkpoints=checkpointDistances.map(s=>{const p=sampleAt(s);return [p.x,p.z];});
export const obstacles=Array.from({length:23},(_,i)=>{const p=sampleAt(240+i*195),offset=(i%2?1:-1)*6;return {x:p.x+Math.cos(p.yaw)*offset,z:p.z-Math.sin(p.yaw)*offset,y:p.y,r:1.4,height:2.6};}).filter(o=>outsideLoopApproach(o)&&!modules.some(m=>Math.abs(o.x-m.x)<70&&Math.abs(o.z-m.z)<20));
export const gatePosts=[];export const colliders=[...obstacles,...dreamObstacles,...stationSolids];
export const flowFactor=(vx,vz,inZone)=>inZone?2:1;
export function nextCheckpoint(index,x,z,points){if(index>=points.length)return index;return Math.hypot(x-points[index][0],z-points[index][1])<18?index+1:index;}
export function newRace(){const p=sampleAt(10);return {...p,speed:0,factor:1,cp:0,hits:0,status:'ready',reason:'',elapsed:0,groundY:p.y,jumpY:0,vy:0,jumpHeld:false,boost:false,blocked:[],impact:0,progress:10,roll:0,magnetic:false,magnetDone:false,falling:false};}
export function endRace(s,reason){if(s.status==='lost')return;s.failure={kind:reason==='冲出赛道'?'fall':'crash',speed:Math.abs(s.motionSpeed??s.speed),yaw:s.yaw};s.status='lost';s.reason=reason;s.speed=0;}
function drivingGround(x,z,road,support){
 const park=npcSurface(x,z)??parkSurface(x,z);
 if(park!==undefined)return park;
 const base=stationSurface(x,z)??(road.distance<=13?road.y:null);
 if(base===null||!support)return base;
 const sampled=support(x,z,road.y);
 return sampled===undefined?base:sampled;
}

// Remove the part of the step that enters the contact face. Test the complete
// swept body again: a tangent along one rail can still lead into a second prop.
function tryParkSlide(state,ox,oz,oldYaw,contact,dt,support){
 const dx=state.x-ox,dz=state.z-oz,into=dx*contact.nx+dz*contact.nz;
 const tx=dx-Math.min(0,into)*contact.nx,tz=dz-Math.min(0,into)*contact.nz;
 const travel=Math.hypot(dx,dz),along=Math.hypot(tx,tz);
 if(travel<1e-8||along<travel*.45)return null;

 const clearance=Math.min(travel*.02,.002);
 const x=ox+tx+contact.nx*clearance,z=oz+tz+contact.nz*clearance;
 const road=projectTrack(x,z),ground=drivingGround(x,z,road,support);
 if(ground===null||Math.abs(ground-state.groundY)>1.2)return null;
 const y=ground+state.jumpY;
 if(support.blocked?.(ox,oz,x,z,y)||support.npcBlocked?.(ox,oz,x,z,y))return null;

 const direction=Math.sign(state.speed),tangentYaw=Math.atan2(tx*direction,tz*direction);
 const angle=Math.atan2(Math.sin(tangentYaw-state.yaw),Math.cos(tangentYaw-state.yaw));
 const correction=Math.max(-1.55*dt,Math.min(1.55*dt,angle));
 let yaw=state.yaw+correction;
 const blocked=support.vehicleBlocked||support.vehicleContact;
 if(blocked(ox,oz,x,z,y,yaw,oldYaw)){
  yaw=oldYaw;
  if(blocked(ox,oz,x,z,y,yaw,oldYaw))return null;
 }
 state.x=x;state.z=z;state.yaw=yaw;
 state.speed*=Math.exp(-3*(1-along/travel)*dt);
 return {road,ground};
}
export function stepRace(s,input,dt,elapsed,support=null){
 if(s.status!=='running'){s.parkCruising=false;return;}s.elapsed=elapsed;if(stepSnow(s,input,dt)){s.parkCruising=false;return;}s.impact=Math.max(0,s.impact-dt);
 if(input.jump&&!s.jumpHeld&&s.jumpY<=.001)s.vy=10;s.jumpHeld=!!input.jump;
 // A press adds an immediate kick as well as raising acceleration and top speed.
 if(input.boost&&!s.boost&&!parkCruiseActive(s,input))s.speed=Math.max(0,s.speed)+7;s.boost=!!input.boost;
 const steps=Math.max(1,Math.ceil(dt*240)),h=dt/steps;
 for(let i=0;i<steps&&s.status==='running';i++){
 const protectedPark=!s.magnetic&&(parkProtected(s.x,s.z,s.groundY)||input.safeExplore===true);
 s.parkCruising=parkCruiseActive(s,input,protectedPark);
 const throttle=input.accelerate||input.boost?1:input.reverse?-1:0;
 if(s.parkCruising)s.speed=cruiseSpeed(s.speed,input,h);
 else{s.speed+=throttle*(input.boost?30:14)*h;s.speed*=Math.exp(-(input.brake?8:throttle?.24:1.3)*h);s.speed=Math.max(-8,Math.min(input.boost?42:24,s.speed));}
 if(stepMagnetic(s,input,h)){s.parkCruising=false;s.cp=nextCheckpoint(s.cp,s.x,s.magnetBaseZ,checkpoints);continue;}
 const oldYaw=s.yaw,turnRate=s.parkCruising?1.65:1.45,turnScale=s.parkCruising?3:8;s.yaw+=(input.steer||0)*turnRate*Math.min(Math.abs(s.speed)/turnScale,1)*Math.sign(s.speed)*h;
 s.factor=s.parkCruising?1:approachSpeedFactor(s.factor||1,speedFactor(s.x,s.z),h);
 s.motionSpeed=s.speed;const ox=s.x,oz=s.z;s.x+=Math.sin(s.yaw)*s.speed*s.factor*h*2;s.z+=Math.cos(s.yaw)*s.speed*s.factor*h*2;
 let p=projectTrack(s.x,s.z),ground=drivingGround(s.x,s.z,p,support);
 if(!s.falling&&ground!==null&&support?.npcBlocked?.(ox,oz,s.x,s.z,ground+s.jumpY)){s.x=ox;s.z=oz;s.speed=0;continue;}
 const bodyCheck=support?.vehicleContact||support?.vehicleBlocked;
 const bodyHit=!s.falling&&ground!==null&&bodyCheck?.(ox,oz,s.x,s.z,ground+s.jumpY,s.yaw,oldYaw);
 const wall=bodyHit||(!s.falling&&ground!==null&&support?.blocked?.(ox,oz,s.x,s.z,ground+s.jumpY));
 if(wall){
  const canSlide=bodyHit?.nx!==undefined&&s.mode==='explore'&&(!s.challenge||s.challenge.finished)&&!s.magnetic&&parkProtected(ox,oz,s.groundY);
  const slide=canSlide&&tryParkSlide(s,ox,oz,oldYaw,bodyHit,h,support);
  if(slide){p=slide.road;ground=slide.ground;}
  else{
   s.x=ox;s.z=oz;s.yaw=oldYaw;s.speed=0;
   if(!s.wallContact&&!protectedPark){s.hits++;s.impact=.7;if(s.hits>=2)endRace(s,'第二次撞击，车辆损毁');}
   s.wallContact=true;continue;
  }
 }
 s.wallContact=Boolean(wall);
 if(ground===null){if(input.safeExplore&&!s.falling){s.x=ox;s.z=oz;s.yaw=oldYaw;s.speed=0;s.offRoadTime=0;break;}s.offRoadTime=(s.offRoadTime||0)+h;if(s.offRoadTime>=.2||p.distance>18){endRace(s,'冲出赛道');break;}ground=s.groundY;}else{s.offRoadTime=0;}s.groundY=ground;s.progress=p.s;
 if(s.falling){s.airVy-=18*h;s.airY+=s.airVy*h;s.jumpY=Math.max(0,s.airY-ground);s.roll*=Math.exp(-4*h);if(s.airY<=ground){s.falling=false;s.roll=0;s.jumpY=0;s.vy=0;}}else {s.roll=0;s.vy-=18*h;s.jumpY=Math.max(0,s.jumpY+s.vy*h);if(!s.jumpY)s.vy=0;}
 for(let j=0;j<colliders.length;j++){const o=colliders[j],contact=o.r+1.05,d=Math.min(...[-.65,0,.65].map(t=>Math.hypot(s.x+Math.sin(s.yaw)*t-o.x,s.z+Math.cos(s.yaw)*t-o.z)));
 if(d>contact+1)s.blocked=s.blocked.filter(k=>k!==j);
 if(d<contact&&s.groundY+s.jumpY<o.y+o.height&&s.groundY+s.jumpY+2>o.y){const oldDistance=Math.min(...[-.65,0,.65].map(t=>Math.hypot(ox+Math.sin(s.yaw)*t-o.x,oz+Math.cos(s.yaw)*t-o.z)));if(s.blocked.includes(j)&&d>oldDistance+1e-9)continue;s.x=ox;s.z=oz;s.speed=0;if(!s.blocked.includes(j)){s.blocked.push(j);if(!protectedPark){s.hits++;s.impact=.7;if(s.hits>=2)endRace(s,'第二次撞击，车辆损毁');}}break;}}
 for(const m of meteorsAt(elapsed)){if(!protectedPark&&m.impact&&Math.hypot(s.x-m.x,s.z-m.z)<m.radius+1&&s.groundY+s.jumpY<m.y+6){endRace(s,'被流星击中');break;}}
 s.cp=nextCheckpoint(s.cp,s.x,s.z,checkpoints);if(s.cp===checkpoints.length&&s.mode!=='explore'&&!s.challenge){s.status='won';s.speed=0;}
 }
}


