import * as T from 'three';

const tileSize=120;
const keyFor=(m,box)=>{const p=box.getCenter(new T.Vector3()).applyMatrix4(m);return Math.floor(p.x/tileSize)+','+Math.floor(p.z/tileSize);};
const splitNames=new Set(['Lux3D forest boardwalk railway','Low continuous Lux3D cloud sea between roads','Instanced timber trestle supports','Lux3D Roman gallery instanced asset','Lux3D layered roadside cloudbanks']);
const propNames=new Set(['ticket','entry','planter','lamp','bench','clock','prizes','candy','musicbox','fence','garden-arch','bandstand','terrace']);
export function staticSceneryRoot(o){return o.userData.stationaryPark===true||o.name.startsWith('Lux3D winter conservatory ')||o.name==='Lux3D snowy riverbank'||(o.name.startsWith('Lux3D park ')&&propNames.has(o.name.slice(11)));}

export function optimizeStaticWorld(scene){
 scene.updateMatrixWorld(true);const group=new T.Group();group.name='Spatially batched static park scenery';scene.add(group);let originalMeshes=0,batches=0,instances=0,splitMeshes=0;
 const candidates=[];scene.traverseVisible(o=>{if(o.isInstancedMesh&&o.count>24&&splitNames.has(o.name))candidates.push(o);});
 for(const mesh of candidates){mesh.geometry.computeBoundingBox();const tiles=new Map(),local=new T.Matrix4();for(let i=0;i<mesh.count;i++){mesh.getMatrixAt(i,local);const world=new T.Matrix4().multiplyMatrices(mesh.matrixWorld,local),key=keyFor(world,mesh.geometry.boundingBox);if(!tiles.has(key))tiles.set(key,[]);tiles.get(key).push({world,index:i});}if(tiles.size<2)continue;
  for(const entries of tiles.values()){const part=new T.InstancedMesh(mesh.geometry,mesh.material,entries.length);part.name='Spatial cell '+mesh.name;part.castShadow=mesh.castShadow;part.receiveShadow=mesh.receiveShadow;part.renderOrder=mesh.renderOrder;for(let i=0;i<entries.length;i++){part.setMatrixAt(i,entries[i].world);if(mesh.instanceColor){const color=new T.Color();mesh.getColorAt(entries[i].index,color);part.setColorAt(i,color);}}part.computeBoundingBox();part.computeBoundingSphere();group.add(part);batches++;instances+=part.count;}
  mesh.visible=false;splitMeshes++;
 }
 const families=new Map();scene.traverseVisible(root=>{if(!staticSceneryRoot(root))return;root.traverseVisible(o=>{if(!o.isMesh||o.isInstancedMesh||o.isSkinnedMesh)return;o.geometry.computeBoundingBox();const material=Array.isArray(o.material)?o.material.map(m=>m.uuid).join(':'):o.material.uuid,key=o.geometry.uuid+'|'+material+'|'+keyFor(o.matrixWorld,o.geometry.boundingBox);if(!families.has(key))families.set(key,[]);families.get(key).push(o);});});
 for(const members of families.values()){if(members.length<3)continue;const first=members[0],batch=new T.InstancedMesh(first.geometry,first.material,members.length);batch.name='Static prop batch '+first.name;batch.castShadow=first.castShadow;batch.receiveShadow=first.receiveShadow;members.forEach((m,i)=>{batch.setMatrixAt(i,m.matrixWorld);m.visible=false;});batch.computeBoundingBox();batch.computeBoundingSphere();group.add(batch);originalMeshes+=members.length;batches++;instances+=members.length;}
 scene.userData.geometryRevision=(scene.userData.geometryRevision||0)+1;
 const result={originalMeshes,splitMeshes,batches,instances};if(typeof window!=='undefined')window.__staticBatchDebug=result;return result;
}
