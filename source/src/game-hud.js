import {driveSpeedKmh} from './park-driving.js';
// Keep the overlay quiet: changing numbers update, unchanged labels keep their DOM.
export function createGameHUD({stations,trackLength,checkpointCount,parkProtected}){
 const elements=new Map(),get=selector=>{let el=elements.get(selector);if(!el?.isConnected){el=document.querySelector(selector);elements.set(selector,el);}return el;};
 const text=(selector,value)=>{const el=get(selector),next=String(value);if(el.textContent!==next)el.textContent=next;};
 const html=(selector,value)=>{const el=get(selector);if(el.innerHTML!==value)el.innerHTML=value;};
 return (state,boost,{amusement=false}={})=>{
  document.body.classList.toggle('timed-challenge',!!state.challenge&&!state.challenge.finished);document.body.classList.toggle('haunted',!!state.snow);
  const hint=get('#snow-hint');if(hint.hidden!==!state.snow)hint.hidden=!state.snow;
  text('#snow-hint',state.snow?`解救奶鼠 · ${(state.hauntS/1000).toFixed(2)} / 2.00 km · 限速40 · 封门 ${state.seal}/3 · ${state.hauntMessage||state.rescueObjective||'追踪呼救声'}`:'');
  if(amusement)return;
  text('.telemetry > span',state.snow?'水晶球 · 雪夜旧宅':(state.challenge&&!state.challenge.finished?'计时挑战 → '+stations[state.challenge.to].label:'不计时 · 自由探索'));
  text('.rule',state.snow?'调查信物 · 辨认回声 · 解救奶鼠':state.mode==='explore'?'漫游保护 · 路沿与建筑仍会阻挡车辆':'驶离赛道将坠落');
  html('.keys',state.snow?'拖曳环视 · W/S 前后 · A/D 避让<br>E 揭符开门 · B 制动 · 限速 40 km/h':'拖曳 环视 · WASD 驾驶 · C 回正<br>空格 跳跃　Shift 加速　B 制动　R 重开');
  text('#speed',Math.round(driveSpeedKmh(state)));
  text('#timer',state.challenge&&!state.challenge.finished?state.challenge.elapsed.toFixed(2)+' s':'自由探索');
  text('#checkpoint',state.snow?`封门 ${state.seal} / 3`:`星门 ${state.cp} / ${checkpointCount}`);
  text('#damage',!state.snow&&state.mode==='explore'?'漫游保护 · 碰撞不扣生命':parkProtected(state.x,state.z,state.groundY)?'乐园保护 · 碰撞不扣生命':`撞击 ${state.hits} / 2`);
  const challenge=state.challenge&&!state.challenge.finished?state.challenge:null,total=challenge?Math.abs(stations[challenge.to].s-stations[challenge.from].s):trackLength,done=challenge?Math.max(0,Math.min(total,(state.progress-stations[challenge.from].s)*Math.sign(stations[challenge.to].s-stations[challenge.from].s))):state.progress;
  text('#progress',state.snow?`${(state.hauntS/1000).toFixed(2)} / 2.00 km`:`${(done/1000).toFixed(2)} / ${(total/1000).toFixed(2)} km`);
  text('#boost-status',state.autoTour?'安全领航 · 弯道自动减速':state.snow?'鬼屋限速 40 km/h':state.parkCruising?(boost?'游园提速 · 90 km/h':'游园巡航 · Shift 提速'):boost?'SHIFT 已识别 · 喷射加速':'SHIFT 按住加速');get('#boost-status').classList.toggle('active',boost);
  text('#factor','×'+state.factor.toFixed(0));
  text('#flow',state.autoTour?'安心漫游':state.snow?'雪夜旧宅 · 鬼屋闯关':state.magnetic?'磁力倒挂 · A/D 保持车道':state.falling?'离轨下落':state.parkCruising?'乐园巡航':state.factor>1.05?'星光跑道 ×'+state.factor.toFixed(1):state.boost?'喷射推进中':'星光巡航');
 };
}
