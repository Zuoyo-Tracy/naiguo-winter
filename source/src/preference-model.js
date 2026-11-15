export const PREFERENCES_KEY='winter-park-preferences-v1';
export function normalizePreferences(value={},reducedMotion=false){
 if(!value||typeof value!=='object')value={};
 const number=(v,f,min,max)=>typeof v==='number'&&Number.isFinite(v)?Math.max(min,Math.min(max,v)):f;
 return {quality:['low','balanced','high'].includes(value.quality)?value.quality:'balanced',comfort:typeof value.comfort==='boolean'?value.comfort:reducedMotion,cruise:typeof value.cruise==='boolean'?value.cruise:true,sensitivity:number(value.sensitivity,1,.5,1.7),audio:value.audio===true,volume:number(value.volume,.18,0,.6)};
}
export function readPreferences(storage,reducedMotion=false,defaultQuality='balanced'){const defaults={quality:defaultQuality};try{return normalizePreferences({...defaults,...JSON.parse(storage.getItem(PREFERENCES_KEY)||'{}')},reducedMotion);}catch{return normalizePreferences(defaults,reducedMotion);}}
export const pixelRatioFor=(quality,deviceRatio)=>Math.min(Math.max(.5,deviceRatio),{low:1,balanced:1.5,high:2}[quality]||1.5);
