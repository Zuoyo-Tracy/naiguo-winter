import test from 'node:test';import assert from 'node:assert/strict';import * as T from 'three';
import {protectCabinInterior} from '../src/cabin-isolation.js';
test('cabin clipping preserves exterior animated material references',()=>{
 const scene=new T.Scene(),cabin=new T.Group(),material=new T.MeshBasicMaterial({transparent:true,opacity:.4}),water=new T.Mesh(new T.PlaneGeometry(),material);scene.add(cabin,water);const isolate=protectCabinInterior(scene,cabin);isolate(true);assert.equal(water.material,material);material.opacity=.7;assert.equal(water.material.opacity,.7);const compile=material.onBeforeCompile;isolate(true);assert.equal(material.onBeforeCompile,compile);
 const shader={uniforms:{},vertexShader:'#include <project_vertex>',fragmentShader:'void main() { }'};material.onBeforeCompile(shader);assert.ok(shader.vertexShader.includes('instanceMatrix'));assert.equal(shader.uniforms.cabinCutEnabled.value,1);isolate(false);assert.equal(shader.uniforms.cabinCutEnabled.value,0);
});
test('materials shared with cabin furniture stay unchanged inside, including late exterior objects',()=>{
 const scene=new T.Scene(),cabin=new T.Group(),material=new T.MeshBasicMaterial(),inside=new T.Mesh(new T.BoxGeometry(),material);cabin.add(inside);scene.add(cabin);const isolate=protectCabinInterior(scene,cabin);isolate(true);const outside=new T.Mesh(new T.BoxGeometry(),material);scene.add(outside);isolate(true);assert.equal(inside.material,material);assert.notEqual(outside.material,material);assert.notEqual(outside.material.onBeforeCompile,material.onBeforeCompile);
});
