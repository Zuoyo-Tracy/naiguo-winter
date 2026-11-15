import * as T from 'three';

export function createWinterSky(){
 const material=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{time:{value:0}},vertexShader:`varying vec3 vDirection;
 void main(){vDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
 fragmentShader:`varying vec3 vDirection;uniform float time;
 void main(){
  vec3 d=normalize(vDirection);float h=smoothstep(-.25,.8,d.y);
  vec3 c=mix(vec3(.048,.040,.13),vec3(.008,.014,.050),h);
  float band=exp(-pow((d.y-.20-.16*sin(d.x*4.+d.z*3.))*5.,2.));
  float haze=.5+.25*sin(d.x*13.+d.z*8.)+.25*sin(d.z*19.-d.y*11.);
  c+=band*haze*vec3(.024,.015,.057);
  // Broad, softly feathered northern lights. The sky remains open and dark
  // enough for the existing stars; there are no translucent geometry sheets.
  float a=atan(d.x,d.z),t=time*.018;
  float north=pow(max(0.,-d.z),1.5)*smoothstep(.03,.15,d.y)*(1.-smoothstep(.58,.85,d.y));
  float ridge=.27+.065*sin(a*3.+t)+.035*sin(a*7.-t*.7);
  float curtain=exp(-pow((d.y-ridge)*10.,2.));
  float fringe=.67+.16*sin(a*58.+t)+.10*sin(a*101.-t);
  float violet=exp(-pow((d.y-ridge-.12)*9.,2.));
  c+=north*fringe*(curtain*vec3(.035,.13,.105)+violet*vec3(.045,.018,.075));
  gl_FragColor=vec4(c,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
 }`});
 const sky=new T.Mesh(new T.SphereGeometry(1250,48,24),material);sky.renderOrder=-100;sky.name='Open northern winter sky';return sky;
}
