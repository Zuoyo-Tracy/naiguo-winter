import {attractions} from './park-attractions.js';
import {sampleAt,TRACK_LENGTH} from './track.js';

// Full-width approach reservations are shared with the park's actual anchor/deck layout.
export function peachSceneryClearOfPark(p,radius){
 for(const a of attractions){
  const dx=a.anchor.x-a.x,dz=a.anchor.z-a.z,n=Math.hypot(dx,dz),end={x:a.x+dx/n*(a.r-7),z:a.z+dz/n*(a.r-7)};
  const vx=end.x-a.anchor.x,vz=end.z-a.anchor.z,len2=vx*vx+vz*vz,t=Math.max(0,Math.min(1,((p.x-a.anchor.x)*vx+(p.z-a.anchor.z)*vz)/len2));
  const roadY=a.anchor.y+(a.y-a.anchor.y)*t;
  if(p.y<roadY+6&&p.y+26>roadY&&Math.hypot(p.x-a.anchor.x-t*vx,p.z-a.anchor.z-t*vz)<radius+10)return false;
  if(p.y<a.y+6&&p.y+26>a.y&&Math.hypot(p.x-a.x,p.z-a.z)<a.r+radius+3)return false;
 }
 return true;
}
function checkpointPoint(s){const p=sampleAt(s);if(Math.abs(p.x)<135&&[180,270,360].some(z=>Math.abs(p.z-z)<1))p.x=Math.sign(p.x||1)*155;return p;}
export function peachGatePlacement(station){
 const original=checkpointPoint(station);
 for(const delta of [0,-32,32,-64,64,-96,96,-128,128]){
  const s=station+delta;if(s<0||s>TRACK_LENGTH)continue;
  const p=checkpointPoint(s);if(Math.abs(p.y-original.y)>3)continue;
  if(peachSceneryClearOfPark(p,27))return {...p,station:s,checkpointStation:station,shift:delta};
 }
 // Do not place a decorative gate in an access corridor when no safe nearby site exists.
 return null;
}
