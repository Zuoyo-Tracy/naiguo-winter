import {residentAdventures} from './resident-adventure-data.js';
import {npcPlacements} from './naifrog-layout.js';

export const residentCollectionEntries=residentAdventures.map(quest=>({
 id:'resident:'+quest.id,category:'residents',name:quest.title,
 area:quest.name+' · 街坊轶事',
 hint:quest.hook+' 找他聊聊，调查现场，再把你的办法告诉他。'
}));

export function residentMapEntries(unlocked,options={}){
 return residentAdventures.map(quest=>{
  const npc=npcPlacements.find(person=>person.kind===quest.kind);
  const fallback={x:npc.x,z:npc.z,y:npc.y,groundY:npc.y,yaw:npc.yaw,station:quest.station};
  fallback.arrival={...fallback};
  const destination=options.residents?.destination?.(quest.id)||fallback;
  const objective=options.residents?.objective?.(quest.id)||'先和'+quest.name+'聊聊';
  return {id:'resident:'+quest.id,category:'story',name:quest.title,
   subtitle:'街坊轶事 · '+quest.name,description:quest.hook+' '+objective+'。',
   p:destination,station:quest.station,unlocked:quest.station<=unlocked,
   action:()=>options.onVisitResident?.(quest.id),button:'去看看这件小事'};
 });
}
