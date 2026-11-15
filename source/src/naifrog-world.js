import {setHidden,setText} from './ui-state.js';
import {createPatrol,advancePatrol} from './naifrog-patrol.js';
import {createCollection} from './collection.js';
import {updateEncounterHints,residentHooks} from './encounter-hints.js';
import * as T from 'three';
import {GameAssetLoader as GLTFLoader} from './asset-loader.js';
import {npcKinds,npcNames,npcProfiles,npcPlacements,npcPocket,npcBlocksTravel,npcLines} from './naifrog-layout.js';
import './naifrog.css';
import './encounter-hints.css';
export function createNaifrogController(scene,getState,{storage,clear,camera,onGreet=()=>{},onPhoto=()=>{},onDirections=()=>{},getAdventure=()=>null,onAdventure=()=>{},linesProvider=()=>null}){
 const people=[],templates=new Map(),group=new T.Group();group.name='Lux3D naifrog residents';scene.add(group);
 let talking=null,near=null,elapsed=0,loaded=false,loadError=null,meetingVersion='';let friends=[];
 try{const ids=JSON.parse(storage.getItem('naifrog-friends')||'[]');if(Array.isArray(ids))friends=ids.filter(x=>npcKinds.includes(x));}catch{}
 let waitingForWelcome=!createCollection(storage).has('friend:welcome');
 const prompt=document.createElement('button');prompt.id='naifrog-prompt';prompt.hidden=true;document.body.append(prompt);
 const panel=document.createElement('section');panel.id='naifrog-dialog';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','与奶蛙交谈');panel.innerHTML='<small id="naifrog-area"></small><h3 id="naifrog-name"></h3><p id="naifrog-line"></p><button id="naifrog-special"></button><button id="naifrog-adventure" hidden></button><footer><button id="naifrog-close">稍后再聊</button><span id="naifrog-page"></span><button id="naifrog-next">继续听</button></footer>';document.body.append(panel);
 const met=document.createElement('p');met.id='naifrog-friends';document.querySelector('#park-map').append(met);
 const set=(id,text)=>panel.querySelector(id).textContent=text;
 function close(){talking=null;panel.hidden=true;document.body.classList.remove('npc-talking');clear();document.querySelector('#world').focus({preventScroll:true});}
 function render(){if(!talking)return;const adventure=getAdventure(talking.person.kind),a=panel.querySelector('#naifrog-adventure');a.hidden=!adventure;a.textContent=adventure||'';set('#naifrog-area',talking.person.area+' · 车辆与计时已暂停');set('#naifrog-name',npcNames[talking.person.kind]);set('#naifrog-special',npcProfiles[talking.person.kind].action);set('#naifrog-line',talking.lines[talking.index]);set('#naifrog-page',`${talking.index+1} / ${talking.lines.length}`);set('#naifrog-next',talking.index===talking.lines.length-1?'下次再见':'继续听');}
 function begin(){
  if(!near||talking)return;
  const state=getState();if(Math.abs(state.speed)>4)return;
  state.speed=0;state.boost=false;clear();onGreet(near.id);
  let lines=linesProvider(near.kind)||npcLines(near.kind,{...state,parkRescued:storage.getItem('park-rescue-complete')==='yes'},near.area);
  if(near.kind==='welcome'&&waitingForWelcome){
   waitingForWelcome=false;
   lines=['想坐旋转木马？在云宫驿站那一带。选「下一驿站」再点「出发」就能到站，车站地图的「游乐」里有木马入口。',...lines];
  }
  talking={person:near,lines,index:0};panel.hidden=false;prompt.hidden=true;document.body.classList.add('npc-talking');
  render();panel.querySelector('#naifrog-next').focus({preventScroll:true});
 }
 function next(){if(!talking)return;if(talking.index<talking.lines.length-1){talking.index++;render();}else{if(!friends.includes(talking.person.kind)){friends.push(talking.person.kind);storage.setItem('naifrog-friends',JSON.stringify(friends));}close();}}
 panel.querySelector('#naifrog-special').onclick=()=>{if(!talking)return;const p=talking.person,profile=npcProfiles[p.kind];set('#naifrog-line',profile.reply);p.special={start:elapsed,type:profile.gesture};if(p.kind==='welcome'){close();onDirections();return;}if(p.kind==='photographer')onPhoto({area:p.area,position:{x:p.x,y:p.y,z:p.z}});};
 panel.querySelector('#naifrog-adventure').onclick=()=>{if(!talking)return;const kind=talking.person.kind;close();onAdventure(kind);};
 prompt.onclick=begin;panel.querySelector('#naifrog-next').onclick=next;panel.querySelector('#naifrog-close').onclick=close;
 addEventListener('keydown',e=>{if(talking){if(e.code==='Tab'){e.preventDefault();e.stopImmediatePropagation();const buttons=[...panel.querySelectorAll('button')].filter(b=>!b.hidden);buttons[(buttons.indexOf(document.activeElement)+(e.shiftKey?-1:1)+buttons.length)%buttons.length].focus();return;}if(['KeyM','KeyR'].includes(e.code)){close();return;}e.stopImmediatePropagation();if(['Enter','Space'].includes(e.code)&&e.target?.tagName==='BUTTON'&&panel.contains(e.target)){if(e.repeat)e.preventDefault();return;}if(['Escape','KeyF'].includes(e.code)){e.preventDefault();close();}else if(['Enter','Space'].includes(e.code)&&!e.repeat){e.preventDefault();next();}return;}if(e.code==='KeyF'&&near&&!e.repeat){e.preventDefault();e.stopImmediatePropagation();begin();}},{capture:true});
 async function load(){
  const loader=new GLTFLoader();const assets=await Promise.all(npcKinds.map(async kind=>[kind,(await loader.loadAsync((['thinker','laugher','cheerer'].includes(kind)?'/assets/festival/':'/assets/naifrog/')+kind+'.glb')).scene]));
  for(const [kind,source] of assets){source.updateMatrixWorld(true);const box=new T.Box3().setFromObject(source),size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3());source.position.sub(new T.Vector3(center.x,box.min.y,center.z));const g=new T.Group();g.add(source);g.scale.setScalar((['reader','thinker'].includes(kind)?2.15:2.9)/size.y);g.updateMatrixWorld(true);templates.set(kind,g);}
  const cloud=(await loader.loadAsync('/assets/cotton-cloudbank-lod.glb')).scene;const cb=new T.Box3().setFromObject(cloud),cs=cb.getSize(new T.Vector3()),cc=cb.getCenter(new T.Vector3());cloud.position.sub(new T.Vector3(cc.x,cb.max.y,cc.z));const island=new T.Group();island.add(cloud);island.scale.set(23/cs.x,7/cs.y,23/cs.z);island.position.set(npcPocket.x,npcPocket.y-.28,npcPocket.z);island.name='Lux3D cloud below visitor turnout';group.add(island);
  const deck=new T.Mesh(new T.CylinderGeometry(npcPocket.r,npcPocket.r-.4,.45,64),new T.MeshStandardMaterial({color:0xc4b8bf,roughness:.9}));deck.position.set(npcPocket.x,npcPocket.y-.225,npcPocket.z);deck.name='Visitor turnout solid path';group.add(deck);
  for(const p of npcPlacements){const root=new T.Group(),visual=templates.get(p.kind).clone(true);root.name='Naifrog '+p.id;root.position.set(p.x,p.y+.08,p.z);root.rotation.y=p.yaw;root.add(visual);group.add(root);root.updateMatrixWorld(true);const size=new T.Box3().setFromObject(root).getSize(new T.Vector3());people.push({...p,root,visual,radius:Math.max(.65,Math.min(1.55,Math.max(size.x,size.z)*.38)),phase:people.length*1.73});}
  for(const person of people){person.patrol=createPatrol(person);person.encounterHint={id:'resident:'+person.id,x:person.x,y:person.y,z:person.z,radius:24,text:(residentHooks[person.kind]||npcProfiles[person.kind].name)+'\nB 制动 · 停稳按 F'};}
  loaded=true;return {count:people.length,kinds:templates.size};
 }
 return {load:()=>load().catch(e=>{loadError=e.message;console.error('Naifrog loading:',e);throw e;}),get talking(){return !!talking;},get talkingKind(){return talking?.person.kind;},close,react(kind){for(const p of people)if(!kind||p.kind===kind)p.reactionUntil=elapsed+3+p.phase*.04;},
 blocked:(ox,oz,x,z,y)=>npcBlocksTravel(people,ox,oz,x,z,y),
 update(dt,{enabled,mapOpen,orbitYaw=0,orbitPitch=.35}){elapsed+=dt;const s=getState();for(const person of people){person.walking=advancePatrol(person,dt,s,people,!enabled||mapOpen||!!talking||elapsed<person.encounterUntil);person.root.position.set(person.x,person.y+.08+(elapsed<person.reactionUntil?.10*Math.abs(Math.sin(elapsed*6+person.phase)):0)+(person.walking?.045*Math.abs(Math.sin(elapsed*7+person.phase)):0),person.z);}if(talking&&(!enabled||mapOpen||s.status!=='running'))close();near=null;
  let platformGreeting=false;
  if(enabled&&!mapOpen&&s.status==='running'&&!s.snow&&!s.rescueStory?.dialog&&!s.storyJournalOpen){
   let best=10,host=null;
   for(const person of people){
    if(Math.abs(s.groundY-person.y)>=3)continue;
    const d=Math.hypot(s.x-person.x,s.z-person.z);
    if(d<best){best=d;near=person;}
    if(person.kind==='welcome'&&waitingForWelcome&&s.mode==='explore'&&!s.autoTour&&s.progress<30&&Math.abs(s.speed)<.5&&d<26)host=person;
   }
   // The first visitor can return the station host's greeting from the
   // parked tricycle. Keep both the host and his patrol off the race lane.
   if(!near&&host){
    near=host;platformGreeting=true;
    if(!host.calledToVisitor){host.calledToVisitor=true;host.special={start:elapsed,type:'bow'};host.encounterUntil=elapsed+3;}
   }
  }
  setHidden(prompt,!near||!!talking||Math.abs(s.speed)>4);
  if(near)setText(prompt,platformGreeting?'F · 回应站台上的阿迎':`F · 和${npcNames[near.kind]}打个招呼`);
  const greeted=updateEncounterHints(people.map(p=>Object.assign(p.encounterHint,{x:p.x,y:p.y,z:p.z})),s,performance.now(),enabled&&!mapOpen&&!talking);
  if(greeted){const person=people.find(p=>p.encounterHint===greeted);if(person&&!person.special){person.special={start:elapsed,type:'bow'};person.encounterUntil=elapsed+3;}}
  for(const person of people){const d=Math.hypot(s.x-person.x,s.z-person.z);if(d>140)continue;person.visual.scale.y=templates.get(person.kind).scale.y*(1+.007*Math.sin(elapsed*1.8+person.phase));person.visual.rotation.z=(person.walking?.035:.012)*Math.sin(elapsed*(person.walking?7:.8)+person.phase);const target=d<9||elapsed<person.encounterUntil?Math.atan2(s.x-person.x,s.z-person.z):person.walking?person.walkYaw:person.yaw;if(person.special){const t=elapsed-person.special.start;if(t<3){const wave=Math.sin(t*5);if(['bounce','cheer','rhythm'].includes(person.special.type))person.root.position.y+=Math.abs(wave)*.17;else person.visual.rotation.x=Math.sin(Math.min(1,t/3)*Math.PI)*.14;if(person.special.type==='flash'&&t>.5&&t<.68)document.body.classList.add('npc-photo-flash');else document.body.classList.remove('npc-photo-flash');}else{person.visual.rotation.x=0;person.special=null;document.body.classList.remove('npc-photo-flash');}}person.root.rotation.y+=Math.atan2(Math.sin(target-person.root.rotation.y),Math.cos(target-person.root.rotation.y))*(1-Math.exp(-2*dt));}
  if(talking&&camera){
   const n=talking.person,target=new T.Vector3(n.x,n.y+1.6,n.z);
   if(!talking.camera){
    scene.updateMatrixWorld(true);const meshes=[];scene.traverseVisible(o=>{if(!o.isMesh)return;let a=o;while(a){if(a===group)return;a=a.parent;}if(new T.Box3().setFromObject(o).distanceToPoint(target)<9)meshes.push(o);});
    const base=Math.atan2(s.x-n.x,s.z-n.z),ray=new T.Raycaster();let best=null;
    for(const offset of [.85,-.85,1.5,-1.5,2.4,-2.4]){const angle=base+offset,point=target.clone().add(new T.Vector3(Math.sin(angle)*5.5,1.9,Math.cos(angle)*5.5)),direction=point.clone().sub(target),length=direction.length();ray.set(target,direction.normalize());ray.near=.25;ray.far=length;const hit=ray.intersectObjects(meshes,false)[0],clearance=hit?Math.max(1.8,hit.distance-.5):length,score=clearance-Math.abs(offset)*.05;if(!best||score>best.score)best={angle,point:target.clone().addScaledVector(direction,Math.min(length,clearance)),score};}
    talking.camera={angle:best.angle,orbitStart:orbitYaw,pitchStart:orbitPitch,meshes};camera.position.copy(best.point);
   }
   const view=talking.camera,angle=view.angle+orbitYaw-view.orbitStart,desired=target.clone().add(new T.Vector3(Math.sin(angle)*5.5,1.9+3*(orbitPitch-view.pitchStart),Math.cos(angle)*5.5));
   if(view.lastYaw!==orbitYaw||view.lastPitch!==orbitPitch){const direction=desired.clone().sub(target),length=direction.length(),ray=new T.Raycaster(target,direction.normalize(),.25,length),hit=ray.intersectObjects(view.meshes,false)[0];view.point=target.clone().addScaledVector(direction,hit?Math.max(1.8,hit.distance-.5):length);view.lastYaw=orbitYaw;view.lastPitch=orbitPitch;}
   camera.position.lerp(view.point,1-Math.exp(-7*dt));camera.lookAt(target);camera.fov=50;camera.updateProjectionMatrix();
  }

  const version=friends.join(',')+loaded+loadError;if(version!==meetingVersion){meetingVersion=version;met.textContent=loadError?'奶蛙居民加载未完成，请刷新重试':`奶蛙朋友 ${friends.length} / ${npcKinds.length}${friends.length===npcKinds.length?' · 奶家人集合！':' · 靠近后按 F 交谈'}`;}
  if(new URLSearchParams(location.search).has('test'))window.__naifrogDebug={loaded,error:loadError,count:people.length,kinds:templates.size,friends:[...friends],near:near?.id,talking:talking?{id:talking.person.id,kind:talking.person.kind,index:talking.index}:null,people:people.map(({id,kind,x,y,z,radius,walking,patrol})=>({id,kind,x,y,z,radius,walking,patrol:!!patrol}))};
 }
 };
}
