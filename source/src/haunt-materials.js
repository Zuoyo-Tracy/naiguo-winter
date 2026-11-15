import * as T from 'three';
// Shared, deterministic close-up grain for the structural parts surrounding the authored props.
export function hauntSurface(kind){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const ctx=canvas.getContext('2d');let seed=kind==='wood'?71:149;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 ctx.fillStyle='#ddddda';ctx.fillRect(0,0,256,256);
 if(kind==='wood'){
  for(let i=0;i<180;i++){const x=random()*256;ctx.strokeStyle=`rgba(51,32,22,${.03+random()*.13})`;ctx.lineWidth=.3+random()*1.2;ctx.beginPath();ctx.moveTo(x,0);ctx.bezierCurveTo(x+random()*6,80,x-random()*6,170,x,256);ctx.stroke();}
 }else{
  for(let i=0;i<1600;i++){const x=random()*256,y=random()*256,r=.5+random()*6;ctx.fillStyle=`rgba(65,70,67,${random()*.05})`;ctx.beginPath();ctx.ellipse(x,y,r,r*.55,0,0,Math.PI*2);ctx.fill();}
 }
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.anisotropy=4;return texture;
}
