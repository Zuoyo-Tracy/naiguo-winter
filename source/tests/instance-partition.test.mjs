import test from 'node:test';import assert from 'node:assert/strict';import * as T from 'three';import {partitionInstances} from '../src/instance-partition.js';
test('partition keeps instance placement and color under a transformed parent',()=>{
 const parent=new T.Group();parent.position.set(100,4,20);parent.rotation.y=.3;const mesh=new T.InstancedMesh(new T.BoxGeometry(2,2,2),new T.MeshBasicMaterial(),4);mesh.position.set(3,0,2);mesh.rotation.y=.2;parent.add(mesh);
 for(let i=0;i<4;i++){mesh.setMatrixAt(i,new T.Matrix4().makeTranslation(i*20,0,0));mesh.setColorAt(i,new T.Color(i/4,.2,.4));}
 parent.updateMatrixWorld(true);const original=[];for(let i=0;i<4;i++){const m=new T.Matrix4();mesh.getMatrixAt(i,m);original.push(new T.Vector3().applyMatrix4(m).applyMatrix4(mesh.matrixWorld));}
 const parts=partitionInstances(mesh,12);parent.updateMatrixWorld(true);assert.equal(parts.reduce((n,p)=>n+p.count,0),4);assert.equal(mesh.visible,false);let index=0;
 for(const part of parts)for(let i=0;i<part.count;i++){const m=new T.Matrix4(),c=new T.Color();part.getMatrixAt(i,m);part.getColorAt(i,c);assert.ok(new T.Vector3().applyMatrix4(m).applyMatrix4(part.matrixWorld).distanceTo(original[index])<1e-5);assert.ok(Math.abs(c.r-index/4)<1e-5);index++;}
 parent.visible=false;let visible=0;parent.traverseVisible(()=>visible++);assert.equal(visible,0);
});
test('small groups remain untouched and removed zero-scale instances stay removed',()=>{
 const parent=new T.Group(),m=new T.InstancedMesh(new T.BoxGeometry(),new T.MeshBasicMaterial(),3);parent.add(m);m.setMatrixAt(0,new T.Matrix4());m.setMatrixAt(1,new T.Matrix4().makeTranslation(40,0,0));m.setMatrixAt(2,new T.Matrix4().makeScale(0,0,0));const parts=partitionInstances(m,12);assert.equal(parts.reduce((n,p)=>n+p.count,0),2);
 const single=new T.InstancedMesh(m.geometry,m.material,1);parent.add(single);assert.deepEqual(partitionInstances(single),[]);assert.equal(single.visible,true);
});
