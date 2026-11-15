import * as THREE from 'three';
// Castle blockout; Lux3D generated driving bridge is loaded separately.
export function buildSkyCastle(scene){
 const mat=c=>new THREE.MeshStandardMaterial({color:c,roughness:.55,metalness:.15});
 const pink=mat(0xf3b9dc),blue=mat(0xb9d8f5),cream=mat(0xffe9ed),mint=mat(0x92eadb);
 function mesh(g,m,x,y,z){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);scene.add(o);return o;}
 mesh(new THREE.CylinderGeometry(26,30,4,64),blue,0,4,0);
 for(let i=0;i<24;i++){const a=i*Math.PI/12;const o=mesh(new THREE.SphereGeometry(6,16,12),cream,27*Math.cos(a),3+Math.sin(i*2),25*Math.sin(a));o.scale.y=.6;}
 mesh(new THREE.BoxGeometry(23,17,16),cream,0,14,0);
 for(const [x,z,h] of [[-15,-12,24],[15,-12,24],[-15,12,18],[15,12,18],[0,0,32]]){
 mesh(new THREE.CylinderGeometry(3.2,4,h,24),x?pink:blue,x,6+h/2,z);
 mesh(new THREE.ConeGeometry(5,9,24),mint,x,6+h+4.5,z);
 for(let k=0;k<3;k++)mesh(new THREE.BoxGeometry(1.2,2.3,.2),mint,x,10+k*5,z+3.8);
 }
 const ring=mesh(new THREE.TorusGeometry(29,.25,8,96),mint,0,18,0);ring.rotation.x=Math.PI/2;
 for(const side of [-1,1])mesh(new THREE.BoxGeometry(4,8,13),pink,side*8,8,23);
 mesh(new THREE.BoxGeometry(20,3,13),cream,0,13.5,23);
}
