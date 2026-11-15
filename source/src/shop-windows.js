import * as T from 'three';

const geometries=new Map(),materials=new Map(),frameMaterial=new T.MeshStandardMaterial({color:'#766245',roughness:.72,metalness:.22}),mullionGeometry=new T.BoxGeometry(1,1,1);
function windowShape(width,height){
 const radius=width/2,shoulder=height-radius,shape=new T.Shape();shape.moveTo(-radius,0);shape.lineTo(radius,0);shape.lineTo(radius,shoulder);shape.absarc(0,shoulder,radius,0,Math.PI,false);shape.lineTo(-radius,0);return shape;
}
function geometry(width,height){
 const key=width+':'+height;if(geometries.has(key))return geometries.get(key);
 const shape=windowShape(width,height),pane=new T.ShapeGeometry(shape,24),uv=pane.attributes.uv,position=pane.attributes.position;
 for(let i=0;i<uv.count;i++)uv.setXY(i,position.getX(i)/width+.5,position.getY(i)/height);
 const path=new T.CatmullRomCurve3(shape.getPoints(32).map(p=>new T.Vector3(p.x,p.y,0)),true),frame=new T.TubeGeometry(path,90,.085,6,true),result={pane,frame};geometries.set(key,result);return result;
}
function windowMaterial(kind){
 if(materials.has(kind))return materials.get(kind);
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=384;const c=canvas.getContext('2d'),glow=c.createRadialGradient(128,125,12,128,175,260);
 glow.addColorStop(0,'#c5af82');glow.addColorStop(.5,'#9e8963');glow.addColorStop(1,'#534f40');c.fillStyle=glow;c.fillRect(0,0,256,384);
 // Quiet curtains and shelves give each shop a lived-in window without a bright billboard.
 for(const side of [-1,1]){c.save();if(side>0){c.translate(256,0);c.scale(-1,1);}c.fillStyle='#d0c1a466';c.beginPath();c.moveTo(0,0);c.lineTo(55,0);c.bezierCurveTo(48,85,25,145,31,214);c.bezierCurveTo(42,290,49,335,49,384);c.lineTo(0,384);c.fill();c.strokeStyle='#eee0c12b';c.lineWidth=2;for(let x=8;x<45;x+=9){c.beginPath();c.moveTo(x,0);c.quadraticCurveTo(x*.6,180,x,384);c.stroke();}c.restore();}
 c.fillStyle='#544d3d';c.fillRect(22,305,212,9);c.fillRect(24,361,208,9);
 const colors=['#625a52','#718278','#96694e','#ada178','#715d68'];
 if(kind%3===0){for(let i=0;i<13;i++){const h=35+(i*17)%35;c.fillStyle=colors[i%5];c.fillRect(30+i*15,305-h,11,h);c.fillStyle='#bfa67c';c.fillRect(31+i*15,311-h,9,2);}}
 else if(kind%3===1){for(let i=0;i<4;i++){const x=48+i*51;c.fillStyle='#ba946a';c.beginPath();c.ellipse(x,295,18,10,0,0,Math.PI*2);c.fill();c.strokeStyle='#e0c294';c.lineWidth=2;for(let j=-1;j<=1;j++){c.beginPath();c.moveTo(x+j*8-3,289);c.lineTo(x+j*8+2,298);c.stroke();}}}
 else{for(let i=0;i<3;i++){const x=42+i*69;c.fillStyle=colors[(i+kind)%5];c.fillRect(x,275,34,27);c.fillStyle='#d0b17d';c.fillRect(x+7,269,20,6);c.fillStyle='#373f3d';c.beginPath();c.arc(x+17,287,9,0,Math.PI*2);c.fill();}}
 c.fillStyle='#524f40';c.fillRect(177,326,21,34);c.strokeStyle='#60725c';c.lineWidth=4;for(let i=0;i<5;i++){c.beginPath();c.moveTo(187,330);c.quadraticCurveTo(159+i*12,305,157+i*13,316);c.stroke();}
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;
 const material=new T.MeshStandardMaterial({map:texture,color:'#a69a85',emissiveMap:texture,emissive:'#b68d51',emissiveIntensity:.12,roughness:.4,metalness:.08});materials.set(kind,material);return material;
}

// Measured against the generated facade in a 38 × 20 × 8 local reference box.
// New panes sit ahead of its damaged glass, behind the original carved stone arches.
export function attachShopWindows(shop,{width,height,depth,variant=0}){
 let rebuilt=false;shop.traverse(o=>{if(o.geometry?.userData.sourceAsset==='/assets/unified/shopfront.glb')rebuilt=true;});
 // The new facade has intact recessed glazing; the previous repair panes
 // were measured for a different, damaged facade and must not cover it.
 if(rebuilt)return null;
 const group=new T.Group();group.name='Repaired warm shop windows';group.scale.set(width/38/shop.scale.x,height/20/shop.scale.y,depth/8/shop.scale.z);shop.add(group);
 const windows=[...[[-11.7,5.3],[-4.75,5.5],[2,5.2]].map(([x,w])=>({x,y:2.25,z:1.84,w,h:7.15})),...[-11.65,.2,11.75].map(x=>({x,y:12.45,z:1.16,w:4.95,h:4.1}))];
 for(const [i,w]of windows.entries()){
  const opening=new T.Group();opening.position.set(w.x,w.y,w.z);group.add(opening);const {pane,frame}=geometry(w.w,w.h);
  const glass=new T.Mesh(pane,windowMaterial(variant%6));glass.name='Warm glazed shop window';opening.add(glass);const trim=new T.Mesh(frame,frameMaterial);trim.position.z=.06;opening.add(trim);
  for(const [x,y,sx,sy]of [[0,w.h/2,.09,w.h-.16],[0,w.h*.45,w.w-.08,.08],[0,w.h-w.w/2,w.w-.08,.1]]){const bar=new T.Mesh(mullionGeometry,frameMaterial);bar.position.set(x,y,.08);bar.scale.set(sx,sy,.1);opening.add(bar);}
 }
 return group;
}
