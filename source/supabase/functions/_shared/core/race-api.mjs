import {ApiError,randomToken,digest,passwordHash,equalHash,routeInfo,validateCredentials,validateFinish,publicRun} from './race-rules.mjs';
const allowed=new Set(['https://zuoyo-tracy.github.io','http://127.0.0.1:5173','http://localhost:5173']);
async function readBody(request){if(Number(request.headers.get('content-length')||0)>8192)throw new ApiError(413,'请求内容过长');const reader=request.body?.getReader();if(!reader)return {};let length=0,text='',decoder=new TextDecoder();try{while(true){const {value,done}=await reader.read();if(done)break;length+=value.byteLength;if(length>8192){await reader.cancel();throw new ApiError(413,'请求内容过长');}text+=decoder.decode(value,{stream:true});}text+=decoder.decode();const data=JSON.parse(text);if(!data||typeof data!=='object'||Array.isArray(data))throw Error();return data;}catch(e){if(e instanceof ApiError)throw e;throw new ApiError(400,'请求格式不正确');}}
export function createRaceApi({db,now=()=>Date.now(),getClientKey=request=>request.headers.get('cf-connecting-ip')||'local-preview'}){
 const get=(sql,...args)=>db.prepare(sql).bind(...args).first();
 const run=(sql,...args)=>db.prepare(sql).bind(...args).run();
 const all=async(sql,...args)=>(await db.prepare(sql).bind(...args).all()).results;
 async function rate(key,windowMs,max){const time=now(),windowStart=Math.floor(time/windowMs)*windowMs;const row=await get('INSERT INTO race_limits (key,window_start,count) VALUES (?,?,1) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN race_limits.window_start=excluded.window_start THEN race_limits.count+1 ELSE 1 END,window_start=excluded.window_start RETURNING count',key,windowStart);if(row.count>max)throw new ApiError(429,'请求过于频繁，请稍后再试');}
 async function identity(request){const token=request.headers.get('authorization')?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];if(!token)return null;const tokenHash=await digest(token);const row=await get('SELECT user_name FROM race_sessions WHERE token_hash=? AND expires_at>?',tokenHash,now());return row?{name:row.user_name,tokenHash}:null;}
 async function login(user){const token=randomToken(),hash=await digest(token);await run('INSERT INTO race_sessions (token_hash,user_name,expires_at) VALUES (?,?,?)',hash,user.name,now()+7*86400000);await run('DELETE FROM race_sessions WHERE token_hash IN (SELECT token_hash FROM race_sessions WHERE expires_at<? LIMIT 100)',now());return {user:{name:user.name,role:'player'},token};}
 return async request=>{
  const url=new URL(request.url),origin=request.headers.get('origin'),cors=origin&&(allowed.has(origin)||origin===url.origin)?origin:null;
  const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Vary':'Origin','X-Content-Type-Options':'nosniff',...(cors?{'Access-Control-Allow-Origin':cors,'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type, Authorization','Access-Control-Max-Age':'600'}:{})};
  const send=(status,body)=>new Response(status===204?null:JSON.stringify(body),{status,headers});
  try{
   if(origin&&!cors)throw new ApiError(403,'请求来源不正确');
   if(request.method==='OPTIONS')return send(204,null);
   const path=url.pathname.replace(/\/$/,'');
   if(request.method==='GET'&&path==='/api/health')return send(200,{ok:true,service:'奶国之冬 · 联网赛车',version:1});
   const ip=await digest(await getClientKey(request));
   await rate('api:'+ip,60000,180);
   if(path==='/api/account/login'||path==='/api/account/register'){
    if(request.method!=='POST')throw new ApiError(405,'请使用 POST 请求');
    await rate('auth:'+ip,60000,15);const data=await readBody(request),register=path.endsWith('register'),value=validateCredentials(data,register);await rate('auth-account:'+value.name,60000,20);
    if(register){await rate('register:'+ip,3600000,8);const salt=randomToken();const hash=await passwordHash(value.password,salt);try{await run('INSERT INTO race_users (name,salt,password_hash,created_at) VALUES (?,?,?,?)',value.name,salt,hash,now());}catch(error){if(await get('SELECT name FROM race_users WHERE name=?',value.name))throw new ApiError(409,'这个账号已被注册');throw error;}return send(201,await login(value));}
    const user=await get('SELECT name,salt,password_hash FROM race_users WHERE name=?',value.name);const hash=await passwordHash(value.password,user?.salt||'0'.repeat(64));if(!user||!equalHash(hash,user.password_hash))throw new ApiError(401,'账号或密码不正确');return send(200,await login(user));
   }
   if(request.method==='GET'&&path==='/api/races/leaderboard'){
    const route=routeInfo(Number(url.searchParams.get('from')??0),Number(url.searchParams.get('to')??1));
    const rows=await all("WITH personal AS (SELECT *,ROW_NUMBER() OVER (PARTITION BY user_name ORDER BY elapsed_ms,finished_at,id) AS personal_rank FROM race_runs WHERE from_station=? AND to_station=? AND status='finished'),ranked AS (SELECT *,DENSE_RANK() OVER (ORDER BY elapsed_ms) AS place FROM personal WHERE personal_rank=1) SELECT * FROM ranked ORDER BY elapsed_ms,finished_at,user_name LIMIT 50",route.from,route.to);
    return send(200,{rows:rows.map(row=>({...publicRun(row),rank:row.place})),from:route.from,to:route.to});
   }
   const user=await identity(request);
   if(request.method==='GET'&&path==='/api/account/me')return send(200,{user:user?{name:user.name,role:'player'}:null});
   if(path==='/api/account/logout'&&request.method==='POST'){if(user)await run('DELETE FROM race_sessions WHERE token_hash=?',user.tokenHash);return send(200,{ok:true});}
   if(!user)throw new ApiError(401,'请先登录；免费试玩仍可正常游玩');
   if(request.method==='GET'&&path==='/api/races/history'){const rows=await all('SELECT * FROM race_runs WHERE user_name=? AND finished_at IS NOT NULL ORDER BY finished_at DESC,id DESC LIMIT 100',user.name);return send(200,{rows:rows.map(publicRun)});}
   if(request.method!=='POST')throw new ApiError(405,'不支持的请求方法');
   const data=await readBody(request);
   if(path==='/api/races/start'){await rate('start:'+user.name,60000,12);const route=routeInfo(data.from,data.to),id=crypto.randomUUID();await run('INSERT INTO race_runs (id,user_name,from_station,to_station,route_distance,started_at,status) VALUES (?,?,?,?,?,?,?)',id,user.name,route.from,route.to,route.distance,now(),'running');return send(201,{runId:id});}
   if(path==='/api/races/finish'){
    if(typeof data.runId!=='string'||data.runId.length>64)throw new ApiError(400,'比赛编号无效');const race=await get('SELECT * FROM race_runs WHERE id=? AND user_name=?',data.runId,user.name);if(!race)throw new ApiError(404,'没有找到这场比赛');
    if(race.status!=='running')return send(200,{row:publicRun(race),duplicate:true});
    const value=validateFinish(data,race,now());await run("UPDATE race_runs SET finished_at=?,elapsed_ms=?,distance=?,hits=?,status=? WHERE id=? AND user_name=? AND status='running'",now(),value.elapsedMs,value.distance,value.hits,value.status,race.id,user.name);
    return send(200,{row:publicRun(await get('SELECT * FROM race_runs WHERE id=? AND user_name=?',race.id,user.name))});
   }
   throw new ApiError(404,'接口不存在');
  }catch(error){return send(error instanceof ApiError?error.status:503,{error:error instanceof ApiError?error.message:'联网服务暂时不可用，请稍后重试；免费试玩仍可进入'});}
 };
}
