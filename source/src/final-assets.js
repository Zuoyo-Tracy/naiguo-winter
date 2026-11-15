import * as T from 'three';
import {GameAssetLoader} from './asset-loader.js';
export const finalSkyNames=['sky-conservatory','sky-market','sorting-desk','letter-bin','watering-can','cloud-flower','bell-frame','telescope','kite','balloon-basket','balloon-envelope','balance-cradle','cloud-cup','chessboard-table','signal-console','sandbag','star-chart','mail-trunk','tea-table','birdhouse','wind-vane','brass-compass'];
export const finalHauntNames=['haunted-moon-gate','haunted-opera-stage','haunt-well','haunt-screen','haunt-lantern','haunt-altar','haunt-mask','haunt-urn','haunt-bamboo','haunt-door','haunt-stone-lion','haunt-bell'];
export const finalParkNames=['snow-pine','rose-trellis','stone-fountain','park-kiosk','luggage-cart','park-rocker','flower-cart','snow-bollard'];
export async function loadFinalAssets(names){
 // A modest queue avoids competing with the character and route texture uploads.
 const result={},queue=[...names];await Promise.all(Array.from({length:3},async()=>{while(queue.length){const name=queue.shift();result[name]=await new GameAssetLoader().loadAsync('/assets/final/'+name+'.glb');}}));return result;
}
export function placeFinal(asset,parent,name,x,y,z,w,h,d,yaw=Math.PI){
 const model=asset.scene.clone(true),b=new T.Box3().setFromObject(model),s=b.getSize(new T.Vector3()),c=b.getCenter(new T.Vector3());model.position.sub(new T.Vector3(c.x,b.min.y,c.z));const wrap=new T.Group();wrap.name='Lux3D final '+name;wrap.userData.finalAsset=name;wrap.add(model);wrap.scale.setScalar(Math.min(w/s.x,h/s.y,d/s.z));wrap.position.set(x,y,z);wrap.rotation.y=yaw;parent.add(wrap);return wrap;
}
