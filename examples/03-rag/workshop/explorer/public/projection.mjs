import {UMAP} from 'umap-js';

export function createProjection(vectors, cosine) {
  let seed = 42;
  const random = () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296);
  return new UMAP({
    nComponents: 2, nNeighbors: Math.min(12, vectors.length - 1),
    // umap-js 1.4 divides this by 3 for transform and requires an integer stop count.
    nEpochs: 201, minDist: .15, random,
    distanceFn: (a, b) => Math.max(0, 1 - cosine(a, b)),
  });
}
