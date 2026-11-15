import {detailDefinitions} from './world-detail-catalog.js';
import geometryAssets from './distant-geometry.json';
import * as T from 'three';
import {GameAssetLoader} from './asset-loader.js';
import {distantDetail} from './detail-policy.js';
import {installVisibleInstances} from './visible-instances.js';
export async function loadWorldDetail(scene){
 const loader=new GameAssetLoader(),variants=new Map(),failed=[];
 async function loadGeometry(url) {
  const model=await loader.loadAsync(geometryAssets[url] || url);
  const meshes=new Map();
  model.scene.traverse(object=>{
   if(!object.isMesh)return;
   object.geometry.userData.sourceAsset=url;
   meshes.set(object.name,object.geometry);
  });
  return meshes;
 }
 await Promise.all(detailDefinitions.map(async ({source,preferred,far})=>{
  try {
   let meshes;
   try { meshes=await loadGeometry(preferred); }
   catch(error) {
    if(preferred===far)throw error;
    meshes=await loadGeometry(far);
   }
   variants.set(source,meshes);
  } catch { failed.push(source); }
 }));
 scene.updateMatrixWorld(true);const items=[],skipped=[];scene.traverseVisible(mesh=>{
  if(!mesh.isMesh||mesh.isSkinnedMesh||Array.isArray(mesh.material))return;
  const near=mesh.geometry,far=variants.get(near.userData.sourceAsset?.split('?')[0])?.get(near.userData.sourceMesh);if(!far)return;
  near.computeBoundingBox();far.computeBoundingBox();const tolerance=Math.max(.01,near.boundingBox.getSize(new T.Vector3()).length()*.025);if(near.boundingBox.min.distanceTo(far.boundingBox.min)>tolerance||near.boundingBox.max.distanceTo(far.boundingBox.max)>tolerance){skipped.push(near.userData.sourceAsset);return;}const box=new T.Box3(),size=new T.Vector3();let diameter=0;
  if(mesh.isInstancedMesh){const matrix=new T.Matrix4();for(let i=0;i<mesh.count;i++){mesh.getMatrixAt(i,matrix);matrix.premultiply(mesh.matrixWorld);const b=near.boundingBox.clone().applyMatrix4(matrix);box.union(b);b.getSize(size);diameter=Math.max(diameter,size.x,size.y,size.z);}}
  else{box.copy(near.boundingBox).applyMatrix4(mesh.matrixWorld);box.getSize(size);diameter=Math.max(size.x,size.y,size.z);}
  box.expandByScalar(1);items.push({mesh,near,far,box,diameter,distant:false});
 });
 installVisibleInstances(scene,items);
 let cooldown=0,lastQuality=null;const isTest=new URLSearchParams(location.search).has('test');if(isTest)window.__detailProbe={items};
 return {update(camera,quality,dt){cooldown-=dt;if(cooldown>0&&quality===lastQuality)return;cooldown=.2;lastQuality=quality;let distant=0,saved=0;
  for(const item of items){const next=distantDetail(item.box.distanceToPoint(camera.position),item.diameter,quality,item.distant);if(next!==item.distant){item.mesh.geometry=next?item.far:item.near;item.distant=next;}if(next){distant++;saved+=((item.near.index?.count??item.near.attributes.position.count)-(item.far.index?.count??item.far.attributes.position.count))/3*(item.mesh.isInstancedMesh?item.mesh.count:1);}}
  if(isTest)window.__detailDebug={candidates:items.length,distant,savedTriangles:Math.round(saved),failed,skipped:[...new Set(skipped)]};
 }};
}
