import {festivalHubs} from './festival-layout.js';
import * as T from 'three';
import {attractions,parkApproachEnd} from './park-rules.js';
// Shape the existing snow/cloud geometry beneath the new plazas and access bridges.
// This is a real opening in the landscape, visible from every camera.
// Precompute the fixed slopes and plaza extents once. Distant courtyards
// cannot alter a vertex and need no distance or projection calculation.
const zones = [
  ...attractions.map(a => ({...a, radius:a.r, start:a.anchor, end:parkApproachEnd(a), width:9})),
  ...festivalHubs.map(h => ({...h, radius:h.id === 'post' ? 24 : h.r + 5, start:h.link && {...h.link,y:h.y}, end:h, width:10})),
].map(zone => {
  const start = zone.start || zone, end = zone.end;
  const dx = end.x - start.x, dz = end.z - start.z;
  const radius = zone.radius + 8, width = zone.width + 8;
  return {...zone, dx, dz, squared: dx*dx + dz*dz,
    minX:Math.min(zone.x-radius,start.x-width,end.x-width), maxX:Math.max(zone.x+radius,start.x+width,end.x+width),
    minZ:Math.min(zone.z-radius,start.z-width,end.z-width), maxZ:Math.max(zone.z+radius,start.z+width,end.z+width)};
});

export function snowClearanceHeight(x,z,y) {
  let exact=Infinity,near=Infinity;
  for(const a of zones){
    if(x<a.minX||x>a.maxX||z<a.minZ||z>a.maxZ)continue;
    const radius=Math.hypot(x-a.x,z-a.z),deck=a.y-2.5;
    if(radius<a.radius)exact=Math.min(exact,deck);
    if(radius<a.radius+8)near=Math.min(near,deck);
    if(!a.start)continue;
    const sx=x-a.start.x,sz=z-a.start.z;
    const t=Math.max(0,Math.min(1,(sx*a.dx+sz*a.dz)/a.squared));
    const distance=Math.hypot(sx-t*a.dx,sz-t*a.dz);
    if(distance>=a.width+8)continue;
    const height=a.start.y+(a.y-a.start.y)*t-2.5;
    near=Math.min(near,height);
    if(distance<a.width)exact=Math.min(exact,height);
  }
  return Number.isFinite(exact)?exact:Math.min(y,(near+y)/2);
}
const plazaBounds = [...attractions, ...festivalHubs.map(h => ({
  ...h, r: h.id === 'post' ? 24 : h.r + 8, anchor: h.link ? {...h.link, y:h.y} : h,
}))].map(a => ({
  minX: Math.min(a.x-a.r-12,a.anchor.x-20), maxX: Math.max(a.x+a.r+12,a.anchor.x+20),
  minZ: Math.min(a.z-a.r-12,a.anchor.z-20), maxZ: Math.max(a.z+a.r+12,a.anchor.z+20),
  minY: Math.min(a.y,a.anchor.y)-4,
}));

export function clearParkScenery(scene) {
  scene.updateMatrixWorld(true);
  const roots = scene.children.filter(o => /snow valley|cloud|snowy riverbank|snow-mountain|ice-waterfall/i.test(o.name));
  let modified=0, vertices=0;
  for (const root of roots) {
    const meshes=[];
    root.traverse(o => {if (o.isMesh) meshes.push(o);});
    for (const mesh of meshes) {
      const source=mesh.geometry, positions=source.attributes.position;
      source.computeBoundingBox();
      const instances = mesh.isInstancedMesh ? mesh.count : 1;
      for (let i=0; i<instances; i++) {
        const world=mesh.matrixWorld.clone();
        if (mesh.isInstancedMesh) {
          const local=new T.Matrix4();
          mesh.getMatrixAt(i,local);
          if (Math.abs(local.determinant())<=1e-12) continue;
          world.multiply(local);
        }
        const b=source.boundingBox.clone().applyMatrix4(world);
        if (!plazaBounds.some(p => b.max.x>p.minX && b.min.x<p.maxX && b.max.z>p.minZ && b.min.z<p.maxZ && b.max.y>p.minY)) continue;
        const inverse=world.clone().invert(), point=new T.Vector3();
        let carved=null;
        for (let n=0; n<positions.count; n++) {
          point.fromBufferAttribute(positions,n).applyMatrix4(world);
          const floor=snowClearanceHeight(point.x,point.z,point.y);
          if (point.y<=floor) continue;
          carved ??= source.clone();
          point.y=floor;
          point.applyMatrix4(inverse);
          carved.attributes.position.setXYZ(n,point.x,point.y,point.z);
          vertices++;
        }
        if (!carved) continue;
        carved.computeVertexNormals();
        carved.computeBoundingBox();
        carved.computeBoundingSphere();
        if (mesh.isInstancedMesh) {
          const copy=new T.Mesh(carved,mesh.material);
          copy.name='Park-cleared '+mesh.name;
          copy.matrixAutoUpdate=false;
          copy.matrix.copy(world);
          scene.add(copy);
          mesh.setMatrixAt(i,new T.Matrix4().makeScale(0,0,0));
          mesh.instanceMatrix.needsUpdate=true;
        } else {
          mesh.geometry=carved;
        }
        modified++;
      }
    }
  }
  scene.updateMatrixWorld(true);
  window.__parkClearance={modified,vertices};
  return {modified,vertices};
}
