// A quality change can request several materials from one original GLB at once.
export function createFullTextureSource(url, fetchFile=fetch) {
 let pending,cached;
 async function readModel(signal) {
  const response=await fetchFile(url,{signal});
  if(!response.ok)throw new Error('Texture download failed: '+response.status);
  const file=await response.blob();
  if(file.size<28)throw new Error('Incomplete texture model');
  const header=new DataView(await file.slice(0,20).arrayBuffer());
  const jsonLength=header.getUint32(12,true),binHeader=20+jsonLength,begin=binHeader+8;
  if(header.getUint32(0,true)!==0x46546c67 || header.getUint32(4,true)!==2 ||
     header.getUint32(8,true)!==file.size || header.getUint32(16,true)!==0x4e4f534a || begin>file.size)throw new Error('Invalid texture model');
  const document=JSON.parse(await file.slice(20,binHeader).text());
  const bin=new DataView(await file.slice(binHeader,begin).arrayBuffer());
  if(bin.getUint32(4,true)!==0x004e4942 || begin+bin.getUint32(0,true)>file.size)throw new Error('Missing texture data');
  return document.images.map(image=>{
   const view=document.bufferViews[image.bufferView];
   if(!view||view.buffer!==0)return null;
   const start=begin+(view.byteOffset||0),end=start+view.byteLength;
   if(start<begin||end>file.size)return null;
   return file.slice(start,end,image.mimeType);
  });
 }
 return async (index,signal)=>{
  if(!cached&&(!pending||pending.signal?.aborted)){
   const entry={signal};
   pending=entry;
   entry.promise=readModel(signal).then(images=>cached=images).finally(()=>{
    if(pending===entry)pending=null;
   });
  }
  const images=cached||await pending.promise;
  if(!images[index])throw new Error('Original texture is missing');
  return images[index];
 };
}
