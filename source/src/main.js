import {createRaceRecords} from './race-records.js';
import {textureBudget} from './texture-budget.js';
import {createTextureRecovery} from './texture-recovery.js';
import {mazePaths,mazePose} from './haunt-maze.js';
import {createSkyChapter} from './sky-chapter.js';
import {buildSkyTerminal} from './sky-terminal.js';
import {createSnowImprints} from './snow-imprints.js';
import {createTourController} from './tour-controller.js';
import {createNavigationWorld} from './park-navigation.js';
import {welcomeDirection} from './park-itinerary.js';
import {treasureEntries} from './treasure-map.js';
import {createPostcards} from './postcards.js';
import {createGroundGuide} from './ground-guide.js';
import {freezeWorldTransforms} from './static-transforms.js';
import {addForecourtRailCrossing} from './forecourt-crossing.js';
import {clearCamera} from './camera-clearance.js';
import {setHidden,setText,setDisabled} from './ui-state.js';
import {createGameHUD} from './game-hud.js';
import {loadWorldDetail} from './world-detail.js';
import {createParkPreferences} from './park-preferences.js';
import {createVehicleGrounding} from './vehicle-grounding.js';
import {stationSurface} from './station-layout.js';
import {createWorldLoading} from './world-loading.js';
import {optimizeStaticWorld} from './static-batches.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {buildCohesionWorld,loadCohesionArchitecture} from './cohesion-world.js';
import {createResidentController} from './resident-story-ui.js';
import {buildResidentStoryWorld} from './resident-story-world.js';
import {createFestivalController} from './festival-ui.js';
import {loadFestivalWorld} from './festival-world.js';
import {festivalNpcLines} from './festival-story.js';
import {createCollectionUI} from './collection-ui.js';
import {createNaifrogController} from './naifrog-world.js';
import {attractions,parkBlocksVehicle,parkVehicleContact,parkProtected,parkSolids,parkSurface} from './park-rules.js';
if(new URLSearchParams(location.search).has('test'))window.__parkCollisionProbe={solids:parkSolids,blocksVehicle:parkBlocksVehicle,surface:parkSurface};
import {loadPark,createParkController} from './park-world.js';
import {createRescueUI} from './rescue-ui.js';
import {account,accountStorage,allContentUnlocked} from './account.js';
import {startChallenge,advanceChallenge} from './challenge-session.js';
import {clearRailScenery} from './rail-scenery-clearance.js';
import {loadHauntAssets} from './haunt-world.js';import {hauntRoute,hauntGates,hauntPose} from './haunt-route.js';
import {loadSkins} from './skins.js';
import {createFailureAnimation} from './failure-animation.js';
import {loadLandscape} from './landscape.js';
import {loadPeachGates} from './peach-gates.js';
import {updateRegionHints} from './region-hints.js';
import {loadRailUpgrade} from './rail-upgrade.js';
import {loadTrains} from './train-world.js';
import {trainsAt,trainAt,nearbyStation,canBoard,trainCollision,railPoints} from './train-rules.js';
import {loadNatureAssets} from './nature-assets.js';
import {buildStarSky} from './sky-palette.js';
import {loadVillage} from './village-assets.js';
import {loadDreamAssets} from './dream-assets.js';
import {loadRestAssets,loadSnowAssets} from './rest-assets.js';
import {readProgress,writeProgress,reachedStation,stationRace,stations} from './progress.js';import {buildStations,renderStationMap} from './stations.js';
import {buildRomance,loadAlpineAssets} from './romance-world.js';
import {buildSnow} from './snow-world.js';
import {buildChallenges} from './challenge-world.js';
import * as THREE from 'three';import {GameAssetLoader as GLTFLoader} from './asset-loader.js';
import {newRace,stepRace,checkpoints,endRace} from './rules.js';import {TRACK_LENGTH,OLD_TRACK_LENGTH,sampleAt,projectTrack,route,levelPlans} from './track.js';import {buildWorld} from './world.js';import {loadModules} from './generated-modules.js';import './style.css';
let tour=null;
const worldLoading=createWorldLoading({quickEntry:true});const updateHUD=createGameHUD({stations,trackLength:TRACK_LENGTH,checkpointCount:checkpoints.length,parkProtected});
const $=s=>document.querySelector(s),canvas=$('#world'),scene=new THREE.Scene();scene.background=new THREE.Color('#151c43');scene.fog=new THREE.Fog('#151c43',480,1600);
const renderer=new THREE.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight,false);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;const room=new RoomEnvironment(),pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(room,.04).texture;scene.environmentIntensity=.35;room.dispose();pmrem.dispose();
const textureRecovery=createTextureRecovery(renderer);canvas.addEventListener('webglcontextrestored',()=>textureRecovery.reset());document.addEventListener('visibilitychange',()=>{if(!document.hidden)textureRecovery.reset();});
const camera=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,.1,2300);scene.add(new THREE.HemisphereLight(0xe7edfa,0x7c887e,1.15));const sun=new THREE.DirectionalLight(0xffe4c6,1.35);sun.position.set(100,200,80);scene.add(sun);buildWorld(scene);const updateSky=buildStarSky(scene);const snowImprints=createSnowImprints(scene);const updateChallenges=buildChallenges(scene);const updateSnow=buildSnow(scene);const updateRomance=buildRomance(scene);buildStations(scene);const preferences=createParkPreferences({renderer,fog:scene.fog,storage:accountStorage});textureBudget.setQuality('low');
let raceRecords=null,challengeStarting=false;let worldDetail=null;const failureAnimation=createFailureAnimation(scene);let pendingFailure=false;const vehicle=new THREE.Group();scene.add(vehicle);const jet=new THREE.Mesh(new THREE.ConeGeometry(.5,3,12),new THREE.MeshBasicMaterial({color:0x89ffff}));jet.rotation.x=-Math.PI/2;jet.position.set(0,.7,-2.5);jet.name='Boost exhaust';vehicle.add(jet);
let skins=null;let updateLandscape=()=>{},updateNature=()=>{},updateGeneratedSnow=()=>{},updateDreamAssets=()=>{};let state=newRace(),ready=false,support=null,last=performance.now(),lastStatus='ready',cameraYaw=state.yaw,orbitYaw=0,orbitPitch=.35,drag=null,jumpQueued=false,interactQueued=false;const vehicleGrounding=createVehicleGrounding(scene,vehicle,(x,z,y)=>{const park=parkSurface(x,z)??stationSurface(x,z);if(park!==undefined)return park;const p=projectTrack(x,z);if(p.distance>13)return null;return support?.(x,z,y)??p.y;});const keys=new Set();const saved=readProgress(accountStorage);if(allContentUnlocked())saved.unlocked=stations.length-1;let mapOpen=false;let railUpgrade=null,railway=null,railTime=.3,ride=null;
addEventListener('keydown',e=>{if(challengeStarting){e.preventDefault();e.stopImmediatePropagation();return;}if(raceRecords?.open&&!['Escape','Tab','Enter','Space'].includes(e.code)){e.preventDefault();e.stopImmediatePropagation();}},true);
const updateRescueUI=createRescueUI(()=>state,clear);
const postcards=createPostcards({storage:accountStorage,clear,getActor:()=>({x:state.x,y:state.groundY,z:state.z}),canCapture:()=>npcs.talkingKind==='photographer'&&state.status==='running'});
function alignDrivingCamera(pose) {
 cameraYaw=pose.yaw;
 orbitYaw=0;
 orbitPitch=.35;
 camera.position.set(pose.x-Math.sin(pose.yaw)*14,pose.groundY+6,pose.z-Math.cos(pose.yaw)*14);
 camera.lookAt(pose.x,pose.groundY+1.5,pose.z);
}
const park=createParkController(scene,camera,()=>state,{storage:accountStorage,progress:saved,tester:allContentUnlocked(),clear,onDocked:alignDrivingCamera,onSkiViewChanged:inside=>{orbitYaw=0;orbitPitch=inside?0:.35;},onParticipate:id=>collection.mark('ride:'+id),onMapClose:hideMap,onBeforeTravel:()=>{endActiveRace();groundGuide.stop();failureAnimation.clear();pendingFailure=false;ride=null;orbitYaw=0;orbitPitch=.35;lastStatus='running';}});
const residents=createResidentController({storage:accountStorage,getState:()=>state,clear,camera,canOpen:()=>!raceRecords?.open&&ready&&!postcards.open&&!mapOpen&&!ride&&!park.active&&!npcs.talking&&!collection.open&&!festival.open&&!state.snow&&!state.rescueStory?.dialog&&!state.storyJournalOpen&&state.status==='running',onAward:id=>collection.mark(id),onReact:kind=>npcs.react(kind)});
const npcs=createNaifrogController(scene,()=>state,{storage:accountStorage,clear,camera,onGreet:id=>collection.mark('friend:'+id),onPhoto:p=>postcards.request(p),onDirections:welcomeRoute,getAdventure:kind=>residents.npcOption(kind),onAdventure:kind=>residents.openNPC(kind),linesProvider:kind=>residents.npcLines(kind)||festivalNpcLines(kind,festival.story.state)});
const collection=createCollectionUI({storage:accountStorage,hasPostcard:()=>postcards.has,getState:()=>state,clear,canOpen:()=>!raceRecords?.open&&ready&&!residents.open&&!postcards.open&&!mapOpen&&!ride&&!park.active&&!npcs.talking&&!festival.open&&!state.rescueStory?.dialog&&!state.storyJournalOpen&&state.status==='running'});
const festival=createFestivalController({scene,camera,storage:accountStorage,getState:()=>state,clear,unlocked:()=>saved.unlocked,canOpen:()=>!raceRecords?.open&&ready&&!residents.open&&!mapOpen&&!ride&&!park.active&&!npcs.talking&&!collection.open&&!state.snow&&!state.rescueStory?.dialog&&state.status==='running',onAward:id=>collection.mark(id),onReact:()=>npcs.react(),onTravel:h=>{if(h.station>saved.unlocked)return;endActiveRace();groundGuide.stop();failureAnimation.clear();pendingFailure=false;ride=null;state=stationRace(h.station,saved.unlocked);Object.assign(state,h.arrival,{status:'running',speed:0,hits:0,mode:'explore',challenge:null});lastStatus='running';cameraYaw=state.yaw;orbitYaw=0;orbitPitch=.35;camera.position.set(state.x-Math.sin(state.yaw)*14,state.groundY+7,state.z-Math.cos(state.yaw)*14);clear();}});
let hauntReady=false;let navigationReady=false;const groundGuide=createGroundGuide(scene,{getState:()=>state,getSupport:()=>support,getShape:()=>vehicle.userData.collisionFootprint,onMap:id=>showMap('奶国游园藏宝图',id),onFollow:(entry,route)=>tour?.follow(entry,route)});
tour=createTourController({getState:()=>state,getSupport:()=>support,getShape:()=>vehicle.userData.collisionFootprint,isReady:()=>navigationReady,unlocked:()=>saved.unlocked,onRace:()=>{showMap('赛车模式 · 选择起点与终点');const settings=$('.atlas-settings');settings.open=true;settings.scrollIntoView({block:'center'});$('#race-from').focus();},onManual:()=>{endActiveRace();state.mode='explore';state.challenge=null;state.hits=0;}});
if(new URLSearchParams(location.search).has('test'))window.__tourController=tour;
let skyBefore=null,skyGuideSequence=0;
buildSkyTerminal(scene);
const sky=createSkyChapter({
 scene,camera,storage:accountStorage,unlocked:()=>saved.unlocked,
 available:()=>!raceRecords?.open&&ready&&navigationReady&&!mapOpen&&!ride&&!park.active&&!residents.open&&!festival.open&&!collection.open&&!npcs.talking&&!state.snow&&state.status==='running',
 getGroundPose:()=>({...state,skin:vehicle.userData.skin}),sensitivity:()=>preferences.value.sensitivity,
 onGuide:async (entry,cancelled)=>{
  const guideSequence=++skyGuideSequence;
  endActiveRace('abandoned',{show:false});state.mode='explore';clear();tour.reset();const revision=tour.revision;
  const route=await groundGuide.begin(entry);
  if(cancelled()||tour.revision!==revision){if(route.points.length&&guideSequence===skyGuideSequence)groundGuide.stop();return {started:false,cancelled:true};}
  if(!route.points.length)return {started:false,cancelled:false};
  const following=tour.follow(entry,{...route,cancelled}),followRevision=tour.revision;
  const started=await following,wasCancelled=cancelled()||(!started&&tour.revision!==followRevision);
  if(wasCancelled&&guideSequence===skyGuideSequence)groundGuide.stop();
  return {started,cancelled:wasCancelled};
 },
 clear,
 onStart:()=>{endActiveRace('abandoned',{show:false});skyBefore={...state};groundGuide.stop();tour.reset();state.status='sky';npcs.update(0,{enabled:false,mapOpen:false});residents.update(0,false);state.speed=0;state.challenge=null;hideMap();clear();},
 onExit:()=>{Object.assign(state,skyBefore,{status:'running',speed:0,challenge:null,mode:'explore'});alignDrivingCamera(state);clear();},
 onAward:id=>collection.mark(id)
});
$('#skin-select').addEventListener('change',()=>groundGuide.stop());
async function beginGroundGuide(entry){if(!navigationReady||!mapOpen||state.status!=='running'||state.snow)return {reason:'unavailable',points:[]};const result=await groundGuide.begin(entry);if(result.points.length)hideMap();return result;}
raceRecords=createRaceRecords({getState:()=>state,clear,onOpen:()=>{hideMap();clear();},onClose:()=>{clear();if(state.status==='lost')showMap('选择已解锁驿站重生');}});
const historyButton=document.createElement('button');historyButton.id='race-history';historyButton.textContent='赛车成绩与排行榜';historyButton.onclick=()=>raceRecords.showHistory();$('#station-panel').append(historyButton);
function endActiveRace(status='abandoned',options){const c=state.challenge;if(!c||c.finished)return;c.finished=true;state.mode='explore';return raceRecords.end(c,status,options);}
function showMap(title='休息站地图',focus=null,recommendation=null){if(challengeStarting)return;if(ride||park.active||sky.active||sky.open||raceRecords.open)return;residents.close();festival.close();collection.close();clear();mapOpen=true;$('#station-title').textContent=title;$('#station-panel').hidden=false;renderStationMap($('#station-map'),saved,travel,ready&&park.ready,{state,focus,recommendation,tester:allContentUnlocked(),rescued:accountStorage.getItem('park-rescue-complete')==='yes',has:collection.has,festival:festival.story.state,residents,onVisitResident:id=>visitScenery(residents.destination(id)),guide:navigationReady?beginGroundGuide:null,cancelGuide:()=>groundGuide.cancelPlanning(),guidePath:groundGuide.path,ride:a=>park.teleport(a),story:h=>{hideMap();festival.visit(h.id);},scenery:visitScenery});$('#continue-run').hidden=state.status!=='running';$('#save-status').textContent=account?.role==='trial'?'免登录试玩：所有节点已开放；试玩进度单独保存。':'进度保存在当前浏览器；清除网站数据会清除存档。';$('#race-from').innerHTML=stations.map(n=>`<option value="${n.id}" ${n.id>saved.unlocked?'disabled':''}>${n.label}${n.id>saved.unlocked?' · 未解锁':''}</option>`).join('');$('#race-to').innerHTML=stations.map(n=>`<option value="${n.id}">${n.label}</option>`).join('');$('#race-to').value='1';$('#close-map').focus();}
function welcomeRoute(){
 const options={has:collection.has,festival:festival.story.state,position:state};
 const entries=treasureEntries(saved,{tester:allContentUnlocked(),rescued:accountStorage.getItem('park-rescue-complete')==='yes'});
 const suggestion=welcomeDirection(entries,options);
 showMap('奶国游园藏宝图',suggestion?.entry.id,suggestion?{id:suggestion.entry.id,note:suggestion.note}:null);
}
function hideMap(){if(challengeStarting)return;groundGuide.cancelPlanning();mapOpen=false;$('#station-panel').hidden=true;clear();canvas.focus();}
function visitScenery(place){if(!ready||place.station>saved.unlocked)return;travel(place.station);Object.assign(state,{x:place.x,z:place.z,groundY:parkSurface(place.x,place.z)??projectTrack(place.x,place.z).y,yaw:place.yaw,speed:0,hits:0,jumpY:0,mode:'explore',challenge:null});cameraYaw=state.yaw;camera.position.set(state.x-Math.sin(state.yaw)*14,state.groundY+7,state.z-Math.cos(state.yaw)*14);}
function travel(id){if(!ready||challengeStarting)return;endActiveRace();residents.close();groundGuide.stop();failureAnimation.clear();pendingFailure=false;const next=stationRace(id,saved.unlocked);hideMap();state=next;state.mode='explore';$('#challenge-result').textContent='';lastStatus='running';cameraYaw=state.yaw;orbitYaw=0;orbitPitch=.35;camera.position.set(state.x-Math.sin(state.yaw)*14,state.groundY+6,state.z-Math.cos(state.yaw)*14);$('#intro').hidden=true;clear();}
$('#begin-challenge').onclick=async()=>{const button=$('#begin-challenge');if(button.disabled||challengeStarting)return;button.disabled=true;challengeStarting=true;const section=$('#station-panel');section.inert=true;section.setAttribute('aria-busy','true');try{const from=Number($('#race-from').value),to=Number($('#race-to').value),next=startChallenge(from,to,saved.unlocked);endActiveRace('abandoned',{show:false});if(!await raceRecords.begin(next.challenge))return;challengeStarting=false;travel(from);state=next;alignDrivingCamera(next);}catch(e){$('#challenge-result').textContent=e.message;}finally{challengeStarting=false;section.inert=false;section.removeAttribute('aria-busy');button.disabled=false;}};$('#free-explore').onclick=()=>{endActiveRace();if(state.status==='lost'){travel(Number($('#race-from').value));return;}state.mode='explore';state.challenge=null;hideMap();};
window.addEventListener('winter-locate',e=>{if(ready&&!ride&&!park.active){if(e.detail.id?.startsWith('sky-outing:')){if(!sky.showActivity(e.detail.id))showMap('解锁全部驿站，开启云岛游园','station:2');}else showMap('奶国游园藏宝图',e.detail.id);}});
$('#open-map').onclick=()=>showMap();$('#close-map').onclick=hideMap;$('#continue-run').onclick=hideMap;


