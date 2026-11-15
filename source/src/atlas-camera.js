const W=1040,H=840,clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function clampAtlas(view){const zoom=clamp(view.zoom,1,3);return {zoom,x:clamp(view.x,0,W-W/zoom),y:clamp(view.y,0,H-H/zoom)};}
export function zoomAtlas(view,zoom,u=.5,v=.5){zoom=clamp(zoom,1,3);return clampAtlas({zoom,x:view.x+u*W/view.zoom-u*W/zoom,y:view.y+v*H/view.zoom-v*H/zoom});}
export function attachAtlasCamera(svg){
 let view={x:0,y:0,zoom:1},drag=null,pinch=null,moved=false;const fingers=new Map();
 const apply=()=>svg.setAttribute('viewBox',`${view.x} ${view.y} ${W/view.zoom} ${H/view.zoom}`);
 const point=e=>({x:e.clientX,y:e.clientY});
 const pair=()=>{const [a,b]=[...fingers.values()];return {x:(a.x+b.x)/2,y:(a.y+b.y)/2,distance:Math.hypot(a.x-b.x,a.y-b.y)};};
 const zoomAt=(next,x,y)=>{const b=svg.getBoundingClientRect();view=zoomAtlas(view,next,(x-b.left)/b.width,(y-b.top)/b.height);apply();};
 svg.addEventListener('wheel',e=>{e.preventDefault();zoomAt(view.zoom*(e.deltaY<0?1.12:1/1.12),e.clientX,e.clientY);},{passive:false});
 svg.onpointerdown=e=>{if(e.button!==0&&e.pointerType!=='touch')return;if(fingers.size===0)moved=false;fingers.set(e.pointerId,point(e));if(fingers.size===1)drag={...point(e),view:{...view}};else if(fingers.size===2){pinch=pair();drag=null;moved=true;for(const id of fingers.keys())svg.setPointerCapture(id);}};
 svg.onpointermove=e=>{if(!fingers.has(e.pointerId))return;fingers.set(e.pointerId,point(e));const bounds=svg.getBoundingClientRect();
  if(fingers.size>=2&&pinch){const now=pair();view=clampAtlas({...view,x:view.x-(now.x-pinch.x)/bounds.width*W/view.zoom,y:view.y-(now.y-pinch.y)/bounds.height*H/view.zoom});zoomAt(view.zoom*now.distance/Math.max(1,pinch.distance),now.x,now.y);pinch=now;return;}
  if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)>5)moved=true;if(moved){if(!svg.hasPointerCapture(e.pointerId))svg.setPointerCapture(e.pointerId);view=clampAtlas({zoom:drag.view.zoom,x:drag.view.x-dx/bounds.width*W/view.zoom,y:drag.view.y-dy/bounds.height*H/view.zoom});apply();}
 };
 const release=e=>{fingers.delete(e.pointerId);if(svg.hasPointerCapture(e.pointerId))svg.releasePointerCapture(e.pointerId);pinch=null;drag=fingers.size===1?{...[...fingers.values()][0],view:{...view}}:null;};svg.onpointerup=release;svg.onpointercancel=release;svg.onlostpointercapture=e=>{if(!fingers.has(e.pointerId))return;fingers.delete(e.pointerId);pinch=null;drag=null;};
 return {get wasDragged(){return moved;},allowSelection(){moved=false;},scale(factor){view=zoomAtlas(view,view.zoom*factor);apply();},reset(){view={x:0,y:0,zoom:1};moved=false;apply();}};
}
