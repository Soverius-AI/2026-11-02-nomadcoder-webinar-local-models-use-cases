import { copyFile, mkdir, readdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
const require = createRequire(import.meta.url);
const transformersRequire = createRequire(require.resolve('@huggingface/transformers'));
const runtime = dirname(transformersRequire.resolve('onnxruntime-web'));
const target = new URL('../public/onnx/', import.meta.url);
await mkdir(target, { recursive: true });
for (const file of await readdir(runtime)) {
  if (file.endsWith('.wasm') || file.endsWith('.mjs')) {
    await copyFile(join(runtime, file), new URL(file, target));
  }
}
