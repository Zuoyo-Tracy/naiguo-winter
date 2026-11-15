import {setHidden} from './ui-state.js';
const regions=[];let hideTimer;
export function createHintChannel(){
 let until=-Infinity,priority=-Infinity;
 return {request(now,options={}){const nextPriority=options.priority??0;if(now<until&&nextPriority<=priority)return false;priority=nextPriority;until=now+Math.min(2400,Math.max(0,options.duration??2000));return true;},clear(){until=priority=-Infinity;},get until(){return until;}};
}
const channel=createHintChannel();
function toastElement(){let toast=document.getElementById('region-toast');if(!toast){toast=document.createElement('aside');toast.id='region-toast';toast.hidden=true;toast.setAttribute('role','status');toast.setAttribute('aria-live','polite');document.body.appendChild(toast);}return toast;}
function overlayOpen(){return ['#station-panel','#collection-panel','#naifrog-dialog','#festival-dialog','#postcard-panel','#resident-dialog'].some(selector=>{const el=document.querySelector(selector);return el&&!el.hidden;})||document.body.classList.contains('amusement')||document.body.classList.contains('riding');}
export function showRegionHint(text,now,{duration=2000,priority=0,kind='region'}={}){
 if(overlayOpen()||!channel.request(now,{duration,priority}))return false;
 const toast=toastElement();toast.textContent=text;toast.dataset.kind=kind;toast.dataset.until=String(channel.until);toast.hidden=false;clearTimeout(hideTimer);hideTimer=setTimeout(()=>{toast.hidden=true;},channel.until-now);return true;
}
export function registerRegionHint(text,x,y,z,radius=28){regions.push({text,x,y,z,radius,inside:false,lastShown:-Infinity});}
export function updateRegionHints(state,now,enabled=true){
 const toast=toastElement(),canShow=enabled&&state.status==='running'&&!state.snow&&!state.rescueStory?.dialog&&!state.storyJournalOpen&&!overlayOpen();let candidate=null;
 for(const r of regions){const d=Math.hypot(state.x-r.x,state.z-r.z),inside=d<r.radius+(r.inside?5:0)&&Math.abs((state.groundY||0)-r.y)<24,relevant=!state.autoTour||!/加速|磁力|倒挂/.test(r.text);if(canShow&&relevant&&inside&&!r.inside&&now-r.lastShown>8000){if(!candidate||d<candidate.d)candidate={r,d};}r.inside=inside;}
 if(candidate&&showRegionHint(candidate.r.text,now))candidate.r.lastShown=now;
 if(!canShow){setHidden(toast,true);channel.clear();clearTimeout(hideTimer);}else if(now>=channel.until)setHidden(toast,true);
}
