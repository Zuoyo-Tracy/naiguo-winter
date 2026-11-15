import * as THREE from 'three';

let paving;
export function winterPavingTextures(){
 if(paving)return paving;
 const color=document.createElement('canvas'),relief=document.createElement('canvas');
 color.width=color.height=relief.width=relief.height=512;
 const c=color.getContext('2d'),h=relief.getContext('2d');
 c.fillStyle='#82786a';c.fillRect(0,0,512,512);h.fillStyle='#363636';h.fillRect(0,0,512,512);
 let seed=71;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
 // Eight courses and four stones fit the tile exactly. Copy edge stones to
 // their opposite edge so colour, mortar and relief all repeat without a seam.
 for(let row=0;row<8;row++)for(let col=0;col<4;col++){
  const x=col*128+(row%2)*64,y=row*64,value=153+Math.floor(random()*25),specks=[];
  for(let n=0;n<90;n++)specks.push({x:random()*120+4,y:random()*56+4,r:.2+random()*.7,light:random()>.55});
  for(const shift of [0,-512]){
   const left=x+shift;if(left>511||left+128<0)continue;
   c.fillStyle=`rgb(${value+12},${value+7},${value-1})`;
   c.beginPath();c.roundRect(left+1.5,y+1.5,125,61,3);c.fill();
   const wash=c.createLinearGradient(left,y,left+128,y+64);wash.addColorStop(0,'rgba(255,246,223,.13)');wash.addColorStop(.5,'rgba(230,220,201,0)');wash.addColorStop(1,'rgba(67,58,49,.10)');c.fillStyle=wash;c.fill();
   c.strokeStyle='rgba(244,229,207,.24)';c.lineWidth=1;c.beginPath();c.moveTo(left+5,y+2.5);c.lineTo(left+123,y+2.5);c.moveTo(left+2.5,y+5);c.lineTo(left+2.5,y+58);c.stroke();
   c.strokeStyle='rgba(69,60,48,.2)';c.beginPath();c.moveTo(left+5,y+62);c.lineTo(left+122,y+62);c.stroke();
   for(const p of specks){c.fillStyle=p.light?'rgba(254,242,220,.14)':'rgba(65,56,45,.11)';c.beginPath();c.arc(left+p.x,y+p.y,p.r,0,Math.PI*2);c.fill();}
   for(const [inset,shade] of [[1.5,100],[2.5,165],[3.5,211],[4.5,229]]){
    h.fillStyle=`rgb(${shade},${shade},${shade})`;h.beginPath();h.roundRect(left+inset,y+inset,128-inset*2,64-inset*2,Math.max(.5,4-inset*.4));h.fill();
   }
  }
 }
 const texture=canvas=>{const t=new THREE.CanvasTexture(canvas);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;return t;};
 paving={color:texture(color),relief:texture(relief)};return paving;
}
