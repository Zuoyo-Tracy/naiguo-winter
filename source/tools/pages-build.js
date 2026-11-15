import fs from 'node:fs';import path from 'node:path';
export function pagesAssets(){let out;return {name:'winter-pages-runtime-assets',configResolved(c){out=path.resolve(c.build.outDir);},closeBundle(){
 const root=path.resolve('public'),manifest=JSON.parse(fs.readFileSync('deployment/pages-assets.json','utf8'));let copied=0;
 for(const {url}of manifest.files){if(!/^\/(assets|ui)\/[\w\-/.]+$/.test(url)||url.includes('..')||!(['.glb','.png','.webp','.jpg','.json'].includes(path.extname(url))||/^\/assets\/transit\/[\w-]+\.glb\.gz$/.test(url)))throw Error('Unexpected public artifact '+url);const from=path.resolve(root,'.'+url),to=path.resolve(out,'.'+url);if(!from.startsWith(root+path.sep)||!to.startsWith(out+path.sep))throw Error('Escaping asset path');fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,to);copied+=fs.statSync(to).size;}
 if(copied>950*1024*1024)throw Error('Published site exceeds the 950 MiB deployment budget');fs.writeFileSync(path.join(out,'.nojekyll'),'');
 fs.writeFileSync(path.join(out,'README.md'),'# 奶国之冬：奶家人集合！\n\n[点击进入网页游戏](https://zuoyo-tracy.github.io/naiguo-winter/?scene=grand-palace&trial=1)\n\n点击“免登录试玩全部节点”进入。WASD 驾驶，拖曳环视，M 打开藏宝图；可自动漫游、乘坐游乐设施、解救奶鼠、收集奶蛙图鉴。\n\n此仓库托管浏览器试玩发布包，所有节点开放。进度保存在当前浏览器，账号注册服务不在 GitHub Pages 上运行。手机首次默认使用轻快画质，主路就绪后即可游览，其余区域继续加载。可在地图的游园偏好中切换均衡或精细画质。建议使用稳定网络。\n\n建模源文件、账号数据库、服务凭据与内部报告不包含在发布包中。\n');
 fs.writeFileSync(path.join(out,'THIRD_PARTY_NOTICES.txt'),['This game includes the following open-source libraries. These licenses apply to the libraries, not to the game artwork.','Three.js\n'+fs.readFileSync('node_modules/three/LICENSE','utf8'),'three-mesh-bvh\n'+fs.readFileSync('node_modules/three-mesh-bvh/LICENSE','utf8'),'fflate 0.8.2\n'+fs.readFileSync('tools/licenses/fflate-MIT.txt','utf8')].join('\n\n--------------------\n\n'));
 console.log(`GitHub Pages: copied ${manifest.files.length} runtime files (${(copied/1048576).toFixed(1)} MiB).`);
 }};}


