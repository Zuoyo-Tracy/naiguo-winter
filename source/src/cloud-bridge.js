import * as THREE from 'three';
import {GameAssetLoader as GLTFLoader} from './asset-loader.js';
import {computeBoundsTree,acceleratedRaycast} from 'three-mesh-bvh';
import {distanceToTrack,trackHeight} from './track.js';
export async function loadCloudBridge(scene){
 const gltf=await new GLTFLoader().loadAsync('/assets/cloud-bridge.glb');const root=gltf.scene;
 const original=new THREE.Box3().setFromObject(root),size=original.getSize(new THREE.Vector3()),center=original.getCenter(new THREE.Vector3());
 const scale=34/size.x;root.scale.setScalar(scale);root.position.set(-center.x*scale,0,-50-center.z*scale);
 const meshes=[];root.traverse(o=>{if(o.isMesh){o.geometry.computeBoundsTree=computeBoundsTree;o.geometry.computeBoundsTree();o.raycast=acceleratedRaycast;meshes.push(o);}});scene.add(root);root.updateMatrixWorld(true);
 const ray=new THREE.Raycaster();ray.firstHitOnly=true;ray.ray.direction.set(0,-1,0);
 function hit(x,z){ray.ray.origin.set(x,30,z);const hits=ray.intersectObjects(meshes,false);return hits.length?hits[0].point.y:null;}
 const mid=hit(0,-50);if(mid===null)throw Error('Generated bridge has no central surface');root.position.y+=12-mid;root.updateMatrixWorld(true);
 function top(x,z){const y=hit(x,z);return y!==null&&y>11.35&&y<13.7?y:null;}
 const samples=[];for(let x=-12;x<=12;x+=.5){const y=top(x,-50);samples.push({x,y,raw:hit(x,-50)});}
 if(samples.some(s=>s.y===null))throw Error('Bridge centerline needs calibration');
// The generated end lips sit below the deck. Visible short approach plates bridge that real discontinuity.
for(const x of [-14.5,14.5]){const plate=new THREE.Mesh(new THREE.BoxGeometry(5,.25,14),new THREE.MeshStandardMaterial({color:0xbbb6db,metalness:.25,roughness:.55}));plate.position.set(x,11.9,-50);scene.add(plate);}
function support(x,z){
 if(Math.abs(x)>=12&&Math.abs(x)<17&&Math.abs(z+50)<6.5)return 12.025;
  if(Math.abs(x)<17&&Math.abs(z+50)<13){const y=top(x,z);if(y!==null)return y;if(Math.abs(x)<15)return null;}
  if(Math.abs(x)<15&&z<-38)return null;
  return distanceToTrack(x,z)<=9.2?trackHeight(x,z):null;
 }
 return {support,root,report:{source:'Lux3D',taskId:'4266124',scale,centerlineSamples:samples,usesGeneratedMeshForSupport:true,location:[0,12,-50]}};
}


