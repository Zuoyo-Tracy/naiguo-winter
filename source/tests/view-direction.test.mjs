import test from 'node:test';
import assert from 'node:assert/strict';
import {firstPersonDirection} from '../src/view-direction.js';

test('dragging up looks up and dragging down looks down in a cabin or on an escalator',()=>{
 for(const yaw of [0,Math.PI/2,-Math.PI/2,Math.PI]){
  const neutral=firstPersonDirection(yaw,0),up=firstPersonDirection(yaw,-.36),down=firstPersonDirection(yaw,.36);
  assert.ok(up.y>neutral.y);assert.ok(down.y<neutral.y);
  assert.ok(Math.abs(up.length()-1)<1e-12);assert.ok(Math.abs(down.length()-1)<1e-12);
 }
});
test('downhill pitch preserves the slope while vertical look remains intuitive',()=>{
 for(const slope of [.1,.4,.75]){
  const neutral=firstPersonDirection(.6,0,slope);
  assert.ok(neutral.y<0);
  assert.ok(firstPersonDirection(.6,-.36,slope).y>neutral.y);
  assert.ok(firstPersonDirection(.6,.36,slope).y<neutral.y);
 }
});
test('steep slopes and extreme look angles never flip the view backwards',()=>{
 for(const slope of [0,.8])for(const pitch of [-2,-.75,0,.75,2]){
  const v=firstPersonDirection(0,pitch,slope);assert.ok(v.z>0);assert.ok(Math.abs(v.length()-1)<1e-12);
 }
});
