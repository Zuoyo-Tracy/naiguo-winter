import * as T from 'three';
import {boulevardLampStops} from './boulevard-layout.js';

export function tuneWinterMaterials(templates){
 for(const [id,root]of templates){
  if(!['portal','column','shopfront','garden','fir-grove','winter-tree','arcade'].includes(id))continue;
  const foliage=['garden','fir-grove','winter-tree'].includes(id),seen=new Set();
  root.traverse(o=>{for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[]){
   if(seen.has(m)||!m.map)continue;seen.add(m);
   if(foliage){m.metalness=0;m.roughnessMap=null;m.roughness=.94;}
   if(id==='arcade'&&!m.transparent){m.metalness=.05;m.roughnessMap=null;m.roughness=.8;}
   // Retain the generated carvings and color variations while lifting very dark
   // albedo in the park's soft evening illumination. Original GLBs stay intact.
   m.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
    diffuseColor.rgb=mix(diffuseColor.rgb,pow(max(diffuseColor.rgb,vec3(0.0001)),vec3(0.72)),${foliage?'0.12':'0.30'});
   `);};m.customProgramCacheKey=()=>foliage?'winter-matte-foliage-v1':'winter-warm-stone-v1';m.needsUpdate=true;
  }});
 }
}

export function addStreetLightPools(parent){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=96;const c=canvas.getContext('2d'),g=c.createRadialGradient(48,48,0,48,48,47);
 g.addColorStop(0,'rgba(255,194,115,.42)');g.addColorStop(.45,'rgba(255,206,139,.18)');g.addColorStop(1,'rgba(255,214,161,0)');c.fillStyle=g;c.fillRect(0,0,96,96);
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;const geometry=new T.PlaneGeometry(11,11);geometry.rotateX(-Math.PI/2);
 const mesh=new T.InstancedMesh(geometry,new T.MeshBasicMaterial({map:texture,transparent:true,opacity:.38,depthWrite:false,blending:T.AdditiveBlending,polygonOffset:true,polygonOffsetFactor:-2}),14);mesh.name='Warm lamp pools along the winter boulevard';const matrix=new T.Matrix4();let index=0;
 for(const z of boulevardLampStops)for(const side of [-1,1]){matrix.makeTranslation(-50+side*12.2,31.79,z);mesh.setMatrixAt(index++,matrix);}
 mesh.computeBoundingBox();mesh.computeBoundingSphere();parent.add(mesh);
}
