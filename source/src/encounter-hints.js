import {showRegionHint} from './region-hints.js';

// One shared encounter channel prevents a street of residents and props from
// producing a queue of pop-ups. Entering while paused or slow does not defer a
// message until the visitor closes a menu or accelerates beside the same prop.
export function createEncounterTracker({show=()=>true,cooldown=12000,exitRadius=45}={}){
 const entered=new Set();let lastShown=-Infinity;
 return {update(entries,state,now,enabled=true){
  const candidates=[];
  for(const entry of entries){
   const distance=Math.hypot(state.x-entry.x,state.z-entry.z),sameFloor=Math.abs((state.groundY??0)-entry.y)<=3;
   if(distance>exitRadius){entered.delete(entry.id);continue;}
   if(!sameFloor)continue;
   if(distance>(entry.radius??24)||entered.has(entry.id))continue;
   entered.add(entry.id);
   if(Math.abs(state.speed)>(entry.minSpeed??4))candidates.push({entry,distance});
  }
  if(!enabled||state.status!=='running'||state.snow||state.falling||state.magnetic||state.rescueStory?.dialog||state.storyJournalOpen||now-lastShown<cooldown)return null;
  candidates.sort((a,b)=>a.distance-b.distance);
  const entry=candidates[0]?.entry;if(!entry||!show(entry,now))return null;
  lastShown=now;return entry;
 }};
}
const tracker=createEncounterTracker({show:(entry,now)=>showRegionHint(entry.text,now,{duration:2400,priority:2,kind:'encounter'})});
export const updateEncounterHints=(entries,state,now,enabled)=>tracker.update(entries,state,now,enabled);

export const residentHooks={
 welcome:'阿迎正给迷路的人留位置',chef:'酥酥在给第三锅饼干找评委',photographer:'咔咔给你留了半张合照',reader:'书签翻到了一页奇怪的脚印',traveler:'远山听见旧宅里有人求救',santa:'绒绒的礼物袋缺一件好事',thinker:'小问想知道照片外发生了什么',laugher:'哈哈笑到一半，忽然停了',cheerer:'比比在给合照多留一个位置'
};
export const storyHooks={postbox:'邮筒里有封没署名的信',photos:'三张原片，谁少看了两张',case:'失物箱里，帽子压着半封信',rhythm:'留声机把半句笑声当成了谜题',bakery:'点心师的快乐配方又失败了',bell0:'月亮铃等谁先开口',bell1:'雪花铃正等上一声回应',bell2:'星星铃要把邀请传远一点',camera:'这张大合照，还空着一个位置'};
