// Expanded boxes protect the body, without treating decorative wing tips as walls.
export function pushOutsideBox(p,b,r=1.2){
 const lo={x:b.min.x-r,y:b.min.y-r,z:b.min.z-r},hi={x:b.max.x+r,y:b.max.y+r,z:b.max.z+r};
 if(['x','y','z'].some(k=>p[k]<=lo[k]||p[k]>=hi[k]))return null;
 let axis='x',value=lo.x,depth=Infinity;
 for(const k of ['x','y','z'])for(const edge of [lo[k],hi[k]]){const d=Math.abs(p[k]-edge);if(d<depth){depth=d;axis=k;value=edge;}}
 return {...p,[axis]:value};
}
export function safeSkyCamera(origin,desired,boxes){
 let stop=1;
 for(const b of boxes){if(!b.min)continue;let enter=0,leave=1;
  for(const k of ['x','y','z']){const d=desired[k]-origin[k],lo=b.min[k]-.5,hi=b.max[k]+.5;if(Math.abs(d)<1e-9){if(origin[k]<lo||origin[k]>hi){leave=-1;break;}}else{const a=(lo-origin[k])/d,c=(hi-origin[k])/d;enter=Math.max(enter,Math.min(a,c));leave=Math.min(leave,Math.max(a,c));}}
  if(enter<=leave&&leave>=0&&enter>=0)stop=Math.min(stop,Math.max(.08,enter-.04));
 }
 return {x:origin.x+(desired.x-origin.x)*stop,y:origin.y+(desired.y-origin.y)*stop,z:origin.z+(desired.z-origin.z)*stop};
}
