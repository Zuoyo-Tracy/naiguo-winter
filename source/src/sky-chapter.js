import {skyActivities,activityKinds,readActivities,SKY_ACTIVITY_KEY,outingApproach,advanceApproach} from './sky-activities.js';
import {createSkyActivityUI} from './sky-activity-ui.js';
import {safeSkyCamera} from './sky-clearance.js';
import {createSkyPointerControls} from './sky-controls.js';
import {atSkyLaunch,launchDistance,skyLaunchEntry} from './sky-terminal.js';
import {createSkyTransfer,reverseSkyDeparture,stepSkyTransfer} from './sky-transfer.js';
import * as T from 'three';
import {loadAngel} from './angel-model.js';
import {buildSkyWorld} from './sky-world.js';
import {SKY_KEY,skyChapters,readSky,newFlight,skyTarget,stepFlight,SKY_LENGTH,skyChapterLengths,skyLegs,skyStart,skyProgress,flightCheckpoint,restoreFlight} from './sky-journey.js';
import './sky-chapter.css';
export function createSkyChapter({scene,camera,storage,unlocked,available,getGroundPose,onGuide,sensitivity=()=>1,clear,onStart,onExit,onAward}){
 const outingProgress=readActivities(storage);let outing=null,outingPath=[];const progress=readSky(storage);let flight=null,world=null,actor=null,loading=false,paused=false,free=false,interact=false,held=new Set(),lastMessage='',saved=true;
 let transfer=null,departure=null,pending=null,queuedVisit=null,preparation=null,requestId=0,launchArmed=true;
 const entry=document.createElement('button');entry.id='sky-entry';entry.textContent='奶使 · 云上邮局';entry.hidden=true;document.body.append(entry);
 const panel=document.createElement('section');panel.id='sky-panel';panel.hidden=true;panel.innerHTML=`<header><small>奶使天空篇章</small><h2>云上心愿邮局</h2><p>全驿站的印章聚在一起，长出了翅膀。</p></header><svg id="sky-atlas" viewBox="0 0 720 300" aria-label="天空完整航线与五个航区"></svg><p id="sky-scale"></p><button id="sky-next" hidden>继续下一航区</button><div id="sky-chapters"></div><h3>云岛游园 · 可选支线</h3><p id="sky-outing-count"></p><div id="sky-outings"></div><p id="sky-save-note"></p><button id="sky-free">自由飞行</button> <button id="sky-close">返回</button>`;document.body.append(panel);
 const hud=document.createElement('section');hud.id='sky-hud';hud.hidden=true;hud.innerHTML=`<div class="sky-mission"><b id="sky-title"></b><span id="sky-objective"></span><span id="sky-distance"></span><small id="sky-story"></small></div><nav><button id="sky-nearby" hidden>顺路逛逛</button><button id="sky-route" hidden>回主航线</button><button id="sky-assist">辅助领航</button><button id="sky-action">投递 E</button><span id="sky-bells" hidden><button data-bell="0">月亮</button><button data-bell="1">雪花</button><button data-bell="2">星星</button></span><button id="sky-brake">悬停 B</button><button id="sky-map">航图 / 暂停</button><button id="sky-exit">返回地面</button></nav><details><summary>飞行操作</summary>W/S 加减速 · A/D 转向 · 空格/Q 升降 · Shift 冲刺 · B 悬停 · E 交互</details><div class="sky-touch">${[['KeyA','左转'],['KeyD','右转'],['KeyW','前进'],['KeyS','减速'],['Space','上升'],['KeyQ','下降'],['Shift','冲刺']].map(([key,label])=>`<button data-sky-key="${key}">${label}</button>`).join('')}</div>`;document.body.append(hud);
 const $=s=>document.querySelector(s);
 const activities=createSkyActivityUI(hud,{clear,onComplete:event=>{if(!outingProgress.done.includes(event.id)){outingProgress.done.push(event.id);try{storage.setItem(SKY_ACTIVITY_KEY,JSON.stringify(outingProgress));}catch{saved=false;}onAward(event.id);}lastMessage=event.ending;}});
 const pointer=createSkyPointerControls({canvas:document.querySelector('#world'),active:()=>!!flight,enabled:()=>!!flight&&!transfer&&!paused&&!activities.active&&!flight.done,onTakeOver:()=>{flight.assisted=false;},sensitivity});
 hud.querySelector('details').lastChild.textContent='拖动画面：左右转向、上下升降 · W/S 加减速 · A/D 转向 · 空格/Q 升降 · Shift 冲刺 · B 悬停 · E 交互';
 function visit(event){if(!flight||!event)return;if(transfer){queuedVisit=event;return;}if(flight.done){flight.done=false;free=true;}activities.close();outing=event;outingPath=outingApproach(flight,event);flight.assisted=true;flight.speed=Math.min(flight.speed,12);lastMessage=event.title+' · '+activityKinds[event.kind].hint;paused=false;panel.hidden=true;clear();held.clear();}
 function nearby(){if(!flight)return null;return skyActivities.filter(a=>!outingProgress.done.includes(a.id)).map(a=>({a,d:Math.hypot(a.x-flight.x,a.y-flight.y,a.z-flight.z)})).filter(o=>o.d<155).sort((a,b)=>a.d-b.d)[0]?.a;}
 $('#sky-nearby').onclick=()=>{if(outing&&Math.hypot(outing.x-flight.x,outing.y-flight.y,outing.z-flight.z)<14&&flight.speed<9){flight.speed=0;activities.open(outing.id);}else visit(outing||nearby());};
 $('#sky-route').onclick=()=>{activities.close();outing=null;outingPath=free?[]:outingApproach(flight,skyTarget(flight));flight.assisted=!free;lastMessage='回到主航线，继续刚才的投递。';clear();};

 function menu(){activities.close();paused=true;clear();held.clear();panel.hidden=false;panel.scrollTop=0;const points=[skyStart,...skyChapters.flatMap(c=>c.points)],xs=points.map(p=>p[0]),zs=points.map(p=>p[2]),minX=Math.min(...xs),minZ=Math.min(...zs),scale=Math.min(610/(Math.max(...xs)-minX),230/(Math.max(...zs)-minZ)),pos=p=>[55+(p[0]-minX)*scale,265-(p[2]-minZ)*scale];
 $('#sky-atlas').innerHTML=skyChapters.map((c,i)=>{const leg=skyLegs[i],route=[leg[0].start,...c.points].map(pos),[x,y]=route.at(-1);return `<polyline points="${route.map(p=>p.join(',')).join(' ')}" fill="none" stroke="${i<=progress.completed?'#496f66':'#aa9c84'}" stroke-width="3" stroke-dasharray="7 4"/>${c.points.map(p=>{const [a,b]=pos(p);return `<circle cx="${a}" cy="${b}" r="4" fill="#bb924d"/>`;}).join('')}<circle cx="${x}" cy="${y}" r="13" fill="#456d60"/><text x="${x}" y="${y+5}" text-anchor="middle" fill="#fff">${i+1}</text>`;}).join('');
 $('#sky-atlas').innerHTML+=skyChapters.map((c,i)=>`<circle cx="435" cy="${47+i*43}" r="10" fill="#456d60"/><text x="435" y="${51+i*43}" text-anchor="middle" fill="#fff" font-size="12">${i+1}</text><text x="455" y="${51+i*43}" font-size="15" fill="#3d5147">${c.name}</text><text x="455" y="${67+i*43}" font-size="11" fill="#766347">${(skyChapterLengths[i]/1000).toFixed(2)} km · 海拔 ${c.points[0][1]}–${c.points.at(-1)[1]} m</text>`).join('');
 $('#sky-scale').textContent=`全线 ${(SKY_LENGTH/1000).toFixed(2)} km · 5 个航区 · 15 个投递点 · 38 道补给风环 · 领航约 4–6 分钟`;
 $('#sky-outing-count').textContent=`云游邮戳 ${outingProgress.done.length}/15 · 每座岛都有不同的小事 · 支线可随时离开`;
 $('#sky-outings').innerHTML=skyActivities.map(a=>`<button data-outing="${a.id}" ${a.chapter>progress.completed?'disabled':''}><strong>${outingProgress.done.includes(a.id)?'✓ ':''}${a.title}</strong><small>航区 ${a.chapter+1} · ${a.label} · ${a.resident?'现场拜访':'留声信箱'}</small></button>`).join('');
 $('#sky-next').hidden=!flight?.done||flight.chapter===4;$('#sky-chapters').innerHTML=skyChapters.map((c,i)=>`<button data-chapter="${i}" ${i>progress.completed?'disabled':''}><strong>${i+1}. ${c.name} · ${(skyChapterLengths[i]/1000).toFixed(2)} km</strong><small>${i<progress.completed?'✓ 已完成 · '+(progress.best[i]?.toFixed(1)||'—')+' 秒':i===progress.completed?'开始 / 继续':'完成上一章解锁'}</small></button>`).join('');$('#sky-save-note').textContent=saved?'每过一圈或完成投递即保存；旧版解锁保留，新航线成绩重新记录。':'当前浏览器无法保存，离开后可能丢失进度。';}
 const travelNote=document.createElement('p');travelNote.id='sky-travel-note';panel.querySelector('header').append(travelNote);
 const openMenu=menu;entry.onclick=()=>{openMenu();travelNote.textContent=flight?'选择航区后沿空中路线前往。':atSkyLaunch(getGroundPose())?'你已抵达摩天轮起飞台，选择航区后展翅升空。':'从普通赛道终点、摩天轮前的羽光拱门起飞。选择航区后将沿地面路线前往，也可以自行驾车抵达。';};
 $('#sky-next').onclick=()=>flight?.done&&start(flight.chapter+1);
 panel.onclick=async e=>{const visitButton=e.target.closest('[data-outing]');if(visitButton&&!visitButton.disabled){const event=skyActivities.find(a=>a.id===visitButton.dataset.outing);await start(event.chapter,true,event);return;}const b=e.target.closest('[data-chapter]');if(b&&!b.disabled)start(+b.dataset.chapter);};
 function closeMenu(){requestId++;loading=false;if(!flight){pending=null;launchArmed=false;}panel.removeAttribute('aria-busy');panel.hidden=true;paused=false;clear();pointer.cancel();}
 $('#sky-close').onclick=closeMenu;
 $('#sky-free').onclick=()=>start(Math.min(progress.completed,4),true);
 $('#sky-map').onclick=menu;$('#sky-exit').onclick=exit;
 $('#sky-brake').onclick=()=>{if(flight){flight.speed=0;flight.assisted=false;}};
 $('#sky-assist').onclick=()=>{if(flight)flight.assisted=!flight.assisted;};$('#sky-action').onclick=()=>interact=true;
 for(const b of hud.querySelectorAll('[data-bell]'))b.onclick=()=>{if(!flight)return;if(+b.dataset.bell===flight.node){interact=true;flight.bell=true;}else{lastMessage='风铃没有回应。记住石刻：月落，雪来，星归。';flight.hits++;}};
 for(const b of hud.querySelectorAll('[data-sky-key]')){b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);held.add(b.dataset.skyKey);};for(const n of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(n,()=>held.delete(b.dataset.skyKey));}
 addEventListener('blur',()=>held.clear());
 function persist(){try{storage.setItem(SKY_KEY,JSON.stringify(progress));saved=true;}catch{saved=false;}}
 function prepare(){
  preparation??=(async()=>{actor??=await loadAngel();if(!world){world=buildSkyWorld(scene,{rescued:storage.getItem('park-rescue-complete')==='yes'});actor.wrapper.visible=false;scene.add(actor.wrapper);}await world.ready;})().catch(error=>{world?.dispose();world=null;actor?.wrapper.removeFromParent();preparation=null;throw error;});return preparation;
 }
 async function start(chapter,explore=false,event=null){
  if(loading||transfer||unlocked()<2||chapter>progress.completed||(!flight&&!available()))return false;
  if(!flight&&!atSkyLaunch(getGroundPose())){
   const choice={chapter,explore,event};pending=choice;panel.hidden=true;paused=false;clear();
   const result=await onGuide(skyLaunchEntry,()=>pending!==choice);
   if(pending!==choice)return false;
   if(result.cancelled){pending=null;launchArmed=false;return false;}
   if(!result.started){menu();travelNote.textContent='暂时未找到安全的自动路线。请沿普通赛道抵达摩天轮前的羽光拱门，再选择起飞。';}
   return false;
  }
  const request=++requestId;loading=true;panel.hidden=false;paused=true;panel.setAttribute('aria-busy','true');$('#sky-save-note').textContent='正在准备云上邮路，角色会留在起飞台等待；首次进入需要稍候…';
  try{await prepare();if(request!==requestId)return false;
   const previousFlight=flight,ground=getGroundPose();
   if(!previousFlight&&!atSkyLaunch(ground)){loading=false;return false;}
   let next=newFlight(chapter);if(!explore&&progress.checkpoint?.chapter===chapter&&chapter===progress.completed)next=restoreFlight(progress.checkpoint);
   const destination={x:next.x,y:next.y,z:next.z};
   const origin=previousFlight?{x:previousFlight.x,y:previousFlight.y,z:previousFlight.z,yaw:previousFlight.yaw}:{x:ground.x,y:ground.groundY+1.5,z:ground.z,yaw:ground.yaw};
   if(!previousFlight){departure={...origin};onStart();}
   activities.close();outing=null;outingPath=[];queuedVisit=event;pending=null;flight=next;
   Object.assign(flight,origin);free=explore;flight.assisted=!free;paused=false;clear();held.clear();pointer.cancel();
   const separation=Math.hypot(origin.x-destination.x,origin.y-destination.y,origin.z-destination.z);
   transfer=!previousFlight||separation>6?createSkyTransfer(origin,destination,{depart:!previousFlight}):null;
   if(transfer)transfer.kind=previousFlight?'航区转场':'展翅升空';
   panel.hidden=true;hud.hidden=false;document.body.classList.add('sky-flying');world.group.visible=true;actor.wrapper.position.set(flight.x,flight.y-1.5,flight.z);actor.wrapper.rotation.y=flight.yaw;actor.wrapper.visible=true;
   lastMessage=skyChapters[chapter].story;
   if(!transfer&&queuedVisit){const visitAfter=queuedVisit;queuedVisit=null;visit(visitAfter);}return true;
  }catch(e){$('#sky-save-note').textContent='这次云岛没有载入完整，请再次点击章节重试，已下载的模型会继续复用。';console.error('Sky load:',e);return false;}finally{if(request===requestId){loading=false;panel.removeAttribute('aria-busy');}}
 }
 function finishExit(){flight=null;transfer=null;paused=false;launchArmed=false;clear();held.clear();pointer.cancel();world.group.visible=false;actor.wrapper.visible=false;panel.hidden=true;hud.hidden=true;document.body.classList.remove('sky-flying');if(new URLSearchParams(location.search).has('test'))window.__skyDebug=null;onExit();}
 function exit(){if(loading)return;activities.close();outing=null;outingPath=[];queuedVisit=null;pending=null;if(!flight){closeMenu();return;}if(transfer?.landing)return;if(!free&&!flight.done){progress.checkpoint=flightCheckpoint(flight);persist();}transfer=transfer?.depart?reverseSkyDeparture(transfer,departure):createSkyTransfer(flight,departure,{landing:true});transfer.kind='返回起飞台';paused=false;panel.hidden=true;clear();held.clear();pointer.cancel();}
 function update(dt,keys){
  entry.hidden=unlocked()<2||!available()||!!flight||!panel.hidden;
  if(!flight){pointer.cancel();const ground=getGroundPose(),near=atSkyLaunch(ground);if(!near)launchArmed=true;entry.textContent=near?'展翅起飞 · 摩天轮':pending?`前往起飞台 · ${Math.round(launchDistance(ground))} m`:'奶使 · 摩天轮起飞';
   if(!loading&&panel.hidden&&available()&&near&&(pending||(launchArmed&&ground.skin==='angel'&&ground.speed>2&&Math.cos(ground.yaw-skyLaunchEntry.p.yaw)>.5))){const choice=pending||{chapter:Math.min(progress.completed,4),explore:false};start(choice.chapter,choice.explore,choice.event);}
   return;
  }
  const pointerInput=pointer.read(dt);
  const has=k=>keys.has(k)||held.has(k),e=has('KeyE');
  activities.update(paused?0:dt);if(activities.active&&!paused)actor.mixer.update(dt);
  if(!paused&&!activities.active){const s=flight,previous=s.node,previousNav=s.nav;
   if(transfer){stepSkyTransfer(transfer,s,dt);if(transfer.done){if(transfer.landing){finishExit();return;}transfer=null;s.assisted=!free;clear();held.clear();pointer.cancel();if(queuedVisit){const event=queuedVisit;queuedVisit=null;visit(event);}}}
   else {
   stepFlight(s,{...pointerInput,target:outingPath[0]||outing||undefined,left:has('KeyA')||has('ArrowLeft'),right:has('KeyD')||has('ArrowRight'),forward:has('KeyW')||has('ArrowUp'),slow:has('KeyS')||has('ArrowDown'),up:has('Space'),down:has('KeyQ'),boost:has('Shift')||has('ShiftLeft')||has('ShiftRight'),brake:has('KeyB'),interact:!free&&(s.chapter!==2||s.bell)&&(interact||e&&!s.eHeld)},dt,world.solids);advanceApproach(outingPath,s);s.eHeld=e;interact=false;s.bell=false;
   if(s.node!==previous||s.nav!==previousNav){progress.checkpoint=flightCheckpoint(s);persist();}if(s.nav!==previousNav&&s.node===previous)lastMessage=['风环接住了你的羽光。沿着下一道金环继续飞。','云端信使：这一段有人同行，信就不会再被退回。','补给完成。绕过钟楼后，下一座云岛就在前方。'][s.rings%3];if(s.node!==previous)lastMessage=['信已收到。下一个心愿正在等你。','这不是一封退信，而是一封还没出发的信。'][previous%2];
   if(s.done&&!s.rewarded){s.rewarded=true;progress.checkpoint=null;progress.completed=Math.max(progress.completed,s.chapter+1);progress.best[s.chapter]=Math.min(progress.best[s.chapter]||Infinity,s.time);persist();onAward('sky:'+s.chapter);menu();$('#sky-save-note').textContent=`${s.chapter===4?'庆典开启 · 获得极光邮戳！':'投递完成！'} ${s.time.toFixed(1)} 秒 · 擦碰 ${s.hits} 次。${saved?'进度已保存。':'存储不可用，进度仅本次有效。'}`;}
   }
   actor.mixer.timeScale=s.speed>20?1.65:1;actor.mixer.update(dt);actor.wrapper.position.set(s.x,s.y-1.5,s.z);actor.wrapper.rotation.set(0,s.yaw,0);actor.body.rotation.x=T.MathUtils.damp(actor.body.rotation.x,s.speed/140-pointerInput.lift*.12,5,dt);actor.body.rotation.z=T.MathUtils.damp(actor.body.rotation.z,(has('KeyA')?-.18:has('KeyD')?.18:T.MathUtils.clamp(-pointerInput.yawDelta/Math.max(dt,.001)*.12,-.22,.22)),6,dt);
  }
  const s=flight,target=outing||skyTarget(s),distance=Math.hypot(target.x-s.x,target.y-s.y,target.z-s.z);world.update(target,s.time,s.chapter,s.node,s.nav,activities.state,outingProgress.done,dt);
  if(!activities.active)camera.position.lerp(new T.Vector3(s.x-Math.sin(s.yaw)*18,s.y+6,s.z-Math.cos(s.yaw)*18),1-Math.exp(-5*dt));const safe=safeSkyCamera({x:s.x,y:s.y+1,z:s.z},camera.position,world.solids);camera.position.set(safe.x,safe.y,safe.z);camera.lookAt(s.x,s.y+1,s.z);if(activities.active&&outing){camera.position.lerp(new T.Vector3(outing.x+8,outing.y+8,outing.z-18),1-Math.exp(-4*dt));camera.lookAt(outing.x-12,outing.y-2,outing.z+20);}camera.fov=60;camera.updateProjectionMatrix();
  $('#sky-title').textContent=outing?'云岛游园 · '+outing.title:(free?'自由飞行 · ':`${s.chapter+1}/5 · `)+skyChapters[s.chapter].name;
  $('#sky-objective').textContent=`${outing?`云岛入口 ${Math.round(distance)} m`:free?'随时悬停观景':target.transit?`补给风环 ${s.nav+1}/${skyLegs[s.chapter][s.node].gates.length} · ${Math.round(distance)} m`:`心愿 ${s.node+1}/3 · 目标 ${Math.round(distance)} m`} · 高度 ${Math.round(s.y)} m · ${Math.round(s.speed*3.6)} km/h · 羽光 ${Math.round(s.energy*100)}%`;
  $('#sky-distance').textContent=`航线 ${(skyProgress(s)/1000).toFixed(2)} / ${(SKY_LENGTH/1000).toFixed(2)} km · 本章实飞 ${(s.distance/1000).toFixed(2)} km · ${Math.floor(s.time/60)}:${String(Math.floor(s.time%60)).padStart(2,'0')} · 风环 ${s.rings}`;
  $('#sky-story').textContent=lastMessage+(outing?'':' '+skyChapters[s.chapter].hint);
  $('#sky-bells').hidden=!!outing||target.transit||s.chapter!==2||distance>=11||s.speed>=9;$('#sky-action').hidden=!!outing||target.transit||s.chapter===2;$('#sky-action').disabled=free||distance>=11||s.speed>=9||(s.chapter===3&&s.dwell<3);$('#sky-action').textContent=s.chapter===3&&distance<11?`稳住 ${Math.min(3,s.dwell).toFixed(1)}/3 秒 · E`:s.chapter===1?'接住邮袋 E':s.chapter===2?['月亮风铃 E','雪花风铃 E','星星风铃 E'][s.node]:'投递 / 修复 E';
  const closeEvent=outing||nearby();$('#sky-nearby').hidden=!closeEvent||activities.active;$('#sky-route').hidden=!outing;
  if(closeEvent)$('#sky-nearby').textContent=outing?(distance<14&&s.speed<9?'开始体验 · '+outing.label:`前往 ${outing.label} · ${Math.round(distance)} m`):'顺访 · '+closeEvent.title;
  $('#sky-assist').textContent=s.assisted?'领航中 · 手动接管':'辅助领航';
  for(const b of hud.querySelectorAll('nav button:not(#sky-map):not(#sky-exit),.sky-touch button'))if(transfer)b.disabled=true;else if(b.id!=='sky-action')b.disabled=false;
  $('#sky-exit').textContent=transfer?.landing?'正在降落…':'返回起飞台';$('#sky-exit').disabled=!!transfer?.landing;
  if(transfer){$('#sky-title').textContent=transfer.kind+' · 摩天轮与云上邮路';$('#sky-objective').textContent=`沿风环飞行 · 还余 ${Math.ceil(transfer.length-transfer.distance)} m · 高度 ${Math.round(s.y)} m`;$('#sky-story').textContent=transfer.landing?'沿来时的风路返回摩天轮引桥。':'羽翼已经展开。越过摩天轮前的风环后，可拖动画面转向和升降。';}
  if(new URLSearchParams(location.search).has('test'))window.__skyDebug={...s,paused,free,progress,clips:actor.clips,target,outing:outing?.id||null,activity:activities.state,outingProgress,transfer:transfer?{kind:transfer.kind,remaining:transfer.length-transfer.distance}:null};
 }
 if(new URLSearchParams(location.search).has('test'))window.__skyFixture={start,exit,set:p=>flight&&Object.assign(flight,p),progress};
 return {update,toggleMenu(){if(panel.hidden)menu();else closeMenu();},showActivity(id){if(unlocked()<2||!available())return false;menu();panel.querySelector(`[data-outing="${id}"]`)?.scrollIntoView({block:'center'});return true;},get active(){return !!flight;},get open(){return loading||!panel.hidden;}};
}
