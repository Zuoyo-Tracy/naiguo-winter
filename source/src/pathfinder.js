// Bounded, cancellable A* over the same ground and solids used by driving.
class Heap {
 constructor(){this.items=[];}
 push(value){const a=this.items;let i=a.length;a.push(value);while(i){const p=(i-1)>>1;if(a[p].f<=value.f)break;a[i]=a[p];i=p;}a[i]=value;}
 pop(){const a=this.items,first=a[0],last=a.pop();if(a.length){let i=0;while(i*2+1<a.length){let c=i*2+1;if(c+1<a.length&&a[c+1].f<a[c].f)c++;if(a[c].f>=last.f)break;a[i]=a[c];i=c;}a[i]=last;}return first;}
 get size(){return this.items.length;}
}
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z,a.y-b.y);
export const yieldNavigationWork=()=>new Promise(resolve=>setTimeout(resolve,0));

export async function findGroundPath({
 start,goals,sample,clear,step=6,maxVisited=24000,
 deferEdgeChecks=false,cancelled=()=>false,yieldWork=yieldNavigationWork
}){
 const cache=new Map();
 function node(ix,iz){
  const id=ix+','+iz;
  if(cache.has(id))return cache.get(id);
  const x=ix*step,z=iz*step,p=sample(x,z);
  const n=p?{...p,x,z,ix,iz,id,knownEdges:0,openEdges:0}:null;
  cache.set(id,n);return n;
 }
 function canTraverse(a,b,allowUnknown){
  // One bit per neighbouring grid direction. Sweeps in reverse are distinct.
  const bit=1<<((b.ix-a.ix+1)*3+b.iz-a.iz+1);
  if(a.knownEdges&bit)return Boolean(a.openEdges&bit);
  if(allowUnknown)return true;
  const open=clear(a,b);
  a.knownEdges|=bit;
  if(open)a.openEdges|=bit;
  return open;
 }
 const validGoals=goals.map(p=>{
  const g=sample(p.x,p.z);
  return g&&Math.abs(g.y-(p.y??g.y))<3?{...g,x:p.x,z:p.z}:null;
 }).filter(Boolean);
 if(!validGoals.length)return {reason:'destination',points:[]};
 const source=sample(start.x,start.z);
 if(!source||Math.abs(source.y-(start.y??source.y))>3)return {reason:'start',points:[]};
 const origin={...source,x:start.x,z:start.z},seeds=[];
 for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++){
  const n=node(Math.round(start.x/step)+dx,Math.round(start.z/step)+dz);
  if(n&&clear(origin,n))seeds.push(n);
 }
 const estimate=p=>Math.min(...validGoals.map(g=>distance(p,g)));
 let nextYield=performance.now()+8;
 async function pause(){await yieldWork();nextYield=performance.now()+8;}
 async function search(allowUnknown){
  const open=new Heap(),best=new Map(),parents=new Map();
  for(const n of seeds){
   const g=distance(origin,n);
   best.set(n.id,g);parents.set(n.id,null);open.push({n,g,f:g+estimate(n)});
  }
  let visited=0;
  while(open.size&&visited<maxVisited){
   if(cancelled())return {reason:'cancelled',points:[]};
   const {n,g}=open.pop();
   if(g!==best.get(n.id))continue;
   visited++;
   const goal=validGoals.filter(p=>distance(p,n)<step*1.8)
    .sort((a,b)=>distance(a,n)-distance(b,n)).find(p=>clear(n,p));
   if(goal){
    const path=[goal,n];
    for(let p=parents.get(n.id);p;p=parents.get(p.id))path.push(p);
    path.push(origin);path.reverse();
    const length=path.slice(1).reduce((sum,p,i)=>sum+distance(p,path[i]),0);
    return {points:path,length,visited};
   }
   for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++){
    if(!dx&&!dz)continue;
    const next=node(n.ix+dx,n.iz+dz);
    if(!next)continue;
    const score=g+distance(n,next)*Math.max(1,(n.cost+next.cost)/2||1);
    if(score>=(best.get(next.id)??Infinity)||!canTraverse(n,next,allowUnknown))continue;
    best.set(next.id,score);parents.set(next.id,n);
    open.push({n:next,g:score,f:score+estimate(next)});
   }
   if(performance.now()>=nextYield)await pause();
  }
  return {reason:visited>=maxVisited?'limit':'disconnected',points:[],visited};
 }
 // Try the cheapest candidate before sweeping unrelated strips in an open
 // plaza. Rejected links stay closed. Dense obstructions use eager A*.
 const attempts=deferEdgeChecks?12:0;
 for(let attempt=0;attempt<attempts;attempt++){
  const candidate=await search(true);
  if(!candidate.points.length){
   if(candidate.reason==='limit')break;
   return candidate;
  }
  let valid=true;
  for(let i=2;i<candidate.points.length-1;i++){
   if(!canTraverse(candidate.points[i-1],candidate.points[i],false))valid=false;
   if(performance.now()>=nextYield)await pause();
   if(cancelled())return {reason:'cancelled',points:[]};
  }
  if(valid)return candidate;
 }
 return search(false);
}
