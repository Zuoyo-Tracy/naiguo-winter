import test from 'node:test';
import assert from 'node:assert/strict';
import {residentMapEntries,residentCollectionEntries} from '../src/collection-residents.js';
import {residentAdventures} from '../src/resident-adventure-data.js';
import {npcPlacements} from '../src/naifrog-layout.js';
import {collectionDestination} from '../src/story-destinations.js';
import {createCollection,collectionEntries,COLLECTION_KEY} from '../src/collection.js';

const storage=()=>{const data=new Map();return {getItem:key=>data.get(key)||null,setItem:(key,value)=>data.set(key,value)};};

test('three resident stories have unique map and collection IDs without duplicating the nine friends',()=>{
 const expected=['resident:height','resident:picnic','resident:poster'];
 assert.deepEqual(residentCollectionEntries.map(entry=>entry.id),expected);
 assert.deepEqual(residentMapEntries(2).map(entry=>entry.id),expected);
 for(const entry of residentCollectionEntries){
  assert.equal(entry.category,'residents');
  assert.equal(collectionDestination(entry.id),entry.id);
 }
 assert.equal(collectionEntries.length,57);
 assert.equal(new Set(collectionEntries.map(entry=>entry.id)).size,57);
 assert.equal(collectionEntries.filter(entry=>entry.category==='friends').length,9);
});

test('story locations fall back to their resident while the world loads, and retain station locks',()=>{
 const locked=residentMapEntries(0),mid=residentMapEntries(1),all=residentMapEntries(2);
 assert.ok(locked.every(entry=>!entry.unlocked));
 assert.deepEqual(mid.filter(entry=>entry.unlocked).map(entry=>entry.id),['resident:picnic']);
 assert.ok(all.every(entry=>entry.unlocked));
 for(const quest of residentAdventures){
  const entry=all.find(entry=>entry.id==='resident:'+quest.id),npc=npcPlacements.find(person=>person.kind===quest.kind);
  assert.equal(entry.category,'story');
  assert.deepEqual([entry.p.x,entry.p.y,entry.p.z],[npc.x,npc.y,npc.z]);
  assert.equal(entry.p.groundY,npc.y);
  assert.equal(entry.p.arrival.x,npc.x);
  assert.equal(entry.station,quest.station);
  assert.match(entry.description,new RegExp(quest.name));
 }
});

test('map uses current task destinations and objectives, and visits by the story ID',()=>{
 const requested=[],visited=[];
 const destination={x:10,y:4,z:20,groundY:4,yaw:1,station:1,arrival:{x:12,y:4,z:20,groundY:4,yaw:1}};
 const options={residents:{
  destination(id){requested.push(id);return id==='picnic'?destination:null;},
  objective(id){return id==='picnic'?'去操作台挪动糖罐':null;}
 },onVisitResident:id=>visited.push(id)};
 const entries=residentMapEntries(2,options),picnic=entries.find(entry=>entry.id==='resident:picnic');
 assert.deepEqual(requested,['height','picnic','poster']);
 assert.equal(picnic.p,destination);
 assert.match(picnic.description,/去操作台挪动糖罐/);
 picnic.action();assert.deepEqual(visited,['picnic']);
 assert.ok(Number.isFinite(entries.find(entry=>entry.id==='resident:height').p.x));
});

test('a previously complete guide keeps all old achievements and earns each new story separately',()=>{
 const saved=storage(),sky=collectionEntries.filter(entry=>entry.id.startsWith('sky')),old=collectionEntries.filter(entry=>entry.category!=='residents'&&!entry.id.startsWith('sky')).map(entry=>entry.id);
 saved.setItem(COLLECTION_KEY,JSON.stringify(old));
 const book=createCollection(saved);assert.equal(book.count,34);assert.equal(book.total,57);assert.equal(book.complete,false);
 for(const entry of residentCollectionEntries){assert.ok(book.mark(entry.id));assert.equal(book.mark(entry.id),null);}
 assert.equal(book.complete,false);
 const reloaded=createCollection(saved);assert.equal(reloaded.count,37);assert.equal(reloaded.complete,false);
 assert.equal(sky.length,20);assert.ok(sky.every(entry=>!reloaded.has(entry.id)));
 for(const entry of sky)reloaded.mark(entry.id);assert.equal(reloaded.complete,true);
 assert.ok(old.every(id=>reloaded.has(id)));
});
