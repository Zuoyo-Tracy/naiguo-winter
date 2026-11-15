import {loadAngel} from './angel-model.js';
import * as T from 'three';
import {GameAssetLoader} from './asset-loader.js';

export const SKIN_KEY='milk-winter-skin-v1';
export function canUseSkin(id,unlocked) {
 return id==='tricycle'||id==='kangaroo'&&unlocked>=1||id==='angel'&&unlocked>=2;
}

async function loadKangaroo(vehicle) {
 const asset=await new GameAssetLoader().loadAsync('/assets/hero-kangaroo.glb');
 const root=asset.scene, wrapper=new T.Group();
 wrapper.add(root);
 const mixer=new T.AnimationMixer(root);
 for(const clip of asset.animations)mixer.clipAction(clip).play();
 mixer.update(0);
 root.updateMatrixWorld(true);
 const bounds=new T.Box3().setFromObject(root);
 const size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
 const scale=4.2/size.y;
 wrapper.scale.setScalar(scale);
 root.position.sub(new T.Vector3(center.x,bounds.min.y,center.z));
 wrapper.visible=false;
 vehicle.add(wrapper);
 return {wrapper,mixer,clips:asset.animations.length,footprint:{halfWidth:size.x*scale/2+.2,halfLength:size.z*scale/2+.2,height:4.4}};
}

export async function loadSkins(vehicle,tricycle,storage,progress,select,canEquip=()=>true) {
 const tricycleFootprint=vehicle.userData.collisionFootprint;
 const status=document.createElement('small');
 status.setAttribute('role','status');
 select.after(status);
 let selected='tricycle',generation=0,kangaroo,download,angel,angelDownload;
 select.add(new Option('奶使 · 全驿站解锁','angel'));
 vehicle.userData.skin=selected;

 function announce(message='') {
  status.textContent=message;
  status.hidden=!message;
 }

 async function apply(id,restore=false) {
  if(!canUseSkin(id,progress.unlocked))return false;
  const request=++generation;
  select.value=id;
  select.removeAttribute('aria-busy');
  announce();
  if(id==='kangaroo'&&!kangaroo) {
   select.setAttribute('aria-busy','true');
   announce('正在准备袋鼠坐骑…');
   download??=loadKangaroo(vehicle).then(model=>kangaroo=model).catch(error=>{
    download=null;throw error;
   });
   try{await download;}
   catch{
    if(request===generation){
     select.removeAttribute('aria-busy');
     select.value=selected;
     announce('坐骑没有载入，重新选择袋鼠即可重试。');
    }
    return false;
   }
  }
  if(id==='angel'&&!angel){
   announce('正在展开奶使羽翼…');select.setAttribute('aria-busy','true');
   angelDownload??=loadAngel().then(model=>{angel=model;angel.wrapper.visible=false;vehicle.add(angel.wrapper);return model;}).catch(e=>{angelDownload=null;throw e;});
   try{await angelDownload;}catch{if(request===generation){select.value=selected;select.removeAttribute('aria-busy');announce('奶使加载失败，请重新选择重试。');}return false;}
  }
  if(request!==generation)return false;
  select.removeAttribute('aria-busy');
  const footprint=id==='angel'?angel.footprint:id==='kangaroo'?kangaroo.footprint:tricycleFootprint;
  if(id!==selected&&!restore&&!canEquip(footprint)){
   select.value=selected;
   announce('请在空旷路面停稳后换装。');
   return false;
  }
  selected=id;
  tricycle.visible=id==='tricycle';
  if(kangaroo)kangaroo.wrapper.visible=id==='kangaroo';
  if(angel)angel.wrapper.visible=id==='angel';
  vehicle.userData.skin=id;
  vehicle.userData.collisionFootprint=footprint;
  announce();
  try{storage.setItem(SKIN_KEY,id);}catch{}
  return true;
 }

 function refresh() {
  const a=select.querySelector('[value="angel"]');a.disabled=progress.unlocked<2;a.textContent=a.disabled?'🔒 奶使 · 全驿站解锁':'奶使 · 已解锁';
  const option=select.querySelector('[value="kangaroo"]');
  option.disabled=progress.unlocked<1;
  option.textContent=option.disabled?'🔒 奶龙骑袋鼠 · 第二驿站解锁':'奶龙骑袋鼠 · 已解锁';
 }
 select.onchange=()=>apply(select.value);
 refresh();
 let saved;
 try{saved=storage.getItem(SKIN_KEY);}catch{}
 await apply(canUseSkin(saved,progress.unlocked)?saved:'tricycle',true);

 const debug=new URLSearchParams(location.search).has('test');
 return {refresh,apply,update(dt,state){
  if(selected==='angel'){angel.mixer.update(dt);angel.wrapper.position.y=.35;}
  if(selected==='kangaroo'&&state.status==='running'&&Math.abs(state.speed)>.2){
   kangaroo.mixer.timeScale=Math.min(2.5,Math.max(.35,Math.abs(state.speed)/14));
   kangaroo.mixer.update(dt);
  }
  if(debug)window.__skinDebug={selected,unlocked:progress.unlocked>=1,clips:(selected==='angel'?angel?.clips:kangaroo?.clips)||0,time:(selected==='angel'?angel?.mixer.time:kangaroo?.mixer.time)||0};
 }};
}
