import {Vector3} from 'three';
import {attractions,parkApproachEnd,parkSolids} from './park-rules.js';
import {gardenPaths,segmentPosition,cohesionSurface} from './cohesion-layout.js';
import {carnivalWalkways} from './carnival-layout.js';
import {festivalHubs} from './festival-layout.js';
import {projectTrack} from './track.js';

const walks=[...gardenPaths,...carnivalWalkways];
const approaches=attractions.map(a=>{
 const end=parkApproachEnd(a);
 return {id:a.id,x1:a.anchor.x,z1:a.anchor.z,y1:a.anchor.y,x2:end.x,z2:end.z,y2:a.y};
});

// Leave room to turn between paths that meet at the same elevation.
function atJunction(point,attraction){
 const {x,y,z}=point;
 if(Math.hypot(x-attraction.x,z-attraction.z)<attraction.r+1)return true;
 const road=projectTrack(x,z);
 if(road.distance<15&&Math.abs(road.y-y)<4.5)return true;
 if(walks.some(w=>segmentPosition(x,z,w).d<w.width/2+2.5)){
  const ground=cohesionSurface(x,z);
  if(ground!==undefined&&Math.abs(ground-y)<4.5)return true;
 }
 for(const w of approaches){
  if(w.id===attraction.id)continue;
  const {d,t}=segmentPosition(x,z,w);
  if(d<9&&Math.abs(w.y1+(w.y2-w.y1)*t-y)<4.5)return true;
 }
 return festivalHubs.some(h=>h.link&&Math.abs(h.y-y)<4.5&&segmentPosition(x,z,{x1:h.link.x,z1:h.link.z,x2:h.x,z2:h.z}).d<7);
}

export function buildApproachRails(scene,attraction,beam){
 const start=new Vector3(attraction.anchor.x,attraction.anchor.y,attraction.anchor.z);
 const approachEnd=parkApproachEnd(attraction),end=new Vector3(approachEnd.x,attraction.y,approachEnd.z);
 const dx=end.x-start.x,dz=end.z-start.z,length=Math.hypot(dx,dz),yaw=Math.atan2(dx,dz);
 const up=new Vector3(0,.8,0),solids=[],samples=Math.ceil(length/2);
 for(const side of [-1,1]){
  const offset=new Vector3(dz/length*side*6.6,0,-dx/length*side*6.6);
  const foot=t=>start.clone().lerp(end,t).add(offset);
  function addRun(from,to){
   const first=foot(from),last=foot(to),span=(to-from)*length;
   const rail=beam(scene,first.clone().add(up),last.clone().add(up),.12);
   rail.name='Park approach handrail '+attraction.id;
   const posts=Math.max(1,Math.ceil(span/Math.max(7,length/10)));
   for(let p=0;p<=posts;p++){
    const base=first.clone().lerp(last,p/posts);
    beam(scene,base,base.clone().add(up),.08);
   }
   // Limit each vertical slab to a half-metre rise so a route underneath a
   // sloping bridge never inherits the height of its highest railing post.
   const parts=Math.max(1,Math.ceil(Math.abs(last.y-first.y)/.5),Math.ceil(span/14));
   for(let n=0;n<parts;n++){
    const a=first.clone().lerp(last,n/parts),b=first.clone().lerp(last,(n+1)/parts);
    solids.push({id:'approach-handrail',x:(a.x+b.x)/2,z:(a.z+b.z)/2,y:Math.min(a.y,b.y),
     width:.24,depth:span/parts+.02,height:.92+Math.abs(b.y-a.y),rotate:yaw});
   }
  }
  let runStart=null;
  for(let i=0;i<samples;i++){
   const open=atJunction(foot((i+.5)/samples),attraction);
   if(!open&&runStart===null)runStart=i/samples;
   if(open&&runStart!==null){addRun(runStart,i/samples);runStart=null;}
  }
  if(runStart!==null)addRun(runStart,1);
 }
 if(solids.length)parkSolids.push({a:{x:(start.x+end.x)/2,z:(start.z+end.z)/2,r:length/2+8},solids});
}
