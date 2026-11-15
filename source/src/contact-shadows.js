import * as T from 'three';
// A single instanced pass gives small scenery a soft point of contact without
// casting thousands of real-time shadow maps across the full conservatory.
export function addContactShadows(parent,solids,surface){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=96;const ctx=canvas.getContext('2d'),g=ctx.createRadialGradient(48,48,4,48,48,46);g.addColorStop(0,'rgba(28,36,29,.62)');g.addColorStop(.45,'rgba(28,36,29,.32)');g.addColorStop(1,'rgba(28,36,29,0)');ctx.fillStyle=g;ctx.fillRect(0,0,96,96);
 const texture=new T.CanvasTexture(canvas),geometry=new T.PlaneGeometry(1,1);geometry.rotateX(-Math.PI/2);const material=new T.MeshBasicMaterial({map:texture,transparent:true,opacity:.32,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});const mesh=new T.InstancedMesh(geometry,material,solids.length),matrix=new T.Matrix4();mesh.name='Soft contact shadows beneath winter street furniture';
 solids.forEach((s,i)=>{const ground=surface(s.x,s.z);const y=Math.max(s.y,Number.isFinite(ground)?ground:s.y)+.09;matrix.compose(new T.Vector3(s.x,y,s.z),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),s.rotate||0),new T.Vector3((s.shadowWidth||(s.r?2*s.r:s.width))*1.35+.6,1,(s.shadowDepth||(s.r?2*s.r:s.depth))*1.35+.6));mesh.setMatrixAt(i,matrix);});mesh.computeBoundingBox();mesh.computeBoundingSphere();parent.add(mesh);return mesh;
}
