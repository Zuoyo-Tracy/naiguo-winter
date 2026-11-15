// online-service/lib is the source of truth for both hosting adapters.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const target=new URL('supabase/functions/_shared/core/',root);
const check=process.argv.includes('--check');
if(!check)await mkdir(target,{recursive:true});
for(const name of ['race-api.mjs','race-rules.mjs']){
 const expected=await readFile(new URL('online-service/lib/'+name,root),'utf8');
 if(check){
  let actual;try{actual=await readFile(new URL(name,target),'utf8');}catch{}
  if(actual!==expected)throw new Error('Supabase core differs: '+name+'. Run node tools/sync-race-backend.mjs');
 }else await writeFile(new URL(name,target),expected,'utf8');
}
console.log(check?'Race backend core is synchronized.':'Race backend core synchronized.');
