import test from 'node:test';import assert from 'node:assert/strict';import {gzipSync} from 'node:zlib';
import {fetchAsset} from '../src/asset-transfer.js';
import {readPreferences} from '../src/preference-model.js';
test('compressed model transfer preserves GLB bytes and query while avoiding the large source',async()=>{
 const bytes=Buffer.alloc(28);bytes.writeUInt32LE(0x46546c67);const urls=[];
 const response=await fetchAsset('/assets/test.glb?v=2',{}, {supported:true,catalog:{'/assets/test.glb':'/assets/transit/test.glb.gz'},fetchFile:async url=>{urls.push(url);return new Response(gzipSync(bytes));}});
 assert.deepEqual(Buffer.from(await response.arrayBuffer()),bytes);assert.deepEqual(urls,['/assets/transit/test.glb.gz?v=2']);
});
test('broken compressed downloads fall back to the standard model, but cancellation does not restart',async()=>{
 const urls=[],catalog={'/assets/test.glb':'/assets/transit/test.glb.gz'};
 const response=await fetchAsset('/assets/test.glb',{}, {supported:true,catalog,fetchFile:async url=>{urls.push(url);return url.endsWith('.gz')?new Response('bad',{status:404}):new Response('fallback');}});
 assert.equal(await response.text(),'fallback');assert.equal(urls.length,2);
 const controller=new AbortController();controller.abort();let calls=0;
 await assert.rejects(fetchAsset('/assets/test.glb',{signal:controller.signal},{supported:true,catalog,fetchFile:async()=>{calls++;throw Error('aborted');}}));assert.equal(calls,0);
});
test('mobile initial quality is lightweight while explicit saved choices survive',()=>{
 assert.equal(readPreferences({getItem:()=>null},false,'low').quality,'low');
 assert.equal(readPreferences({getItem:()=>'{"quality":"high"}'},false,'low').quality,'high');
 assert.equal(readPreferences({getItem:()=>null}).quality,'balanced');
});
test('browsers without native decompression can decode the same public model',async()=>{
 const saved=globalThis.DecompressionStream,bytes=Buffer.alloc(28);bytes.writeUInt32LE(0x46546c67);
 try{globalThis.DecompressionStream=undefined;const response=await fetchAsset('/assets/test.glb',{}, {supported:true,catalog:{'/assets/test.glb':'/assets/transit/test.glb.gz'},fetchFile:async()=>new Response(gzipSync(bytes))});assert.deepEqual(Buffer.from(await response.arrayBuffer()),bytes);}
 finally{globalThis.DecompressionStream=saved;}
});
test('servers that apply gzip Content-Encoding do not trigger a second decode or download',async()=>{
 const bytes=Buffer.alloc(28);bytes.writeUInt32LE(0x46546c67);let calls=0;
 const response=await fetchAsset('/assets/test.glb',{}, {supported:true,catalog:{'/assets/test.glb':'/assets/transit/test.glb.gz'},fetchFile:async()=>{calls++;return new Response(bytes,{headers:{'Content-Encoding':'gzip'}});}});
 assert.deepEqual(Buffer.from(await response.arrayBuffer()),bytes);assert.equal(calls,1);
});
