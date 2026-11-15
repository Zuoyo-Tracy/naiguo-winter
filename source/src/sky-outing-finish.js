import * as T from 'three';
import {mailLabels,bellLabels} from './sky-activities.js';
import {placeFinal} from './final-assets.js';
export function dressSkyOuting(e,root,props,animated,templates,place){
 const add=(name,x,y,z,w,h,d,parent=props)=>placeFinal(templates[name],parent,name,x,y,z,w,h,d);
 const fit=(o,w,h,d)=>{o.updateWorldMatrix(true,true);const size=new T.Box3().setFromObject(o).getSize(new T.Vector3());o.scale.multiply(new T.Vector3(w/size.x,h/size.y,d/size.z));return o;};
 const plaque=(text,x,y,z,w=2)=>{const c=document.createElement('canvas');c.width=256;c.height=72;const ctx=c.getContext('2d');ctx.fillStyle='#36564d';ctx.fillRect(0,0,256,72);ctx.strokeStyle='#c8ab6b';ctx.lineWidth=5;ctx.strokeRect(3,3,250,66);ctx.fillStyle='#f6e9ca';ctx.font='44px KaiTi,serif';ctx.textAlign='center';ctx.fillText(text,128,52);const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;const p=new T.Mesh(new T.PlaneGeometry(w,w*.28),new T.MeshBasicMaterial({map}));p.position.set(x,y,z);p.rotation.y=Math.PI;props.add(p);};
 const replace=(i,name,w,h,d)=>{const old=animated[i],p=old.position.clone();old.removeFromParent();const item=add(name,p.x,p.y,p.z,w,h,d);animated[i]=item;return item;};
 const removeStatic=()=>{for(const o of [...props.children])if(!animated.includes(o))o.removeFromParent();};
 if(e.kind==='sort'){
  removeStatic();add('sorting-desk',0,0,2,9,5,5);
  for(let i=0;i<3;i++){replace(i,'letter-bin',2,2.4,1.5).position.y=0;plaque(mailLabels[i],-4+i*4,2.7,-5.8,2.3);}
  add('mail-trunk',8,0,3,3,2.5,2);
 }
 if(e.kind==='garden'){
  for(let i=0;i<3;i++)replace(i,'cloud-flower',2.5,3,2.5).position.y=2.1;
  add('watering-can',2,3.4,-3,2.2,2,1.6);
 }
 if(e.kind==='bells'){
  removeStatic();const frame=add('bell-frame',0,0,-4,12,7,3);frame.updateWorldMatrix(true,true);const size=new T.Box3().setFromObject(frame).getSize(new T.Vector3());
  // The separately mounted bells keep their gentle swing animation.
  for(let i=0;i<3;i++){animated[i].position.x=(i-1)*size.x*.28;animated[i].position.y=size.y*.66;plaque(bellLabels[i],animated[i].position.x,size.y*.45,-4.9,1.5);}
 }
 if(e.kind==='kite'){removeStatic();for(let i=0;i<3;i++)replace(i,'kite',3.5,4,1);add('wind-vane',9,0,6,2.5,8,2.5);}
 if(e.kind==='stars'){
  const old=animated[0];old.removeFromParent();animated=[add('telescope',0,0,-2,6,6,5)];add('star-chart',7,0,3,4,3,3);
 }
 if(e.kind==='circuit')add('signal-console',0,0,-6,8,2.6,3);
 if(e.kind==='balance'){removeStatic();const bowl=add('balance-cradle',0,0,0,12,2.4,8);bowl.updateWorldMatrix(true,true);const size=new T.Box3().setFromObject(bowl).getSize(new T.Vector3());bowl.scale.x*=12/size.x;bowl.scale.z*=8/size.z;}
 if(e.kind==='ballast'){
  const old=animated[0];old.removeFromParent();const balloon=new T.Group();props.add(balloon);
  add('balloon-basket',0,2,0,4,3,3,balloon);add('balloon-envelope',0,9,0,7,10,7,balloon);
  const ropeMat=new T.MeshStandardMaterial({color:0xb5a07e,roughness:.95});for(const x of [-1.3,1.3])for(const z of [-1,1]){const rope=new T.Mesh(new T.CylinderGeometry(.045,.045,5,5),ropeMat);rope.position.set(x,6.5,z);balloon.add(rope);}
  for(let i=0;i<4;i++)add('sandbag',-6+i*4,0,-6,1.6,2,1.6);animated=[balloon];
 }
 if(e.kind==='cups'){removeStatic();for(let i=0;i<3;i++){add('tea-table',(i-1)*5,0,0,4.5,4.5,4.5);const cup=replace(i,'cloud-cup',3.3,2.5,3.3);cup.updateWorldMatrix(true,true);const h=new T.Box3().setFromObject(cup).getSize(new T.Vector3()).y;cup.rotation.x=Math.PI;cup.position.y=4.55+h;}}
 if(e.kind==='grid'){for(const tile of props.children)tile.position.y=animated.includes(tile)?5:4.1;fit(add('chessboard-table',0,0,0,12,8,12),12,4,12);}
 const building=e.kind==='garden'?'sky-conservatory':e.index===5?'sky-market':null;
 if(building){const obj=place(templates[building],root,0,0,10,18,15,10,false,true);obj.userData.finalAsset=building;obj.rotation.y=Math.PI;}
 if(e.index===4)add('brass-compass',-8,0,7,3,3,3);
 if(e.index===1||e.index===11)add('birdhouse',9,0,8,3,6,3);
 return animated;
}
