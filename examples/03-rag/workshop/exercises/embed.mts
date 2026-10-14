// Add local embeddings to the chunk artifact used by the Explorer.
import OpenAI from "openai";
import { readFile, writeFile } from "node:fs/promises";

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath)
  throw new Error("Usage: node embed.mts <chunks.json> <embeddings.json>");
const model = process.env.EMBED_MODEL ?? "workshop-embed";
const documentPrefix = "title: none | text: ";
const data = JSON.parse(await readFile(inputPath, "utf8"));
const client = new OpenAI({
  baseURL: process.env.EMBED_BASE_URL ?? "http://127.0.0.1:8888/v1",
  apiKey: process.env.EMBED_API_KEY ?? "local",
  maxRetries: 0,
  timeout: 120000,
});

for (const chunk of data.chunks) {
  const result = await client.embeddings.create({
    model,
    input: documentPrefix + chunk.text,
    encoding_format: "float",
  });
  const vector = result.data[0]?.embedding;
  if (!vector?.length || !vector.every(Number.isFinite))
    throw new Error("Invalid embedding for " + chunk.id);
  chunk.vector = vector;
  console.log("Embedded", chunk.id, vector.length, "dimensions");
}

data.kind = "embeddings";
data.embedding = {
  model,
  documentPrefix,
};
await writeFile(outputPath, JSON.stringify(data, null, 2));
