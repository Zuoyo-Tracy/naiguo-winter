import test from 'node:test';import assert from 'node:assert/strict';import * as T from 'three';import {freezeWorldTransforms} from '../src/static-transforms.js';
test('freezing scenery preserves world placement while moving rides and trains keep updating',()=>{
 const scene=new T.Scene(),fixed=new T.Group(),prop=new T.Mesh(new T.BoxGeometry(),new T.MeshBasicMaterial()),ride=new T.Group(),seat=new T.Group();
 fixed.name='Winter conservatory common landscape';fixed.position.set(40,5,20);fixed.rotation.y=.7;prop.position.set(3,2,7);fixed.add(prop);scene.add(fixed,ride);ride.add(seat);seat.position.z=4;
 scene.updateMatrixWorld(true);const expected=prop.matrixWorld.clone();assert.equal(freezeWorldTransforms(scene),2);
 ride.position.x=17;ride.rotation.y=Math.PI/2;scene.updateMatrixWorld(true);assert.deepEqual(prop.matrixWorld.elements,expected.elements);const pos=seat.getWorldPosition(new T.Vector3());assert.ok(pos.distanceTo(new T.Vector3(21,0,0))<1e-6);
 assert.equal(ride.matrixAutoUpdate,true);assert.equal(seat.matrixWorldAutoUpdate,true);fixed.visible=false;assert.equal(prop.matrixAutoUpdate,false);
});
test('batched park props freeze while seats under the same park keep moving',()=>{
 const scene=new T.Scene(),park=new T.Group(),lamp=new T.Group(),post=new T.Mesh(new T.BoxGeometry(),new T.MeshBasicMaterial()),rotor=new T.Group(),cup=new T.Group();park.name='Park teacups';park.position.set(50,30,100);lamp.name='Lux3D park lamp';lamp.position.x=8;lamp.add(post);park.add(lamp,rotor);rotor.add(cup);cup.position.x=5;scene.add(park);scene.updateMatrixWorld(true);const expected=post.matrixWorld.clone();freezeWorldTransforms(scene);
 assert.equal(lamp.matrixAutoUpdate,false);assert.equal(rotor.matrixAutoUpdate,true);assert.equal(cup.matrixAutoUpdate,true);rotor.rotation.y=Math.PI/2;scene.updateMatrixWorld();assert.deepEqual(post.matrixWorld.elements,expected.elements);assert.ok(cup.getWorldPosition(new T.Vector3()).distanceTo(new T.Vector3(50,30,95))<1e-6);
});
