import {randomBytes,scryptSync,timingSafeEqual} from 'node:crypto';
import {existsSync,readFileSync,writeFileSync,mkdirSync,renameSync} from 'node:fs';
import {resolve} from 'node:path';
export function accountApi(dir=resolve('.private')){
 mkdirSync(dir,{recursive:true});const file=resolve(dir,'accounts.json');
 let users=existsSync(file)?JSON.parse(readFileSync(file,'utf8')):[];const sessions=new Map(),attempts=new Map();
 const persist=()=>{writeFileSync(file+'.tmp',JSON.stringify(users),{mode:0o600});renameSync(file+'.tmp',file);};
 const credential=password=>{const salt=randomBytes(16).toString('hex');return {salt,hash:scryptSync(password,salt,64).toString('hex')};};
 if(!users.some(u=>u.role==='tester')){const password='Winter-'+randomBytes(9).toString('base64url');users.push({name:'winter_tester',role:'tester',...credential(password)});persist();writeFileSync(resolve(dir,'tester-account.txt'),`账号：winter_tester\n密码：${password}\n`,{mode:0o600});}
 return async(req,res,next)=>{
 if(decodeURIComponent(req.url||'').includes('.private')){res.statusCode=403;res.end();return;}if(!req.url?.startsWith('/api/account/'))return next();
 const send=(status,data)=>{res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(data));};
 const token=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('winter_session='))?.slice(15);
 const session=sessions.get(token),user=session&&session.expires>Date.now()?users.find(u=>u.name===session.name):null;
 const publicUser=u=>u?{name:u.name,role:u.role}:null;
 if(req.method==='GET'&&req.url==='/api/account/me')return send(200,{user:publicUser(user)});
 if(req.method!=='POST')return send(405,{error:'不支持的请求'});
 if(req.headers.origin&&req.headers.origin!==`http://${req.headers.host}`&&req.headers.origin!==`https://${req.headers.host}`)return send(403,{error:'请求来源不正确'});
 if(req.url==='/api/account/logout'){sessions.delete(token);res.setHeader('Set-Cookie','winter_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');return send(200,{ok:true});}
 const ip=req.socket.remoteAddress,rate=attempts.get(ip);if(rate&&rate.until>Date.now()&&rate.count>=30)return send(429,{error:'尝试过于频繁，请一分钟后再试'});
 attempts.set(ip,rate&&rate.until>Date.now()?{...rate,count:rate.count+1}:{count:1,until:Date.now()+60000});
 try{let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>4096)return send(413,{error:'输入过长'});}const data=JSON.parse(raw),name=String(data.name||'').trim().toLowerCase(),password=data.password;
 if(!/^[a-z0-9_]{3,24}$/.test(name)||typeof password!=='string'||password.length<8||password.length>128)return send(400,{error:'账号需为 3–24 位字母、数字或下划线；密码需为 8–128 位'});
 let u=users.find(u=>u.name===name);
 if(req.url==='/api/account/register'){
 if(data.confirm!==password)return send(400,{error:'两次输入的密码不一致'});if(u)return send(409,{error:'这个账号已被注册'});
 u={name,role:'player',...credential(password)};users.push(u);persist();
 }else if(req.url==='/api/account/login'){
 const hash=scryptSync(password,u?.salt||'dummy-salt',64);if(!u||!timingSafeEqual(hash,Buffer.from(u.hash,'hex')))return send(401,{error:'账号或密码不正确'});
 }else return send(404,{error:'接口不存在'});
 const id=randomBytes(32).toString('hex');sessions.delete(token);sessions.set(id,{name:u.name,expires:Date.now()+86400000});res.setHeader('Set-Cookie',`winter_session=${id}; HttpOnly; SameSite=Strict; Path=/; Max-Age=86400${req.socket.encrypted?'; Secure':''}`);send(200,{user:publicUser(u)});
 }catch{send(400,{error:'请求无法处理，请稍后重试'});}
 };
}

