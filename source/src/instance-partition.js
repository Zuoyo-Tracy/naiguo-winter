import * as T from 'three';
// Split long repeated rows into independently culled cells while retaining their
// parent, local transforms and hidden-state inheritance.
export function partitionInstances(mesh,cellSize=16){
 if(!mesh.parent||!mesh.isInstancedMesh||mesh.count<2)return [];
 mesh.updateWorldMatrix(true,false);mesh.geometry.computeBoundingBox();
 const center=mesh.geometry.boundingBox.getCenter(new T.Vector3()),local=new T.Matrix4(),tiles=new Map();
 for(let i=0;i<mesh.count;i++){
  mesh.getMatrixAt(i,local);if(Math.abs(local.determinant())<1e-12)continue;
  const p=center.clone().applyMatrix4(local).applyMatrix4(mesh.matrixWorld),key=Math.floor(p.x/cellSize)+','+Math.floor(p.z/cellSize);
  if(!tiles.has(key))tiles.set(key,[]);tiles.get(key).push({index:i,matrix:local.clone()});
 }
 if(tiles.size<2)return [];
 const result=[];
 for(const entries of tiles.values()){
  const part=new T.InstancedMesh(mesh.geometry,mesh.material,entries.length);part.name='Local spatial cell '+mesh.name;
  part.position.copy(mesh.position);part.quaternion.copy(mesh.quaternion);part.scale.copy(mesh.scale);part.matrix.copy(mesh.matrix);part.matrixAutoUpdate=mesh.matrixAutoUpdate;
  part.castShadow=mesh.castShadow;part.receiveShadow=mesh.receiveShadow;part.renderOrder=mesh.renderOrder;
  entries.forEach((entry,i)=>{part.setMatrixAt(i,entry.matrix);if(mesh.instanceColor){const color=new T.Color();mesh.getColorAt(entry.index,color);part.setColorAt(i,color);}});
  part.computeBoundingBox();part.computeBoundingSphere();mesh.parent.add(part);result.push(part);
 }
 mesh.visible=false;return result;
}
