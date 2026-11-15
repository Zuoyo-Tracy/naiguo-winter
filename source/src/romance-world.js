import * as THREE from 'three';import {GameAssetLoader as GLTFLoader} from './asset-loader.js';
const bridgeSites=[[-200,90,14],[180,180,28],[-180,360,32]];
export function buildRomance(scene){return ()=>{};}
export async function loadAlpineAssets(scene){
 const loader=new GLTFLoader(),reports=[];
 for(const [id,spots] of [['snow-mountain',[[-310,-165,-30,150,105,120],[285,620,-25,170,135,140],[-590,400,-30,160,120,125]]],['ice-waterfall',[[-200,145,-3,27,48,22],[180,235,11,28,45,22],[-180,415,15,26,40,20]]]]){const source=(await loader.loadAsync('/assets/'+id+'.glb')).scene;source.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(source),s=b.getSize(new THREE.Vector3()),c=b.getCenter(new THREE.Vector3());for(const [x,z,y,w,h,d]of spots){const root=new THREE.Group(),model=source.clone(true);model.position.set(-c.x,-b.min.y,-c.z);root.add(model);root.scale.set(w/s.x,h/s.y,d/s.z);root.position.set(x,y,z);root.name='Lux3D '+id;scene.add(root);reports.push({id,position:[x,y,z],size:[w,h,d]});}}
 window.__alpineReports=reports;return reports;
}
