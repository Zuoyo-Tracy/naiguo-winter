import {stations} from './station-layout.js';
import {sampleAt} from './track.js';
export const villageSites=[{z:-30,y:0,turn:0},{z:525,y:12,turn:Math.PI}].flatMap(lane=>[-254,-230,-206,-182,-158,110,134,158,182,206].map(x=>({...lane,x}))).filter(site=>!stations.some(n=>{const p=sampleAt(n.s);return Math.abs(p.x-site.x)<55&&Math.abs(p.z+24-site.z)<55;}));
