import {planParkNavigation,navigationDestination,createNavigationWorld} from './park-navigation.js';
import {planTourRoute} from './tour-route.js';
import {projectTrack,sampleAt} from './track.js';
// Long journeys use the lane-aware race route between local park approaches.
// A coarse garden grid cannot reliably resolve the narrow lanes beside meteors.
export async function planWorldNavigation(start,entry,options={}){
 const destination=navigationDestination(entry),from=projectTrack(start.x,start.z),to=projectTrack(destination.x,destination.z);
 if(Math.abs(from.s-to.s)<500||(from.distance>60&&to.distance>60))return planParkNavigation(start,entry,options);
 const points=[],world=createNavigationWorld(options.support,options.shape);let roadStart=start;
 if(from.distance>10||Math.abs(from.y-start.groundY)>3){
  const p=sampleAt(from.s),approach=await planParkNavigation(start,{category:'scenic',p:{...p,arrival:p}},options);
  if(!approach.points.length)return approach;points.push(...approach.points);const last=points.at(-1);roadStart={...last,groundY:last.y};
 }
 if(options.cancelled?.())return {reason:'cancelled',points:[]};
 const road=await planTourRoute(roadStart,{s:to.s,roadEnd:true},options);if(!road.points.length)return road;points.push(...road.points);
 const last=points.at(-1),arrival=await planParkNavigation({...last,groundY:last.y},entry,options);if(!arrival.points.length)return arrival;
 points.push(...arrival.points);const unique=points.filter((p,i)=>!i||Math.hypot(p.x-points[i-1].x,p.y-points[i-1].y,p.z-points[i-1].z)>.01);
 return {points:unique,length:unique.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p.x-unique[i].x,p.y-unique[i].y,p.z-unique[i].z),0),destination,renderGround:world.ground};
}
