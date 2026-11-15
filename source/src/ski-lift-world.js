import * as T from 'three';
import {skiLiftSections,liftPoseOn,liftSupportFloor} from './ski-lift.js';

export function buildSkiLift(scene){
 const root=new T.Group();root.name='Alpine sightseeing escalator';scene.add(root);
 const wood=new T.MeshStandardMaterial({color:0x654b3b,roughness:.86}),brass=new T.MeshStandardMaterial({color:0xb89b66,metalness:.55,roughness:.38}),rubber=new T.MeshStandardMaterial({color:0x304139,roughness:.7}),stone=new T.MeshStandardMaterial({color:0xb2a792,roughness:.93}),snow=new T.MeshStandardMaterial({color:0xe4e9ec,roughness:.95});
 const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;const ctx=canvas.getContext('2d');ctx.fillStyle='#59635d';ctx.fillRect(0,0,128,128);for(let x=0;x<128;x+=8){ctx.fillStyle='#7d867c';ctx.fillRect(x,0,2,128);ctx.fillStyle='#34423c';ctx.fillRect(x+2,0,2,128);}ctx.fillStyle='#c9a96c';ctx.fillRect(0,0,128,7);const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;
 const tread=new T.MeshStandardMaterial({color:0xffffff,map,roughness:.7,metalness:.2}),matrix=new T.Object3D(),moving=[];
 const postMatrices=[],pierMatrices=[],lights=[];
 function slab(points,offset,width,y,material){
  const vertices=[],indices=[];
  points.forEach((p,i)=>{const q=liftPoseOn(points,p.s);for(const side of [-1,1]){const d=offset+side*width/2;vertices.push(p.x+Math.cos(q.yaw)*d,p.y+y,p.z-Math.sin(q.yaw)*d);}if(i<points.length-1){const a=i*2;indices.push(a,a+2,a+1,a+1,a+2,a+3);}});
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setIndex(indices);geo.computeVertexNormals();const mesh=new T.Mesh(geo,material);mesh.material.side=T.DoubleSide;root.add(mesh);
 }
 class RailCurve extends T.Curve{constructor(points,side,height){super();this.points=points;this.side=side;this.height=height;}getPoint(t,target=new T.Vector3()){const p=liftPoseOn(this.points,t*this.points.at(-1).s);return target.set(p.x+Math.cos(p.yaw)*this.side,p.y+this.height,p.z-Math.sin(p.yaw)*this.side);}}
 for(const section of skiLiftSections){
  const points=section.points,length=points.at(-1).s;
  slab(points,0,5.3,-.4,wood);
  for(const side of [-1,1]){
   slab(points,side*2.5,.34,.08,wood);slab(points,side*2.65,.12,.12,snow);
   for(const [height,material,radius] of [[1.08,rubber,.12],[.46,brass,.055]]){const rail=new T.Mesh(new T.TubeGeometry(new RailCurve(points,side*2.5,height),Math.ceil(length/3),radius,6,false),material);rail.name='Continuous escalator handrail';root.add(rail);}
  }
  for(let s=1;s<length;s+=8){const p=liftPoseOn(points,s);for(const side of [-1,1]){matrix.position.set(p.x+Math.cos(p.yaw)*side*2.5,p.y+.55,p.z-Math.sin(p.yaw)*side*2.5);matrix.rotation.set(0,p.yaw,0);matrix.scale.set(1,1,1);matrix.updateMatrix();postMatrices.push(matrix.matrix.clone());}if(s%24===1)lights.push(new T.Vector3(p.x,p.y+.35,p.z));}
  for(let s=20;s<length;s+=38){const p=liftPoseOn(points,s),floor=liftSupportFloor(p),height=p.y-floor-.4;if(height<1)continue;matrix.position.set(p.x,p.y-.4-height/2,p.z);matrix.rotation.set(0,p.yaw,0);matrix.scale.set(1,height,1);matrix.updateMatrix();pierMatrices.push(matrix.matrix.clone());}
  const count=Math.ceil(length/1.05),steps=new T.InstancedMesh(new T.BoxGeometry(4.65,.24,1.1),tread,count);steps.name='Moving escalator treads '+section.id;steps.instanceMatrix.setUsage(T.DynamicDrawUsage);steps.frustumCulled=false;root.add(steps);moving.push({id:section.id,steps,points,length,spacing:length/count});
 }
 function instances(name,geometry,material,matrices){const mesh=new T.InstancedMesh(geometry,material,matrices.length);matrices.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.name=name;mesh.computeBoundingSphere();root.add(mesh);return mesh;}
 instances('Brass escalator balusters',new T.CylinderGeometry(.065,.08,1.1,6),brass,postMatrices);
 instances('Mountain escalator piers',new T.CylinderGeometry(.9,1.3,1,6),stone,pierMatrices);
 const bulbMatrices=lights.map(p=>{matrix.position.copy(p);matrix.rotation.set(0,0,0);matrix.scale.set(1,1,1);matrix.updateMatrix();return matrix.matrix.clone();});instances('Warm escalator guide lights',new T.SphereGeometry(.13,6,4),new T.MeshBasicMaterial({color:0xffd894}),bulbMatrices);
 // Timber boarding shelters frame both approaches and the summit landing.
 const landings=[skiLiftSections[0].points[0],skiLiftSections[1].points[0],skiLiftSections[2].points.at(-1)];
 for(const p of landings){const shelter=new T.Group();shelter.position.set(p.x,p.y,p.z);root.add(shelter);for(const side of [-1,1]){const post=new T.Mesh(new T.BoxGeometry(.24,3.9,.24),wood);post.position.set(side*2.8,1.95,0);shelter.add(post);const roof=new T.Mesh(new T.BoxGeometry(3.3,.16,3.4),snow);roof.position.set(side*1.5,4.25,0);roof.rotation.z=-side*.24;shelter.add(roof);}const beam=new T.Mesh(new T.BoxGeometry(6,.25,.28),wood);beam.position.y=3.8;shelter.add(beam);}
 let beltDistance=0;
 function update(distance=0,route='entrance'){beltDistance=distance;const spurLength=skiLiftSections.find(s=>s.id===route).points.at(-1).s;for(const {id,steps,points,length,spacing} of moving){const offset=id==='mountain'?beltDistance-spurLength:beltDistance;for(let i=0;i<steps.count;i++){const p=liftPoseOn(points,((i*spacing+offset)%length+length)%length);matrix.position.set(p.x,p.y-.12,p.z);matrix.rotation.set(0,p.yaw,0);matrix.scale.set(1,1,1);matrix.updateMatrix();steps.setMatrixAt(i,matrix.matrix);}steps.instanceMatrix.needsUpdate=true;}}
 update();return {root,update};
}
