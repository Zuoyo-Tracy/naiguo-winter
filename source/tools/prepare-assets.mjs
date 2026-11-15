import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'deployment/pages-assets.json'),'utf8'));
const local=path.resolve(root,'..');
const origin='https://zuoyo-tracy.github.io/naiguo-winter/';
let next=0,done=0;
async function worker(){while(next<manifest.files.length){const {url}=manifest.files[next++];
if(!/^\/(assets|ui)\/[\w\-/.]+$/.test(url)||url.includes('..'))throw Error('Unsafe asset path');
const rel=url.slice(1),dest=path.join(root,'public',rel),near=path.join(local,rel);
if(!fs.existsSync(dest)){fs.mkdirSync(path.dirname(dest),{recursive:true});
if(fs.existsSync(near))fs.copyFileSync(near,dest);else {let ok=false;for(let i=0;i<3;i++){try{const r=await fetch(new URL(rel,origin));if(!r.ok)throw Error(String(r.status));fs.writeFileSync(dest,Buffer.from(await r.arrayBuffer()));ok=true;break;}catch(e){if(i===2)throw Error('Asset download failed: '+rel);}}}}
if(++done%40===0)console.log(done+'/'+manifest.files.length+' assets ready');}}
await Promise.all(Array.from({length:4},worker));
console.log('Runtime assets ready. Run npm run dev.');
