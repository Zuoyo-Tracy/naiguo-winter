import test from 'node:test';import assert from 'node:assert/strict';import {stepSnow,globe} from '../src/snow-globe.js';
test('optional haunt stops at the entrance while loading and enters after assets are ready',()=>{
 const state={x:globe.x,z:globe.z,speed:20,snow:false,status:'running'};
 assert.equal(stepSnow(state,{hauntReady:false},.02),true);assert.equal(state.speed,0);assert.equal(state.snow,false);assert.equal(state.x,globe.x);
 stepSnow(state,{hauntReady:true},0);assert.equal(state.snow,true);assert.equal(state.hauntS,0);
});
