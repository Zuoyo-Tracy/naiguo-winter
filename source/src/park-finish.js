import {archPierProfiles,placeArchPierProfiles} from './arch-clearance.js';
import * as T from 'three';
import {loadFinalAssets,finalParkNames,placeFinal} from './final-assets.js';
import {sceneryAllowed,cohesionSurface} from './cohesion-layout.js';
function softRoses(obj,parent){
 const b=new T.Box3().setFromObject(obj),size=b.getSize(new T.Vector3()),c=b.getCenter(new T.Vector3()),sites=[];for(let i=0;i<10;i++){const a=i/9*Math.PI;sites.push([c.x+Math.cos(a)*size.x*.36,b.min.y+size.y*(.6+Math.sin(a)*.31)]);}for(const side of [-1,1])for(const f of [.23,.4,.55])sites.push([c.x+side*size.x*.36,b.min.y+size.y*f]);
 const petals=new T.InstancedMesh(new T.SphereGeometry(1,8,6),new T.MeshStandardMaterial({roughness:.95}),sites.length*6),m=new T.Matrix4(),q=new T.Quaternion();let k=0;for(const [x,y]of sites)for(let i=0;i<6;i++){const a=i*Math.PI*2/5,r=i===5?0:.13;m.compose(new T.Vector3(x+Math.cos(a)*r,y+Math.sin(a)*r,b.min.z-.025),q,new T.Vector3(i===5?.07:.13,i===5?.07:.16,.07));petals.setMatrixAt(k,m);petals.setColorAt(k++,new T.Color(i===5?0xe4c489:0xe6b7c6));}petals.computeBoundingSphere();petals.name='Soft winter rose blossoms';parent.add(petals);
}
export async function loadParkFinish(group,solids){
 const models=await loadFinalAssets(finalParkNames),placements=[];
 const occupied=(x,z,r)=>solids.some(s=>{const dx=x-s.x,dz=z-s.z;if(s.r)return Math.hypot(dx,dz)<r+s.r+.8;const a=s.rotate||0,u=dx*Math.cos(a)-dz*Math.sin(a),v=dx*Math.sin(a)+dz*Math.cos(a);return Math.hypot(Math.max(0,Math.abs(u)-(s.width||1)/2),Math.max(0,Math.abs(v)-(s.depth||1)/2))<r+.8;});
 const specs=[
 ['stone-fountain',-270,810,7,4.6,7,1],['park-kiosk',170,815,6,6,5,1],
 ['rose-trellis',-270,970,6,5,2,2],['park-rocker',170,970,2.5,2.4,1.7,2],
 ['flower-cart',350,790,4,3.2,2.4,2],['luggage-cart',-100,515,3.2,3.5,2,2],
 ['snow-pine',300,515,7,12,7,4],['snow-bollard',350,970,1,1.5,1,4]
 ];
 for(const [name,cx,cz,w,h,d,count]of specs)for(let instance=0;instance<count;instance++){
  const r=Math.hypot(w,d)/2,candidates=[];
  for(let dz=-75;dz<=75;dz+=5)for(let dx=-75;dx<=75;dx+=5)candidates.push({x:cx+dx,z:cz+dz,distance:Math.hypot(dx,dz)});
  candidates.sort((a,b)=>a.distance-b.distance);const p=candidates.find(p=>sceneryAllowed(p.x,p.z,r)&&!occupied(p.x,p.z,r));
  if(!p)throw Error('No safe park site for '+name);
  const levels=[[-.5,-.5],[-.5,.5],[.5,-.5],[.5,.5],[0,0]].map(([dx,dz])=>cohesionSurface(p.x+dx*w,p.z+dz*d)).filter(Number.isFinite),y=Math.min(...levels),obj=placeFinal(models[name],group,name,p.x,y-.08,p.z,w,h,d,Math.PI);
  obj.updateWorldMatrix(true,true);const b=new T.Box3().setFromObject(obj),s=b.getSize(new T.Vector3()),c=b.getCenter(new T.Vector3());
  obj.userData.stationaryPark=true;if(name==='rose-trellis')softRoses(obj,group);
  const solid={id:'final-'+name,x:c.x,z:c.z,y:b.min.y,width:s.x,depth:s.z,height:s.y};if(name==='rose-trellis')solids.push(...placeArchPierProfiles(archPierProfiles(obj,2.6),{x:p.x,z:p.z,y,yaw:Math.PI}));else solids.push(solid);placements.push({name,x:p.x,z:p.z,y,solid});
 }
 group.userData.finalAssets=finalParkNames;
 if(new URLSearchParams(location.search).has('test'))window.__parkFinish={placements,names:finalParkNames};
 return placements;
}
