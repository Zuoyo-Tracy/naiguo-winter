import * as T from 'three';
import {hitMushroom} from './mushroom-rules.js';

export function createMushroomParty(root,boothSource,mushroomSource){
 const v=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),wood=new T.MeshStandardMaterial({color:0x624536,roughness:.9}),gold=new T.MeshStandardMaterial({color:0xe2b767,metalness:.5,roughness:.35});
 function mesh(g,m,parent,x=0,y=0,z=0){const o=new T.Mesh(g,m);o.position.set(x,y,z);parent.add(o);return o;}
 function fit(source,parent,width,height,depth){const raw=source.clone(true),b=new T.Box3().setFromObject(raw),s=b.getSize(v()),c=b.getCenter(v());raw.position.sub(v(c.x,b.min.y,c.z));const g=new T.Group();g.add(raw);g.scale.set(width/s.x,height/s.y,depth/s.z);parent.add(g);return g;}
 const boothBox=new T.Box3().setFromObject(boothSource),size=boothBox.getSize(v()),spacing=.95/(size.x/size.y*2.7)*8.4,holes=[],fixtures=[];
 for(const z of [-1.9,1.9]){const b=fit(boothSource,root,8.4,2.4,3.5);b.position.z=z;b.name='Mushroom party carved game cabinet';fixtures.push(b);for(let i=0;i<3;i++)holes.push({x:(i-1)*spacing,z,y:2.34});}
 function label(text,w,h,color='#f6dfab',background='#4c6654'){
  const canvas=document.createElement('canvas');canvas.width=text.length===1?160:768;canvas.height=160;const ctx=canvas.getContext('2d');ctx.fillStyle=background;ctx.fillRect(0,0,canvas.width,160);ctx.strokeStyle='#d8ba80';ctx.lineWidth=7;ctx.strokeRect(8,8,canvas.width-16,144);ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=text.length===1?'bold 115px sans-serif':'bold 66px sans-serif';ctx.fillText(text,canvas.width/2,85);const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;return new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map}));
 }
 const sign=label('蘑菇派对',7,1.3);sign.position.set(0,4.5,-4.1);root.add(sign);for(const x of [-4,4])fixtures.push(mesh(new T.CylinderGeometry(.10,.14,5,10),wood,root,x,2.5,-4.2));
 const lights=[];for(let i=0;i<13;i++){const m=mesh(new T.SphereGeometry(.09,10,8),new T.MeshBasicMaterial({color:0xeed6a0}),root,-3.8+i*.633,5.25-Math.sin(i*Math.PI/12)*.16,-4);lights.push(m);}
 const variants=[],proxies=[],ringMaterial=new T.MeshBasicMaterial({color:0xffd979,transparent:true,opacity:0,depthWrite:false});
 function mushroom(type){const group=new T.Group(),raw=mushroomSource.clone(true),b=new T.Box3().setFromObject(raw),s=b.getSize(v()),c=b.getCenter(v());raw.position.sub(v(c.x,b.min.y,c.z));const body=new T.Group();body.add(raw);body.scale.setScalar(1.15/s.y);group.add(body);
  raw.traverse(o=>{if(!o.isMesh)return;o.material=Array.isArray(o.material)?o.material.map(m=>m.clone()):o.material.clone();for(const mat of Array.isArray(o.material)?o.material:[o.material]){if(type==='gold'||type==='king'){mat.color.setHex(0xffd477);mat.emissive?.setHex(0x5b3409);}if(type==='clock'){mat.color.setHex(0x8acdf5);mat.emissive?.setHex(0x123a56);}}});
  if(type==='gold'||type==='king'){mesh(new T.CylinderGeometry(.34,.30,.18,16,1,true),gold,group,0,1.12,0);for(let j=0;j<5;j++){const a=j*Math.PI*2/5;mesh(new T.ConeGeometry(.10,.30,4),gold,group,Math.cos(a)*.28,1.34,Math.sin(a)*.28);}}
  if(type==='clock'){mesh(new T.CircleGeometry(.23,24),new T.MeshBasicMaterial({color:0xeefbff}),group,0,.55,.4);mesh(new T.TorusGeometry(.23,.027,8,24),gold,group,0,.55,.415);mesh(new T.BoxGeometry(.025,.14,.02),wood,group,0,.61,.42);mesh(new T.BoxGeometry(.12,.025,.02),wood,group,.05,.55,.42);}
  group.userData.size=type==='king'?1.6:1;group.name='Party mushroom '+type;return group;
 }
 for(const [i,h] of holes.entries()){
  const hole=mesh(new T.CircleGeometry(1.03,40),new T.MeshBasicMaterial({color:0x251e20}),root,h.x,h.y+.018,h.z);hole.rotation.x=-Math.PI/2;
  const number=label(String(i+1),.62,.48,'#efe0bd','#67513d');number.position.set(h.x,2.43,h.z+1.16);number.rotation.x=-Math.PI/2;root.add(number);
  const models={};for(const type of ['normal','gold','clock','king']){const m=mushroom(type);m.position.set(h.x,h.y,h.z);m.visible=false;root.add(m);models[type]=m;}variants.push(models);
  const proxy=mesh(new T.SphereGeometry(.87,12,8),new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}),root,h.x,h.y+.65,h.z);proxy.scale.y=1.1;proxy.userData.target=i;proxy.name='Mushroom hit area '+i;proxies.push(proxy);
 }
 const hammer=new T.Group();hammer.name='Soft mushroom mallet';root.add(hammer);mesh(new T.CylinderGeometry(.065,.075,1.35,10),wood,hammer,0,-.65,0);const head=mesh(new T.CylinderGeometry(.27,.27,.85,20),new T.MeshStandardMaterial({color:0xc58ca6,roughness:.8}),hammer);head.rotation.z=Math.PI/2;for(const x of [-.42,.42]){const cap=mesh(new T.SphereGeometry(.27,16,10),new T.MeshStandardMaterial({color:0xe8b6c8,roughness:.8}),hammer,x,0,0);cap.scale.x=.4;}
 const burstGeometry=new T.BufferGeometry(),burstPositions=new Float32Array(72*3);burstGeometry.setAttribute('position',new T.BufferAttribute(burstPositions,3));const burst=new T.Points(burstGeometry,new T.PointsMaterial({color:0xffdf8f,size:.08,transparent:true,opacity:1,depthWrite:false}));burst.name='Mushroom hit confetti';burst.frustumCulled=false;root.add(burst);
 const strikeRing=mesh(new T.RingGeometry(.75,.80,40),ringMaterial,root);strikeRing.rotation.x=-Math.PI/2;
 let seenStrike=null;
 function animate(r,time){
  for(let i=0;i<6;i++){
   const h=holes[i],slot=r?.slots[i],after=r?.phase==='playing'&&r?.lastStrike?.index===i&&r.lastStrike.result==='hit'&&r.time-r.lastStrike.time<.26?r.lastStrike:null;
   proxies[i].scale.set(slot?.type==='king'?1.25:1,slot?.type==='king'?1.7:1.1,slot?.type==='king'?1.25:1);proxies[i].position.y=h.y+(slot?.type==='king'?1:.65);
   const preview=!r||r.phase==='ready',type=preview?['normal','gold','clock','normal','normal','gold'][i]:slot?.type||after?.type;
   for(const [key,m] of Object.entries(variants[i])){m.visible=key===type;if(!m.visible)continue;const size=m.userData.size;let squash=1,pop=1;
    if(slot){pop=Math.min(1,(r.time-slot.born)/.18,Math.max(0,(slot.until-r.time)/.16));if(r.time-slot.hitAt<.24)squash=.6+.4*Math.min(1,(r.time-slot.hitAt)/.24);}
    if(after)squash=Math.max(.06,1-(r.time-after.time)/.26);
    m.scale.set(size*(1+(1-squash)*.3),size*squash,size*(1+(1-squash)*.3));m.position.set(h.x,h.y-(1-pop)*1.2*size,h.z);m.rotation.z=preview?Math.sin(time*2+i)*.05:Math.sin(time*7+i)*.045;
   }
  }
  const strike=r?.lastStrike,age=strike?r.time-strike.time:9;hammer.visible=!!r&&r.phase==='playing';burst.visible=!!strike&&strike.result!=='miss'&&age<.55;
  if(hammer.visible){const h=strike?holes[strike.index]:{x:4,z:3,y:2.34},swing=Math.max(0,1-age/.3);hammer.position.set(h.x+.32,h.y+1.45-Math.sin(Math.min(1,age/.3)*Math.PI)*.75,h.z+.42);hammer.rotation.set(-.6+swing*.7,0,-.25+swing*.5);}
  if(burst.visible){const h=holes[strike.index];for(let i=0;i<72;i++){const a=i*2.399,spread=age*(1.5+(i%5)*.3);burstPositions[i*3]=h.x+Math.cos(a)*spread;burstPositions[i*3+1]=h.y+.8+age*(2+(i%4)*.3)-age*age*5;burstPositions[i*3+2]=h.z+Math.sin(a)*spread;}burstGeometry.attributes.position.needsUpdate=true;burst.material.opacity=1-age/.55;}
  strikeRing.visible=!!strike&&age<.4;if(strikeRing.visible){const h=holes[strike.index];strikeRing.position.set(h.x,h.y+.035,h.z);strikeRing.scale.setScalar(.8+age*2);ringMaterial.opacity=(1-age/.4)*.7;ringMaterial.color.setHex(strike.result==='miss'?0xbea6af:0xffd979);}
  const fever=r&&r.phase==='playing'&&r.time<r.feverUntil;lights.forEach((m,i)=>m.material.color.setHex(fever?(Math.floor(time*4+i)%2?0xffcf72:0xeeb4d6):0xeed6a0));
  if(strike&&strike!==seenStrike){seenStrike=strike;window.dispatchEvent(new CustomEvent('winter-mushroom-hit',{detail:strike}));}if(!r)seenStrike=null;
 }
 function pick(ray,r){const hit=ray.intersectObjects(proxies)[0];return hit?hitMushroom(r,hit.object.userData.target):false;}
 function cameraAndActor(camera,actor,dt){actor.visible=false;const distance=Math.max(11.5,5.2/(Math.tan(25*Math.PI/180)*Math.max(.3,camera.aspect))),target=root.localToWorld(v(0,1.9,0)),desired=target.clone().add(v(0,distance*.72,distance*.70));camera.position.lerp(desired,1-Math.exp(-7*dt));camera.fov=50;camera.lookAt(target);camera.updateProjectionMatrix();return root.localToWorld(v(0,0,8));}
 animate(null,0);return {animate,pick,cameraAndActor,holes,proxies,fixtures};
}
