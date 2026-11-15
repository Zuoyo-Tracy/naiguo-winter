import {registerRegionHint} from './region-hints.js';
import {railPoints} from './train-rules.js';
import * as THREE from 'three';import {stations,stationRace} from './progress.js';import {route,sampleAt} from './track.js';import {magnets} from './challenges.js';
export function buildStations(scene){const temp=new THREE.Matrix4(),pos=new THREE.Vector3();scene.traverse(o=>{if(o.isInstancedMesh){for(let i=0;i<o.count;i++){o.getMatrixAt(i,temp);pos.setFromMatrixPosition(temp);if(stations.some(n=>{const p=sampleAt(n.s);return Math.abs(pos.x-p.x)<55&&Math.abs(pos.z-(p.z+16))<48;})){temp.makeScale(0,0,0);o.setMatrixAt(i,temp);}}o.instanceMatrix.needsUpdate=true;}});for(const m of magnets){for(const side of [-1,1]){const pts=[];for(let i=0;i<=30;i++){const t=i/30;pts.push(new THREE.Vector3((m.start-30+i)*m.dir,m.base+.3,m.z+side*(10-6*t)));}scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:0x89664b})));}}for(const n of stations){const p=sampleAt(n.s),s={x:p.x,z:p.z,groundY:p.y},g=new THREE.Group();g.position.set(s.x,s.groundY,s.z);const material=c=>new THREE.MeshStandardMaterial({color:c,roughness:.5});function box(w,h,d,c,x,y,z){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material(c));o.position.set(x,y,z);g.add(o);}
 // Matching rest pavilions stay outside the driving ribbon.
 box(44,1.2,52,0xd8d0df,0,-.68,14); // Foundation top stays below road; avoid depth fighting.
 // Full-width apron joins the existing road; a roofed parking bay is directly on it.
 // Roof, columns and bench are supplied by the Lux3D pavilion.
 // Foundations reach the hall floor instead of leaving a floating decorative pavilion.
 for(const x of [-18,18])for(const z of [5,35])box(1.4,s.groundY+34,1.4,0xb4afc5,x,-(s.groundY+34)/2,z);
 for(const x of [-21.5,21.5])box(.25,.15,50,0x89664b,x,.1,14);
 box(38,.08,.35,0x89664b,0,.06,11);box(8,.06,9,0xede5d9,0,.05,24);
 registerRegionHint(n.display+' · '+n.label,g.position.x,g.position.y,g.position.z+24,35);scene.add(g);}}
export {renderTreasureMap as renderStationMap} from './treasure-map.js';
