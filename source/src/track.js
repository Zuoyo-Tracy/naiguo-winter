import {createPolylineProjector} from './polyline-projection.js';
export const TRACK_WIDTH=24,OLD_TRACK_LENGTH=320+40*Math.PI;
const heights=[0,14,28,50,32,12];
export const route=[];let length=0;
function add(x,z,y){const prev=route.at(-1);if(prev)length+=Math.hypot(x-prev.x,z-prev.z,y-prev.y);route.push({x,z,y,s:length});}
for(let lane=0;lane<6;lane++){
 const dir=lane%2?-1:1,start=-350*dir;
 for(let i=lane?1:0;i<=140;i++)add(start+dir*i*5,lane*90,heights[lane]);
 if(lane<5){const cx=350*dir,cz=lane*90+45;for(let j=1;j<=60;j++){const t=j/60,a=-Math.PI/2+dir*Math.PI*t;add(cx+45*Math.cos(a),cz+45*Math.sin(a),heights[lane]+(heights[lane+1]-heights[lane])*(.5-.5*Math.cos(Math.PI*t)));}}
}
// Left-side arcs must bulge left; explicit correction maintains tangent continuity.
// The expression above uses decreasing angle for odd lanes, giving negative cosine.
export const TRACK_LENGTH=length;
export const trackPoints=route.map(p=>[p.x,p.z]);
export function sampleAt(s){s=Math.max(0,Math.min(length,s));let lo=0,hi=route.length-1;while(lo+1<hi){const m=(lo+hi)>>1;if(route[m].s<s)lo=m;else hi=m;}const a=route[lo],b=route[hi],t=(s-a.s)/(b.s-a.s||1);return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t,yaw:Math.atan2(b.x-a.x,b.z-a.z),s};}
export const projectTrack=createPolylineProjector(route);
export const distanceToTrack=(x,z)=>projectTrack(x,z).distance;
export const trackHeight=(x,z)=>projectTrack(x,z).y;
export const modules=[{id:'english-stone-bridge',x:-200,z:90,y:14,length:80},{id:'english-stone-bridge',x:180,z:180,y:28,length:80},{id:'english-stone-bridge',x:-180,z:360,y:32,length:80},{id:'cloud-bridge',x:0,z:90,y:14,length:100},{id:'castle-passage',x:0,z:180,y:28,length:110},{id:'palace-skybridge',x:0,z:270,y:50,length:110},{id:'castle-passage',x:0,z:360,y:32,length:110}];
export const levelPlans=[{id:1,name:'棉花糖天空王国',length:TRACK_LENGTH,status:'playable'},{id:2,name:'星海回廊',targetLength:TRACK_LENGTH,status:'planned'},{id:3,name:'月光穹顶',targetLength:TRACK_LENGTH,status:'planned'}];
