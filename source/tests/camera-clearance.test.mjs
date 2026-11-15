import test from 'node:test';
import assert from 'node:assert/strict';
import { clearCamera } from '../src/camera-clearance.js';
import {parkSolids,parkSurface,parkBlocksVehicle} from '../src/park-rules.js';
const target = { x: 0, y: 2, z: 0 }, desired = { x: 12, y: 5, z: 0 };
const facade = { id: 'shop', x: 7, z: 0, y: 0, width: 2, depth: 16, height: 12 };
const group = solid => [{ a: { x: 7, z: 0, r: 15 }, solids: [solid] }];
test('orbit camera stays on the player side of a facade', () => {
  const result = clearCamera(target, desired, group(facade));
  assert.equal(result.obstacle, 'shop'); assert.ok(result.x < 5.72 && result.x > 5.65);
  assert.ok(Math.abs((result.y - 2) / result.x - .25) < 1e-9);
});
test('rotated facades and nearer obstacles select the first contact', () => {
  const diagonal = { ...facade, rotate: Math.PI / 4 };
  const result = clearCamera(target, desired, group(diagonal));
  assert.ok(result.x > 5.1 && result.x < 5.3);
  const groups = [{ solids: [facade, { ...facade, id: 'near', x: 4 }] }];
  assert.equal(clearCamera(target, desired, groups).obstacle, 'near');
});
test('open passage, above-roof view, and recovery from an overlap remain unobstructed', () => {
  assert.equal(clearCamera(target, desired, []).fraction, 1);
  assert.equal(clearCamera({ ...target, y: 15 }, { ...desired, y: 16 }, group(facade)).fraction, 1);
  assert.equal(clearCamera({ x: 7, y: 2, z: 0 }, desired, group(facade)).fraction, 1);
  assert.equal(clearCamera(target, { x: 0, y: 5, z: 12 }, group(facade)).fraction, 1);
});
test('a legal parking spot outside a teacup or carousel corner sees past its tangent but not through the deck',()=>{
 for(const id of ['teacups','carousel']){
  const plaza=parkSolids.find(g=>g.a.id===id),{x,y,z,r}=plaza.solids.find(s=>s.id==='ride');
  const view=(ax,az,ux,uz)=>{
   const target={x:x+ax,y:y+1.54,z:z+az},arm=14*Math.cos(.35);
   assert.equal(parkSurface(target.x,target.z),y);
   assert.equal(parkBlocksVehicle(target.x,target.z,target.x,target.z,y),false);
   return clearCamera(target,{x:target.x+ux*arm,y:target.y+.6+14*Math.sin(.35),z:target.z+uz*arm},[plaza]);
  };
  const ax=r+2,az=r*.65,len=Math.hypot(ax,az);
  assert.equal(view(ax,az,-az/len,ax/len).fraction,1);
  const corner=(r+3.6)/Math.SQRT2,blocked=view(corner,corner,-Math.SQRT1_2,-Math.SQRT1_2);
  assert.equal(blocked.obstacle,'ride');
  assert.ok(Math.abs(Math.hypot(blocked.x-x,blocked.z-z)-(r+.28))<.021);
 }
});
test('finite cylinders protect both caps and allow escape from an overlapping save',()=>{
 const ride={id:'round ride',x:0,z:0,y:0,r:3,height:4},solids=[{solids:[ride]}];
 const from=(x,y,z)=>({x,y,z});
 assert.ok(Math.abs(clearCamera(from(0,9,0),from(0,1,0),solids).y-4.30)<1e-8);
 assert.ok(Math.abs(clearCamera(from(0,-5,0),from(0,2,0),solids).y+.30)<1e-8);
 assert.equal(clearCamera(from(2.8,9,2.8),from(2.8,1,2.8),solids).fraction,1);
 assert.equal(clearCamera(from(10,5,0),from(-10,5,0),solids).fraction,1);
 assert.equal(clearCamera(from(0,2,0),from(8,2,0),solids).fraction,1);
});
