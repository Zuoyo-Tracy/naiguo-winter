// Surface-gradient bump mapping, matching Three.js' unparameterized bump-map
// convention. Heights affect lighting only; road support and collision stay exact.
export const surfaceReliefGLSL=`
 vec3 winterRelief(vec3 position,vec3 surfaceNormal,vec2 heightChange,float faceDirection){
  vec3 sx=normalize(dFdx(position)),sy=normalize(dFdy(position));
  vec3 rx=cross(sy,surfaceNormal),ry=cross(surfaceNormal,sx);
  float determinant=dot(sx,rx)*faceDirection;
  vec3 gradient=sign(determinant)*(heightChange.x*rx+heightChange.y*ry);
  return normalize(abs(determinant)*surfaceNormal-gradient);
 }
`;
