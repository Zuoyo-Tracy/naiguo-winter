import * as T from 'three';
export function riverMaterial(time){
 const material=new T.MeshPhysicalMaterial({color:0x4d9ccc,roughness:.24,metalness:.04,clearcoat:.24,clearcoatRoughness:.3,transparent:true,opacity:.59,depthWrite:false,side:T.DoubleSide});
 material.name='Clear blue water in shared winter lighting';
 material.onBeforeCompile=shader=>{
  shader.uniforms.uRiverTime=time;
  shader.vertexShader='varying vec2 vRiverUv;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvRiverUv=uv;');
  shader.fragmentShader='uniform float uRiverTime;varying vec2 vRiverUv;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
   vec2 riverP=vRiverUv;
   float riverPhase=riverP.y*170.0-uRiverTime*3.4+sin(riverP.x*37.0)*2.0;
   float finePhase=riverP.y*390.0-uRiverTime*6.0+riverP.x*25.0;
   // Suppress wavelengths smaller than a screen pixel rather than letting them shimmer.
   float riverFlow=sin(riverPhase)*(1.0-smoothstep(1.0,3.14,fwidth(riverPhase)));
   float riverFine=sin(finePhase)*(1.0-smoothstep(1.0,3.14,fwidth(finePhase)));
   float ribbon=pow(max(0.0,riverFlow*.65+riverFine*.35),6.0);
   diffuseColor.rgb*=.92+.08*sin(riverP.x*20.0+riverP.y*12.0);
   diffuseColor.rgb+=ribbon*vec3(.06,.09,.1);
   diffuseColor.a*=smoothstep(0.0,.035,riverP.x)*smoothstep(0.0,.035,1.0-riverP.x)*smoothstep(0.0,.035,riverP.y)*smoothstep(0.0,.035,1.0-riverP.y);
  `);
 };
 material.customProgramCacheKey=()=> 'clear-winter-river-v1';return material;
}

let riverbedTexture;
export function riverbedMaterial(){
 if(!riverbedTexture){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const context=canvas.getContext('2d');context.fillStyle='#667e83';context.fillRect(0,0,512,512);let seed=491;
  const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
  for(let row=-1;row<9;row++)for(let column=-1;column<9;column++){
   const x=column*64+(row%2)*32+random()*12,y=row*64+random()*14,rx=18+random()*12,ry=14+random()*10,tone=107+Math.floor(random()*30),gradient=context.createRadialGradient(x-7,y-8,2,x,y,rx);gradient.addColorStop(0,`rgb(${tone+6},${tone+14},${tone+13})`);gradient.addColorStop(1,`rgb(${tone-14},${tone-4},${tone-3})`);context.fillStyle=gradient;context.beginPath();context.ellipse(x,y,rx,ry,random(),0,Math.PI*2);context.fill();
  }
  riverbedTexture=new T.CanvasTexture(canvas);riverbedTexture.colorSpace=T.SRGBColorSpace;riverbedTexture.wrapS=riverbedTexture.wrapT=T.RepeatWrapping;riverbedTexture.repeat.set(32,40);riverbedTexture.anisotropy=4;
 }
 return new T.MeshStandardMaterial({map:riverbedTexture,color:0xb8c6c8,roughness:1,metalness:0});
}
