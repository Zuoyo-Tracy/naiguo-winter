import {TRACK_LENGTH} from './track.js';
import {pushOutsideBox} from './sky-clearance.js';
export const SKY_KEY='milk-sky-post-v1';
const originalChapters=[
 {name:'展翅试投递',hint:'靠近金色信封，悬停后投递。',story:'阿迎：这封信没有写愿望，只写着「希望有人来」。我们先去敲敲门。',points:[[-180,230,700],[-60,255,780],[80,280,730]]},
 {name:'追上逃跑的邮袋',hint:'邮袋随风移动；靠近后减速，用 E 接住。',story:'邮袋自己飞走了！封口里露出一张纸：不是地址，是一份被划掉的名单。',points:[[180,310,790],[250,335,900],[100,350,990]]},
 {name:'会撒谎的钟楼',hint:'按照 月亮 → 雪花 → 星星 的顺序寻找风铃；听话的路牌未必指对路。',story:'三个路牌都说自己通向邮局。钟楼背面却刻着：月落，雪来，星归。',points:[[-50,390,1000],[-210,410,900],[-290,430,760]]},
 {name:'护送怕高的朋友',hint:'跟随纸飞机，在修补云台稳住速度；每处护送停留 3 秒。',story:'投递册被涂改过：那些「无法投递」的信，其实从未有人送过。先陪朋友走完这段风路。',points:[[-230,455,620],[-90,475,550],[80,490,610]]},
 {name:'把心愿送到家',hint:'修复三个转运信箱，把被遗忘的心愿送到极光云庭。',story:'没有太小的心愿，也没有必须独自完成的心愿。最后一封信的收件人是：今天愿意停下来帮忙的你。',points:[[200,520,690],[100,550,830],[-50,575,850]]}
];
// Expand physical coordinates, not the displayed metre counter. Preserve the existing five story chapters.
export const SKY_LAYOUT=2;
const sourceStart=[-180,230,640],flat=originalChapters.flatMap(c=>c.points);
function lengthAt(scale){let previous=sourceStart,total=0;for(const p of flat){total+=Math.hypot((p[0]-previous[0])*scale,p[1]-previous[1],(p[2]-previous[2])*scale);previous=p;}return total;}
let lo=1,hi=4;for(let i=0;i<50;i++){const mid=(lo+hi)/2;if(lengthAt(mid)<TRACK_LENGTH)lo=mid;else hi=mid;}
export const SKY_SCALE=(lo+hi)/2;
const expand=p=>[p[0]*SKY_SCALE,p[1],770+(p[2]-770)*SKY_SCALE];
export const skyStart=expand(sourceStart);
export const skyChapters=originalChapters.map(c=>({...c,points:c.points.map(expand)}));
const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
let previous=skyStart,total=0;
export const skyLegs=skyChapters.map((c,chapter)=>c.points.map((point,node)=>{
 const start=previous,length=distance(start,point),offset=total,steps=Math.max(1,Math.ceil(length/110));
 const gates=Array.from({length:steps-1},(_,i)=>{const t=(i+1)/steps;return start.map((v,k)=>v+(point[k]-v)*t);});
 previous=point;total+=length;return {chapter,node,start,end:point,length,offset,gates};
}));
export const SKY_LENGTH=total;
export const skyChapterLengths=skyLegs.map(legs=>legs.reduce((n,l)=>n+l.length,0));
const all=[skyStart,...skyChapters.flatMap(c=>c.points)];
export const skyBounds={minX:Math.min(...all.map(p=>p[0]))-160,maxX:Math.max(...all.map(p=>p[0]))+160,minZ:Math.min(...all.map(p=>p[2]))-160,maxZ:Math.max(...all.map(p=>p[2]))+160,minY:195,maxY:700};
export function readSky(storage){
 try{const s=JSON.parse(storage.getItem(SKY_KEY)),current=s?.layout===SKY_LAYOUT,result={layout:SKY_LAYOUT,completed:Math.max(0,Math.min(5,Math.trunc(s?.completed)||0)),best:current&&Array.isArray(s?.best)?s.best.slice(0,5).map(n=>Number.isFinite(n)&&n>0?n:null):[]},cp=s?.checkpoint;
 if(Number.isInteger(cp?.chapter)&&cp.chapter>=0&&cp.chapter<5&&Number.isInteger(cp.node)&&cp.node>=0&&cp.node<3){const max=skyLegs[cp.chapter][cp.node].gates.length;result.checkpoint={chapter:cp.chapter,node:cp.node,nav:current?Math.max(0,Math.min(max,Math.trunc(cp.nav)||0)):0,time:current&&Number.isFinite(cp.time)?Math.max(0,cp.time):0,hits:Number.isFinite(cp.hits)?Math.max(0,cp.hits):0,distance:current&&Number.isFinite(cp.distance)?Math.max(0,cp.distance):0,rings:current?Math.max(0,Math.trunc(cp.rings)||0):0};}return result;
 }catch{return {layout:SKY_LAYOUT,completed:0,best:[]};}
}
export function skyTarget(s){const leg=skyLegs[s.chapter][s.node],gate=!s.done&&leg.gates[s.nav||0],p=gate||leg.end,q={x:p[0],y:p[1],z:p[2],transit:!!gate};if(!gate&&s.chapter===1){q.x+=Math.sin(s.time*.25)*13;q.z+=Math.cos(s.time*.25)*13;}if(!gate&&s.chapter===3)q.x+=Math.sin(s.time*.15)*5;return q;}
export function skyProgress(s){const leg=skyLegs[s.chapter][s.node];if(s.done)return leg.offset+leg.length;const a=leg.start,b=leg.end,t=Math.max(0,Math.min(1,((s.x-a[0])*(b[0]-a[0])+(s.y-a[1])*(b[1]-a[1])+(s.z-a[2])*(b[2]-a[2]))/leg.length**2));return leg.offset+leg.length*t;}
export function newFlight(chapter=0,node=0){const p=skyLegs[chapter][node].start,q=skyLegs[chapter][node].end;return {chapter,node,nav:0,x:p[0],y:p[1],z:p[2],yaw:Math.atan2(q[0]-p[0],q[2]-p[2]),speed:0,energy:1,time:0,distance:0,rings:0,hits:0,cooldown:0,dwell:0,done:false,assisted:true,checkpoint:{x:p[0],y:p[1],z:p[2]}};}
export function flightCheckpoint(s){return {chapter:s.chapter,node:s.node,nav:s.nav||0,time:s.time,hits:s.hits,distance:s.distance,rings:s.rings};}
export function restoreFlight(cp){const s=newFlight(cp.chapter,cp.node),gate=skyLegs[cp.chapter][cp.node].gates[cp.nav-1];Object.assign(s,{nav:cp.nav,time:cp.time,hits:cp.hits,distance:cp.distance,rings:cp.rings});if(gate)Object.assign(s,{x:gate[0],y:gate[1],z:gate[2]});return s;}
export function stepFlight(s,input,dt,solids=[]){
 if(s.done||!(dt>0))return;dt=Math.min(dt,.1);s.time+=dt;s.cooldown=Math.max(0,s.cooldown-dt);
 const yawDelta=Number.isFinite(input.yawDelta)?input.yawDelta:0,lift=Number.isFinite(input.lift)?Math.max(-1,Math.min(1,input.lift)):0;
 const target=input.target||skyTarget(s),dist=Math.hypot(target.x-s.x,target.y-s.y,target.z-s.z),manual=input.left||input.right||input.up||input.down||yawDelta||lift;
 if(manual)s.assisted=false;
 let turn=(input.left?1:0)-(input.right?1:0),vertical=input.up||input.down?(input.up?1:0)-(input.down?1:0):lift,desired=input.forward?26:input.slow?5:s.speed;
 if(s.assisted){const angle=Math.atan2(target.x-s.x,target.z-s.z),delta=Math.atan2(Math.sin(angle-s.yaw),Math.cos(angle-s.yaw));s.yaw+=delta*(1-Math.exp(-3*dt));vertical=Math.max(-1,Math.min(1,(target.y-s.y)/8));desired=target.transit?26:Math.min(26,Math.max(0,(Math.hypot(target.x-s.x,target.z-s.z)-5)*1.2));}
 if(input.brake){s.assisted=false;desired=0;vertical=0;}
 const boosting=input.boost&&s.energy>.04; if(boosting)desired=42;
 s.energy=Math.max(0,Math.min(1,s.energy+dt*(boosting?-.22:.1)));
 s.yaw+=turn*1.3*dt+yawDelta;s.speed+=(desired-s.speed)*(1-Math.exp(-3*dt));
 const steps=Math.ceil(dt/.008),h=dt/steps;
 for(let i=0;i<steps;i++){
  const old={x:s.x,y:s.y,z:s.z};
  let x=s.x+Math.sin(s.yaw)*s.speed*h,z=s.z+Math.cos(s.yaw)*s.speed*h,y=s.y+vertical*12*h;
  for(const b of solids){if(b.min){const pushed=pushOutsideBox({x,y,z},b);if(pushed){({x,y,z}=pushed);s.speed*=.5;if(!s.cooldown){s.hits++;s.cooldown=1;}}continue;}const dx=x-b.x,dy=y-b.y,dz=z-b.z,d=Math.hypot(dx,dy,dz),r=b.r+1.2;if(d<r){const n=d||1;x=b.x+(d?dx/d:1)*r;y=b.y+dy/n*r;z=b.z+dz/n*r;s.speed*=.5;if(!s.cooldown){s.hits++;s.cooldown=1;}}}
  s.x=Math.max(skyBounds.minX,Math.min(skyBounds.maxX,x));s.z=Math.max(skyBounds.minZ,Math.min(skyBounds.maxZ,z));s.y=Math.max(skyBounds.minY,Math.min(skyBounds.maxY,y));s.distance=(s.distance||0)+Math.hypot(s.x-old.x,s.y-old.y,s.z-old.z);
 }
 if(input.target)return false;
 if(target.transit&&Math.hypot(target.x-s.x,target.y-s.y,target.z-s.z)<11){s.nav=(s.nav||0)+1;s.rings=(s.rings||0)+1;s.energy=Math.min(1,s.energy+.18);s.dwell=0;return true;}
 const near=Math.hypot(target.x-s.x,target.y-s.y,target.z-s.z)<11&&s.speed<9;
 s.dwell=near?s.dwell+dt:0;
 if(input.interact&&near&&(s.chapter!==3||s.dwell>=3)){s.checkpoint={x:s.x,y:s.y,z:s.z};s.node++;s.nav=0;s.dwell=0;if(s.node===3){s.node=2;s.done=true;}return true;}
 return false;
}
