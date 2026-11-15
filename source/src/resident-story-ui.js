import {setHidden,setText} from './ui-state.js';
import * as T from 'three';
import {residentAdventures} from './resident-adventure-data.js';
import {createResidentAdventures,residentObjective} from './resident-adventures.js';
import {npcPlacements} from './naifrog-layout.js';
import {clearCamera} from './camera-clearance.js';
import {parkSolids} from './park-rules.js';
import {updateEncounterHints} from './encounter-hints.js';
import './resident-story.css';

export function createResidentController({storage,getState,clear,camera,canOpen,onAward,onReact}){
 const story=createResidentAdventures(storage);let world=null,view=null,near=null,enabled=false;
 const prompt=document.createElement('button');prompt.id='resident-prompt';prompt.hidden=true;document.body.append(prompt);
 const panel=document.createElement('section');panel.id='resident-dialog';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','resident-title');
 panel.innerHTML='<button class="resident-close" aria-label="关闭剧情">×</button><small>冬日街坊 · 一件小事</small><h3 id="resident-title"></h3><div class="resident-copy"></div><p class="resident-objective"></p><div class="resident-actions"></div><small class="resident-save"></small>';document.body.append(panel);
 const button=(label,action,id)=>{const b=document.createElement('button');b.textContent=label;if(id)b.dataset.action=id;b.onclick=action;panel.querySelector('.resident-actions').append(b);};
 const quest=id=>residentAdventures.find(q=>q.id===id);
 function close(){view=null;panel.hidden=true;document.body.classList.remove('resident-talking');clear();document.querySelector('#world').focus({preventScroll:true});}
 function destination(id){const q=quest(id);if(!q)return null;const s=story.get(id),kit=world?.kits.get(id),n=npcPlacements.find(n=>n.kind===q.kind);let p;
  if(!s.started||s.solved)p=kit?.npcArrival||{x:n.x+5,z:n.z,y:n.y,groundY:n.y,yaw:-Math.PI/2};
  else{const clue=q.clues.find(c=>!s.clues.includes(c.id));p=world?.things.get(id+':'+(clue?.id||'decision'))?.arrival||kit?.npcArrival||n;}
  return {...p,station:q.station,arrival:{...p}};
 }
 function paint(title,lines,actions){
  panel.querySelector('h3').textContent=title;const copy=panel.querySelector('.resident-copy');copy.replaceChildren();for(const line of lines){const p=document.createElement('p');p.textContent=line;copy.append(p);}
  panel.querySelector('.resident-objective').textContent=residentObjective(view.q,story.get(view.q.id));panel.querySelector('.resident-actions').replaceChildren();actions();
  panel.querySelector('.resident-save').textContent=story.saved?'':'浏览器暂未保存，本次旅程可以继续。';panel.hidden=false;prompt.hidden=true;document.body.classList.add('resident-talking');clear();getState().speed=0;getState().boost=false;panel.querySelector('.resident-actions button')?.focus({preventScroll:true});
 }
 function locate(){const id=view.q.id;close();dispatchEvent(new CustomEvent('winter-locate',{detail:{id:'resident:'+id}}));}
 function renderNPC(q){const s=story.get(q.id);view={q,npc:true};
  if(s.complete){paint(q.title,q.returnLines,()=>button('改天再聊',close,'close'));return;}
  if(!s.started){paint(q.name+' · '+q.title,q.intro,()=>button('我去看看',()=>{story.act(q.id,'start');close();},'start'));return;}
  if(s.solved){paint(q.name+' · 事情有了下文',q.conclusion,()=>button('收好这段回忆',()=>{const r=story.act(q.id,'finish');if(r.award)onAward(r.award);onReact(q.kind);paint('图鉴收录 · '+q.title,q.returnLines,()=>button('继续逛逛',close,'close'));},'finish'));return;}
  paint(q.name+'还等着你的发现',[q.hook,residentObjective(q,s)],()=>{button('在地图上找找',locate,'locate');button('我再看看',close,'close');});
 }
 function showProp(p){if(!enabled||!canOpen())return;const q=quest(p.quest),s=story.get(q.id);view={q,prop:p};
  if(!s.started){paint(q.title,['这件小东西似乎让'+q.name+'犯了难。先和他打个招呼吧。'],()=>{button('看看他在哪里',locate,'locate');button('稍后再来',close,'close');});return;}
  if(s.solved){paint(q.title,[s.complete?'这里还留着你帮忙的痕迹。':'办法奏效了！回去告诉'+q.name+'吧。'],()=>{button('在地图上找他',locate,'locate');button('继续逛逛',close,'close');});return;}
  if(p.key!=='decision'){const clue=q.clues.find(c=>c.id===p.key);paint(clue.title,clue.lines,()=>button(s.clues.includes(clue.id)?'看过了，继续找找':'记下这个发现',()=>{story.act(q.id,'inspect',clue.id);close();},'inspect'));return;}
  if(s.clues.length<q.clues.length){paint(q.decision.title,['先把附近两处线索都看一看，动手时会更有把握。'],()=>{button('地图上找线索',locate,'locate');button('继续观察',close,'close');});return;}
  choices(q);
 }
 function choices(q,reply=[]){paint(q.decision.title,[...q.decision.lines,...reply],()=>{for(const choice of q.decision.choices)button(choice.label,()=>{const r=story.act(q.id,'choose',choice.id);if(!r.ok){choices(q,r.reply||['再看看附近的线索。']);return;}onReact(q.kind);paint('办法奏效了',r.reply,()=>{button('去告诉'+q.name,close,'close');button('地图指路',locate,'locate');});},'choose:'+choice.id);});}
 prompt.onclick=()=>near&&showProp(near);panel.querySelector('.resident-close').onclick=close;
 addEventListener('keydown',e=>{if(view){if(e.code==='Tab'){e.preventDefault();e.stopImmediatePropagation();const bs=[...panel.querySelectorAll('button')].filter(b=>!b.hidden);bs[(bs.indexOf(document.activeElement)+(e.shiftKey?-1:1)+bs.length)%bs.length].focus();return;}if(e.code==='Escape'){e.preventDefault();close();}e.stopImmediatePropagation();return;}if(e.code==='KeyE'&&!e.repeat&&near&&enabled&&Math.abs(getState().speed)<4&&!/INPUT|TEXTAREA|SELECT/.test(e.target?.tagName)){e.preventDefault();e.stopImmediatePropagation();showProp(near);}},{capture:true});
 return {story,get open(){return !!view;},close,destination,objective:id=>residentObjective(quest(id),story.get(id)),
  npcOption(kind){const q=residentAdventures.find(q=>q.kind===kind);if(!q||!world)return null;const s=story.get(q.id);return s.complete?'聊聊后来的事':s.solved?'告诉他你的办法':'聊聊：'+q.title;},
  openNPC(kind){const q=residentAdventures.find(q=>q.kind===kind);if(q&&world&&canOpen())renderNPC(q);},
  npcLines(kind){const q=residentAdventures.find(q=>q.kind===kind);return q&&story.get(q.id).complete?q.returnLines:null;},
  setWorld(value){world=value;for(const q of residentAdventures)if(story.get(q.id).complete)onAward('resident:'+q.id);world.update(2,story.state);},
  update(dt,active){enabled=active;const s=getState();world?.update(dt,story.state);near=null;
   if(!view&&enabled&&canOpen()&&world){let best=6.8;for(const p of world.things.values()){const d=Math.hypot(s.x-p.x,s.z-p.z);if(d<best&&Math.abs(s.groundY-p.y)<2){near=p;best=d;}}}
   setHidden(prompt,!near||Math.abs(s.speed)>=4||!!view);if(near)setText(prompt,'E · '+near.title);
   if(world)updateEncounterHints([...world.things.values()].filter(p=>story.get(p.quest).started&&!story.get(p.quest).solved).map(p=>({id:'resident-prop:'+p.id,x:p.x,y:p.y,z:p.z,radius:18,text:p.title+'\nB 制动 · 停稳按 E'})),s,performance.now(),enabled&&!view);
   if(view&&camera){
    const p=view.prop||npcPlacements.find(n=>n.kind===view.q.kind),target=new T.Vector3(p.x,p.y+(p.quest==='picnic'?1.25:1.9),p.z),base=Math.atan2(s.x-p.x,s.z-p.z);
    if(!view.camera){let best=null;for(const offset of [.85,-.85,1.25,-1.25]){const angle=base+offset,eye=target.clone().add(new T.Vector3(Math.sin(angle)*6,2.3,Math.cos(angle)*6)),safe=clearCamera(target,eye,parkSolids),away=Math.hypot(safe.x-s.x,safe.z-s.z),score=safe.fraction*8+Math.min(away,5)-Math.abs(offset)*.1;if(!best||score>best.score)best={...safe,score};}view.camera=new T.Vector3(best.x,best.y,best.z);}
    camera.position.lerp(view.camera,1-Math.exp(-7*dt));target.y-=innerWidth<600?1.7:.65;camera.lookAt(target);camera.fov=52;camera.updateProjectionMatrix();
   }
   if(new URLSearchParams(location.search).has('test'))window.__residentStoryDebug={open:!!view,near:near?.id,states:story.state,saved:story.saved,...world?.debug(),destinations:residentAdventures.map(q=>({id:q.id,...destination(q.id)}))};
  }
 };
}
