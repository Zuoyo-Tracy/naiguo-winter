import {mazePose,mazeSpeedFactor,stepMaze} from './haunt-maze.js';
import {stepRescue} from './rescue-story.js';
import {projectTrack} from './track.js';import {HAUNT_LENGTH,HAUNT_LIMIT,hauntGates,hauntHazards,hauntPose,hauntWidth,ghostOffset} from './haunt-route.js';
// The optional story entrance belongs in its own forecourt, clear of the race lane.
export const globe={x:225,z:485,y:12,centerX:2000,radius:12};export const seals=[];
export function stepSnow(s,input,dt){
 // The optional interior streams after the road. Stop safely at its entrance
 // until scenery and actors are ready rather than entering an empty chapter.
 if(!s.snow&&!s.snowDone&&input.hauntReady===false&&Math.hypot(s.x-globe.x,s.z-globe.z)<9){s.speed=0;s.boost=false;return true;}
 if(!s.snow&&!s.snowDone&&Math.hypot(s.x-globe.x,s.z-globe.z)<9){s.rescueStory=null;s.storyJournalOpen=false;s.pinkRescued=false;s.mouseRescued=false;s.rescueObjective="";s.snow=true;s.hauntS=0;s.hauntLateral=0;s.seal=0;s.snowReturn={x:globe.x-22,z:globe.z,y:12};s.speed=0;s.jumpY=0;s.roll=0;s.magnetic=false;s.hauntTime=0;s.hauntChoices={};s.hauntJunction=null;s.hauntDiscovery=null;}
 if(!s.snow)return false;if(s.rescueStory?.dialog||s.storyJournalOpen){s.speed=0;return true;}s.hauntTime=(s.hauntTime||0)+dt;s.factor=1;s.boost=false;s.impact=Math.max(0,(s.impact||0)-dt);s.hauntMessage='';
 const throttle=input.accelerate||input.boost?1:input.reverse?-1:0;s.speed=Math.max(-3,Math.min(HAUNT_LIMIT,(s.speed+throttle*7*dt)*Math.exp(-(input.brake?8:throttle?.12:1.4)*dt)));
 // Positive steering and route lateral both point left in the forward-facing camera.
 const old=s.hauntS;s.hauntLateral+=(input.steer||0)*1.3*dt;const width=hauntWidth(old)-.25;if(Math.abs(s.hauntLateral)>width){s.hauntLateral=Math.sign(s.hauntLateral)*width;s.speed*=Math.exp(-5*dt);s.hauntMessage='窄廊 · 放慢速度';}
 s.hauntS=Math.max(0,Math.min(HAUNT_LENGTH,old+s.speed*dt/mazeSpeedFactor(old,s.hauntChoices)));stepMaze(s,old,input);const gate=hauntGates[s.seal];s.snowNear=!!gate&&Math.abs(s.hauntS-gate.s)<18;if(s.snowNear){s.hauntMessage=gate.name+' · 完成当前调查以开门';}
 if(gate&&s.seal<hauntGates.length&&hauntGates[s.seal]===gate&&s.hauntS>=gate.s-2){s.hauntS=gate.s-2;s.speed=0;}
 for(const h of hauntHazards){if(Math.abs(s.hauntS-h.s)<5&&!(Math.abs(old-h.s)<5&&Math.abs(s.hauntS-h.s)>Math.abs(old-h.s))&&Math.abs(s.hauntLateral-ghostOffset(h,s.hauntTime))<.48){s.hauntS=old;s.speed=0;s.hauntMessage='纸影挡路 · A/D 从旁绕过';s.impact=.12;}}
 stepRescue(s,input);
 const p=mazePose(s.hauntS,s.hauntLateral,s.hauntChoices);Object.assign(s,{x:p.x,z:p.z,yaw:p.yaw,groundY:p.y,jumpY:0,roll:0});
 if(s.hauntS>=HAUNT_LENGTH&&s.seal===hauntGates.length&&s.mouseRescued&&s.rescueStory?.ending){s.snow=false;s.snowDone=true;s.x=s.snowReturn.x;s.z=s.snowReturn.z;s.groundY=12;s.yaw=-Math.PI/2;s.speed=6;s.progress=projectTrack(s.x,s.z).s;}
 return true;
}
