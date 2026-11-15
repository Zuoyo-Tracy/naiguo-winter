import {hauntCourts,chooseMaze} from './haunt-maze.js';
import {setHidden,setText} from './ui-state.js';
import {chooseRescue,ensureStory} from './rescue-story.js';
import './rescue-ui.css';
export function createRescueUI(getState,clear){
 const panel=document.createElement('section');panel.id='rescue-dialog';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','rescue-title');panel.innerHTML='<div class="rescue-paper"><small id="rescue-speaker"></small><h2 id="rescue-title"></h2><p id="rescue-text"></p><div id="rescue-options"></div></div>';document.body.append(panel);
 const button=document.createElement('button');button.id='rescue-notebook';button.hidden=true;button.textContent='雪夜手记';document.body.append(button);
 const fork=document.createElement('section');fork.id='haunt-fork';fork.hidden=true;fork.setAttribute('aria-label','鬼屋岔路选择');document.body.append(fork);
 addEventListener('keydown',e=>{const s=getState();if(!s.snow||!s.hauntJunction||s.rescueStory?.dialog||s.storyJournalOpen||e.repeat||/INPUT|TEXTAREA|SELECT/.test(e.target?.tagName))return;const side=['KeyA','ArrowLeft'].includes(e.code)?1:['KeyD','ArrowRight'].includes(e.code)?-1:0;if(side){e.preventDefault();e.stopImmediatePropagation();clear();chooseMaze(s,side);}},{capture:true});
 let forkId=null;
 let journal=false,last=null;button.onclick=()=>{journal=!journal;clear();};
 panel.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Tab'){const list=[...panel.querySelectorAll('button')],i=list.indexOf(document.activeElement);e.preventDefault();list[(i+(e.shiftKey?-1:1)+list.length)%list.length]?.focus();}});panel.addEventListener('keyup',e=>e.stopPropagation());
 return s=>{const court=hauntCourts.find(c=>c.id===s.hauntJunction);setHidden(fork,!s.snow||!court||!!s.rescueStory?.dialog||journal);
 if(court&&forkId!==court.id){forkId=court.id;fork.replaceChildren();const title=document.createElement('strong');title.textContent=court.title;const hint=document.createElement('p');hint.textContent=court.hint;fork.append(title,hint);for(const [side,label] of [[1,'← A / '+court.left],[-1,court.right+' / D →']]){const b=document.createElement('button');b.textContent=label;b.onclick=()=>{clear();chooseMaze(getState(),side);};fork.append(b);}}
 if(!court)forkId=null;
 const q=s.rescueStory;setHidden(button,!s.snow&&!s.snowDone);if(!q){setHidden(panel,true);journal=false;last=null;s.storyJournalOpen=false;return;}s.storyJournalOpen=journal;if(!s.snow&&!q.ending)journal=false;
 setText(button,`雪夜手记 · 证据 ${q.evidence.length}/4${q.ending?' · '+(q.ending==='together'?'破晓同行':'未完的约定'):''}`);
 const d=journal?{kind:'journal',title:q.ending?(q.ending==='together'?'结局 · 破晓同行':'结局 · 未完的约定'):'雪夜手记',speaker:'已调查的事实',text:q.journal.map(j=>j.title+'\n'+j.text).join('\n\n')||'尚未找到证据。留意路旁发光的信物，靠近后按 E 调查。',options:[['close','合上手记']]}:q.dialog;
 setHidden(panel,!d);if(!d){last=null;return;}const signature=JSON.stringify(d);if(signature===last)return;last=signature;clear();panel.querySelector('#rescue-speaker').textContent=d.speaker;panel.querySelector('#rescue-title').textContent=d.title;panel.querySelector('#rescue-text').textContent=d.text;const options=panel.querySelector('#rescue-options');options.replaceChildren();for(const [id,label] of d.options){const b=document.createElement('button');b.textContent=label;b.onclick=()=>{clear();if(id==='close')journal=false;else chooseRescue(getState(),id);last=null;};options.append(b);}options.querySelector('button')?.focus();
 };
}
