import {setHidden,setText,setDisabled} from './ui-state.js';
import {publicAsset} from './public-assets.js';
import * as T from 'three';
import {updateEncounterHints,storyHooks} from './encounter-hints.js';
import {createFestivalStory,festivalObjective,rhythmPattern} from './festival-story.js';
import {festivalHubs,festivalSites} from './festival-layout.js';
import './festival.css';
const photos=[{id:'catch',image:'laugher',time:'18:42:09',title:'所有人突然伸出手',text:'那只奶蛙正往前扑，另一位已经把吹走的帽子接住。裁过的照片只留下了捧腹的笑脸。'}, {id:'return',image:'cheerer',time:'18:42:12',title:'帽子回到主人手里',text:'大家松了口气，比出胜利手势。站在画面外的托腮蛙没有看到这一张。'}, {id:'wind',image:'thinker',time:'18:42:07',title:'一阵风先来了',text:'帽檐上的信封飞了出去。托腮蛙转身去追，只听见身后的笑声。'}];
export function createFestivalController({scene,camera,storage,getState,clear,canOpen,unlocked,onTravel,onAward,onReact=()=>{}}){
 const encounterSites=festivalSites.map(site=>({...site,id:'story-prop:'+site.id,sourceId:site.id,radius:20,minSpeed:3,text:(storyHooks[site.id]||site.name)+'\nB 制动 · 停稳按 E'}));
 const story=createFestivalStory(storage);let world=null,near=null,view=null,order=[],notes=[],timers=[],listening=false,sound=true,audio=null,time=0,cinematic=0,replay=0,lastRevision=-1;
 const launch=document.createElement('button');launch.id='festival-open';launch.textContent='冬夜来信 · J';launch.title='查看支线与庭院';document.querySelector('#open-map').before(launch);
 const prompt=document.createElement('button');prompt.id='festival-prompt';prompt.hidden=true;const panel=document.createElement('section');panel.id='festival-dialog';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','festival-title');panel.innerHTML='<div class="festival-heading"><span>奶蛙学 · 冬夜来信</span><button id="festival-close" aria-label="关闭来信">×</button></div><h2 id="festival-title"></h2><div id="festival-content"></div><p id="festival-response" role="status" aria-live="polite"></p>';
 document.body.append(prompt,panel);const content=panel.querySelector('#festival-content'),title=panel.querySelector('#festival-title'),response=panel.querySelector('#festival-response');
 const button=(text,fn,id)=>{const b=document.createElement('button');b.textContent=text;if(id)b.id=id;b.onclick=fn;return b;};
 function stopSounds(){for(const t of timers)clearTimeout(t);timers=[];listening=false;}
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)return;const wasListening=listening;stopSounds();if(wasListening){const readout=panel.querySelector('#festival-notes');if(readout)readout.textContent='播放已暂停，可以重新听一遍。';}});
 function tone(i){if(!sound)return;try{audio??=new (window.AudioContext||window.webkitAudioContext)();audio.resume();const osc=audio.createOscillator(),gain=audio.createGain();osc.frequency.value=[293.66,369.99,440][i];osc.type='sine';gain.gain.setValueAtTime(.0001,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.035,audio.currentTime+.02);gain.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+.45);osc.connect(gain).connect(audio.destination);osc.start();osc.stop(audio.currentTime+.5);}catch{}}
 function cue(i){world?.cue('bell'+i);world?.cue('rhythm');onReact(i);tone(i);for(const b of panel.querySelectorAll('[data-note]')){b.classList.toggle('sounding',Number(b.dataset.note)===i);}timers.push(setTimeout(()=>panel.querySelectorAll('.sounding').forEach(b=>b.classList.remove('sounding')),420));}
 function result(action,value){const r=story.dispatch(action,value);if(r.award)onAward(r.award);response.textContent=r.message;return r;}
 function close(){stopSounds();view=null;cinematic=0;replay=0;panel.hidden=true;panel.classList.remove('replaying');document.body.classList.remove('festival-open');clear();document.querySelector('#world').focus({preventScroll:true});}
 function show(id){if(!canOpen()&&!view)return;stopSounds();view=id;order=[];notes=[];clear();getState().speed=0;panel.hidden=false;prompt.hidden=true;document.body.classList.add('festival-open');render();panel.querySelector('#festival-close').focus({preventScroll:true});}
 function say(text){const p=document.createElement('p');p.textContent=text;content.append(p);}
 function actions(...buttons){const row=document.createElement('div');row.className='festival-actions';row.append(...buttons);content.append(row);}
 function render(){content.replaceChildren();response.textContent='';panel.dataset.view=view;const s=story.state;
  if(view==='book'){
   title.textContent='那张没有笑声的合照';say('一张裁掉了前后的照片，让一只奶蛙以为自己不受欢迎。把来信、原片和笑声串起来，去听完整的故事。');
   const objective=document.createElement('strong');objective.className='festival-objective';objective.textContent=festivalObjective(s);content.append(objective);
   const steps=[['letter','01 来信 · 星云驿站','post'],['photos','02 原片 · 木马小庭院','photos'],['rhythm','03 节拍 / 04 铜铃 · 茶杯小庭院','music'],['finale','05 合照 · 摩天轮小庭院','finale']];
   for(const [key,label,hub] of steps){const h=festivalHubs.find(h=>h.id===hub),b=button((s[key]?'✓ ':'')+label,()=>{if(h.station>unlocked()||!world)return;close();onTravel(h);},'festival-go-'+hub);b.disabled=h.station>unlocked()||!world;b.title=h.station>unlocked()?'先到达对应驿站解锁区域':'前往已解锁的庭院入口';b.className='festival-destination';content.append(b);}
   say(s.snack?'点心委托 ✓ 已替朋友装好一盒饼干。':'可选：在茶杯旁帮点心师选一盒饼干。');say(story.saved?'每个小步骤都会自动保存。再次来访可以接着玩。':'浏览器未允许保存，本页关闭后可能丢失任务进度。');
  }else if(view==='postbox'){
   title.textContent='信封上写着：“也许不用等我”';say('「我听见他们笑得很开心。照片里也是。可能我不在，大家更自在吧。」');say('迎宾蛙把没写完的回信递给你：“我不知道它看见了哪一刻。木马旁有原片，能替我去看一眼吗？”');actions(button(s.letter?'再读一遍来信':'收好来信',()=>result('letter'),'festival-accept'));
  }else if(view==='photos'){
   title.textContent='先翻背面，再把前后拼起来';if(!s.letter){say('展架旁夹着一行字：请先去星云驿站读那封没有署名的信。');return;}
   say('摄影师：“只看中间那张，你会猜到完全不同的故事。”');const grid=document.createElement('div');grid.className='festival-photos';
   for(const p of photos){const card=button('',()=>{result('clue',p.id);card.classList.toggle('turned');card.querySelector('span').textContent=card.classList.contains('turned')?p.time+' · '+p.text:p.title;},'festival-clue-'+p.id);card.dataset.clue=p.id;card.innerHTML=`<img src="${publicAsset('/ui/festival/'+p.image+'.png')}" alt="${p.title}"><span>${p.title}</span>`;grid.append(card);}content.append(grid);
   const chosen=document.createElement('p');chosen.id='festival-order';chosen.textContent='排列：按真实发生的先后选择原片';content.append(chosen);actions(...photos.map(p=>button(p.title,()=>{if(order.includes(p.id))return;order.push(p.id);chosen.textContent='排列：'+order.map(id=>photos.find(p=>p.id===id).title).join(' → ');},'festival-order-'+p.id)));
   actions(button('看他们把经过演一遍',()=>{world?.replay();replay=9;panel.classList.add('replaying');panel.querySelector('#festival-close').focus();response.textContent='先是风，接着有人伸手，最后才是笑声。';},'festival-replay'),button('重新排列',()=>{order=[];chosen.textContent='排列已清空';}),button('核对完整故事',()=>{const r=result('photos',order);if(r.ok){world?.cue('photos');onReact(2);}},'festival-check-photos'));
  }else if(view==='case'){
   title.textContent='失物箱里还有半封信';say('箱里叠着围巾、旧地图和那顶被风吹跑的帽子。信纸背面写着：“不是要每个人都笑，只是希望每个人都在。”');say(s.photos?'现在，你知道是谁漏看了照片的前后。给它一点时间，也把真实的经过告诉它。':'这顶帽子也许能解释照片。先去翻看展架上三张原片的背面。');actions(button('记下这条线索',()=>result('clue','case'),'festival-case'));
  }else if(view==='rhythm'){
   title.textContent='不许笑营业所，今日暂停忍笑';if(!s.photos){say('留声机的唱片套上贴着原片编号。先完成原片调查，奶蛙才愿意解释这段录音。');return;}
   say('捧腹蛙：“我笑到一半停下，是换气，不是突然不欢迎谁！”听四声，再按同样顺序回应。');const readout=document.createElement('p');readout.id='festival-notes';readout.textContent='低 · 中 · 中 · 高';content.append(readout);
   actions(button('听一遍 / 看灯光',()=>{stopSounds();notes=[];listening=true;readout.textContent='正在播放……';rhythmPattern.forEach((n,i)=>timers.push(setTimeout(()=>{cue(n);readout.textContent=`第 ${i+1} 声：${['低','中','高'][n]}`;},i*700+150)));timers.push(setTimeout(()=>{listening=false;readout.textContent='轮到你了：';},3100));},'festival-listen'),button(sound?'声音：开':'声音：关',e=>{sound=!sound;render();},'festival-sound'));
   const row=document.createElement('div');row.className='festival-actions';for(let i=0;i<3;i++){const b=button(['低音','中音','高音'][i],()=>{if(listening)return;if(notes.length===4)notes=[];notes.push(i);cue(i);readout.textContent='你的回应：'+notes.map(n=>['低','中','高'][n]).join(' · ');if(notes.length===4)result('rhythm',notes);},'festival-note-'+i);b.dataset.note=i;row.append(b);}content.append(row);say('听不清也没关系：灯光和文字会同步提示。');
  }else if(view.startsWith('bell')){
   const i=Number(view.slice(4));title.textContent=['月亮铃 · 先开口','雪花铃 · 接着回应','星星铃 · 传到远方'][i];say(s.rhythm?'每次只摇一只铃。看奶蛙点头，再去下一只：月亮 → 雪花 → 星星。':'铜铃还在等一段正确的节拍。先去旁边的留声机。');say(`已传递 ${s.relayStep}/3 声`);actions(button('摇铃',()=>{const r=result('bell',i);if(r.ok)cue(i);},'festival-ring'));
  }else if(view==='bakery'){
   title.textContent='点心师的“标准快乐”配方，失败了';say('“我称了三次糖，还是不知道朋友会喜欢哪种。”它把量勺放下：“要不，先听听对方怎么说？”');say('给今晚来合照的朋友装一盒。不考你，没有唯一正确答案。');actions(...[['snow','雪花 · 怕冷的朋友'],['heart','爱心 · 想认真道歉'],['moon','月亮 · 想和人分享']].map(([id,label])=>button(label,()=>{result('snack',id);world?.cue('bakery');onReact(1);},'festival-cookie-'+id)));
  }else if(view==='camera'){
   title.textContent=s.finale?'再留住一个冬夜':'合照前，还空着一个位置';if(!s.relay){say('摄影师没有催快门：“先把邀请传给每个人吧。原片、笑声和三只铜铃都在那里。”');return;}
   say('托腮蛙停在台阶边：“我可以不笑得那么用力吗？”');say('“当然，”捧腹蛙说，“我也可以先喘口气。”你准备怎么邀请它？');actions(button('伸出手，轻声邀请',()=>finish('invite'),'festival-finale-invite'),button('留好位置，等它走来',()=>finish('wait'),'festival-finale-wait'));
  }
 }
 function finish(choice){const r=result('finale',choice);if(!r.ok)return;world?.celebrate();cinematic=12;onReact(2);title.textContent='奶家人，一个都不少';content.replaceChildren();say(r.message);say('大家依次回应，镜头前留着那个位置。');actions(button('把这张合照收进图鉴',close,'festival-finale-close'));}
 launch.onclick=()=>view?close():show('book');prompt.onclick=()=>near&&show(near.id);panel.querySelector('#festival-close').onclick=close;
 addEventListener('keydown',e=>{if(view){e.stopImmediatePropagation();if(['Escape','KeyJ'].includes(e.code)){e.preventDefault();close();}else if(e.code==='Tab'){e.preventDefault();const list=[...panel.querySelectorAll('button:not(:disabled)')].filter(b=>b.getClientRects().length),i=list.indexOf(document.activeElement);list[(i+(e.shiftKey?-1:1)+list.length)%list.length].focus();}return;}if(e.repeat||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;if(e.code==='KeyJ'&&canOpen()){e.preventDefault();e.stopImmediatePropagation();show('book');}else if(e.code==='KeyE'&&near&&canOpen()&&Math.abs(getState().speed)<3){e.preventDefault();e.stopImmediatePropagation();show(near.id);}},{capture:true});
 return {story,visit(id){const h=festivalHubs.find(h=>h.id===id);if(h&&world&&h.station<=unlocked()){close();onTravel(h);}},setWorld(w){world=w;for(const key of ['letter','photos','rhythm','relay','snack','finale'])if(story.state[key])onAward('festival:'+key);},get open(){return !!view;},get cinematic(){return cinematic>0;},close,update(dt,{enabled}){time+=dt;world?.update(dt,story.state);const s=getState();near=null;if(enabled&&world&&!view&&s.status==='running'&&!s.snow&&Math.abs(s.speed)<3){let best=7;for(const site of festivalSites){const d=Math.hypot(s.x-site.x,s.z-site.z);if(site.station<=unlocked()&&Math.abs(s.groundY-site.y)<3&&d<best){best=d;near=site;}}}setHidden(prompt,!near||!!view);if(near)setText(prompt,'E · '+near.name);setDisabled(launch,!enabled&&!view);
  updateEncounterHints(encounterSites.filter(site=>site.station<=unlocked()),s,performance.now(),enabled&&!!world&&!view);
  if(view&&view!=='book'){if(replay>0){replay=Math.max(0,replay-dt);world?.replayCamera(camera);if(replay===0)panel.classList.remove('replaying');}else if(cinematic>0){cinematic=Math.max(0,cinematic-dt);world?.photoCamera(camera,12-cinematic);}else{const site=festivalSites.find(v=>v.id===view);if(site){const target=new T.Vector3(site.x,site.y+1.5,site.z),desired=target.clone().add(new T.Vector3(4,4.8,9));camera.position.lerp(desired,1-Math.exp(-5*dt));camera.lookAt(target);camera.fov=52;camera.updateProjectionMatrix();}}}
  if(story.revision!==lastRevision){lastRevision=story.revision;launch.title=festivalObjective(story.state);launch.classList.toggle('complete',story.state.finale);}
  if(new URLSearchParams(location.search).has('test'))window.__festivalDebug={loaded:!!world,view,near:near?.id,state:story.state,objective:festivalObjective(story.state),cinematic,replay,sites:festivalSites,solids:world?.solids};
 }};
}
