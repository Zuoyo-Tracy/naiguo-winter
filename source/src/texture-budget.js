const limits={low:512,balanced:1024,high:Infinity};

export function textureDimensions(width,height,quality){
 const scale=Math.min(1,(limits[quality]||limits.balanced)/Math.max(width,height));
 return {width:Math.max(1,Math.round(width*scale)),height:Math.max(1,Math.round(height*scale))};
}

// Keep the encoded GLB image for restoring detail, not a second decoded bitmap.
// All material copies share their Source, so each image is resized only once.
export function createTextureBudget({decode=(blob,options)=>globalThis.createImageBitmap(blob,options),supported=()=>typeof globalThis.createImageBitmap==='function',hash=async bytes=>globalThis.crypto?.subtle?Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join(''):null}={}){
 let quality='balanced',revision=0,sharedImages=0,decoding=0,qualityLoad=new AbortController();const records=new Set(),bySource=new WeakMap(),byImage=new Map(),decodeJobs=[];
 function decodeImage(blob,options){
  return new Promise((resolve,reject)=>{decodeJobs.push({blob,options,resolve,reject});pump();});
 }
 function pump(){
  while(decoding<2&&decodeJobs.length){const job=decodeJobs.shift();decoding++;Promise.resolve().then(()=>decode(job.blob,job.options)).then(job.resolve,job.reject).finally(()=>{decoding--;pump();});}
 }
 async function adjust(record){
  record.queue=record.queue.then(async()=>{
   while(true){
    const target=textureDimensions(record.width,record.height,quality),version=revision;
    if(record.source.data.width===target.width&&record.source.data.height===target.height)return;
    if(record.failedRevision===version)return;
    let bitmap;
    try{
     const large=target.width>record.embeddedWidth||target.height>record.embeddedHeight;
     const blob=large&&record.original?await record.original(qualityLoad.signal):await record.blob;
     if(version!==revision)continue;
     bitmap=await decodeImage(blob,{premultiplyAlpha:'none',colorSpaceConversion:'none',resizeWidth:target.width,resizeHeight:target.height,resizeQuality:'high'});}
    catch{if(version!==revision)continue;record.failedRevision=version;record.failures++;return;}
    if(version!==revision){bitmap.close?.();continue;}
    const previous=record.source.data;
    // WebGL immutable texture storage must be recreated when dimensions change.
    for(const texture of record.textures)texture.dispose();
    record.source.data=bitmap;
    for(const texture of record.textures)texture.needsUpdate=true;
    previous.close?.();record.changes++;return;
   }
  });
  return record.queue;
 }
 async function register(gltf,readOriginal=null){
  if(!supported()||!gltf.parser?.associations)return;
  const touched=new Set(),retired=new Set(),parser=gltf.parser;
  for(const [texture,association]of parser.associations){
   if(!texture?.isTexture||texture.isCompressedTexture||!texture.image?.close)continue;
   const textureDef=parser.json.textures?.[association.textures],imageIndex=textureDef?.extensions?.EXT_texture_webp?.source??textureDef?.source,imageDef=parser.json.images?.[imageIndex];
   if(imageDef?.bufferView===undefined)continue;
   const source=texture.source;let record=bySource.get(source);
   if(!record){
    const bitmap=texture.image;
    const full=readOriginal&&imageDef.extras?.winterFull;
    const width=full?.width??bitmap.width,height=full?.height??bitmap.height;
    const bytes=parser.getDependency('bufferView',imageDef.bufferView);let identity;
    try{const digest=full?.sha256||await hash(await bytes);if(digest)identity=[digest,width,height].join(':');}catch{/* Deduplication is optional; keep a valid decoded texture on failure. */}
    record=identity?byImage.get(identity):undefined;
    if(record){if(bitmap!==record.source.data)retired.add(bitmap);sharedImages++;}
    else{
     record={source,width,height,embeddedWidth:bitmap.width,embeddedHeight:bitmap.height,original:full?signal=>readOriginal(full.index,signal):null,textures:new Set(),queue:Promise.resolve(),changes:0,failures:0,failedRevision:-1};
     Object.defineProperty(record,'blob',{get(){if(!this.encoded)this.encoded=bytes.then(data=>new Blob([data],{type:imageDef.mimeType}));return this.encoded;}});
     records.add(record);if(identity)byImage.set(identity,record);
    }
    bySource.set(source,record);
   }
   if(source!==record.source){texture.dispose();texture.source=record.source;texture.needsUpdate=true;}
   record.textures.add(texture);touched.add(record);
  }
  for(const bitmap of retired)bitmap.close();
  await Promise.all([...touched].map(adjust));
 }
 async function setQuality(next,{retry=false}={}){
  next=next in limits?next:'balanced';if(next!==quality||retry){quality=next;revision++;qualityLoad.abort();qualityLoad=new AbortController();}
  // High-detail upgrades may fetch full source images. Bound their network and decode work together.
  const pending=[...records].values(),version=revision;
  async function worker(){for(const record of pending){if(version!==revision)return;await adjust(record);}}
  await Promise.all([worker(),worker(),worker()]);
  return snapshot();
 }
 function snapshot(){
  const rows=[...records].map(r=>({original:[r.width,r.height],current:[r.source.data.width,r.source.data.height],textures:r.textures.size,changes:r.changes,failures:r.failures}));
  const incomplete=rows.filter(r=>{
   const target=textureDimensions(...r.original,quality);
   return r.current[0]!==target.width||r.current[1]!==target.height;
  }).length;
  return {quality,incomplete,sources:rows.length,sharedImages,originalDecodedMiB:rows.reduce((n,r)=>n+r.original[0]*r.original[1]*4,0)/1048576,currentDecodedMiB:rows.reduce((n,r)=>n+r.current[0]*r.current[1]*4,0)/1048576,rows};
 }
 return {register,setQuality,snapshot,get quality(){return quality;}};
}
export const textureBudget=createTextureBudget();
if(typeof window!=='undefined'&&new URLSearchParams(location.search).has('test'))window.__textureBudget=textureBudget;
