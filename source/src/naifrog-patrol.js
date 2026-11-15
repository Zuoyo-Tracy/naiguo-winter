import {parkSurface,parkBlocksTravel} from './park-rules.js';
import {stationSurface} from './station-layout.js';
import {npcSurface,npcPlacements} from './naifrog-layout.js';
import {railClearanceSamples} from './train-rules.js';
export function patrolPointSafe(n,x,z){
 const y=npcSurface(x,z)??parkSurface(x,z)??stationSurface(x,z);
 if(y===undefined||Math.abs(y-n.y)>.2||parkBlocksTravel(x,z,x,z,n.y,(n.radius||1.1)+.25))return false;
 if(npcPlacements.some(p=>p.id!==n.id&&Math.abs(p.y-n.y)<3&&Math.hypot(p.x-x,p.z-z)<3.3))return false;
 return !railClearanceSamples.some(p=>Math.abs(p.y-n.y)<6&&Math.hypot(p.x-x,p.z-z)<5.8);
}
export function createPatrol(n){
 if(!['welcome','traveler','santa','photographer','cheerer'].includes(n.kind))return null;
 for(const angle of [0,Math.PI/2,Math.PI/4,-Math.PI/4]){const dx=Math.sin(angle),dz=Math.cos(angle);if(Array.from({length:17},(_,i)=>(i/8-1)*1.8).every(t=>patrolPointSafe(n,n.x+dx*t,n.z+dz*t)))return {x:n.x,z:n.z,dx,dz,t:0,direction:1};}
 return null;
}
export function advancePatrol(n,dt,player,people,paused=false){
 const p=n.patrol;if(!p||paused||Math.hypot(player.x-n.x,player.z-n.z)<9)return false;
 const t=Math.max(-1.8,Math.min(1.8,p.t+p.direction*Math.min(dt,.05)*.65)),x=p.x+p.dx*t,z=p.z+p.dz*t;
 if(people.some(o=>o!==n&&Math.abs(o.y-n.y)<3&&Math.hypot(o.x-x,o.z-z)<(n.radius||1)+(o.radius||1)+.5)){p.direction*=-1;return false;}
 n.x=x;n.z=z;n.walkYaw=Math.atan2(p.dx*p.direction,p.dz*p.direction);p.t=t;if(Math.abs(t)>=1.8)p.direction*=-1;return true;
}
