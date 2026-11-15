import {globe} from './snow-globe.js';
export const rescueEntrance={id:'journey:rescue',name:'雪夜旧宅 · 解救奶鼠',subtitle:'水晶球里的两公里悬疑旅程',description:'开进水晶球，追踪奶粉与奶鼠留下的线索。这里限速 40 km/h，先调查，再判断听到的呼救是否可信。救援完成后，碰碰车项目开放。',x:globe.x-17,z:globe.z,y:globe.y,yaw:Math.PI/2,station:2};

export function collectionDestination(id){
 const letters={'festival:letter':'post','festival:photos':'photos','festival:rhythm':'music','festival:relay':'music','festival:snack':'music','festival:finale':'finale'};
 return letters[id]?'story:'+letters[id]:id;
}
