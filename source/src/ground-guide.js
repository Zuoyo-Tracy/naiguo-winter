import * as THREE from 'three';
import {planWorldNavigation} from './world-navigation.js';
import './ground-guide.css';
export function createGroundGuide(scene,{getState,getSupport,getShape,onMap,onFollow=()=>false}){
 let generation=0,current=null,lastUpdate=0,noticeUntil=0;
 const root=new THREE.Group();root.name='Optional ground wayfinding';root.visible=false;scene.add(root);
 const arrow=new THREE.Shape();arrow.moveTo(-.7,-.3);arrow.lineTo(0,.45);arrow.lineTo(.7,-.3);arrow.lineTo(.7,-.65);arrow.lineTo(0,.08);arrow.lineTo(-.7,-.65);arrow.closePath();
 const geometry=new THREE.ShapeGeometry(arrow);geometry.rotateX(Math.PI/2);
 const border=new THREE.InstancedMesh(geometry,new THREE.MeshBasicMaterial({color:'#68472c',side:THREE.DoubleSide}),40);
 const ink=new THREE.InstancedMesh(geometry,new THREE.MeshBasicMaterial({color:'#dab87b',side:THREE.DoubleSide}),40);
 border.frustumCulled=ink.frustumCulled=false;root.add(border,ink);const matrix=new THREE.Object3D();
 const pill=document.createElement('aside');pill.className='ground-guide';pill.hidden=true;const label=document.createElement('button'),name=document.createElement('span'),distance=document.createElement('small'),cancel=document.createElement('button');label.className='ground-guide-place';label.append(name,distance);cancel.className='ground-guide-cancel';cancel.textContent='×';cancel.setAttribute('aria-label','结束路线引导');pill.append(label,cancel);document.body.append(pill);
 label.onclick=()=>current&&onMap(current.id);cancel.onclick=stop;
 const follow=document.createElement('button');follow.className='ground-guide-follow';follow.textContent='自动前往';pill.insertBefore(follow,cancel);
 follow.onclick=async()=>{
  if(!current||follow.disabled)return;
  const route=current;
  follow.disabled=true;follow.textContent='正在出发…';
  try{
   const started=await onFollow({id:route.id,name:route.name},{...route,cancelled:()=>current!==route});
   if(current!==route)return;
   if(started)pill.hidden=true;
   else distance.textContent='可以手动驾驶，也可以重新引路。';
  }finally{follow.disabled=false;follow.textContent='自动前往';}
 };
 function stop(){generation++;current=null;root.visible=false;pill.hidden=true;noticeUntil=0;}
 function cancelPlanning(){generation++;}
 async function begin(entry){
  const token=++generation,state=getState();const result=await planWorldNavigation(state,entry,{support:getSupport(),shape:getShape(),cancelled:()=>token!==generation});
  if(token!==generation)return {reason:'cancelled',points:[]};
  if(result.points.length){current={...result,id:entry.id,name:entry.name,category:entry.category};noticeUntil=0;lastUpdate=0;}
  return result;
 }
 function update(now,enabled){
  if(!enabled){root.visible=false;pill.hidden=true;return;}
  if(!current){root.visible=false;pill.hidden=now>=noticeUntil;return;}
  pill.hidden=!!getState().autoTour;if(now-lastUpdate<160)return;lastUpdate=now;
  const state=getState(),points=current.points;let closest=null;
  for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((state.x-a.x)*dx+(state.z-a.z)*dz)/(dx*dx+dz*dz||1))),y=a.y+(b.y-a.y)*t,d=Math.hypot(state.x-a.x-dx*t,state.z-a.z-dz*t,(state.groundY-y)*2);if(!closest||d<closest.d)closest={i,t,d,p:{x:a.x+dx*t,z:a.z+dz*t,y}};}
  if(!closest)return;
  name.textContent=current.name;label.setAttribute('aria-label','在地图中查看前往'+current.name+'的路线');
  if(closest.d>13){root.visible=false;distance.textContent='偏离路线 · 点此重新引路';return;}
  const remaining=[closest.p,...points.slice(closest.i)],length=remaining.slice(1).reduce((n,p,i)=>n+Math.hypot(p.x-remaining[i].x,p.z-remaining[i].z,p.y-remaining[i].y),0);
  const friend=current.category==='friend';
  if(length<(friend?1.5:6)&&closest.d<(friend?2:6)){name.textContent='已到达 · '+current.name;distance.textContent=friend?'停稳后，按 F 打个招呼':'继续慢慢逛吧';current=null;root.visible=false;noticeUntil=now+2300;return;}
  distance.textContent=(length>=1000?(length/1000).toFixed(1)+' km':Math.ceil(length/5)*5+' m')+' · 沿地面路标前往';
  root.visible=true;let total=0,next=5,count=0;
  for(let i=1;i<remaining.length&&count<40&&next<180;i++){
   const a=remaining[i-1],b=remaining[i],length=Math.hypot(b.x-a.x,b.z-a.z);if(length<.01)continue;
   while(next<=total+length&&count<40&&next<180){const t=(next-total)/length,x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t,y=current.renderGround(x,z)??a.y+(b.y-a.y)*t;matrix.position.set(x,y+.12,z);matrix.rotation.set(-Math.atan2(b.y-a.y,length),Math.atan2(b.x-a.x,b.z-a.z),0,'YXZ');matrix.scale.setScalar(1.12);matrix.updateMatrix();border.setMatrixAt(count,matrix.matrix);matrix.position.y+=.018;matrix.scale.setScalar(.9);matrix.updateMatrix();ink.setMatrixAt(count,matrix.matrix);count++;next+=5;}
   total+=length;
  }
  border.count=ink.count=count;border.instanceMatrix.needsUpdate=ink.instanceMatrix.needsUpdate=true;
 }
 function debug(){return current?{id:current.id,points:current.points,length:current.length,visible:root.visible,arrows:ink.count}:null;}
 return {begin,stop,cancelPlanning,update,debug,get path(){return current?.points||[];}};
}
