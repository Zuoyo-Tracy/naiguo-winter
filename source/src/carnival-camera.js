export const STAR_FIELD_HEIGHT=24;
export function stargazeFraming(aspect,height){
 const tangent=Math.tan(55*Math.PI/360),distance=Math.max(18,8/(tangent*Math.max(.25,aspect)));
 const reserve=aspect>1.2?155:200,shift=Math.min(.46,reserve/Math.max(320,height));
 return {distance,aimY:STAR_FIELD_HEIGHT+1.5-distance*tangent*shift};
}
