import {Vector3,Quaternion} from 'three';
// Measured on the new cup at its displayed 4.5 m width. Cushion surface:
// 1.3795 m, passenger hip offset: 0.322 m. These are displayed metres,
// independent of the GLB author's source units.
export const TEACUP_PASSENGER_ANCHOR=Object.freeze([0,1.0575,-1.02]);
export function placeTeacupPassenger(actor,cup){
 cup.updateWorldMatrix(true,false);
 cup.getWorldQuaternion(actor.quaternion);
 actor.position.copy(cup.getWorldPosition(new Vector3())).add(new Vector3(...TEACUP_PASSENGER_ANCHOR).applyQuaternion(actor.quaternion));
}

// Measured on the finished 6 m horse and 2 m wide swing chair.
export function placeCarouselPassenger(actor,seat){placeSeat(actor,seat,[0,3.14,-.4]);}
export function placeSwingPassenger(actor,seat){placeSeat(actor,seat,[0,.90,-.3]);}
function placeSeat(actor,seat,anchor){seat.updateWorldMatrix(true,false);seat.getWorldQuaternion(actor.quaternion);actor.position.copy(seat.getWorldPosition(new Vector3())).add(new Vector3(...anchor).applyQuaternion(actor.quaternion));}

// Cabin benches are along the sides, 0.91 m above the floor origin. Keep the
// 0.322 m hip offset supported and face across the cabin, with the tail inside.
export function placeFerrisPassenger(actor,cabin){
 cabin.updateWorldMatrix(true,false);const rotation=cabin.getWorldQuaternion(new Quaternion());
 actor.position.copy(cabin.getWorldPosition(new Vector3())).add(new Vector3(-.52,.588,-.1).applyQuaternion(rotation));
 actor.quaternion.copy(rotation).multiply(new Quaternion().setFromAxisAngle(new Vector3(0,1,0),Math.PI/2));
}
