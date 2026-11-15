import test from 'node:test';import assert from 'node:assert/strict';import {staleReleaseFiles} from '../tools/pages-release-plan.mjs';
test('release cleanup retains remote edits, unknown files, and files referenced by the new build',()=>{
 const before=[{path:'assets/old.glb',sha:'a'},{path:'assets/edited.glb',sha:'b'},{path:'assets/still.glb',sha:'c'},{path:'README.md',sha:'d'}];
 const remote=[...before.map(x=>({...x})),{path:'assets/new-by-user.glb',sha:'e'}];remote[1].sha='remote-edit';
 assert.deepEqual(staleReleaseFiles(before,[{path:'assets/still.glb'}],remote),['assets/old.glb']);
});
