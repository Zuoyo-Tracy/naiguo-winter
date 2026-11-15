import test from 'node:test';import assert from 'node:assert/strict';import {Group,Vector3,Quaternion} from 'three';
import {placeTeacupPassenger,placeFerrisPassenger} from '../src/park-passenger.js';
test('passenger sits on the rear bench and rotates with both the platform and cup',()=>{
 const platform=new Group(),cup=new Group(),actor=new Group();platform.add(cup);platform.position.set(545,32,325);cup.position.set(0,.55,12);cup.scale.setScalar(3.75);
 for(const scale of [3.75,4.5/2.8])for(const outer of [0,.7,2.1])for(const spin of [0,Math.PI/2,Math.PI,Math.PI*1.5]){
  cup.scale.setScalar(scale);platform.rotation.y=outer;cup.rotation.y=spin;placeTeacupPassenger(actor,cup);const local=cup.worldToLocal(actor.position.clone()).multiplyScalar(scale);
  assert.ok(Math.abs(local.x)<1e-10);assert.ok(local.z<-1&&local.z>-1.1,'on rear bench, not wheel pedestal');assert.ok(Math.abs(local.y+.322-1.3795)<.02,'hips supported by measured new cushion regardless of GLB source units');
  const face=new Vector3(0,0,1).applyQuaternion(actor.quaternion),expected=new Vector3(0,0,1).applyQuaternion(cup.getWorldQuaternion(new Quaternion()));assert.ok(face.distanceTo(expected)<1e-10,'faces inward with cup');
 }
});

test('ferris passenger sits on the side cushion and faces into the cabin',()=>{
 const cabin=new Group(),actor=new Group();cabin.position.set(-460,65,678);cabin.scale.setScalar(3.5);
 for(const angle of [0,.8,2.4]){cabin.rotation.y=angle;placeFerrisPassenger(actor,cabin);const q=cabin.getWorldQuaternion(new Quaternion()),offset=actor.position.clone().sub(cabin.position).applyQuaternion(q.clone().invert());assert.ok(Math.abs(offset.y+.322-.91)<1e-6);assert.equal(offset.x.toFixed(2),'-0.52');const face=new Vector3(0,0,1).applyQuaternion(actor.quaternion).applyQuaternion(q.clone().invert());assert.ok(face.x>.999,'face inward, not through the side window');}
});
