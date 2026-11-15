import {attractions} from './park-attractions.js';
import {railClearanceSamples} from './train-rules.js';
import {carnivalWalkways} from './carnival-layout.js';
import {festivalHubs} from './festival-layout.js';
import {villageSites} from './village-layout.js';
export const gardenDistricts=[
 {id:'south',label:'星月嘉年华',x0:-570,x1:420,z0:610,z1:1070,corner:35},
 {id:'east',label:'玫瑰游园街',x0:430,x1:650,z0:150,z1:390,corner:25},
 {id:'foyer',label:'雪松前庭',x0:-570,x1:420,z0:460,z1:610,corner:35}
];
export const conservatory={minX:-690,maxX:710,minZ:-190,maxZ:1130,base:-44,eave:145,crown:365};
export const gardenPaths=[{x1:-530,z1:670,x2:390,z2:670,width:16},{x1:-50,z1:460,x2:-50,z2:1040,width:18,shoulder:4},{x1:-420,z1:1035,x2:325,z2:1035,width:12},{x1:390,z1:665,x2:390,z2:1035,width:12},{x1:455,z1:170,x2:455,z2:370,width:12},{x1:615,z1:175,x2:615,z2:370,width:12},{x1:-420,z1:565,x2:320,z2:565,width:12}];
export const plantingZones=[[-530,795,33,90],[-270,810,49,45],[-270,970,48,39],[170,815,48,45],[170,970,48,40],[350,790,25,75],[350,970,25,40],[470,283,21,25],[610,190,18,32],[610,285,18,20],[-380,520,70,25],[-100,515,22,25],[50,510,24,20],[300,515,35,22]];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function segmentPosition(x,z,w){const dx=w.x2-w.x1,dz=w.z2-w.z1,t=clamp(((x-w.x1)*dx+(z-w.z1)*dz)/(dx*dx+dz*dz),0,1);return {t,d:Math.hypot(x-w.x1-dx*t,z-w.z1-dz*t)};}
const approaches=attractions.map(a=>{const dx=a.anchor.x-a.x,dz=a.anchor.z-a.z,n=Math.hypot(dx,dz);return {x1:a.anchor.x,z1:a.anchor.z,x2:a.x+dx/n*(a.r-7),z2:a.z+dz/n*(a.r-7),y1:a.anchor.y,y2:a.y};});
const railGrid=new Map();for(const p of railClearanceSamples){const key=Math.floor(p.x/24)+','+Math.floor(p.z/24);if(!railGrid.has(key))railGrid.set(key,[]);railGrid.get(key).push(p);}
export function nearbyRails(x,z){const out=[],cx=Math.floor(x/24),cz=Math.floor(z/24);for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++)out.push(...(railGrid.get((cx+dx)+','+(cz+dz))||[]));return out;}
export function inGarden(x,z,d){const cx=clamp(x,d.x0+d.corner,d.x1-d.corner),cz=clamp(z,d.z0+d.corner,d.z1-d.corner);return Math.hypot(x-cx,z-cz)<=d.corner;}
export function gardenHeight(x,z,d){const rise=clamp((z-542)/68,0,1);let y=d.id==='south'?31.7:d.id==='foyer'?11.7+20*rise*rise*(3-2*rise):28.7+3*clamp((z-248)/52,0,1);
 let open=1;for(const a of attractions)open=Math.min(open,clamp((Math.hypot(x-a.x,z-a.z)-a.r-8)/18,0,1));for(const h of festivalHubs)open=Math.min(open,clamp((Math.hypot(x-h.x,z-h.z)-h.r-4)/12,0,1));for(const p of [...gardenPaths,...carnivalWalkways])open=Math.min(open,clamp((segmentPosition(x,z,p).d-p.width/2-(p.shoulder||0)-5)/16,0,1));for(const p of approaches)open=Math.min(open,clamp((segmentPosition(x,z,p).d-12)/18,0,1));y+=open*open*(1.1+.7*Math.sin(x*.027)+.5*Math.cos(z*.035));
 // The main promenade passes underneath the raised timber railway before
 // climbing to the carnival. No sudden ledge at the district boundary.
 if(d.id!=='east'&&z<670){const t=clamp((z-590)/80,0,1),walk=11.7+20*t*t*(3-2*t);y=Math.min(y,walk+Math.max(0,Math.abs(x+50)-21)*.7);}
 for(const p of approaches){const q=segmentPosition(x,z,p),road=p.y1+(p.y2-p.y1)*q.t;if(d.id==='foyer'&&q.d<30)y=Math.max(y,road-.3-Math.max(0,q.d-6)*.55);if(q.d<24)y=Math.min(y,road-.3+Math.max(0,q.d-9)*1.6);}
 if(d.id==='foyer')for(const home of villageSites){const edge=Math.max(Math.abs(x-home.x),Math.abs(z-home.z));if(edge<25)y=Math.min(y,home.y-.3+Math.max(0,edge-12)*.7);}
 for(const p of nearbyRails(x,z)){const distance=Math.hypot(x-p.x,z-p.z);if(distance<12)y=Math.min(y,p.y-.5+Math.max(0,distance-4.8)*2.2);}
 return y;
}
export function cohesionSurface(x,z){const d=gardenDistricts.find(d=>inGarden(x,z,d));return d?gardenHeight(x,z,d):undefined;}
export function sceneryAllowed(x,z,r=3){const d=gardenDistricts.find(d=>inGarden(x,z,d));if(!d)return false;
 if(villageSites.some(h=>Math.abs(x-h.x)<13+r&&Math.abs(z-h.z)<13+r))return false;
 if(attractions.some(a=>Math.hypot(a.x-x,a.z-z)<a.r+r+4))return false;
 if(festivalHubs.some(h=>Math.hypot(h.x-x,h.z-z)<h.r+r+4))return false;
 if(approaches.some(p=>segmentPosition(x,z,p).d<9+r))return false;
 if([...gardenPaths,...carnivalWalkways].some(p=>segmentPosition(x,z,p).d<p.width/2+(p.shoulder||0)+r+3))return false;
 return !nearbyRails(x,z).some(p=>Math.hypot(x-p.x,z-p.z)<r+10);
}
export const districtLabels=[{id:'arrival',name:'星云入园街',x:-300,z:20},{id:'palace',name:'云宫雪庭',x:10,z:230},{id:'east',name:'玫瑰游园街',x:550,z:270},{id:'south',name:'星月嘉年华',x:-70,z:830}];
