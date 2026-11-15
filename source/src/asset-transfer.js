import {modelDownloads} from './model-downloads.js';
import transport from './transport-assets.json' with {type:'json'};
import {publicAsset} from './public-assets.js';

export const compressedAssetsSupported=()=>typeof window!=='undefined';
// A versioned compressed container changes transport only. The decompressed GLB
// retains identical geometry, animation channels, skin weights and node names.
export async function fetchAsset(url,options={},dependencies={}){
 const fetchFile=dependencies.fetchFile||fetch,download=(url,opts)=>modelDownloads.download(url,opts,fetchFile),supported=dependencies.supported??compressedAssetsSupported(),catalog=dependencies.catalog||transport;
 const [file,query]=url.split('?'),packed=supported&&(catalog[file]||(file.endsWith('.glb.gz')?file:null));
 const suffix=query?'?'+query:'';
 if(!packed)return download(publicAsset(url),options);
 try{
  const response=await download(publicAsset(packed+suffix),options);
  if(!response.ok)throw Error('Model transfer failed: '+response.status);
  const payload=await response.arrayBuffer();
  // Some hosts send Content-Encoding:gzip for .gz files, so fetch has already
  // decoded them. Other static hosts serve the container bytes as-is.
  const alreadyDecoded=payload.byteLength>=20&&new DataView(payload).getUint32(0,true)===0x46546c67;
  const bytes=alreadyDecoded?payload:typeof DecompressionStream==='function'
   ?await new Response(new Blob([payload]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer()
   :(await import('three/addons/libs/fflate.module.js')).gunzipSync(new Uint8Array(payload)).buffer;
  if(bytes.byteLength<20||new DataView(bytes).getUint32(0,true)!==0x46546c67)throw Error('Invalid model transfer');
  return new Response(bytes,{headers:{'Content-Type':'model/gltf-binary'}});
 }catch(error){
  if(options.signal?.aborted||file.endsWith('.glb.gz'))throw error;
  // Retain a standard GLB route for older browsers, interrupted downloads and retries.
  return download(publicAsset(url),options);
 }
}

export async function loadTransferredGLB(loader,url,onProgress,loadStandard){
 const [file]=url.split('?');
 if(!compressedAssetsSupported()||(!transport[file]&&!file.endsWith('.glb.gz')))return loadStandard(url,onProgress);
 const response=await fetchAsset(url);if(!response.ok)throw Error('Model download failed: '+response.status);
 const bytes=await response.arrayBuffer();
 onProgress?.({loaded:bytes.byteLength,total:bytes.byteLength,lengthComputable:true});
 return loader.parseAsync(bytes,publicAsset(file.slice(0,file.lastIndexOf('/')+1)));
}
