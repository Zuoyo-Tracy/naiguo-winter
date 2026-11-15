import {parkProtected} from './park-rules.js';
import {projectTrack} from './track.js';

export function parkCruiseActive(state,input,protectedArea){
 if(!(input.parkCruise===true&&state.mode==='explore'&&(!state.challenge||state.challenge.finished)
  &&!state.snow&&!state.magnetic&&!state.falling&&(protectedArea??parkProtected(state.x,state.z,state.groundY))))return false;
 const road=projectTrack(state.x,state.z);
 // Cohesion terrain sometimes covers the circuit itself. Keep racing on that
 // surface, with a two-metre buffer before re-entering touring at its edge.
 const roadClearance=state.parkCruising?13:15;
 return road.distance>roadClearance||Math.abs(road.y-state.groundY)>=2.5;
}

// Outside the pocket world the vehicle moves two world metres per speed unit.
export const parkCruiseLimits=Object.freeze({forward:60/7.2,boost:90/7.2,reverse:2.4});
export function cruiseSpeed(speed,input,dt){
 const throttle=input.accelerate||input.boost?1:input.reverse?-1:0;
 const limit=input.boost?parkCruiseLimits.boost:parkCruiseLimits.forward;
 if(speed>limit){speed=Math.max(limit,speed-14*dt);return input.brake?speed*Math.exp(-8*dt):speed;}
 if(speed<-parkCruiseLimits.reverse){speed=Math.min(-parkCruiseLimits.reverse,speed+14*dt);return input.brake?speed*Math.exp(-8*dt):speed;}
 // Reversing the travel direction should start braking straight away.
 const changingDirection=throttle*speed<0;
 const acceleration=changingDirection?15:input.boost?7.2:throttle<0?4.5:5.2;
 speed+=throttle*acceleration*dt;
 speed*=Math.exp(-(input.brake?8:throttle?.24:1.6)*dt);
 return Math.max(-parkCruiseLimits.reverse,Math.min(limit,speed));
}

export function driveSpeedKmh(state){return Math.abs(state.speed*state.factor)*(state.snow?3.6:7.2);}
