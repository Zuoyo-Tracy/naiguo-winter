import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DefaultLoadingManager} from 'three';
import {publicAsset} from './public-assets.js';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
import {textureBudget} from './texture-budget.js';
import {createFullTextureSource} from './full-texture-source.js';
import {fetchAsset,loadTransferredGLB,compressedAssetsSupported} from './asset-transfer.js';
import mobileAssets from './mobile-assets.json' with {type:'json'};
import balancedAssets from './balanced-assets.json' with {type:'json'};
import compactAssets from './compact-assets.json' with {type:'json'};
import {refineLaugherEyes} from './laugher-eyes.js';
import unifiedAssets from './unified-assets.json' with {type:'json'};

DefaultLoadingManager.setURLModifier(publicAsset);
const parsed=new Map();
const runtimeAssets=new Map([
 ...Object.entries(unifiedAssets),
 ['/assets/naifrog/welcome.glb','/assets/friendly/welcome.glb'],
 ['/assets/naifrog/chef.glb','/assets/friendly/chef.glb'],
 ['/assets/naifrog/photographer.glb','/assets/friendly/photographer.glb'],
 ['/assets/naifrog/reader.glb','/assets/friendly/reader.glb'],
 ['/assets/naifrog/traveler.glb','/assets/friendly/traveler.glb'],
 ['/assets/naifrog/santa.glb','/assets/friendly/santa.glb'],
 ['/assets/festival/thinker.glb','/assets/friendly/thinker.glb'],
 ['/assets/festival/laugher.glb','/assets/friendly/laugher-cover.glb'],
 ['/assets/festival/cheerer.glb','/assets/friendly/cheerer.glb'],


 ['/assets/hero.glb','/assets/hero-game.glb'],
 ['/assets/hero-passenger.glb','/assets/hero-passenger-posed.glb'],
 ['/assets/npc-pink.glb','/assets/npc-pink-game.glb'],
 ['/assets/npc-mouse.glb','/assets/npc-mouse-game.glb'],
 ['/assets/hero-kangaroo.glb','/assets/hero-kangaroo-game.glb'],
 ['/assets/cohesion/arcade.glb','/assets/cohesion/arcade-repaired.glb'],
 ['/assets/roman-wisteria-gallery.glb','/assets/roman-wisteria-gallery-game.glb']
]);
export const assetLoadState={requested:0,loaded:0,failed:0,reused:0};
function announce(){if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('winter-assets',{detail:{...assetLoadState}}));}
// Share decoded geometry and textures, while transforms, rigs and materials stay local.
// Repeated passengers, cloudbanks and street furniture no longer decode the same GLB repeatedly.
export class GameAssetLoader extends GLTFLoader{
 async loadAsync(url,onProgress){
  const [pathname,query]=url.split('?');url=(runtimeAssets.get(pathname)||pathname)+(query?'?'+query:'');
  const key=this.path+url;let pending=parsed.get(key);
  if(!pending){
   const [resolvedPath,resolvedQuery]=url.split('?'),file=compactAssets[resolvedPath]||resolvedPath;
   const suffix=resolvedQuery?'?'+resolvedQuery:'',download=file+suffix;
   const preview=textureBudget.quality==='low'&&compressedAssetsSupported()?(mobileAssets[file]||balancedAssets[file]):balancedAssets[file];
   const transfer=(url,onProgress)=>loadTransferredGLB(this,url,onProgress,(...args)=>super.loadAsync(...args));
   const load=async()=>{
    if(preview&&textureBudget.quality!=='high'&&typeof createImageBitmap==='function'){
     try{
      const model=await transfer(preview+suffix,onProgress);
      if(model.parser.textureLoader?.isImageBitmapLoader)return {model,original:createFullTextureSource(download,fetchAsset)};
     }catch{/* An unavailable preview can still load from the original published model. */}
    }
    try{return {model:await transfer(download,onProgress)};}
    catch(error){
     if(download===url)throw error;
     return {model:await transfer(url,onProgress)};
    }
   };
   assetLoadState.requested++;announce();
   pending=load().then(async ({model:g,original})=>{
    await textureBudget.register(g,original);if(/^\/assets\/(hero|npc-)/.test(url))for(const root of g.scenes)root.traverse(o=>{for(const m of (o.material?(Array.isArray(o.material)?o.material:[o.material]):[])){if(m.isMeshStandardMaterial){m.roughness=Math.max(m.roughness,.68);m.metalness=Math.min(m.metalness,.08);if('clearcoat' in m)m.clearcoat=0;}}});for(const root of g.scenes)root.traverse(o=>{if(o.geometry){o.geometry.userData.sourceAsset=url;o.geometry.userData.sourceMesh=o.name;}});assetLoadState.loaded++;announce();return g;
   }).catch(error=>{parsed.delete(key);assetLoadState.failed++;announce();throw error;});parsed.set(key,pending);
  }else assetLoadState.reused++;
  const original=await pending,materials=new Map();
  const scenes=original.scenes.map(source=>{const copy=clone(source);copy.traverse(o=>{if(!o.material)return;const local=m=>{if(!materials.has(m))materials.set(m,m.clone());return materials.get(m);};o.material=Array.isArray(o.material)?o.material.map(local):local(o.material);});return copy;});
  if(url.split('?')[0]==='/assets/friendly/laugher-cover.glb')for(const scene of scenes)refineLaugherEyes(scene);
  return {...original,scene:scenes[original.scenes.indexOf(original.scene)]||scenes[0],scenes};
 }
}
