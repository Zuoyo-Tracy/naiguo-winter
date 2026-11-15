import assert from 'node:assert/strict';
import test from 'node:test';
import {attractions,parkApproachEnd} from '../src/park-rules.js';
import {festivalHubs} from '../src/festival-layout.js';
import {snowClearanceHeight} from '../src/park-clearance.js';

// Independent evaluation of the original plaza and approach cross sections.
function referenceHeight(x,z,y){
  const limits=[];
  const disk=(a,r)=>limits.push([Math.hypot(x-a.x,z-a.z)-r,a.y-2.5]);
  const slope=(a,start,end,width)=>{
    const dx=end.x-start.x,dz=end.z-start.z;
    const t=Math.max(0,Math.min(1,((x-start.x)*dx+(z-start.z)*dz)/(dx*dx+dz*dz)));
    const distance=Math.hypot(x-start.x-dx*t,z-start.z-dz*t);
    limits.push([distance-width,start.y+(a.y-start.y)*t-2.5]);
  };
  for(const a of attractions){disk(a,a.r);slope(a,a.anchor,parkApproachEnd(a),9);}
  for(const h of festivalHubs){disk(h,h.id==='post'?24:h.r+5);if(h.link)slope(h,{...h.link,y:h.y},h,10);}
  const exact=Math.min(...limits.filter(([edge])=>edge<0).map(([,height])=>height));
  const padded=Math.min(...limits.filter(([edge])=>edge<8).map(([,height])=>height));
  return Number.isFinite(exact)?exact:Math.min(y,(padded+y)/2);
}
test('snow cuts preserve plaza floors, sloping approaches and their feathered edges',()=>{
  for(const place of [...attractions,...festivalHubs]){
    for(const center of [place,place.anchor||place.link||place]){
      for(let dx=-80;dx<80;dx+=7.1)for(let dz=-80;dz<80;dz+=9.7){
        const x=center.x+dx,z=center.z+dz,y=place.y+6+.2*dx;
        assert.equal(snowClearanceHeight(x,z,y),referenceHeight(x,z,y));
      }
    }
  }
});
