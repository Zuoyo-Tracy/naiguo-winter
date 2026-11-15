import {stargazeFraming,STAR_FIELD_HEIGHT} from './carnival-camera.js';
import {createFishingPond} from './fishing-world.js';
import {createMushroomParty} from './mushroom-world.js';
import {avenueMaterial} from './avenue-material.js';
import * as T from 'three';
import {GameAssetLoader as GLTFLoader} from './asset-loader.js';
import {carnivalAttractions,carnivalWalkways} from './carnival-layout.js';
import {gardenPaths,segmentPosition} from './cohesion-layout.js';
import {parkSolids} from './park-rules.js';
import {miniKinds,pinPosition,starPositions,constellationPatterns,hitCarnivalTarget} from './carnival-rules.js';
const assetIds=['pirate-ship','pirate-frame','drop-tower','drop-seat','balloon','observatory','ring-booth','duck-pond','duck','mushroom-booth','mushroom','bowling-lane','bowling-pin','bowling-ball'];

function buildAvenueRails(parent,walk,geometry,material){
 const dx=walk.x2-walk.x1,dz=walk.z2-walk.z1,length=Math.hypot(dx,dz);
 const across=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),Math.PI/2),vertical=new T.Quaternion();
 const matrices=[],solids=[];
 function bar(x,y,z,rotation,span){
  matrices.push(new T.Matrix4().compose(new T.Vector3(x,y,z),rotation,new T.Vector3(1,span,1)));
 }
 for(const side of [-1,1]){
  const x=side*(walk.width/2-.4);
  function addRun(from,to){
   const span=to-from;
   bar(x,.7,(from+to-length)/2,across,span);
   const posts=Math.ceil(span/10);
   for(let i=0;i<=posts;i++)bar(x,.35,from+span*i/posts-length/2,vertical,.7);
   // Use the same endpoints for rendering and physics. Short collision boxes
   // keep navigation's spatial index local even on the 740 m avenues.
   const pieces=Math.ceil(span/16);
   for(let i=0;i<pieces;i++){
    const at=from+span*(i+.5)/pieces;
    solids.push({id:'carnival-avenue-rail',x:walk.x1+(dx*at+dz*x)/length,z:walk.z1+(dz*at-dx*x)/length,
     y:parent.position.y,width:.16,depth:span/pieces,height:.78,rotate:parent.rotation.y});
   }
  }
  let start=null;
  for(let at=0;at<length;at+=5){
   const middle=(at+Math.min(at+5,length))/2,wx=walk.x1+dx*middle/length,wz=walk.z1+dz*middle/length;
   const edgeX=wx+dz*x/length,edgeZ=wz-dx*x/length;
   const opening=carnivalAttractions.some(a=>Math.hypot(a.anchor.x-wx,a.anchor.z-wz)<12)||
    carnivalWalkways.some(other=>other!==walk&&segmentPosition(wx,wz,other).d<11)||
    gardenPaths.some(p=>segmentPosition(edgeX,edgeZ,p).d<p.width/2+(p.shoulder||0)+2);
   if(!opening&&start===null)start=at;
   if(opening&&start!==null){addRun(start,at);start=null;}
  }
  if(start!==null)addRun(start,length);
 }
 if(!matrices.length)return;
 const batch=new T.InstancedMesh(geometry,material,matrices.length);
 batch.name='Carnival avenue brass rails';
 matrices.forEach((matrix,i)=>batch.setMatrixAt(i,matrix));
 batch.computeBoundingSphere();parent.add(batch);
 parkSolids.push({a:{x:parent.position.x,z:parent.position.z,r:length/2+walk.width/2},solids});
}

