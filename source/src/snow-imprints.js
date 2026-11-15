import * as THREE from 'three';
import {createSnowTrail,snowContact} from './snow-imprint-model.js';

function stampTexture(foot){
 const canvas=document.createElement('canvas');canvas.width=64;canvas.height=128;
 const c=canvas.getContext('2d');
 if(foot){
  c.fillStyle='rgba(86,100,113,.28)';c.beginPath();c.ellipse(32,77,17,36,0,0,Math.PI*2);c.fill();
  for(const [x,y,r] of [[18,35,8],[32,28,9],[46,35,8]]){c.beginPath();c.ellipse(x,y,r,r*1.4,0,0,Math.PI*2);c.fill();}
  c.strokeStyle='rgba(225,234,239,.46)';c.lineWidth=3;c.beginPath();c.ellipse(32,78,18,37,0,0,Math.PI);c.stroke();
 }else{
  const edge=c.createLinearGradient(0,0,64,0);edge.addColorStop(0,'rgba(96,108,117,0)');edge.addColorStop(.24,'rgba(96,108,117,.17)');edge.addColorStop(.5,'rgba(87,103,116,.25)');edge.addColorStop(.76,'rgba(96,108,117,.17)');edge.addColorStop(1,'rgba(96,108,117,0)');c.fillStyle=edge;c.fillRect(0,0,64,128);
  c.strokeStyle='rgba(80,96,107,.19)';c.lineWidth=4;
  for(let y=-16;y<144;y+=24){c.beginPath();c.moveTo(16,y);c.lineTo(32,y+9);c.lineTo(48,y);c.stroke();}
 }
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}
export function createSnowImprints(scene){
 const root=new THREE.Group();root.name='Fading snow imprints from visitors';scene.add(root);
 const trail=createSnowTrail(),pools={},matrix=new THREE.Object3D();let time=0,total=0;
 for(const kind of ['tricycle','kangaroo']){
  const count=384,geometry=new THREE.PlaneGeometry(1,1);geometry.rotateX(-Math.PI/2);
  const born=new THREE.InstancedBufferAttribute(new Float32Array(count),1);geometry.setAttribute('imprintBorn',born);
  const material=new THREE.MeshBasicMaterial({map:stampTexture(kind==='kangaroo'),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,toneMapped:false});
  const clock={value:0};material.onBeforeCompile=s=>{
   s.uniforms.imprintTime=clock;s.vertexShader='attribute float imprintBorn;varying float vImprintBorn;\n'+s.vertexShader;
   s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvImprintBorn=imprintBorn;');
   s.fragmentShader='uniform float imprintTime;varying float vImprintBorn;\n'+s.fragmentShader;
   s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.a*=1.-smoothstep(80.,110.,imprintTime-vImprintBorn);');
  };material.customProgramCacheKey=()=> 'winter-snow-imprint-v1';
  const mesh=new THREE.InstancedMesh(geometry,material,count);mesh.name='Visitor '+kind+' snow marks';mesh.count=0;mesh.frustumCulled=false;mesh.renderOrder=1;root.add(mesh);pools[kind]={mesh,born,clock,index:0};
 }
 function stamp(p){
  const pool=pools[p.skin],foot=p.skin==='kangaroo',c=Math.cos(p.yaw),s=Math.sin(p.yaw),offsets=foot?[[-.32,0],[.32,0]]:[[-.68,-.85],[.68,-.85],[0,1.2]];
  for(const [side,along]of offsets){
   const x=p.x+c*side+s*along,z=p.z-s*side+c*along,y=snowContact(x,z,p.y);if(y===null)continue;
   // Marks follow mild terrain slopes, but cannot bridge a terrain edge.
   const hX=snowContact(x+.25,z,y),hZ=snowContact(x,z+.25,y);if(hX===null||hZ===null)continue;
   matrix.position.set(x,y+.025,z);matrix.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(-(hX-y)*4,1,-(hZ-y)*4).normalize());matrix.rotateY(p.yaw);matrix.scale.set(foot?.45:.24,1,foot?.8:.69);matrix.updateMatrix();
   pool.mesh.setMatrixAt(pool.index,matrix.matrix);pool.born.setX(pool.index,time);pool.mesh.count=Math.min(384,pool.mesh.count+1);pool.index=(pool.index+1)%384;pool.mesh.instanceMatrix.needsUpdate=true;pool.born.needsUpdate=true;total++;
  }
 }
 return {reset:()=>trail.reset(),update(state,dt,{active,paused,skin='tricycle'}={}){
  root.visible=!state.snow&&state.status!=='riding';if(!paused)time+=dt;
  for(const pool of Object.values(pools))pool.clock.value=time;
  if(paused)return;
  for(const p of trail.advance(state,{enabled:active,skin}))stamp(p);
 },debug:()=>({emitted:total,visible:root.visible,time,counts:Object.fromEntries(Object.entries(pools).map(([id,p])=>[id,p.mesh.count]))})};
}
