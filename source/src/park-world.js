import {buildApproachRails} from './approach-rails.js';
import {setHidden,setDisabled} from './ui-state.js';
import {loadSkiWorld} from './ski-world.js';
import {fishingAction,fishingButton,canFishAct} from './fishing-rules.js';
import {createMushroomControls} from './mushroom-ui.js';
import {startMushrooms} from './mushroom-rules.js';
import {newSkiJourney,stepSkiJourney,skiJourneyPose} from './ski-journey.js';
import {liftLength} from './ski-lift.js';
import {SKI_LENGTH,SKI_DROP,skiGates} from './ski-layout.js';
import {createPassengerPoseController} from './passenger-poses.js';
import {loadCarnival} from './carnival-world.js';
import {miniKinds,newCarnivalRound,stepCarnival,launchCarnival,hitCarnivalTarget,constellationPatterns} from './carnival-rules.js';
import {placeTeacupPassenger,placeFerrisPassenger,placeCarouselPassenger,placeSwingPassenger} from './park-passenger.js';
import {clearParkScenery} from './park-clearance.js';
import * as T from 'three';
import {GameAssetLoader as GLTFLoader} from './asset-loader.js';
import {attractions,parkSolids,parkDock,parkEntrance,parkApproachEnd,parkLayouts,teacupLayout,parkUnlocked,newBumperRound,stepBumpers} from './park-rules.js';
import {registerRegionHint} from './region-hints.js';
import {archPierProfiles,placeArchPierProfiles} from './arch-clearance.js';
import './park.css';
const manifest=['ferris-base','ferris-wheel','ferris-cabin','carousel-roof','carousel-horse','carousel-deck','bumper-hall','bumper-pink','bumper-blue','bumper-gold','carousel-swan','carousel-carriage','teacup-deck','teacup','teapot','swing-canopy','swing-frame','swing-seat','entry','ticket','fountain','bandstand','candy','prizes','terrace','garden-arch','planter','clock','fence','bench','lamp','musicbox'];
export async function loadPark(scene,selected=manifest){
 const loader=new GLTFLoader(),templates=new Map();
 await Promise.all(selected.map(async id=>templates.set(id,(await loader.loadAsync('/assets/park/park-'+id+'.glb')).scene)));
 const passenger=(await loader.loadAsync('/assets/hero-passenger.glb')).scene;const cloudSource=(await loader.loadAsync('/assets/cotton-cloudbank-lod.glb')).scene;const cloudBox=new T.Box3().setFromObject(cloudSource),cloudSize=cloudBox.getSize(new T.Vector3()),cloudCenter=cloudBox.getCenter(new T.Vector3());cloudSource.position.sub(new T.Vector3(cloudCenter.x,cloudBox.min.y,cloudCenter.z));
 clearParkScenery(scene);
 const roots=new Map(),seats=new Map(),rotors=new Map(),cars=[],lamps=[];let entryPierProfiles=null;
 function model(id,parent,{x=0,y=0,z=0,width,height,depth,center=false,rotate=0}={}){
  if(!templates.has(id)){const absent=new T.Group();parent.add(absent);return absent;}const source=templates.get(id).clone(true),box=new T.Box3().setFromObject(source),size=box.getSize(new T.Vector3()),c=box.getCenter(new T.Vector3());source.position.sub(new T.Vector3(c.x,center?c.y:box.min.y,c.z));
  const g=new T.Group();g.name='Lux3D park '+id;g.add(source);const scale=width?width/size.x:height?height/size.y:1;g.scale.setScalar(scale);if(width&&height)g.scale.y=height/size.y;if(depth)g.scale.z=depth/size.z;g.position.set(x,y,z);g.rotation.y=rotate;parent.add(g);return g;
 }
 const tile=document.createElement('canvas');tile.width=tile.height=512;const tc=tile.getContext('2d');tc.fillStyle='#7e706a';tc.fillRect(0,0,512,512);for(let row=0;row<8;row++)for(let col=-1;col<9;col++){tc.fillStyle=['#d2c9c4','#d9d1c9','#c8bfb7'][(row*7+col+15)%3];tc.fillRect(col*64+(row%2)*32+2,row*64+2,60,60);}const paving=new T.CanvasTexture(tile);paving.colorSpace=T.SRGBColorSpace;paving.wrapS=paving.wrapT=T.RepeatWrapping;paving.repeat.set(8,8);
 const stone=new T.MeshStandardMaterial({color:0xada29e,roughness:.9}),top=new T.MeshStandardMaterial({color:0xe7dfe5,roughness:.85,map:paving}),gold=new T.MeshStandardMaterial({color:0xb99863,metalness:.65,roughness:.35}),glow=new T.MeshBasicMaterial({color:0xffe6ab});
 function mesh(geo,mat,parent,x=0,y=0,z=0){const m=new T.Mesh(geo,mat);m.position.set(x,y,z);parent.add(m);return m;}
 function bulbRing(parent,r,y,count=64){const instance=new T.InstancedMesh(new T.SphereGeometry(.13,8,6),glow,count),matrix=new T.Matrix4();for(let i=0;i<count;i++){const a=i/count*Math.PI*2;matrix.makeTranslation(Math.cos(a)*r,y,Math.sin(a)*r);instance.setMatrixAt(i,matrix);}parent.add(instance);return instance;}
 function beam(parent,a,b,r=.1){const d=b.clone().sub(a),m=mesh(new T.CylinderGeometry(r,r,d.length(),8),gold,parent);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return m;}
 for(const a of attractions){const g=new T.Group();g.name='Park '+a.id;g.position.set(a.x,a.y,a.z);scene.add(g);roots.set(a.id,g);const clouds=new T.Group();clouds.name='Lux3D cloud island beneath '+a.id;clouds.add(cloudSource.clone(true));clouds.scale.set((a.r*2+12)/cloudSize.x,12/cloudSize.y,(a.r*2+12)/cloudSize.z);clouds.position.set(a.x,a.y-14,a.z);scene.add(clouds);
  mesh(new T.CylinderGeometry(a.r,a.r*.96,3,96),stone,g,0,-1.5,0);mesh(new T.CylinderGeometry(a.r-.2,a.r-.2,.14,96),top,g,0,-.04,0);bulbRing(g,a.r-.6,.18);
  // A solid approach deck connects the existing race route to each park plaza.
  const endpoint=parkApproachEnd(a),end=new T.Vector3(endpoint.x,a.y,endpoint.z),start=new T.Vector3(a.anchor.x,a.anchor.y,a.anchor.z),delta=end.clone().sub(start),road=mesh(new T.BoxGeometry(14,.8,delta.length()),top,scene);road.name='Park approach '+a.id;road.position.copy(start).add(end).multiplyScalar(.5);road.position.y-=.4;road.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),delta.clone().normalize());
  buildApproachRails(scene,a,beam);
  const entrance=parkEntrance(a);
  const entryModel=model('entry',g,{x:entrance.x-a.x,z:entrance.z-a.z,width:22,height:15,depth:1.6,rotate:entrance.yaw});
  entryPierProfiles??=archPierProfiles(entryModel);const collisionGroup=parkSolids.find(p=>p.a.id===a.id);
  collisionGroup.solids=collisionGroup.solids.filter(p=>p.id!=='gate-post');collisionGroup.solids.push(...placeArchPierProfiles(entryPierProfiles,entrance));
  for(const prop of parkLayouts.find(layout=>layout.attraction===a).props){const object=model(prop.id,g,prop.id==='lamp'?{...prop,width:undefined,depth:undefined}:prop);object.userData.parkSolid=prop.id;}
  registerRegionHint(a.name+' · 在入口停靠后选择体验',a.x,a.y,a.z,a.r);
 }
 const f=roots.get('ferris'),wheel=new T.Group();wheel.name='Ferris rotating rotor';wheel.position.set(0,37,4);f.add(wheel);model('ferris-base',f,{width:28,height:41,depth:12});beam(f,new T.Vector3(0,37,0),new T.Vector3(0,37,5),.65);model('ferris-wheel',wheel,{width:61,depth:2.4,center:true});const wheelLights=bulbRing(wheel,30.2,0,120);wheelLights.rotation.x=Math.PI/2;wheelLights.position.z=1.25;
 const ferrisSeats=[];for(let i=0;i<12;i++){const cabin=model('ferris-cabin',f,{height:4.3});cabin.name='Ferris level cabin '+i;ferrisSeats.push(cabin);}seats.set('ferris',ferrisSeats);rotors.set('ferris',wheel);
 const terrace=model('terrace',f,{x:0,z:-24,width:25});
 // The generated staircase and balustrade extend beyond the central ride collider.
 // Register their actual world bounds, including the lowest stair nosing.
 scene.updateMatrixWorld(true);const terraceBounds=new T.Box3().setFromObject(terrace),terraceSize=terraceBounds.getSize(new T.Vector3()),terraceCentre=terraceBounds.getCenter(new T.Vector3());
 const terraceSolid={id:'ferris-terrace-stairs',x:terraceCentre.x,z:terraceCentre.z,y:terraceBounds.min.y,width:terraceSize.x,depth:terraceSize.z,height:terraceSize.y};
 parkSolids.find(g=>g.a.id==='ferris').solids.push(terraceSolid);
 terrace.userData.parkSolid=terraceSolid.id;
 if(new URLSearchParams(location.search).has('test'))window.__terraceSolid=terraceSolid;
 const c=roots.get('carousel');model('carousel-roof',c,{width:27,height:19.5});const deck=new T.Group();c.add(deck);model('carousel-deck',deck,{width:27,height:1.1});const horseSeats=[];
 for(let i=0;i<8;i++){const angle=i*Math.PI/4;const seat=model(i<6?'carousel-horse':i===6?'carousel-swan':'carousel-carriage',deck,{x:Math.sin(angle)*9,z:Math.cos(angle)*9,height:i<6?6:3,rotate:angle+Math.PI/2,y:1.04});horseSeats.push(seat);}rotors.set('carousel',deck);seats.set('carousel',horseSeats);bulbRing(c,12.8,9.1);
 const t=roots.get('teacups'),teaRotor=new T.Group();t.add(teaRotor);model('teacup-deck',teaRotor,{width:teacupLayout.deckWidth,height:teacupLayout.deckHeight});model('teapot',t,{height:9,y:1.12});const cups=[];for(let i=0;i<6;i++){const a=i*Math.PI/3;const cup=model('teacup',teaRotor,{x:Math.sin(a)*12,z:Math.cos(a)*12,width:4.5,y:1.12});cups.push(cup);}rotors.set('teacups',teaRotor);seats.set('teacups',cups);model('garden-arch',t,{x:teacupLayout.gardenX,z:teacupLayout.gardenZ,width:teacupLayout.gardenWidth,height:6,depth:1.2,rotate:Math.PI/2});
 const sw=roots.get('swings');model('swing-frame',sw,{height:15});const swingRotor=new T.Group();swingRotor.position.y=15;sw.add(swingRotor);model('swing-canopy',swingRotor,{width:23,height:7});const swingSeats=[];const suspensionRing=mesh(new T.TorusGeometry(9,.09,6,80),gold,swingRotor,0,.45,0);suspensionRing.rotation.x=Math.PI/2;for(let i=0;i<4;i++){const a=i*Math.PI/2;beam(swingRotor,new T.Vector3(0,.45,0),new T.Vector3(Math.sin(a)*9,.45,Math.cos(a)*9),.12);}
 for(let i=0;i<10;i++){const angle=i*Math.PI/5;const chair=model('swing-seat',swingRotor,{x:Math.sin(angle)*12,z:Math.cos(angle)*12,y:-7,width:2,rotate:angle});for(const d of [-.7,.7])beam(swingRotor,new T.Vector3(Math.sin(angle)*9+d*Math.cos(angle),.45,Math.cos(angle)*9-d*Math.sin(angle)),new T.Vector3(Math.sin(angle)*11.2+d*Math.cos(angle),-4.3,Math.cos(angle)*11.2-d*Math.sin(angle)),.045);swingSeats.push(chair);}rotors.set('swings',swingRotor);seats.set('swings',swingSeats);
 const b=roots.get('bumper');model('bumper-hall',b,{width:44,height:15,depth:31});const arena=mesh(new T.BoxGeometry(38,.2,26),new T.MeshStandardMaterial({color:0x817384,metalness:.3,roughness:.35}),b,0,1.05,0);arena.name='Bumper collision arena';for(const [x,z,w,d] of [[-19,0,.6,26],[19,0,.6,26],[0,-13,38,.6],[0,13,38,.6]])mesh(new T.BoxGeometry(w,.75,d),gold,b,x,1.55,z);for(let i=0;i<4;i++)cars.push(model(['bumper-pink','bumper-blue','bumper-gold','bumper-blue'][i],b,{width:2.5,y:1.2}));cars.forEach((car,i)=>{if(i!==2)car.children[0].rotation.y=Math.PI/2;});const rivals=[];for(const [i,name] of [[1,'pink'],[2,'mouse']]){const source=scene.getObjectByName('Rescue NPC '+name);if(source){const actor=source.clone(true);actor.visible=true;actor.name='Bumper driver '+name;actor.position.set(0,0,0);actor.rotation.set(0,0,0);actor.scale.setScalar(1.25);b.add(actor);rivals.push({actor,index:i});}}function syncRivals(){for(const {actor,index} of rivals){actor.position.copy(cars[index].position).add(new T.Vector3(0,.55,0));actor.rotation.y=cars[index].rotation.y;}}seats.set('bumper',cars);
 const actor=new T.Group();actor.name='Park seated passenger';const pb=new T.Box3().setFromObject(passenger,true),ps=pb.getSize(new T.Vector3()),pc=pb.getCenter(new T.Vector3());passenger.position.sub(new T.Vector3(pc.x,pb.min.y,pc.z));actor.add(passenger);actor.scale.setScalar(1.8/ps.y);actor.visible=false;scene.add(actor);const passengerPose=createPassengerPoseController(passenger);
 const waterMat=new T.MeshPhysicalMaterial({color:0x9bdaec,transparent:true,opacity:.5,roughness:.15,depthWrite:false});for(let i=0;i<8;i++){const a=i*Math.PI/4,curve=new T.CatmullRomCurve3([new T.Vector3(23,4,-9),new T.Vector3(23+Math.cos(a)*.7,4.6,-9+Math.sin(a)*.7),new T.Vector3(23+Math.cos(a)*1.5,2.3,-9+Math.sin(a)*1.5)]);mesh(new T.TubeGeometry(curve,24,.035,5,false),waterMat,t);}let elapsed=0,ferrisPhase=0;
 function animate(dt,active){elapsed+=dt;wheelLights.material.color.setHSL(.11+.015*Math.sin(elapsed*.2),.5,.78);waterMat.opacity=.42+.07*Math.sin(elapsed*3);ferrisPhase+=dt/(active?.kind==='ferris'?70:100);const phase=ferrisPhase;wheel.rotation.z=phase*Math.PI*2;
  ferrisSeats.forEach((seat,i)=>{const angle=i*Math.PI/6+phase*Math.PI*2-Math.PI/2;seat.position.set(Math.cos(angle)*29,37+Math.sin(angle)*29-3.8,8);seat.rotation.set(0,0,0);});
  deck.rotation.y=elapsed*.16;horseSeats.forEach(seat=>seat.position.y=1.04);teaRotor.rotation.y=elapsed*.18;cups.forEach((cup,i)=>cup.rotation.y=elapsed*(.24+i*.03)+(active?.spin||0));swingRotor.rotation.y=elapsed*.25;
  if(!active||active.kind!=='bumper')cars.forEach((car,i)=>{const a=elapsed*.2+i*Math.PI/2;car.position.set(Math.sin(a)*11,1.2,Math.cos(a)*7);car.rotation.y=a+Math.PI/2;});
 }
 const carnival=await loadCarnival(scene,roots);const ski=await loadSkiWorld(scene,roots.get('ski'),templates.get('ticket'));
 return {roots,seats,actor,ski,passengerPose,actorBaseScale:actor.scale.x,cars,carnival,animate(dt,active){animate(dt,active);carnival.animate(dt,active);},manifest:[...selected,...carnival.assetIds],syncRivals,get ferrisPhase(){return ferrisPhase;}};
}
export function createParkController(scene,camera,getState,{storage,progress,tester,clear,onMapClose,onBeforeTravel=()=>{},onParticipate=()=>{},onDocked=()=>{},onSkiViewChanged=()=>{}}){
 let world=null,active=null,rescued=storage.getItem('park-rescue-complete')==='yes',unlockedVersion='';let stamps=[];try{const value=JSON.parse(storage.getItem('park-passport')||'[]');if(Array.isArray(value))stamps=value.filter(id=>attractions.some(a=>a.id===id));}catch{}function stamp(id){if(!stamps.includes(id)){stamps.push(id);storage.setItem('park-passport',JSON.stringify(stamps));unlockedVersion='';}}
 const panel=document.createElement('aside');panel.id='park-panel';panel.setAttribute('aria-label','游乐设施操作');panel.hidden=true;panel.innerHTML='<strong id="park-title"></strong><p id="park-description"></p><p id="park-live" role="status"></p><button id="park-enter">开始体验</button><button id="park-camera" hidden>切换座位视角</button><button id="park-exit" hidden>返回入口</button>';document.body.append(panel);
 const mapSection=document.createElement('section');mapSection.id='park-map';mapSection.innerHTML='<h3>乐园导览</h3><p id="park-stamps"></p><p>赛车串联各区，停靠后可体验游乐设施。</p><div></div>';document.querySelector('#station-panel').append(mapSection);
 const writeText=(el,value)=>{if(el.textContent!==value)el.textContent=value;};const setText=(id,text)=>writeText(panel.querySelector('#'+id),text);
 function available(a){return parkUnlocked(a,progress.unlocked,rescued,tester);}
 function teleport(a){
  if(!world||!available(a)||active)return;
  const s=getState();
  onBeforeTravel();onMapClose();clear();
  Object.assign(s,parkDock(a),{status:'running',speed:0,hits:0,impact:0,blocked:[],wallContact:false,failure:null,vy:0,jumpHeld:false,storyJournalOpen:false,factor:1,boost:false,snow:false,magnetic:false,roll:0,jumpY:0,falling:false,offRoadTime:0,challenge:null,mode:'explore',rescueStory:null});
  onDocked(s);
 }
 function stop(completed=false){
  if(!active)return;
  const a=active.attraction;
  if(completed===true)stamp(a.id);
  const s=getState();
  // Return the driver to the same boarding point, facing the public path through the gate.
  Object.assign(s,parkDock(a,{facingExit:true}),{status:'running',speed:0,factor:1,boost:false,roll:0,jumpY:0,falling:false,mode:'explore',challenge:null});
  active=null;world.ski.hide();world.actor.visible=false;scene.add(world.actor);
  clear();onDocked(s);
 }
 function begin(a){if(!world||!available(a))return;onBeforeTravel();onParticipate(a.id);const s=getState();active={attraction:a,kind:a.kind,time:0,seatIndex:a.kind==='ferris'?((Math.round(-world.ferrisPhase*12)%12)+12)%12:0,spin:0,inside:false,round:a.kind==='ski'?newSkiJourney(s):a.expansion?newCarnivalRound(a.kind):a.kind==='bumper'?newBumperRound():null};s.status='amusement';s.speed=0;s.challenge=null;clear();world.passengerPose.set(a.kind);world.actor.visible=a.kind!=='ski';if(a.kind==='ski'){skiInput.left=skiInput.right=skiInput.brake=false;world.ski.begin();}}
 const controls=document.createElement('div');controls.id='carnival-controls';controls.hidden=true;controls.innerHTML='<label id="carnival-aim-label">方向 <input id="carnival-aim" type="range" min="-1" max="1" step=".025" value="0"></label><button id="carnival-launch">按住蓄力 · 松开发射</button><meter id="carnival-power" min="0" max="1" value=".5" aria-label="投掷力度"></meter><span id="carnival-targets"></span><button id="carnival-again">再玩一局</button>';panel.prepend(controls);
 const fishingControls=document.createElement('div');fishingControls.id='fishing-controls';fishingControls.hidden=true;fishingControls.innerHTML='<div id="fishing-steps" aria-label="钓鱼步骤"><span data-step="cast">① 抛竿</span><span data-step="wait">② 看浮漂</span><span data-step="reel">③ 咬钩收竿</span></div><button id="fishing-action">抛竿</button><button id="fishing-again" hidden>再钓一轮</button>';panel.prepend(fishingControls);
 fishingControls.querySelector('#fishing-action').onclick=()=>{if(active?.kind==='ducks')fishingAction(active.round);};
 fishingControls.querySelector('#fishing-again').onclick=()=>{if(active?.kind==='ducks'){active.round=newCarnivalRound('ducks');active.time=0;}};
 const mushroomControls=createMushroomControls(panel,()=>active?.kind==='mushrooms'?active.round:null,()=>{if(active?.kind==='mushrooms'){active.round=newCarnivalRound('mushrooms');active.time=0;}},()=>Number(storage.getItem('carnival-best:mushroom-party')||0));
 const skiInput={left:false,right:false,brake:false};const skiControls=document.createElement('div');skiControls.id='ski-controls';skiControls.hidden=true;skiControls.innerHTML='<button id="ski-lift-speed" hidden aria-pressed="false">加快上山</button><button id="ski-start">开始滑雪</button><button id="ski-again" hidden>乘扶梯再上山</button><button id="ski-left" aria-label="向左滑">左转 A</button><button id="ski-brake">刹车 S / B</button><button id="ski-right" aria-label="向右滑">右转 D</button>';panel.prepend(skiControls);
 for(const key of ['left','right','brake']){const b=skiControls.querySelector('#ski-'+key);b.onpointerdown=e=>{e.preventDefault();skiInput[key]=true;b.setPointerCapture(e.pointerId);};b.onpointerup=b.onpointercancel=b.onlostpointercapture=()=>skiInput[key]=false;}
 skiControls.querySelector('#ski-lift-speed').onclick=()=>{if(active?.kind==='ski'&&active.round.phase==='ascending')active.round.liftHurry=!active.round.liftHurry;};
 skiControls.querySelector('#ski-start').onclick=()=>{if(active?.kind==='ski'&&active.round.phase==='ready')stepSkiJourney(active.round,{start:true},0);};skiControls.querySelector('#ski-again').onclick=()=>{if(active?.kind==='ski'&&active.round.finished){active.round=newSkiJourney(skiJourneyPose(active.round),true);active.time=0;clear();world.ski.begin();}};
 const aim=controls.querySelector('input'),launch=controls.querySelector('#carnival-launch');aim.oninput=()=>{if(active?.round)active.round.aim=Number(aim.value);};
 const charge=e=>{if(!active?.attraction.expansion||active.round.finished)return;e.preventDefault();if(!active.round.charging){active.round.chargeTime=0;active.round.power=.25;}active.round.charging=true;if(e.pointerId!==undefined)launch.setPointerCapture(e.pointerId);};const release=e=>{if(active?.round?.charging){e.preventDefault();launchCarnival(active.round);}};launch.onpointerdown=charge;launch.onpointerup=release;launch.onpointercancel=()=>{if(active?.round)active.round.charging=false;};launch.onkeydown=e=>{if(['Space','Enter'].includes(e.code)&&!e.repeat)charge(e);};launch.onkeyup=e=>{if(['Space','Enter'].includes(e.code))release(e);};
 controls.querySelector('#carnival-again').onclick=()=>{if(active?.attraction.expansion){active.round=newCarnivalRound(active.kind);active.time=0;aim.value='0';}};
 let clickStart=null;document.querySelector('#world').addEventListener('pointerdown',e=>clickStart={x:e.clientX,y:e.clientY});document.querySelector('#world').addEventListener('pointerup',e=>{if(clickStart&&Math.hypot(e.clientX-clickStart.x,e.clientY-clickStart.y)<6)world?.carnival.targetAt(e.clientX,e.clientY,camera,active);clickStart=null;});
 addEventListener('keydown',e=>{if(!active?.attraction.expansion||e.repeat)return;if(active.kind==='ducks'){if(e.code==='Space'){e.preventDefault();fishingAction(active.round);}return;}if(active.kind==='mushrooms'&&e.code==='Space'){e.preventDefault();startMushrooms(active.round);return;}if(/^Digit[1-7]$/.test(e.code)){e.preventDefault();hitCarnivalTarget(active.round,Number(e.code.slice(5))-1);}if(e.code==='Space'&&['ringtoss','bowling'].includes(active.kind))charge(e);});addEventListener('keyup',e=>{if(e.code==='Space')release(e);});
 panel.querySelector('#park-enter').onclick=()=>{const s=getState(),a=attractions.find(a=>Math.hypot(s.x-parkDock(a).x,s.z-parkDock(a).z)<14&&Math.abs(s.groundY-a.y)<4);if(a)begin(a);};panel.querySelector('#park-exit').onclick=()=>stop();panel.querySelector('#park-camera').onclick=()=>{if(active){active.inside=!active.inside;if(active.kind==='ski')onSkiViewChanged(active.inside);}};
 const controlsById = {
  map: document.querySelector('#open-map'), restart: document.querySelector('#restart'),
  enter: panel.querySelector('#park-enter'), exit: panel.querySelector('#park-exit'), camera: panel.querySelector('#park-camera')
 };
 const docks=attractions.map(attraction=>({attraction,pose:parkDock(attraction)}));
 let displayedKind;
 return {setWorld:w=>{world=w;},get ready(){return !!world;},get active(){return !!active;},get skiFirstPerson(){return active?.kind==='ski'&&active.inside;},teleport,stop,update(dt,keys,orbitYaw,orbitPitch,mapOpen,ride){const s=getState();if(s.snowDone&&!rescued){rescued=true;storage.setItem('park-rescue-complete','yes');}
 const version=progress.unlocked+':'+rescued+':'+!!world;if(version!==unlockedVersion){unlockedVersion=version;mapSection.querySelector('#park-stamps').textContent=`游园印章 ${stamps.length}/${attractions.length} · 完整体验一项设施收集一枚${stamps.length===attractions.length?' · 奶国游园家！':''}`;const list=mapSection.querySelector('div');list.replaceChildren();for(const a of attractions){const button=document.createElement('button');button.textContent=(available(a)?'':'🔒 ')+a.name+(stamps.includes(a.id)?' ✓':'');button.disabled=!available(a)||!world;button.title=a.story&&!rescued&&!tester?'完成鬼屋解救奶鼠后开放':a.description;button.onclick=()=>teleport(a);list.append(button);}}
 setDisabled(controlsById.map,!!active);
 setDisabled(controlsById.restart,!!active);
 if(!world)return;
 world.animate(dt,active);
 const near=!s.snow&&!ride&&s.status==='running'?docks.find(({attraction,pose})=>
  Math.abs(s.groundY-attraction.y)<4 && Math.hypot(s.x-pose.x,s.z-pose.z)<14)?.attraction:null;
 setHidden(panel,mapOpen||(!active&&!near));
 document.body.classList.toggle('park-nearby',!!near&&!active&&!mapOpen);
 const kind=active?.kind||'';
 if(kind!==displayedKind) {
  displayedKind=kind;
  panel.dataset.kind=kind;
  setHidden(skiControls,kind!=='ski');
  setHidden(fishingControls,kind!=='ducks');
  mushroomControls.show(kind==='mushrooms');
  setHidden(controls,kind==='ducks'||kind==='mushrooms'||!active?.attraction.expansion||!miniKinds.has(kind));
  panel.classList.toggle('carnival-playing',!!active?.attraction.expansion);
  document.body.classList.toggle('bumper-playing',kind==='bumper');
  setHidden(controlsById.camera,!active||miniKinds.has(kind));
  setHidden(controlsById.enter,!!active);
  setHidden(controlsById.exit,!active);
 }
 if(near&&!active) {
  const unlocked=available(near);
  const requirement=near.story?'完成鬼屋救援后解锁':'到达对应驿站后开放';
  setText('park-title',near.name);
  setText('park-description',near.description);
  setText('park-live',unlocked?'':requirement);
  setDisabled(controlsById.enter,!unlocked);
  setText('park-enter',(unlocked?(near.kind==='ski'?'乘扶梯上山 · ':'体验 · '):'未开放 · ')+near.name);
  const title=unlocked?near.description:requirement;
  if(controlsById.enter.title!==title)controlsById.enter.title=title;
 }
 if(active){writeText(document.querySelector('.telemetry > span'),'奶国游乐园 · '+active.attraction.name);writeText(document.querySelector('.rule'),'游乐项目不扣赛车生命');writeText(document.querySelector('.keys'),active.kind==='bumper'?'W/S 前后 · A/D 转向 · B 刹车':'拖曳环视 · 切换座位视角');writeText(document.querySelector('#timer'),'乐园游玩');writeText(document.querySelector('#flow'),active.attraction.name);writeText(document.querySelector('#factor'),'');active.time+=dt;world.passengerPose.update(active.kind,active.time,dt);const a=active.attraction;setText('park-title',a.name);if(a.kind!=='ski')setText('park-exit','返回入口');setText('park-description',a.kind==='bumper'?'W/S 前后 · A/D 转向 · B 刹车 · 碰撞得分，不扣生命':'拖曳环视 · 可随时返回入口');setText('park-camera',active.inside?'观光视角':'座位视角');
 if(a.kind==='ski'){
 const r=active.round;stepSkiJourney(r,{hurry:r.liftHurry||keys.has('KeyW')||keys.has('ArrowUp'),start:keys.has('KeyW')||keys.has('ArrowUp'),push:keys.has('KeyW')||keys.has('ArrowUp'),steer:+(skiInput.left||keys.has('KeyA')||keys.has('ArrowLeft'))-+(skiInput.right||keys.has('KeyD')||keys.has('ArrowRight')),brake:skiInput.brake||keys.has('KeyS')||keys.has('ArrowDown')||keys.has('KeyB'),jump:keys.has('Space')},dt);
 world.actor.visible=false;const pos=world.ski.update(r,dt,camera,orbitYaw,orbitPitch,active.inside);s.x=pos.x;s.z=pos.z;s.groundY=pos.y;s.yaw=pos.yaw;s.speed=0;
 const ascending=r.phase==='ascending',liftSpeed=skiControls.querySelector('#ski-lift-speed');liftSpeed.hidden=!ascending;liftSpeed.setAttribute('aria-pressed',String(r.liftHurry));setText('ski-lift-speed',r.liftHurry?'恢复观光速度':'加快上山');
 skiControls.querySelector('#ski-start').hidden=r.phase!=='ready';skiControls.querySelector('#ski-again').hidden=!r.finished;for(const key of ['left','right','brake'])skiControls.querySelector('#ski-'+key).hidden=r.phase!=='skiing';
 setText('park-live',ascending?`观光扶梯上山 · ${Math.min(100,Math.floor(r.liftS/(liftLength(r.liftRoute)+r.liftBoardLength)*100))}% · 海拔 ${Math.round(pos.y)} 米 · 拖曳环视`:r.finished?`${r.time.toFixed(1)} 秒 · 旗门 ${r.gates.length}/${skiGates.length} · ${r.score} 分 · 已到山脚`:r.phase==='ready'?`云顶滑雪 · ${(SKI_LENGTH/1000).toFixed(2)} km · 落差 ${SKI_DROP} m · W 出发 / A D 转弯 / S 刹车`:`${Math.round(r.speed*3.6)} km/h · 剩余 ${Math.ceil(SKI_LENGTH-r.s)} m · 旗门 ${r.gates.length}/${skiGates.length}${r.recover?' · 站稳后继续':''}`);
 setText('park-description',ascending?'乘扶梯欣赏雪山 · W 可加快上山':'山顶准备好再出发 · A/D 转弯 · S 刹车');setText('park-camera',active.inside?'追随视角':'第一人称');setText('park-exit',ascending?'结束乘坐 · 返回入口':'返回雪松前庭');if(r.finished){stamp('ski');const best=Number(storage.getItem('ski-best')||0);if(r.score>best)storage.setItem('ski-best',String(r.score));}
 if(new URLSearchParams(location.search).has('test')){window.__skiDebug={...r,position:[pos.x,pos.y,pos.z],length:SKI_LENGTH,drop:SKI_DROP};window.__skiFixture=value=>Object.assign(r,value);}
 }else if(a.expansion){const r=active.round;stepCarnival(r,dt,a.duration);if(a.kind==='ducks'){
 const button=fishingControls.querySelector('#fishing-action');button.hidden=r.finished;button.disabled=!canFishAct(r);writeText(button,fishingButton(r));fishingControls.querySelector('#fishing-again').hidden=!r.finished;fishingControls.dataset.phase=r.phase;const step=['ready','casting','caught','missed'].includes(r.phase)?'cast':r.phase==='waiting'||r.phase==='nibbling'?'wait':'reel';for(const el of fishingControls.querySelectorAll('[data-step]'))el.classList.toggle('current',el.dataset.step===step);setText('park-live',`已钓 ${r.catches.length}/3 · ${r.score} 分 · ${r.message}`);
 }else if(a.kind==='mushrooms'){mushroomControls.update(r);}else{const projectile=['ringtoss','bowling'].includes(active.kind);controls.querySelector('#carnival-aim-label').hidden=!projectile;launch.hidden=!projectile;launch.disabled=r.finished||!!r.projectile;controls.querySelector('#carnival-power').hidden=!projectile;controls.querySelector('#carnival-power').value=r.power;controls.querySelector('#carnival-again').hidden=!r.finished;const labels=active.kind==='stargaze'?7:0;const targetButtons=controls.querySelector('#carnival-targets');if(targetButtons.childElementCount!==labels){targetButtons.replaceChildren();for(let i=0;i<labels;i++){const b=document.createElement('button');b.textContent=String(i+1);b.onclick=()=>hitCarnivalTarget(r,i);targetButtons.append(b);}}else for(const [i,b] of [...targetButtons.children].entries())b.onclick=()=>hitCarnivalTarget(r,i);const hint=active.kind==='stargaze'&&!r.finished?'星图 '+(r.pattern+1)+'/3 · 顺序 '+constellationPatterns[r.pattern].map(i=>i+1).join(' → '):r.message;setText('park-live',miniKinds.has(a.kind)?`${r.finished?'本局完成':Math.max(0,Math.ceil(a.duration-r.time))+' 秒'} · ${r.score} 分 · ${hint}`:`${Math.max(0,Math.ceil(a.duration-active.time))} 秒 · ${a.name}`);}
 if(r.finished){stamp(a.id);const key='carnival-best:'+(a.kind==='ducks'?'fishing':a.kind==='mushrooms'?'mushroom-party':a.id);if(r.score>Number(storage.getItem(key)||0))storage.setItem(key,String(r.score));}if(!miniKinds.has(a.kind)&&active.time>=a.duration){stop(true);return;}const pos=world.carnival.cameraAndActor(active,camera,world.actor,orbitYaw,orbitPitch,dt);s.x=pos.x;s.z=pos.z;s.groundY=pos.y;}else if(active.kind==='bumper'){stepBumpers(active.round,{forward:keys.has('KeyW')||keys.has('ArrowUp'),reverse:keys.has('KeyS')||keys.has('ArrowDown'),steer:+(keys.has('KeyA')||keys.has('ArrowLeft'))-+(keys.has('KeyD')||keys.has('ArrowRight')),brake:keys.has('KeyB')},dt);active.round.cars.forEach((c,i)=>{world.cars[i].position.set(c.x,1.2,c.z);world.cars[i].rotation.y=c.yaw;});setText('park-live',`${Math.ceil(active.round.time)} 秒 · ${active.round.score} 分 · 连击 ${active.round.combo}${active.round.finished?' · 本局完成，可返回入口再挑战':''}`);
 if(active.round.finished){stamp(a.id);const old=Number(storage.getItem('bumper-best')||0);if(active.round.score>old)storage.setItem('bumper-best',String(active.round.score));}}
 else{active.spin+=(+(keys.has('KeyA'))-+(keys.has('KeyD')))*dt*1.2;setText('park-live',`${Math.max(0,Math.ceil(a.duration-active.time))} 秒 · ${active.inside?'座位视角':'观光视角'}`);if(active.time>=a.duration){stop(true);return;}}
 if(!a.expansion&&a.kind!=='ski'){world.actor.scale.setScalar(world.actorBaseScale);const seat=world.seats.get(a.id)[active.seatIndex];seat.updateWorldMatrix(true,true);const eyeHeight=active.kind==='carousel'?4.7:active.kind==='ferris'?2.1:active.kind==='teacups'?3.05:1.8;const target=seat.getWorldPosition(new T.Vector3()).add(new T.Vector3(0,eyeHeight,0));world.actor.position.copy(seat.getWorldPosition(new T.Vector3())).add(new T.Vector3(0,active.kind==='carousel'?3.2:active.kind==='ferris'?.7:active.kind==='teacups'?1.1:.65,0));world.actor.quaternion.copy(seat.getWorldQuaternion(new T.Quaternion()));if(active.kind==='teacups')placeTeacupPassenger(world.actor,seat);if(active.kind==='ferris')placeFerrisPassenger(world.actor,seat);if(active.kind==='carousel')placeCarouselPassenger(world.actor,seat);if(active.kind==='swings')placeSwingPassenger(world.actor,seat);world.actor.visible=!active.inside;const angle=orbitYaw+(active.kind==='bumper'?active.round.cars[0].yaw:active.time*.05);const distance=active.inside?2:active.kind==='ferris'?11:9;const desired=target.clone().add(new T.Vector3(Math.sin(angle)*distance,active.inside?.5:4+Math.sin(orbitPitch)*4,-Math.cos(angle)*distance));if(!active.inside&&active.kind==='ferris')desired.copy(target).add(new T.Vector3(Math.sin(orbitYaw)*15,3+Math.sin(orbitPitch)*5,18+Math.cos(orbitYaw)*4));if(!active.inside&&active.kind==='carousel'){const radial=Math.atan2(target.x-a.x,target.z-a.z)+orbitYaw;desired.set(a.x+Math.sin(radial)*23,a.y+5.6+Math.sin(orbitPitch),a.z+Math.cos(radial)*23);}if(active.kind==='teacups'){
 const cupRotation=seat.getWorldQuaternion(new T.Quaternion());
 target.copy(world.actor.position).add(new T.Vector3(0,.95,0));
 if(active.inside){desired.copy(world.actor.position).add(new T.Vector3(0,1.55,0));const forward=new T.Vector3(Math.sin(orbitYaw)*20,Math.sin(orbitPitch)*10,Math.cos(orbitYaw)*20).applyQuaternion(cupRotation);camera.position.copy(desired);camera.lookAt(desired.clone().add(forward));}
 else{desired.copy(target).add(new T.Vector3(Math.sin(orbitYaw)*6.8,3.2+Math.sin(orbitPitch)*2,Math.cos(orbitYaw)*6.8).applyQuaternion(cupRotation));camera.position.lerp(desired,1-Math.exp(-6*dt));camera.lookAt(target);}
 }else if(active.inside){desired.copy(target).add(new T.Vector3(0,.1,active.kind==='ferris'?1.3:0));camera.position.copy(desired);camera.lookAt(desired.clone().add(new T.Vector3(Math.sin(angle)*25,Math.sin(orbitPitch)*10,Math.cos(angle)*25)));}else{camera.position.lerp(desired,1-Math.exp(-6*dt));camera.lookAt(target);}s.x=target.x;s.z=target.z;s.groundY=target.y;s.yaw=angle;}
 }world.syncRivals();window.__parkDebug={loaded:true,rescued,active:active?{id:active.attraction.id,time:active.time,score:active.round?.score,round:active.attraction.expansion?active.round:undefined,finished:active.round?.finished,inside:active.inside}:null,assets:world.manifest.length,stamps:[...stamps]};}};
}