export async function loadCarnival(scene,roots){
 const loader=new GLTFLoader(),templates=new Map(await Promise.all(assetIds.map(async id=>[id,(await loader.loadAsync('/assets/carnival/'+(id==='balloon'?'balloon-closed':id)+'.glb')).scene]))),rides=new Map();
 const brass=new T.MeshStandardMaterial({color:0x9b7843,metalness:.6,roughness:.4}),wood=new T.MeshStandardMaterial({color:0x765b45,roughness:.9}),stone=new T.MeshStandardMaterial({color:0xc4b5a0,roughness:.95});
 function model(id,parent,size,{x=0,y=0,z=0,axis='y',yaw=0}={}){const source=templates.get(id).clone(true);if(['pirate-ship','bowling-lane'].includes(id)){source.updateMatrixWorld(true);let xx=0,zz=0,xz=0,n=0,sx=0,sz=0;const v=new T.Vector3();source.traverse(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position;for(let i=0;i<p.count;i+=7){v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);sx+=v.x;sz+=v.z;xx+=v.x*v.x;zz+=v.z*v.z;xz+=v.x*v.z;n++;}});const angle=.5*Math.atan2(2*(xz-sx*sz/n),xx-sx*sx/n-zz+sz*sz/n);source.rotation.y+=angle-(id==='bowling-lane'?Math.PI/2:0);source.updateMatrixWorld(true);}const b=new T.Box3().setFromObject(source),s=b.getSize(new T.Vector3()),c=b.getCenter(new T.Vector3());source.position.sub(new T.Vector3(c.x,b.min.y,c.z));const root=new T.Group();root.add(source);root.scale.setScalar(size/s[axis]);root.position.set(x,y,z);root.rotation.y=yaw;root.name='Lux3D carnival '+id;parent.add(root);return root;}
 function mesh(geometry,material,parent,x=0,y=0,z=0){const m=new T.Mesh(geometry,material);m.position.set(x,y,z);parent.add(m);return m;}
 function beam(parent,a,b,r=.12){const d=b.clone().sub(a),m=mesh(new T.CylinderGeometry(r,r,d.length(),10),brass,parent);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return m;}
 const cloud=(await loader.loadAsync('/assets/cotton-cloudbank-lod.glb')).scene,cb=new T.Box3().setFromObject(cloud),cs=cb.getSize(new T.Vector3()),cc=cb.getCenter(new T.Vector3());cloud.position.sub(new T.Vector3(cc.x,cb.max.y,cc.z));
 const railShape=new T.CylinderGeometry(.08,.08,1,10);
 for(const w of carnivalWalkways){
  const dx=w.x2-w.x1,dz=w.z2-w.z1,length=Math.hypot(dx,dz),g=new T.Group();
  g.name='Carnival connecting avenue';g.position.set((w.x1+w.x2)/2,32,(w.z1+w.z2)/2);
  g.rotation.y=Math.atan2(dx,dz);scene.add(g);
  mesh(new T.BoxGeometry(w.width,1.8,length+2),avenueMaterial(),g,0,-.9,0);
  buildAvenueRails(g,w,railShape,brass);
  for(let t=0;t<=1;t+=Math.min(1,55/length)){
   const bank=new T.Group();bank.add(cloud.clone(true));bank.scale.set(28/cs.x,8/cs.y,62/cs.z);
   bank.position.set(w.x1+dx*t,30,w.z1+dz*t);bank.rotation.y=g.rotation.y;scene.add(bank);
  }
 }
 // The open fence at the bumper plaza joins this promenade, never a train track.
 for(const a of carnivalAttractions){const root=roots.get(a.id),seat=new T.Group();seat.name='Carnival passenger anchor '+a.id;root.add(seat);const ride={a,root,seat,targets:[],actors:[],phase:0};rides.set(a.id,ride);
 const fixedParts=[];
 if(a.kind==='pirate'){model('pirate-frame',root,24);const pivot=new T.Group();pivot.position.set(0,12,0);root.add(pivot);const boat=model('pirate-ship',pivot,15,{axis:'x',y:-8});boat.updateMatrixWorld(true);beam(pivot,new T.Vector3(0,0,0),new T.Vector3(-5,-5,0),.16);beam(pivot,new T.Vector3(0,0,0),new T.Vector3(5,-5,0),.16);pivot.add(seat);seat.position.set(0,-6.5,.6);ride.pivot=pivot;ride.boat=boat;}
 if(a.kind==='drop'){model('drop-tower',root,24);const carriage=new T.Group();root.add(carriage);model('drop-seat',carriage,5.2,{axis:'x'});carriage.position.set(0,1,4.2);carriage.add(seat);
 // Cushion top is 1.397 m; the scaled seated passenger's hip is 0.396 m above its origin.
 seat.position.set(0,1,-.25);ride.carriage=carriage;}
 if(a.kind==='balloon'){const lift=new T.Group();root.add(lift);model('balloon',lift,17);lift.add(seat);
 // The generated basket has a rear bench at 1.31 m and a floor at 0.52 m.
 seat.position.set(0,.99,-1);ride.lift=lift;
 const gate=new T.Group();gate.name='Balloon basket boarding gate';gate.position.set(-.68,.56,1.72);lift.add(gate);
 for(const x of [0,1.36])beam(gate,new T.Vector3(x,0,0),new T.Vector3(x,1.7,0),.045);
 for(const y of [.2,.86,1.7])beam(gate,new T.Vector3(0,y,0),new T.Vector3(1.36,y,0),.04);
 for(const x of [.34,.68,1.02])beam(gate,new T.Vector3(x,.2,0),new T.Vector3(x,1.7,0),.023);
 ride.boardingGate=gate;}
 if(a.kind==='stargaze'){fixedParts.push(model('observatory',root,4.5));seat.position.set(0,.4,4);const sky=new T.Group();sky.position.set(0,STAR_FIELD_HEIGHT,-9);root.add(sky);ride.sky=sky;starPositions.forEach(([x,y],i)=>{const star=mesh(new T.SphereGeometry(.36,12,8),new T.MeshBasicMaterial({color:0xeace8a}),sky,x,y,0);star.userData.target=i;ride.targets.push(star);const label=document.createElement('canvas');label.width=64;label.height=64;const c=label.getContext('2d');c.fillStyle='#ffedb0';c.font='bold 42px Georgia';c.textAlign='center';c.fillText(String(i+1),32,45);const spr=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(label),transparent:true,depthWrite:false}));spr.position.set(x+.6,y+.4,0);spr.scale.set(1.1,1.1,1.1);sky.add(spr);});const constellationGeometry=new T.BufferGeometry();constellationGeometry.setAttribute('position',new T.Float32BufferAttribute(new Float32Array(12),3));constellationGeometry.setDrawRange(0,0);const constellation=new T.Line(constellationGeometry,new T.LineBasicMaterial({color:0xffd77b}));sky.add(constellation);ride.constellation=constellation;sky.visible=false;}
 if(a.kind==='ringtoss'){fixedParts.push(model('ring-booth',root,5.6,{axis:'x',z:-3}));seat.position.set(0,0,9);const ring=mesh(new T.TorusGeometry(.65,.1,8,40),brass,root,0,2,8);ring.rotation.x=Math.PI/2;ring.visible=false;ride.projectile=ring;for(let i=0;i<3;i++){const ring=mesh(new T.TorusGeometry(.65,.1,8,40),brass,root,(i-1)*1.15,3.35,-3);ring.rotation.x=Math.PI/2;ring.visible=false;ride.actors.push(ring);}}
 if(a.kind==='ducks'){ride.fishing=createFishingPond(root,templates.get('duck-pond'),templates.get('duck'));ride.seat=ride.fishing.seat;}
 if(a.kind==='mushrooms'){ride.mushrooms=createMushroomParty(root,templates.get('mushroom-booth'),templates.get('mushroom'));fixedParts.push(...ride.mushrooms.fixtures);seat.position.set(0,0,8);}
 if(a.kind==='bowling'){const lane=model('bowling-lane',root,21,{axis:'z',y:.05});ride.lane=lane;fixedParts.push(lane);seat.position.set(0,.5,10);ride.projectile=model('bowling-ball',root,.9,{y:.5,z:8});ride.projectile.visible=false;for(let i=0;i<10;i++){const p=pinPosition(i),pin=model('bowling-pin',root,1.5,{x:p.x,y:.45,z:p.z});ride.actors.push(pin);fixedParts.push(pin);}}
 if(fixedParts.length){
  const group=parkSolids.find(item=>item.a.id===a.id);
  const measured=fixedParts.map(part=>{
   part.updateWorldMatrix(true,true);
   const box=new T.Box3().setFromObject(part,true),center=box.getCenter(new T.Vector3()),size=box.getSize(new T.Vector3());
   return {id:'ride',x:center.x,z:center.z,y:box.min.y,width:size.x,depth:size.z,height:size.y};
  });
  group.solids=group.solids.filter(s=>s.id!=='ride').concat(measured);
 }
 }
 let time=0;function animate(dt,active){time+=dt;for(const ride of rides.values()){const a=ride.a,t=active?.attraction.id===a.id?active.time:time,playing=active?.attraction.id===a.id;
 if(a.kind==='pirate')ride.pivot.rotation.z=Math.sin(t*.8)*(playing?Math.min(.9,t*.08):.12);
 if(a.kind==='drop'){const q=(t%12)/12;ride.carriage.position.y=playing?(q<.6?1+q/.6*15:q<.7?16:q<.9?16-((q-.7)/.2)**2*15:1):1;}
 if(a.kind==='balloon'){ride.lift.position.y=playing?Math.sin(Math.min(1,t/a.duration)*Math.PI)*28+1:1;ride.lift.rotation.z=Math.sin(t*.5)*.018;ride.boardingGate.rotation.y=playing?0:-Math.PI/2;}
 if(a.kind==='ducks')ride.fishing.animate(playing?active.round:null,t);
 if(a.kind==='mushrooms')ride.mushrooms.animate(playing?active.round:null,t);
 if(a.kind==='stargaze'){ride.sky.visible=playing;if(playing){const r=active.round,key=r.pattern+':'+r.step+':'+r.finished;if(ride.constellationKey!==key){ride.constellationKey=key;const points=constellationPatterns[Math.min(2,r.pattern)].slice(0,r.finished?4:r.step),g=ride.constellation.geometry,position=g.attributes.position;points.forEach((index,i)=>position.setXYZ(i,...starPositions[index],0));position.needsUpdate=true;g.setDrawRange(0,points.length);g.computeBoundingSphere();}}}
 if(playing&&ride.projectile){const p=active.round.projectile;ride.projectile.visible=!!p;if(p){ride.projectile.position.set(p.x,p.y+(a.kind==='bowling'?.45:0),p.z);ride.projectile.rotation.z=p.t*6;}}
 if(playing&&a.kind==='ringtoss')ride.actors.forEach((m,i)=>m.visible=active.round.hits.includes(i));
 if(playing&&a.kind==='bowling')ride.actors.forEach((pin,i)=>{pin.rotation.z=T.MathUtils.lerp(pin.rotation.z,active.round.pins[i].hit?1.45:0,.2);pin.position.y=active.round.pins[i].hit?.65:.45;});
 }}
 function targetAt(clientX,clientY,camera,active){if(!active||!miniKinds.has(active.kind))return;const ride=rides.get(active.attraction.id),canvas=document.querySelector('#world'),b=canvas.getBoundingClientRect(),ray=new T.Raycaster();ray.setFromCamera(new T.Vector2((clientX-b.left)/b.width*2-1,-(clientY-b.top)/b.height*2+1),camera);if(ride.fishing){ride.fishing.pick(ray,active.round);return;}if(ride.mushrooms){ride.mushrooms.pick(ray,active.round);return;}const hit=ray.intersectObjects(ride.targets,true)[0];if(!hit)return;let o=hit.object;while(o&&o.userData.target===undefined)o=o.parent;if(o)hitCarnivalTarget(active.round,o.userData.target);}
 function cameraAndActor(active,camera,actor,orbitYaw,orbitPitch,dt){const ride=rides.get(active.attraction.id),a=ride.a;ride.seat.updateWorldMatrix(true,true);const pos=ride.seat.getWorldPosition(new T.Vector3());actor.userData.originalScale??=actor.scale.x;actor.scale.setScalar(actor.userData.originalScale*(a.kind==='drop'?1.23:1));actor.position.copy(pos);actor.quaternion.copy(ride.seat.getWorldQuaternion(new T.Quaternion()));actor.visible=!active.inside;let target=pos.clone().add(new T.Vector3(0,1,0)),desired;
 if(a.kind==='ducks')return ride.fishing.cameraAndActor(camera,actor,orbitYaw,orbitPitch,dt);
 if(a.kind==='mushrooms')return ride.mushrooms.cameraAndActor(camera,actor,dt);
 if(miniKinds.has(a.kind)){actor.visible=false;if(a.kind==='stargaze'){const frame=stargazeFraming(camera.aspect,innerHeight);target.set(a.x,a.y+frame.aimY,a.z-9);desired=target.clone().add(new T.Vector3(0,0,frame.distance));}else{desired=new T.Vector3(a.x+Math.sin(orbitYaw)*4,a.y+(a.kind==='bowling'?12:a.kind==='mushrooms'?5:9),a.z+(a.kind==='bowling'?18:a.kind==='mushrooms'?7:12));target.set(a.x,a.y+1.5,a.z-1);}}
 else if(active.inside){actor.visible=false;camera.position.copy(pos).add(new T.Vector3(0,1.4,0));camera.lookAt(camera.position.clone().add(new T.Vector3(Math.sin(orbitYaw)*20,Math.sin(orbitPitch)*8,Math.cos(orbitYaw)*20)));return pos;}
 else{const distance=a.kind==='pirate'?20:a.kind==='drop'?13:17;desired=target.clone().add(new T.Vector3(Math.sin(orbitYaw+(a.kind==='pirate'?1.32:.45))*distance,6+Math.sin(orbitPitch)*4,Math.cos(orbitYaw+(a.kind==='pirate'?1.32:.45))*distance));}
 camera.position.lerp(desired,1-Math.exp(-6*dt));camera.lookAt(target);camera.fov=55;camera.updateProjectionMatrix();return pos;
 }
 return {rides,animate,targetAt,cameraAndActor,assetIds};
}
