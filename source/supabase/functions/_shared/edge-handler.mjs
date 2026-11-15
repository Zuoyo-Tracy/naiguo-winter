import {createRaceApi} from './core/race-api.mjs';
import {ApiError} from './core/race-rules.mjs';

function normalizedIp(value){
 if(!value||value.length>45||value.includes(','))return null;
 if(/^\d{1,3}(?:\.\d{1,3}){3}$/.test(value)){
  const parts=value.split('.').map(Number);
  return parts.every(n=>n<=255)?parts.join('.'):null;
 }
 if(!/^[a-fA-F0-9:]+$/.test(value)||!value.includes(':'))return null;
 try{return new URL('http://['+value+']/').hostname.slice(1,-1);}catch{return null;}
}
export function trustedClientKey(request,{hosted=true}={}){
 if(!hosted)return 'local-supabase-preview';
 // Hosted Supabase ingress sets this header. Do not fall back to a caller's
 // X-Forwarded-For / X-Real-IP or collapse every user into one shared quota.
 const ip=normalizedIp(request.headers.get('cf-connecting-ip'));
 if(!ip)throw new ApiError(503,'联网入口暂时不可用，请稍后重试；免费试玩仍可进入');
 return 'supabase:'+ip;
}
export function createEdgeHandler({db,now=()=>Date.now(),hosted=true}){
 const api=createRaceApi({db,now,getClientKey:request=>trustedClientKey(request,{hosted})});
 return request=>{
  const url=new URL(request.url);
  // Hosted gateway, local CLI and direct handler tests expose different prefixes.
  url.pathname=url.pathname.replace(/^\/(?:functions\/v1\/)?race-api(?=\/|$)/,'');
  return api(new Request(url,request));
 };
}
