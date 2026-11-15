import {skiAttraction} from './ski-layout.js';
import {carnivalAttractions} from './carnival-layout.js';
import {sampleAt,TRACK_LENGTH} from './track.js';
export const attractions=[
 skiAttraction,
 {id:'carousel',name:'玫瑰旋转木马',kind:'carousel',x:505,z:220,y:29,r:39,station:1,anchor:sampleAt(2400),duration:45,description:'白马、天鹅与马车环绕华盖缓缓起伏。'},
 {id:'teacups',name:'午后茶杯舞会',kind:'teacups',x:545,z:325,y:32,r:30,station:1,anchor:sampleAt(4070),duration:40,description:'茶杯绕茶壶旋转，按 A / D 调整自转。'},
 {id:'bumper',name:'奶家人碰碰车',kind:'bumper',x:90,z:670,y:32,r:38,station:2,story:true,anchor:sampleAt(4475),duration:60,description:'解救奶鼠后开放。60 秒内与三位对手碰撞得分。'},
 {id:'ferris',name:'星河之眼 · 摩天轮',kind:'ferris',x:-460,z:670,y:32,r:44,station:2,anchor:sampleAt(TRACK_LENGTH-10),duration:70,description:'坐进观景座舱，在终点俯瞰奶国。'},
 ...carnivalAttractions,
 {id:'swings',name:'雪花飞椅',kind:'swings',x:-310,z:670,y:32,r:32,station:2,anchor:sampleAt(TRACK_LENGTH-45),duration:45,description:'随华盖升起，在星空下掠过雪地花园。'}
];
