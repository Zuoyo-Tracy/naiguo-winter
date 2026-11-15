import {Box3, Frustum, Matrix4} from 'three';

function prepareBatch(mesh, farGeometry) {
  if (!mesh.boundingSphere) mesh.computeBoundingSphere();
  const sphere = mesh.boundingSphere.clone().applyMatrix4(mesh.matrixWorld);
  mesh.geometry.computeBoundingBox();
  const localBounds = mesh.geometry.boundingBox.clone();
  if (farGeometry) {
    farGeometry.computeBoundingBox();
    localBounds.union(farGeometry.boundingBox);
  }

  const count = mesh.count, boxes = [], bounds = new Box3(), matrix = new Matrix4();
  for (let i = 0; i < count; i++) {
    mesh.getMatrixAt(i, matrix);
    matrix.premultiply(mesh.matrixWorld);
    const box = localBounds.clone().applyMatrix4(matrix).expandByScalar(.05);
    boxes.push(box);
    bounds.union(box);
  }
  const attributes = [mesh.instanceMatrix, mesh.instanceColor].filter(Boolean).map(attribute => ({
    attribute, original: attribute.array, compact: attribute.array.slice(),
  }));
  const indices = new Int32Array(count);
  let visible = count, revision = 0, uploadedRevision = -1, compactOnGPU = false;
  return {
    measure(frustum) {
      if (!frustum.intersectsSphere(sphere)) {
        if (visible) revision++;
        visible = 0;
        return 0; // Three already rejects this complete draw.
      }
      let next = 0, changed = false;
      if (frustum.intersectsBox(bounds)) {
        for (let i = 0; i < count; i++) {
          if (!frustum.intersectsBox(boxes[i])) continue;
          if (indices[next] !== i) changed = true;
          indices[next++] = i;
        }
      }
      if (changed || next !== visible) revision++;
      visible = next;
      const faces = (mesh.geometry.index?.count ?? mesh.geometry.attributes.position.count) / 3;
      return (count - visible) * faces;
    },
    draw(subset) {
      mesh.count = subset ? visible : count;
      if (mesh.count === 0) return;
      if (mesh.count === count) {
        if (compactOnGPU) for (const {attribute} of attributes) attribute.needsUpdate = true;
        compactOnGPU = false;
        return;
      }
      const repack = !compactOnGPU || uploadedRevision !== revision;
      for (const {attribute, original, compact} of attributes) {
        if (repack) {
          const width = attribute.itemSize;
          for (let j = 0; j < visible; j++) {
            const start = indices[j] * width;
            compact.set(original.subarray(start, start + width), j * width);
          }
          attribute.needsUpdate = true;
        }
        attribute.array = compact;
      }
      uploadedRevision = revision;
      compactOnGPU = true;
    },
    restore() {
      mesh.count = count;
      for (const {attribute, original} of attributes) attribute.array = original;
    },
  };
}

export function installVisibleInstances(scene, detailItems) {
  const distant = new Map(detailItems.map(item => [item.mesh, item.far])), batches = [];
  scene.traverseVisible(mesh => {
    if (!mesh.isInstancedMesh || mesh.count < 2 || mesh.castShadow || mesh.morphTexture) return;
    const stationary = mesh.name.startsWith('Static prop batch ') || mesh.name.startsWith('Spatial cell ') ||
      mesh.name === 'Lux3D Roman garden hanging wisteria';
    const faces = (mesh.geometry.index?.count ?? mesh.geometry.attributes.position.count) / 3;
    if (stationary && faces * mesh.count >= 8000) batches.push(prepareBatch(mesh, distant.get(mesh)));
  });
  const projection = new Matrix4(), previous = new Matrix4(), frustum = new Frustum();
  const before = scene.onBeforeRender, after = scene.onAfterRender;
  let previousSystem, previousDepth, saved = 0, lastSceneFaces = 0, useSubset = true;
  scene.onBeforeRender = function(renderer, world, camera, ...rest) {
    before.call(this, renderer, world, camera, ...rest);
    const previousSubset = useSubset;
    if (camera.isArrayCamera) {
      previousSystem = undefined;
      saved = 0;
      useSubset = false;
    } else {
      projection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      const sameView = previousSystem === camera.coordinateSystem && previousDepth === camera.reversedDepth && previous.equals(projection);
      if (!sameView) {
        frustum.setFromProjectionMatrix(projection, camera.coordinateSystem, camera.reversedDepth);
        saved = 0;
        for (const batch of batches) saved += batch.measure(frustum);
        previous.copy(projection);
        previousSystem = camera.coordinateSystem;
        previousDepth = camera.reversedDepth;
      }
      // Packing helps dense close-ups. Wide views with few rejected instances
      // are faster on the original static buffers. Hysteresis avoids oscillation.
      useSubset = !lastSceneFaces || saved > lastSceneFaces * (useSubset ? .12 : .18);
    }
    if (useSubset || previousSubset) for (const batch of batches) batch.draw(useSubset);
  };
  scene.onAfterRender = function(renderer, ...rest) {
    lastSceneFaces = (renderer?.info?.render.triangles || 0) + (useSubset ? saved : 0);
    if (useSubset) for (const batch of batches) batch.restore();
    after.call(this, renderer, ...rest);
  };
}
