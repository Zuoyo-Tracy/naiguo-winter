import test from 'node:test';
import assert from 'node:assert/strict';
import * as Three from 'three';
import {installVisibleInstances} from '../src/visible-instances.js';

test('static draws retain each visible instance and its color as the camera turns',()=>{
 const scene=new Three.Scene(),geometry=new Three.SphereGeometry(1,40,40);
 const mesh=new Three.InstancedMesh(geometry,new Three.MeshBasicMaterial(),3);
 mesh.name='Static prop batch fence';
 for(const [i,x] of [-10,0,10].entries()){
  mesh.setMatrixAt(i,new Three.Matrix4().makeTranslation(x,0,-12));
  mesh.setColorAt(i,new Three.Color(i/2,.2,.3));
 }
 scene.add(mesh);scene.updateMatrixWorld(true);
 const original=mesh.instanceMatrix.array,originalColors=mesh.instanceColor.array;
 installVisibleInstances(scene,[]);
 assert.ok(mesh.boundingSphere.containsPoint(new Three.Vector3(10,0,-12)));
 assert.ok(mesh.boundingSphere.containsPoint(new Three.Vector3(-10,0,-12)));
 const camera=new Three.PerspectiveCamera(23,1,.1,100);
 const pose=new Three.Matrix4(),color=new Three.Color();
 for(const [x,expected] of [[0,1],[10,2],[-10,0]]){
  camera.lookAt(x,0,-12);camera.updateMatrixWorld(true);
  scene.onBeforeRender(null,scene,camera);
  assert.equal(mesh.count,1);mesh.getMatrixAt(0,pose);mesh.getColorAt(0,color);
  assert.equal(pose.elements[12],x);assert.equal(color.r,expected/2);
  scene.onAfterRender(null,scene,camera);
  assert.equal(mesh.count,3);assert.equal(mesh.instanceMatrix.array,original);assert.equal(mesh.instanceColor.array,originalColors);
 }
 camera.lookAt(0,0,1);camera.updateMatrixWorld(true);scene.onBeforeRender(null,scene,camera);
 const reverseFrustum=new Three.Frustum().setFromProjectionMatrix(new Three.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
 assert.equal(reverseFrustum.intersectsObject(mesh),false);scene.onAfterRender(null,scene,camera);
 camera.fov=120;camera.updateProjectionMatrix();camera.lookAt(0,0,-12);camera.updateMatrixWorld(true);scene.onBeforeRender(null,scene,camera);
 assert.equal(mesh.count,3);assert.equal(mesh.instanceMatrix.array,original);
 scene.onAfterRender(null,scene,camera);
});

test('wide shots retain whole static buffers and can switch back to a compact close-up',()=>{
 const scene=new Three.Scene(),box=new Three.SphereGeometry(1,40,40);
 const mesh=new Three.InstancedMesh(box,new Three.MeshBasicMaterial(),3);
 mesh.name='Spatial cell garden';
 for(const [i,x] of [-10,0,10].entries())mesh.setMatrixAt(i,new Three.Matrix4().makeTranslation(x,0,-12));
 scene.add(mesh);scene.updateMatrixWorld(true);installVisibleInstances(scene,[]);
 const camera=new Three.PerspectiveCamera(23,1,.1,100),renderer={info:{render:{triangles:1000000}}};
 camera.updateMatrixWorld(true);
 const source=mesh.instanceMatrix.array;
 scene.onBeforeRender(renderer,scene,camera);assert.equal(mesh.count,1);
 scene.onAfterRender(renderer,scene,camera);
 scene.onBeforeRender(renderer,scene,camera);assert.equal(mesh.count,3);assert.equal(mesh.instanceMatrix.array,source);
 renderer.info.render.triangles=6000;scene.onAfterRender(renderer,scene,camera);
 scene.onBeforeRender(renderer,scene,camera);assert.equal(mesh.count,1);assert.notEqual(mesh.instanceMatrix.array,source);
 scene.onAfterRender(renderer,scene,camera);assert.equal(mesh.instanceMatrix.array,source);
});
