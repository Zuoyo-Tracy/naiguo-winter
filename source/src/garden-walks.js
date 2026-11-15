import {surfaceReliefGLSL} from './surface-relief.js';
import * as T from 'three';
import {gardenPaths,cohesionSurface,segmentPosition,sceneryAllowed,nearbyRails} from './cohesion-layout.js';
import {attractions} from './park-attractions.js';
import {carnivalWalkways} from './carnival-layout.js';

// An avenue is read at eye level: low flower borders, repeated tree canopies,
// occasional seats. All are generated assets, laid out around clear crossings.
export function walkPlantingPlan(){
 const plan=[];
 for(const [x,z0,z1,edge] of [[-50,480,660,26],[455,180,370,18],[615,180,370,18],[390,700,1000,18]]){
  for(let z=z0,i=0;z<=z1;z+=22,i++)for(const side of [-1,1]){
   const px=x+side*edge,tree=i%2===0,r=tree?5:3;
   if(!sceneryAllowed(px,z,r))continue;
   const support=[[-r/2,0],[r/2,0],[0,-r/2],[0,r/2]].map(([dx,dz])=>cohesionSurface(px+dx,z+dz));
   if(support.some(y=>y===undefined)||Math.max(...support)-Math.min(...support)>.85)continue;
   plan.push({id:tree?'fir-grove':'garden',x:px,z,y:cohesionSurface(px,z),width:tree?8.5:6,height:tree?13+(i%3):1.1,depth:tree?6.5:3,r,yaw:tree?i*.7:Math.PI/2});
  }
 }
 return plan;
}
export function gardenGroundMaterial(){
 const m=new T.MeshStandardMaterial({vertexColors:true,roughness:.98});
 m.onBeforeCompile=s=>{
  s.vertexShader='varying vec3 vGardenWorld;\n'+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvGardenWorld=(modelMatrix*vec4(transformed,1.)).xyz;');
  s.fragmentShader=surfaceReliefGLSL+`varying vec3 vGardenWorld;
   float gardenHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
   float gardenNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(gardenHash(i),gardenHash(i+vec2(1.,0.)),f.x),mix(gardenHash(i+vec2(0.,1.)),gardenHash(i+vec2(1.,1.)),f.x),f.y);}
   `+s.fragmentShader;
  s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   float mottling=gardenNoise(vGardenWorld.xz*.14)*.65+gardenNoise(vGardenWorld.xz*.63)*.35;
   float detailFade=1.-smoothstep(.18,.65,length(fwidth(vGardenWorld.xz)));
   float grain=(gardenNoise(vGardenWorld.xz*8.)-.5)*detailFade;
   diffuseColor.rgb*=.84+.22*mottling+.045*grain;
  `);
  s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
   float snowFade=1.-smoothstep(24.,75.,length(vViewPosition));
   float snowHeight=mottling*.12+grain*.04;
   normal=winterRelief(-vViewPosition,normal,vec2(dFdx(snowHeight),dFdy(snowHeight))*snowFade,faceDirection);
  `);
 };
 m.customProgramCacheKey=()=> 'winter-garden-snow-relief-v2';return m;
}
export function addWalkBorders(parent){
 const positions=[],indices=[],allPaths=[...gardenPaths,...carnivalWalkways];
 for(const path of gardenPaths){const dx=path.x2-path.x1,dz=path.z2-path.z1,length=Math.hypot(dx,dz),nx=dz/length,nz=-dx/length;
  for(const side of [-1,1])for(let s=1;s<length-1;s+=2){
   const edge=path.width/2+(path.shoulder||0),x=path.x1+dx*s/length+nx*side*edge,z=path.z1+dz*s/length+nz*side*edge,y=cohesionSurface(x,z);
   if(y===undefined||allPaths.some(p=>p!==path&&segmentPosition(x,z,p).d<p.width/2+(p.shoulder||0)+2))continue;
   if(nearbyRails(x,z).some(p=>Math.hypot(x-p.x,z-p.z)<8)||attractions.some(a=>Math.hypot(x-a.x,z-a.z)<a.r+5||segmentPosition(x,z,{x1:a.x,z1:a.z,x2:a.anchor.x,z2:a.anchor.z}).d<11))continue;
   const base=positions.length/3;
   for(const up of [0,.17])for(const along of [-1,1])for(const across of [-.16,.16]){
    const px=x+dx/length*along+nx*across,pz=z+dz/length*along+nz*across;
    positions.push(px,(cohesionSurface(px,pz)??y)+.065+up,pz);
   }
   for(const [a,b,c] of [[4,6,5],[5,6,7],[0,4,1],[1,4,5],[2,3,6],[3,7,6],[0,2,4],[2,6,4],[1,5,3],[3,5,7]])indices.push(base+a,base+b,base+c);
  }
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();const mesh=new T.Mesh(g,new T.MeshStandardMaterial({color:'#82735e',roughness:.94}));mesh.name='Continuous sandstone garden path edging';parent.add(mesh);
}
