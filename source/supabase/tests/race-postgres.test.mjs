import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {createPostgresAdapter,compileQuery,normalizeRow} from '../functions/_shared/postgres-adapter.mjs';
import {createEdgeHandler,trustedClientKey} from '../functions/_shared/edge-handler.mjs';
const engine=process.env.PGLITE_MODULE?pathToFileURL(process.env.PGLITE_MODULE):new URL('../../.private/supabase-tests/node_modules/@electric-sql/pglite/dist/index.js',import.meta.url);
const {PGlite}=await import(engine.href);

async function setup(){
 const pg=new PGlite();
 await pg.exec('CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;');
 const folder=new URL('../migrations/',import.meta.url);
 for(const file of (await readdir(folder)).filter(name=>name.endsWith('.sql')).sort())await pg.exec(await readFile(new URL(file,folder),'utf8'));
 await pg.exec('SET ROLE service_role');
 let time=1700000000000;
 const db=createPostgresAdapter(async(sql,args)=>(await pg.query(sql,args)).rows);
 const handler=createEdgeHandler({db,now:()=>time,hosted:true});
 async function call(path,{token,data,origin='https://zuoyo-tracy.github.io',ip='203.0.113.6',method=data?'POST':'GET',prefix='/functions/v1/race-api/api/'}={}){
  const response=await handler(new Request('https://scores.example'+prefix+path,{
   method,headers:{Origin:origin,'Content-Type':'application/json',...(ip?{'CF-Connecting-IP':ip}:{}),...(token?{Authorization:'Bearer '+token}:{})},
   ...(data?{body:JSON.stringify(data)}:{}),
  }));
  return {status:response.status,headers:response.headers,body:response.status===204?null:await response.json()};
 }
 async function register(name){
  const result=await call('account/register',{data:{name,password:'test-only-credentials',confirm:'test-only-credentials'}});
  assert.equal(result.status,201);return result.body;
 }
 return {pg,db,call,register,advance:ms=>time+=ms};
}

test('Postgres API: password accounts, cross-session history, best rankings, retries and logout',async()=>{
 const f=await setup();try{
  assert.equal((await f.call('account/register',{data:{name:'racer_a',password:'test-only-credentials',confirm:'other'}})).status,400);
  const a=await f.register('RACER_A'),b=await f.register('racer_b');
  assert.equal(a.user.name,'racer_a');
  const stored=(await f.pg.query('SELECT * FROM race_private.race_users WHERE name=$1',['racer_a'])).rows[0];
  assert.equal(stored.password_hash.length,64);assert.notEqual(stored.password_hash,'test-only-credentials');
  assert.equal((await f.call('account/register',{data:{name:'racer_a',password:'test-only-credentials',confirm:'test-only-credentials'}})).status,409);
  assert.equal((await f.call('account/login',{data:{name:'racer_a',password:'wrong-password'}})).status,401);
  const login=await f.call('account/login',{data:{name:'racer_a',password:'test-only-credentials'},prefix:'/race-api/api/'});
  assert.equal(login.status,200);assert.notEqual(login.body.token,a.token);
  assert.equal((await f.call('account/me',{token:login.body.token,prefix:'/api/'})).body.user.name,'racer_a');
  assert.equal((await f.call('races/history')).status,401);
  assert.equal((await f.call('races/start',{data:{from:0,to:1}})).status,401);
  const start=await f.call('races/start',{token:a.token,data:{from:0,to:1}});
  const payload={runId:start.body.runId,status:'finished',elapsedMs:30000,distance:2150,hits:1};
  f.advance(90000); // A paused client is legitimate.
  assert.equal((await f.call('races/finish',{token:b.token,data:payload})).status,404);
  const ends=await Promise.all([f.call('races/finish',{token:a.token,data:payload}),f.call('races/finish',{token:a.token,data:payload})]);
  assert.ok(ends.every(r=>r.status===200&&r.body.row.elapsedMs===30000));
  const retry=await f.call('races/finish',{token:a.token,data:{...payload,elapsedMs:1}});
  assert.equal(retry.body.duplicate,true);assert.equal(retry.body.row.elapsedMs,30000);
  for(const [token,elapsedMs,status]of [[a.token,40000,'finished'],[b.token,20000,'finished'],[a.token,5000,'abandoned']]){
   const s=await f.call('races/start',{token,data:{from:0,to:1}});f.advance(60000);
   assert.equal((await f.call('races/finish',{token,data:{...payload,runId:s.body.runId,elapsedMs,status}})).status,200);
  }
  const board=await f.call('races/leaderboard?from=0&to=1');
  assert.equal(board.status,200);
  assert.deepEqual(board.body.rows.map(r=>[r.rank,r.name,r.elapsedMs]),[[1,'racer_b',20000],[2,'racer_a',30000]]);
  assert.equal(typeof board.body.rows[0].rank,'number');assert.ok(!Number.isNaN(Date.parse(board.body.rows[0].createdAt)));
  const history=await f.call('races/history',{token:login.body.token});
  assert.equal(history.body.rows.length,3);assert.equal(history.body.rows[0].status,'abandoned');
  assert.ok(history.body.rows.every(r=>r.name==='racer_a'));
  await f.call('account/logout',{token:a.token,data:{}});
  assert.equal((await f.call('account/me',{token:a.token})).body.user,null);
  assert.equal((await f.call('account/me',{token:login.body.token})).body.user.name,'racer_a');
  f.advance(8*86400000);assert.equal((await f.call('account/me',{token:login.body.token})).body.user,null);
 }finally{await f.pg.close();}
});

