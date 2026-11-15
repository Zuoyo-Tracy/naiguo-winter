const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

// Consume drag displacement in the flight simulation, never in the ground orbit
// camera. Capture-phase ownership prevents both controllers handling one drag.
export function createSkyPointerControls({canvas,active,enabled,onTakeOver,sensitivity=()=>1}){
 let drag=null,yawRemaining=0,liftRemaining=0;
 function cancel(){
  const id=drag?.id;drag=null;yawRemaining=0;liftRemaining=0;
  if(id!==undefined&&canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);
 }
 function consume(event){event.preventDefault();event.stopImmediatePropagation();}
 const down=event=>{
  if(!active())return;
  consume(event);
  if(!enabled()||event.button!==0||drag)return;
  canvas.focus({preventScroll:true});canvas.setPointerCapture(event.pointerId);
  drag={id:event.pointerId,x:event.clientX,y:event.clientY,distance:0,taken:false};
 };
 const move=event=>{
  if(!active())return;
  consume(event);
  if(!enabled()){cancel();return;}
  if(drag?.id!==event.pointerId)return;
  const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
  drag.x=event.clientX;drag.y=event.clientY;drag.distance+=Math.hypot(dx,dy);
  if(drag.distance<3)return;
  if(!drag.taken){drag.taken=true;onTakeOver();}
  const gain=clamp(sensitivity(),.3,2);
  yawRemaining=clamp(yawRemaining-dx*.006*gain,-Math.PI,Math.PI);
  liftRemaining=clamp(liftRemaining-dy*.045*gain,-8,8);
 };
 const release=event=>{
  if(!active())return;
  consume(event);
  if(drag?.id!==event.pointerId)return;
  if(event.type==='pointercancel'){cancel();return;}
  drag=null;
  if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);
 };
 canvas.addEventListener('pointerdown',down,true);
 canvas.addEventListener('pointermove',move,true);
 for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,release,true);
 addEventListener('blur',cancel);
 return {
  cancel,
  read(dt){
   if(!enabled()||!(dt>0)){cancel();return {yawDelta:0,lift:0};}
   const h=Math.min(dt,.1),smooth=1-Math.exp(-16*h);
   const yawDelta=clamp(yawRemaining*smooth,-3*h,3*h);
   const lift=clamp(liftRemaining*smooth/(12*h),-1,1);
   yawRemaining-=yawDelta;liftRemaining-=lift*12*h;
   if(Math.abs(yawRemaining)<.0001)yawRemaining=0;
   if(Math.abs(liftRemaining)<.001)liftRemaining=0;
   return {yawDelta,lift};
  },
  get dragging(){return !!drag;},
 };
}
