import {loadParkFinish} from './park-finish.js';
import {tuneWinterMaterials,addStreetLightPools} from './winter-materials.js';
import {attachShopSign,addBoulevardDetails} from './boulevard-details.js';
import * as T from 'three';
import {GameAssetLoader as GLTFLoader} from './asset-loader.js';
import {gardenDistricts,gardenPaths,plantingZones,conservatory,inGarden,gardenHeight,segmentPosition,sceneryAllowed,cohesionSurface} from './cohesion-layout.js';
import {attractions} from './park-attractions.js';
import {avenueMaterial} from './avenue-material.js';

import {gardenGroundMaterial,addWalkBorders} from './garden-walks.js';
import {addBoulevardLighting} from './boulevard-lighting.js';
import {attachShopWindows} from './shop-windows.js';
import {loadWisteriaPromenade} from './wisteria-promenade.js';
import {loadWinterTown} from './winter-town.js';
import {boulevardShopRows,boulevardLampStops} from './boulevard-layout.js';
import {archPierProfiles} from './arch-clearance.js';

const groundStep=4;
// Sample the rendered terrain triangles, not the nonlinear height field again.
// The 2 m paving grid otherwise crosses its 4 m ground mesh at slope changes.
function pavedGroundHeight(x,z,d){
 const x0=d.x0+Math.min(Math.floor((x-d.x0)/groundStep),Math.ceil((d.x1-d.x0)/groundStep)-1)*groundStep;
 const z0=d.z0+Math.min(Math.floor((z-d.z0)/groundStep),Math.ceil((d.z1-d.z0)/groundStep)-1)*groundStep;
 const x1=Math.min(x0+groundStep,d.x1),z1=Math.min(z0+groundStep,d.z1);
 const height=(px,pz)=>gardenHeight(...gardenEdgePoint(px,pz,d),d);
 const u=(x-x0)/(x1-x0),v=(z-z0)/(z1-z0),b=height(x1,z0),c=height(x0,z1);
 if(u+v<=1){const a=height(x0,z0);return a+(b-a)*u+(c-a)*v;}
 const e=height(x1,z1);return e+(c-e)*(1-u)+(b-e)*(1-v);
}
function districtGeometry(d,pathOnly=false){
 const step=pathOnly?2:groundStep,positions=[],colors=[],indices=[],map=new Map(),snow=new T.Color(),base=new T.Color('#cbd0cd'),grass=new T.Color('#748b77');
 const vertex=(x,z)=>{const key=x+','+z;if(map.has(key))return map.get(key);[x,z]=gardenEdgePoint(x,z,d);const i=positions.length/3,y=pathOnly?pavedGroundHeight(x,z,d):gardenHeight(x,z,d);positions.push(x,y+(pathOnly?.055:0),z);snow.copy(base).lerp(new T.Color('#a6b5b0'),.08+.045*Math.sin(x*.054)*Math.cos(z*.038));const planting=Math.max(0,...plantingZones.map(([px,pz,rx,rz])=>1-Math.hypot((x-px)/rx,(z-pz)/rz)));snow.lerp(grass,Math.min(.64,planting*1.4));colors.push(snow.r,snow.g,snow.b);map.set(key,i);return i;};
 for(let z=d.z0;z<d.z1;z+=step)for(let x=d.x0;x<d.x1;x+=step){const cx=x+step/2,cz=z+step/2;if(pathOnly&&(!inGarden(cx,cz,d)||!gardenPaths.some(p=>segmentPosition(cx,cz,p).d<p.width/2+(p.shoulder||0))))continue;const a=vertex(x,z),b=vertex(x+step,z),c=vertex(x,z+step),e=vertex(x+step,z+step);indices.push(a,c,b,b,c,e);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
function gardenEdgePoint(x,z,d){x=T.MathUtils.clamp(x,d.x0,d.x1);z=T.MathUtils.clamp(z,d.z0,d.z1);const cx=T.MathUtils.clamp(x,d.x0+d.corner,d.x1-d.corner),cz=T.MathUtils.clamp(z,d.z0+d.corner,d.z1-d.corner),length=Math.hypot(x-cx,z-cz);return length>d.corner?[cx+(x-cx)*d.corner/length,cz+(z-cz)*d.corner/length]:[x,z];}
function gardenSkirt(d){const edge=[],positions=[],indices=[];for(let x=d.x0;x<d.x1;x+=4)edge.push(gardenEdgePoint(x,d.z0,d));for(let z=d.z0;z<d.z1;z+=4)edge.push(gardenEdgePoint(d.x1,z,d));for(let x=d.x1;x>d.x0;x-=4)edge.push(gardenEdgePoint(x,d.z1,d));for(let z=d.z1;z>d.z0;z-=4)edge.push(gardenEdgePoint(d.x0,z,d));for(const [x,z]of edge)positions.push(x,gardenHeight(x,z,d),z,x,-48,z);for(let i=0;i<edge.length;i++){const a=i*2,b=(i+1)%edge.length*2;indices.push(a,b,a+1,b,b+1,a+1);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return g;}
function attachDirections(sign,parent){
 sign.updateWorldMatrix(true,true);
 const short={ferris:'摩天轮',carousel:'旋转木马',teacups:'茶杯舞会',bumper:'碰碰车',swings:'雪花飞椅',pirate:'海盗船',drop:'星钟塔',balloon:'云端热气球',stargaze:'星图台',ringtoss:'月亮套环',ducks:'星溪垂钓',mushrooms:'蘑菇敲敲乐',bowling:'松果保龄'};
 // At a cross street, point to rides actually reached on that street.
 const junction=attractions.filter(a=>a.expansion&&Math.abs(a.anchor.z-sign.position.z)<20);
 const destinations=junction.length?junction:attractions;
 const side=direction=>destinations.filter(a=>Math.sign(a.x-sign.position.x)===direction)
  .sort((a,b)=>Math.hypot(a.x-sign.position.x,a.z-sign.position.z)-Math.hypot(b.x-sign.position.x,b.z-sign.position.z));
 const left=side(-1),right=side(1),directions=[[left[0],-.78,4.5],[right[0],.78,4.5],[left[1],-.78,4.03],[right[1],.78,4.03],[right[2],.78,3.55]];
 const geometry=new T.PlaneGeometry(1.1,.28);
 for(const [ride,x,y]of directions){
  if(!ride)continue;
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#f6e0b0';ctx.font='bold 84px "Songti SC",SimSun,serif';
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.shadowColor='#201a14';ctx.shadowBlur=3;
  ctx.fillText(short[ride.id]||ride.name,256,66,466);
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
  const material=new T.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
  for(const face of [-1,1]){
   const origin=new T.Vector3(sign.position.x+x,sign.position.y+y,sign.position.z+face*5);
   const hit=new T.Raycaster(origin,new T.Vector3(0,0,-face),0,10).intersectObject(sign,true)[0];
   if(!hit)continue;
   const plaque=new T.Mesh(geometry,material);plaque.name='Lettering attached to bronze wayfinder';plaque.userData.ride=ride.id;
   plaque.position.copy(hit.point);plaque.position.z+=face*.018;plaque.rotation.y=face<0?Math.PI:0;
   parent.add(plaque);
  }
 }
}
export function buildCohesionWorld(scene){
 const group=new T.Group();group.name='Winter conservatory common landscape';scene.add(group);
 const groundMat=gardenGroundMaterial(),bronze=new T.MeshStandardMaterial({color:'#695338',roughness:.6,metalness:.48}),stone=new T.MeshStandardMaterial({color:'#a99d88',roughness:.93});
 for(const d of gardenDistricts){const mesh=new T.Mesh(districtGeometry(d),groundMat);mesh.name='Continuous garden ground '+d.id;group.add(mesh);const path=new T.Mesh(districtGeometry(d,true),avenueMaterial());path.name='Shared winter boulevard '+d.id;group.add(path);
  // Close the island edge instead of exposing a paper-thin surface.
  const skirt=new T.Mesh(gardenSkirt(d),stone);skirt.name='Continuous garden escarpment '+d.id;group.add(skirt);
 }
 addWalkBorders(group);
 addBoulevardLighting(group);
 const hall=conservatory,width=hall.maxX-hall.minX,length=hall.maxZ-hall.minZ,cx=(hall.minX+hall.maxX)/2;
 const lower=new T.Mesh(new T.BoxGeometry(width+100,8,length+100),new T.MeshStandardMaterial({color:'#b2b9b8',roughness:.95}));lower.position.set(cx,-52,(hall.minZ+hall.maxZ)/2);lower.name='Continuous winter garden lower landscape';group.add(lower);
 // The perimeter buildings frame an open sky; no full-map glass enclosure.
 for(const d of gardenDistricts){for(const a of attractions){if(inGarden(a.x,a.z,d)){const old=scene.getObjectByName('Lux3D cloud island beneath '+a.id);if(old)old.visible=false;}}}
 // A previous isolated mountain occupied the new connecting boulevard.
 scene.children.filter(o=>o.name==='Lux3D snow-mountain'&&Math.abs(o.position.x-285)<1).forEach(o=>o.position.set(535,-25,535));
 window.__cohesionDebug={terrain:true,buildings:false,districts:gardenDistricts.length,referenceMethod:'Lux3D image-to-3D',solids:0};return group;
}

export async function loadCohesionArchitecture(scene,group,registerSolid){
 const loader=new GLTFLoader(),ids=['portal','column','shopfront','garden','wayfinder','arcade','fir-grove','winter-tree'],templates=new Map(await Promise.all(ids.map(async id=>[id,(await loader.loadAsync(id==='garden'?'/assets/finish/winter-planter.glb':id==='wayfinder'?'/assets/finish/winter-wayfinder.glb':'/assets/cohesion/'+id+'.glb')).scene]))),solids=[];
 for(const id of ['bench','lamp'])templates.set(id,(await loader.loadAsync('/assets/finish/winter-'+id+'.glb')).scene);
 tuneWinterMaterials(templates);
 function model(id,x,y,z,width,height,depth,yaw=0,solid=false){const source=templates.get(id).clone(true),b=new T.Box3().setFromObject(source),s=b.getSize(new T.Vector3()),c=b.getCenter(new T.Vector3());source.position.sub(new T.Vector3(c.x,b.min.y,c.z));const root=new T.Group();root.name='Lux3D winter conservatory '+id;root.add(source);root.scale.set(width/s.x,height/s.y,depth/s.z);root.position.set(x,y,z);root.rotation.y=yaw;group.add(root);if(id==='shopfront'){const row=boulevardShopRows.indexOf(z),kind=z<1000?[1,2,0,0,2,0,2,2,0,0,1,2][row*2+(x>-50?1:0)]:Math.abs(Math.round(x))%3;attachShopWindows(root,{width,height,depth,variant:kind});}if(solid)solids.push({id:'conservatory-'+id,x,z,y,width,depth,height,rotate:yaw});return root;}
 // Perimeter skyline now uses individually grounded winter pavilions.
 // Streets are framed by real generated facades; the clear passage stays 18 m wide.
 for(const [row,z]of boulevardShopRows.entries())for(const side of [-1,1]){const shop=model('shopfront',-50+side*24,31.7,z,38,20,8,-side*Math.PI/2,true);attachShopSign(shop,row,side,group);}
 for(const x of [-210,-175,175,210,245,280])model('shopfront',x,31.7,1064,30,22,9,Math.PI,true);
 let gatePiers;
 for(const z of [725,1010]){
  const gate=model('portal',-50,31.7,z,35,29,4);
  gatePiers??=archPierProfiles(gate);
  for(const pier of gatePiers){
   solids.push({id:'conservatory-gate',x:gate.position.x+pier.x,z:z+pier.z,y:gate.position.y,width:pier.width,depth:pier.depth,height:26});
  }
 }
 // Image-derived arcade bays sit behind the boulevard, separated from racing and rails.
 for(const x of [-255,-215,-175,175,215,255]){const bay=model('arcade',x,31.7,1037,36,29,40,Math.PI/2);bay.updateWorldMatrix(true,true);const floor=new T.Raycaster(new T.Vector3(x,36.7,1037),new T.Vector3(0,-1,0),0,10).intersectObject(bay,true)[0];if(floor)bay.position.y+=31.78-floor.point.y;for(const side of [-1,1])solids.push({id:'arcade-wall',x,z:1037+side*16,y:31.7,width:40,depth:3,height:20});}
 await loadWisteriaPromenade(group,solids);
 await loadWinterTown(group,solids,templates);
 for(let z=700;z<=1000;z+=28)for(const x of [-535,375]){if(sceneryAllowed(x,z,7))model('garden',x,cohesionSurface(x,z)-.1,z,11,1.3,5,Math.PI/2,true);}
 for(const [px,pz,rx,rz]of plantingZones)for(let i=0;i<7;i++){const a=i/7*Math.PI*2,x=px+Math.cos(a)*rx*.72,z=pz+Math.sin(a)*rz*.72;if(sceneryAllowed(x,z,7))model('garden',x,cohesionSurface(x,z)-.1,z,10,1.4,5,-a,true);}
 for(const [x,z]of [[-65,695],[-65,735],[-65,885],[370,1018],[-420,1018]]){const sign=model('wayfinder',x,cohesionSurface(x,z),z,3,5.5,.45,0,true);attachDirections(sign,group);}
 for(const [i,zone]of plantingZones.entries()){const [px,pz,rx,rz]=zone;for(let n=0;n<5;n++){const angle=n*2.399+ i*.7,x=px+Math.cos(angle)*rx*.42,z=pz+Math.sin(angle)*rz*.42;if(!sceneryAllowed(x,z,11))continue;const kind=n%3===0?'winter-tree':'fir-grove',width=kind==='winter-tree'?14:18,h=kind==='winter-tree'?17:18+(i+n)%4;model(kind,x,cohesionSurface(x,z)-.15,z,width,h,width*.8,angle);solids.push({id:'winter-tree-trunk',x,z,y:cohesionSurface(x,z),r:kind==='winter-tree'?.9:2.6,height:5,shadowWidth:width,shadowDepth:width*.8});}}
 for(const z of boulevardLampStops)for(const side of [-1,1]){model('lamp',-50+side*12.2,31.7,z,1.3,7,1.3,0,true);model('bench',-50+side*16.5,31.7,z+9,5,2.2,1.7,-side*Math.PI/2,true);}
 const addedGroves=addBoulevardDetails(model,solids);await loadParkFinish(group,solids);registerSolid(solids);addStreetLightPools(group);window.__cohesionDebug={...window.__cohesionDebug,buildings:true,groves:addedGroves,solids:solids.length,models:group.children.filter(o=>o.name.startsWith('Lux3D')).length};return {solids,group};
}