test('private schema, grants and RLS deny all browser roles while server role can operate',async()=>{
 const f=await setup();try{
  await f.register('rls_player');
  await f.pg.exec('RESET ROLE');
  const tables=['race_users','race_sessions','race_limits','race_runs'];
  const security=(await f.pg.query("SELECT c.relname,c.relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='race_private' AND c.relkind='r'")).rows;
  assert.equal(security.length,4);assert.ok(security.every(row=>row.relrowsecurity));
  for(const role of ['anon','authenticated']){
   const grants=(await f.pg.query("SELECT has_schema_privilege($1,'race_private','USAGE') AS allowed",[role])).rows[0];
   assert.equal(grants.allowed,false);
   for(const table of tables){
    const priv=(await f.pg.query('SELECT has_table_privilege($1,$2,$3) AS allowed',[role,'race_private.'+table,'SELECT,INSERT,UPDATE,DELETE'])).rows[0];
    assert.equal(priv.allowed,false);
   }
   await f.pg.exec('SET ROLE '+role);
   for(const table of tables){
    for(const sql of ['SELECT * FROM '+table,'INSERT INTO '+table+' DEFAULT VALUES','UPDATE '+table+' SET '+(table==='race_users'?'name=name':table==='race_sessions'?'user_name=user_name':table==='race_limits'?'count=count':'status=status'),'DELETE FROM '+table]){
     const qualified=sql.replaceAll(table,'race_private.'+table);
     await assert.rejects(()=>f.pg.query(qualified),error=>error.code==='42501');
    }
   }
   await f.pg.exec('RESET ROLE');
  }
  // Even if an operator accidentally added read grants later, RLS still denies rows.
  await f.pg.exec('BEGIN; GRANT USAGE ON SCHEMA race_private TO anon; GRANT SELECT ON race_private.race_users TO anon; SET LOCAL ROLE anon;');
  assert.equal((await f.pg.query('SELECT * FROM race_private.race_users')).rows.length,0);
  await f.pg.exec('ROLLBACK');
 }finally{await f.pg.close();}
});

