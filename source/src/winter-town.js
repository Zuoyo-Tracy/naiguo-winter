import * as T from 'three';
import {GameAssetLoader} from './asset-loader.js';
import {railClearanceSamples} from './train-rules.js';
import {projectTrack} from './track.js';

// Skyline sites sit outside the race, railway, amusement parks and ski slope.
// The smaller front pavilions and taller rear landmarks break up repetition.
export const winterTownSites=[
 {x:-520,z:-150,y:3,w:58,h:56,yaw:.15},{x:-305,z:-150,y:10,w:69,h:70,yaw:-.12},
 {x:-60,z:-155,y:8,w:92,h:91,yaw:.05},{x:200,z:-150,y:9,w:66,h:68,yaw:-.18},{x:490,z:-150,y:3,w:62,h:62,yaw:.1},
 {x:-615,z:130,y:10,w:59,h:61,yaw:Math.PI/2},{x:-630,z:380,y:24,w:74,h:76,yaw:Math.PI/2},
 {x:-635,z:765,y:31.7,w:58,h:60,yaw:Math.PI/2},{x:-640,z:1010,y:31.7,w:62,h:68,yaw:Math.PI/2},
 {x:690,z:35,y:14,w:52,h:58,yaw:-Math.PI/2},{x:705,z:490,y:24,w:50,h:60,yaw:-Math.PI/2},
 {x:690,z:850,y:31.7,w:58,h:72,yaw:-Math.PI/2},
 {x:-325,z:1145,y:31.7,w:72,h:72,yaw:Math.PI},{x:-50,z:1150,y:31.7,w:96,h:94,yaw:Math.PI},{x:240,z:1145,y:31.7,w:72,h:72,yaw:Math.PI}
];

function snowRidge(site,depth){
 const vertices=[],colors=[],indices=[],rings=12,steps=64,rx=site.w*1.15,rz=depth*1.15;
 for(let ring=0;ring<=rings;ring++)for(let i=0;i<=steps;i++){
  const t=ring/rings,a=i/steps*Math.PI*2,r=t*(1+.025*Math.sin(a*5+site.x));
  const drop=T.MathUtils.smoothstep(t,.66,1),y=site.y-.13-drop*(site.y+49);
  vertices.push(site.x+Math.cos(a)*rx*r,y,site.z+Math.sin(a)*rz*r);
  const c=new T.Color('#d6d9e3').lerp(new T.Color('#8494b5'),drop*.7);colors.push(c.r,c.g,c.b);
 }
 for(let ring=0;ring<rings;ring++)for(let i=0;i<steps;i++){const a=ring*(steps+1)+i,b=a+steps+1;indices.push(a,a+1,b,a+1,b+1,b);}
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.computeVertexNormals();
 return geometry;
}

export async function loadWinterTown(parent,solids,templates){
 const source=(await new GameAssetLoader().loadAsync('/assets/cohesion/winter-pavilion.glb')).scene;
 const original=new T.Box3().setFromObject(source),size=original.getSize(new T.Vector3()),center=original.getCenter(new T.Vector3());
 const snow=new T.MeshStandardMaterial({vertexColors:true,roughness:1}),sites=[];
 for(const [i,p]of winterTownSites.entries()){
  const depth=p.w*size.z/size.x,asset=source.clone(true);asset.position.sub(new T.Vector3(center.x,original.min.y,center.z));
  const root=new T.Group();root.name='Lux3D winter conservatory winter-pavilion';root.add(asset);root.scale.set(p.w/size.x,p.h/size.y,depth/size.z);root.position.set(p.x,p.y,p.z);root.rotation.y=p.yaw;root.updateMatrixWorld(true);
  const bounds=new T.Box3().setFromObject(root),clear=bounds.clone().expandByScalar(12);
  if(railClearanceSamples.some(r=>clear.containsPoint(new T.Vector3(r.x,r.y+3,r.z)))||projectTrack(p.x,p.z).distance<Math.max(p.w,depth)/2+24)throw Error('Winter pavilion crosses a route');
  parent.add(root);const ridge=new T.Mesh(snowRidge(p,Math.max(depth,p.w)),snow);ridge.name='Snow ridge supporting winter pavilion';parent.add(ridge);
  const extent=bounds.getSize(new T.Vector3()),c=bounds.getCenter(new T.Vector3());solids.push({id:'winter-pavilion',x:c.x,z:c.z,y:bounds.min.y,width:extent.x,depth:extent.z,height:extent.y});
  sites.push({x:p.x,z:p.z,y:p.y,width:extent.x,depth:extent.z,height:extent.y,min:bounds.min.toArray(),max:bounds.max.toArray()});
 }
 window.__winterTownDebug={skyOpen:true,pavilions:sites,oldVaultRemoved:true};
 return sites;
}
