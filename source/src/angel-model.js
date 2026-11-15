import * as T from 'three';
import {GameAssetLoader} from './asset-loader.js';
export async function loadAngel(){
 const asset=await new GameAssetLoader().loadAsync('/assets/hero-angel.glb');
 const root=asset.scene,wrapper=new T.Group(),body=new T.Group();body.add(root);wrapper.add(body);
 const mixer=new T.AnimationMixer(root);for(const clip of asset.animations)mixer.clipAction(clip).play();mixer.update(0);
 const box=new T.Box3().setFromObject(root),size=box.getSize(new T.Vector3()),c=box.getCenter(new T.Vector3()),scale=3.5/size.y;
 root.position.sub(new T.Vector3(c.x,box.min.y,c.z));body.scale.setScalar(scale);
 // Blender's character faces -Y, exported as +Z.
 root.traverse(o=>{if(o.isMesh){o.frustumCulled=false;}});
 return {wrapper,body,mixer,clips:asset.animations.length,footprint:{halfWidth:1.2,halfLength:1.2,height:3.6}};
}
