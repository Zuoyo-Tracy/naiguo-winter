import {mazePaths,mazePose,mazeOffset} from './haunt-maze.js';
import {partitionInstances} from './instance-partition.js';
import * as T from 'three';import {GameAssetLoader as GLTFLoader} from './asset-loader.js';import {hauntPose,hauntWidth} from './haunt-route.js';
export async function loadHauntDetails(scene){
 const loader=new GLTFLoader();const [rail,lantern,stone]=await Promise.all([loader.loadAsync('/assets/ghost-carved-railing-lod.glb'),loader.loadAsync('/assets/ghost-red-lantern-lod.glb'),new T.TextureLoader().loadAsync('/assets/ghost-stone-surface.png')]);
 const group=new T.Group();group.name='Lux3D haunted courtyard details';scene.add(group);
 stone.colorSpace=T.SRGBColorSpace;stone.wrapS=stone.wrapT=T.RepeatWrapping;stone.anisotropy=8;
 const road=scene.getObjectByName('Haunted stone route');road.material.map=stone;road.material.color.set(0xadb1bd);road.material.roughness=.8;road.material.needsUpdate=true;
 function instances(source,transforms,name){source.updateMatrixWorld(true);let triangles=0;source.traverse(o=>{if(!o.isMesh)return;const mat=o.material.clone();mat.roughness=.85;mat.metalness=.08;if(name==='Lux3D crimson palace lantern'){mat.emissive.set(0xb54c25);mat.emissiveMap=mat.map;mat.emissiveIntensity=.65;}const mesh=new T.InstancedMesh(o.geometry,mat,transforms.length);mesh.name=name;for(let i=0;i<transforms.length;i++)mesh.setMatrixAt(i,transforms[i].clone().multiply(o.matrixWorld));mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();group.add(mesh);partitionInstances(mesh,12);triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;});return triangles;}
 const railTransforms=[],lampTransforms=[],lampSites=[];const dummy=new T.Object3D();let clearMin=Infinity;
 for(const path of mazePaths()){
 for(let s=path.start;s<path.end;s+=8){const end=Math.min(path.end,s+8);for(const side of [-1,1]){
  if(path.court&&side!==path.side&&(mazeOffset(s)<hauntWidth(s)+.35||mazeOffset(end)<hauntWidth(end)+.35))continue;
  const a=mazePose(s,side*(hauntWidth(s)+.2),path.choices),b=mazePose(end,side*(hauntWidth(end)+.2),path.choices),length=Math.hypot(b.x-a.x,b.z-a.z);
  dummy.position.set((a.x+b.x)/2,(a.y+b.y)/2,(a.z+b.z)/2);dummy.rotation.set(0,Math.atan2(b.x-a.x,b.z-a.z)-Math.PI/2,0);dummy.scale.set(length/4,1,1);dummy.updateMatrix();railTransforms.push(dummy.matrix.clone());clearMin=Math.min(clearMin,hauntWidth(s)+.11);
 }}
 for(let s=path.start+16;s<path.end;s+=32){const side=path.side||(Math.round(s/32)%2?1:-1),p=mazePose(s,side*(hauntWidth(s)-.18),path.choices);dummy.position.set(p.x,p.y+1.88,p.z);dummy.rotation.set(0,p.yaw,0);dummy.scale.setScalar(1);dummy.updateMatrix();lampTransforms.push(dummy.matrix.clone());lampSites.push({...p,s});}
 }
 const railTriangles=instances(rail.scene,railTransforms,'Lux3D carved Chinese railing'),lanternTriangles=instances(lantern.scene,lampTransforms,'Lux3D crimson palace lantern');
 const glow=Array.from({length:3},()=>{const l=new T.PointLight(0xff8546,.65,4,1.5);l.visible=false;scene.add(l);return l;});
 window.__hauntDetailAssets={railPanels:railTransforms.length,lanterns:lampTransforms.length,railTriangles,lanternTriangles,minRailInnerEdge:clearMin,roadTextureSource:'Lux3D ghost-stone-paving',originalsPreserved:true};
 return(s,time)=>{group.visible=!!s.snow;for(const l of glow)l.visible=!!s.snow;if(!s.snow)return;const near=[...lampSites].sort((a,b)=>Math.hypot(a.x-s.x,a.z-s.z)-Math.hypot(b.x-s.x,b.z-s.z));glow.forEach((l,i)=>{const p=near[i];l.position.set(p.x,p.y+2.35,p.z);l.intensity=.65*(1+.04*Math.sin(time*2+i));});};
}
