import * as THREE from 'three';
// Deterministic petal instances keep dense hanging racemes within a handful of draw calls.
export function addWisteria(group,z,deck,ceiling,seed){
 let n=171+seed;const rnd=()=>((n=(n*1664525+1013904223)>>>0)/4294967296);
 const blooms=[],leaves=[],stems=[];const q=new THREE.Quaternion(),axis=new THREE.Vector3(0,1,0);
 for(let x=-112;x<=112;x+=4.2)for(const lane of [-17,-12,-6,0,6,12,17]){
  const zz=lane+(rnd()-.5)*2,start=ceiling+14*Math.sqrt(Math.max(0,1-(zz/18)**2))-.9;
  const length=2.8+rnd()*3.8,xx=x+(rnd()-.5)*2;
  stems.push({x:xx,y:start-length/2,z:z+zz,length});
  for(let j=0;j<18;j++){const t=j/17,cy=start-t*length,r=(1-t)*.68+.08;for(let k=0;k<3;k++){const a=k*Math.PI*2/3+j*2.4;blooms.push({x:xx+Math.cos(a)*r*.65,y:cy,z:z+zz+Math.sin(a)*r*.65,s:r,angle:a,color:Math.floor(rnd()*4)});}}
  for(let j=0;j<3;j++)leaves.push({x:xx+(rnd()-.5)*2,y:start+.1+rnd()*.6,z:z+zz+(rnd()-.5)*2});
 }
 const matrix=new THREE.Matrix4(),palette=[0xd7abd7,0xb989ca,0xe9c1dc,0xc39ad8];
 const petals=new THREE.InstancedMesh(new THREE.SphereGeometry(1,6,4),new THREE.MeshStandardMaterial({roughness:.84,side:THREE.DoubleSide}),blooms.length);
 blooms.forEach((p,i)=>{q.setFromAxisAngle(axis,p.angle);matrix.compose(new THREE.Vector3(p.x,p.y,p.z),q,new THREE.Vector3(p.s*.62,p.s*.8,p.s*.38));petals.setMatrixAt(i,matrix);petals.setColorAt(i,new THREE.Color(palette[p.color]));});petals.name='Pink lavender hanging wisteria petals';group.add(petals);
 const foliage=new THREE.InstancedMesh(new THREE.SphereGeometry(1,6,4),new THREE.MeshStandardMaterial({color:0x627955,roughness:1}),leaves.length);leaves.forEach((p,i)=>{q.setFromAxisAngle(axis,rnd()*6.28);matrix.compose(new THREE.Vector3(p.x,p.y,p.z),q,new THREE.Vector3(.8,.15,.36));foliage.setMatrixAt(i,matrix);});foliage.name='Wisteria canopy leaves';group.add(foliage);
 const vines=new THREE.InstancedMesh(new THREE.CylinderGeometry(.035,.055,1,4),new THREE.MeshStandardMaterial({color:0x66583d,roughness:1}),stems.length);stems.forEach((p,i)=>{matrix.compose(new THREE.Vector3(p.x,p.y,p.z),new THREE.Quaternion(),new THREE.Vector3(1,p.length,1));vines.setMatrixAt(i,matrix);});vines.name='Hanging wisteria stems';group.add(vines);
 for(const side of [-1,1])for(const x of [-112,-56,0,56,112]){const pts=Array.from({length:65},(_,j)=>{const t=j/64,a=t*Math.PI*8;return new THREE.Vector3(x+Math.cos(a)*2.35,deck+2+t*32,z+side*19+Math.sin(a)*2.35);});const vine=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),64,.16,5,false),new THREE.MeshStandardMaterial({color:0x525c3f,roughness:1}));vine.name='Wisteria climbing column vine';group.add(vine);}
}
