// The entrance is beside the cedar forecourt. The descent occupies the mountain
// outside the conservatory, so it never crosses a building, railway or race lane.
export const skiAttraction={id:'ski',name:'云顶滑雪场',kind:'ski',category:'雪山运动',x:340,z:625,y:32,r:27,station:2,anchor:{x:340,y:31.7,z:670},duration:0,description:'从雪松前庭乘观光扶梯上山，沿途可环视或加快上山；到顶后开始约 1.3 公里的滑雪，落差 516 米。A/D 转弯，S 或 B 刹车，山脚可乘扶梯再上山。'};
const controls=[
 {x:1380,y:548,z:-120},{x:1370,y:543,z:-70},{x:1310,y:493,z:15},
 {x:1250,y:418,z:100},{x:1320,y:342,z:205},{x:1260,y:262,z:305},
 {x:1140,y:187,z:410},{x:1090,y:112,z:515},{x:970,y:58,z:620},
 {x:850,y:32,z:720},{x:790,y:32,z:790}
];
const cat=(a,b,c,d,t)=>.5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t);
export const skiRoute=[];
for(let i=0;i<controls.length-1;i++){
 const a=controls[Math.max(0,i-1)],b=controls[i],c=controls[i+1],d=controls[Math.min(controls.length-1,i+2)];
 for(let j=0;j<24;j++){const t=j/24,p={x:cat(a.x,b.x,c.x,d.x,t),z:cat(a.z,b.z,c.z,d.z,t),y:b.y+(c.y-b.y)*t};const prev=skiRoute.at(-1);p.s=prev?prev.s+Math.hypot(p.x-prev.x,p.y-prev.y,p.z-prev.z):0;skiRoute.push(p);}
}
{const p=controls.at(-1),last=skiRoute.at(-1);skiRoute.push({...p,s:last.s+Math.hypot(p.x-last.x,p.y-last.y,p.z-last.z)});}
export const SKI_LENGTH=skiRoute.at(-1).s,SKI_DROP=controls[0].y-controls.at(-1).y,SKI_HALF_WIDTH=22;
export function skiPose(distance,lateral=0){
 const s=Math.max(0,Math.min(SKI_LENGTH,distance));let lo=0,hi=skiRoute.length-1;
 while(lo+1<hi){const m=(lo+hi)>>1;if(skiRoute[m].s<s)lo=m;else hi=m;}
 const a=skiRoute[lo],b=skiRoute[hi],t=(s-a.s)/(b.s-a.s||1),dx=b.x-a.x,dz=b.z-a.z,dy=b.y-a.y,yaw=Math.atan2(dx,dz),pitch=Math.atan2(-dy,Math.hypot(dx,dz));
 return {x:a.x+dx*t+Math.cos(yaw)*lateral,y:a.y+dy*t,z:a.z+dz*t-Math.sin(yaw)*lateral,yaw,pitch,s};
}
export const skiGates=Array.from({length:12},(_,i)=>({s:110+i*(SKI_LENGTH-230)/11,lateral:[-9,8,-6,10,0,-10,6,0,9,-7,4,0][i],width:11}));
export const skiObstacles=[{s:260,lateral:12,r:2.5},{s:470,lateral:-12,r:2.6},{s:660,lateral:13,r:2.2},{s:850,lateral:-13,r:2.6}];
// A solid mountain surrounds the ski piste; only the broad groomed corridor is flat across.
export function skiMountainHeight(x,z){
 let best=Infinity,y=0,s=0;
 for(let i=1;i<skiRoute.length;i+=2){const a=skiRoute[i-1],b=skiRoute[Math.min(i+1,skiRoute.length-1)],dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz))),d=Math.hypot(x-a.x-dx*t,z-a.z-dz*t);if(d<best){best=d;y=a.y+(b.y-a.y)*t;s=a.s+(b.s-a.s)*t;}}
 const side=Math.max(0,best-24),skirt=Math.exp(-((side/105)**2)),ridge=Math.sin(s*.015)*Math.sin(best*.028)*14*Math.min(1,side/25);
 return -25+(y+25)*skirt+ridge*skirt-(best<25?.45:0);
}
