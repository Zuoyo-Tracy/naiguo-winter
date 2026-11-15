import {assetLoadState} from './asset-loader.js';
import './world-loading.css';

export function createWorldLoading({quickEntry=false}={}){
 const panel=document.createElement('section');panel.id='world-loading';panel.setAttribute('aria-label','正在打开奶国');panel.innerHTML='<div class="loading-envelope"><span class="loading-stamp" aria-hidden="true">奶</span><small>一封来自冬日的邀请</small><h2>街灯亮了，<br>朋友们正在集合。</h2><p id="world-loading-message" role="status">正在铺开冬日街景…</p><div class="loading-track" aria-hidden="true"><i></i></div><div class="loading-actions"><button id="loading-explore" hidden>先沿主路逛逛</button><button id="loading-retry" hidden>重新打开乐园</button></div><span class="loading-note">拖曳环视 · WASD 驾驶 · M 打开藏宝图</span></div>';document.body.append(panel);
 let phase=0,percent=0,closed=false,revealRequested=false,recovery,backgroundNote;
 const text=panel.querySelector('#world-loading-message'),bar=panel.querySelector('i');
 const update=()=>{const loaded=assetLoadState.loaded,expected=Math.max(assetLoadState.requested,1),target=phase===0?Math.min(65,loaded/expected*65):phase===1?70+Math.min(20,loaded/expected*20):100;percent=Math.max(percent,target);bar.style.width=percent+'%';};
 const blockKeys=e=>{if(e.code==='Space'&&e.target?.tagName==='BUTTON')return;if(!closed&&/^(Key[WASDBMREFCIJ]|Arrow|Shift|Space)/.test(e.code)){e.preventDefault();e.stopImmediatePropagation();}};window.addEventListener('keydown',blockKeys,{capture:true});
 // Keep the letter opaque until the first playable frame has actually drawn.
 const dismiss=()=>{if(!closed)revealRequested=true;};
 function present(){
  if(closed||!revealRequested)return;
  closed=true;window.removeEventListener('keydown',blockKeys,{capture:true});
  if(quickEntry&&phase===1){backgroundNote=document.createElement('span');backgroundNote.className='world-loading-background';backgroundNote.setAttribute('role','status');backgroundNote.textContent='主路已开放 · 乐园其余区域准备中';document.body.append(backgroundNote);}
  panel.classList.add('departing');setTimeout(()=>panel.remove(),350);
 }
 panel.querySelector('#loading-explore').onclick=dismiss;panel.querySelector('#loading-retry').onclick=()=>location.reload();window.addEventListener('winter-assets',update);
 function offerRecovery(){
  if(recovery)return;
  recovery=document.createElement('aside');recovery.className='world-loading-recovery';recovery.setAttribute('aria-label','景观加载提示');
  recovery.innerHTML='<p role="status">有些景观还没有载入，已打开的街道可以继续游玩。</p><button class="recovery-retry">重新载入</button><button class="recovery-later">继续逛逛</button>';
  recovery.querySelector('.recovery-retry').onclick=()=>location.reload();
  recovery.querySelector('.recovery-later').onclick=()=>{recovery.remove();};document.body.append(recovery);
  const map=document.querySelector('#station-panel');
  if(map&&!map.querySelector('.world-loading-map-retry')){const button=document.createElement('button');button.className='world-loading-map-retry';button.textContent='部分景观未载入 · 重新打开乐园';button.onclick=()=>location.reload();map.append(button);}
 }
 return {streetsReady(){phase=1;text.textContent='街道已经准备好，正在安置游乐设施与奶蛙朋友…';panel.querySelector('#loading-explore').hidden=false;update();if(quickEntry)setTimeout(dismiss,120);},complete(){phase=2;backgroundNote?.remove();update();text.textContent='奶家人，到齐了。';setTimeout(dismiss,350);window.removeEventListener('winter-assets',update);},failed(){backgroundNote?.remove();text.textContent='有一处场景没能载入。可以重试，或先在已经打开的街道游玩。';panel.querySelector('#loading-retry').hidden=false;window.removeEventListener('winter-assets',update);if(closed||revealRequested)offerRecovery();else panel.querySelector('#loading-explore').onclick=()=>{dismiss();offerRecovery();};},present,get waiting(){return !closed&&!revealRequested;},get open(){return !closed;}};
}
