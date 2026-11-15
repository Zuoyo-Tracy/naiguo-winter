import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {GameAssetLoader} from '../src/asset-loader.js';

test('shared asset cache reuses resources without sharing material edits or transforms',async()=>{
 const original=GLTFLoader.prototype.loadAsync,source=new T.Group(),texture=new T.Texture(),material=new T.MeshStandardMaterial({map:texture}),geometry=new T.BoxGeometry();source.add(new T.Mesh(geometry,material));let requests=0;
 GLTFLoader.prototype.loadAsync=async()=>{requests++;return {scene:source,scenes:[source],animations:[]};};
 try{const [a,b]=await Promise.all([new GameAssetLoader().loadAsync('cache-isolation.glb'),new GameAssetLoader().loadAsync('cache-isolation.glb')]);assert.equal(requests,1);assert.notEqual(a.scene,b.scene);assert.equal(a.scene.children[0].geometry,b.scene.children[0].geometry);assert.equal(a.scene.children[0].material.map,b.scene.children[0].material.map);assert.notEqual(a.scene.children[0].material,b.scene.children[0].material);a.scene.position.x=7;a.scene.children[0].material.color.set('#ff0000');assert.equal(b.scene.position.x,0);assert.equal(b.scene.children[0].material.color.getHex(),0xffffff);}finally{GLTFLoader.prototype.loadAsync=original;}
});
test('failed asset requests can be retried instead of caching a rejected promise',async()=>{
 const original=GLTFLoader.prototype.loadAsync;let calls=0;const scene=new T.Group();GLTFLoader.prototype.loadAsync=async()=>{if(!calls++)throw new Error('temporary network failure');return {scene,scenes:[scene],animations:[]};};
 try{await assert.rejects(new GameAssetLoader().loadAsync('retry-test.glb'));const next=await new GameAssetLoader().loadAsync('retry-test.glb');assert.ok(next.scene);assert.equal(calls,2);}finally{GLTFLoader.prototype.loadAsync=original;}
});
test('compact assets preserve source identity and fall back to the original when unavailable',async()=>{
 const original=GLTFLoader.prototype.loadAsync,requests=[],scene=new T.Group();scene.add(new T.Mesh(new T.BoxGeometry(),new T.MeshStandardMaterial()));
 GLTFLoader.prototype.loadAsync=async url=>{requests.push(url);if(url.includes('/compact/'))throw new Error('compact file unavailable');return {scene,scenes:[scene],animations:[]};};
 try{const path='/assets/cotton-cloudbank-lod.glb?fallback-check=1',asset=await new GameAssetLoader().loadAsync(path);assert.deepEqual(requests,['/assets/compact/cotton-cloudbank-lod.glb?fallback-check=1',path]);assert.equal(asset.scene.children[0].geometry.userData.sourceAsset,path);const again=await new GameAssetLoader().loadAsync(path);assert.ok(again.scene);assert.equal(requests.length,2);}finally{GLTFLoader.prototype.loadAsync=original;}
});
