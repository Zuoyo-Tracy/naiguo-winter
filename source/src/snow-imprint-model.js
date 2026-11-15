import {cohesionSurface,gardenPaths,segmentPosition,nearbyRails} from './cohesion-layout.js';
import {carnivalWalkways} from './carnival-layout.js';
import {attractions} from './park-attractions.js';
import {festivalHubs} from './festival-layout.js';
import {projectTrack} from './track.js';

// A mark belongs to the actual snow surface, never to paving, platforms or rails.
export function snowContact(x,z,y){
 const ground=cohesionSurface(x,z);
 if(ground===undefined||Math.abs(ground-y)>.65||projectTrack(x,z).distance<14)return null;
 if([...gardenPaths,...carnivalWalkways].some(p=>segmentPosition(x,z,p).d<p.width/2+(p.shoulder||0)+.6))return null;
 if(festivalHubs.some(h=>Math.hypot(x-h.x,z-h.z)<h.r+1))return null;
 for(const a of attractions){
  if(Math.hypot(x-a.x,z-a.z)<a.r+1)return null;
  if(segmentPosition(x,z,{x1:a.x,z1:a.z,x2:a.anchor.x,z2:a.anchor.z}).d<10)return null;
 }
 if(nearbyRails(x,z).some(p=>Math.hypot(x-p.x,z-p.z)<7))return null;
 return ground;
}

export function createSnowTrail(){
 let previous=null,carried=0,previousSkin=null;
 return {reset(){previous=null;carried=0;},advance(state,{enabled=true,skin='tricycle'}={}){
  const next={x:state.x,z:state.z,y:state.groundY,yaw:state.yaw},marks=[];
  if(!enabled||state.jumpY>.08||state.falling||state.magnetic||state.status!=='running'){
   previous=null;carried=0;return marks;
  }
  if(!previous||previousSkin!==skin){previous=next;previousSkin=skin;carried=0;return marks;}
  const length=Math.hypot(next.x-previous.x,next.z-previous.z),spacing=skin==='kangaroo'?1.7:.62;
  if(length>8||Math.abs(next.y-previous.y)>2){previous=next;carried=0;return marks;}
  if(length<1e-5)return marks;
  const turn=Math.atan2(Math.sin(next.yaw-previous.yaw),Math.cos(next.yaw-previous.yaw));
  for(let distance=spacing-carried;distance<=length;distance+=spacing){
   const t=distance/length;marks.push({x:previous.x+(next.x-previous.x)*t,z:previous.z+(next.z-previous.z)*t,y:previous.y+(next.y-previous.y)*t,yaw:previous.yaw+turn*t,skin});
  }
  carried=(carried+length)%spacing;previous=next;return marks;
 }};
}
