import {setHidden} from './ui-state.js';
import {publicAsset} from './public-assets.js';
import {createCollection,collectionEntries} from './collection.js';
import {stations} from './station-layout.js';
import {sampleAt} from './track.js';
import {collectionDestination} from './story-destinations.js';
import './collection.css';
export function createCollectionUI({storage,getState,clear,canOpen,hasPostcard=()=>false}){
 const book=createCollection(storage),launch=document.createElement('button'),panel=document.createElement('section'),toast=document.createElement('div');
 launch.id='collection-open';launch.setAttribute('aria-haspopup','dialog');launch.setAttribute('aria-expanded','false');
 panel.id='collection-panel';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','collection-title');
 panel.innerHTML=`<div class="collection-sheet"><div class="collection-heading"><div><small>奶国学 · 课外实践 / VOL. 01</small><h2 id="collection-title">奶家人的冬日图鉴</h2></div><button id="collection-close" aria-label="关闭图鉴">关闭 ×</button></div><p class="collection-lead">不赶路，也有收获。把遇见的人和快乐的事，一页页收好。</p><div class="collection-summary"><strong id="collection-count"></strong><span id="collection-title-award"></span></div><progress id="collection-progress"></progress><nav aria-label="图鉴分类"><button data-section="friends">奶蛙朋友</button><button data-section="rides">游乐体验</button><button data-section="journey">旅途足迹</button><button data-section="letters">冬夜来信</button><button data-section="residents">街坊轶事</button><button data-section="sky">云游邮戳</button></nav><div id="collection-list"></div><p id="collection-save"></p></div>`;
 toast.id='collection-toast';toast.hidden=true;toast.setAttribute('role','status');toast.setAttribute('aria-live','polite');document.body.append(panel,toast);document.querySelector('#open-map').before(launch);
 let open=false,category='friends',version=-1,toastUntil=0,returnFocus=null;
 const stationLocations=stations.map(n=>({...sampleAt(n.s),id:n.id}));
 function render(){
  launch.textContent=`冬日图鉴  ${book.count} / ${book.total} · I`;
  panel.querySelector('#collection-count').textContent=`${book.count} / ${book.total} 已收录`;
  panel.querySelector('#collection-title-award').textContent=book.complete?'奶国全景收藏家 · 已达成':'集齐全部记录，成为「奶国全景收藏家」';
  const progress=panel.querySelector('progress');progress.max=book.total;progress.value=book.count;
  for(const b of panel.querySelectorAll('[data-section]')){const entries=collectionEntries.filter(e=>e.category===b.dataset.section);const name={friends:'奶蛙朋友',rides:'游乐体验',journey:'旅途足迹',letters:'冬夜来信',residents:'街坊轶事',sky:'云游邮戳'}[b.dataset.section];b.textContent=`${name} ${entries.filter(e=>book.has(e.id)).length}/${entries.length}`;b.setAttribute('aria-pressed',String(category===b.dataset.section));}
  panel.querySelector('#collection-list').innerHTML=collectionEntries.filter(e=>e.category===category).map((e,i)=>`<article class="collection-card ${book.has(e.id)?'collected':''}" data-entry="${e.id}"><span class="collection-portrait">${e.kind?`<img src="${publicAsset('/ui/collection/'+e.kind+'.png')}" alt="${e.name}" loading="lazy">`:`<span class="collection-number">${String(i+1).padStart(2,'0')}</span>`}</span><div><span class="collection-area">${e.area}</span><h3>${e.name}</h3>${e.profile?`<p class="resident-talent">闪光点 · ${e.profile.talent}</p><p>小心愿 · ${e.profile.wish}</p>`:''}<p>${book.has(e.id)?(e.profile?'你们已经相识，路过时再聊聊吧。':'这一页，已经有你的故事。'):e.hint}</p><button class="collection-locate" data-locate="${collectionDestination(e.id)}">${e.category==='sky'?'在天空航图上找':e.id==='journey:train'?'去附近驿站乘车':'在藏宝图上找'}</button>${e.kind==='photographer'&&hasPostcard()?'<button class="collection-locate" data-postcard>查看咔咔的明信片</button>':''}</div><span class="collection-stamp">${book.has(e.id)?'已收录 ✓':'待发现'}</span></article>`).join('');
  panel.querySelector('#collection-save').textContent=book.saved?'进度自动保存 · 九位朋友，每人独一页 · 提前结束游乐体验也会记下到访':'本次记录已收录，但浏览器未允许保存；关闭页面后可能丢失。';
  version=book.revision;
 }
 function close(){if(!open)return;open=false;panel.hidden=true;document.body.classList.remove('collection-open');launch.setAttribute('aria-expanded','false');clear();(returnFocus?.isConnected?returnFocus:launch).focus({preventScroll:true});}
 function show(){if(!canOpen())return;returnFocus=document.activeElement;clear();open=true;panel.hidden=false;toast.hidden=true;document.body.classList.add('collection-open');launch.setAttribute('aria-expanded','true');render();panel.querySelector('#collection-close').focus();}
 function mark(id){const entry=book.mark(id);if(!entry)return;window.dispatchEvent(new CustomEvent('winter-collect',{detail:{id:entry.id}}));toast.textContent=book.complete?'图鉴集齐！你是奶国全景收藏家。':`图鉴 +1 · ${entry.name} · ${book.count}/${book.total}`;toastUntil=performance.now()+2600;toast.hidden=open;render();}
 launch.onclick=()=>open?close():show();panel.querySelector('#collection-close').onclick=close;
 panel.querySelectorAll('[data-section]').forEach(b=>b.onclick=()=>{category=b.dataset.section;render();});
 panel.onclick=e=>{if(e.target.closest('[data-postcard]')){window.dispatchEvent(new CustomEvent('winter-view-postcard'));return;}const locate=e.target.closest('[data-locate]');if(locate){const id=locate.dataset.locate;close();window.dispatchEvent(new CustomEvent('winter-locate',{detail:{id}}));return;}if(e.target===panel)close();};
 addEventListener('keydown',e=>{if(open){e.stopImmediatePropagation();if(e.code==='Escape'||e.code==='KeyI'){e.preventDefault();close();}else if(e.code==='Tab'){e.preventDefault();const buttons=[...panel.querySelectorAll('button')],i=buttons.indexOf(document.activeElement);buttons[(i+(e.shiftKey?-1:1)+buttons.length)%buttons.length].focus();}else if(['Space','ArrowUp','ArrowDown'].includes(e.code)&&e.target.tagName!=='BUTTON')e.preventDefault();return;}if(e.code==='KeyI'&&!e.repeat&&!/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)&&canOpen()){e.preventDefault();e.stopImmediatePropagation();show();}},{capture:true});
 addEventListener('winter-postcard-saved',render);
 render();return {mark,has:book.has,get open(){return open;},close,update({ready,mapOpen,ride,amusement,talking}){
  const s=getState();launch.disabled=!ready||mapOpen||!!ride||amusement||talking||!!s.rescueStory?.dialog||!!s.storyJournalOpen||s.status!=='running';
  if(open&&launch.disabled)close();
  if(ready&&s.status==='running'&&!s.snow&&!s.falling){for(const p of stationLocations)if(Math.abs(s.groundY-p.y)<3&&Math.abs(s.x-p.x)<23&&s.z-p.z>=-13&&s.z-p.z<=41)mark('station:'+p.id);}
  if(s.snowDone)mark('journey:rescue');
  if(book.revision!==version)render();if(performance.now()>toastUntil)setHidden(toast,true);
  if(new URLSearchParams(location.search).has('test'))window.__collectionDebug={count:book.count,total:book.total,found:book.snapshot(),complete:book.complete,open};
 }};
}
