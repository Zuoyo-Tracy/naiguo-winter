import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';import {Vector3} from 'three';import {createPassengerPoseController} from '../src/passenger-poses.js';
const bytes=fs.readFileSync(new URL('../public/assets/hero-passenger-posed.glb',import.meta.url));
const asset=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
function passenger(){const root=asset.scene.clone(true);root.updateMatrixWorld(true);return root;}
function body(root){return root.children.find(o=>o.morphTargetDictionary?.leftRest!==undefined);}
function point(mesh,i){return mesh.getVertexPosition(i,new Vector3()).applyMatrix4(mesh.matrixWorld);}
test('sightseeing puts both hands on the lap without moving the seat/feet',()=>{
 const root=passenger(),mesh=body(root),original=Array.from({length:mesh.geometry.attributes.position.count},(_,i)=>point(mesh,i));createPassengerPoseController(root,'ferris');let hands=0,drop=0,feet=0;
 for(let i=0;i<original.length;i++){const before=original[i],after=point(mesh,i);if(before.y<1.8){assert.ok(before.distanceTo(after)<1e-6);feet++;}if(before.z>1.2&&before.y>2.8&&before.y<3.25){hands++;drop+=before.y-after.y;}}
 assert.ok(feet>100);assert.ok(hands>100);assert.ok(drop/hands>.65,'hands visibly lower instead of holding invisible handlebars');
});
test('passenger clones keep independent poses and return to driving on a bumper car',()=>{
 const relaxing=passenger(),driving=passenger(),p=createPassengerPoseController(relaxing,'ferris'),q=createPassengerPoseController(driving,'bumper');
 assert.equal(body(relaxing).geometry,body(driving).geometry);assert.notEqual(body(relaxing).morphTargetInfluences,body(driving).morphTargetInfluences);
 p.update('balloon',5,.04);assert.equal(body(driving).morphTargetInfluences[0],0);assert.equal(body(driving).morphTargetInfluences[1],0);
 q.set('ferris');q.set('bumper');assert.equal(body(driving).morphTargetInfluences[0],0);assert.equal(body(driving).morphTargetInfluences[1],0);
});
test('head, smile and sunglasses turn and breathe together through smooth transitions',()=>{
 const root=passenger(),controller=createPassengerPoseController(root,'train');const before=root.userData.passengerPose.weights.slice();controller.update('balloon',4,.016);
 const after=root.userData.passengerPose.weights;assert.ok(after[0]> .78&&after[0]<before[0]);assert.ok(after[2]>0&&after[2]<.2);
 for(const mesh of root.children){for(const key of ['lookLeft','lookRight','breath'])assert.equal(mesh.morphTargetInfluences[mesh.morphTargetDictionary[key]],after[{lookLeft:2,lookRight:3,breath:4}[key]]);}
 assert.ok(after.every(Number.isFinite));
});
