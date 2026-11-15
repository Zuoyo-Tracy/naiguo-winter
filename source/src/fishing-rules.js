// Keep the attraction id `ducks` so previous collection stamps and map links survive.
export const fishingPond=Object.freeze({radius:15,waterRadius:12.8,waterY:.88,dockZ:-12.5,seatY:1.73});
export const fishingSpecies=Object.freeze([
 {name:'金尾鲫',color:0xe5ae55,weight:.68,points:100},
 {name:'银雪鲈',color:0x9dc4d3,weight:1.12,points:150},
 {name:'星斑锦鲤',color:0xe98a6c,weight:1.76,points:200},
 {name:'青溪鲤',color:0x77aca1,weight:1.34,points:150},
]);
const setPhase=(r,phase,message)=>{r.phase=phase;r.phaseTime=0;r.message=message;};
export function newFishingRound(){return {kind:'ducks',time:0,phase:'ready',phaseTime:0,score:0,casts:0,catches:[],finished:false,aim:{x:0,z:-3},biteAfter:0,pending:null,message:'点「抛竿」，等浮漂下沉、出现「收竿！」再点一次。'};}
export function fishingAction(r,aim){
 if(r.finished)return false;
 if(['ready','caught','missed'].includes(r.phase)){
  const x=Number.isFinite(aim?.x)?aim.x:0,z=Number.isFinite(aim?.z)?aim.z:-3,d=Math.hypot(x,z),scale=d>10?10/d:1;
  r.aim={x:x*scale,z:Math.max(-7,z*scale)};r.casts++;r.biteAfter=2.4+((r.casts-1)%4)*.65;
  const species=fishingSpecies[(r.casts-1)%fishingSpecies.length];r.pending={...species,weight:+(species.weight+((r.casts*7)%5)*.07).toFixed(2)};
  setPhase(r,'casting','鱼饵飞出去啦……看水面上的红白浮漂。');return true;
 }
 if(r.phase==='bite'){setPhase(r,'reeling','钓住了！奶龙正在把鱼拉上岸……');return true;}
 // Holding a key or clicking repeatedly cannot reel early or score twice.
 return false;
}
export function stepFishing(r,dt){
 if(r.finished)return;
 dt=Math.max(0,Math.min(.05,dt));r.time+=dt;r.phaseTime+=dt;
 if(r.phase==='casting'&&r.phaseTime>=.7)setPhase(r,'waiting','鱼饵已入水，等一等；小鸭只是路过，不用点它。');
 else if(r.phase==='waiting'&&r.phaseTime>=r.biteAfter)setPhase(r,'nibbling','浮漂轻轻晃动……先别急，等它明显下沉。');
 else if(r.phase==='nibbling'&&r.phaseTime>=.8)setPhase(r,'bite','咬钩了！现在点「收竿！」或按空格。');
 else if(r.phase==='bite'&&r.phaseTime>=3)setPhase(r,'missed','鱼把饵吃掉啦。没关系，再抛一竿，不扣分。');
 else if(r.phase==='reeling'&&r.phaseTime>=1.35){
  const fish={...r.pending};r.catches.push(fish);r.score+=fish.points;
  setPhase(r,'caught',`钓到${fish.name} · ${fish.weight.toFixed(2)} kg！${r.catches.length===3?'三条集齐，岸边小钓手！':'可以再抛一竿。'}`);
  r.finished=r.catches.length>=3;
 }
}
export function fishingButton(r){return r.phase==='bite'?'收竿！':r.phase==='reeling'?'正在收线…':r.phase==='casting'?'抛竿中…':['waiting','nibbling'].includes(r.phase)?'等鱼咬钩…':r.phase==='ready'?'抛竿':'再抛一竿';}
export function canFishAct(r){return !r.finished&&['ready','caught','missed','bite'].includes(r.phase);}
