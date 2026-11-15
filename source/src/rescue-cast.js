import {mazePose} from './haunt-maze.js';
import {setHidden,setText} from './ui-state.js';
import {rescuePerformance,performanceLine} from './rescue-performance.js';
import {clues} from './rescue-story.js';
import * as T from 'three';
import {GameAssetLoader as GLTFLoader} from './asset-loader.js';
import {hauntPose} from './haunt-route.js';
export async function loadRescueCast(scene){
 const actors=await Promise.all(['pink','mouse'].map(async tag=>{
  const model=(await new GLTFLoader().loadAsync(`/assets/npc-${tag}.glb`)).scene;
  const b=new T.Box3().setFromObject(model),size=b.getSize(new T.Vector3()),c=b.getCenter(new T.Vector3());
  const scale=1.15/size.y;model.scale.setScalar(scale);model.position.set(-c.x*scale,-b.min.y*scale,-c.z*scale);
  const root=new T.Group();root.name=`Rescue NPC ${tag}`;root.add(model);root.visible=false;scene.add(root);return root;
 }));
 const evidence=clues.map(c=>{
  const g=new T.Group();g.name='Evidence '+c.id;const p=hauntPose(c.s,1.1);g.position.set(p.x,p.y,p.z);g.rotation.y=p.yaw;
  const stand=new T.Mesh(new T.BoxGeometry(.32,.48,.28),new T.MeshStandardMaterial({color:0x47352e,roughness:.9}));stand.position.y=.24;g.add(stand);
  const paper=new T.Mesh(new T.BoxGeometry(.24,.035,.22),new T.MeshStandardMaterial({color:0xe4c49b,emissive:0xa76d32,emissiveIntensity:.8}));paper.position.y=.5;paper.rotation.x=.15;g.add(paper);
  const light=new T.PointLight(0xf0b777,1,2);light.position.y=.65;g.add(light);scene.add(g);return {g,paper,light,id:c.id};
 });
 const caption=document.createElement('div');caption.id='rescue-live-caption';caption.hidden=true;document.body.append(caption);
 return s=>{
  const q=s.rescueStory,performance=rescuePerformance(s);
  const showCaption=s.snow&&!q?.dialog&&!s.storyJournalOpen;
  const line=showCaption?(s.hauntDiscovery?.until>s.hauntTime?s.hauntDiscovery.text:performanceLine(s)):'';
  setHidden(caption,!line);
  if(line)setText(caption,line);
  actors.forEach((g,i)=>{
   g.visible=!!s.snow;if(!g.visible)return;
   const a=i===0?performance.pink:performance.mouse;
   const distance=Math.min(1998,s.hauntS+a.ahead),p=mazePose(distance,a.lateral,s.hauntChoices);
   g.position.set(p.x,p.y+a.bounce,p.z);g.rotation.set(0,p.yaw+a.turn,0);g.children[0].rotation.z=a.lean;
  });
  if(q?.ending==='promise')actors[0].visible=false;
  if(new URLSearchParams(location.search).has('test'))window.__rescuePerformance={mode:performance.mode,positions:actors.map(g=>g.position.toArray()),visible:actors.map(g=>g.visible)};
  evidence.forEach(({g,paper,light,id})=>{const clue=clues.find(c=>c.id===id),p=mazePose(clue.s,1.1,s.hauntChoices);g.position.set(p.x,p.y,p.z);g.rotation.y=p.yaw;g.visible=!!s.snow;const found=q?.evidence.includes(id);paper.material.emissiveIntensity=found?0:.8;light.visible=!found;});
 };
}
