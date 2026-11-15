import test from 'node:test';
import assert from 'node:assert/strict';
import {newSkiJourney,stepSkiJourney,skiJourneyPose} from '../src/ski-journey.js';
import {skiLiftSections,skiLiftPose,liftLength,liftSupportFloor} from '../src/ski-lift.js';
import {skiPose,SKI_LENGTH} from '../src/ski-layout.js';
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);

test('both escalator routes clear the mountain, have gentle flights and end at the ski start',()=>{
 for(const section of skiLiftSections)for(let i=1;i<section.points.length;i++){
  const a=section.points[i-1],p=section.points[i];
  assert.ok(p.y-liftSupportFloor(p)>.1,section.id+' cuts into snow');
  assert.ok(Math.abs(p.y-a.y)<Math.hypot(p.x-a.x,p.z-a.z)*.7,'flight too steep');
 }
 for(const route of ['entrance','return'])assert.ok(distance(skiLiftPose(liftLength(route),route),skiPose(0))<.17);
 assert.ok(distance(skiLiftPose(0,'return'),skiPose(SKI_LENGTH))<.17);
});
test('boarding starts at the current position and moves continuously to the summit without consuming ski time',()=>{
 const origin={x:344,y:32,z:645},r=newSkiJourney(origin);assert.equal(distance(skiJourneyPose(r),origin),0);
 let previous=skiJourneyPose(r),seconds=0;
 while(r.phase==='ascending'&&seconds<180){stepSkiJourney(r,{start:true,hurry:true,steer:1,jump:true},.02);const p=skiJourneyPose(r);assert.ok(distance(previous,p)<.9,'boarding or summit teleported');previous=p;seconds+=.02;assert.equal(r.s,0);assert.equal(r.time,0);assert.equal(r.score,0);}
 assert.equal(r.phase,'ready');assert.ok(seconds>40&&seconds<100);assert.equal(r.finished,false);
 stepSkiJourney(r,{start:true},.02);assert.equal(r.phase,'ready','holding W on lift must not launch a descent');
 stepSkiJourney(r,{},.02);stepSkiJourney(r,{start:true},.02);assert.equal(r.phase,'skiing');assert.ok(r.s>0);
});
test('a completed run boards the return escalator from its actual finish, preserving the old score',()=>{
 const finish=skiPose(SKI_LENGTH,12),r=newSkiJourney(finish,true);assert.equal(distance(skiJourneyPose(r),finish),0);
 assert.equal(r.liftRoute,'return');assert.equal(r.time,0);assert.equal(r.score,0);assert.equal(r.phase,'ascending');
 for(let i=0;i<120;i++)stepSkiJourney(r,{},1/60);
 assert.ok(distance(skiJourneyPose(r),finish)<10);assert.ok(r.liftS>0);
 const before={...r};stepSkiJourney(r,{hurry:true},0);assert.deepEqual(r,before,'paused frame cannot advance');
});
test('ascent duration and position stay consistent at 30, 60 and 120 fps',()=>{
 const runs=[30,60,120].map(fps=>{const r=newSkiJourney({x:340,y:32,z:642});for(let i=0;i<fps*20;i++)stepSkiJourney(r,{hurry:true},1/fps);return r;});
 assert.ok(Math.max(...runs.map(r=>r.liftS))-Math.min(...runs.map(r=>r.liftS))<2);
});
