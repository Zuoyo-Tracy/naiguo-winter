import * as T from 'three';
import {residentAdventures} from './resident-adventure-data.js';
import {npcPlacements} from './naifrog-layout.js';
import {attractions,parkSolids} from './park-rules.js';
import {createNavigationWorld} from './park-navigation.js';
import {gardenPaths,segmentPosition,nearbyRails} from './cohesion-layout.js';
import {carnivalWalkways} from './carnival-layout.js';
import {projectTrack} from './track.js';


const PROP_CLEARANCE=3.6;
const separated=(a,b,r)=>Math.abs(a.y-b.y)>=5||Math.hypot(a.x-b.x,a.z-b.z)>=r;
function chooseNpcArrival(n,world,reserved){
 const options=[];
 for(const radius of [5,4.8,5.2,4.5,5.5])for(let i=0;i<48;i++){
  const angle=i*Math.PI/24,x=n.x+Math.sin(angle)*radius,z=n.z+Math.cos(angle)*radius,g=world.sample(x,z);
  if(!g||Math.abs(g.y-n.y)>.75)continue;
  const p={x,z,y:g.y,groundY:g.y,yaw:Math.atan2(n.x-x,n.z-z)};
  if(reserved.some(q=>!separated(p,q,PROP_CLEARANCE)))continue;
  if(npcPlacements.some(other=>other!==n&&!separated(p,other,3.2)))continue;
  options.push({...p,score:Math.abs(radius-5)*10+(g.cost??0)});
 }
 options.sort((a,b)=>a.score-b.score);
 if(!options.length)return null;
 const {score,...arrival}=options[0];return arrival;
}
function chooseSites(n,world,reserved,protectedArrivals){
 const candidates=[];
 for(const radius of [8,12,16,20,24,28])for(let i=0;i<32;i++){
  const angle=i*Math.PI/16,x=n.x+Math.sin(angle)*radius,z=n.z+Math.cos(angle)*radius,g=world.sample(x,z);
  if(!g||Math.abs(g.y-n.y)>1.7)continue;
  if(attractions.some(a=>Math.hypot(x-a.x,z-a.z)<a.r+2.6))continue;
  if(nearbyRails(x,z).some(r=>Math.hypot(x-r.x,z-r.z)<10))continue;
  const track=projectTrack(x,z);if(track.distance<16&&Math.abs(track.y-g.y)<5)continue;
  if([...gardenPaths,...carnivalWalkways].some(p=>segmentPosition(x,z,p).d<p.width/2+(p.shoulder||0)+1.8))continue;
  const edge=[[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dz])=>world.sample(x+dx,z+dz));
  if(edge.some(p=>!p||Math.abs(p.y-g.y)>.35))continue;
  candidates.push({x,z,y:g.y,radius});
 }
 const selected=[];
 for(const p of candidates){
  const prior=[...reserved,...selected];
  if(prior.some(q=>!separated(p,q,6)))continue;
  // A later prop must also leave every earlier arrival position clear.
  if([...protectedArrivals,...prior.map(q=>q.arrival)].some(a=>a&&!separated(p,a,4.6)))continue;
  const options=[];
  for(let i=0;i<24;i++){
   const a=i*Math.PI/12,x=p.x+Math.sin(a)*4.2,z=p.z+Math.cos(a)*4.2,g=world.sample(x,z);
   if(!g||Math.abs(g.y-p.y)>.75)continue;
   const arrival={x,z,y:g.y,groundY:g.y,yaw:Math.atan2(p.x-x,p.z-z)};
   if(prior.some(q=>!separated(arrival,q,4.6)))continue;
   if(npcPlacements.some(person=>!separated(arrival,person,3.2)))continue;
   options.push(arrival);
  }
  options.sort((a,b)=>Math.hypot(a.x-n.x,a.z-n.z)-Math.hypot(b.x-n.x,b.z-n.z));
  if(!options.length)continue;
  const arrival=options[0];selected.push({...p,yaw:Math.atan2(arrival.x-p.x,arrival.z-p.z),arrival});
  if(selected.length===3)break;
 }
 return selected;
}

