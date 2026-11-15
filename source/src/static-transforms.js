import {staticSceneryRoot} from './static-batches.js';
// Only named stationary subtrees are frozen. Trains, ride rotors, NPCs, weather,
// and the camera-following sky retain normal world-matrix updates.
const stationaryRoots=new Set(['Winter conservatory common landscape','Spatially batched static park scenery','Haunted pocket-world pavilions']);
export function freezeWorldTransforms(scene){
 scene.updateMatrixWorld(true);const visited=new Set();
 scene.traverse(root=>{if(!stationaryRoots.has(root.name)&&!staticSceneryRoot(root))return;
  root.traverse(o=>{if(visited.has(o))return;visited.add(o);o.matrixAutoUpdate=false;o.matrixWorldAutoUpdate=false;o.matrixWorldNeedsUpdate=false;});
 });
 // The world origin does not move. Avoid forcing all stationary descendants
 // dirty just because Scene updates its unchanged identity matrix each frame.
 scene.matrixAutoUpdate=false;scene.matrixWorldNeedsUpdate=false;
 if(typeof window!=='undefined')window.__staticTransformDebug={frozen:visited.size};
 return visited.size;
}
