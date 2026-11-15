import * as T from 'three';
import {railClearanceSamples} from './train-rules.js';
import {cohesionSurface} from './cohesion-layout.js';

const crossing=railClearanceSamples.filter(p=>p.z>580&&p.z<610).sort((a,b)=>Math.abs(a.x+50)-Math.abs(b.x+50))[0];
export const forecourtCrossing={x:-50,z:crossing.z,y:crossing.y,halfSpan:23};
export function inForecourtOpening(x,z){return Math.abs(x+50)<25&&Math.abs(z-crossing.z)<7;}
export function addForecourtRailCrossing(parent,register){
 const root=new T.Group();root.name='Walnut portal bridge above forecourt promenade';parent.add(root);
 const material=new T.MeshStandardMaterial({color:'#4e3523',roughness:.88}),solids=[],top=crossing.y-.48;
 function beam(a,b,width,depth){const direction=b.clone().sub(a),mesh=new T.Mesh(new T.BoxGeometry(width,direction.length(),depth),material);mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),direction.normalize());root.add(mesh);return mesh;}
 for(const side of [-1,1])for(const offset of [-1.9,1.9]){
  const x=-50+side*23,z=crossing.z+offset,y=cohesionSurface(x,z)-.35;
  beam(new T.Vector3(x,y,z),new T.Vector3(x,top,z),1.1,1.1);
  beam(new T.Vector3(x,top-2.25,z),new T.Vector3(x-side*4,top,z),.55,.55);
  solids.push({id:'forecourt-bridge-post',x,z,y,width:1.1,depth:1.1,height:top-y});
 }
 for(const offset of [-1.9,1.9])beam(new T.Vector3(-74,top,crossing.z+offset),new T.Vector3(-26,top,crossing.z+offset),.65,.6);
 // The existing generated timber deck remains the visible track. Its solid
 // volume also stops an orbit camera from appearing above it while underneath.
 solids.push({id:'forecourt-bridge-deck',x:-50,z:crossing.z,y:top-.34,width:50,depth:6.4,height:.95});
 register(solids);return root;
}
