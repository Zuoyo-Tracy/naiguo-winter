import test from 'node:test';import assert from 'node:assert/strict';import {stargazeFraming,STAR_FIELD_HEIGHT} from '../src/carnival-camera.js';import {starPositions} from '../src/carnival-rules.js';
test('the whole constellation and its numbers fit above controls in portrait and landscape',()=>{
 for(const [width,height,reserved]of [[320,640,190],[360,740,150],[740,360,150],[1440,960,150]]){
  const {distance,aimY}=stargazeFraming(width/height,height),tangent=Math.tan(55*Math.PI/360);
  for(const [x,y]of starPositions){const nx=(x+.6)/(distance*tangent*width/height),ny=(y+STAR_FIELD_HEIGHT-aimY)/(distance*tangent),pixelY=height*(1-ny)/2;assert.ok(Math.abs(nx)<.9);assert.ok(pixelY>20&&pixelY<height-reserved-10,`${width}×${height}: star clear of controls`);}
 }
});
