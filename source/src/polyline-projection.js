// Exact nearest point on an immutable route. Bounds only reject segments that
// cannot win; ties retain the original route order, including overlapping lanes.
export function createPolylineProjector(points){
 const segments=points.slice(0,-1).map((a,index)=>{const b=points[index+1],dx=b.x-a.x,dz=b.z-a.z;return {a,b,index,dx,dz,lengthSquared:dx*dx+dz*dz||1,yaw:Math.atan2(dx,dz),minX:Math.min(a.x,b.x),maxX:Math.max(a.x,b.x),minZ:Math.min(a.z,b.z),maxZ:Math.max(a.z,b.z)};});
 function build(items){
  if(!items.length)return null;
  const node={minX:Infinity,maxX:-Infinity,minZ:Infinity,maxZ:-Infinity};for(const s of items){node.minX=Math.min(node.minX,s.minX);node.maxX=Math.max(node.maxX,s.maxX);node.minZ=Math.min(node.minZ,s.minZ);node.maxZ=Math.max(node.maxZ,s.maxZ);}
  if(items.length<=8){node.items=items;return node;}
  const axis=node.maxX-node.minX>node.maxZ-node.minZ?'X':'Z';items.sort((a,b)=>a['min'+axis]+a['max'+axis]-b['min'+axis]-b['max'+axis]||a.index-b.index);const middle=items.length>>1;node.left=build(items.slice(0,middle));node.right=build(items.slice(middle));return node;
 }
 const root=build(segments),bound=(node,x,z)=>{const dx=Math.max(node.minX-x,0,x-node.maxX),dz=Math.max(node.minZ-z,0,z-node.maxZ);return dx*dx+dz*dz;};
 return (x,z)=>{
  if(!root||!Number.isFinite(x)||!Number.isFinite(z))return {distance:Infinity};
  let distance=Infinity,index=Infinity,segment,bestT;
  function visit(node,lower){
   const squared=distance*distance;if(lower>squared+Number.EPSILON*Math.max(1,squared)*8)return;
   if(node.items){for(const s of node.items){const t=Math.max(0,Math.min(1,((x-s.a.x)*s.dx+(z-s.a.z)*s.dz)/s.lengthSquared)),px=s.a.x+t*s.dx,pz=s.a.z+t*s.dz,d=Math.hypot(x-px,z-pz);if(d<distance||(d===distance&&s.index<index)){distance=d;index=s.index;segment=s;bestT=t;}}return;}
   const left=bound(node.left,x,z),right=bound(node.right,x,z);if(left<=right){visit(node.left,left);visit(node.right,right);}else{visit(node.right,right);visit(node.left,left);}
  }
  visit(root,0);const {a,b,dx,dz,yaw}=segment,t=bestT;return {distance,x:a.x+t*dx,z:a.z+t*dz,y:a.y+t*(b.y-a.y),s:a.s+t*(b.s-a.s),yaw};
 };
}
