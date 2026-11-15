import * as T from 'three';
// Validate GPU samples, not merely the existence of a decoded image. A failed
// upload can leave a complete-looking texture that samples solid black.
export function createTextureRecovery(renderer,{interval=2}={}){
 const scene=new T.Scene(),camera=new T.OrthographicCamera(-1,1,1,-1,0,1);
 const material=new T.ShaderMaterial({uniforms:{image:{value:null}},vertexShader:'varying vec2 uvSample; void main(){uvSample=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:'uniform sampler2D image; varying vec2 uvSample; void main(){gl_FragColor=texture2D(image,uvSample);}',depthTest:false,depthWrite:false,toneMapped:false});
 scene.add(new T.Mesh(new T.PlaneGeometry(2,2),material));
 const target=new T.WebGLRenderTarget(8,8,{depthBuffer:false,stencilBuffer:false}),pixels=new Uint8Array(256),canvas=document.createElement('canvas');canvas.width=canvas.height=8;const context=canvas.getContext('2d',{willReadFrequently:true});
 let checked=new WeakMap();const attempts=new WeakMap(),pending=new Set();let time=interval;const stats={checked:0,recovered:0,failed:0};
 function sample(texture){const previous=renderer.getRenderTarget();try{material.uniforms.image.value=texture;renderer.setRenderTarget(target);renderer.render(scene,camera);renderer.readRenderTargetPixels(target,0,0,8,8,pixels);let max=0;for(let i=0;i<pixels.length;i+=4)max=Math.max(max,pixels[i],pixels[i+1],pixels[i+2]);return max;}finally{renderer.setRenderTarget(previous);}}
 function inspect(texture){
  const image=texture.image;if(!image?.width||!image?.height||renderer.getContext().isContextLost())return;
  stats.checked++;const version=texture.version;checked.set(texture,version);
  // Sample only base-color images. Naturally black pictures are valid.
  if(sample(texture)>2)return;
  try{context.clearRect(0,0,8,8);context.drawImage(image,0,0,8,8);const data=context.getImageData(0,0,8,8).data;let bright=0;for(let i=0;i<data.length;i+=4)if(data[i+3]>32&&Math.max(data[i],data[i+1],data[i+2])>40)bright++;if(bright<4)return;}catch{return;}
  const count=attempts.get(texture)||0;if(count>=2)return;attempts.set(texture,count+1);
  // Invalidate GPU storage, retaining the encoded/decoded source and all UV,
  // sampler and color-space settings. No model download or progress reset.
  texture.dispose();texture.needsUpdate=true;
  if(sample(texture)>2){stats.recovered++;checked.set(texture,texture.version);return;}
  stats.failed++;checked.delete(texture);
 }
 function update(world,dt){time+=dt;if(time>=interval){time=0;world.traverseVisible(o=>{for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[]){const map=m.map;if(map?.image?.width&&map.image.height&&!map.isCompressedTexture&&renderer.properties.has(map)&&renderer.properties.get(map).__webglTexture&&checked.get(map)!==map.version)pending.add(map);}});}
  const next=pending.values().next().value;if(next){pending.delete(next);inspect(next);}
 }
 return {update,inspect,stats,reset(){checked=new WeakMap();time=interval;},dispose(){target.dispose();scene.children[0].geometry.dispose();material.dispose();}};
}
