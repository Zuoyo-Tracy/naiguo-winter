import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizePreferences,readPreferences,pixelRatioFor} from '../src/preference-model.js';
test('device preferences recover from missing or invalid saved values',()=>{
 assert.equal(normalizePreferences(null,true).comfort,true);assert.equal(normalizePreferences({quality:'extreme',sensitivity:Infinity}).quality,'balanced');assert.equal(normalizePreferences({volume:5,sensitivity:-1}).volume,.6);assert.equal(normalizePreferences({sensitivity:-1}).sensitivity,.5);assert.equal(readPreferences({getItem(){throw Error('storage denied');}},true).comfort,true);
});
test('quality caps pixel density without enlarging low-density displays',()=>{
 assert.equal(pixelRatioFor('low',2),1);assert.equal(pixelRatioFor('balanced',3),1.5);assert.equal(pixelRatioFor('high',3),2);assert.equal(pixelRatioFor('high',1),1);
});
test('slow touring defaults on for existing visitors and preserves their explicit opt-out',()=>{
 assert.equal(normalizePreferences(null).cruise,true);
 assert.equal(normalizePreferences({quality:'high'}).cruise,true);
 assert.equal(normalizePreferences({cruise:'false'}).cruise,true);
 assert.equal(normalizePreferences({cruise:false}).cruise,false);
 assert.equal(readPreferences({getItem(){return JSON.stringify({cruise:false});}}).cruise,false);
});
