import {avenueMaterial} from './avenue-material.js';
import {registerRegionHint} from './region-hints.js';
import * as THREE from 'three';import {sampleAt,modules} from './track.js';import {speedZones,meteorsAt,dreamObstacles,magneticPose,magnet} from './challenges.js';
export function buildChallenges(scene){
 const mat=(c,e=0)=>new THREE.MeshStandardMaterial({color:c,emissive:e,emissiveIntensity:.5,roughness:.38,metalness:.15});const colors=[0xb8b4cf,0xc4b7ad,0xa9bdb8,0xc7a8b6,0x9eafc0];
 function add(g,m,x,y,z){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);scene.add(o);return o;}
 function label(text,p){registerRegionHint(text,p.x,p.y,p.z);}
 speedZones.forEach(z=>{const p=sampleAt(z.s+z.length/2);const overlaps=modules.some(m=>Math.abs(p.z-m.z)<15&&Math.abs(p.x-m.x)<m.length*.62+z.length/2);if(!overlaps){const material=avenueMaterial();material.color.setHex(0xb8a18a);const o=add(new THREE.BoxGeometry(22,.06,z.length),material,p.x,p.y+.045,p.z);o.rotation.y=p.yaw;o.name='Antique stone acceleration paving';}label('×'+z.factor+' 加速路段',sampleAt(z.s-22));});
 modules.filter(m=>m.id==='english-stone-bridge').forEach(m=>label('石拱桥 · ×2 加速',{x:m.x,y:m.y,z:m.z}));
 for(let i=0;i<110;i++){const p=sampleAt(50+i*44),side=i%2?1:-1,x=p.x+Math.cos(p.yaw)*(19+i%8)*side,z=p.z-Math.sin(p.yaw)*(19+i%8)*side,c=colors[i%colors.length];
 if(i%3===0){const b=add(new THREE.SphereGeometry(3,16,12),new THREE.MeshPhysicalMaterial({color:c,transparent:true,opacity:.28,roughness:.05,metalness:.1,iridescence:1,side:THREE.DoubleSide}),x,p.y+9+i%9,z);}
 else if(i%3===1){ /* Detailed Lux3D balloon bunches replace ellipsoids. */ }
 else { /* Lux3D snowballs are loaded asynchronously without pedestals. */ }}
 // Generated tree and snow obstacles preserve collision positions.
 const positions=[],indices=[];
 for(let i=0;i<=105;i++){const x=magnet.start+i*2;for(const side of [-1,1]){const p=magneticPose(x,side*5);positions.push(p.x,p.y,p.z);}if(i<105)indices.push(i*2,i*2+1,i*2+2,i*2+1,i*2+3,i*2+2);}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();const m=mat(0x8edfd5,0x437f8e);m.side=THREE.DoubleSide;add(geo,m,0,0,0);
 for(const side of [-1,1]){const pts=[];for(let x=-105;x<=105;x+=2){const p=magneticPose(x,side*5);pts.push(new THREE.Vector3(p.x,p.y,p.z));}scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:0xffe4b5})));}
 label('磁力车道 · 贴壁 / 倒挂',{x:-132,y:32,z:360});label('离轨下落 →',{x:105,y:56,z:360});
 // A visible palace annex shell carries the magnetic lane, open at both ends.
 const shell=add(new THREE.CylinderGeometry(12.4,12.4,210,32,1,true,0,Math.PI),new THREE.MeshStandardMaterial({color:0xb8a4cf,transparent:true,opacity:.16,side:THREE.DoubleSide,depthWrite:false}),0,44,360);shell.rotation.z=Math.PI/2;
 const meteors=meteorsAt(0).map(m=>{const ring=add(new THREE.RingGeometry(m.radius-.15,m.radius,32),new THREE.MeshBasicMaterial({color:0xffb4b6,side:THREE.DoubleSide,transparent:true,opacity:.8}),m.x,m.y+.3,m.z);ring.rotation.x=-Math.PI/2;const rock=add(new THREE.IcosahedronGeometry(2.2,0),mat(0xff9fbc,0xfb6953),m.x,m.y+60,m.z);return {ring,rock};});
 for(const s of [490,2170,4060])label('流星区 · 避开红圈',sampleAt(s),'#ffb4b6');
 return time=>{meteorsAt(time).forEach((m,i)=>{const {ring,rock}=meteors[i];ring.visible=m.warning||m.falling||m.impact;ring.material.opacity=m.impact?1:.3+.5*Math.abs(Math.sin(time*5));rock.visible=false;rock.position.y=m.y+(m.falling?60*(1-(m.phase-2.8)/.7):1);rock.rotation.x=time;});};
}
