import {avenueMaterial} from './avenue-material.js';
import * as THREE from 'three';
import {GameAssetLoader as GLTFLoader} from './asset-loader.js';
import {computeBoundsTree,acceleratedRaycast} from 'three-mesh-bvh';
import {modules} from './track.js';
export async function loadModules(scene){
 const reports=[],supports=[],walls=[];
 for(const spec of modules){
 const root=(await new GLTFLoader().loadAsync('/assets/'+spec.id+'.glb')).scene;
 let bounds=new THREE.Box3().setFromObject(root),size=bounds.getSize(new THREE.Vector3());
 if(size.z>size.x){root.rotation.y=Math.PI/2;root.updateMatrixWorld(true);bounds=new THREE.Box3().setFromObject(root);size=bounds.getSize(new THREE.Vector3());}
 const scale=spec.length/size.x;root.scale.setScalar(scale);if(spec.id==='english-stone-bridge')root.scale.set(spec.length/size.x,18/size.y,30/size.z);root.updateMatrixWorld(true);bounds=new THREE.Box3().setFromObject(root);const center=bounds.getCenter(new THREE.Vector3());root.position.set(spec.x-center.x,-bounds.min.y,spec.z-center.z);scene.add(root);root.updateMatrixWorld(true);
 const meshes=[];root.traverse(o=>{if(o.isMesh){if(!o.geometry.boundsTree)computeBoundsTree.call(o.geometry);o.raycast=acceleratedRaycast;o.material.side=THREE.DoubleSide;
 if(spec.id!=='cloud-bridge'&&spec.id!=='english-stone-bridge'){o.material=o.material.clone();o.material.roughness=.65;o.material.metalness=.08;o.material.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\nfloat pearlLum=dot(diffuseColor.rgb,vec3(.299,.587,.114));diffuseColor.rgb=mix(vec3(pearlLum),diffuseColor.rgb,.24);diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.88,.86,.80),.28);');};o.material.customProgramCacheKey=()=> 'pearl-castle-v8';}
 meshes.push(o);}});
 const ray=new THREE.Raycaster();ray.ray.direction.set(0,-1,0);
 function hits(x,z){ray.ray.origin.set(x,300,z);return ray.intersectObjects(meshes,false).filter(h=>h.face&&h.face.normal.clone().transformDirection(h.object.matrixWorld).y>.45).map(h=>h.point.y);}
 // Choose the lowest upward-facing central deck, not the roof above its tunnel.
 const central=hits(spec.x,spec.z).sort((a,b)=>a-b);if(!central.length)throw Error(spec.id+': no deck');
 const probes=[];for(let x=-spec.length*.35;x<=spec.length*.35;x+=2)probes.push(hits(spec.x+x,spec.z)); const candidates=probes.flat(); const ranked=candidates.map(y=>({y,coverage:probes.filter(a=>a.some(v=>Math.abs(v-y)<.5)).length})).sort((a,b)=>b.coverage-a.coverage||b.y-a.y); const floor=ranked[0].y;root.position.y+=spec.y-floor;root.updateMatrixWorld(true);
 // Flatten only the near-deck band in the runtime copy; original GLB stays untouched.
 for(const mesh of meshes){
  // Cloned GLTF instances share their source geometry. Each placed deck owns its calibration.
  const geometry=mesh.geometry=mesh.geometry.clone();
  const {position,normal}=geometry.attributes;
  const world=mesh.matrixWorld,inverse=world.clone().invert();
  const vertex=new THREE.Vector3(),direction=new THREE.Vector3();
  for(let i=0;i<position.count;i++){
   vertex.fromBufferAttribute(position,i).applyMatrix4(world);
   if(Math.abs(vertex.y-spec.y)>=2 || direction.fromBufferAttribute(normal,i).transformDirection(world).y<=.45)continue;
   vertex.y=spec.y+.08;vertex.applyMatrix4(inverse);
   position.setXYZ(i,vertex.x,vertex.y,vertex.z);
  }
  position.needsUpdate=true;geometry.computeVertexNormals();
  geometry.computeBoundingBox();geometry.computeBoundingSphere();
  computeBoundsTree.call(geometry);
 }
 const deck=(x,z)=>{let a=hits(x,z).filter(y=>Math.abs(y-spec.y)<2);if(!a.length)for(const [dx,dz] of [[.6,0],[-.6,0],[0,.6],[0,-.6]])a.push(...hits(x+dx,z+dz).filter(y=>Math.abs(y-spec.y)<2));return a.length?a.reduce((a,b)=>Math.abs(a-spec.y)<Math.abs(b-spec.y)?a:b):null;};
 const samples=[];for(let x=-spec.length*.38;x<=spec.length*.38;x+=2)samples.push({x,y:deck(spec.x+x,spec.z)});
 const valid=samples.every(p=>p.y!==null);reports.push({baseY:new THREE.Box3().setFromObject(root).min.y,id:spec.id,position:[spec.x,spec.y,spec.z],valid,samples});
 // Visible portal connectors cover only the approach lips; central deck stays generated.
 for(const side of [-1,1]){const plate=new THREE.Mesh(new THREE.BoxGeometry(spec.length*.24,.4,24),avenueMaterial());plate.position.set(spec.x+side*spec.length*.5,spec.y-.08,spec.z);scene.add(plate);}
 window.__moduleReports=reports; if(!valid)throw Error(spec.id+': generated centerline needs calibration');
 walls.push({spec,meshes});supports.push((x,z)=>{if(Math.abs(z-spec.z)>13||Math.abs(x-spec.x)>spec.length*.38)return undefined;return deck(x,z);});
 }
 const support=(x,z)=>{for(const fn of supports){const y=fn(x,z);if(y!==undefined)return y;}return undefined;};
 support.blocked=(ox,oz,x,z,y)=>{const dx=x-ox,dz=z-oz,len=Math.hypot(dx,dz);if(len<.00001)return false;for(const {spec,meshes} of walls){if(Math.abs(x-spec.x)>spec.length*.6||Math.abs(z-spec.z)>20)continue;for(const side of [-.7,.7]){const ray=new THREE.Raycaster(new THREE.Vector3(ox+dz/len*side,y+1,oz-dx/len*side),new THREE.Vector3(dx/len,0,dz/len),0,len+1.5);const h=ray.intersectObjects(meshes,false);if(h.length)return true;}}return false;};
 return {reports,support};
}





