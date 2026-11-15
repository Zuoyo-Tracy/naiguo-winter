import {stations,stationRace} from './progress.js';import {sampleAt} from './track.js';
export function startChallenge(from,to,unlocked){
 if(!Number.isInteger(to)||!stations[to]||from===to)throw Error('请选择不同的终点驿站');
 const s=stationRace(from,unlocked),start=sampleAt(stations[from].s);
 // A timed run starts on the circuit, facing its destination. The separate
 // station respawn still places the visitor inside the sheltered parking bay.
 Object.assign(s,{x:start.x,z:start.z,yaw:start.yaw+(to<from?Math.PI:0),
  mode:'timed',challenge:{from,to,elapsed:0,finished:false}});
 return s;
}
export function advanceChallenge(s,dt){const c=s.challenge;if(!c||c.finished||s.status!=='running')return false;c.elapsed+=dt;const p=sampleAt(stations[c.to].s);if(!s.snow&&!s.magnetic&&Math.hypot(s.x-p.x,s.z-(p.z+24))<19&&Math.abs(s.groundY-p.y)<4){c.finished=true;s.speed=0;s.mode='explore';return true;}return false;}
