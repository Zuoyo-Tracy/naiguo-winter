import {avenueMaterial} from './avenue-material.js';
import * as THREE from 'three';
import {route,modules,sampleAt,TRACK_LENGTH} from './track.js';
import {obstacles,checkpointDistances} from './rules.js';
export function buildWorld(scene){
 const material=(c,e=0)=>new THREE.MeshStandardMaterial({color:c,emissive:e,emissiveIntensity:.55,roughness:.32,metalness:.25});
 const pearl=material(0xe5c6ef),mint=material(0x9ff5e4,0x326c73),gold=material(0xffd7af),pink=material(0xf3a7cc),white=material(0xfceaf7);
 const add=(g,m,x,y,z)=>{const o=new THREE.Mesh(g,m);o.position.set(x,y,z);scene.add(o);return o;};
 const pos=[],idx=[],edges=[[],[]];
 for(let i=0;i<route.length;i++){const p=route[i],a=route[Math.max(0,i-1)],b=route[Math.min(route.length-1,i+1)],yaw=Math.atan2(b.x-a.x,b.z-a.z);for(const side of [-1,1]){const x=p.x+Math.cos(yaw)*12*side,z=p.z-Math.sin(yaw)*12*side;pos.push(x,p.y,z);edges[(side+1)/2].push(new THREE.Vector3(x,p.y+.12,z));}
 if(i<route.length-1){const n=route[i+1],inModule=modules.some(m=>Math.abs((p.x+n.x)/2-m.x)<m.length*.38&&Math.abs(p.z-m.z)<2);if(!inModule)idx.push(i*2,i*2+1,i*2+2,i*2+1,i*2+3,i*2+2);}}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setIndex(idx);geo.computeVertexNormals();const road=add(geo,avenueMaterial(),0,0,0);road.material.side=THREE.DoubleSide;
 // Close the road slab with a bottom and boundary walls, leaving generated bridge spans open.
 const slabPos=[...pos,...pos.map((v,i)=>i%3===1?v-2.5:v)],slabIdx=[],edgeCounts=new Map(),offset=pos.length/3;
 for(let i=0;i<idx.length;i+=3){const [a,b,c]=idx.slice(i,i+3);slabIdx.push(c+offset,b+offset,a+offset);for(const [u,v]of [[a,b],[b,c],[c,a]]){const key=Math.min(u,v)+':'+Math.max(u,v),old=edgeCounts.get(key);edgeCounts.set(key,{u,v,count:(old?.count||0)+1});}}
 for(const {u,v,count} of edgeCounts.values())if(count===1)slabIdx.push(u,u+offset,v,v,u+offset,v+offset);
 const slabGeo=new THREE.BufferGeometry();slabGeo.setAttribute('position',new THREE.Float32BufferAttribute(slabPos,3));slabGeo.setIndex(slabIdx);slabGeo.computeVertexNormals();const slab=add(slabGeo,new THREE.MeshStandardMaterial({color:0x8f91a6,roughness:.92,side:THREE.DoubleSide}),0,0,0);slab.name='Continuous 2.5m solid road slab';

 for(const e of edges)scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(e),new THREE.LineBasicMaterial({color:0x89664b})));
 // Continuous limestone kerbs frame the European paving.
 const n=Math.ceil(TRACK_LENGTH/5),kerbs=new THREE.InstancedMesh(new THREE.BoxGeometry(.55,.32,5.1),material(0xc8c0bb),n*2),matrix=new THREE.Matrix4(),q=new THREE.Quaternion();
 for(let i=0;i<n;i++){const p=sampleAt((i+.5)*TRACK_LENGTH/n);q.setFromAxisAngle(new THREE.Vector3(0,1,0),p.yaw);for(const [j,side] of [-1,1].entries()){matrix.compose(new THREE.Vector3(p.x+Math.cos(p.yaw)*11.65*side,p.y+.12,p.z-Math.sin(p.yaw)*11.65*side),q,new THREE.Vector3(1,1,1));kerbs.setMatrixAt(i*2+j,matrix);}}kerbs.name='European limestone avenue kerbs';scene.add(kerbs);
 // Generated flower clumps use the same obstacle colliders.
 const gates=checkpointDistances.map(s=>{const p=sampleAt(s),g=add(new THREE.TorusGeometry(15,.22,6,48,Math.PI),mint,p.x,p.y+.3,p.z);g.rotation.y=p.yaw;g.name='Checkpoint turquoise arch';return g;});
 // Giant indoor planetarium shell, with distant pillars and an illuminated ceiling.
 const floor=add(new THREE.CylinderGeometry(1100,1100,3,64),material(0x171d43),0,-80,225);
 return {gates};
}
