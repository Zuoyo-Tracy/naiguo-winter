import * as T from 'three';
import {cohesionSurface,sceneryAllowed} from './cohesion-layout.js';
import {walkPlantingPlan} from './garden-walks.js';
import {boulevardShopRows} from './boulevard-layout.js';

const shopNames=[['酥酥的烤炉','咔咔照相馆'],['书签旧书铺','远山旅行社'],['小问修理铺','绒绒织物店'],['哈哈笑声铺','比比纪念章'],['阿迎会客厅','雪夜明信片'],['奶家人茶室','星月玻璃坊']];
export function attachShopSign(shop,row,side,parent){
 const canvas=document.createElement('canvas');canvas.width=768;canvas.height=128;const ctx=canvas.getContext('2d');
 ctx.fillStyle='#29493e';ctx.fillRect(0,0,768,128);ctx.strokeStyle='#bda46d';ctx.lineWidth=3;ctx.strokeRect(8,8,752,112);ctx.strokeRect(15,15,738,98);
 ctx.fillStyle='#eddbb4';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='600 59px "Songti SC",SimSun,serif';ctx.fillText(shopNames[row][side<0?0:1],384,66);
 shop.updateWorldMatrix(true,true);const origin=new T.Vector3(-50,shop.position.y+10.1,shop.position.z),hit=new T.Raycaster(origin,new T.Vector3(side,0,0),0,40).intersectObject(shop,true)[0];if(!hit)return;
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;
 const sign=new T.Mesh(new T.BoxGeometry(11.5,1.92,.12),new T.MeshStandardMaterial({color:'#5b4831',roughness:.8}));sign.name='Physical winter shop sign '+shopNames[row][side<0?0:1];sign.position.copy(hit.point);sign.position.x-=side*.09;sign.rotation.y=-side*Math.PI/2;parent.add(sign);
 const face=new T.Mesh(new T.PlaneGeometry(11.3,1.72),new T.MeshBasicMaterial({map:texture}));face.position.z=.061;sign.add(face);
}
function separationFromSolid(x,z,s){const c=Math.cos(s.rotate||0),v=Math.sin(s.rotate||0),dx=x-s.x,dz=z-s.z;
 return Math.hypot(Math.max(0,Math.abs(dx*c-dz*v)-(s.r||s.width/2)),Math.max(0,Math.abs(dx*v+dz*c)-(s.r||s.depth/2)));
}
// Deterministic sparse groves, with full canopy clearance from every path and prop.
export function boulevardGroves(solids){
 const candidates=[];let seed=217;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
 for(let z=706;z<=1006;z+=24)for(let x=-544;x<=352;x+=24){
  const px=x+(random()-.5)*7,pz=z+(random()-.5)*7,width=9+random()*4;
  if(!sceneryAllowed(px,pz,width/2+2)||solids.some(s=>separationFromSolid(px,pz,s)<width/2+4))continue;
  candidates.push({x:px,z:pz,width,height:10+random()*7,yaw:random()*Math.PI*2,rank:random()});
 }
 candidates.sort((a,b)=>a.rank-b.rank);return candidates.slice(0,72);
}
export function addBoulevardDetails(model,solids){
 for(const p of walkPlantingPlan()){
  if(solids.some(s=>separationFromSolid(p.x,p.z,s)<p.r+1))continue;
  model(p.id,p.x,p.y-.08,p.z,p.width,p.height,p.depth,p.yaw);
  solids.push({id:'walk-'+p.id,x:p.x,z:p.z,y:p.y,r:p.id==='garden'?1.6:.75,height:p.id==='garden'?1.1:5,shadowWidth:p.width,shadowDepth:p.depth});
 }
 // Flower boxes sit against the generated shopfronts, leaving the central walk clear.
 for(const z of boulevardShopRows)for(const side of [-1,1])for(const offset of [-13,14])model('garden',-50+side*18.4,31.72,z+offset,5.6,1.2,1.65,Math.PI/2,true);
 const groves=boulevardGroves(solids);
 for(const [i,p]of groves.entries()){
  const y=cohesionSurface(p.x,p.z),kind=i%5===0?'winter-tree':'fir-grove';model(kind,p.x,y-.12,p.z,p.width,p.height,p.width*.8,p.yaw);
  solids.push({id:'winter-grove-trunk',x:p.x,z:p.z,y,r:kind==='winter-tree'?.65:1.4,height:5,shadowWidth:p.width,shadowDepth:p.width*.8});
 }
 return groves.length;
}
