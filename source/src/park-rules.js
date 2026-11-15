import {carnivalSurface} from './carnival-layout.js';
import {fishingPond} from './fishing-rules.js';
import {festivalExits,festivalSurface,festivalProtected} from './festival-layout.js';
import {sampleAt,TRACK_LENGTH} from './track.js';
import {attractions} from './park-attractions.js';
export {attractions} from './park-attractions.js';
import {cohesionSurface} from './cohesion-layout.js';
// The approach, entrance opening, dock and fence use the same bearing.
export function parkEntrance(a){
 const dx=a.anchor.x-a.x,dz=a.anchor.z-a.z,length=Math.hypot(dx,dz),ux=dx/length,uz=dz/length;
 return {x:a.x+ux*(a.r-2),z:a.z+uz*(a.r-2),y:a.y,yaw:Math.atan2(-ux,-uz),ux,uz,width:22};
}
// Fit the generated non-circular deck to the plaza: its full rotating envelope
// is 17.9486 m at this width (20.1025 m at the old 35 m width).
export const teacupLayout=Object.freeze({deckWidth:31.25,deckHeight:1.2,operatingRadius:18,boardingRadius:22,gardenX:-23.2,gardenZ:10.5,gardenWidth:5});
export function parkDock(a, {facingExit = false} = {}) {
 const entrance = parkEntrance(a);
 const radius = a.id === 'teacups' ? teacupLayout.boardingRadius : a.r - 10;
 return {
  x: a.x + entrance.ux * radius,
  z: a.z + entrance.uz * radius,
  groundY: a.y,
  yaw: facingExit ? Math.atan2(entrance.ux, entrance.uz) : entrance.yaw,
 };
}
export function parkApproachEnd(a){const e=parkEntrance(a);return {x:a.x+e.ux*(a.r-7),z:a.z+e.uz*(a.r-7)};}
export function parkProps(a){
 const e=parkEntrance(a),result=[],add=(id,x,z,width,height,depth,rotate=0)=>result.push({id,x,z,width,height,depth,rotate});
 // Keep the ticket booth in its established plaza position; the arch faces the actual access road.
 add('ticket',-10,-a.r+10,6,5,5);
 for(const side of [-1,1]){add('planter',side<0?-3:12,-a.r+(side<0?5:9),4,2.6,4);add('lamp',side*16,-a.r+14,.8,5,.8);add('bench',side*(a.r-(a.id==='teacups'?5:9)),a.id==='teacups'&&side<0?-3:3,4,1.9,1.6,-side*Math.PI/2);}
 if(a.id==='ferris'){add('clock',-28,15,3,13,3);add('prizes',29,10,8,6,5);}
 if(a.id==='carousel'){add('musicbox',25,6,4,4,3);add('candy',-24,5,8,6,5);}
 if(a.id==='teacups')add('fountain',23,-9,5,5,5);
 if(a.id==='swings')add('bandstand',0,22,10,7,8);
 if(a.id==='bumper'){add('prizes',-28,0,7,6,5);add('candy',28,0,7,6,5);}
 // Side entrances must not be obstructed by an old decoration placement.
 const entranceAngle=Math.atan2(e.ux,e.uz),panels=Math.ceil(Math.PI*2*(a.r-2)/9),opening=Math.asin(11/(a.r-2))+4.6/(a.r-2);
 for(let i=0;i<panels;i++){const angle=i/panels*Math.PI*2;if(Math.abs(Math.atan2(Math.sin(angle-entranceAngle),Math.cos(angle-entranceAngle)))<opening)continue;const exit=festivalExits[a.id]||(a.id==='bumper'?{angle:0,halfWidth:.25}:null);if(exit&&Math.abs(Math.atan2(Math.sin(angle-exit.angle),Math.cos(angle-exit.angle)))<exit.halfWidth+4.6/(a.r-2))continue;add('fence',Math.sin(angle)*(a.r-2),Math.cos(angle)*(a.r-2),9,1.8,.55,angle);}
 // Join the curved railing to the straight gate pillars without leaving drive-through gaps.
 const fence=result.filter(p=>p.id==='fence');
 for(const side of [-1,1]){
  const candidates=fence.map(p=>({p,delta:Math.atan2(Math.sin(p.rotate-entranceAngle),Math.cos(p.rotate-entranceAngle))})).filter(v=>Math.sign(v.delta)===side).sort((u,v)=>Math.abs(u.delta)-Math.abs(v.delta));
  const next=candidates[0]?.p;if(!next)continue;
  const x1=next.x-side*Math.cos(next.rotate)*4.5,z1=next.z+side*Math.sin(next.rotate)*4.5;
  const x2=e.x-a.x+side*Math.cos(entranceAngle)*10.2,z2=e.z-a.z-side*Math.sin(entranceAngle)*10.2;
  const length=Math.hypot(x2-x1,z2-z1);if(length>.15)add('fence',(x1+x2)/2,(z1+z2)/2,length,1.8,.55,Math.atan2(z1-z2,x2-x1));
 }
 const end=parkApproachEnd(a),dx=end.x-a.anchor.x,dz=end.z-a.anchor.z,length=Math.hypot(dx,dz);
 return result.filter(p=>p.id==='fence'||Math.abs((a.x+p.x-a.anchor.x)*dz-(a.z+p.z-a.anchor.z)*dx)/length>8+Math.max(p.width,p.depth)/2);
}
export const parkLayouts=attractions.map(a=>({attraction:a,entrance:parkEntrance(a),props:parkProps(a)}));

