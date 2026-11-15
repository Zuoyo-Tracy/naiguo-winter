import * as T from 'three';
import {fishingPond as pond,fishingSpecies,fishingAction} from './fishing-rules.js';

export function createFishingPond(root,pondSource,duckSource){
 const wood=new T.MeshStandardMaterial({color:0x684d38,roughness:.88}),trim=new T.MeshStandardMaterial({color:0xb29160,metalness:.3,roughness:.6}),leaf=new T.MeshStandardMaterial({color:0x5d806b,side:T.DoubleSide,roughness:.9});
 const mesh=(g,m,parent,x=0,y=0,z=0)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);parent.add(o);return o;};
 function beam(parent,a,b,r,material=wood){const v=b.clone().sub(a),o=mesh(new T.CylinderGeometry(r,r,v.length(),8),material,parent);o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return o;}
 const v=(x,y,z)=>new T.Vector3(x,y,z);
 // Retain the carved rim but remove its old, opaque generated water surface.
 pondSource.updateMatrixWorld(true);const box=new T.Box3().setFromObject(pondSource),size=box.getSize(v()),center=box.getCenter(v());
 const rim=new T.Group();rim.name='Expanded carved fishing pond';root.add(rim);
 pondSource.traverse(o=>{if(!o.isMesh)return;const g=o.geometry.clone().applyMatrix4(o.matrixWorld);g.translate(-center.x,-box.min.y,-center.z);g.scale(pond.radius*2/size.x,1.25/size.y,pond.radius*2/size.z);const p=g.attributes.position,old=g.index,indices=[];const groups=g.groups.length?g.groups:[{start:0,count:old?old.count:p.count,materialIndex:0}];g.clearGroups();for(const group of groups){const start=indices.length;for(let i=group.start;i<group.start+group.count;i+=3){const ids=[0,1,2].map(j=>old?old.getX(i+j):i+j),x=ids.reduce((s,id)=>s+p.getX(id),0)/3,z=ids.reduce((s,id)=>s+p.getZ(id),0)/3;if(Math.hypot(x,z)>pond.waterRadius&&ids.every(id=>Math.hypot(p.getX(id),p.getZ(id))>=pond.waterRadius))indices.push(...ids);}g.addGroup(start,indices.length-start,group.materialIndex);}g.setIndex(indices);g.computeBoundingSphere();mesh(g,o.material,rim);});
 const bottom=mesh(new T.CircleGeometry(pond.waterRadius,96),new T.MeshStandardMaterial({color:0x779c9c,roughness:.9}),root,0,.22,0);bottom.rotation.x=-Math.PI/2;
 mesh(new T.CylinderGeometry(pond.waterRadius,pond.waterRadius,1.05,96,1,true),new T.MeshStandardMaterial({color:0x8d9a94,roughness:.9,side:T.BackSide}),root,0,.75,0);
 const coping=mesh(new T.RingGeometry(pond.waterRadius,14.05,128),new T.MeshStandardMaterial({color:0xbeb09a,roughness:.85}),root,0,1.28,0);coping.name='Continuous smooth stone pond coping';coping.rotation.x=-Math.PI/2;
 const water=mesh(new T.CircleGeometry(pond.waterRadius,96),new T.MeshPhysicalMaterial({color:0x9bd7e0,roughness:.24,metalness:.04,transparent:true,opacity:.55,depthWrite:false}),root,0,pond.waterY,0);water.rotation.x=-Math.PI/2;water.name='Fishing pond water';
 const ripples=[];for(let i=0;i<10;i++){const m=mesh(new T.RingGeometry(.78,.80,48),new T.MeshBasicMaterial({color:0xe5f7f1,transparent:true,opacity:.15,depthWrite:false,side:T.DoubleSide}),root,Math.sin(i*2.4)*(4+i*.6),pond.waterY+.014,Math.cos(i*2.4)*(4+i*.6));m.rotation.x=-Math.PI/2;ripples.push(m);}
 // Low reeds and lily pads frame the water without hiding the float or landing.
 for(let i=0;i<12;i++){const angle=.15+i*Math.PI/13,x=Math.cos(angle)*11.5,z=Math.sin(angle)*11.5;for(let j=0;j<3;j++){beam(root,v(x+j*.12,.6,z),v(x+j*.16,1.7+(j%2)*.4,z+.2),.035,leaf);}if(i%2===0){const pad=mesh(new T.CircleGeometry(.7,24,0,Math.PI*1.85),leaf,root,x*.82,pond.waterY+.025,z*.82);pad.rotation.x=-Math.PI/2;}}
 const deck=new T.Group();deck.name='Fishing timber landing';root.add(deck);deck.position.y=.25;
 for(let i=0;i<19;i++){const board=mesh(new T.BoxGeometry(4.5,.2,.30),i%3?wood:trim,deck,0,1.04,-14.8+i*.32);board.name='Fishing dock plank';for(const x of [-2,2])mesh(new T.SphereGeometry(.025,6,4),trim,deck,x,1.15,board.position.z);}
 for(const x of [-2.15,2.15])for(const z of [-14.6,-9.2])mesh(new T.CylinderGeometry(.12,.17,1.25,8),wood,deck,x,.6,z);
 mesh(new T.BoxGeometry(1.9,.16,1.35),wood,deck,0,1.72,pond.dockZ-.18);
 mesh(new T.BoxGeometry(1.9,.7,.12),wood,deck,0,2.1,pond.dockZ-.85);
 for(const x of [-.75,.75])for(const z of [-.65,.35])mesh(new T.BoxGeometry(.12,.65,.12),wood,deck,x,1.4,pond.dockZ+z);
 const basket=new T.Group();basket.position.set(-1.5,1.40,-12);root.add(basket);mesh(new T.CylinderGeometry(.5,.38,.65,20,1,true),wood,basket,0,.325,0);mesh(new T.CircleGeometry(.38,20),wood,basket,0,.015,0).rotation.x=-Math.PI/2;for(let i=0;i<5;i++)mesh(new T.TorusGeometry(.4+i*.022,.024,6,30),trim,basket,0,.07+i*.125,0).rotation.x=Math.PI/2;
 const seat=new T.Group();seat.name='Fishing passenger anchor';seat.position.set(0,pond.seatY,pond.dockZ);root.add(seat);
 const rod=new T.Group();rod.name='Nailong fishing rod';rod.position.set(.48,2.78,pond.dockZ+.65);root.add(rod);const curve=new T.QuadraticBezierCurve3(v(0,0,0),v(0,1.9,1.4),v(0,1.65,3.6));mesh(new T.TubeGeometry(curve,24,.025,7,false),wood,rod);beam(rod,v(0,-.12,-.1),v(0,.24,.2),.065,trim);mesh(new T.TorusGeometry(.13,.035,8,16),trim,rod,.08,.02,.03).rotation.y=Math.PI/2;
 const tip=v(0,1.65,3.6),bobber=new T.Group();bobber.name='Fishing red white float';root.add(bobber);
 mesh(new T.SphereGeometry(.19,16,12,0,Math.PI*2,0,Math.PI/2),new T.MeshStandardMaterial({color:0xd95642,roughness:.48}),bobber,0,.13,0);
 mesh(new T.SphereGeometry(.19,16,12,0,Math.PI*2,Math.PI/2,Math.PI/2),new T.MeshStandardMaterial({color:0xfff5da}),bobber,0,.13,0);
 mesh(new T.CylinderGeometry(.025,.025,.5,8),trim,bobber,0,.40,0);
 const lineGeometry=new T.BufferGeometry().setFromPoints([v(),v(),v()]),line=new T.Line(lineGeometry,new T.LineBasicMaterial({color:0xf5e7c3,transparent:true,opacity:.85}));line.name='Fishing line';root.add(line);
 const biteRing=mesh(new T.RingGeometry(.55,.64,48),new T.MeshBasicMaterial({color:0xffd580,transparent:true,opacity:.8,depthWrite:false,side:T.DoubleSide}),root);biteRing.name='Fishing bite ripple';biteRing.rotation.x=-Math.PI/2;
 function makeFish(color){const fish=new T.Group(),mat=new T.MeshStandardMaterial({color,roughness:.42,metalness:.12});mesh(new T.SphereGeometry(1,20,12),mat,fish).scale.set(.62,.23,.27);const tail=new T.Shape();tail.moveTo(-.4,0);tail.lineTo(-.98,.35);tail.lineTo(-.92,-.35);tail.closePath();const fin=mesh(new T.ShapeGeometry(tail),new T.MeshStandardMaterial({color,roughness:.6,side:T.DoubleSide}),fish);fin.rotation.x=Math.PI/2;fish.userData.tail=fin;const dorsal=mesh(new T.ConeGeometry(.15,.25,3),mat,fish,-.1,.22,0);dorsal.scale.z=.3;for(const side of [-1,1])mesh(new T.SphereGeometry(.045,8,6),new T.MeshBasicMaterial({color:0x282c31}),fish,.38,.055,side*.22);return fish;}
 const fish=[];for(let i=0;i<8;i++){const f=makeFish(fishingSpecies[i%4].color);root.add(f);fish.push(f);}
 const caught=makeFish(0xe5ae55);caught.name='Fishing landed fish';root.add(caught);
 const basketFish=Array.from({length:3},(_,i)=>{const f=makeFish(fishingSpecies[i].color);f.name='Fish in basket '+i;f.position.set((i-1)*.11,.55+i*.03,0);f.rotation.y=i*1.1;f.scale.setScalar(.52);basket.add(f);return f;});
 const ducks=[];for(let i=0;i<2;i++){const raw=duckSource.clone(true),b=new T.Box3().setFromObject(raw),s=b.getSize(v()),c=b.getCenter(v());raw.position.sub(v(c.x,b.min.y,c.z));const g=new T.Group();g.add(raw);g.scale.setScalar(.8/s.y);g.name='Pond duck scenery';root.add(g);ducks.push(g);}
 const tipPosition=v(),landing=v(-1.5,2.15,-12),previous=v();let lastPhase='';
 function animate(r,time){
  const active=!!r;basketFish.forEach((f,i)=>{f.visible=active&&i<r.catches.length;});rod.visible=active;bobber.visible=line.visible=active&&['casting','waiting','nibbling','bite','reeling'].includes(r.phase);caught.visible=active&&r.phase==='reeling';biteRing.visible=active&&['waiting','nibbling','bite'].includes(r.phase);
  fish.forEach((f,i)=>{const angle=time*(.08+i*.006)+i*.86,rad=4+i*.7;f.position.set(Math.cos(angle)*rad,.5+Math.sin(time+i)*.025,Math.sin(angle)*rad);f.rotation.y=-angle-Math.PI/2;f.userData.tail.rotation.z=Math.sin(time*5+i)*.12;});
  ducks.forEach((d,i)=>{const angle=time*.05+i*1.9;d.position.set(Math.cos(angle)*9,pond.waterY-.05,Math.sin(angle)*6+3);d.rotation.y=-angle;});
  ripples.forEach((m,i)=>{const q=(time*.16+i*.17)%1;m.scale.setScalar(.5+q*1.4);m.material.opacity=(1-q)*.15;});
  if(!active){lastPhase='';return;}
  rod.rotation.x=r.phase==='casting'?-.65*Math.sin(Math.min(1,r.phaseTime/.7)*Math.PI):r.phase==='reeling'?-.3*Math.sin(Math.min(1,r.phaseTime/1.35)*Math.PI):0;
  rod.updateWorldMatrix(true,false);tipPosition.copy(tip);rod.localToWorld(tipPosition);root.worldToLocal(tipPosition);
  const endpoint=v(r.aim.x,pond.waterY,r.aim.z);
  if(r.phase==='casting'){const q=Math.min(1,r.phaseTime/.7);bobber.position.copy(tipPosition).lerp(endpoint,q);bobber.position.y+=Math.sin(q*Math.PI)*2;}
  else if(r.phase==='reeling'){const q=Math.min(1,r.phaseTime/1.35);bobber.position.copy(endpoint).lerp(landing,q);bobber.position.y+=Math.sin(q*Math.PI)*3.2;caught.position.copy(bobber.position).add(v(0,-.22,0));caught.rotation.set(Math.sin(time*14)*.3,Math.sin(time*10)*.6,Math.sin(time*8)*.3);}
  else{bobber.position.copy(endpoint);bobber.position.y+=(r.phase==='bite'?-.26+Math.sin(time*14)*.05:r.phase==='nibbling'?Math.sin(time*13)*.10:Math.sin(time*3)*.025);}
  bobber.rotation.z=r.phase==='bite'?Math.sin(time*11)*.5:Math.sin(time*2)*.07;
  const attr=lineGeometry.attributes.position;previous.copy(tipPosition).lerp(bobber.position,.5);previous.y-=.18;[tipPosition,previous,bobber.position].forEach((p,i)=>attr.setXYZ(i,p.x,p.y,p.z));attr.needsUpdate=true;lineGeometry.computeBoundingSphere();
  biteRing.position.set(r.aim.x,pond.waterY+.04,r.aim.z);biteRing.scale.setScalar(r.phase==='bite'?1.1+.3*Math.sin(time*8):.6+((time*.65)%1));biteRing.material.opacity=r.phase==='bite'?.9:r.phase==='nibbling'?.45:.15;
  if(lastPhase!==r.phase&&r.pending){caught.traverse(o=>{if(o.isMesh&&o.material.color.getHex()!==0x282c31)o.material.color.setHex(r.pending.color);});lastPhase=r.phase;}
 }
 function pick(ray,r){const hit=ray.intersectObject(water)[0];if(!hit)return false;const p=root.worldToLocal(hit.point.clone());return fishingAction(r,p);}
 function cameraAndActor(camera,actor,orbitYaw,orbitPitch,dt){
  seat.updateWorldMatrix(true,true);const position=seat.getWorldPosition(v());actor.position.copy(position);actor.quaternion.copy(seat.getWorldQuaternion(new T.Quaternion()));actor.visible=true;
  const narrow=camera.aspect<.8,angle=Math.max(-.6,Math.min(.6,orbitYaw));const offset=v((narrow?5:7)+Math.sin(angle)*10,(narrow?14:11)+Math.sin(orbitPitch)*3,narrow?-22:-23);
  const desired=root.localToWorld(offset),target=root.localToWorld(v(0,narrow?1:1.4,narrow?-5.5:-3.5));camera.position.lerp(desired,1-Math.exp(-6*dt));camera.fov=narrow?66:54;camera.lookAt(target);camera.updateProjectionMatrix();return position;
 }
 animate(null,0);return {seat,water,animate,pick,cameraAndActor};
}
