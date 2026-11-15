import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// Exercise real pending navigation, delayed model loading, cancellation, then
// abort a partial ascent. Fixtures only place the car on the approach bridge.
const report={passed:false,errors:[]};
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page=await browser.newPage({viewport:{width:1280,height:900}});
page.on('pageerror',e=>report.errors.push(e.message));
let releaseModel;
try{
 await page.goto('http://127.0.0.1:5173/?scene=grand-palace&trial=1&test=1');
 await page.click('#account-trial');
 await page.waitForFunction(()=>window.__gameDebug?.ready&&window.__raceFixture,null,{timeout:180000});
 await page.waitForSelector('#world-loading',{state:'detached',timeout:180000});
 await page.waitForSelector('#sky-entry:not([hidden])',{timeout:180000});
 // Hold only the real pathfinder's zero-delay cooperative yield, so pressing
 // Stop is guaranteed to happen while groundGuide.begin is still awaiting.
 await page.evaluate(()=>{
  const original=window.setTimeout,held=[];
  window.__skyPlanning={held:0,done:false};
  window.setTimeout=(callback,delay,...args)=>{
   if(delay===0&&/\/src\/(pathfinder|tour-route|park-navigation)\.js/.test(new Error().stack)){held.push(()=>original(callback,0,...args));__skyPlanning.held++;return -1;}
   return original(callback,delay,...args);
  };
  window.__releaseSkyPlanning=()=>{window.setTimeout=original;for(const release of held.splice(0))release();};
  // This invokes the same production start handler exposed for fixture tests;
  // the cancellation below is an actual player-facing Stop button click.
  __skyFixture.start(0).finally(()=>__skyPlanning.done=true);
 });
 await page.waitForFunction(()=>__skyPlanning.held>0,null,{timeout:20000});
 await page.click('#tour-stop');
 await page.evaluate(()=>__releaseSkyPlanning());
 await page.waitForFunction(()=>__skyPlanning.done,null,{timeout:90000});
 await page.waitForTimeout(400);
 const planning=await page.evaluate(()=>({held:__skyPlanning.held,done:__skyPlanning.done,tour:__tourController.debug(),autoTour:__gameDebug.autoTour,panel:!document.querySelector('#sky-panel').hidden}));
 assert.equal(planning.tour.active,false,'Finishing cancelled route planning must not restart automatic driving');
 assert.equal(planning.autoTour,false);
 assert.equal(planning.panel,false,'An explicitly cancelled route must not show a pathfinding failure menu');
 report.cancelPlanning={held:planning.held,done:planning.done,restarted:planning.tour.active,panel:planning.panel};
 const modelGate=new Promise(resolve=>releaseModel=resolve);
 let heldRequests=0;
 await page.route(/\/assets\/(?:transit\/)?hero-angel[^/?]*/,async route=>{heldRequests++;await modelGate;await route.continue();});
 const approach=await page.evaluate(async()=>{
  const {skyLaunch}=await import('/src/sky-terminal.js');
  const {parkSurface}=await import('/src/park-rules.js');
  const x=skyLaunch.x-Math.sin(skyLaunch.yaw)*35,z=skyLaunch.z-Math.cos(skyLaunch.yaw)*35,groundY=parkSurface(x,z);
  if(!Number.isFinite(groundY))throw new Error('Sky approach bridge is not navigable');
  __tourController.reset();
  __raceFixture({x,z,groundY,yaw:skyLaunch.yaw,speed:0,hits:0,status:'running',mode:'explore',challenge:null,snow:false,falling:false,jumpY:0,vy:0});
  return {x,z,groundY,launch:skyLaunch};
 });
 await page.waitForTimeout(200);
 await page.click('#sky-entry');await page.click('[data-chapter="0"]');
 await page.waitForFunction(()=>document.querySelector('#sky-panel')?.getAttribute('aria-busy')==='true',null,{timeout:90000});
 await page.waitForTimeout(250);
 assert.ok(heldRequests>0,'The model response must actually be held while pending navigation reaches the terminal');
 const atLoading=await page.evaluate(()=>({x:__gameDebug.x,z:__gameDebug.z,groundY:__gameDebug.groundY,flying:document.body.classList.contains('sky-flying')}));
 assert.equal(atLoading.flying,false);
 assert.ok(Math.hypot(atLoading.x-approach.launch.x,atLoading.z-approach.launch.z)<11);
 await page.click('#sky-close');
 await page.waitForTimeout(650);
 assert.equal(await page.locator('#sky-panel').isVisible(),false,'Cancelling pending takeoff must keep the loading panel closed');
 assert.equal(await page.evaluate(()=>document.body.classList.contains('sky-flying')),false);
 releaseModel();
 await page.waitForTimeout(900);
 assert.equal(await page.locator('#sky-panel').isVisible(),false,'Late model completion must not reopen a cancelled takeoff');
 assert.equal(await page.evaluate(()=>document.body.classList.contains('sky-flying')),false);
 report.cancel={heldRequests,atLoading,remainedOnGround:true};

 await page.click('#sky-entry');await page.click('[data-chapter="0"]');
 await page.waitForFunction(()=>window.__skyDebug?.transfer&&!__skyDebug.paused,null,{timeout:180000});
 const launchY=atLoading.groundY+1.5;
 await page.waitForFunction(y=>__skyDebug.y>y+17,launchY,{timeout:30000});
 const before=await page.evaluate(()=>({x:__skyDebug.x,y:__skyDebug.y,z:__skyDebug.z}));
 assert.ok(before.y<launchY+27,'The return must be requested early in the ascent');
 await page.evaluate(()=>{
  const r=window.__skyAbortSamples={active:true,maxY:__skyDebug.y,maxStep:0,count:0,atReturnClick:null};let last=null;
  document.querySelector('#sky-exit').addEventListener('click',()=>{r.atReturnClick={x:__skyDebug.x,y:__skyDebug.y,z:__skyDebug.z};r.maxY=__skyDebug.y;},{capture:true,once:true});
  function sample(){
   if(!r.active)return;
   const d=window.__skyDebug;if(document.body.classList.contains('sky-flying')&&d){const p={x:d.x,y:d.y,z:d.z};r.maxY=Math.max(r.maxY,p.y);if(last)r.maxStep=Math.max(r.maxStep,Math.hypot(p.x-last.x,p.y-last.y,p.z-last.z));last=p;r.count++;}
   requestAnimationFrame(sample);
  }requestAnimationFrame(sample);
 });
 await page.click('#sky-exit');
 await page.waitForFunction(()=>__skyDebug?.transfer?.kind==='返回起飞台');
 await page.keyboard.press('m');
 await page.waitForFunction(()=>__skyDebug?.paused);
 const paused=await page.evaluate(()=>({x:__skyDebug.x,y:__skyDebug.y,z:__skyDebug.z}));
 await page.waitForTimeout(450);
 assert.deepEqual(await page.evaluate(()=>({x:__skyDebug.x,y:__skyDebug.y,z:__skyDebug.z})),paused,'Pausing the partial return must freeze movement');
 await page.click('#sky-close');
 await page.waitForFunction(()=>!document.body.classList.contains('sky-flying'),null,{timeout:45000});
 await page.waitForTimeout(150);
 const after=await page.evaluate(()=>{__skyAbortSamples.active=false;return {samples:__skyAbortSamples,ground:{x:__gameDebug.x,z:__gameDebug.z,y:__gameDebug.groundY,status:__gameDebug.status,hits:__gameDebug.hits}};});
 report.partialReturn={before,paused,...after};
 assert.ok(after.samples.atReturnClick,'The actual return button must handle the request');
 assert.ok(after.samples.maxY<=after.samples.atReturnClick.y+.05,'An aborted ascent must reverse its flown path instead of climbing to the full sky start: '+JSON.stringify({before,atReturnClick:after.samples.atReturnClick,maxY:after.samples.maxY,paused}));
 assert.ok(after.samples.maxStep<5,'The early return must remain continuous');
 assert.equal(after.ground.status,'running');assert.equal(after.ground.hits,0);
 assert.ok(Math.hypot(after.ground.x-atLoading.x,after.ground.z-atLoading.z)<.5,'Partial return must land at the departure position');
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(error){report.failure=error.stack||error.message;process.exitCode=1;await page.screenshot({path:'reports/sky-cancel-failure.jpg'}).catch(()=>{});}
finally{releaseModel?.();fs.writeFileSync('reports/sky-cancel-check.json',JSON.stringify(report,null,2));await browser.close();}
console.log(JSON.stringify(report));
