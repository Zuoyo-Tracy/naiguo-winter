import * as THREE from 'three';
import {winterPavingTextures} from './paving-texture.js';
let pavingColor;
export function avenueMaterial(){
 // Road readability is independent of scene lighting and grazing-angle bump
 // normals. Keep the painted limestone bevels, joints and grain in the albedo.
 if(!pavingColor){pavingColor=winterPavingTextures().color.clone();pavingColor.colorSpace=THREE.SRGBColorSpace;pavingColor.needsUpdate=true;}
 const material=new THREE.MeshBasicMaterial({color:0xffffff,map:pavingColor,side:THREE.DoubleSide});
 material.onBeforeCompile=shader=>{
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   vMapUv=(modelMatrix*vec4(transformed,1.)).xz*.15;
  `);
 };
 material.customProgramCacheKey=()=> 'winter-readable-limestone-v2';
 return material;
}