test('gateway paths, CORS and persisted per-client throttling remain compatible',async()=>{
 const f=await setup();try{
  for(const prefix of ['/functions/v1/race-api/api/','/race-api/api/','/api/'])assert.equal((await f.call('health',{prefix,ip:null})).body.ok,true);
  const options=await f.call('account/login',{method:'OPTIONS',ip:null});assert.equal(options.status,204);
  assert.equal(options.headers.get('access-control-allow-origin'),'https://zuoyo-tracy.github.io');
  assert.equal((await f.call('races/leaderboard?from=0&to=1',{origin:'https://unrelated.invalid'})).status,403);
  assert.equal((await f.call('races/leaderboard?from=0&to=1',{ip:null})).status,503);
  assert.equal((await f.call('races/leaderboard?from=0&to=1',{ip:'203.0.113.5, 1.1.1.1'})).status,503);
  for(let i=0;i<15;i++)assert.equal((await f.call('account/login',{data:{name:'missing',password:'test-only-credentials'}})).status,401);
  assert.equal((await f.call('account/login',{data:{name:'missing',password:'test-only-credentials'}})).status,429);
  assert.equal((await f.call('account/login',{data:{name:'missing',password:'test-only-credentials'},ip:'203.0.113.7'})).status,401);
  const rows=(await f.pg.query('SELECT key,count FROM race_private.race_limits')).rows;
  assert.ok(rows.length>2);assert.ok(rows.every(row=>!row.key.includes('203.0.113')));
  f.advance(61000);assert.equal((await f.call('account/login',{data:{name:'missing',password:'test-only-credentials'}})).status,401);
 }finally{await f.pg.close();}
});

test('invalid/forged/expired attempts do not reach Postgres rankings',async()=>{
 const f=await setup();try{
  const player=await f.register('validation_player');const token=player.token;
  assert.equal((await f.call('races/start',{token,data:{from:0,to:0}})).status,400);
  const start=await f.call('races/start',{token,data:{from:2,to:0}});
  const data={runId:start.body.runId,status:'finished',elapsedMs:30000,distance:3970,hits:0};
  assert.equal((await f.call('races/finish',{token,data})).status,400);
  f.advance(60000);
  assert.equal((await f.call('races/finish',{token,data:{...data,elapsedMs:1}})).status,400);
  assert.equal((await f.call('races/finish',{token,data:{...data,distance:-1}})).status,400);
  f.advance(86400001);
  assert.equal((await f.call('races/finish',{token,data})).status,410);
  assert.equal((await f.call('races/leaderboard?from=2&to=0')).body.rows.length,0);
 }finally{await f.pg.close();}
});

test('SQL adapter binds values, normalizes bigint and serializes concurrent driver work',async()=>{
 const query=compileQuery("SELECT '?' AS literal, name FROM race_users WHERE name=? -- ?\n");
 assert.equal(query.count,1);assert.match(query.text,/FROM race_private\.race_users WHERE name=\$1/);
 assert.equal(normalizeRow({started_at:'1700000000000',place:2n}).started_at,1700000000000);
 assert.equal(normalizeRow({place:2n}).place,2);
 assert.throws(()=>normalizeRow({created_at:'9007199254740992'}));
 let active=0,maxActive=0;const parameters=[];
 const adapter=createPostgresAdapter(async(sql,args)=>{active++;maxActive=Math.max(maxActive,active);parameters.push(args);await new Promise(resolve=>setTimeout(resolve,5));active--;return [];});
 const malicious="x'; DROP TABLE race_users; --";
 await Promise.all([adapter.prepare('SELECT * FROM race_users WHERE name=?').bind(malicious).all(),adapter.prepare('SELECT * FROM race_users WHERE name=?').bind('b').first()]);
 assert.equal(maxActive,1);assert.equal(parameters[0][0],malicious);
 assert.throws(()=>adapter.prepare('SELECT ?').bind());
 assert.throws(()=>trustedClientKey(new Request('https://x',{headers:{'x-forwarded-for':'203.0.113.5'}})),/联网入口/);
 assert.equal(trustedClientKey(new Request('https://x',{headers:{'cf-connecting-ip':'2001:0db8::1'}})),'supabase:2001:db8::1');
});
