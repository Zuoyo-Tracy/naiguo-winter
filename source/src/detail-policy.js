export function distantDetail(distance,diameter,quality='balanced',alreadyDistant=false){
 const factor={low:3,balanced:6,high:10}[quality]??6;
 const threshold=Math.max(75,diameter*factor);
 // Different enter/leave thresholds prevent flickering while hovering at a boundary.
 return distance>threshold*(alreadyDistant?.87:1.13);
}
