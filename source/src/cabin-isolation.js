import * as T from 'three';
// Discard only the part of exterior geometry that enters the passenger volume.
// Interior furniture keeps its own materials, and scenery beyond windows stays visible.
export function protectCabinInterior(scene,cabin){
 const enabled={value:0},inverse={value:new T.Matrix4()},low={value:new T.Vector3(-2.8,.9,-8.0)},high={value:new T.Vector3(2.8,4.85,-1.6)};
 const materials=new WeakMap(),protectedMaterials=new WeakSet(),cabinMaterials=new WeakSet();cabin.traverse(o=>{for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[])cabinMaterials.add(m);});let installedRevision=-1,installedRoots=-1;
 function protect(original){if(protectedMaterials.has(original))return original;if(materials.has(original))return materials.get(original);const m=cabinMaterials.has(original)?original.clone():original,oldCompile=original.onBeforeCompile,oldKey=original.customProgramCacheKey.bind(original);m.onBeforeCompile=(shader,renderer)=>{oldCompile.call(m,shader,renderer);if(!shader.vertexShader.includes('#include <project_vertex>'))return;Object.assign(shader.uniforms,{cabinCutEnabled:enabled,cabinWorldInverse:inverse,cabinCutMin:low,cabinCutMax:high});shader.vertexShader='uniform mat4 cabinWorldInverse; varying vec3 cabinLocalFragment;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
 vec4 cabinWorldVertex=vec4(transformed,1.0);
 #ifdef USE_BATCHING
 cabinWorldVertex=batchingMatrix*cabinWorldVertex;
 #endif
 #ifdef USE_INSTANCING
 cabinWorldVertex=instanceMatrix*cabinWorldVertex;
 #endif
 cabinLocalFragment=(cabinWorldInverse*modelMatrix*cabinWorldVertex).xyz;
 `);shader.fragmentShader='uniform float cabinCutEnabled; uniform vec3 cabinCutMin; uniform vec3 cabinCutMax; varying vec3 cabinLocalFragment;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('void main() {',`void main() {
 if(cabinCutEnabled>0.5 && all(greaterThan(cabinLocalFragment,cabinCutMin)) && all(lessThan(cabinLocalFragment,cabinCutMax))) discard;
 `);};m.customProgramCacheKey=()=>oldKey()+'|cabin-volume-v1';materials.set(original,m);protectedMaterials.add(m);m.needsUpdate=true;return m;}
 return inside=>{enabled.value=inside?1:0;if(!inside)return;const revision=scene.userData.geometryRevision||0;if(installedRevision!==revision||installedRoots!==scene.children.length){scene.traverse(o=>{if(!o.material)return;for(let p=o;p;p=p.parent)if(p===cabin)return;o.material=Array.isArray(o.material)?o.material.map(protect):protect(o.material);});installedRevision=revision;installedRoots=scene.children.length;}cabin.updateMatrixWorld(true);inverse.value.copy(cabin.matrixWorld).invert();};
}
