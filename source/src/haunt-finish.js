import * as T from 'three';
import {loadFinalAssets,finalHauntNames,placeFinal} from './final-assets.js';
import {hauntPose,hauntGates,hauntWidth} from './haunt-route.js';
import {hauntCourts,mazePaths,mazePose} from './haunt-maze.js';
export async function loadHauntFinish(scene,root){
 const models=await loadFinalAssets(finalHauntNames),pieces=[];root.updateWorldMatrix(true,true);const occupied=root.children.map(o=>new T.Box3().setFromObject(o));
 const add=(name,parent,x,y,z,w,h,d,yaw=0)=>{const obj=placeFinal(models[name],parent,name,x,y,z,w,h,d,yaw);pieces.push(obj);return obj;};
 const at=(s,l=0)=>{const p=hauntPose(s,l),g=new T.Group();g.position.set(p.x,p.y,p.z);g.rotation.y=p.yaw;root.add(g);return g;};
 for(const [i,c]of hauntCourts.entries()){
  const gate=at(c.start-8),moon=add('haunted-moon-gate',gate,0,-.6,0,13,9,4);gate.updateWorldMatrix(true,true);const plaque=scene.getObjectByName('Haunt courtyard name '+c.title);if(plaque){const origin=new T.Vector3(0,7.4,-5).applyMatrix4(gate.matrixWorld),direction=new T.Vector3(0,0,1).transformDirection(gate.matrixWorld),hit=new T.Raycaster(origin,direction,0,10).intersectObject(moon,true)[0];if(hit)plaque.position.z=gate.worldToLocal(hit.point.clone()).z-.025;}
  const mid=at((c.start+c.end)/2);
  if(i===0)add('haunt-well',mid,0,0,0,2.5,3.5,3);
  if(i===1){add('haunted-opera-stage',mid,0,0,0,3.1,4.5,6);add('haunt-mask',mid,0,1.5,-.6,.6,.7,.4);}
  if(i===2){add('haunt-door',mid,0,0,0,2.2,3.7,1);add('haunt-bell',mid,0,3,0,.55,.8,.55);}
 }
 const paths=mazePaths().flatMap(path=>Array.from({length:Math.ceil((path.end-path.start)/3)+1},(_,i)=>{const s=Math.min(path.end,path.start+i*3);return {...mazePose(s,0,path.choices),w:hauntWidth(s)};}));
 // Decorations use real bounds and must clear every branch, including the adjacent return lane.
 const safe=(obj)=>{obj.updateWorldMatrix(true,true);const b=new T.Box3().setFromObject(obj);return !occupied.some(old=>old.intersectsBox(b))&&paths.every(p=>{const x=Math.max(b.min.x,Math.min(p.x,b.max.x)),z=Math.max(b.min.z,Math.min(p.z,b.max.z));return Math.hypot(x-p.x,z-p.z)>p.w+.55;});};
 const settings=[['haunt-screen',3,3.2,1],['haunt-altar',2.5,1.3,1.2],['haunt-urn',1.3,2.4,1.3],['haunt-bamboo',1.7,3.7,1.5],['haunt-stone-lion',1.4,1.9,1.4],['haunt-lantern',.65,1.3,.65]];
 for(const [i,[name,w,h,d]]of settings.entries())for(let j=0;j<3;j++){
  let placed=false;for(const shift of [0,40,-40,80,-80]){if(placed)break;for(const l of [3.5,-3.5,5.5,-5.5,8,-8,12,-12]){
   const g=at(190+i*112+j*260+shift,l),obj=add(name,g,0,0,0,w,h,d,Math.PI/2);
   if(safe(obj)){occupied.push(new T.Box3().setFromObject(obj));placed=true;break;}obj.removeFromParent();g.removeFromParent();pieces.pop();
  }}if(!placed)throw Error('No clear haunted decoration site: '+name);
 }
 for(const gate of hauntGates){const parent=scene.getObjectByName('Haunt unlock door '+gate.s);if(!parent)continue;for(const old of [...parent.children])old.removeFromParent();const door=add('haunt-door',parent,0,0,0,3.1,2.7,.5);door.updateWorldMatrix(true,true);const inverse=parent.matrixWorld.clone().invert(),b=new T.Box3();door.traverse(o=>{if(o.isMesh){const g=o.geometry.attributes.position,p=new T.Vector3();for(let i=0;i<g.count;i++){p.fromBufferAttribute(g,i).applyMatrix4(o.matrixWorld).applyMatrix4(inverse);b.expandByPoint(p);}}});const local=b.getSize(new T.Vector3());door.scale.multiply(new T.Vector3(3.1/local.x,2.7/local.y,.3/local.z));}
 for(const obj of pieces)obj.traverse(o=>{if(o.isMesh){for(const mat of Array.isArray(o.material)?o.material:[o.material]){mat.roughness=Math.max(.8,mat.roughness||0);mat.metalness=Math.min(.12,mat.metalness||0);if(obj.userData.finalAsset==='haunt-lantern'){mat.emissive.set(0xa33a20);mat.emissiveMap=mat.map;mat.emissiveIntensity=.38;}}}});
 root.userData.finalAssets=finalHauntNames;
 if(new URLSearchParams(location.search).has('test'))window.__hauntFinish={pieces:pieces.map(o=>({name:o.userData.finalAsset})),names:finalHauntNames};
 return pieces;
}
