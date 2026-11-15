import {magnets,meteorsAt,magneticPose} from './challenges.js';
const meteorSites=meteorsAt(0);
// Both route guides and automatic driving reserve the complete meteor fall
// zone and the low parts of inversion ribbons, even between active hazards.
export function outsideMagneticLane(x,z,radius=2.1,height=3){
 if(meteorSites.some(m=>Math.hypot(x-m.x,z-m.z)<m.radius+radius+.6))return false;
 for(const m of magnets)for(const dx of [-radius,0,radius]){
  const px=x+dx;if(px < -105||px > 105)continue;
  const p=magneticPose(px,0,m),sin=Math.sin(p.roll),cos=Math.cos(p.roll);let lo=-5,hi=5;
  if(Math.abs(sin)<.0001){if(p.y>m.base+height+.45)continue;}
  else{const a=(m.base-.5-p.y)/sin,b=(m.base+height+.45-p.y)/sin;lo=Math.max(lo,Math.min(a,b));hi=Math.min(hi,Math.max(a,b));if(lo>hi)continue;}
  const a=p.z+m.dir*lo*cos,b=p.z+m.dir*hi*cos;
  if(z>Math.min(a,b)-radius&&z<Math.max(a,b)+radius)return false;
 }
 return true;
}
