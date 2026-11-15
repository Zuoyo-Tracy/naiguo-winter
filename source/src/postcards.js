import {createPostcardStore} from './postcard-store.js';
import * as T from 'three';
import {clearCamera} from './camera-clearance.js';
import {parkSolids} from './park-rules.js';
import './postcards.css';
export function createPostcards({storage,clear,canCapture,getActor}){
 const book=createPostcardStore(storage),panel=document.createElement('section');panel.id='postcard-panel';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','postcard-title');
 panel.innerHTML='<div class="postcard-sheet"><header><div><small>咔咔照相馆 · 今日留影</small><h2 id="postcard-title">这一刻，也值得被收好。</h2></div><button id="postcard-close" aria-label="关闭明信片">×</button></header><img id="postcard-image" alt="咔咔为你拍摄的奶国游园纪念明信片"><p id="postcard-message" role="status"></p><footer><button id="postcard-save">保存明信片</button><button id="postcard-return">收好，继续逛</button></footer></div>';
 document.body.append(panel);const picture=panel.querySelector('img'),message=panel.querySelector('#postcard-message'),save=panel.querySelector('#postcard-save');let pending=null,open=false,canvas=null,returnFocus=null,revision=0;
 function close(){revision++;open=false;panel.hidden=true;document.body.classList.remove('postcard-open');clear();(returnFocus?.isConnected?returnFocus:document.querySelector('#world')).focus({preventScroll:true});}
 function show(){if(!open)returnFocus=document.activeElement;clear();open=true;panel.hidden=false;document.body.classList.add('postcard-open');panel.querySelector('#postcard-close').focus();}
 function frame(source,photo){
  const sw=source.naturalWidth||source.width,sh=source.naturalHeight||source.height,c=document.createElement('canvas');c.width=900;const height=Math.min(920,Math.round(840*sh/sw));c.height=height+190;const ctx=c.getContext('2d');
  ctx.fillStyle='#f2e6ce';ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle='#d7d8cc';ctx.fillRect(30,30,840,height);const scale=Math.min(840/sw,height/sh),w=sw*scale,h=sh*scale;ctx.drawImage(source,30+(840-w)/2,30+(height-h)/2,w,h);
  ctx.strokeStyle='#b89861';ctx.lineWidth=2;ctx.strokeRect(22,22,856,height+16);ctx.fillStyle='#544535';ctx.font='600 32px "Microsoft YaHei",sans-serif';ctx.fillText('奶国之冬：奶家人集合！',38,height+85);
  ctx.fillStyle='#876f4c';ctx.font='21px "Microsoft YaHei",sans-serif';ctx.fillText(photo.caption,40,height+123);ctx.font='17px "Microsoft YaHei",sans-serif';const date=new Date(photo.date);ctx.fillText(date.getFullYear()+' / '+String(date.getMonth()+1).padStart(2,'0')+' / '+String(date.getDate()).padStart(2,'0')+'     咔咔 · 留影',40,height+155);
  ctx.save();ctx.translate(814,height+106);ctx.rotate(-.14);ctx.strokeStyle='#977a4e';ctx.strokeRect(-37,-37,74,74);ctx.fillStyle='#7c6646';ctx.textAlign='center';ctx.font='bold 32px SimSun,serif';ctx.fillText('奶',0,10);ctx.restore();return c;
 }
 async function view(){
  if(!book.photo)return;const token=++revision,photo=book.photo,img=new Image();save.disabled=true;show();message.textContent='正在打开这一页留影…';
  try{img.src=photo.image;await img.decode();if(token!==revision)return;canvas=frame(img,photo);picture.src=canvas.toDataURL('image/png');message.textContent=book.saved?'最近的一张留影，留在当前账号的图鉴里。':'这张照片暂存在本次游玩里，关闭页面前请保存到本地。';save.disabled=false;}catch{if(token===revision)message.textContent='这一张照片没有完整保存，下次见到咔咔再拍一张吧。';}
 }
 function photoCamera(request,liveCamera){
  const actor=getActor(),person=request.position||actor,a=new T.Vector3(actor.x,actor.y+1.6,actor.z),b=new T.Vector3(person.x,person.y+1.45,person.z),target=a.clone().add(b).multiplyScalar(.5),radius=a.distanceTo(b)*.5+2.7,distance=radius/Math.sin(24*Math.PI/180)*1.12;
  const side=new T.Vector3(a.z-b.z,0,b.x-a.x).normalize(),view=liveCamera.position.clone().sub(target);if(side.dot(view)<0)side.negate();const base=Math.atan2(side.x,side.z);let best=null;
  for(const offset of [0,-.4,.4,-.8,.8,Math.PI]){const angle=base+offset,desired=target.clone().add(new T.Vector3(Math.sin(angle)*distance,distance*.3,Math.cos(angle)*distance)),safe=clearCamera(target,desired,parkSolids,.35),point=new T.Vector3(safe.x,safe.y,safe.z),clearance=point.distanceTo(target),score=clearance-Math.abs(offset)*.2;if(!best||score>best.score)best={point,score};}
  const camera=new T.PerspectiveCamera(48,1.5,.1,liveCamera.far);camera.position.copy(best.point);camera.lookAt(target);return camera;
 }
 function capture(renderer,scene,liveCamera,now){
  if(!pending||now<pending.at)return;const request=pending;pending=null;if(!canCapture())return;
  const previousSize=renderer.getSize(new T.Vector2()),previousRatio=renderer.getPixelRatio();
  try{
   renderer.setPixelRatio(1);renderer.setSize(1200,800,false);renderer.render(scene,photoCamera(request,liveCamera));
   const source=renderer.domElement,thumbnail=document.createElement('canvas'),scale=Math.min(1,720/source.width,960/source.height);thumbnail.width=Math.round(source.width*scale);thumbnail.height=Math.round(source.height*scale);thumbnail.getContext('2d').drawImage(source,0,0,thumbnail.width,thumbnail.height);
   const photo={version:1,image:thumbnail.toDataURL('image/jpeg',.82),caption:request.caption.slice(0,100),date:new Date().toISOString()};const stored=book.save(photo);canvas=frame(source,photo);picture.src=canvas.toDataURL('image/png');save.disabled=false;message.textContent=stored&&book.saved?'已收进图鉴。下次拍照会替换这一张；喜欢的话，先保存到本地。':'照片已拍好，但浏览器没能保存。可以先下载这张明信片。';show();window.dispatchEvent(new CustomEvent('winter-postcard-saved'));
  }catch{canvas=null;picture.removeAttribute('src');save.disabled=true;message.textContent='这张照片没能冲洗好，再找咔咔拍一次试试。';show();}
  finally{renderer.setPixelRatio(previousRatio);renderer.setSize(previousSize.x,previousSize.y,false);renderer.render(scene,liveCamera);}
 }
 save.onclick=()=>{if(!canvas)return;canvas.toBlob(blob=>{if(!blob)return;const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='奶国之冬-咔咔的明信片.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);},'image/png');};
 panel.querySelector('#postcard-close').onclick=close;panel.querySelector('#postcard-return').onclick=close;panel.onclick=e=>{if(e.target===panel)close();};
 // Registered before the NPC/game handlers so a photo never advances dialogue.
 addEventListener('keydown',e=>{if(!open)return;e.stopImmediatePropagation();if(e.code==='Escape'){e.preventDefault();close();}else if(e.code==='Tab'){e.preventDefault();const buttons=[...panel.querySelectorAll('button:not(:disabled)')],i=buttons.indexOf(document.activeElement);buttons[(i+(e.shiftKey?-1:1)+buttons.length)%buttons.length].focus();}else if(!['Space','Enter'].includes(e.code)||e.target.tagName!=='BUTTON')e.preventDefault();},{capture:true});
 addEventListener('winter-view-postcard',view);
 return {request({area,position}){pending={at:performance.now()+650,caption:area||'奶国冬日游园',position};},capture,view,get open(){return open;},get has(){return !!book.photo;},get saved(){return book.saved;},get pending(){return !!pending;}};
}
