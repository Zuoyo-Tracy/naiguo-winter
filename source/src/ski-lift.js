import {skiPose,SKI_LENGTH,skiMountainHeight} from './ski-layout.js';

const top=skiPose(0),bottom=skiPose(SKI_LENGTH);
const point=(x,y,z)=>({x,y,z});
const join=point(930,48,860);
// Broad flights follow the east face; avoid offsetting the tight ski hairpins,
// which would fold an uphill conveyor back on itself.
const ascent=[join,point(1000,62,740),point(1120,110,650),point(1250,188,520),point(1380,268,400),point(1460,348,280),point(1500,428,160),point(1510,496,40),point(1490,548.16,-90),point(1450,548.16,-150),point(top.x-Math.sin(top.yaw)*18,top.y+.16,top.z-Math.cos(top.yaw)*18),point(top.x,top.y+.16,top.z)];
const entrance=[point(340,32.16,642),point(340,32.16,670),point(365,34,710),point(440,36,760),point(570,36,820),point(735,42,864),join];
const returning=[point(bottom.x,bottom.y+.16,bottom.z),point(775,34,813),point(793,46,850),join];
const cat=(a,b,c,d,t)=>.5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t);
function route(controls){
 const points=[];
 for(let i=0;i<controls.length-1;i++){
  const a=controls[Math.max(0,i-1)],b=controls[i],c=controls[i+1],d=controls[Math.min(controls.length-1,i+2)],steps=Math.max(4,Math.ceil(Math.hypot(c.x-b.x,c.z-b.z)/2));
  for(let j=0;j<steps;j++){
   const t=j/steps,p=point(cat(a.x,b.x,c.x,d.x,t),b.y+(c.y-b.y)*t,cat(a.z,b.z,c.z,d.z,t));
   const last=points.at(-1);p.s=last?last.s+Math.hypot(p.x-last.x,p.y-last.y,p.z-last.z):0;points.push(p);
  }
 }
 const last=points.at(-1),end={...controls.at(-1)};end.s=last.s+Math.hypot(end.x-last.x,end.y-last.y,end.z-last.z);points.push(end);return points;
}
// Separate approach spurs share exactly the same uphill flight.
const main=route(ascent),approaches={entrance:route(entrance),return:route(returning)};
export const skiLiftRoutes=Object.fromEntries(Object.entries(approaches).map(([key,spur])=>[key,[...spur.slice(0,-1),...main.map(p=>({...p,s:p.s+spur.at(-1).s}))]]));
export const skiLiftSections=[{id:'entrance',points:approaches.entrance},{id:'return',points:approaches.return},{id:'mountain',points:main}];
export const liftLength=(kind='entrance')=>skiLiftRoutes[kind].at(-1).s;
export function liftPoseOn(points,distance){
 const s=Math.max(0,Math.min(points.at(-1).s,distance));let lo=0,hi=points.length-1;
 while(lo+1<hi){const mid=(lo+hi)>>1;if(points[mid].s<s)lo=mid;else hi=mid;}
 const a=points[lo],b=points[hi],t=(s-a.s)/(b.s-a.s||1),yaw=Math.atan2(b.x-a.x,b.z-a.z);
 return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t,yaw,s};
}
export const skiLiftPose=(distance,kind='entrance')=>liftPoseOn(skiLiftRoutes[kind],distance);
export function nearSkiLift(x,z,radius=9){return skiLiftSections.some(section=>section.points.some(p=>Math.hypot(x-p.x,z-p.z)<radius));}
export function liftSupportFloor(p){return p.x<690?31.5:skiMountainHeight(p.x,p.z);}
