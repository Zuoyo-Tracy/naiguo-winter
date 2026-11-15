import {defineConfig} from 'vite';import {accountApi} from './server/accounts.js';import {pagesAssets} from './tools/pages-build.js';
export default defineConfig(({mode})=>{
 const pages=mode==='github';let api;const accounts=()=>api??=accountApi();
 return {base:pages?'/naiguo-winter/':'/',publicDir:pages?false:'public',build:{outDir:pages?'dist-github':'dist'},define:{'import.meta.env.PUBLIC_TRIAL':JSON.stringify(pages)},server:{fs:{deny:['**/.private/**','**/.env*','**/.git/**']}},plugins:pages?[pagesAssets()]:[{name:'winter-accounts',configureServer(server){server.middlewares.use(accounts());},configurePreviewServer(server){server.middlewares.use(accounts());}}]};
});

