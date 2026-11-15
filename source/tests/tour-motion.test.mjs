import test from 'node:test';import assert from 'node:assert/strict';
import {advanceTour,createLocalTourPace} from '../src/tour-motion.js';import {finishTourPath} from '../src/tour-route.js';
const points=finishTourPath([{x:0,y:0,z:0},{x:0,y:0,z:1000}]);
test('automatic touring cannot sweep through a narrow blocking wall even after a long frame',()=>{const motion={s:10,speed:66.67};for(let i=0;i<10;i++)advanceTour(motion,.1,{points,gear:2,blocked:(a,b)=>a.z<13&&b.z>=13});assert.ok(motion.s<13);assert.equal(motion.speed,0);assert.equal(motion.waiting,true);});
test('stop from highest touring speed responds in under one second',()=>{const motion={s:100,speed:240/3.6};for(let i=0;i<60;i++)advanceTour(motion,1/60,{points,gear:2,stopping:true});assert.equal(motion.speed,0);assert.ok(motion.s<133);});
test('tour finishes at the destination without overshoot',()=>{const motion={s:990,speed:20};for(let i=0;i<360;i++)advanceTour(motion,1/60,{points,gear:2});assert.ok(motion.s<=1000);assert.ok(motion.s>999.7);assert.ok(motion.speed<.1);});
test('local park touring respects its pedestrian-area speed cap even in highest gear',()=>{const motion={s:0,speed:0};for(let i=0;i<600;i++)advanceTour(motion,1/60,{points,gear:2,speedCap:5});assert.equal(motion.speed,5);assert.ok(motion.s<50);});

test('park cruising builds speed in the open, prepares a sharp turn, and eases into the dock',()=>{
 const route=finishTourPath([{x:1000,y:0,z:1000},{x:1000,y:0,z:1090},{x:1090,y:0,z:1090}]);
 const pace=createLocalTourPace(route);
 assert.equal(pace.targetSpeed(30,0)*3.6,36);
 assert.equal(pace.targetSpeed(30,2)*3.6,72);
 assert.ok(pace.targetSpeed(80,2)<pace.targetSpeed(30,2));
 assert.ok(pace.targetSpeed(90,2)<pace.targetSpeed(80,2));
 assert.ok(pace.targetSpeed(179.5,2)<1.2);
 assert.equal(pace.targetSpeed(180,2),0);
});
