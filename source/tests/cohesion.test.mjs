import test from 'node:test';
import assert from 'node:assert/strict';
import {gardenPaths,gardenDistricts,inGarden,gardenHeight,sceneryAllowed} from '../src/cohesion-layout.js';
import {parkSurface,attractions,parkEntrance} from '../src/park-rules.js';
import {railClearanceSamples} from '../src/train-rules.js';
import {villageSites} from '../src/village-layout.js';

test('new garden boulevards have continuous usable ground between attractions',()=>{
 for(const p of gardenPaths){const n=Math.ceil(Math.hypot(p.x2-p.x1,p.z2-p.z1));let last;
  for(let i=0;i<=n;i++){const t=i/n,x=p.x1+(p.x2-p.x1)*t,z=p.z1+(p.z2-p.z1)*t,y=parkSurface(x,z);assert.ok(Number.isFinite(y),`Missing boulevard ground at ${x},${z}`);if(last!==undefined)assert.ok(Math.abs(y-last)<1.7,'No sharp ledges along a connecting boulevard');last=y;}
 }
});
test('garden planting leaves every attraction entrance and rail corridor open',()=>{
 for(const a of attractions){const e=parkEntrance(a);assert.equal(sceneryAllowed(e.x,e.z,5),false,a.id);}
 for(const p of railClearanceSamples)assert.equal(sceneryAllowed(p.x,p.z,3),false);
});
test('new terrain stays below tracks where the train traverses the garden',()=>{
 let samples=0;for(const p of railClearanceSamples){const d=gardenDistricts.find(d=>inGarden(p.x,p.z,d));if(!d)continue;samples++;assert.ok(gardenHeight(p.x,p.z,d)<=p.y-.45,'Terrain must not fill the railway');}assert.ok(samples>0);
});
test('forecourt connects under the raised railway without burying village foundations',()=>{
 const d=gardenDistricts.find(d=>d.id==='foyer');
 for(const h of villageSites.filter(h=>h.z>500))for(const dx of [-11,0,11])for(const dz of [-11,0,11])assert.ok(gardenHeight(h.x+dx,h.z+dz,d)<=h.y-.25);
 const rail=railClearanceSamples.filter(p=>Math.abs(p.x+50)<2&&p.z>580)[0];assert.ok(rail);assert.ok(rail.y-gardenHeight(-50,rail.z,d)>5.5,'Car and camera can pass below the railway');
});
