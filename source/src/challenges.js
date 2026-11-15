import {sampleAt,projectTrack,modules} from './track.js';
export const speedZones=[{s:120,length:65,factor:2},{s:370,length:45,factor:4},{s:1080,length:40,factor:8},{s:1390,length:65,factor:2},{s:1870,length:55,factor:4},{s:2770,length:40,factor:8},{s:3730,length:55,factor:4},{s:4520,length:70,factor:2}];
export function speedFactor(x,z){const p=projectTrack(x,z);if(p.distance>11)return 1;return speedZones.find(a=>p.s>=a.s&&p.s<=a.s+a.length)?.factor||(modules.some(m=>m.id==='english-stone-bridge'&&Math.abs(z-m.z)<11&&Math.abs(x-m.x)<m.length*.38)?2:0)||(Math.abs(z-90)<12&&Math.abs(x)<50?2:1);}
export const approachSpeedFactor=(current,target,dt)=>target+(current-target)*Math.exp(-6*dt);
export const meteorZones=[{s:520,length:100,phase:0},{s:2200,length:100,phase:2},{s:4090,length:110,phase:4}];
export function meteorsAt(time){return meteorZones.flatMap((zone,k)=>[-6,0,6].map((offset,j)=>{const phase=((time+zone.phase+j*2)%8+8)%8,p=sampleAt(zone.s+25+j*24);return {x:p.x+Math.cos(p.yaw)*offset,z:p.z-Math.sin(p.yaw)*offset,y:p.y,phase,warning:phase<2.8,falling:phase>=2.8&&phase<3.5,impact:phase>=3.5&&phase<4,radius:3.1,id:k*3+j};}));}
// Loop approaches need an uninterrupted flat escape lane on both sides.
export const outsideLoopApproach=o=>!(Math.abs(o.x)<145&&[180,270,360].some(z=>Math.abs(o.z-z)<18));
export const dreamObstacles=Array.from({length:16},(_,i)=>{const p=sampleAt(290+i*280),offset=(i%2?1:-1)*7;return {x:p.x+Math.cos(p.yaw)*offset,z:p.z-Math.sin(p.yaw)*offset,y:p.y,r:1.5,height:4,kind:i%2?'tree':'crystal'};}).filter(outsideLoopApproach);
export const magnets=[{id:0,start:-105,end:105,z:360,base:32,radius:12,width:10,dir:1,turn:Math.PI},{id:1,start:-105,end:105,z:180,base:28,radius:13,width:10,dir:1,turn:Math.PI*2},{id:2,start:-105,end:105,z:270,base:50,radius:14,width:10,dir:-1,turn:Math.PI*2}];
export const magnet=magnets[0];
export function magneticPose(x,lateral=0,m=magnet){const u=x*m.dir,t=Math.max(0,Math.min(1,(u-m.start)/(m.id===0?110:210))),a=m.turn*(t*t*(3-2*t));return {x,y:m.base+m.radius*(1-Math.cos(a))+lateral*Math.sin(a),z:m.z+m.dir*(m.radius*Math.sin(a)+lateral*Math.cos(a)),roll:a,normal:[0,Math.cos(a),-m.dir*Math.sin(a)]};}
export function stepMagnetic(s,input,h){
 s.magnetsDone??=[];
 if(!s.magnetic){for(const m of magnets){const u=s.x*m.dir;if(!s.magnetsDone.includes(m.id)&&u>=m.start-30&&u<m.start&&Math.abs(s.z-m.z)<11){const t=(u-(m.start-30))/30,limit=10-6*t;s.z=m.z+Math.max(-limit,Math.min(limit,s.z-m.z));}}}
 if(!s.magnetic){const m=magnets.find(m=>!s.magnetsDone.includes(m.id)&&!(m.id===0&&s.magnetDone)&&Math.abs(s.z-m.z)<11&&s.x*m.dir>=m.start&&s.x*m.dir<m.start+8&&Math.sin(s.yaw)*m.dir>.7);if(m){s.magnetic=true;s.magnetId=m.id;s.magDir=m.dir;s.magnetLateral=(s.z-m.z)*m.dir;}}
 if(!s.magnetic)return false;const m=magnets[s.magnetId||0];
 s.magnetLateral+=(input.steer||0)*10*h;s.x+=s.speed*h*1.56*m.dir;
 s.magnetLateral=Math.max(-m.width/2+1,Math.min(m.width/2-1,s.magnetLateral));
 const p=magneticPose(s.x,s.magnetLateral,m);s.z=p.z;s.groundY=p.y;s.roll=p.roll;s.jumpY=0;s.yaw=m.dir*Math.PI/2;s.progress=projectTrack(s.x,m.z).s;s.factor=1;s.magnetBaseZ=m.z;
 if(s.x*m.dir>=m.end){s.magnetic=false;s.magnetsDone.push(m.id);if(m.id===0){s.magnetDone=true;s.falling=true;s.airY=p.y;s.airVy=0;s.z=m.z-s.magnetLateral;}else{s.roll=0;s.z=m.z+m.dir*s.magnetLateral;s.groundY=m.base;}}
 return true;
}


