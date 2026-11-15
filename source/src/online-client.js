import {ACCOUNT_API_ORIGIN} from './online-config.js';
const key='winter-online-session-v1';let token;try{token=sessionStorage.getItem(key)||'';}catch{token='';}
export function clearOnlineSession(){token='';try{sessionStorage.removeItem(key);}catch{}}
export async function accountApi(path,data){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
 try{const response=await fetch(ACCOUNT_API_ORIGIN+path,{method:data===undefined?'GET':'POST',headers:{...(data===undefined?{}:{'Content-Type':'application/json'}),...(token?{Authorization:'Bearer '+token}:{})},body:data===undefined?undefined:JSON.stringify(data),signal:controller.signal,credentials:'omit',cache:'no-store'});let body;try{body=await response.json();}catch{throw Error('联网服务暂时不可用，请稍后重试；也可以先免费试玩。');}if(!response.ok){if(response.status===401)clearOnlineSession();throw Error(body.error||'请求失败，请重试');}if(body.token){token=body.token;try{sessionStorage.setItem(key,token);}catch{}}return body;
 }catch(error){if(error.name==='AbortError')throw Error('联网服务响应较慢，请重试；免费试玩不受影响。');if(error instanceof TypeError)throw Error('暂时连接不到账号服务，请检查网络，或先免费试玩。');throw error;}finally{clearTimeout(timer);}
}
