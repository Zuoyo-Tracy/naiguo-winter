import {planTourRoute,pathPose,finishTourPath} from './tour-route.js';
import {yieldNavigationWork} from './pathfinder.js';
import {createNavigationWorld} from './park-navigation.js';
import {advanceTour,createLocalTourPace,tourGears} from './tour-motion.js';
import {stations} from './station-layout.js';
import {projectTrack,TRACK_LENGTH} from './track.js';
import {checkpointDistances} from './rules.js';
import {trainCollision} from './train-rules.js';
import './tour.css';

export function createTourController({getState,getSupport,getShape,isReady,onRace,onManual,unlocked}){
 const idleHint='选好目的地，点「出发」可自动领航。';
 let generation=0,plan=null,active=false,stopping=false,planning=false,gear=0,destination=null,lastMode=null,routeFailure=null,blockReason=null,message=idleHint;const motion={s:0,speed:0,waiting:false};
 const panel=document.createElement('aside');panel.className='tour-controls';panel.hidden=true;panel.innerHTML='<div class="tour-modes"><button id="mode-roam" aria-pressed="true">漫游</button><button id="mode-race" aria-pressed="false">赛车</button></div><div class="tour-drive"><label class="sr-only" for="tour-destination">漫游目的地</label><select id="tour-destination"></select><button id="tour-go">出发</button><button id="tour-stop">停止</button></div><small id="tour-message" role="status"></small>';document.body.append(panel);
 const go=panel.querySelector('#tour-go'),stop=panel.querySelector('#tour-stop'),select=panel.querySelector('select'),label=panel.querySelector('small'),roam=panel.querySelector('#mode-roam'),race=panel.querySelector('#mode-race');
 select.innerHTML='<option value="next">下一驿站</option>'+stations.map(s=>`<option value="${s.id}">${s.label.replace('起点 · ','')}</option>`).join('')+'<option value="end">赛道尽头</option>';
 const say=text=>{message=text;if(label.textContent!==text)label.textContent=text;};
 const selectedSpeed=()=>plan?.pace?.gearLimit(motion.s,gear)??tourGears[gear];
 function halt(reason,immediate=true){generation++;planning=false;active=false;stopping=false;const state=getState();if(immediate){motion.speed=0;state.speed=0;state.boost=false;}state.autoTour=false;go.disabled=false;go.textContent='出发';say(reason??(plan?'已停车 · 点出发继续':idleHint));}
 function reset(){halt(idleHint);plan=null;destination=null;motion.s=0;gear=0;routeFailure=null;}
 async function follow(entry,route){
  const state=getState();if(planning||!isReady()||state.snow||state.status!=='running'||!route?.points?.length)return false;
  const shape=getShape(),world=createNavigationWorld(getSupport(),shape);
  const raw=route.points,origin={x:state.x,y:state.groundY,z:state.z},points=[origin];
  if(Math.hypot(origin.x-raw[0].x,origin.z-raw[0].z)>3)return false;
  reset();const token=generation,shapeKey=JSON.stringify(shape);
  planning=true;go.disabled=true;say('正在准备出发…');
  let nextYield=performance.now()+8;
  try{
   for(let i=1;i<raw.length;i++){
    const a=points.at(-1),b=raw[i],n=Math.max(1,Math.ceil(Math.hypot(a.x-b.x,a.z-b.z)/.4));
    for(let j=1;j<=n;j++){
     const t=j/n,x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t,y=world.ground(x,z),p={x,y,z};
     if(!Number.isFinite(y)||!world.clear(points.at(-1),p)){
      routeFailure={reason:'guide-clearance',from:points.at(-1),to:p,inspect:world.inspect(x,z)};
      say('请从宽敞路面重新引路。');return false;
     }
     points.push(p);
     if(performance.now()>=nextYield){
      await yieldNavigationWork();
      if(token!==generation)return false;
      if(state!==getState()||shapeKey!==JSON.stringify(getShape())||route.cancelled?.()){say('已取消路线准备');return false;}
      nextYield=performance.now()+8;
     }
    }
   }
   if(points.length<2)return false;
   onManual();destination={id:entry.id,label:entry.name};
   const path=finishTourPath(points);
   plan={points:path,world,shapeKey,pace:createLocalTourPace(path)};
   Object.assign(motion,{s:0,speed:0,waiting:false});active=true;state.autoTour=true;say(`前往 ${entry.name} · 到入口自动停车`);return true;
  }finally{if(token===generation){planning=false;go.disabled=false;}}
 }
 async function depart(){
  const state=getState();if(!isReady()||state.snow||state.mode==='timed'||state.status!=='running'||planning)return;
  if(active&&!stopping){gear=Math.min(gear+1,tourGears.length-1);say(`目标 ${selectedSpeed()} km/h · 弯道与窄路自动减速`);return;}
  if(plan&&plan.shapeKey===JSON.stringify(getShape())&&destination&&Math.hypot(state.x-pathPose(plan.points,motion.s).x,state.z-pathPose(plan.points,motion.s).z)<1&&motion.s<plan.points.at(-1).d-.5){active=true;stopping=false;state.autoTour=true;say(`继续前往 ${destination.label}`);return;}
  const current=projectTrack(state.x,state.z).s;destination=select.value==='next'?(stations.find(s=>s.s>current+40)||{id:'end',s:TRACK_LENGTH,label:'赛道尽头'}):select.value==='end'?{id:'end',s:TRACK_LENGTH,label:'赛道尽头'}:stations[Number(select.value)];
  if(typeof destination.id==='number'&&destination.id>unlocked()+1){say('先前往下一驿站，逐站探索。');return;}
  if(destination.id==='end')destination={...destination,s:TRACK_LENGTH-5,roadEnd:true};
  const token=++generation;planning=true;state.speed=0;go.disabled=true;say('正在准备安全路线…');
  try{const result=await planTourRoute(state,destination,{support:getSupport(),shape:getShape(),cancelled:()=>token!==generation});if(token!==generation)return;if(!result.points.length){routeFailure={reason:result.reason,s:result.blockedS};plan=null;say(result.reason==='start'?'先移到宽敞路面，或从地图选择驿站出发。':'这段路暂时无法安全通行，请换一个驿站出发。');return;}plan=result;plan.shapeKey=JSON.stringify(getShape());routeFailure=null;Object.assign(motion,{s:0,speed:0,waiting:false});gear=0;active=true;stopping=false;state.autoTour=true;say(`前往 ${destination.label} · 点击加速可提档`);}catch(error){say('路线准备失败，请稍后再试。');console.error('Tour route:',error);}finally{if(token===generation){planning=false;go.disabled=false;}}
 }
 go.onclick=depart;stop.onclick=()=>{if(planning){halt('已取消路线准备');return;}if(active){stopping=true;say('正在平稳停车…');}else halt();};select.onchange=()=>reset();
 race.onclick=()=>{halt('选择起终点后开始赛车');onRace();};roam.onclick=()=>{halt();onManual();};
 function step(dt,{paused,enabled,keys,railTime}){
  const state=getState(),mode=state.mode==='timed'?'race':'roam';
  panel.hidden=!enabled||state.snow||state.status!=='running';
  if(mode!==lastMode){lastMode=mode;roam.setAttribute('aria-pressed',String(mode==='roam'));race.setAttribute('aria-pressed',String(mode==='race'));panel.querySelector('.tour-drive').hidden=mode==='race';if(mode==='race')halt('手动驾驶 · 挑战计时中');}
  if(paused||!enabled){if(active||planning)halt('已暂停 · 点出发继续');return false;}
  for(const option of select.options)if(/^\d$/.test(option.value))option.disabled=Number(option.value)>unlocked()+1;
  if((active||planning)&&['KeyW','KeyS','KeyA','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].some(k=>keys.has(k))){halt('已切换手动慢逛 · 点出发恢复');return false;}
  if(planning){if(keys.has('KeyB'))halt();return true;}
  if(keys.has('KeyB')&&active)stopping=true;
  if(!active||!plan||mode!=='roam'){
   if(mode==='roam'&&Math.abs(state.speed)>1)say('手动驾驶 · 点「出发」可自动领航');
   return false;
  }
  const support=getSupport(),shape=getShape(),asState=p=>({...p,groundY:p.y,jumpY:0,snow:false,status:'running'});
  const old=pathPose(plan.points,motion.s),ahead=pathPose(plan.points,motion.s+Math.max(8,motion.speed*1.4));
  const trainAhead=trainCollision(asState(old),asState(ahead),railTime,railTime+1.4);
 const blocked=(a,b)=>{blockReason=trainAhead?'train':!plan.world.clear(a,b)?'surface':support?.vehicleBlocked?.(a.x,a.z,b.x,b.z,b.y,b.yaw,a.yaw)?'structure':support?.npcBlocked?.(a.x,a.z,b.x,b.z,b.y)?'npc':null;return !!blockReason;};
  const p=advanceTour(motion,dt,{points:plan.points,gear,stopping,blocked,pace:plan.pace});
  const look=pathPose(plan.points,motion.s+Math.min(8,2+motion.speed*.10)),yaw=Math.hypot(look.x-p.x,look.z-p.z)>.02?Math.atan2(look.x-p.x,look.z-p.z):p.yaw;
  state.yaw+=Math.atan2(Math.sin(yaw-state.yaw),Math.cos(yaw-state.yaw))*(1-Math.exp(-8*dt));Object.assign(state,{x:p.x,z:p.z,groundY:p.y,speed:motion.speed/2,factor:1,jumpY:0,vy:0,roll:0,magnetic:false,falling:false,offRoadTime:0,boost:false,parkCruising:false,autoTour:true});
  state.elapsed+=dt;state.progress=projectTrack(p.x,p.z).s;state.cp=Math.max(state.cp,checkpointDistances.filter(s=>s<=state.progress).length);
  if(motion.waiting)say(trainAhead?'列车经过中 · 安全等待':'前方有障碍 · 已安全停车');else if(stopping)say('正在平稳停车…');else say(`${destination.label} · 剩余 ${Math.ceil((plan.points.at(-1).d-motion.s)/10)*10} m · ${selectedSpeed()} km/h 档`);
  go.textContent=gear===2?'最高档':'加速';
  if(motion.s>=plan.points.at(-1).d-.22){halt(`已到达 ${destination.label} · 可以慢慢逛了`);plan=null;}else if(stopping&&motion.speed<.05)halt();
  return true;
 }
 const debug=()=>({active,planning,stopping,gear,motion:{...motion},destination,message,routeFailure,blockReason,points:plan?.points||[]});
 return {step,reset,halt,depart,follow,debug,get active(){return active;},get planning(){return planning;},get revision(){return generation;}};
}