export function parkUnlocked(a,unlocked,rescued,tester=false){return tester||(unlocked>=a.station&&(!a.story||rescued));}
export function parkSurface(x,z){const annex=festivalSurface(x,z)??carnivalSurface(x,z);if(annex!==undefined)return annex;for(const a of attractions){if(Math.hypot(x-a.x,z-a.z)<a.r)return a.y;const end=parkApproachEnd(a),dx=end.x-a.anchor.x,dz=end.z-a.anchor.z,t=Math.max(0,Math.min(1,((x-a.anchor.x)*dx+(z-a.anchor.z)*dz)/(dx*dx+dz*dz)));if(Math.hypot(x-a.anchor.x-t*dx,z-a.anchor.z-t*dz)<7)return a.anchor.y+(a.y-a.anchor.y)*t;}return cohesionSurface(x,z);}
export function newBumperRound(){return {time:60,score:0,combo:0,lastHit:-10,elapsed:0,finished:false,cars:[{x:0,z:-8,yaw:0,speed:0},{x:-9,z:2,yaw:.8,speed:4},{x:8,z:4,yaw:-1.5,speed:5},{x:0,z:8,yaw:3,speed:4}],contacts:{}};}
export function stepBumpers(round,input,dt){if(round.finished)return;dt=Math.min(dt,.05);round.time=Math.max(0,round.time-dt);round.elapsed+=dt;round.finished=round.time===0;
 for(let i=0;i<round.cars.length;i++){const c=round.cars[i];if(!i){c.speed+=(input.forward?16:input.reverse?-12:0)*dt;c.speed*=Math.exp(-(input.brake?8:.65)*dt);c.speed=Math.max(-5,Math.min(10,c.speed));c.yaw+=(input.steer||0)*2.1*dt*Math.min(1,Math.abs(c.speed)/2)*Math.sign(c.speed);}else{const target=round.cars[0],desired=Math.atan2(target.x-c.x+Math.sin(round.elapsed*.7+i)*9,target.z-c.z+Math.cos(round.elapsed*.8+i)*7);c.yaw+=Math.atan2(Math.sin(desired-c.yaw),Math.cos(desired-c.yaw))*dt*.65;c.speed=5+i*.3;}
 c.x+=Math.sin(c.yaw)*c.speed*dt;c.z+=Math.cos(c.yaw)*c.speed*dt;
 if(Math.abs(c.x)>17){c.x=Math.sign(c.x)*17;c.yaw=-c.yaw;c.speed*=.55;}if(Math.abs(c.z)>11){c.z=Math.sign(c.z)*11;c.yaw=Math.PI-c.yaw;c.speed*=.55;}}
 for(let i=0;i<round.cars.length;i++)for(let j=i+1;j<round.cars.length;j++){const a=round.cars[i],b=round.cars[j],dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz);if(d>=2.6)continue;const nx=d>.001?dx/d:1,nz=d>.001?dz/d:0,push=(2.6-d)/2+.01;a.x-=nx*push;a.z-=nz*push;b.x+=nx*push;b.z+=nz*push;a.speed*=-.45;b.speed*=-.45;const key=i+'-'+j;if(!i&&round.elapsed-(round.contacts[key]??-10)>.9){round.combo=round.elapsed-round.lastHit<4?round.combo+1:1;round.score+=100+Math.min(5,round.combo-1)*25;round.lastHit=round.elapsed;round.contacts[key]=round.elapsed;}}
}
// Signed distances let a vehicle retreat even when a saved position overlaps a prop.
function boxDistance(x,z,b){const c=Math.cos(b.rotate||0),s=Math.sin(b.rotate||0),dx=x-b.x,dz=z-b.z,qx=Math.abs(dx*c-dz*s)-b.width/2,qz=Math.abs(dx*s+dz*c)-b.depth/2;return Math.hypot(Math.max(0,qx),Math.max(0,qz))+Math.min(0,Math.max(qx,qz));}
export const parkSolids=parkLayouts.map(({attraction:a,entrance:e,props})=>{
 const solids=props.map(p=>({...p,x:a.x+p.x,z:a.z+p.z,y:a.y}));
 for(const side of [-1,1])solids.push({id:'gate-post',x:e.x+Math.cos(e.yaw)*side*10.2,z:e.z-Math.sin(e.yaw)*side*10.2,y:a.y,width:1.4,depth:2,height:15,rotate:e.yaw});
 if(a.kind==='ski')for(const dx of [-2.4,2.4])solids.push({id:'ski-sign-post',x:a.x+8+dx,z:a.z+6,y:a.y,width:.35,depth:.35,height:4.4});
 // The garden arch has two columns, never an invisible wall across its opening.
 if(a.id==='teacups')for(const side of [-1,1])solids.push({id:'garden-post',x:a.x+teacupLayout.gardenX,z:a.z+teacupLayout.gardenZ+side*2.2,y:a.y,width:1,depth:.65,height:6});
 solids.push(a.kind==='ski'?{id:'ride',x:a.x,z:a.z,y:a.y,width:9,depth:9,height:4}:a.kind==='ferris'?{id:'ride',x:a.x,z:a.z,y:a.y,width:42,depth:32,height:4}:a.kind==='bumper'?{id:'ride',x:a.x,z:a.z,y:a.y,width:40,depth:28,height:4}:{id:'ride',x:a.x,z:a.z,y:a.y,r:a.kind==='ducks'?fishingPond.radius:a.kind==='teacups'?teacupLayout.operatingRadius:14,height:4});
 return {a,solids};
});
const distance=(x,z,o)=>o.r?Math.hypot(x-o.x,z-o.z)-o.r:boxDistance(x,z,o);
export function parkCollision(x,z,y){return parkSolids.some(({a,solids})=>Math.hypot(x-a.x,z-a.z)<a.r+8&&solids.some(o=>y<o.y+o.height&&y+2>o.y&&distance(x,z,o)<0));}
export function parkBlocksTravel(ox,oz,x,z,y,radius=1.05){return parkSolids.some(({a,solids})=>Math.hypot(x-a.x,z-a.z)<a.r+10&&solids.some(o=>{if(y>=o.y+o.height||y+2<=o.y)return false;const after=distance(x,z,o);return after<radius&&after<=distance(ox,oz,o)+1e-8;}));}
export function parkProtected(x,z,y){if(festivalProtected(x,z,y))return true;const ground=parkSurface(x,z);return ground!==undefined&&Math.abs(y-ground)<5;}

