import test from 'node:test';
import assert from 'node:assert/strict';
import {Texture} from 'three';
import {createTextureBudget,textureDimensions} from '../src/texture-budget.js';
const bitmap=(width,height)=>({width,height,closed:false,close(){this.closed=true;}});
function fixture(){
 const original=bitmap(2048,1024),a=new Texture(original),b=a.clone();a.colorSpace='srgb';b.colorSpace='';a.flipY=false;let reads=0;
 const parser={json:{textures:[{source:0}],images:[{bufferView:0,mimeType:'image/png'}]},associations:new Map([[a,{textures:0}],[b,{textures:0}]]),getDependency:async()=>{reads++;return new Uint8Array([1,2,3]);}};
 return {original,a,b,gltf:{parser},get reads(){return reads;}};
}
test('quality preserves aspect, avoids upscaling and restores original dimensions',()=>{
 assert.deepEqual(textureDimensions(2048,1024,'balanced'),{width:1024,height:512});assert.deepEqual(textureDimensions(2048,1024,'low'),{width:512,height:256});assert.deepEqual(textureDimensions(256,128,'low'),{width:256,height:128});assert.deepEqual(textureDimensions(2048,1024,'high'),{width:2048,height:1024});
});
test('shared textures resize once, retain UV/color settings and release replaced bitmaps',async()=>{
 const f=fixture(),calls=[],budget=createTextureBudget({supported:()=>true,decode:async(blob,options)=>{calls.push(options);return bitmap(options.resizeWidth,options.resizeHeight);}});let disposals=0;for(const t of [f.a,f.b])t.addEventListener('dispose',()=>disposals++);
 await budget.register(f.gltf);assert.equal(calls.length,1);assert.equal(disposals,2);assert.equal(f.a.image,f.b.image);assert.equal(f.a.image.width,1024);assert.equal(f.original.closed,true);assert.equal(f.a.colorSpace,'srgb');assert.equal(f.b.colorSpace,'');assert.equal(f.a.flipY,false);assert.equal(calls[0].premultiplyAlpha,'none');assert.equal(calls[0].colorSpaceConversion,'none');
 const reduced=f.a.image;await budget.setQuality('high');assert.equal(f.a.image.width,2048);assert.equal(reduced.closed,true);assert.equal(f.reads,1);await budget.setQuality('high');assert.equal(calls.length,2);assert.equal(budget.snapshot().sources,1);
});
test('rapid changes discard obsolete decoded results and settle on the last choice',async()=>{
 const f=fixture(),pending=[],budget=createTextureBudget({supported:()=>true,hash:async()=>null,decode:(_,options)=>new Promise(resolve=>pending.push({options,resolve}))});const initial=budget.register(f.gltf);await new Promise(r=>setImmediate(r));const low=budget.setQuality('low'),stale=bitmap(1024,512);pending.shift().resolve(stale);await new Promise(r=>setImmediate(r));assert.equal(stale.closed,true);assert.equal(pending[0].options.resizeWidth,512);pending.shift().resolve(bitmap(512,256));await Promise.all([initial,low]);assert.equal(f.a.image.width,512);
});
test('a failed resize keeps a usable original and a later quality choice can recover',async()=>{
 const f=fixture();let fail=true;const budget=createTextureBudget({supported:()=>true,decode:async(_,o)=>{if(fail)throw new Error('decode unavailable');return bitmap(o.resizeWidth,o.resizeHeight);}});await budget.register(f.gltf);assert.equal(f.a.image,f.original);assert.equal(f.original.closed,false);assert.equal(budget.snapshot().rows[0].failures,1);fail=false;await budget.setQuality('low');assert.equal(f.a.image.width,512);
});
test('identical embedded images across assets share storage but keep independent sampler and color settings',async()=>{
 const a=fixture(),b=fixture();b.a.wrapS=123;b.a.colorSpace='';let decodes=0;
 const budget=createTextureBudget({supported:()=>true,hash:async()=> 'same-image',decode:async(_,o)=>{decodes++;return bitmap(o.resizeWidth,o.resizeHeight);}});
 await Promise.all([budget.register(a.gltf),budget.register(b.gltf)]);
 assert.equal(a.a.source,b.a.source);assert.equal(b.a.source,b.b.source);assert.equal(decodes,1);assert.equal(a.a.colorSpace,'srgb');assert.equal(b.a.colorSpace,'');assert.equal(b.a.wrapS,123);assert.equal(b.original.closed,true);assert.equal(budget.snapshot().sources,1);assert.equal(budget.snapshot().sharedImages,1);
 await budget.setQuality('high');assert.equal(a.a.image.width,2048);assert.equal(b.b.image.width,2048);
});
test('lossless WebP extension images participate in the same quality budget',async()=>{
 const f=fixture();f.gltf.parser.json.textures[0]={extensions:{EXT_texture_webp:{source:0}}};f.gltf.parser.json.images[0].mimeType='image/webp';const budget=createTextureBudget({supported:()=>true,decode:async(blob,o)=>{assert.equal(blob.type,'image/webp');return bitmap(o.resizeWidth,o.resizeHeight);}});await budget.register(f.gltf);assert.equal(f.a.image.width,1024);assert.equal(budget.snapshot().sources,1);
});
