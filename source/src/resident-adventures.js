import {residentAdventures} from './resident-adventure-data.js';

export const RESIDENT_STORIES_KEY='winter-resident-stories-v1';
const blank=()=>({started:false,clues:[],solved:false,choice:null,complete:false});
export function createResidentAdventures(storage){
 const states=Object.fromEntries(residentAdventures.map(q=>[q.id,blank()]));let saved=true,revision=0;
 try{
  const data=JSON.parse(storage.getItem(RESIDENT_STORIES_KEY)||'null');
  if(data?.version===1)for(const q of residentAdventures){
   const value=data.quests?.[q.id];if(!value||typeof value!=='object')continue;
   const s=states[q.id];s.started=value.started===true;
   s.clues=s.started?[...new Set((Array.isArray(value.clues)?value.clues:[]).filter(id=>q.clues.some(c=>c.id===id)))]:[];
   const choice=q.decision.choices.find(c=>c.id===value.choice&&c.correct);
   s.solved=s.started&&s.clues.length===q.clues.length&&!!choice&&value.solved===true;
   s.choice=s.solved?choice.id:null;s.complete=s.solved&&value.complete===true;
  }
 }catch{}
 function persist(){revision++;try{storage.setItem(RESIDENT_STORIES_KEY,JSON.stringify({version:1,quests:states}));saved=true;}catch{saved=false;}}
 return {
  get(id){return structuredClone(states[id]||blank());},get state(){return structuredClone(states);},get revision(){return revision;},get saved(){return saved;},
  act(id,action,value){
   const q=residentAdventures.find(q=>q.id===id),s=states[id];if(!q||!s)return {ok:false,reason:'unknown'};
   if(action==='start'){
    if(!s.started){s.started=true;persist();}return {ok:true};
   }
   if(!s.started)return {ok:false,reason:'unstarted'};
   if(action==='inspect'){
    if(!q.clues.some(c=>c.id===value))return {ok:false,reason:'unknown'};
    if(!s.clues.includes(value)){s.clues.push(value);persist();}return {ok:true};
   }
   if(action==='choose'){
    if(s.clues.length!==q.clues.length)return {ok:false,reason:'clues'};
    const choice=q.decision.choices.find(c=>c.id===value);if(!choice)return {ok:false,reason:'unknown'};
    if(s.solved)return {ok:true,already:true};
    if(!choice.correct)return {ok:false,reason:'choice',reply:choice.reply};
    s.choice=choice.id;s.solved=true;persist();return {ok:true,reply:choice.reply};
   }
   if(action==='finish'){
    if(!s.solved)return {ok:false,reason:'unsolved'};
    if(s.complete)return {ok:true,already:true};s.complete=true;persist();return {ok:true,award:'resident:'+id};
   }
   return {ok:false,reason:'unknown'};
  }
 };
}

export function residentObjective(quest,state){
 if(!state.started)return '先和'+quest.name+'聊聊';
 if(state.complete)return '这件小事，已经有了你的结局';
 if(state.solved)return '回到'+quest.name+'身边，看看接下来发生了什么';
 const clue=quest.clues.find(c=>!state.clues.includes(c.id));
 return clue?'看看附近的'+clue.title:'去操作台试试你的办法';
}
