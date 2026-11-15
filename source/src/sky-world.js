import {loadFinalAssets,finalSkyNames} from './final-assets.js';
import {buildSkyOutings} from './sky-outing-world.js';
import * as T from 'three';
import {GameAssetLoader} from './asset-loader.js';
import {skyChapters,skyLegs} from './sky-journey.js';
export function buildSkyWorld(scene,{rescued=false}={}){
 const group=new T.Group();group.name='Cloud wish post chapter';group.visible=false;scene.add(group);
 const ivory=new T.MeshStandardMaterial({color:'#e9dfce',roughness:.85}),bronze=new T.MeshStandardMaterial({color:'#a88749',metalness:.55,roughness:.35}),green=new T.MeshStandardMaterial({color:'#355c57',roughness:.7}),rock=new T.MeshStandardMaterial({color:'#777d98',roughness:1}),glow=new T.MeshBasicMaterial({color:'#ffe5a6'});
 const solids=[],islands=[],actors=[];let outings=null;
 const mesh=(geo,mat,x,y,z,parent=group)=>{const m=new T.Mesh(geo,mat);m.position.set(x,y,z);parent.add(m);return m;};
 const sphere=new T.SphereGeometry(1,12,8);
 skyChapters.forEach((chapter,i)=>chapter.points.forEach((p,j)=>{
  const [x,y,z]=p,base=new T.Group();base.position.set(x,y-7,z+22);group.add(base);islands.push(base);solids.push({x,y:y-23,z:z+22,r:17});
  const hoop=mesh(new T.TorusGeometry(8,.2,8,64),bronze,x,y,z);hoop.userData.node=i*3+j;

 }));
 const windRings=[];
 const themes=[0xd8c99d,0xb7d9c9,0xcabde6,0xc3d5e5,0xf0cf9a];
 for(const leg of skyLegs.flat())for(const [nav,p] of leg.gates.entries()){
  const ring=new T.Group();ring.name=`Wind relay ${leg.chapter}-${leg.node}-${nav}`;ring.position.set(...p);ring.lookAt(...leg.end);group.add(ring);
  const rim=mesh(new T.TorusGeometry(10,.14,6,40),new T.MeshBasicMaterial({color:themes[leg.chapter]}),0,0,0,ring);const crown=mesh(new T.OctahedronGeometry(.65),glow,0,11,0,ring);windRings.push({ring,rim,crown,chapter:leg.chapter,node:leg.node,nav});
 }
 // Layered cloud banks under the route create a connected landscape while leaving the air corridor clear.
 const banks=new T.InstancedMesh(sphere,new T.MeshStandardMaterial({color:0xc8d5e4,roughness:1}),skyLegs.flat().reduce((n,l)=>n+l.gates.length*3,0));banks.name='Cloud ridge beneath the postal route';const bankMatrix=new T.Matrix4();let bankIndex=0;
 for(const leg of skyLegs.flat())for(const [i,p] of leg.gates.entries())for(let j=0;j<3;j++){bankMatrix.compose(new T.Vector3(p[0]+(j-1)*15,p[1]-38-j*4,p[2]+25+(i%2)*12),new T.Quaternion(),new T.Vector3(23+j*4,10+j*2,20));banks.setMatrixAt(bankIndex++,bankMatrix);}banks.computeBoundingSphere();group.add(banks);
 const marker=new T.Group();group.add(marker);
 mesh(new T.BoxGeometry(2.8,1.8,.25),ivory,0,0,0,marker);
 const seam=mesh(new T.TorusGeometry(.8,.06,6,3),bronze,0,.2,-.2,marker);seam.rotation.z=Math.PI;
 const halo=mesh(new T.TorusGeometry(3,.08,8,32),glow,0,0,0,marker);
 const balloon=mesh(sphere,green,0,5,0,marker);balloon.scale.set(2,2.7,2);const rope=mesh(new T.CylinderGeometry(.05,.05,4,6),bronze,0,2,0,marker);
 const plane=mesh(new T.ConeGeometry(3,5,3),ivory,0,0,0,marker);plane.rotation.x=Math.PI/2;
 // Reuse the same authored winter architecture and residents as the park below.
 const names=['cloud-island','postal-tower','wish-postoffice','wish-mailbox','winter-planter','winter-lamp','winter-bench','winter-wayfinder'];
 const urls=[...names.map(n=>'/assets/finish/'+n+'.glb'),'/assets/friendly/welcome.glb',rescued?'/assets/npc-mouse.glb':'/assets/friendly/traveler.glb',rescued?'/assets/npc-pink.glb':'/assets/friendly/cheerer.glb',...['reader','chef','thinker','photographer','santa'].map(n=>'/assets/friendly/'+n+'.glb')];
 const ready=Promise.all([Promise.all(urls.map(url=>new GameAssetLoader().loadAsync(url))),loadFinalAssets(finalSkyNames)]).then(([assets,finished])=>{
  const templates={...Object.fromEntries(names.map((n,i)=>[n,assets[i]])),...finished},[friend,helper,sorter]=assets.slice(8);
  function place(asset,parent,x,y,z,width,height,depth,top=false,solid=false){
   const model=asset.scene.clone(true),box=new T.Box3().setFromObject(model),size=box.getSize(new T.Vector3()),c=box.getCenter(new T.Vector3());
   model.position.sub(new T.Vector3(c.x,top?box.max.y:box.min.y,c.z));const wrap=new T.Group();wrap.name='Finished sky '+(names[assets.indexOf(asset)]||'resident');wrap.add(model);
   const scale=Math.min(width/size.x,height/size.y,depth/size.z);wrap.scale.setScalar(scale);wrap.position.set(x,y,z);if(asset===templates['wish-mailbox']||asset===templates['wish-postoffice'])wrap.rotation.y=Math.PI;parent.add(wrap);
   if(solid){wrap.updateWorldMatrix(true,true);const b=new T.Box3().setFromObject(wrap);solids.push({min:{...b.min},max:{...b.max}});}
   return wrap;
  }
  islands.forEach((island,i)=>{
   place(templates['cloud-island'],island,0,0,0,36,24,36,true);
   place(templates['wish-mailbox'],island,0,0,-7,3.5,4.5,3.5,false,true);
   for(const x of [-12,12]){place(templates['winter-lamp'],island,x,0,4,2,5,2,false,true);place(templates['winter-planter'],island,x,0,-5,5,2.2,3,false,true);}
   if(i%3===2||Math.floor(i/3)===2){if(i!==14)place(templates['postal-tower'],island,0,0,7,9,25,9,false,true);}
   else place(templates['winter-bench'],island,6,0,7,6,3,3,false,true);
   if(i===2){const npc=place(friend,island,-6,0,-5,4,3.6,4);actors.push(npc);}
   const border=mesh(new T.TorusGeometry(16,.15,8,64),bronze,0,.08,0,island);border.rotation.x=Math.PI/2;
  });
  actors.push(place(helper,islands[10],-7,0,-7,4,3.7,4),place(sorter,islands[14],5,0,-5,5,4,5));
  place(templates['wish-postoffice'],islands.at(-1),0,0,6,18,23,14,false,true);
  outings=buildSkyOutings(group,templates,place,Object.fromEntries(['reader','chef','thinker','photographer','santa'].map((n,i)=>[n,assets[11+i]])),solids);group.userData.outings=15;group.userData.finishAssets=[...names,...finalSkyNames];if(new URLSearchParams(location.search).has('test'))window.__skySolids=solids;
 });
 // Guiding feathers are instanced: decorative detail without hundreds of draw calls.
 const trail=skyLegs.flat().flatMap(l=>{const count=Math.floor(l.length/24);return Array.from({length:count},(_,i)=>l.start.map((v,k)=>v+(l.end[k]-v)*(i+1)/(count+1)));});
 const motes=new T.InstancedMesh(sphere,glow,trail.length),matrix=new T.Matrix4();trail.forEach((p,i)=>{matrix.compose(new T.Vector3(p[0],p[1]-2,p[2]),new T.Quaternion(),new T.Vector3(.12,.4,.12));motes.setMatrixAt(i,matrix);});motes.computeBoundingSphere();group.add(motes);
 return {group,solids,islands,ready,update(target,time,chapter=0,node=0,nav=0,activity=null,done=[],dt=1/60){outings?.update(time,activity,done,dt);for(const r of windRings){const active=r.chapter===chapter&&r.node===node;r.rim.material.color.set(active?0xffe4a0:themes[r.chapter]);r.ring.visible=r.chapter!==chapter||r.node!==node||r.nav>=nav;r.crown.rotation.y=time*.9;}for(const ring of group.children.filter(o=>o.userData.node!==undefined)){ring.material=ring.userData.node===chapter*3+node?glow:bronze;}marker.visible=!target.transit&&!target.id?.startsWith('sky-outing:');marker.position.set(target.x,target.y,target.z);marker.rotation.y=time*.6;halo.rotation.z=time*.5;balloon.visible=rope.visible=chapter===1;plane.visible=chapter===3;for(const [i,npc] of actors.entries()){npc.rotation.y=Math.sin(time*.6+i)*.3; npc.position.y=Math.max(0,Math.sin(time*2+i))*.15;}},dispose(){scene.remove(group);}};
}
