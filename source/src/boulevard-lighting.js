import * as T from 'three';
import {wisteriaLayout as gallery,wisteriaArchPositions} from './boulevard-layout.js';

export function addBoulevardLighting(parent){
 const vertices=[],bulbs=[],matrix=new T.Matrix4();
 // The endpoints touch the existing colonnade shafts, so the light strings
 // belong to the architecture and never float as gameplay markers.
 for(const x of wisteriaArchPositions){
  const z=gallery.z-x*gallery.scaleX;
  const point=t=>new T.Vector3(gallery.x-13+26*t,gallery.y+13-2.2*Math.sin(t*Math.PI),z);
  for(let i=0;i<48;i++)vertices.push(...point(i/48).toArray(),...point((i+1)/48).toArray());
  for(let i=1;i<18;i++)bulbs.push(point(i/18));
 }
 const wires=new T.LineSegments(new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(vertices,3)),new T.LineBasicMaterial({color:'#62543c'}));wires.name='Light strings anchored to bronze colonnade';parent.add(wires);
 const lights=new T.InstancedMesh(new T.SphereGeometry(.12,8,6),new T.MeshBasicMaterial({color:'#ffe0a2'}),bulbs.length);lights.name='Warm winter boulevard lamps';bulbs.forEach((p,i)=>{matrix.makeTranslation(p.x,p.y-.12,p.z);lights.setMatrixAt(i,matrix);});lights.computeBoundingBox();lights.computeBoundingSphere();parent.add(lights);
 const canvas=document.createElement('canvas');canvas.width=canvas.height=64;const c=canvas.getContext('2d'),gradient=c.createRadialGradient(32,32,0,32,32,31);gradient.addColorStop(0,'rgba(255,231,178,.9)');gradient.addColorStop(.2,'rgba(255,216,149,.35)');gradient.addColorStop(1,'rgba(255,194,117,0)');c.fillStyle=gradient;c.fillRect(0,0,64,64);
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
 const halo=new T.Points(new T.BufferGeometry().setFromPoints(bulbs.map(p=>p.clone().add(new T.Vector3(0,-.12,0)))),new T.PointsMaterial({map:texture,size:1.15,transparent:true,opacity:.6,depthWrite:false,blending:T.AdditiveBlending}));halo.name='Soft warm lantern halos';parent.add(halo);
}
