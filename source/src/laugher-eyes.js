// The generated model baked broad brown brow shapes into its skin. Refine just
// those two regions in object space, preserving its face, UVs and silhouette.
const eyeShader = `
varying vec3 vLaugherPosition;
varying vec3 vLaugherSmoothNormal;
float eyelidSkinMask(vec3 p) {
  vec2 a=vec2((p.x+0.125)/0.064,(p.y-0.527-0.31*(p.x+0.125))/0.034);
  vec2 b=vec2((p.x+0.010)/0.045,(p.y-0.563)/0.027);
  return max(1.0-smoothstep(0.75,1.12,length(a)),1.0-smoothstep(0.75,1.12,length(b)))*(1.0-smoothstep(0.10,0.14,-p.z));
}
float eyelidCrease(vec2 p, vec2 span, vec3 heights, float width) {
  float t=clamp((p.x-span.x)/(span.y-span.x),0.0,1.0);
  float y=(1.0-t)*(1.0-t)*heights.x+2.0*t*(1.0-t)*heights.y+t*t*heights.z;
  float halfWidth=width*pow(max(0.0,sin(t*3.14159265)),0.7)*0.5;
  float aa=max(fwidth(p.y)*0.65,0.00015);
  return (1.0-smoothstep(halfWidth-aa,halfWidth+aa,abs(p.y-y)))*step(span.x,p.x)*step(p.x,span.y);
}
vec3 laughingEyes(vec3 original, vec3 p) {
  vec2 a=vec2((p.x+0.125)/0.064,(p.y-0.527-0.31*(p.x+0.125))/0.034);
  vec2 b=vec2((p.x+0.010)/0.045,(p.y-0.563)/0.027);
  float front=1.0-smoothstep(0.10,0.14,-p.z);
  float left=(1.0-smoothstep(0.75,1.12,length(a)))*front;
  float right=(1.0-smoothstep(0.75,1.12,length(b)))*front;
  vec3 leftSkin=vec3(0.547917,0.321739,0.032835)+vec3(-0.015178,-0.006081,0.003848)*(p.x+0.125)/0.064+vec3(0.032727,0.025050,0.004048)*(p.y-0.527)/0.034;
  vec3 rightSkin=vec3(0.567986,0.336649,0.035593)+vec3(0.000243,-0.000593,-0.000239)*b.x+vec3(0.014700,0.009371,0.004179)*b.y;
  vec3 skin=mix(mix(original,leftSkin,left),rightSkin,right);
  float crease=max(eyelidCrease(p.xy,vec2(-0.171,-0.078),vec3(0.503,0.563,0.534),0.0068)*left,
                   eyelidCrease(p.xy,vec2(-0.043,0.017),vec3(0.552,0.586,0.569),0.0052)*right);
  return mix(skin,vec3(0.023,0.009,0.003),crease);
}
`;
const smoothEyeSurface=`
vec3 smoothLaugherLids(vec3 p){
 vec2 a=vec2((p.x+0.125)/0.064,(p.y-0.527)/0.034);
 vec2 b=vec2((p.x+0.010)/0.045,(p.y-0.563)/0.027);
 vec2 tilted=vec2(a.x,(p.y-0.527-0.31*(p.x+0.125))/0.034);
 float front=1.0-smoothstep(0.10,0.14,-p.z);
 float left=(1.0-smoothstep(0.75,1.12,length(tilted)))*front;
 float right=(1.0-smoothstep(0.75,1.12,length(b)))*front;
 float za=-0.037697+0.042064*a.x-0.034846*a.y-0.021132*a.x*a.x-0.000080*a.x*a.y-0.008052*a.y*a.y;
 float zb=-0.072274-0.032083*b.x-0.050571*b.y-0.019116*b.x*b.x-0.016872*b.x*b.y-0.006000*b.y*b.y;
 p.z=mix(mix(p.z,za,left),zb,right);return p;
}
`;

export function refineLaugherEyes(root){
 root.traverse(object=>{
  if(!object.isMesh)return;
  for(const material of (Array.isArray(object.material)?object.material:[object.material])){
   if(!material?.isMeshStandardMaterial||material.userData.laugherEyelids)return;
   material.userData.laugherEyelids='cover-fine-closed-eyes-v1';
   material.onBeforeCompile=shader=>{
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vLaugherPosition;\nvarying vec3 vLaugherSmoothNormal;\n'+smoothEyeSurface).replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed=smoothLaugherLids(transformed);\nvLaugherPosition=transformed;\nvLaugherSmoothNormal=normalMatrix*normalize((transformed-vec3(-0.08,0.43,-0.14))/vec3(0.0256,0.0324,0.0256));');
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\n'+eyeShader).replace('#include <map_fragment>','#include <map_fragment>\ndiffuseColor.rgb=laughingEyes(diffuseColor.rgb,vLaugherPosition);').replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\nnormal=normalize(mix(normal,normalize(vLaugherSmoothNormal),eyelidSkinMask(vLaugherPosition)));');
   };
   material.customProgramCacheKey=()=> 'cover-fine-closed-eyes-v1';material.needsUpdate=true;
  }
 });
 return root;
}
