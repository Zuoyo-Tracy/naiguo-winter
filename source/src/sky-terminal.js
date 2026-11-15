import * as T from 'three';
import {attractions} from './park-attractions.js';
import {skyStart} from './sky-journey.js';

const ferris=attractions.find(a=>a.id==='ferris');
const dx=ferris.anchor.x-ferris.x,dz=ferris.anchor.z-ferris.z,d=Math.hypot(dx,dz);
const end={x:ferris.x+dx/d*(ferris.r-7),z:ferris.z+dz/d*(ferris.r-7)};
export const skyLaunch=Object.freeze({x:ferris.anchor.x+(end.x-ferris.anchor.x)*.88,z:ferris.anchor.z+(end.z-ferris.anchor.z)*.88,y:ferris.anchor.y+(ferris.y-ferris.anchor.y)*.88,yaw:Math.atan2(-dx,-dz)});
export const skyLaunchEntry={id:'sky:terminal',name:'摩天轮 · 奶使起飞台',category:'scenic',station:2,p:skyLaunch};
export const launchDistance=p=>Math.hypot(p.x-skyLaunch.x,p.z-skyLaunch.z);
export const atSkyLaunch=p=>!!p&&launchDistance(p)<11&&Math.abs((p.groundY??p.y)-skyLaunch.y)<4&&(p.jumpY||0)<3;
// Rise along the existing bridge, then bank around the front of the wheel.
// All points are world positions shared by the visible rings and flight motion.
export const skyDeparture=[
 new T.Vector3(skyLaunch.x,skyLaunch.y+1.5,skyLaunch.z),
 new T.Vector3(skyLaunch.x-8,skyLaunch.y+15,skyLaunch.z+15),
 new T.Vector3(-472,96,628),new T.Vector3(-505,156,563),
 new T.Vector3(skyStart[0]-38,214,skyStart[2]-8),new T.Vector3(...skyStart),
];
export function buildSkyTerminal(scene){
 const root=new T.Group();root.name='Ferris promenade continuous sky departure';scene.add(root);
 const brass=new T.MeshStandardMaterial({color:0xb29152,roughness:.6,metalness:.35}),ivory=new T.MeshStandardMaterial({color:0xe8dcc0,roughness:.9}),light=new T.MeshBasicMaterial({color:0xffe2a4});
 const gate=new T.Group();gate.position.set(skyLaunch.x,skyLaunch.y,skyLaunch.z);gate.rotation.y=skyLaunch.yaw;root.add(gate);
 const add=(geometry,material,parent,x,y,z)=>{const m=new T.Mesh(geometry,material);m.position.set(x,y,z);parent.add(m);return m;};
 for(const side of [-1,1]){add(new T.CylinderGeometry(.22,.32,8.8,10),brass,gate,side*5.5,4.4,0);add(new T.SphereGeometry(.36,12,8),light,gate,side*5.5,9,0);}
 add(new T.TorusGeometry(5.5,.1,8,64,Math.PI),brass,gate,0,2.8,0);
 add(new T.BoxGeometry(11,.2,.2),brass,gate,0,8,0);
 const ink=document.createElement('canvas');ink.width=768;ink.height=192;
 const c=ink.getContext('2d');c.fillStyle='#f0e4c9';c.fillRect(0,0,768,192);c.strokeStyle='#ac8a47';c.lineWidth=8;c.strokeRect(10,10,748,172);c.fillStyle='#405a54';c.textAlign='center';c.font='bold 62px serif';c.fillText('奶使 · 云上邮路',384,86);c.font='30px sans-serif';c.fillText('摩天轮终点出发  ·  沿风环展翅',384,145);
 const texture=new T.CanvasTexture(ink);texture.colorSpace=T.SRGBColorSpace;
 add(new T.BoxGeometry(8,2,.18),ivory,gate,0,8,0);
 const sign=add(new T.PlaneGeometry(7.8,1.95),new T.MeshBasicMaterial({map:texture,side:T.DoubleSide}),gate,0,8,-.11);sign.rotation.y=Math.PI;
 const curve=new T.CatmullRomCurve3(skyDeparture,false,'centripetal');
 for(let i=1;i<=7;i++){const t=i/8,p=curve.getPointAt(t),r=add(new T.TorusGeometry(5.2,.12,8,48),light,root,p.x,p.y,p.z);r.lookAt(p.clone().add(curve.getTangentAt(t)));}
 return root;
}
