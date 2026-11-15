import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// Only free trial is used. The ground fixture skips the long trip to the terminal;
// departure, pause, flight and landing are all exercised through the real UI.
const report={passed:false,pageErrors:[]};
const reportDir='reports';
fs.mkdirSync(reportDir,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page=await browser.newPage({viewport:{width:1280,height:900}});
page.on('pageerror',error=>report.pageErrors.push(error.message));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const ground=()=>page.evaluate(()=>({x:__gameDebug.x,y:__gameDebug.groundY+1.5,z:__gameDebug.z,status:__gameDebug.status,hits:__gameDebug.hits}));
const flight=()=>page.evaluate(()=>({x:__skyDebug.x,y:__skyDebug.y,z:__skyDebug.z,paused:__skyDebug.paused,transfer:__skyDebug.transfer}));

async function openTrial(){
 await page.goto('http://127.0.0.1:5173/?scene=grand-palace&trial=1&test=1');
 await page.click('#account-trial');
 await page.waitForFunction(()=>window.__gameDebug?.ready&&window.__raceFixture,null,{timeout:180000});
 await page.waitForSelector('#world-loading',{state:'detached',timeout:180000});
 await page.waitForSelector('#sky-entry:not([hidden])',{timeout:180000});
}
async function chooseFirstChapter(){
 await page.click('#sky-entry');
 await page.click('[data-chapter="0"]');
}
async function startSamples(){
 await page.evaluate(()=>{
  if(window.__departureSamples)window.__departureSamples.active=false;
  const record={active:true,samples:[],maxStep:0,maxStepPair:null,firstFlight:null,transferEnds:[],solidContacts:[],solidChecks:0};
  window.__departureSamples=record;
  let previous=null;
  function sample(){
   if(!record.active)return;
   const flying=document.body.classList.contains('sky-flying');
   const state=flying?window.__skyDebug:window.__gameDebug;
   if(state&&Number.isFinite(state.x)&&Number.isFinite(state.z)){
    const p={x:state.x,y:flying?state.y:state.groundY+1.5,z:state.z,flying,paused:!!state.paused,transfer:state.transfer?{...state.transfer}:null};
    if(Number.isFinite(p.y)){
     if(flying&&!record.firstFlight)record.firstFlight=p;
     if(previous){
      const step=Math.hypot(p.x-previous.x,p.y-previous.y,p.z-previous.z);
      if(step>record.maxStep){record.maxStep=step;record.maxStepPair=[previous,p];}
      if(previous.transfer&&!p.transfer)record.transferEnds.push({from:previous.transfer,to:p});
     }
     // These are the actual collision proxies produced after the sky models load.
     // The Ferris wheel's whole AABB would falsely treat its open interior as solid.
     if(p.flying&&p.transfer&&window.__skySolids){
      for(const [index,solid] of window.__skySolids.entries()){
       record.solidChecks++;
       const inside=solid.min&&solid.max
        ?p.x>solid.min.x&&p.x<solid.max.x&&p.y>solid.min.y&&p.y<solid.max.y&&p.z>solid.min.z&&p.z<solid.max.z
        :Number.isFinite(solid.r)&&Math.hypot(p.x-solid.x,p.y-solid.y,p.z-solid.z)<solid.r;
       if(inside&&record.solidContacts.length<12)record.solidContacts.push({index,p});
      }
     }
     record.samples.push(p);previous=p;
    }
   }
   requestAnimationFrame(sample);
  }
  requestAnimationFrame(sample);
 });
}
async function stopSamples(){
 return page.evaluate(()=>{
  const s=__departureSamples;s.active=false;
  return {count:s.samples.length,maxStep:s.maxStep,maxStepPair:s.maxStepPair,firstFlight:s.firstFlight,transferEnds:s.transferEnds,solidChecks:s.solidChecks,solidContacts:s.solidContacts,minY:Math.min(...s.samples.map(p=>p.y)),maxY:Math.max(...s.samples.map(p=>p.y))};
 });
}

try{
 await openTrial();
 const origin=await ground();
 await startSamples();
 await chooseFirstChapter();
 await page.waitForTimeout(1200);
 const afterRemote=await ground();
 report.remote={origin,after:afterRemote,flying:await page.evaluate(()=>document.body.classList.contains('sky-flying')),samples:await stopSamples()};
 assert.equal(report.remote.flying,false,'Selecting a sky chapter from the starting station must not teleport to the sky');
 assert.equal(afterRemote.status,'running','Remote selection must leave the player driving on the ground');
 assert.ok(distance(origin,afterRemote)<100,'Remote selection must only start ground guidance');
 assert.ok(report.remote.samples.maxStep<5,'Ground guidance must not teleport toward the launch terminal');

 // A fresh page clears the pending navigation, then W drives the last bridge span.
 await openTrial();
 report.terminal=await page.evaluate(async()=>{
  const {skyLaunch}=await import('/src/sky-terminal.js');
  const {skyStart}=await import('/src/sky-journey.js');
  const {parkSurface}=await import('/src/park-rules.js');
  const x=skyLaunch.x-Math.sin(skyLaunch.yaw)*20,z=skyLaunch.z-Math.cos(skyLaunch.yaw)*20;
  const groundY=parkSurface(x,z);
  if(!Number.isFinite(groundY))throw new Error('Launch approach has no walkable bridge surface');
  __tourController.reset();
  __raceFixture({x,z,groundY,yaw:skyLaunch.yaw,speed:0,hits:0,status:'running',mode:'explore',challenge:null,snow:false,falling:false,magnetic:false,jumpY:0,vy:0,wallContact:false,offRoadTime:0});
  return {launch:skyLaunch,skyStart:{x:skyStart[0],y:skyStart[1],z:skyStart[2]},approach:{x,y:groundY,z}};
 });
 await page.waitForTimeout(200);
 await page.screenshot({path:`${reportDir}/sky-departure-bridge.jpg`});
 await page.keyboard.down('w');
 try{
  await page.waitForFunction(launch=>Math.hypot(__gameDebug.x-launch.x,__gameDebug.z-launch.z)<5.5,report.terminal.launch,{timeout:20000});
 }finally{await page.keyboard.up('w');}
 await page.keyboard.down('b');await page.waitForTimeout(400);await page.keyboard.up('b');
 const launchPose=await ground();
 report.approach={pose:launchPose,distance:Math.hypot(launchPose.x-report.terminal.launch.x,launchPose.z-report.terminal.launch.z)};
 assert.ok(report.approach.distance<11,'Actual W input must reach the launch area across its bridge');
 assert.equal(launchPose.status,'running');
 assert.equal(launchPose.hits,0,'Driving along the bridge must not hit a facility');
 await startSamples();
 await chooseFirstChapter();
 await page.waitForFunction(()=>document.body.classList.contains('sky-flying')&&window.__skyDebug?.transfer,null,{timeout:180000});
 await page.waitForFunction(y=>__skyDebug.y>y+12,launchPose.y,{timeout:30000});
 await page.keyboard.press('m');
 await page.waitForFunction(()=>__skyDebug.paused===true);
 const paused=await flight();
 await page.waitForTimeout(500);
 const stillPaused=await flight();
 assert.ok(distance(paused,stillPaused)<.0001,'Opening the sky map must freeze the launch transfer');
 report.pause={before:paused,after:stillPaused};
 await page.click('#sky-close');
 await page.screenshot({path:`${reportDir}/sky-departure-ascent.jpg`});
 await page.waitForFunction(()=>!__skyDebug.paused&&!__skyDebug.transfer,null,{timeout:90000});
 await page.click('#sky-brake');
 const departure=await stopSamples();
 report.departure=departure;
 assert.ok(departure.firstFlight,'The flight must start at the terminal');
 assert.ok(distance(departure.firstFlight,launchPose)<2,'The first flight pose must retain the actual ground position');
 assert.ok(departure.maxStep<5,'Departure must never jump more than 5m in a sampled frame');
 const arrival=departure.transferEnds.find(end=>end.to.flying)?.to;
 assert.ok(arrival,'The departure transfer must finish in normal flight');
 assert.ok(distance(arrival,report.terminal.skyStart)<3,'Departure must join the first sky route at skyStart');
 assert.ok(departure.maxY-launchPose.y>150,'Departure must visibly climb from the land route to the sky route');
 assert.ok(departure.solidChecks>0,'Departure must be checked against loaded sky collision volumes');
 assert.deepEqual(departure.solidContacts,[],'Departure must stay outside loaded sky building collision volumes');
 await page.screenshot({path:`${reportDir}/sky-departure-flight.jpg`});

 const beforeReturn=await flight();
 await startSamples();
 await page.click('#sky-exit');
 await page.waitForFunction(()=>document.body.classList.contains('sky-flying')&&window.__skyDebug?.transfer,null,{timeout:10000});
 const afterReturnClick=await flight();
 assert.ok(distance(beforeReturn,afterReturnClick)<5,'Return must start continuously from the current flight position');
 await page.waitForFunction(()=>!document.body.classList.contains('sky-flying'),null,{timeout:90000});
 await page.waitForTimeout(100);
 const returned=await ground();
 report.landing={before:beforeReturn,afterClick:afterReturnClick,ground:returned,samples:await stopSamples()};
 assert.ok(report.landing.samples.maxStep<5,'Landing must never teleport to the ground in one frame');
 assert.ok(Math.hypot(returned.x-report.terminal.launch.x,returned.z-report.terminal.launch.z)<11,'Landing must return to the Ferris launch terminal');
 assert.equal(returned.status,'running','Landing must restore normal ground movement');
 assert.deepEqual(report.landing.samples.solidContacts,[],'Landing must stay outside loaded sky building collision volumes');
 assert.deepEqual(report.pageErrors,[]);
 report.passed=true;
}catch(error){
 report.failure=error.stack||error.message;process.exitCode=1;
 await page.screenshot({path:`${reportDir}/sky-departure-failure.jpg`}).catch(()=>{});
}finally{
 fs.writeFileSync(`${reportDir}/sky-departure-check.json`,JSON.stringify(report,null,2));
 await browser.close();
}
console.log(JSON.stringify(report));
