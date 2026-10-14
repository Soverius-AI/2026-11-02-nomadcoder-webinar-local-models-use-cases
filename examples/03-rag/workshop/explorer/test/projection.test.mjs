import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';

test('a fitted map can project a question without blocking forever', () => {
  const moduleUrl = new URL('../public/projection.mjs', import.meta.url).href;
  const code = `
    import {createProjection} from ${JSON.stringify(moduleUrl)};
    const vectors = Array.from({length:24}, (_,i) => [Math.sin(i), Math.cos(i), i/24 + .1]);
    const cosine = (a,b) => a.reduce((sum,x,i)=>sum+x*b[i],0) / (Math.hypot(...a)*Math.hypot(...b));
    const umap = createProjection(vectors, cosine);
    await umap.fitAsync(vectors);
    for (const query of [[.2,.7,.3], [.6,.1,.9]]) {
      const [point] = umap.transform([query]);
      if (point.length !== 2 || !point.every(Number.isFinite)) throw Error('Invalid query point');
    }
    console.log('projected two questions');
  `;
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', code], {encoding:'utf8', timeout:3000});
  assert.equal(result.error, undefined, 'query projection must terminate within three seconds');
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /projected two questions/);
});
