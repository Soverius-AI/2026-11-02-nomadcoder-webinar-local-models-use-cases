import { readFile, writeFile } from 'node:fs/promises';

const text = await readFile(process.argv[2], 'utf8');
const size = Number(process.argv[4] ?? 900);
const overlap = Number(process.argv[5] ?? 100);
const chunks = [];

if (!Number.isInteger(size) || !Number.isInteger(overlap) || size < 1 || overlap < 0 || overlap >= size) {
  throw new Error('Use a positive size and an overlap between 0 and size - 1.');
}

for (let start = 0; start < text.length; start += size - overlap) {
  const body = text.slice(start, start + size);
  chunks.push({id: `${process.argv[2]}-${start}`, source: process.argv[2], text: body,
    characters: body.length, start, end: start + body.length});
  if (start + size >= text.length) break;
}

await writeFile(process.argv[3], JSON.stringify({schemaVersion: 1, kind: 'chunks',
  settings: {strategy: 'fixed', size, overlap, unit: 'characters'}, chunks}, null, 2));
console.log(`Saved ${chunks.length} chunks to ${process.argv[3]}`);
