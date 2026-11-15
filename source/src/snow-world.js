import {buildHaunt} from './haunt-world.js';
import {registerRegionHint} from './region-hints.js';
import * as THREE from 'three';import {globe,seals} from './snow-globe.js';import {magnets,magneticPose} from './challenges.js';
export function buildSnow(scene){
 const mat=(c)=>new THREE.MeshStandardMaterial({color:c,roughness:.5});const snow=mat(0xf3edff),pine=mat(0x9bb8ad),gold=mat(0xf6d5a1);
 function add(g,m,x,y,z){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);scene.add(o);return o;}
 function text(t,x,y,z){registerRegionHint(t,x,y,z,x>1000?2.5:30);}
 function tree(){ /* Loaded from Lux3D in nature-assets.js. */ }
 for(const [x,z,y,h] of [[-180,155,28,70],[180,300,50,90],[-230,395,32,65]])tree(x,y,z,h);
 add(new THREE.SphereGeometry(15,32,24),new THREE.MeshPhysicalMaterial({color:0xcbdce8,transparent:true,opacity:.2,roughness:.08,iridescence:1,depthWrite:false,side:THREE.DoubleSide}),globe.x,globe.y+9,globe.z);add(new THREE.CylinderGeometry(14,16,3,32),gold,globe.x,globe.y-1.8,globe.z);tree(globe.x,globe.y+1,globe.z,9);text('水晶球 · 中式鬼屋 · 限速40',globe.x+26,globe.y+14,globe.z);
 const updateHaunt=buildHaunt(scene);
 for(const m of magnets.slice(1)){const a=[],idx=[];for(let i=0;i<=105;i++){for(const side of [-1,1]){const p=magneticPose((m.start+i*2)*m.dir,side*5,m);a.push(p.x,p.y,p.z);}if(i<105)idx.push(i*2,i*2+1,i*2+2,i*2+1,i*2+3,i*2+2);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(a,3));g.setIndex(idx);g.computeVertexNormals();const material=mat(m.id===1?0xc2b4e5:0xa7d4ca);material.side=THREE.DoubleSide;add(g,material,0,0,0);text('环堡磁力道 · 翻转一周',m.start*m.dir, m.base+9,m.z);}
 return updateHaunt;
}
