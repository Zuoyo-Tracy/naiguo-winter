import {chromium} from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const args=process.argv.slice(2),label=args.find(a=>a.startsWith('--label='))?.slice(8)||'current',url=args.find(a=>a.startsWith('http'))||'http://127.0.0.1:5173/?scene=grand-palace&trial=1&test=1';
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const report={url,errors:[],assets:[],phases:{}};
try {
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});const page=await context.newPage(),cdp=await context.newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
 if(args.includes('--slow')){await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:40,downloadThroughput:1.5*1048576,uploadThroughput:512*1024,connectionType:'cellular4g'});report.network={latencyMs:40,downloadMiBPerSecond:1.5};}
 const pending=new Map();cdp.on('Network.responseReceived',e=>pending.set(e.requestId,{url:e.response.url,mime:e.response.mimeType}));cdp.on('Network.loadingFinished',e=>{const r=pending.get(e.requestId);if(r&&/\/(assets|ui)\//.test(r.url)){report.assets.push({...r,bytes:e.encodedDataLength,t:Date.now()});}});page.on('pageerror',e=>report.errors.push(e.message));
 const begin=Date.now();await page.goto(url);await page.waitForSelector('#account-trial');report.phases.loginMs=Date.now()-begin;report.phases.loginBytes=report.assets.reduce((s,a)=>s+a.bytes,0);
 const enter=Date.now();await page.click('#account-trial');await page.waitForFunction(()=>window.__gameDebug?.ready||document.querySelector('#loading-explore')?.hidden===false,null,{timeout:180000});report.phases.streetMs=Date.now()-enter;report.phases.streetBytes=report.assets.reduce((s,a)=>s+a.bytes,0);console.log('Streets ready',report.phases);
 await page.waitForSelector('#world-loading',{state:'detached',timeout:180000});report.phases.playableMs=Date.now()-enter;
 if(args.includes('--drive')){
  const before=await page.evaluate(()=>({x:__gameDebug.x,z:__gameDebug.z,background:!!document.querySelector('.world-loading-background')})),box=await page.locator('[data-control="KeyW"]').boundingBox();
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width/2,y:box.y+box.height/2,id:1}]});await page.waitForTimeout(1800);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  const after=await page.evaluate(()=>({x:__gameDebug.x,z:__gameDebug.z,status:__gameDebug.status}));report.touchDrive={before,after,distance:Math.hypot(after.x-before.x,after.z-before.z)};assert.equal(after.status,'running');assert.ok(report.touchDrive.distance>1,'Driving must work while remaining scenery loads');
 }
 if(!args.includes('--first-only')){await page.waitForFunction(()=>window.__detailDebug&&window.__gameDebug?.ready,null,{timeout:240000});report.phases.fullMs=Date.now()-enter;}report.phases.totalBytes=report.assets.reduce((s,a)=>s+a.bytes,0);report.assets.sort((a,b)=>b.bytes-a.bytes);report.ok=report.errors.length===0&&report.phases.streetBytes<50*1048576;
 await page.screenshot({path:`reports/mobile-startup-${label}.jpg`,quality:80});
 if(args.includes('--strict')){assert.deepEqual(report.errors,[]);assert.ok(report.phases.streetBytes<50*1048576,'First-play download exceeds 50 MiB: '+(report.phases.streetBytes/1048576).toFixed(1));}
}finally{fs.writeFileSync(`reports/mobile-startup-${label}.json`,JSON.stringify(report,null,2));await browser.close();}
console.log(JSON.stringify({phases:report.phases,errors:report.errors,ok:report.ok,largest:report.assets.slice(0,8)}));
