const tables=new Set(['race_users','race_sessions','race_runs','race_limits']);
const numeric=new Set(['created_at','expires_at','window_start','count','from_station','to_station','route_distance','started_at','finished_at','elapsed_ms','distance','hits','personal_rank','place']);

// Only our fixed, developer-owned SQL enters this compiler. Values always stay
// in the separate parameter array; never interpolate account names or tokens.
export function compileQuery(sql){
 let count=0;
 const text=sql.replace(/'(?:''|[^'])*'|"(?:""|[^"])*"|--[^\n]*|\/\*[\s\S]*?\*\/|\?|\b[a-zA-Z_][a-zA-Z_0-9]*\b/g,(token,offset)=>{
  if(token==='?')return '$'+(++count);
  if(tables.has(token)&&sql.slice(offset+token.length).trimStart()[0]!=='.')return 'race_private.'+token;
  return token;
 });
 return {text,count};
}
export function normalizeRow(row){
 return Object.fromEntries(Object.entries(row).map(([key,value])=>{
  if(value!==null&&numeric.has(key)){
   const number=Number(value);
   if(!Number.isSafeInteger(number))throw new Error('Database number is outside the safe integer range');
   return [key,number];
  }
  return [key,value];
 }));
}
export function createPostgresAdapter(execute){
 // A single queue per warm function instance prevents postgres.js pipelining
 // through transaction-mode poolers. Failure does not poison the next request.
 let tail=Promise.resolve();
 function query(text,args){
  const result=tail.then(()=>execute(text,args));
  tail=result.then(()=>undefined,()=>undefined);
  return result.then(rows=>Array.from(rows,normalizeRow));
 }
 return {prepare(sql){
  const compiled=compileQuery(sql);
  return {bind(...args){
   if(compiled.count!==args.length)throw new Error('Wrong SQL parameter count');
   const executeBound=()=>query(compiled.text,args);
   return {
    first:async()=>(await executeBound())[0]??null,
    all:async()=>({results:await executeBound()}),
    run:async()=>{await executeBound();return {success:true};},
   };
  }};
 }};
}
