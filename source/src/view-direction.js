import {Vector3} from 'three';

// The shared drag input increases orbitPitch when the pointer moves down.
// Orbit cameras move higher and look down; eye-level cameras must look down too.
export function firstPersonDirection(yaw,orbitPitch,downhill=0){
 const pitch=Math.max(-1.48,Math.min(1.48,downhill+orbitPitch)),horizontal=Math.cos(pitch);
 return new Vector3(Math.sin(yaw)*horizontal,-Math.sin(pitch),Math.cos(yaw)*horizontal);
}
