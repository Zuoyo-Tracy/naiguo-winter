import {startMushrooms,mushroomStages} from './mushroom-rules.js';
export function createMushroomControls(panel,getRound,restart,readBest){
 const el=document.createElement('div');el.id='mushroom-controls';el.hidden=true;
 el.innerHTML='<div id="mushroom-legend">金帽高分 · 蓝钟加时 · 五连击双倍</div><div id="mushroom-stats"><span id="mushroom-stage"></span><strong id="mushroom-score"></strong><span id="mushroom-combo"></span><span id="mushroom-king"></span></div><button id="mushroom-start">开场！</button><button id="mushroom-again" hidden>再来一局</button>';
 panel.prepend(el);const $=id=>el.querySelector('#'+id),text=(node,value)=>{if(node.textContent!==value)node.textContent=value;};
 $('mushroom-start').onclick=()=>{const r=getRound();if(r)startMushrooms(r);};$('mushroom-again').onclick=restart;
 return {show(visible){el.hidden=!visible;},update(r){
  const ready=r.phase==='ready';$('mushroom-start').hidden=!ready;$('mushroom-again').hidden=!r.finished;$('mushroom-stats').hidden=ready;
  el.dataset.fever=String(r.phase==='playing'&&r.time<r.feverUntil);
  text($('mushroom-stage'),r.finished?'本局完成':`${mushroomStages[r.stage]} · ${Math.ceil(r.remaining)} 秒`);
  text($('mushroom-score'),r.score+' 分');text($('mushroom-combo'),r.finished?`最高 ${r.maxCombo} 连击`:(r.time<r.feverUntil?'双倍欢乐！ · ':'')+r.combo+' 连击');
  text($('mushroom-king'),r.kingDefeated?'菇王已击败':r.kingStarted?'菇王还需 '+(6-r.kingHits)+' 下':'');
  text(panel.querySelector('#park-live'),ready?'点冒头的蘑菇，也可按 1–6。准备好后点「开场！」':r.finished?`${r.message} · 个人最佳 ${Math.max(r.score,readBest())} 分`:r.message);
 }};
}
