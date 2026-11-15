import {readPreferences,normalizePreferences,PREFERENCES_KEY,pixelRatioFor} from './preference-model.js';
import {createParkAudio} from './park-audio.js';
import {textureBudget} from './texture-budget.js';
import './park-preferences.css';

export function createParkPreferences({renderer,fog,storage}){
 const mobile=matchMedia('(pointer:coarse)').matches&&Math.min(innerWidth,innerHeight)<800;
 let value=readPreferences(storage,matchMedia('(prefers-reduced-motion:reduce)').matches,mobile?'low':'balanced');const audio=createParkAudio(),panel=document.createElement('details');panel.className='park-preferences';panel.innerHTML=`<summary>游园偏好 · 画面、声音与操作</summary><div class="preferences-grid"><label>画面精细度<select id="setting-quality"><option value="low">轻快 / 省电</option><option value="balanced">均衡</option><option value="high">精细</option></select></label><label class="preference-check"><input type="checkbox" id="setting-comfort">舒适视角<span>加速时保持稳定视角，减少闪动</span></label><label class="preference-check"><input type="checkbox" id="setting-cruise">乐园巡航<span>游园车速 60 km/h，按 Shift 可达 90 km/h</span></label><label>拖曳灵敏度 <output id="setting-sensitivity-value"></output><input type="range" id="setting-sensitivity" min=".5" max="1.7" step=".1"></label><label class="preference-check"><input type="checkbox" id="setting-audio">冬日音乐盒与环境声<span>轻音乐、行车声和收集提示音</span></label><label>声音大小 <output id="setting-volume-value"></output><input type="range" id="setting-volume" min="0" max=".6" step=".02"></label></div><p id="preferences-save" role="status">${mobile?'手机首次使用轻快画质，更快进入；可随时切换均衡或精细。':'偏好会随当前账号保存在本机。'}</p><button type="button" id="retry-textures" hidden>重新载入贴图</button>`;document.querySelector('#station-panel').append(panel);
 const $=id=>panel.querySelector('#setting-'+id),message=panel.querySelector('#preferences-save');
 function labels(){$('sensitivity-value').textContent=value.sensitivity.toFixed(1)+' ×';$('volume-value').textContent=Math.round(value.volume/.6*100)+'%';}
 let appliedQuality,textureWork=Promise.resolve();
 function apply(){renderer.setPixelRatio(pixelRatioFor(value.quality,devicePixelRatio));renderer.setSize(innerWidth,innerHeight,false);fog.near=value.quality==='low'?350:480;fog.far={low:1150,balanced:1600,high:2000}[value.quality];document.body.classList.toggle('comfortable-view',value.comfort);labels();if(appliedQuality!==value.quality){appliedQuality=value.quality;textureWork=textureBudget.setQuality(value.quality);}return textureWork;}
 const retry=panel.querySelector('#retry-textures');
 let qualityRequest=0;
 async function setDetail(retryFailed=false){
  const request=++qualityRequest;
  retry.hidden=true;
  message.textContent='正在调整画面精细度…';
  const result=await (retryFailed?textureBudget.setQuality(value.quality,{retry:true}):apply());
  if(request!==qualityRequest)return;
  retry.hidden=!result.incomplete;
  message.textContent=result.incomplete?'部分贴图暂未载入，可继续游玩或重试。':'画面精细度已更新。';
 }
 retry.onclick=()=>setDetail(true);
 for(const id of ['quality','comfort','cruise','sensitivity','audio','volume']){
  const el=$(id);
  if(el.type==='checkbox')el.checked=value[id];else el.value=value[id];
  el.addEventListener(el.type==='range'?'input':'change',async()=>{
   value=normalizePreferences({...value,[id]:el.type==='checkbox'?el.checked:el.type==='range'?Number(el.value):el.value});
   let feedback='游园偏好已保存。';
   if(id==='quality')await setDetail();
   else if(id==='comfort')apply();
   else labels();
   if(id==='audio'||id==='volume'){
    try{
     const supported=await audio.configure(value.audio,value.volume);
     if(value.audio&&!supported)feedback='当前浏览器暂不支持声音，其他功能仍可使用。';
    }catch{
     value.audio=false;$('audio').checked=false;feedback='声音未能开启，稍后可再次尝试。';
    }
   }
   try{
    storage.setItem(PREFERENCES_KEY,JSON.stringify(value));
    if(id!=='quality')message.textContent=feedback;
   }catch{message.textContent='偏好已应用，本次浏览器未允许保存。';}
  });
 }
 // Saved sound never starts without a fresh user gesture.
 if(value.audio){value.audio=false;$('audio').checked=false;message.textContent='点击开启音乐盒，即可继续上次的声音设置。';}
 const guide=document.createElement('details');guide.className='park-visitor-guide';guide.innerHTML='<summary>第一次来奶国 · 游园小指南</summary><p>底部选择漫游目的地，点击出发即可自动行驶，再点加速提档；随时停止，或用 WASD 接管。想挑战自己，点击赛车选择起终点。参加设施、停稳和奶蛙打招呼，都会留下图鉴记录。</p><div class="visitor-guide-routes"><button data-guide="friend:welcome">认识阿迎</button><button data-guide="story:post">拆开冬夜来信</button><button data-guide="journey:rescue">寻找水晶球旧宅</button></div><dl><dt>W / S · 方向键上下</dt><dd>前进 / 后退</dd><dt>A / D · 方向键左右</dt><dd>转向</dd><dt>鼠标或单指拖曳</dt><dd>环视，C 回正镜头</dd><dt>Shift / 空格 / B</dt><dd>加速 / 跳跃 / 制动</dd><dt>M / I / J</dt><dd>藏宝图 / 图鉴 / 冬夜来信</dd></dl><p>乐园巡航默认开启，可在偏好中调整。自由探索时斜擦栏杆会沿边滑行，正面遇到设施会停下，按 S 可倒车。赛车模式和鬼屋仍有挑战，失败后可从已解锁驿站重生。</p>';document.querySelector('#station-panel').append(guide);guide.onclick=e=>{const button=e.target.closest('[data-guide]');if(button)window.dispatchEvent(new CustomEvent('winter-locate',{detail:{id:button.dataset.guide}}));};
 apply();return {get value(){return value;},resize:apply,audio};
}

