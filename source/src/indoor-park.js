import * as THREE from 'three';
export function buildIndoorPark(scene){
 const objects=[];
 function block(w,h,d,color,x,y,z,emissive=0){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color,roughness:.65,metalness:.15,emissive,emissiveIntensity:emissive?.7:0}));m.position.set(x,y,z);scene.add(m);objects.push(m);return m;}
 block(240,2,240,0x8698b0,0,-24,0);
 block(240,82,3,0x6c7997,0,17,-120);block(240,82,3,0x7c829e,0,17,120);
 block(3,82,240,0x7e8ea6,-120,17,0);block(3,82,240,0x7e8ea6,120,17,0);
 block(240,2,240,0x889bb5,0,59,0);
 for(let i=-2;i<=2;i++){
  for(const x of [-108,108]){block(3,80,3,0xd1dce5,x,17,i*42);block(.35,60,.5,0xb7fff1,x+(x>0?-1.7:1.7),18,i*42,0x67b7ad);}
  block(216,1.8,1.8,0xc1d1dd,0,54,i*42);
  block(180,.2,1.6,0xc7ffef,0,52.9,i*42,0x6ab9aa);
 }
 // Ground-level promenade and central exhibition island are separate from the elevated race track.
 block(48,3,48,0xb8bdcf,0,-21,0);
 for(let i=0;i<16;i++){const a=i/16*Math.PI*2;block(2,16,2,0xb8d1dc,91*Math.cos(a),-14,91*Math.sin(a));}
 const ringMat=new THREE.MeshStandardMaterial({color:0xafeadf,emissive:0x387f76,emissiveIntensity:.6});
 for(const [r,y] of [[35,32],[65,43]]){const ring=new THREE.Mesh(new THREE.TorusGeometry(r,.5,8,96),ringMat);ring.rotation.x=Math.PI/2;ring.position.y=y;scene.add(ring);objects.push(ring);}
 const light=new THREE.HemisphereLight(0xf0e7ff,0x90a4b5,1);scene.add(light);
 return objects;
}
