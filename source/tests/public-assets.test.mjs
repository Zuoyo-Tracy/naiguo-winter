import test from 'node:test';import assert from 'node:assert/strict';import {resolvePublicAsset} from '../src/public-assets.js';
test('project Pages assets retain their path and cache query under the repository prefix',()=>{
 assert.equal(resolvePublicAsset('/assets/hero.glb?v=8','/naiguo-winter/'),'/naiguo-winter/assets/hero.glb?v=8');
 assert.equal(resolvePublicAsset('/ui/collection/reader.png','/naiguo-winter/'),'/naiguo-winter/ui/collection/reader.png');
 assert.equal(resolvePublicAsset('/assets/hero.glb','/'),'/assets/hero.glb');
});
test('blob images, data textures and external URLs are not rewritten',()=>{for(const u of ['blob:https://site/a','data:image/png;base64,AAA','https://cdn.example/model.glb','relative.png','/api/account/me'])assert.equal(resolvePublicAsset(u,'/naiguo-winter/'),u);});
