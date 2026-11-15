import postgres from 'postgres';
import {createPostgresAdapter} from '../_shared/postgres-adapter.mjs';
import {createEdgeHandler} from '../_shared/edge-handler.mjs';

// All credentials are read only inside the Edge Function. Never send this URL
// or a Supabase secret/service-role key to the GitHub Pages client.
const connectionString=Deno.env.get('RACE_DATABASE_URL')??Deno.env.get('SUPABASE_DB_URL');
const hosted=Boolean(Deno.env.get('DENO_DEPLOYMENT_ID')||Deno.env.get('SB_REGION'));
let execute: ((text:string,args:unknown[])=>Promise<unknown[]>)|undefined;
if(connectionString){
 const sql=postgres(connectionString,{
  max:1,
  prepare:false,
  ssl:hosted?'require':false,
  idle_timeout:20,
  connect_timeout:10,
  max_lifetime:300,
  onnotice:()=>{},
 });
 execute=async(text,args)=>await sql.unsafe(text,args as never[]);
}
const db=createPostgresAdapter((text:string,args:unknown[])=>{
 if(!execute)throw new Error('Database connection is not configured');
 return execute(text,args);
});
Deno.serve(createEdgeHandler({db,hosted}));
