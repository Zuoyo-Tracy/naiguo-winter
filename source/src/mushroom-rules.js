export const MUSHROOM_SECONDS=45;
export const mushroomStages=['林间热身','蘑菇派对','菇王来了'];
export function newMushroomRound(seed=Date.now()){
 return {kind:'mushrooms',phase:'ready',time:0,remaining:MUSHROOM_SECONDS,score:0,combo:0,maxCombo:0,feverUntil:0,bonusTime:0,stage:0,finished:false,slots:Array(6).fill(null),seed:(seed>>>0)||73,nextSpawn:0,spawned:0,lastSlot:-1,serial:0,lastStrike:null,lastTap:-1,hits:0,misses:0,kingStarted:false,kingDefeated:false,kingHits:0,message:'直接点冒头的蘑菇：金帽高分、蓝帽加时；连中 5 次，双倍欢乐！'};
}
function random(r){let s=r.seed;s^=s<<13;s^=s>>>17;s^=s<<5;r.seed=s>>>0;return r.seed/4294967296;}
export function startMushrooms(r){if(r.phase!=='ready')return false;r.phase='playing';r.message='奶龙：把藏起来的小蘑菇请出来跳舞！';return true;}
export function mushroomCanHit(r,index){const m=r.slots[index];return r.phase==='playing'&&!!m&&r.time-m.born>=.16&&r.time<m.until&&r.time-(m.hitAt??-1)>=.24;}
function spawn(r,type,index,hp=1){r.slots[index]={type,born:r.time,until:type==='king'?Infinity:r.time+(r.stage===0?1.9:1.55),hp,maxHp:hp,hitAt:-1,id:++r.serial};r.lastSlot=index;}
function spawnNext(r){
 const limit=r.stage===0?1:3;if(r.slots.filter(Boolean).length>=limit)return;
 let free=r.slots.flatMap((m,i)=>!m&&i!==r.lastSlot?[i]:[]);if(!free.length)free=r.slots.flatMap((m,i)=>!m?[i]:[]);if(!free.length)return;
 r.spawned++;const type=r.spawned%9===0&&r.bonusTime<9?'clock':r.stage>0&&r.spawned%4===0?'gold':'normal';spawn(r,type,free[Math.floor(random(r)*free.length)]);
}
export function mushroomMedal(r){return r.score>=4000&&r.kingDefeated?'蘑菇王国超级鼓手':r.score>=1800?'森林节拍大师':r.score>=500?'蘑菇派对新星':'初次登台，再来一局！';}
export function hitMushroom(r,index){
 if(r.phase!=='playing'||!Number.isInteger(index)||index<0||index>=6||r.time-r.lastTap<.12)return false;
 const m=r.slots[index];if(m&&!mushroomCanHit(r,index))return false;
 r.lastTap=r.time;
 if(!m){r.combo=0;r.misses++;r.message='敲空啦，等蘑菇冒出来再敲。';r.lastStrike={serial:++r.serial,index,type:'empty',time:r.time,points:0,result:'miss'};return false;}
 m.hp--;m.hitAt=r.time;r.hits++;r.combo++;r.maxCombo=Math.max(r.maxCombo,r.combo);
 if(r.combo%5===0){r.feverUntil=r.time+5;r.message='连中 5 次！双倍欢乐开始！';}
 const double=r.time<r.feverUntil,points=(m.type==='gold'?200:m.type==='clock'?80:m.type==='king'?(m.hp===0?500:40):80)*(double?2:1);
 r.score+=points;
 if(m.type==='clock'){const extra=Math.min(3,9-r.bonusTime);r.bonusTime+=extra;r.message=`蓝帽蘑菇送你 ${extra} 秒！`;}
 else if(m.type==='gold')r.message=`金帽蘑菇！+${points} 分`;
 else if(m.type==='king'){r.kingHits++;r.message=m.hp?`菇王还要敲 ${m.hp} 下，它会换洞口哦！`:'菇王服啦！奶龙：下次请我当鼓手！';}
 else if(r.combo%5!==0)r.message=double?`双倍欢乐 · ${r.combo} 连击！`:`敲中！${r.combo>1?r.combo+' 连击':''}`;
 r.lastStrike={serial:++r.serial,index,type:m.type,time:r.time,points,result:m.hp?'bonk':'hit'};
 if(!m.hp){r.slots[index]=null;if(m.type==='king')r.kingDefeated=true;}
 else if(m.type==='king'&&m.hp%2===0){
  const dest=index===1?4:1;const displaced=r.slots[dest];r.slots[index]=displaced;r.slots[dest]=m;m.born=r.time;r.message+=' 换位啦！';
 }
 r.remaining=Math.max(0,MUSHROOM_SECONDS+r.bonusTime-r.time);return true;
}
export function stepMushrooms(r,dt){
 if(r.phase!=='playing')return;
 dt=Math.max(0,Math.min(.05,dt));r.time+=dt;r.remaining=Math.max(0,MUSHROOM_SECONDS+r.bonusTime-r.time);
 if(r.remaining<=1e-6){r.remaining=0;r.phase='finished';r.finished=true;r.slots.fill(null);r.message=mushroomMedal(r);return;}
 const stage=r.time>=32?2:r.time>=12?1:0;
 if(stage!==r.stage){r.stage=stage;r.message=stage===1?'更多蘑菇来赴约啦，留意金帽和蓝帽！':'菇王登场！敲它 6 下，别被换位骗到。';}
 for(let i=0;i<6;i++)if(r.slots[i]&&r.time>=r.slots[i].until){r.slots[i]=null;r.combo=0;r.misses++;}
 if(r.stage===2&&!r.kingStarted){r.kingStarted=true;spawn(r,'king',1,6);}
 if(r.time>=r.nextSpawn){spawnNext(r);r.nextSpawn=r.time+(r.stage===0?1.2:r.stage===1?.72:.82);}
}
