import {skyActivities,readActivities} from './sky-activities.js';
import {skyChapters} from './sky-journey.js';
import {festivalAwards} from './festival-layout.js';
import {residentCollectionEntries} from './collection-residents.js';
import {npcPlacements,npcNames,npcProfiles,residentKind} from './naifrog-layout.js';
import {attractions} from './park-rules.js';
import {stations} from './station-layout.js';
export const COLLECTION_KEY='winter-field-guide-v1';
export const collectionEntries=[
 ...skyActivities.map(a=>({id:a.id,category:"sky",name:a.title,area:a.label,hint:"全驿站解锁后，打开天空航图，前往对应云岛完成活动。"})),
 ...skyChapters.map((c,i)=>({id:'sky:'+i,category:'journey',name:c.name,area:'云上心愿邮局',hint:'全驿站解锁后，完成对应天空章节。'})),
 ...residentCollectionEntries,
 ...festivalAwards.map(e=>({...e,category:'letters',area:'冬夜来信',hint:'按 J 打开冬夜来信，完成对应的现场互动。'})),
 ...npcPlacements.map(n=>({id:'friend:'+n.kind,category:'friends',name:npcNames[n.kind],area:n.area,kind:n.kind,profile:npcProfiles[n.kind],hint:'找到这位奶蛙，停稳后按 F 打招呼。'})),
 ...attractions.map(a=>({id:'ride:'+a.id,category:'rides',name:a.name,area:a.story?'解救奶鼠后开放':a.name,hint:'在入口点击「开始体验」，参加一次即可收录。'})),
 ...stations.map(n=>({id:'station:'+n.id,category:'journey',name:n.label,area:'旅途足迹',hint:'到达驿站广场，留下你的足迹。'})),
 {id:'journey:train',category:'journey',name:'窗外是整个奶国',area:'雪国观光列车',hint:'在任一已解锁驿站登上观光列车。'},
 {id:'journey:rescue',category:'journey',name:'带奶鼠回家',area:'水晶球 · 雪夜旧宅',hint:'完成旧宅中的救援故事。'}
];
const valid=new Set(collectionEntries.map(e=>e.id));
export function createCollection(storage){
 let recorded=[];try{const value=JSON.parse(storage.getItem(COLLECTION_KEY)||'[]');if(Array.isArray(value))recorded=value;}catch{}
 const found=new Set(recorded.map(id=>typeof id==='string'&&id.startsWith('friend:')&&residentKind(id)?'friend:'+residentKind(id):id).filter(id=>valid.has(id)));let revision=0,saved=true;
 for(const id of readActivities(storage).done)found.add(id);
 // Preserve earlier meetings of any former duplicate as this one unique resident.
 try{const friends=JSON.parse(storage.getItem('naifrog-friends')||'[]');if(Array.isArray(friends))for(const kind of friends)if(residentKind(kind))found.add('friend:'+residentKind(kind));}catch{}
 try{const stamps=JSON.parse(storage.getItem('park-passport')||'[]');if(Array.isArray(stamps))for(const id of stamps)if(valid.has('ride:'+id))found.add('ride:'+id);}catch{}
 if(storage.getItem('park-rescue-complete')==='yes')found.add('journey:rescue');
 function persist(){try{storage.setItem(COLLECTION_KEY,JSON.stringify([...found]));saved=true;}catch{saved=false;}}
 function mark(id){if(typeof id==='string'&&id.startsWith('friend:')&&residentKind(id))id='friend:'+residentKind(id);if(!valid.has(id)||found.has(id))return null;found.add(id);revision++;persist();return collectionEntries.find(e=>e.id===id);}
 return {mark,has:id=>found.has(id),get count(){return found.size;},get total(){return collectionEntries.length;},get revision(){return revision;},get saved(){return saved;},get complete(){return found.size===valid.size;},snapshot:()=>[...found]};
}
