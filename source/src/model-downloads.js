// Limit competing model downloads and recover a stalled connection without
// penalizing a slow connection that continues to deliver bytes.
export function createModelDownloads({concurrency=8,idleTimeoutMs=20000,maxAttempts=3,retryDelayMs=250}={}){
 let active=0;const waiting=[];
 const cancelled=signal=>signal?.reason||new DOMException('Download cancelled','AbortError');
 async function attempt(url,options,fetchFile){
  const controller=new AbortController();let timer,reader;
  const abort=()=>controller.abort(cancelled(options.signal));
  if(options.signal?.aborted)throw cancelled(options.signal);
  options.signal?.addEventListener('abort',abort,{once:true});
  let rejectStall;const stalled=new Promise((_,reject)=>{rejectStall=reject;});
  const reset=()=>{clearTimeout(timer);timer=setTimeout(()=>{const error=new Error('Model download stopped making progress');error.name='TimeoutError';rejectStall(error);controller.abort(error);},idleTimeoutMs);};
  const work=async()=>{
   reset();const response=await fetchFile(url,{...options,signal:controller.signal});
   if(!response.ok){if(response.status===408||response.status===429||response.status>=500){response.body?.cancel().catch(()=>{});throw new Error('Temporary model download failure: '+response.status);}return response;}
   // Reading chunks keeps the deadline tied to progress, including after headers.
   if(!response.body)return response;
   reader=response.body.getReader();const chunks=[];let length=0;
   while(true){const {done,value}=await reader.read();if(done)break;reset();chunks.push(value);length+=value.byteLength;}
   const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
   return new Response(bytes,{status:response.status,statusText:response.statusText,headers:response.headers});
  };
  const externalAbort=new Promise((_,reject)=>controller.signal.addEventListener('abort',()=>reject(controller.signal.reason),{once:true}));
  try{return await Promise.race([work(),stalled,externalAbort]);}
  finally{clearTimeout(timer);options.signal?.removeEventListener('abort',abort);reader?.cancel().catch(()=>{});}
 }
 async function run(job){
  for(let index=0;index<maxAttempts;index++){
   if(job.options.signal?.aborted)throw cancelled(job.options.signal);
   const retryUrl=index?job.url+(job.url.includes('?')?'&':'?')+'winterRetry='+index:job.url;
   try{return await attempt(retryUrl,{...job.options,...(index?{cache:'reload'}:{})},job.fetchFile);}
   catch(error){if(job.options.signal?.aborted||index===maxAttempts-1)throw error;await new Promise(resolve=>setTimeout(resolve,retryDelayMs*(index+1)));}
  }
 }
 function pump(){while(active<concurrency&&waiting.length){const job=waiting.shift();job.options.signal?.removeEventListener('abort',job.abortQueued);if(job.cancelled)continue;active++;run(job).then(job.resolve,job.reject).finally(()=>{active--;pump();});}}
 return {download(url,options={},fetchFile=fetch){return new Promise((resolve,reject)=>{if(options.signal?.aborted){reject(cancelled(options.signal));return;}const job={url,options,fetchFile,resolve,reject};job.abortQueued=()=>{job.cancelled=true;reject(cancelled(options.signal));};options.signal?.addEventListener('abort',job.abortQueued,{once:true});waiting.push(job);pump();});},snapshot:()=>({active,queued:waiting.filter(job=>!job.cancelled).length,concurrency})};
}
export const modelDownloads=createModelDownloads();
