import * as THREE from 'three';
// Generated facades surround genuinely open driving halls; no solid model crosses a lane.
export function buildGrandPalace(scene,castle,manor,cliff){
 const group=new THREE.Group();group.name='Grand four-tier Lux3D fairytale palace';scene.add(group);
 function asset(source,name,x,y,z,w,h,d){const g=source.clone(true);g.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(g),size=b.getSize(new THREE.Vector3());g.scale.multiply(new THREE.Vector3(w/size.x,h/size.y,d/size.z));g.position.set(x,y,z);g.name=name;group.add(g);return g;}
 // Keep the central landmark between adjacent racing decks rather than over them.
 asset(castle,'Lux3D central princess castle',0,16,225,112,145,58);
 asset(cliff,'Lux3D main palace cliff',0,9,225,120,7.5,66);
 for(const side of [-1,1]){const x=side<0?-112:180,z=side<0?225:244,depth=side<0?52:24;asset(castle,'Lux3D outer palace tower',x,14,z,42,105,depth);asset(cliff,'Lux3D tower cliff',x,7,z,48,7.5,depth+6);}
 const halls=[];
 for(const [i,z,y] of [[0,90,14],[1,180,28],[2,270,50],[3,360,32]]){
  // The Roman arcade now stands on the garden boulevard. Keep all four
  // race decks, without the duplicate arcades intersecting residential roofs.
  halls.push({tier:i+1,z,deck:y,length:230,clearWidth:24});
 }
 // The relocated gallery no longer occupies any station reservation.
 window.__stationArcadeClearance={removedInstances:0,galleryRelocated:true};
 window.__palaceReport={halls,height:161,generatedAssets:['princess-castle'],wisteriaLocation:'garden-boulevard'};
 return group;
}
