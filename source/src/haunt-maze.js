import {hauntPose,hauntWidth,HAUNT_SCALE} from './haunt-route.js';
// Each courtyard offers two real corridors. Both rejoin; no route can strand a player.
export const hauntCourts=[
 {id:'well',start:480,end:640,title:'双月井院',left:'月门 · 追随尾痕',right:'井廊 · 查访回声',hint:'井里的声音没有换气，雪上的尾痕却一直向前。',notes:['奶鼠在雪上画了一颗歪歪的星星：“这样就不会认错我了。”','井底学你咳了一声，却慢了半拍。奶粉把井盖压住：“这次不拿它吓你。”']},
 {id:'theatre',start:1320,end:1510,title:'折影戏院',left:'竹廊 · 寻找纸鹤',right:'戏台 · 揭开替身',hint:'两条路在影壁后汇合；记住谁的影子跟得上脚步。',notes:['纸鹤肚子里藏着一行字：“不是每一句对不起，都能换来马上没关系。”奶粉读完，没有催奶鼠。','台上的影子还在嘲笑，奶粉却已停下脚步。它摘下空面具：“这句话，我以后不再说了。”']},
 {id:'garden',start:1710,end:1840,title:'归灯迷庭',left:'暖灯 · 跟随铃绳',right:'冷灯 · 辨认假门',hint:'暖灯照见铃绳，冷灯照见空门；两路都能绕回阁楼。',notes:['奶鼠隔门问：“出去以后，我不想再玩追赶了，可以吗？”奶粉答：“你说不玩，就不玩。”','门后没有奶鼠，只有一根绷直的丝线。你把假铃拆下，真正的铃声从身后传来。']}
];
export function courtAt(s){return hauntCourts.find(c=>s>=c.start&&s<=c.end);}
export function mazeOffset(s){const c=courtAt(s);if(!c)return 0;const t=(s-c.start)/(c.end-c.start);return 3.5*Math.sin(Math.PI*t)**2;}
export function mazeSide(s,choices={}){const c=courtAt(s);return c?(choices[c.id]||1):0;}
export function mazePose(s,lateral=0,choices={}){
 const point=t=>hauntPose(t,mazeOffset(t)*mazeSide(t,choices));
 const p=point(s),a=point(Math.max(0,s-.1)),b=point(Math.min(2000,s+.1));
 const yaw=Math.atan2(b.x-a.x,b.z-a.z);
 return {...p,x:p.x+Math.cos(yaw)*lateral,z:p.z-Math.sin(yaw)*lateral,yaw};
}
export function mazeSpeedFactor(s,choices){const a=mazePose(Math.max(0,s-.1),0,choices),b=mazePose(Math.min(2000,s+.1),0,choices);return Math.max(1,Math.hypot(b.x-a.x,b.z-a.z)/(Math.min(2000,s+.1)-Math.max(0,s-.1))/HAUNT_SCALE);}
export function chooseMaze(s,side){const c=hauntCourts.find(c=>c.id===s.hauntJunction);if(!s.snow||!c||Math.abs(s.hauntS-c.start)>.5||![-1,1].includes(side))return false;s.hauntChoices??={};s.hauntChoices[c.id]=side;s.hauntJunction=null;s.hauntLateral=0;return true;}
export function stepMaze(s,old,input){
 s.hauntChoices??={};
 if(s.hauntJunction&&!hauntCourts.some(c=>c.id===s.hauntJunction&&Math.abs(s.hauntS-c.start)<.6))s.hauntJunction=null;
 const returning=hauntCourts.find(c=>s.hauntChoices[c.id]&&old>c.start&&s.hauntS<=c.start);
 if(returning){s.hauntS=returning.start;s.speed=0;s.hauntLateral=0;delete s.hauntChoices[returning.id];s.hauntJunction=returning.id;return;}
 const c=hauntCourts.find(c=>!s.hauntChoices[c.id]&&old<=c.start&&s.hauntS>=c.start);
 if(c){s.hauntS=c.start;s.speed=0;s.hauntLateral=0;s.hauntJunction=c.id;if(input.steer)chooseMaze(s,Math.sign(input.steer));}
 // Short discoveries are earned by actually driving a branch, and saved into the notebook.
 const active=courtAt(s.hauntS),q=s.rescueStory;
 if(active&&q&&s.hauntS>active.start+(active.end-active.start)*.53){
  const side=s.hauntChoices[active.id],id=active.id+':'+side;
  if(side&&!q.journal.some(j=>j.id===id)){const text=active.notes[side===1?0:1];q.journal.push({id,title:active.title+' · '+(side===1?active.left:active.right),text});s.hauntDiscovery={text,until:(s.hauntTime||0)+9};}
 }
}
export function mazePaths(){
 const paths=[];let last=0;
 for(const c of hauntCourts){paths.push({start:last,end:c.start,choices:{}});for(const side of [1,-1])paths.push({start:c.start,end:c.end,choices:{[c.id]:side},court:c,side});last=c.end;}
 paths.push({start:last,end:2000,choices:{}});return paths;
}
export {hauntWidth};
