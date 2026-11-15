import {hauntSurface} from './haunt-materials.js';
import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {hauntPose} from './haunt-route.js';
import {hauntCourts,mazePaths,mazePose,mazeOffset,hauntWidth} from './haunt-maze.js';
export function buildMazeRoad(material){
 const pos=[],uv=[],ix=[];
 for(const path of mazePaths()){
  const count=Math.ceil((path.end-path.start)/3);
  for(let i=0;i<count;i++){
   const s0=path.start+(path.end-path.start)*i/count,s1=path.start+(path.end-path.start)*(i+1)/count;
   const n=pos.length/3;
   for(const s of [s0,s1]){
    const p=hauntPose(s),offset=path.court?mazeOffset(s)*path.side:0,w=hauntWidth(s);
    // Split a shared junction down the middle; the two paved halves never overlap.
    let lo=offset-w,hi=offset+w;
    if(path.side===1)lo=Math.max(0,lo);if(path.side===-1)hi=Math.min(0,hi);
    for(const l of [lo,hi]){pos.push(p.x+Math.cos(p.yaw)*l,p.y,p.z-Math.sin(p.yaw)*l);uv.push(l/3.2,s*.22/3.2);}
   }
   ix.push(n,n+1,n+2,n+1,n+3,n+2);
  }
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();const road=new T.Mesh(g,material);road.name='Haunted stone route';return road;
}
export function buildMazeCourts(root){
 const group=new T.Group();group.name='Moon gates and haunted maze courtyards';root.add(group);
 const mats={plaster:new T.MeshStandardMaterial({color:0x7d8182,roughness:.96}),wood:new T.MeshStandardMaterial({color:0x3e2925,roughness:.9}),tile:new T.MeshStandardMaterial({color:0x283e43,roughness:.88}),stone:new T.MeshStandardMaterial({color:0x777672,roughness:.98}),gold:new T.MeshStandardMaterial({color:0xc0a56c,roughness:.65}),red:new T.MeshStandardMaterial({color:0x932f2d,roughness:.8}),snow:new T.MeshStandardMaterial({color:0xc2cbd2,roughness:1})};
 const grain=hauntSurface('wood'),plaster=hauntSurface('plaster');mats.wood.map=grain;mats.wood.bumpMap=grain;mats.wood.bumpScale=.025;for(const name of ['plaster','stone','tile']){mats[name].map=plaster;mats[name].bumpMap=plaster;mats[name].bumpScale=.018;}
 const cube=new T.BoxGeometry(1,1,1);
 function box(parent,w,h,d,x,y,z,mat){const m=new T.Mesh(cube,mats[mat]);m.scale.set(w,h,d);m.position.set(x,y,z);parent.add(m);return m;}
 function at(s,l=0){const p=hauntPose(s,l),g=new T.Group();g.position.set(p.x,p.y,p.z);g.rotation.y=p.yaw;group.add(g);return g;}
 function plaque(parent,text,y=4){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const c=canvas.getContext('2d');c.fillStyle='#302a2a';c.fillRect(0,0,512,128);c.strokeStyle='#b39b69';c.lineWidth=6;c.strokeRect(6,6,500,116);c.fillStyle='#e9d4a9';c.font='54px KaiTi,serif';c.textAlign='center';c.fillText(text,256,84);const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;const m=new T.Mesh(new T.PlaneGeometry(3.8,.95),new T.MeshBasicMaterial({map:texture,side:T.DoubleSide}));m.name='Haunt courtyard name '+text;m.rotation.y=Math.PI;m.position.set(0,y,-.34);parent.add(m);}
 for(const [ci,c] of hauntCourts.entries()){
  const gate=at(c.start-8);plaque(gate,c.title,7.4);
  // Enclosing walls, pierced lattice panels and stepped tile coping make each loop readable.
  for(const side of [-1,1])for(let s=c.start+22;s<c.end-22;s+=12){
   const p=mazePose(s,0,{[c.id]:side}),g=new T.Group();g.position.set(p.x,p.y,p.z);g.rotation.y=p.yaw;group.add(g);
   const x=side*(hauntWidth(s)+.4);
   box(g,.25,.8,2.2,x,.4,0,'plaster');box(g,.25,.45,2.2,x,2.6,0,'plaster');box(g,.38,.18,2.45,x,2.94,0,'tile');
   for(const z of [-1.02,1.02]){box(g,.3,2,.16,x,1.6,z,'wood');box(g,.55,.18,.5,x,3.08,z,'tile');}
   for(let z=-.8;z<=.81;z+=.4)box(g,.12,1.5,.055,x,1.6,z,'wood');
   for(const y of [1.1,1.65,2.2])box(g,.13,.055,2,x,y,0,'wood');
   if(s>c.start+45&&s<c.end-45){const inner=-side*(hauntWidth(s)+.35),view=Math.abs(s-(c.start+c.end)/2)<28;box(g,.24,view?.65:2.3,2.25,inner,view?.325:1.15,0,'plaster');box(g,.4,.15,2.4,inner,2.38,0,'tile');if(view)for(const z of [-1.02,1.02])box(g,.13,1.65,.1,inner,1.5,z,'wood');}
   box(g,.65,.08,.12,side*(hauntWidth(s)+.12),2.75,0,'wood');
  }

 }
 // Static architectural pieces are merged by material to keep the richer sets inexpensive.
 group.updateMatrixWorld(true);const buckets=new Map(),remove=[];
 group.traverse(o=>{if(o.isMesh&&Object.values(mats).includes(o.material)){const g=o.geometry.clone().applyMatrix4(o.matrixWorld);const list=buckets.get(o.material)||[];list.push(g);buckets.set(o.material,list);remove.push(o);}});
 for(const o of remove)o.removeFromParent();for(const [mat,geometries] of buckets){const merged=mergeGeometries(geometries.map(g=>g.index?g.toNonIndexed():g));const mesh=new T.Mesh(merged,mat);mesh.name='Batched haunted courtyard architecture';root.add(mesh);for(const g of geometries)g.dispose();}
 return {courtyards:hauntCourts.length,branches:hauntCourts.length*2};
}
