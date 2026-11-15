export const HAUNT_LENGTH=2000,HAUNT_SCALE=.22,HAUNT_LIMIT=40/3.6;
const raw=[];for(let row=0;row<5;row++){const dir=row%2?-1:1;for(let i=row?1:0;i<=65;i++)raw.push({x:dir*(-32.5+i),z:row*14});if(row<4){const cx=32.5*dir,cz=row*14+7;for(let i=1;i<=30;i++){const a=-Math.PI/2+dir*Math.PI*i/30;raw.push({x:cx+7*Math.cos(a),z:cz+7*Math.sin(a)});}}}
let total=0;raw.forEach((p,i)=>{if(i)total+=Math.hypot(p.x-raw[i-1].x,p.z-raw[i-1].z);p.d=total;});const scale=HAUNT_LENGTH*HAUNT_SCALE/total;
export const hauntRoute=raw.map(p=>({x:2000+p.x*scale,z:p.z*scale,s:p.d/total*HAUNT_LENGTH,y:.25+.35*Math.sin(p.d/total*Math.PI*6)}));
export const hauntGates=[{s:450,name:'旧宅封门'},{s:1050,name:'回魂廊封门'},{s:1650,name:'阁楼封门'}];
export const hauntHazards=[220,660,870,1250,1450,1850].map((s,i)=>({s,side:i%2?-.7:.7,moving:i%2===0}));
export function hauntPose(s,lateral=0){s=Math.max(0,Math.min(HAUNT_LENGTH,s));let i=1;while(i<hauntRoute.length-1&&hauntRoute[i].s<s)i++;const a=hauntRoute[i-1],b=hauntRoute[i],t=(s-a.s)/(b.s-a.s||1),yaw=Math.atan2(b.x-a.x,b.z-a.z);return{x:a.x+(b.x-a.x)*t+Math.cos(yaw)*lateral,z:a.z+(b.z-a.z)*t-Math.sin(yaw)*lateral,y:a.y+(b.y-a.y)*t,yaw};}
export function hauntWidth(s){const distance=Math.min(...[760,1320,1780].map(a=>Math.abs(s-a)));const t=Math.max(0,Math.min(1,(distance-40)/25));return .95+.65*t*t*(3-2*t);}
export function ghostOffset(h,time){return h.moving?Math.sin(time*.8+h.s)*1.05:h.side;}