let trainOptionsVersion=-1;
$('#train-board').onclick=()=>{const dest=Number($('#train-destination').value),train=canBoard(state,saved.unlocked,railTime,dest);if(!train)return;endActiveRace();state.challenge=null;state.mode='explore';groundGuide.stop();collection.mark('journey:train');ride={id:train.id,origin:train.station,destination:dest,departed:false,arrived:false,view:'inside',walking:false,before:{...state}};state.status='riding';orbitYaw=0;orbitPitch=0;clear();};
$('#train-exit').onclick=()=>{if(!ride?.arrived||ride.destination>saved.unlocked)return;const old=ride.before;state=stationRace(ride.destination,saved.unlocked);state.mode='explore';state.hits=old.hits;state.elapsed=old.elapsed;ride=null;cameraYaw=state.yaw;orbitPitch=.35;clear();};
$('#train-view').onclick=()=>{if(!ride)return;ride.view=ride.view==='outside'?'inside':'outside';orbitYaw=0;orbitPitch=ride.view==='outside'?.35:0;clear();};
$('#train-walk').onclick=()=>{if(!ride)return;ride.walking=!ride.walking;clear();};
const trainControls = Object.fromEntries(
 ['panel','view-controls','view','walk','destination','destination-label','board','exit','message']
  .map(name => [name, $('#train-' + name)])
);
function trainUI() {
 const ui=trainControls;
 const station=nearbyStation(state,saved.unlocked);
 const hidden=mapOpen || park.active || (!ride && station===null);
 setHidden(ui.panel,hidden);
 if(hidden)return;
 if(trainOptionsVersion!==saved.unlocked) {
  ui.destination.replaceChildren(...stations.map(n=>{
   const option=new Option((n.id>saved.unlocked?'🔒 ':'')+n.label,String(n.id));
   option.disabled=n.id>saved.unlocked;
   return option;
  }));
  trainOptionsVersion=saved.unlocked;
 }
 setHidden(ui['view-controls'],!ride);
 setHidden(ui['destination-label'],!!ride);
 setHidden(ui.board,!!ride);
 setHidden(ui.exit,!ride);
 if(ride) {
  const outside=ride.view==='outside';
  setText(ui.view,outside?'切换车内观光':'切换车外观光');
  setHidden(ui.walk,outside);
  setText(ui.walk,ride.walking?'回到靠窗座位':'起身走动');
  setDisabled(ui.exit,!ride.arrived);
  const destination=stations[ride.destination].label;
  setText(ui.message,ride.arrived?'已到达 '+destination+'，点击下车继续驾驶。'
   :(outside?'车外观光 → ':ride.walking?'车厢漫步 → ':'靠窗观光 → ')+destination+' · 自由观光');
 } else {
  const dock=trainsAt(railTime).find(t=>t.station===station);
  setDisabled(ui.board,!dock || dock.remaining<=1);
  setText(ui.message,dock?'第 '+(dock.id+1)+' 列车已停靠 · '+Math.ceil(dock.remaining)+' 秒后发车'
   :'请在站内候车，环线列车到站后即可上车。');
 }
}

