export function bridgeCrossingAt(x,y,z,bridges){
 return bridges.find(bridge=>Math.abs(x-bridge.x)<(bridge.length??80)/2+18&&Math.abs(z-bridge.z)<32&&Math.abs(y-(bridge.y??bridge.deck))<2);
}
