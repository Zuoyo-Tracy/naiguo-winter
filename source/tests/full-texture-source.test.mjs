import test from 'node:test';
import assert from 'node:assert/strict';
import {Texture} from 'three';
import {createFullTextureSource} from '../src/full-texture-source.js';
import {createTextureBudget} from '../src/texture-budget.js';

function originalModel() {
 const doc=Buffer.from(JSON.stringify({images:[{mimeType:'image/png',bufferView:0},{mimeType:'image/webp',bufferView:1}],bufferViews:[
  {buffer:0,byteOffset:0,byteLength:2},{buffer:0,byteOffset:4,byteLength:3}]}));
 const jsonSize=Math.ceil(doc.length/4)*4,out=Buffer.alloc(28+jsonSize+8);
 out.writeUInt32LE(0x46546c67);out.writeUInt32LE(2,4);out.writeUInt32LE(out.length,8);
 out.writeUInt32LE(jsonSize,12);out.writeUInt32LE(0x4e4f534a,16);out.fill(32,20,20+jsonSize);doc.copy(out,20);
 out.writeUInt32LE(8,20+jsonSize);out.writeUInt32LE(0x004e4942,24+jsonSize);
 out.set([1,2,0,0,3,4,5,0],28+jsonSize);
 return out;
}

test('a failed original model request can retry; all its images share one successful request',async()=>{
 let requests=0;
 const read=createFullTextureSource('original.glb',()=>++requests===1?new Response('down',{status:503}):new Response(originalModel()));
 await assert.rejects(read(0),/503/);
 const [a,b]=await Promise.all([read(0),read(1)]);
 assert.equal(requests,2);assert.equal(a.type,'image/png');assert.equal(b.type,'image/webp');
 assert.deepEqual([...new Uint8Array(await b.arrayBuffer())],[3,4,5]);
 await assert.rejects(read(2),/missing/);
});

test('balanced textures use their embedded bitmap and only the high setting fetches the full source',async()=>{
 const bitmap=(width,height)=>({width,height,close(){}});
 const texture=new Texture(bitmap(1024,512));
 const parser={json:{textures:[{source:0}],images:[{bufferView:0,mimeType:'image/png',extras:{winterFull:{index:4,width:2048,height:1024,sha256:'sample'}}}]},associations:new Map([[texture,{textures:0}]]),getDependency:async()=>new Uint8Array([1])};
 const uses=[];let reads=0;
 const budget=createTextureBudget({supported:()=>true,decode:async(blob,options)=>{
  uses.push(await blob.text());return bitmap(options.resizeWidth,options.resizeHeight);
 }});
 await budget.register({parser},async index=>{assert.equal(index,4);reads++;return new Blob(['original']);});
 assert.deepEqual([reads,uses.length,texture.image.width],[0,0,1024]);
 await budget.setQuality('low');
 assert.equal(reads,0);assert.equal(texture.image.width,512);
 await budget.setQuality('high');
 assert.equal(reads,1);assert.equal(texture.image.width,2048);assert.equal(uses.at(-1),'original');
 await budget.setQuality('balanced');
 assert.equal(texture.image.width,1024);assert.equal(reads,1);
});

test('selecting balanced while the network is stalled cancels an obsolete high-detail download',async()=>{
 const source={width:1024,height:1024,close(){}},texture=new Texture(source);
 const parser={json:{textures:[{source:0}],images:[{bufferView:0,mimeType:'image/png',extras:{winterFull:{index:0,width:2048,height:2048,sha256:'slow'}}}]},associations:new Map([[texture,{textures:0}]]),getDependency:async()=>new Uint8Array([1])};
 let started,finish,interrupted=false;
 const loading=new Promise(done=>started=done);
 const budget=createTextureBudget({supported:()=>true,decode:async(_,o)=>({width:o.resizeWidth,height:o.resizeHeight,close(){}})});
 await budget.register({parser},(_,signal)=>new Promise((resolve,reject)=>{
  finish=()=>resolve(new Blob());
  signal?.addEventListener('abort',()=>{interrupted=true;reject(new Error('aborted'));},{once:true});
  started();
 }));
 const high=budget.setQuality('high');
 await loading;
 const balanced=budget.setQuality('balanced');
 await new Promise(resolve=>setImmediate(resolve));
 try{assert.ok(interrupted,'the obsolete download was left pending');}
 finally{finish();await Promise.all([high,balanced]);}
 assert.equal(texture.image,source);
 assert.equal(budget.snapshot().incomplete,0);
 assert.equal(budget.snapshot().rows[0].failures,0);
});
