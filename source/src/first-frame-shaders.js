import {Frustum, Group, Matrix4} from 'three';

// Compile from the actual entrance camera after its lights and visible layers
// are set. Compiling the entire park also compiles attractions behind the camera.
export function createFirstFrameWarmup(renderer, scene, camera) {
  let attempted = false;
  let pending = false;

  function prepare() {
    if (attempted) return false;
    attempted = true;
    if (!renderer.extensions.has('KHR_parallel_shader_compile')) return false;

    scene.updateMatrixWorld();
    camera.updateMatrixWorld();
    const projection = new Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    const frustum = new Frustum().setFromProjectionMatrix(projection, camera.coordinateSystem, camera.reversedDepth);
    const visible = [];
    scene.traverseVisible(object => {
      if (!(object.isMesh || object.isSprite || object.isLine || object.isPoints)) return;
      if (!object.layers.test(camera.layers)) return;
      if (!object.frustumCulled || (object.isSprite ? frustum.intersectsSprite(object) : frustum.intersectsObject(object))) {
        visible.push(object);
      }
    });
    if (visible.length < 96) return false;

    pending = true;
    const deadline = performance.now() + 2500;
    let timer;
    const timeout = new Promise(resolve => { timer = setTimeout(resolve, 2500); });
    async function compile() {
      const jobs = [];
      let failed = false;
      for (let i = 0; i < visible.length && !failed && performance.now() < deadline; i += 24) {
        // compileAsync traverses this list. Leave each original parent and
        // world transform intact, including those of skinned/instanced meshes.
        const batch = new Group();
        batch.children = visible.slice(i, i + 24);
        jobs.push(renderer.compileAsync(batch, camera, scene).catch(() => { failed = true; }));
        if (i + 24 < visible.length) await new Promise(resolve => setTimeout(resolve, 0));
      }
      await Promise.all(jobs);
    }
    // Context loss or a driver that never reports completion must not strand
    // the loading screen. Normal rendering can always prepare missing programs.
    Promise.race([compile(), timeout]).catch(() => {}).finally(() => {
      clearTimeout(timer);
      pending = false;
    });
    return true;
  }
  return {prepare, get pending() { return pending; }};
}