const map=$('#minimap'),ctx=map.getContext('2d');function minimap(){ctx.clearRect(0,0,220,150);if(state.snow){ctx.strokeStyle='#b6a69a';for(const path of mazePaths()){ctx.beginPath();for(let s=path.start;s<=path.end;s+=2){const p=mazePose(s,0,path.choices),x=110+(p.x-2000)*2,y=15+p.z*1.8;s===path.start?ctx.moveTo(x,y):ctx.lineTo(x,y);}ctx.stroke();}hauntGates.forEach((g,i)=>{const p=hauntPose(g.s);ctx.fillStyle=i<state.seal?'#9ebaa6':'#d29d62';ctx.fillRect(107+(p.x-2000)*2,12+p.z*1.8,6,6);});ctx.fillStyle='#fff';ctx.fillRect(107+(state.x-2000)*2,12+state.z*1.8,5,5);return;}ctx.strokeStyle='#9ed9e0';ctx.lineWidth=1;ctx.beginPath();railPoints.forEach((p,i)=>{const x=110+p.x*.18,y=18+p.z*.18;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();for(const t of trainsAt(railTime)){ctx.fillStyle='#ffe2a7';ctx.fillRect(107+t.x*.18,15+t.z*.18,6,6);}ctx.strokeStyle='#cbb3df';ctx.lineWidth=2;ctx.beginPath();route.forEach((p,i)=>{const x=110+p.x*.18,y=18+p.z*.18;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();for(const a of attractions){ctx.strokeStyle='#b89d73';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(110+a.anchor.x*.18,18+a.anchor.z*.18);ctx.lineTo(110+a.x*.18,18+a.z*.18);ctx.stroke();ctx.fillStyle='#eacb97';ctx.beginPath();ctx.arc(110+a.x*.18,18+a.z*.18,3,0,7);ctx.fill();}ctx.fillStyle='#a6fff1';ctx.beginPath();ctx.arc(110+state.x*.18,18+state.z*.18,4,0,7);ctx.fill();}
function clear(){keys.clear();drag=null;jumpQueued=false;interactQueued=false;tour?.halt();}
function reset(){endActiveRace();residents.close();groundGuide.stop();failureAnimation.clear();pendingFailure=false;ride=null;state=newRace();state.mode='explore';state.status=ready?'running':'ready';lastStatus=state.status;cameraYaw=state.yaw;orbitYaw=0;orbitPitch=.35;clear();$('#intro').hidden=true;camera.position.set(state.x-13,6,state.z);if(ready)canvas.focus({preventScroll:true});}

// Background landmarks must clear the railway before they become visible.
async function loadAlpineBackdrop(){
 const staged=new THREE.Group();await loadAlpineAssets(staged);
 const foreground=window.__railSceneryClearance;
 const report=clearRailScenery(staged);
 scene.add(...staged.children.slice());
 window.__railSceneryClearance={terrainMeshes:(foreground?.terrainMeshes||0)+report.terrainMeshes,loweredVertices:(foreground?.loweredVertices||0)+report.loweredVertices,movedLandmarks:[...(foreground?.movedLandmarks||[]),...report.movedLandmarks]};
}
Promise.all([new GLTFLoader().loadAsync('/assets/hero.glb?v=8'),loadModules(scene),loadRestAssets(scene),loadSnowAssets(scene),loadDreamAssets(scene),loadVillage(scene),loadNatureAssets(scene),loadTrains(scene),loadRailUpgrade(scene),loadPeachGates(scene),loadLandscape(scene)]).then(async ([g,m,r,snowAssets,dreamAssets,villageReports,natureAssets,trainAssets,upgradeAssets,peachAssets,landscapeAssets])=>{clearRailScenery(scene);updateLandscape=landscapeAssets.update;railway=trainAssets;railUpgrade=upgradeAssets;const hero=g.scene,b=new THREE.Box3().setFromObject(hero),size=b.getSize(new THREE.Vector3()),c=b.getCenter(new THREE.Vector3()),scale=3.4/Math.max(size.x,size.z);hero.scale.setScalar(scale);hero.position.set(-c.x*scale,-b.min.y*scale,-c.z*scale);vehicle.add(hero);vehicle.userData.collisionFootprint={halfWidth:size.x*scale/2,halfLength:size.z*scale/2,height:size.y*scale};skins=await loadSkins(vehicle,hero,accountStorage,saved,$('#skin-select'),shape=>
 state.status==='running'&&!tour.active&&!state.falling&&!parkBlocksVehicle(state.x,state.z,state.x,state.z,state.groundY+state.jumpY,state.yaw,state.yaw,shape));window.__heroParts=[];hero.traverse(o=>{if(o.isMesh)window.__heroParts.push(...(o.userData.sourceParts||[o.name]));});support=(x,z,y)=>{const a=r.support(x,z);return a===undefined?m.support(x,z,y):a;};support.npcBlocked=(...a)=>npcs.blocked(...a);support.vehicleBlocked=(...a)=>parkBlocksVehicle(...a,vehicle.userData.collisionFootprint);
support.vehicleContact=(...a)=>parkVehicleContact(...a,vehicle.userData.collisionFootprint);support.blocked=(...a)=>r.support.blocked(...a)||m.support.blocked(...a)||peachAssets.blocked(...a);window.__restReports=r.reports;updateGeneratedSnow=snowAssets.update;window.__snowAssetCount=snowAssets.count;window.__natureReports=natureAssets.reports;updateNature=natureAssets.update;window.__villageReports=villageReports;window.__dreamAssetCounts=dreamAssets.counts;updateDreamAssets=dreamAssets.update;ready=true;worldLoading.streetsReady();window.__moduleReports=m.reports;$('#start').disabled=false;$('#status').textContent='Lux3D 主题资产已接入 · 驿站 / 雪国机关 / 流星 / 云岸 / 城堡 / 楼阁 / 气球';reset();const alpineBackdrop=loadAlpineBackdrop();Promise.all([loadPark(scene),loadHauntAssets(scene).then(value=>{hauntReady=true;return value;}),alpineBackdrop]).then(async ([world])=>{park.setWorld(world);const common=buildCohesionWorld(scene);addForecourtRailCrossing(common,solids=>parkSolids.push({a:{x:-50,z:593,r:40},solids}));await loadCohesionArchitecture(scene,common,solids=>parkSolids.push({a:{x:0,z:620,r:1400},solids}));loadFestivalWorld(scene).then(w=>{festival.setWorld(w);residents.setWorld(buildResidentStoryWorld(scene,w.templates,support));return npcs.load().then(()=>{optimizeStaticWorld(scene);freezeWorldTransforms(scene);loadWorldDetail(scene).then(value=>worldDetail=value);navigationReady=true;worldLoading.complete();textureBudget.setQuality(preferences.value.quality);});}).catch(e=>{worldLoading.failed();console.error('Winter letters loading:',e);});}).catch(e=>{worldLoading.failed();console.error('Park asset loading:',e);document.querySelector('#park-map p').textContent='游乐区资产加载失败，请刷新重试。';});}).catch(e=>{worldLoading.failed();$('#status').textContent='模块检查未通过：'+e.message;$('#intro').hidden=false;$('#intro h1').textContent='加载未完成';$('#intro p').textContent=e.message;console.error(e);});
$('#start').onclick=()=>saved.unlocked?showMap('选择出发节点'):reset(true);$('#restart').onclick=()=>{if(ready)showMap('从已解锁节点重新出发');};canvas.tabIndex=0;
canvas.addEventListener('pointerdown',e=>{canvas.focus({preventScroll:true});if(e.button!==0)return;canvas.setPointerCapture(e.pointerId);drag={id:e.pointerId,x:e.clientX,y:e.clientY};});canvas.addEventListener('pointermove',e=>{if(drag?.id===e.pointerId){orbitYaw-=(e.clientX-drag.x)*.006*preferences.value.sensitivity;orbitPitch=THREE.MathUtils.clamp(orbitPitch+(e.clientY-drag.y)*.004*preferences.value.sensitivity,ride||park.skiFirstPerson?-.75:-.15,ride||park.skiFirstPerson?.75:1.2);drag.x=e.clientX;drag.y=e.clientY;}});for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,()=>drag=null);
function code(e){return e.key==='Shift'?'Shift':e.code;}
addEventListener('keydown',e=>{if(raceRecords.open)return;if(/INPUT|TEXTAREA|SELECT/.test(e.target?.tagName)||e.target?.isContentEditable){if(e.code==='Escape'&&mapOpen){e.preventDefault();hideMap();}return;}if(sky.active||sky.open){if(e.code==='Escape'||e.code==='KeyM'){sky.toggleMenu();clear();}else{keys.add(code(e));if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();}return;}if(mapOpen){if(e.code==='Escape'||e.code==='KeyM'){e.preventDefault();hideMap();}return;}if(e.target?.tagName==='BUTTON'&&['Space','Enter'].includes(e.code))return;if(residents.open||festival.open||collection.open||npcs.talking||state.rescueStory?.dialog||state.storyJournalOpen)return;if(['Space','ShiftLeft','ShiftRight','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)||e.key==='Shift')e.preventDefault();keys.add(code(e));if(e.code==='KeyE'&&!e.repeat)interactQueued=true;if(e.code==='Space'&&!e.repeat)jumpQueued=true;if(e.code==='KeyC'){orbitYaw=0;orbitPitch=ride||park.skiFirstPerson?0:.35;}if(e.code==='KeyR'&&!e.repeat&&ready)showMap('选择重新出发节点');if(e.code==='KeyM'&&!e.repeat){mapOpen?hideMap():showMap();}if(e.code==='Escape'&&mapOpen)hideMap();},{capture:true});addEventListener('keyup',e=>keys.delete(code(e)),{capture:true});addEventListener('blur',clear);
for(const el of document.querySelectorAll('[data-control]')){el.addEventListener('pointerdown',e=>{e.preventDefault();if(raceRecords.open)return;el.setPointerCapture(e.pointerId);keys.add(el.dataset.control);if(el.dataset.control==='KeyE')interactQueued=true;if(el.dataset.control==='Space')jumpQueued=true;});for(const n of ['pointerup','pointercancel','lostpointercapture'])el.addEventListener(n,()=>keys.delete(el.dataset.control));}
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();preferences.resize();});
let lastPaint=-Infinity;
let resetFrameClock=true;
const discardFrameTime=()=>{clear();resetFrameClock=true;};
document.addEventListener('visibilitychange',discardFrameTime);
document.addEventListener('resume',discardFrameTime);
function frame(now){requestAnimationFrame(frame);// Ground driving sweeps in 1/240 s substeps. Keep real driving time down to 10 fps,
 // while bounding tab resumes and leaving the separate ride/haunt physics step unchanged.
 const limit=ride||park.active||state.snow ? .05 : .1;
 if(document.hidden||worldLoading.waiting){last=now;return;}
 const firstWorldFrame=worldLoading.open;
 const activeSeconds=resetFrameClock||firstWorldFrame?0:Math.max(0,(now-last)/1000);
 const dt=Math.min(activeSeconds,limit);
 last=now;resetFrameClock=false;
if(sky.active){sky.update(raceRecords.open?0:dt,raceRecords.open?new Set():keys);vehicle.visible=false;updateSky(now/1000,camera,true);worldDetail?.update(camera,preferences.value.quality,dt);textureRecovery.update(scene,dt);if(new URLSearchParams(location.search).has('test'))window.__textureRecovery=textureRecovery;renderer.render(scene,camera);return;}sky.update(0,keys);
// Map/book interaction is HTML: cap only the paused 3D backdrop, preserving responsive controls.
if((mapOpen||raceRecords.open||collection.open||postcards.open)&&now-lastPaint<125)return;lastPaint=now;const boost=keys.has('Shift')||keys.has('ShiftLeft')||keys.has('ShiftRight'),steer=+(keys.has('KeyA')||keys.has('ArrowLeft'))-+(keys.has('KeyD')||keys.has('ArrowRight'));
const playPaused=raceRecords.open||sky.open||firstWorldFrame||residents.open||postcards.open||mapOpen||collection.open||npcs.talking||festival.open||!!state.rescueStory?.dialog||!!state.storyJournalOpen;if(state.rescueStory?.dialog||state.storyJournalOpen){state.speed=0;state.boost=false;}const previous={...state},previousRailTime=railTime;if(ready&&!playPaused&&(state.status==='running'||ride||park.active)&&!ride?.arrived)railTime+=dt;
if(ride){const t=trainAt(railTime,ride.id);if(t.station!==ride.origin)ride.departed=true;if(ride.departed&&t.station===ride.destination)ride.arrived=true;Object.assign(state,{x:t.x,z:t.z,groundY:t.y+2,jumpY:0,yaw:t.yaw,speed:0,boost:false,roll:0,status:'riding'});}
const tourHandled=tour.step(dt,{paused:playPaused,enabled:navigationReady&&!ride&&!park.active&&!state.snow,keys,railTime});
if(!playPaused&&!ride&&!tourHandled)stepRace(state,{hauntReady,safeExplore:state.mode==='explore',parkCruise:preferences.value.cruise,accelerate:keys.has('KeyW')||keys.has('ArrowUp'),reverse:keys.has('KeyS')||keys.has('ArrowDown'),boost,interact:interactQueued||keys.has('KeyE'),brake:keys.has('KeyB'),steer,jump:jumpQueued||keys.has('Space')},dt,state.elapsed+dt,support);if(!playPaused&&!ride&&!tourHandled&&previous.status==='running'&&!previous.snow&&!state.snow&&!parkProtected(previous.x,previous.z,previous.groundY)&&trainCollision(previous,{...state,status:'running'},previousRailTime,railTime)){if(state.mode==='explore'){state.x=previous.x;state.z=previous.z;state.speed=0;}else endRace(state,'与雪国列车相撞');}railway?.update(railTime);trainUI();jumpQueued=false;interactQueued=false;const reached=!playPaused?reachedStation(state,saved):null;if(reached){saved.unlocked=reached.id;skins?.refresh();if(reached.id===1&&!tour.active)skins?.apply('kangaroo');const stored=writeProgress(accountStorage,saved);if(!stored)$('#save-status').textContent='浏览器未允许保存；本次游玩仍可使用已解锁节点。';}
if(advanceChallenge(state,(!playPaused&&!ride&&!park.active)?activeSeconds:0)){raceRecords.end(state.challenge,'finished');}if(state.status!==lastStatus&&state.status==='lost'){clear();pendingFailure=true;$('#intro').hidden=true;}lastStatus=state.status;
skins?.update(playPaused?0:dt,state);snowImprints.update(state,dt,{active:ready&&!ride&&!park.active&&!festival.cinematic&&!failureAnimation.active,paused:playPaused,skin:vehicle.userData.skin});if(new URLSearchParams(location.search).has('test'))window.__snowImprintDebug=snowImprints.debug();document.body.classList.toggle('riding',!!ride);vehicle.visible=!ride&&!park.active&&!failureAnimation.active&&!festival.cinematic;document.body.classList.toggle('amusement',park.active);const micro=ride?1.6:state.snow?.22:1;if(window.__lastSnow!==!!state.snow){cameraYaw=state.yaw;camera.position.set(state.x-Math.sin(state.yaw)*14*micro,state.groundY+6*micro,state.z-Math.cos(state.yaw)*14*micro);window.__lastSnow=!!state.snow;}vehicle.scale.setScalar(micro);
vehicle.position.set(state.x,state.groundY+state.jumpY+.14*micro,state.z);vehicle.rotation.set(0,state.yaw,0);vehicle.rotateX(-vehicleGrounding.pitch(state,dt));vehicle.rotateZ(-(state.roll||0));vehicleGrounding.update(state);jet.visible=state.boost&&state.status==='running';jet.scale.y=1+.2*Math.sin(now*.03);
if(!residents.open&&!park.active&&!npcs.talking&&!festival.open){cameraYaw+=Math.atan2(Math.sin(state.yaw-cameraYaw),Math.cos(state.yaw-cameraYaw))*(1-Math.exp(-2.6*dt));const view=cameraYaw+orbitYaw;camera.position.lerp(vehicle.position.clone().add(new THREE.Vector3(-Math.sin(view)*14*micro*Math.cos(orbitPitch),(2+14*Math.sin(orbitPitch))*micro*Math.cos(state.roll||0),-Math.cos(view)*14*micro*Math.cos(orbitPitch)-(2+14*Math.sin(orbitPitch))*micro*Math.sin(state.roll||0)*(state.magDir||1))),1-Math.exp(-7*dt));const cameraTarget=vehicle.position.clone().add(new THREE.Vector3(0,state.magnetic?Math.cos(state.roll)*1.4:1.4*micro,state.magnetic?-Math.sin(state.roll)*1.4:0));if(state.status==='running'&&!ride&&!state.snow&&!state.magnetic&&!failureAnimation.active){const safe=clearCamera(cameraTarget,camera.position,parkSolids);camera.position.set(safe.x,safe.y,safe.z);if(new URLSearchParams(location.search).has('test'))window.__cameraClearanceDebug=safe;}camera.lookAt(cameraTarget);camera.fov=THREE.MathUtils.lerp(camera.fov,state.boost&&!preferences.value.comfort?68:60,1-Math.exp(-4*dt));camera.updateProjectionMatrix();}
if(pendingFailure){failureAnimation.start(vehicle,state,now);pendingFailure=false;vehicle.visible=false;}if(failureAnimation.active){vehicle.visible=false;if(failureAnimation.update(now,camera)&&state.status==='lost'&&!mapOpen&&!raceRecords.open){if(state.challenge&&!state.challenge.finished)endActiveRace('failed');else showMap('GAME OVER · 选择已解锁驿站重生');}}
updateHUD(state,boost,{amusement:park.active});document.body.classList.toggle('boosting',boost&&!state.snow);document.body.classList.toggle('impact',state.impact>0);updateChallenges(state.elapsed);updateSnow(state,dt);updateRescueUI(state);updateGeneratedSnow(state);updateDreamAssets(state.elapsed);updateNature(state.elapsed);updateRomance(state.elapsed);updateLandscape(now/1000);if(railUpgrade)railUpgrade.update(ride,railTime,camera,orbitYaw,orbitPitch,railway.trains,dt,keys);if(!ride)window.__cabinDebug={inside:false};park.update(raceRecords.open?0:dt,raceRecords.open?new Set():keys,orbitYaw,orbitPitch,mapOpen||raceRecords.open,ride);npcs.update(dt,{enabled:ready&&!raceRecords.open&&!residents.open&&!collection.open&&!festival.open&&!ride&&!park.active&&!state.snow,mapOpen,orbitYaw,orbitPitch});collection.update({ready,mapOpen,ride,amusement:park.active,talking:residents.open||npcs.talking||festival.open});festival.update(dt,{enabled:ready&&!raceRecords.open&&!residents.open&&!mapOpen&&!collection.open&&!ride&&!park.active&&!npcs.talking&&!state.snow&&state.status==='running'});residents.update(dt,ready&&!raceRecords.open&&!mapOpen&&!collection.open&&!ride&&!park.active&&!npcs.talking&&!festival.open&&!state.snow&&state.status==='running');updateRegionHints(state,now,ready&&!residents.open&&!mapOpen&&!collection.open&&!festival.open&&!ride&&state.status==='running');updateSky(now/1000,camera,!state.snow);scene.environmentIntensity=state.snow?.08:.35;preferences.audio.update(state,{ride:!!ride,amusement:park.active,paused:residents.open||mapOpen||collection.open||npcs.talking||festival.open});if(new URLSearchParams(location.search).has('test'))window.__preferencesDebug={...preferences.value,audioActive:preferences.audio.active,pixelRatio:renderer.getPixelRatio()};if(new URLSearchParams(location.search).has('test'))window.__renderProbe={scene,camera,renderer,THREE};const farPlane=state.snow?80:({low:1300,balanced:1800,high:2300}[preferences.value.quality]);if(camera.far!==farPlane){camera.far=farPlane;camera.updateProjectionMatrix();}groundGuide.update(now,ready&&!playPaused&&!ride&&!park.active&&!state.snow&&!state.magnetic&&!state.falling&&state.status==='running');if(new URLSearchParams(location.search).has('test'))window.__groundGuideDebug=groundGuide.debug();worldDetail?.update(camera,preferences.value.quality,dt);textureRecovery.update(scene,dt);if(new URLSearchParams(location.search).has('test'))window.__textureRecovery=textureRecovery;renderer.render(scene,camera);postcards.capture(renderer,scene,camera,now);if(new URLSearchParams(location.search).has('test'))window.__postcardDebug={open:postcards.open,has:postcards.has,saved:postcards.saved,pending:postcards.pending};
if(firstWorldFrame){worldLoading.present();resetFrameClock=true;}
window.__trainDebug={time:railTime,trains:trainsAt(railTime),ride:ride?{id:ride.id,destination:ride.destination,arrived:ride.arrived}:null};window.__gameDebug={ready,mapOpen,unlocked:saved.unlocked,...state,position:vehicle.position.toArray(),orbitYaw,orbitPitch,shiftDetected:boost,trackLength:TRACK_LENGTH,lengthRatio:TRACK_LENGTH/OLD_TRACK_LENGTH,levels:levelPlans};}
if(new URLSearchParams(location.search).has('test')){window.__raceRecords=raceRecords;window.__tourProbe={get shape(){return vehicle.userData.collisionFootprint;},clear:(a,b)=>createNavigationWorld(support,vehicle.userData.collisionFootprint).clear(a,b),blocked:(...a)=>support.blocked(...a)};window.__navigationSample=(x,z)=>createNavigationWorld(support,vehicle.userData.collisionFootprint).inspect(x,z);window.__trainTime=t=>{railTime=t;};window.__raceFixture=p=>{Object.assign(state,p);state.blocked=[];};window.__sampleAt=sampleAt;window.__moduleSupport=(x,z)=>support?.(x,z);window.__racePhysicsStep=(s,input,dt)=>stepRace(s,input,dt,s.elapsed||0,support);}
reset();requestAnimationFrame(frame);








