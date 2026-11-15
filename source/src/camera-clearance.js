// Segment entry against a closed, finite cylinder. Pass through a solid
// containing the target so a saved or teleported player can still see out.
function cylinderEntry(target, dx, dy, dz, solid, margin, limit) {
  const x = target.x - solid.x, z = target.z - solid.z;
  const r = solid.r + margin, radial = x*x + z*z - r*r;
  const bottom = solid.y - margin, top = solid.y + solid.height + margin;
  if (radial <= 0 && target.y >= bottom && target.y <= top) return Infinity;

  let enter = 0, exit = limit;
  if (Math.abs(dy) < 1e-8) {
    if (target.y < bottom || target.y > top) return Infinity;
  } else {
    const bottomT = (bottom - target.y) / dy, topT = (top - target.y) / dy;
    enter = Math.max(enter, Math.min(bottomT, topT));
    exit = Math.min(exit, Math.max(bottomT, topT));
  }
  const horizontal = dx*dx + dz*dz;
  if (horizontal < 1e-16) {
    if (radial > 0) return Infinity;
  } else {
    const along = x*dx + z*dz, discriminant = along*along - horizontal*radial;
    if (discriminant < 0) return Infinity;
    const root = Math.sqrt(discriminant);
    enter = Math.max(enter, (-along - root) / horizontal);
    exit = Math.min(exit, (-along + root) / horizontal);
  }
  return enter <= exit ? enter : Infinity;
}

function boxEntry(target, dx, dy, dz, solid, margin, limit) {
  const c = Math.cos(solid.rotate || 0), s = Math.sin(solid.rotate || 0);
  const x = target.x - solid.x, z = target.z - solid.z;
  const origin = [x*c-z*s, target.y-solid.y-solid.height/2, x*s+z*c];
  const direction = [dx*c-dz*s, dy, dx*s+dz*c];
  const half = [solid.width/2+margin, solid.height/2+margin, solid.depth/2+margin];
  if (origin.every((v, i) => Math.abs(v) <= half[i])) return Infinity;
  let enter = 0, exit = limit;
  for (let axis = 0; axis < 3; axis++) {
    if (Math.abs(direction[axis]) < 1e-8) {
      if (Math.abs(origin[axis]) > half[axis]) return Infinity;
    } else {
      const first = (-half[axis] - origin[axis]) / direction[axis];
      const second = (half[axis] - origin[axis]) / direction[axis];
      enter = Math.max(enter, Math.min(first, second));
      exit = Math.min(exit, Math.max(first, second));
    }
    if (enter > exit) return Infinity;
  }
  return enter;
}

export function clearCamera(target, desired, groups, margin = .28) {
  const dx = desired.x - target.x, dy = desired.y - target.y, dz = desired.z - target.z;
  const length = Math.hypot(dx, dy, dz);
  if (length < .001) return {...desired, fraction:1, obstacle:null};
  let firstContact = 1, obstacle = null;
  for (const {a, solids} of groups) {
    if (a && Math.hypot(target.x-a.x, target.z-a.z) > a.r+length+margin) continue;
    for (const solid of solids) {
      const radius = (solid.r || Math.hypot(solid.width, solid.depth)/2) + margin;
      if (Math.abs(target.x-solid.x)>radius+length || Math.abs(target.z-solid.z)>radius+length ||
          target.y+length<solid.y-margin || target.y-length>solid.y+solid.height+margin) continue;
      const enter = solid.r ? cylinderEntry(target,dx,dy,dz,solid,margin,firstContact) :
        boxEntry(target,dx,dy,dz,solid,margin,firstContact);
      if (enter < firstContact) { firstContact=enter; obstacle=solid.id; }
    }
  }
  const fraction = firstContact < 1 ? Math.max(0,firstContact-.02/length) : 1;
  return {x:target.x+dx*fraction, y:target.y+dy*fraction, z:target.z+dz*fraction, fraction, obstacle};
}
