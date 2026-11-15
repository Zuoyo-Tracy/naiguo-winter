import test from 'node:test';
import assert from 'node:assert/strict';
import {hauntCourts,mazePose,chooseMaze,stepMaze,mazeSpeedFactor} from '../src/haunt-maze.js';
import {hauntPose} from '../src/haunt-route.js';
import {stepSnow} from '../src/snow-globe.js';
import {storyBeats,chooseRescue,ensureStory} from '../src/rescue-story.js';
test('six branches are continuous, visibly separated, and merge at both ends',()=>{
 for(const c of hauntCourts){for(const s of [c.start,c.end])for(const side of [1,-1]){const a=mazePose(s,0,{[c.id]:side}),b=hauntPose(s);assert.ok(Math.hypot(a.x-b.x,a.z-b.z)<1e-7);assert.ok(Math.abs(a.yaw-b.yaw)<.01);}
 const s=(c.start+c.end)/2,a=mazePose(s,0,{[c.id]:1}),b=mazePose(s,0,{[c.id]:-1});assert.ok(Math.hypot(a.x-b.x,a.z-b.z)>6.9);
 for(let s=c.start;s<=c.end;s+=1)assert.ok(mazeSpeedFactor(s,{[c.id]:1})>=1);
 }
});
test('junction stops overshoot, accepts left/right, locks route until returning, rejects remote choice',()=>{
 const c=hauntCourts[0],s={snow:true,hauntS:c.start+3,speed:11,hauntLateral:.8};stepMaze(s,c.start-1,{});assert.equal(s.hauntS,c.start);assert.equal(s.speed,0);assert.equal(s.hauntJunction,c.id);assert.equal(chooseMaze(s,-1),true);assert.equal(s.hauntChoices[c.id],-1);assert.equal(chooseMaze(s,1),false);assert.equal(s.hauntLateral,0);s.hauntS=c.start-.1;stepMaze(s,c.start+.1,{});assert.equal(s.hauntS,c.start);assert.equal(s.hauntJunction,c.id);assert.equal(chooseMaze(s,1),true);assert.equal(s.hauntChoices[c.id],1);
});
test('all eight combinations remain driveable with rescue clues and all gates; reverse stays on chosen branch',()=>{
 const answer={arrival:'ask',firstDoor:'bell',confession:'listen',echo:'right',bargain:'accuse',lastDoor:'apology',rescue:'rescue',decision:'both'};
 for(let mask=0;mask<8;mask++){
  const s={snow:true,snowDone:false,hauntS:0,hauntLateral:0,seal:0,speed:0,hauntTime:0,snowReturn:{x:203,z:485,y:12}};ensureStory(s);
  let elapsed=0;while(s.snow&&elapsed<500){
   if(s.hauntJunction){const i=hauntCourts.findIndex(c=>c.id===s.hauntJunction);chooseMaze(s,mask&(1<<i)?-1:1);}
   if(s.rescueStory.dialog){const d=s.rescueStory.dialog;chooseRescue(s,d.kind==='beat'?answer[d.id]:'continue');}
   // Alternate to the clear half of each paper-ghost corridor.
   const {hauntHazards,ghostOffset}=route;const h=hauntHazards.find(h=>h.s>s.hauntS-6&&h.s<s.hauntS+35);const target=h?(ghostOffset(h,s.hauntTime+.4)>0?-.7:.7):0;
   stepSnow(s,{accelerate:true,steer:Math.abs(target-s.hauntLateral)<.03?0:Math.sign(target-s.hauntLateral),interact:true},.02);elapsed+=.02;
  }
  assert.equal(s.snow,false,'combination '+mask+' at '+s.hauntS);assert.equal(s.rescueStory.ending,'together');assert.equal(s.rescueStory.evidence.length,4);assert.equal(s.rescueStory.journal.filter(j=>j.id?.includes(':')).length,3);
 }
 const c=hauntCourts[0],s={snow:true,hauntS:550,hauntChoices:{well:-1},hauntLateral:0,seal:1,speed:0,hauntTime:0,rescueStory:{done:storyBeats.map(b=>b.id),journal:[],evidence:[],dialog:null}};stepSnow(s,{reverse:true},.1);assert.ok(s.hauntS<550);const expected=mazePose(s.hauntS,0,{well:-1});assert.equal(s.x,expected.x);assert.equal(s.z,expected.z);
});
import * as route from '../src/haunt-route.js';
