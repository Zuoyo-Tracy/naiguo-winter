import {railClearanceSamples} from './train-rules.js';
import * as THREE from 'three';
import {GameAssetLoader as GLTFLoader} from './asset-loader.js';
import {sampleAt} from './track.js';import {obstacles} from './rules.js';import {dreamObstacles} from './challenges.js';import {globe} from './snow-globe.js';
function unit(root){root.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(root),c=b.getCenter(new THREE.Vector3()),s=b.getSize(new THREE.Vector3());root.position.sub(new THREE.Vector3(c.x,b.min.y,c.z));const g=new THREE.Group();g.add(root);g.scale.set(1/s.x,1/s.y,1/s.z);return {root:g,ratio:s.x/s.y,depth:s.z/s.y};}
export async function loadNatureAssets(scene){
 const loader=new GLTFLoader(),[snow,flowers,tree,giant]=await Promise.all(['frost-snowball-lod','gypsophila-clump-lod','ornate-christmas-tree-lod','ornate-christmas-tree'].map(async id=>unit((await loader.loadAsync('/assets/'+id+'.glb')).scene)));
 const reports=[],floating=[];function put(asset,x,y,z,w,h,d,kind){if(kind==='floating snowball'){for(let step=0;step<12;step++){const r=railClearanceSamples.find(p=>Math.abs(p.x-x)<w/2+7&&Math.abs(p.z-z)<d/2+7&&p.y<y+h&&p.y+7>y);if(!r)break;const dx=x-r.x,dz=z-r.z,n=Math.hypot(dx,dz)||1;x+=(dx||1)/n*6;z+=dz/n*6;}}const g=asset.root.clone(true);g.scale.multiply(new THREE.Vector3(w,h,d));g.position.set(x,y,z);g.name='Lux3D '+kind;if(kind==='fir'&&x<1000)g.userData.terrainSupport=true;scene.add(g);reports.push({kind,x,y,z,width:w,height:h,depth:d});return g;}
 for(let i=2;i<110;i+=3){const p=sampleAt(50+i*44),side=i%2?1:-1;const g=put(snow,p.x+Math.cos(p.yaw)*(19+i%8)*side,p.y+3.2,p.z-Math.sin(p.yaw)*(19+i%8)*side,5.6,5.6,5.6,'floating snowball');floating.push({g,y:g.position.y});}
 for(const o of obstacles)put(flowers,o.x,o.y,o.z,o.r*2,o.height,o.r*2,'ground flowers');
 for(const o of dreamObstacles){if(o.kind==='tree')put(tree,o.x,o.y,o.z,o.r*2,o.height,o.r*2,'tree obstacle');else put(snow,o.x,o.y,o.z,o.r*2,o.height,o.r*2,'snow obstacle');}
 function fir(x,y,z,h,large=false){const a=large?giant:tree;return put(a,x,y,z,h*a.ratio,h,h*a.depth,'fir');}
 // Set massive scenic trees farther from neighboring roads; roots meet snow islands.
 const baseMat=new THREE.MeshStandardMaterial({color:0xe4e4f0,roughness:.9});
 for(const [x,z,y,h] of [[-180,-85,0,70],[180,540,12,90],[-535,225,25,65]]){fir(x,y,z,h,true);}
 fir(globe.x,globe.y+1,globe.z,9);

 return {reports,update:time=>floating.forEach(({g,y},i)=>{g.position.y=y+Math.sin(time*.45+i)*.35;g.rotation.y=time*.06+i;})};
}