function printedPanel(width,height,title,lines=[],options={}){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=640;
 const ctx=canvas.getContext('2d'),texture=new T.CanvasTexture(canvas);
 texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;
 const mesh=new T.Mesh(new T.PlaneGeometry(width,height),new T.MeshStandardMaterial({map:texture,roughness:.95,side:T.FrontSide}));
 let currentTitle=title,currentLines=lines,stretch={x:options.stretchX||1,y:options.stretchY||1};
 function wheel(){
  ctx.save();ctx.translate(256,286);ctx.scale(stretch.x,stretch.y);
  ctx.strokeStyle='#677f75';ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,0,124,0,Math.PI*2);ctx.stroke();
  for(let i=0;i<12;i++){
   const a=i*Math.PI/6,x=Math.sin(a)*124,y=Math.cos(a)*124;
   ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(x,y);ctx.stroke();
   ctx.fillStyle=i%2?'#ad8e93':'#7f9b98';ctx.fillRect(x-13,y-6,26,22);
  }
  ctx.strokeStyle='#906c46';ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(-52,172);ctx.lineTo(0,0);ctx.lineTo(52,172);ctx.stroke();
  // This printed mascot distorts with the photograph, not with the frame.
  ctx.fillStyle='#b3aa73';ctx.beginPath();ctx.ellipse(-91,145,17,23,0,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(-91,121,14,13,0,0,Math.PI*2);ctx.fill();
  for(const x of [-100,-82]){ctx.beginPath();ctx.ellipse(x,166,9,5,0,0,Math.PI*2);ctx.fill();}
  ctx.fillStyle='#514638';ctx.beginPath();ctx.arc(-96,119,2,0,Math.PI*2);ctx.arc(-86,119,2,0,Math.PI*2);ctx.fill();ctx.restore();
 }
 function ledger(){
  ctx.textAlign='left';ctx.font='27px SimSun';
  ['第1次  毛球压扁','第2次  毛球蓬起','第3次  翘起两根毛'].forEach((line,i)=>{
   const y=190+i*115;ctx.fillStyle='#614b38';ctx.fillText(line,61,y,325);
   ctx.fillStyle='#b58e94';ctx.beginPath();ctx.ellipse(414,y-9,29,i===0?10:i===1?22:25,0,0,Math.PI*2);ctx.fill();
   if(i===2){ctx.strokeStyle='#8b6068';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(409,y-31);ctx.lineTo(403,y-49);ctx.moveTo(420,y-31);ctx.lineTo(429,y-48);ctx.stroke();}
   ctx.strokeStyle='#c0ae8b';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(53,y+35);ctx.lineTo(459,y+35);ctx.stroke();
  });
  ctx.textAlign='center';ctx.font='24px SimSun';ctx.fillStyle='#614b38';ctx.fillText('脚边站位线没有挪过',256,560,420);
 }
 function paint(label=currentTitle,copy=currentLines){
  currentTitle=label;currentLines=copy;
  ctx.fillStyle='#e6d6b3';ctx.fillRect(0,0,512,640);ctx.strokeStyle='#8a7048';ctx.lineWidth=4;ctx.strokeRect(20,20,472,600);ctx.lineWidth=1;ctx.strokeRect(28,28,456,584);
  ctx.fillStyle='#42594c';ctx.textAlign='center';ctx.font='bold 34px SimSun';ctx.fillText(label,256,75,440);
  if(options.ledger)ledger();
  else{
   if(options.picture)wheel();
   ctx.fillStyle='#614b38';ctx.font='27px SimSun';const top=options.picture?550:190;
   copy.forEach((line,i)=>ctx.fillText(line,256,top+i*57,432));
   if(options.settings){
    ctx.strokeStyle='#9a6f6c';ctx.lineWidth=3;ctx.strokeRect(80,350,352,146);
    ctx.save();ctx.translate(256,440);ctx.scale(-1,1);ctx.fillStyle='#8b7371';ctx.font='28px SimSun';ctx.fillText('摩天轮试印',0,0,300);ctx.restore();
   }
  }
  texture.needsUpdate=true;
 }
 paint();return {mesh,paint,setStretch(x,y){stretch={x,y};paint();}};
}

