import * as THREE from 'three';
import {createWinterSky} from './winter-sky.js';
export function softenBalloons(root){
 root.traverse(o=>{if(!o.isMesh)return;const edit=m=>{m=m.clone();m.roughness=.6;m.metalness=.05;m.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
 vec3 originalBalloon = diffuseColor.rgb;
 float lumBalloon = dot(originalBalloon, vec3(0.2126,0.7152,0.0722));
 float purpleBalloon = smoothstep(0.25,0.85,originalBalloon.b / max(originalBalloon.r,0.001));
 vec3 pastelBalloon = mix(vec3(0.84,0.52,0.65),vec3(0.65,0.55,0.82),purpleBalloon);
 if(originalBalloon.g > originalBalloon.r*1.12 && originalBalloon.g > originalBalloon.b*1.12) pastelBalloon=vec3(0.60,0.76,0.66);
 diffuseColor.rgb = mix(originalBalloon,pastelBalloon*(0.72+0.28*sqrt(lumBalloon)),0.78);
 `);};m.customProgramCacheKey=()=> 'pastel-balloons-v15';return m;};o.material=Array.isArray(o.material)?o.material.map(edit):edit(o.material);});
}
export function buildStarSky(scene){
 const group=new THREE.Group();group.name='Blue violet star sky';scene.add(group);
 const sky=createWinterSky();group.add(sky);
 const n=1800,pos=new Float32Array(n*3),phase=new Float32Array(n),sizes=new Float32Array(n);let seed=94821;const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};for(let i=0;i<n;i++){const y=random()*1.45-.45,a=random()*Math.PI*2,r=Math.sqrt(1-y*y);pos.set([Math.cos(a)*r*1180,y*1180,Math.sin(a)*r*1180],i*3);phase[i]=random()*6.283;sizes[i]=random()<.06?4:1+random()*1.7;}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setAttribute('phase',new THREE.BufferAttribute(phase,1));geo.setAttribute('starSize',new THREE.BufferAttribute(sizes,1));const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{time:{value:0}},vertexShader:`attribute float phase;attribute float starSize;uniform float time;varying float brightness;varying float tint;void main(){brightness=.55+.30*sin(time*.7+phase)+.15*sin(time*.29+phase*2.);tint=phase/6.283;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_PointSize=starSize;}`,fragmentShader:`varying float brightness;varying float tint;void main(){float r=length(gl_PointCoord-.5)*2.;float alpha=pow(max(0.,1.-r),1.7)*brightness;gl_FragColor=vec4(mix(vec3(.65,.77,1.),vec3(1.,.84,.94),tint),alpha);}`});group.add(new THREE.Points(geo,mat));return (time,camera,visible=true)=>{group.visible=visible;group.position.copy(camera.position);mat.uniforms.time.value=time;sky.material.uniforms.time.value=time;};
}
