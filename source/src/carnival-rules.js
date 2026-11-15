import {newFishingRound,stepFishing} from './fishing-rules.js';
import {newMushroomRound,stepMushrooms,hitMushroom} from './mushroom-rules.js';
export const miniKinds=new Set(['stargaze','ringtoss','ducks','mushrooms','bowling']);
export const constellationPatterns=[[0,2,4,1],[5,3,1,6],[2,6,4,0]];
export const starPositions=[[-6,4],[-3,1],[0,5],[3,2],[6,5],[-5,-2],[4,-2]];
export function newCarnivalRound(kind){if(kind==='ducks')return newFishingRound();if(kind==='mushrooms')return newMushroomRound();return {kind,time:0,score:0,shots:0,aim:0,power:.5,charging:false,finished:false,projectile:null,pins:Array.from({length:10},(_,i)=>({hit:false,index:i})),hits:[],lastHit:-1,target:0,pattern:0,step:0,message:({ringtoss:'调整方向，按住蓄力，松开发射',bowling:'调整方向，按住蓄力，松开发球'})[kind]||'',flash:0};}
export function pinPosition(i){let row=0,start=0;while(i>=start+row+1){start+=row+1;row++;}return {x:(i-start-row/2)*1.25,z:-3-row*1.25};}
export function hitCarnivalTarget(r,index){if(r.kind==='mushrooms')return hitMushroom(r,index);if(r.finished)return false;let correct=false;
 if(r.kind==='stargaze'){correct=constellationPatterns[r.pattern][r.step]===index;if(correct){r.step++;r.score+=100;if(r.step===4){r.pattern++;r.step=0;if(r.pattern===3)r.finished=true;}r.message=r.finished?'三幅星图已连成 · 星光观察家！':'找对了，再连下一颗';}else r.message='这颗不在下一笔上，再看看编号';}
 r.flash=correct?.5:.2;return correct;
}
export function launchCarnival(r){if(r.finished||r.projectile||!['ringtoss','bowling'].includes(r.kind))return false;r.charging=false;r.shots++;r.projectile={t:0,x:0,z:8,y:1.8,aim:r.aim,power:r.power,hit:false};r.message=r.kind==='ringtoss'?'环飞出去了……':'球已出手……';return true;}
export function stepCarnival(r,dt,duration){if(r.kind==='ducks'){stepFishing(r,dt);return;}if(r.kind==='mushrooms'){stepMushrooms(r,dt);return;}if(r.finished)return;dt=Math.min(dt,.05);r.time+=dt;r.flash=Math.max(0,r.flash-dt);if(r.charging){r.chargeTime=(r.chargeTime||0)+dt;r.power=.25+.65*((r.chargeTime%4)/4);}
 const p=r.projectile;if(p){p.t+=dt;const progress=Math.min(1,p.t/(r.kind==='ringtoss'?1.25:2.2));p.x=p.aim*3.6*progress;p.z=8-(r.kind==='ringtoss'?6+p.power*10:18)*progress;p.y=r.kind==='ringtoss'?3.35+Math.sin(progress*Math.PI)*4: .55;
 if(r.kind==='bowling')for(const pin of r.pins){const q=pinPosition(pin.index);if(!pin.hit&&Math.hypot(q.x-p.x,q.z-p.z)<1.05){pin.hit=true;r.score+=100;for(const next of r.pins){const n=pinPosition(next.index);if(!next.hit&&n.z<q.z&&Math.hypot(n.x-q.x,n.z-q.z)<1.8){next.hit=true;r.score+=100;}}}}
 if(progress===1){if(r.kind==='ringtoss'){const target=[-1.15,0,1.15].findIndex(x=>Math.hypot(x-p.x,-3-p.z)<.85);if(target>=0){r.score+=150;r.hits.push(target);r.message='套中了！';}else r.message='差一点，调整方向或力度';}else r.message='已击倒 '+r.pins.filter(x=>x.hit).length+' / 10';r.projectile=null;if(r.shots>=(r.kind==='ringtoss'?6:3)||r.kind==='bowling'&&r.pins.every(p=>p.hit))r.finished=true;}}
 if(r.time>=duration)r.finished=true;
}