export function buildResidentStoryWorld(scene,templates,support){
 const group=new T.Group();group.name='Residents working on their little mishaps';scene.add(group);
 const navigation=createNavigationWorld(support),things=new Map(),kits=new Map(),solids=[],reserved=[],protectedArrivals=[];
 const wood=new T.MeshStandardMaterial({color:'#5a4436',roughness:.83}),brass=new T.MeshStandardMaterial({color:'#b89761',roughness:.48,metalness:.48}),green=new T.MeshStandardMaterial({color:'#526b5c',roughness:.72}),paper=new T.MeshStandardMaterial({color:'#e4d4b2',roughness:.96}),rose=new T.MeshStandardMaterial({color:'#b2868a',roughness:.85});
 const box=(parent,w,h,d,material,x=0,y=0,z=0)=>{const m=new T.Mesh(new T.BoxGeometry(w,h,d),material);m.position.set(x,y,z);parent.add(m);return m;};
 function asset(id,parent,height,x=0,y=0,z=0,maxWidth=1.3,maxDepth=1){
  const source=templates.get(id);if(!source)return null;
  const child=source.clone(true);child.position.set(0,0,0);child.updateMatrixWorld(true);
  const b=new T.Box3().setFromObject(child),size=b.getSize(new T.Vector3()),c=b.getCenter(new T.Vector3());
  if(b.isEmpty()||size.y<=0)return null;
  const root=new T.Group();child.position.set(-c.x,-b.min.y,-c.z);root.add(child);
  root.scale.setScalar(Math.min(height/size.y,maxWidth/Math.max(size.x,.001),maxDepth/Math.max(size.z,.001)));
  root.position.set(x,y,z);parent.add(root);return root;
 }
 function mount(parent,width,height,title,lines,position,rotation=0,options={}){
  const holder=new T.Group();holder.position.set(...position);holder.rotation.x=rotation;parent.add(holder);
  box(holder,width+.09,height+.09,.075,wood,0,0,-.04);
  box(holder,width+.035,height+.035,.018,brass,0,0,.008);
  const page=printedPanel(width,height,title,lines,options);page.mesh.position.z=.035;holder.add(page.mesh);return page;
 }
 function stand(root){
  box(root,1.65,.12,1.1,wood,0,.96);
  for(const x of [-.65,.65])for(const z of [-.4,.4])box(root,.1,.91,.1,brass,x,.455,z);
  box(root,1.4,.11,.13,wood,0,.64,.49);
  box(root,1.66,.035,1.12,brass,0,1.04);box(root,1.6,.035,1.06,green,0,1.075);
 }
 function board(root,title,lines,options={}){
  for(const x of [-.58,.58])box(root,.13,2.2,.15,wood,x,1.1,-.15);
  box(root,1.45,.12,.7,wood,0,.06);box(root,1.4,.1,.15,wood,0,1.25,-.15);
  return mount(root,1.57,1.96,title,lines,[0,2.2,0],0,options);
 }
 function tray(root,mini=false){
  const centreY=mini?1.38:1.43;box(root,.34,.3,.65,wood,0,1.22);
  const axle=new T.Mesh(new T.CylinderGeometry(.09,.09,.88,12),brass);axle.rotation.x=Math.PI/2;axle.position.y=centreY;root.add(axle);
  const pivot=new T.Group();pivot.position.y=centreY;root.add(pivot);
  box(pivot,1.5,.07,.86,brass);box(pivot,1.46,.028,.82,paper,0,.05);
  for(const x of [-.73,.73])box(pivot,.035,.12,.84,wood,x,.09);
  for(const z of [-.41,.41])box(pivot,1.5,.12,.035,wood,0,.09,z);
  const cookies=new T.Group();cookies.position.set(-.46,.075,.15);pivot.add(cookies);
  if(!asset('cookie-trio',cookies,.22,0,0,0,.55,.44))box(cookies,.4,.12,.3,rose,0,.06);
  const counter=new T.Group();counter.position.set(.52,.075,-.12);pivot.add(counter);
  if(!asset('cookie-tin',counter,.43,0,0,0,.36,.36))box(counter,.32,.37,.32,green,0,.185);
  pivot.rotation.z=-.15;return {pivot,counter,cookies};
 }
 for(const q of residentAdventures){
  const npc=npcPlacements.find(n=>n.kind===q.kind),npcArrival=chooseNpcArrival(npc,navigation,reserved);
  if(!npcArrival)throw Error('无法为'+q.name+'找到安全的交谈位置');
  const sites=chooseSites(npc,navigation,reserved,[...protectedArrivals,npcArrival]);
  if(sites.length!==3)throw Error('无法为'+q.title+'找到三个安全的附近位置');
  reserved.push(...sites);protectedArrivals.push(npcArrival);
  const kit={quest:q,sites,npcArrival,props:[],blend:0,lastCaption:null};kits.set(q.id,kit);
  sites.forEach((site,index)=>{
   const root=new T.Group();root.name='Resident '+q.id+' '+index;root.position.set(site.x,site.y,site.z);root.rotation.y=site.yaw;group.add(root);
   const key=index<2?q.clues[index].id:'decision',entry={id:q.id+':'+key,quest:q.id,key,index,root,...site,title:index<2?q.clues[index].title:q.decision.title};things.set(entry.id,entry);kit.props.push(entry);
   solids.push({id:'resident-prop-'+entry.id,x:site.x,z:site.z,y:site.y,width:1.9,depth:1.4,height:4.1,rotate:site.yaw});
   if(q.id==='height'){
    if(index===0){
     box(root,.22,3.8,.22,wood,0,1.9);box(root,.7,.13,.75,wood,0,.065);
     for(let i=0;i<14;i++)box(root,i%2?.2:.35,.035,.03,brass,.2,.4+i*.22,.13);
     mount(root,.95,.58,'头顶高度',['饰物另外登记'],[0,3.5,.15]);
     kit.measure=box(root,1,.09,.4,rose,.32,3.15,0);
    }else if(index===1){
     stand(root);box(root,.65,.25,.35,wood,0,1.19,-.2);
     mount(root,1.25,.9,'绒绒的三次记录',[],[0,1.34,.05],-Math.PI*.35,{ledger:true});
    }else kit.sign=board(root,'绒绒的测量日',['先看量尺说明','再翻三次记录']);
   }else if(q.id==='picnic'){
    stand(root);
    if(index===0){
     if(!asset('cookie-tin',root,.64,.45,1.1,-.12,.52,.52))box(root,.45,.55,.45,green,.45,1.38,-.12);
     for(const x of [-.6,-.18])box(root,.32,.13,.38,rose,x,1.16,.05);
     mount(root,1.2,.45,'满罐雪花糖',['这罐比两盒饼干沉'],[0,.64,.6]);
    }else if(index===1){
     kit.exhibit=tray(root,true);
     mount(root,1.2,.45,'看看中间的轴',['架子站稳，盘子会转'],[0,.64,.6]);
    }else{
     const t=tray(root);kit.tray=t.pivot;kit.counter=t.counter;kit.cookies=t.cookies;
     kit.sign=mount(root,1.2,.45,'下午茶要逃跑了',['把糖罐往支点挪'],[0,.64,.6]);
    }
   }else{
    if(index===0)board(root,'咔咔的原片',['轮子圆，双脚齐'],{picture:true});
    else if(index===1)board(root,'印刷设置卡',['✓ 自动填满横框','先别用这张试印'],{settings:true});
    else{
     kit.sign=board(root,'摩天轮宣传画',['轮子和咔咔都压扁了'],{picture:true,stretchX:1.32,stretchY:.63});
     kit.poster=kit.sign.mesh;kit.posterStretch={x:1.32,y:.63};kit.lastPosterStep=-1;
    }
    box(root,.63,.08,.5,wood,.48,.16,.15);
    asset('camera',root,.42,.48,.2,.15,.6,.45);
   }
  });
  parkSolids.push({a:{x:npc.x,z:npc.z,r:36},solids:solids.slice(-3)});
 }
 
 scene.updateMatrixWorld(true);let time=0;
 return {group,things,kits,solids,update(dt,states){
  time+=dt;
  for(const [id,kit]of kits){
   const s=states[id],target=s?.solved?1:0;kit.blend=T.MathUtils.damp(kit.blend,target,5,dt);
   if(kit.measure)kit.measure.position.y=T.MathUtils.lerp(3.15,2.4,kit.blend);
   if(kit.tray){
    kit.tray.rotation.z=(1-kit.blend)*(-.15+Math.sin(time*2.1)*.018);
    kit.counter.position.x=T.MathUtils.lerp(.52,.16,kit.blend);
    kit.cookies.position.x=-.46+(1-kit.blend)*(.05+.025*Math.sin(time*2.1));
    kit.exhibit.pivot.rotation.z=kit.tray.rotation.z;kit.exhibit.counter.position.x=kit.counter.position.x;
   }
   if(kit.poster){
    // Correct the printed illustration inside its solid frame, never the frame itself.
    const step=Math.round(kit.blend*24);
    if(step!==kit.lastPosterStep){kit.lastPosterStep=step;kit.posterStretch={x:T.MathUtils.lerp(1.32,1,step/24),y:T.MathUtils.lerp(.63,1,step/24)};kit.sign.setStretch(kit.posterStretch.x,kit.posterStretch.y);}
   }
   if(target&&kit.lastCaption!==s.choice){
    kit.lastCaption=s.choice;
    if(id==='height')kit.sign.paint('帽子另算，礼物照领',['横杆终于找到了头顶']);
    else if(id==='picnic')kit.sign.paint('下午茶终于站稳了',['糖罐靠近支点','饼干留在盘里']);
    else if(s.choice==='tea')kit.sign.paint('拍照不会多吃一顿',['原比例留存','咔咔照常吃下午茶']);
    else kit.sign.paint('本轮已恢复圆形',['原比例留存','今天不用拆轮子']);
   }
  }
 },debug:()=>({
  props:[...things.values()].map(({id,quest,key,x,y,z,arrival})=>({id,quest,key,x,y,z,arrival})),
  changes:[...kits].map(([id,k])=>({id,npcArrival:k.npcArrival,blend:k.blend,measure:k.measure?.position.y,tray:k.tray?.rotation.z,counter:k.counter?.position.x,poster:k.posterStretch,caption:k.lastCaption})),
 })};
}

