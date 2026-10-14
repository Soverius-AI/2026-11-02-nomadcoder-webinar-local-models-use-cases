import { readFile, writeFile } from 'node:fs/promises';

const text = await readFile(process.argv[2], 'utf8');
const chunks = text.trim().split(/\r?\n\s*\r?\n/).filter(paragraph => paragraph.trim()).map((text, index) => ({
  id: `${process.argv[2]}-${index + 1}`,
  source: process.argv[2],
  text,
  characters: text.length,
  paragraph: index + 1,
}));

await writeFile(process.argv[3], JSON.stringify({schemaVersion: 1, kind: 'chunks',
  settings: {strategy: 'paragraph', overlap: 0}, chunks}, null, 2));
console.log(`Saved ${chunks.length} chunks to ${process.argv[3]}`);
