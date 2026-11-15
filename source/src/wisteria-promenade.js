import * as T from 'three';
import {GameAssetLoader} from './asset-loader.js';
import {wisteriaLayout,wisteriaArchPositions} from './boulevard-layout.js';

function instances(root,source,placements,name){
 source.updateMatrixWorld(true);const box=new T.Box3().setFromObject(source),size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3());
 source.traverse(o=>{if(!o.isMesh)return;const mesh=new T.InstancedMesh(o.geometry,o.material,placements.length);mesh.name=name;
  placements.forEach((p,i)=>{const origin=new T.Matrix4().makeTranslation(-center.x,p.top?-box.max.y:-box.min.y,-center.z),scale=new T.Matrix4().makeScale(p.w/size.x,p.h/size.y,p.d/size.z),rotate=new T.Matrix4().makeRotationY(p.yaw||0),move=new T.Matrix4().makeTranslation(p.x,p.y,p.z);mesh.setMatrixAt(i,move.multiply(rotate).multiply(scale).multiply(origin).multiply(o.matrixWorld));});mesh.computeBoundingSphere();root.add(mesh);
 });
}
export async function loadWisteriaPromenade(parent,solids){
 const loader=new GameAssetLoader(),[arch,flower]=await Promise.all(['roman-garden-bay','wisteria-garden-cluster'].map(async name=>(await loader.loadAsync('/assets/cohesion/'+name+'.glb')).scene));
 const p=wisteriaLayout,root=new T.Group();root.name='Grounded Roman wisteria garden promenade';root.position.set(p.x,p.y+.35,p.z);parent.add(root);
 const arches=wisteriaArchPositions.map(x=>({x:0,y:0,z:-x*p.scaleX,w:37,h:28.8,d:8}));
 instances(root,arch,arches,'Lux3D Roman garden carved arcade');
 const flowers=[];for(const [i,a]of arches.entries())for(const side of [-1,1])for(let j=0;j<5;j++){
  const h=10.2+(i+j)%3*.6;flowers.push({x:(j-2)*4.8+.35*Math.sin(i+j),y:28.45,z:a.z+side*2.3,w:3.5,h,d:3.9,yaw:(i*1.7+j*.8+side)*.7,top:true});
 }
 instances(root,flower,flowers,'Lux3D Roman garden hanging wisteria');
 const walnut=new T.MeshStandardMaterial({color:'#705137',roughness:.9}),stone=new T.MeshStandardMaterial({color:'#a59a87',roughness:.95}),vineMat=new T.MeshStandardMaterial({color:'#526342',roughness:1});
 // Continuous beams physically link the six independent vaulted bays.
 for(const side of [-1,1])for(const [height,width,depth]of [[26.6,2.2,1.8],[27.8,2.7,.45],[25.5,2.5,.45]]){
  const beam=new T.Mesh(new T.BoxGeometry(width,depth,132),walnut);beam.name='Roman arcade continuous entablature';beam.position.set(side*15.5,height,0);root.add(beam);
 }
 for(const a of arches)for(const side of [-1,1]){
  const curve=new T.CatmullRomCurve3([new T.Vector3(-15,28.4,a.z+side*2.3),new T.Vector3(-7,28.6,a.z+side*2.3),new T.Vector3(0,28.5,a.z+side*2.3),new T.Vector3(7,28.6,a.z+side*2.3),new T.Vector3(15,28.4,a.z+side*2.3)]);
  const vine=new T.Mesh(new T.TubeGeometry(curve,24,.16,5,false),vineMat);vine.name='Wisteria rooted trailing vine';root.add(vine);
 }
 for(const side of [-1,1]){const base=new T.Mesh(new T.BoxGeometry(7,.7,132),stone);base.name='Wisteria garden grounded footing';base.position.set(p.x+side*15.3,p.y+.1,p.z);parent.add(base);solids.push({id:'wisteria-garden-footing',x:base.position.x,z:p.z,y:p.y-.25,width:7,depth:132,height:.7});}
 for(const a of arches)for(const side of [-1,1])solids.push({id:'wisteria-arch-column',x:p.x+side*15.3,z:p.z+a.z,y:p.y,width:7,depth:8,height:25});
 root.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(root);
 window.__wisteriaGarden={position:[p.x,p.y,p.z],bounds:{min:bounds.min.toArray(),max:bounds.max.toArray()},flowerLength:10.2,archHeight:28.8,clearLaneWidth:23.6,galleries:1,bays:arches.length,flowerClusters:flowers.length,source:'Lux3D tasks 4712190 / 4712197'};
 return root;
}
