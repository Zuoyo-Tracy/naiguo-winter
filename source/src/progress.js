import {sampleAt} from './track.js';import {checkpointDistances,newRace} from './rules.js';import {magnets,magneticPose} from './challenges.js';
import {stations} from './station-layout.js';export {stations} from './station-layout.js';
export const SAVE_KEY='sky-kingdom-checkpoints-v1';
export function readProgress(storage){try{const d=JSON.parse(storage.getItem(SAVE_KEY));return {unlocked:Number.isInteger(d?.unlocked)?Math.max(0,Math.min(2,d.unlocked)):0};}catch{return {unlocked:0};}}
export function writeProgress(storage,progress){try{storage.setItem(SAVE_KEY,JSON.stringify({version:1,unlocked:progress.unlocked}));return true;}catch{return false;}}
export function reachedStation(state,progress){if(state.status!=='running'||state.snow)return null;const next=stations[progress.unlocked+1];if(!next)return null;const cp=checkpointDistances.filter(s=>s<next.s).length;return state.progress>=next.s&&state.cp>=cp?next:null;}
export function stationRace(id,unlocked){if(!Number.isInteger(id)||id<0||id>unlocked||id>=stations.length)throw Error('休息站尚未解锁');const p=sampleAt(stations[id].s),s=newRace();Object.assign(s,p,{progress:p.s,groundY:p.y,cp:checkpointDistances.filter(d=>d<p.s).length,status:'running',magnetsDone:[]});
 s.z=p.z+24;s.yaw=Math.PI; s.magnetic=false;s.roll=0;
 return s;
}
