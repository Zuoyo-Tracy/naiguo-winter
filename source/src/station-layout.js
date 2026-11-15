import {sampleAt} from './track.js';
export const stations=[{id:0,s:10,label:'起点 · 星云驿站',area:'云海加速长廊',display:'起点'},{id:1,s:2160,label:'云宫驿站',area:'城堡出口 · 平台休息区',display:'约 2.16 km'},{id:2,s:3980,label:'雪境驿站',area:'雪国前庭 · 平台休息区',display:'约 3.98 km'}];
export function stationSurface(x,z){for(const n of stations){const p=sampleAt(n.s);if(Math.abs(x-p.x)<=22&&z>=p.z-12&&z<=p.z+40)return p.y;}return undefined;}
export const stationSolids=[];