// Driving vehicles use their complete oriented body. The point/radius query above
// remains for NPC placement; it cannot represent a 3.4 m long tricycle.
export const defaultParkVehicle=Object.freeze({halfWidth:.891,halfLength:1.7,height:2.874});
const vehicleMargin=.08;
function vehicleClearance(x,z,yaw,shape,solid,normal){
 const c=Math.cos(yaw),s=Math.sin(yaw),halfWidth=shape.halfWidth+vehicleMargin,halfLength=shape.halfLength+vehicleMargin;
 if(solid.r){
  const dx=solid.x-x,dz=solid.z-z,lx=dx*c-dz*s,lz=dx*s+dz*c;
  const qx=Math.abs(lx)-halfWidth,qz=Math.abs(lz)-halfLength;
  if(normal){
   let nx=-Math.sign(lx)*Math.max(0,qx),nz=-Math.sign(lz)*Math.max(0,qz);
   if(nx===0&&nz===0){
    if(qx>qz)nx=lx>=0?-1:1;else nz=lz>=0?-1:1;
   }
   const length=Math.hypot(nx,nz);
   normal.nx=(nx*c+nz*s)/length;normal.nz=(-nx*s+nz*c)/length;
  }
  return Math.hypot(Math.max(0,qx),Math.max(0,qz))+Math.min(0,Math.max(qx,qz))-solid.r;
 }
 const oc=Math.cos(solid.rotate||0),os=Math.sin(solid.rotate||0),dx=solid.x-x,dz=solid.z-z;
 let separation=-Infinity;
 for(const [ax,az] of [[c,-s],[s,c],[oc,-os],[os,oc]]){
  const body=halfWidth*Math.abs(c*ax-s*az)+halfLength*Math.abs(s*ax+c*az);
  const obstacle=solid.width/2*Math.abs(oc*ax-os*az)+solid.depth/2*Math.abs(os*ax+oc*az);
  const projected=dx*ax+dz*az,gap=Math.abs(projected)-body-obstacle;
  if(gap>separation){
   separation=gap;
   if(normal){const side=projected>=0?-1:1;normal.nx=ax*side;normal.nz=az*side;}
  }
 }
 return separation;
}
function sweepVehicle(ox,oz,x,z,y,yaw,oldYaw,shape,withNormal){
 const turn=Math.atan2(Math.sin(yaw-oldYaw),Math.cos(yaw-oldYaw)),travel=Math.hypot(x-ox,z-oz);
 const steps=Math.max(1,Math.ceil(travel/.4),Math.ceil(Math.abs(turn)/.08)),dx=x-ox,dz=z-oz,lengthSquared=dx*dx+dz*dz,bodyRadius=Math.hypot(shape.halfWidth+vehicleMargin,shape.halfLength+vehicleMargin);
 for(const {a,solids} of parkSolids){
  if(Math.hypot(x-a.x,z-a.z)>a.r+10+travel+shape.halfLength)continue;
  for(const solid of solids){
   if(y>=solid.y+solid.height||y+shape.height<=solid.y)continue;
   // A circle enclosing the entire rotating body swept along this movement is a
   // conservative broad phase. Distant props cannot need the detailed SAT test.
   const radius=(solid.r||Math.hypot(solid.width,solid.depth)/2)+bodyRadius,t=Math.max(0,Math.min(1,((solid.x-ox)*dx+(solid.z-oz)*dz)/(lengthSquared||1))),nearX=ox+dx*t-solid.x,nearZ=oz+dz*t-solid.z;
   if(nearX*nearX+nearZ*nearZ>radius*radius+1e-8)continue;
   let previous=vehicleClearance(ox,oz,oldYaw,shape,solid);
   for(let i=1;i<=steps;i++){
    const t=i/steps,px=ox+dx*t,pz=oz+dz*t,angle=oldYaw+turn*t,next=vehicleClearance(px,pz,angle,shape,solid);
    // Permit motion out of an existing overlap, but never deeper into it.
    if(next<0&&next<=previous+1e-8){
     if(!withNormal)return true;
     const normal={nx:0,nz:0};
     vehicleClearance(px,pz,angle,shape,solid,normal);
     return normal;
    }
    previous=next;
   }
  }
 }
 return null;
}
export function parkBlocksVehicle(ox,oz,x,z,y,yaw=0,oldYaw=yaw,shape=defaultParkVehicle){
 return Boolean(sweepVehicle(ox,oz,x,z,y,yaw,oldYaw,shape,false));
}
export function parkVehicleContact(ox,oz,x,z,y,yaw=0,oldYaw=yaw,shape=defaultParkVehicle){
 return sweepVehicle(ox,oz,x,z,y,yaw,oldYaw,shape,true);
}
