import {buildGrandPalace} from './grand-palace.js';
import {railClearanceSamples} from './train-rules.js';
import {softenBalloons} from './sky-palette.js';
import * as THREE from 'three';import {GameAssetLoader as GLTFLoader} from './asset-loader.js';import {sampleAt,TRACK_LENGTH,projectTrack} from './track.js';import {meteorsAt} from './challenges.js';import {stations} from './station-layout.js';
const loader=new GLTFLoader();
function normalize(root){root.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(root),size=b.getSize(new THREE.Vector3()),c=b.getCenter(new THREE.Vector3());const parent=new THREE.Group();root.position.sub(new THREE.Vector3(c.x,b.min.y,c.z));parent.add(root);parent.scale.setScalar(1/Math.max(size.x,size.y,size.z));parent.updateMatrixWorld(true);return parent;}
function copyAt(source,width,x,y,z){const root=source.clone(true);root.scale.multiplyScalar(width);root.position.set(x,y,z);return root;}
export async function loadDreamAssets(scene){
 const ids=['golden-meteor','cotton-cloudbank','princess-castle','ribbon-balloons','european-manor'];const roots=await Promise.all(ids.map(async id=>normalize((await loader.loadAsync('/assets/'+id+(id==='cotton-cloudbank'||id==='ribbon-balloons'||id==='golden-meteor'?'-lod':'')+'.glb')).scene)));
 const [meteor,cloud,castle,balloon,pavilion]=roots,counts={};
 // Clouds follow the road elevation, with a clear central driving corridor.
 cloud.updateMatrixWorld(true);const cloudSize=new THREE.Box3().setFromObject(cloud).getSize(new THREE.Vector3());
 const placements=[];const stationPoints=stations.map(n=>sampleAt(n.s));
 // Clear full architectural footprints and viewing corridors toward scenic trees.
 const clearAreas=[...[45,225,405].map(z=>({x:0,z,rx:38,rz:36})),...[180,270,360].flatMap(z=>[-1,1].map(side=>({x:side*55,z:z+45,rx:26,rz:27}))),...[-30,480].flatMap(z=>[-230,-175,-120,120,175].map(x=>({x,z,rx:18,rz:23}))),{x:-180,z:-58,rx:34,rz:60},{x:180,z:505,rx:40,rz:70},{x:-450,z:225,rx:60,rz:34}];
 window.__cloudClearAreas=clearAreas;
 for(let i=0;i<Math.ceil(TRACK_LENGTH/65);i++)for(const side of [-1,1])for(let layer=0;layer<2;layer++){
  if(layer===1&&i%3)continue;const p=sampleAt(i*65+layer*24),width=layer?34:22,length=layer?70:62,height=layer?20+(i%3)*3:12+(i%4)*2,offset=layer?78:32;
  const x=p.x+Math.cos(p.yaw)*side*offset,z=p.z-Math.sin(p.yaw)*side*offset;let clear=true,minClearance=Infinity;
  for(let u=-width/2;u<=width/2+.1;u+=width/8)for(let v=-length/2;v<=length/2+.1;v+=length/12){const px=x+Math.cos(p.yaw)*u+Math.sin(p.yaw)*v,pz=z-Math.sin(p.yaw)*u+Math.cos(p.yaw)*v,d=projectTrack(px,pz).distance;minClearance=Math.min(minClearance,d-12);if(clearAreas.some(a=>Math.abs(px-a.x)<a.rx&&Math.abs(pz-a.z)<a.rz)||d<16||stationPoints.some(n=>Math.abs(px-n.x)<30&&pz>n.z-18&&pz<n.z+48))clear=false;}
  if(railClearanceSamples.some(r=>{const dx=r.x-x,dz=r.z-z;return Math.abs(dx*Math.cos(p.yaw)-dz*Math.sin(p.yaw))<width/2+18&&Math.abs(dx*Math.sin(p.yaw)+dz*Math.cos(p.yaw))<length/2+18;}))clear=false;
  if(clear)placements.push({x,z,y:p.y+(layer?-3:-7),width,length,height,yaw:p.yaw,layer,roadY:p.y,minClearance});
 }
 cloud.traverse(o=>{if(!o.isMesh)return;const geo=o.geometry.clone().applyMatrix4(o.matrixWorld),inst=new THREE.InstancedMesh(geo,o.material,placements.length),matrix=new THREE.Matrix4(),q=new THREE.Quaternion();placements.forEach((p,i)=>{q.setFromAxisAngle(new THREE.Vector3(0,1,0),p.yaw);matrix.compose(new THREE.Vector3(p.x,p.y,p.z),q,new THREE.Vector3(p.width/cloudSize.x,p.height/cloudSize.y,p.length/cloudSize.z));inst.setMatrixAt(i,matrix);});inst.name='Lux3D layered roadside cloudbanks';scene.add(inst);});counts.cloudBanks=placements.length;window.__cloudReports=placements;
 softenBalloons(balloon);const balloons=[];for(let i=0;i<32;i++){const p=sampleAt(75+i*147),side=i%2?1:-1,root=copyAt(balloon,14,p.x+Math.cos(p.yaw)*side*28,p.y+9,p.z-Math.sin(p.yaw)*side*28);root.userData.baseY=root.position.y;scene.add(root);balloons.push(root);}counts.balloonBunches=balloons.length;
 buildGrandPalace(scene,castle,pavilion,cloud);counts.castles=1;
 for(const z of [180,270,360])for(const side of [-1,1]){const root=copyAt(pavilion,42,side*55,z===180?28:z===270?50:32,z+45);root.userData.terrainSupport=true;scene.add(root);}counts.europeanManors=6;
 const tailMat=new THREE.MeshBasicMaterial({color:0xffe9a6,transparent:true,opacity:.35,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide});
 function comet(){const group=new THREE.Group(),core=copyAt(meteor,5,0,0,0);group.add(core);const tails=[];for(let i=0;i<5;i++){const t=new THREE.Mesh(new THREE.ConeGeometry(1.1-i*.12,20+i*6,12,1,true),tailMat.clone());t.position.y=12+i*4;t.material.opacity=.2-i*.028;group.add(t);tails.push(t);}scene.add(group);return group;}
 const falling=meteorsAt(0).map(()=>comet()),shooting=Array.from({length:4},()=>comet());counts.meteors=falling.length+shooting.length;
 return {counts,update:time=>{balloons.forEach((r,i)=>{r.position.y=r.userData.baseY+Math.sin(time*.6+i)*.8;r.rotation.z=Math.sin(time*.4+i)*.06;});meteorsAt(time).forEach((m,i)=>{const r=falling[i];r.visible=m.falling||m.impact;r.position.set(m.x,m.y+(m.falling?60*(1-(m.phase-2.8)/.7):0),m.z);r.rotation.z=.08;});shooting.forEach((r,i)=>{const t=((time+i*7)%28)/28;r.visible=t<.35;r.position.set(-550+t*3000,180-i*15-t*170,100+i*110);r.rotation.z=1.35;});}};
}
