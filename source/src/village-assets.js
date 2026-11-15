import {villageSites} from './village-layout.js';
import {parkSolids} from './park-rules.js';
import {valleyHeight} from './terrain-layout.js';
import * as THREE from 'three';
import {GameAssetLoader as GLTFLoader} from './asset-loader.js';
import {sampleAt,projectTrack} from './track.js';
import {stations} from './station-layout.js';
export async function loadVillage(scene){
 const source=(await new GLTFLoader().loadAsync('/assets/russian-house.glb')).scene;
 source.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(source),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
 source.position.sub(new THREE.Vector3(center.x,bounds.min.y,center.z));const template=new THREE.Group();template.add(source);template.scale.setScalar(22/Math.max(size.x,size.y,size.z));
 const cliff=(await new GLTFLoader().loadAsync('/assets/cotton-cloudbank-lod.glb')).scene;cliff.updateMatrixWorld(true);const cb=new THREE.Box3().setFromObject(cliff),cs=cb.getSize(new THREE.Vector3()),cc=cb.getCenter(new THREE.Vector3());cliff.position.sub(new THREE.Vector3(cc.x,cb.min.y,cc.z));const cliffTemplate=new THREE.Group();cliffTemplate.add(cliff);
 const reports=[];const stone=new THREE.MeshStandardMaterial({color:0xc5bbc7,roughness:.9}),snow=new THREE.MeshStandardMaterial({color:0xf6eef5,roughness:.85});
 for(const lane of villageSites){const x=lane.x;
  const home=template.clone(true);home.position.set(x,lane.y,lane.z);home.rotation.y=lane.turn;home.name='Lux3D Russian village residence';home.userData.terrainSupport=true;scene.add(home);home.updateMatrixWorld(true);
  const b=new THREE.Box3().setFromObject(home),extent=b.getSize(new THREE.Vector3()),center=b.getCenter(new THREE.Vector3());
  parkSolids.push({a:{x:center.x,z:center.z,r:Math.max(extent.x,extent.z)/2+10},solids:[{id:'village-residence',x:center.x,z:center.z,y:b.min.y,width:extent.x,depth:extent.z,height:extent.y}]});
  const rock=cliffTemplate.clone(true),bottom=lane.y-6,height=6.5;rock.scale.set((extent.x+5)/cs.x,height/cs.y,(extent.z+5)/cs.z);rock.position.set(x,bottom,lane.z);rock.name='Lux3D soft residential cloud bed';scene.add(rock);
  const closest=Math.min(...[b.min.x,b.max.x].flatMap(bx=>[b.min.z,b.max.z].map(bz=>projectTrack(bx,bz).distance)));
  reports.push({x,y:lane.y,z:lane.z,size:extent.toArray(),roadClearance:closest-12,foundationContact:Math.abs(b.min.y-lane.y)<.001});
 }
 return reports;
}
