import * as T from 'three';
// Measure the actual lower piers, keeping the passage empty. The outer
// decorative posts and inner arch supports may have different footprints.
export function archPierProfiles(object,maxHeight=4.5){
 object.updateWorldMatrix(true,true);const inverse=object.matrixWorld.clone().invert(),p=new T.Vector3(),boxes=[new T.Box3(),new T.Box3()];
 object.traverse(mesh=>{if(!mesh.isMesh)return;const positions=mesh.geometry.attributes.position,matrix=new T.Matrix4().multiplyMatrices(inverse,mesh.matrixWorld);for(let i=0;i<positions.count;i++){p.fromBufferAttribute(positions,i).applyMatrix4(matrix).multiply(object.scale);if(p.y<0||p.y>maxHeight)continue;boxes[p.x<0?0:1].expandByPoint(p);}});
 return boxes.filter(b=>!b.isEmpty()).map(b=>({x:(b.min.x+b.max.x)/2,z:(b.min.z+b.max.z)/2,width:b.max.x-b.min.x,depth:b.max.z-b.min.z}));
}
export function placeArchPierProfiles(profiles,entrance){const c=Math.cos(entrance.yaw),s=Math.sin(entrance.yaw);return profiles.map(p=>({id:'gate-post',x:entrance.x+p.x*c+p.z*s,z:entrance.z-p.x*s+p.z*c,y:entrance.y,width:p.width,depth:p.depth,height:15,rotate:entrance.yaw}));}
