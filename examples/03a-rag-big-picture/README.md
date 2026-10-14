# 03A · RAG: the big picture

A brief closing demonstration for the RAG unit, reused from AI DevCraft. **Example 03 (RAG Explorer) remains the main exercise** for chunking, embeddings, vector visualization and retrieval. This separate Angular app shows those ideas working together in a complete browser-local assistant. No code walkthrough is required for the closing demo.

## Run

Requires Node.js 24.15 or newer, pnpm, and a recent desktop Chromium browser with WebGPU and enough memory for the models.

From this directory (`examples/03a-rag-big-picture`):

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm preview
```

Open http://localhost:4200. This is separate from the RAG Explorer and can run alongside it. For development, use `pnpm start` instead of the build/preview commands (also port 4200).

Click **Prepare local models** while online and wait for both models to be ready. The first download is several GB. Rehearse model loading and a complete answer before presenting. Cached model files belong to the browser profile and origin; retain `http://localhost:4200` and the same profile. Examples 01, 02 and 03A share port 4200; run one at a time. Browser storage may be evicted.

## Closing demo · about 3–5 minutes

1. Ask: **The cold room warms up when staff keep walking in and out. What does the manual suggest?**
2. Click **Find passages** and show the retrieved manual passages.
3. Click **Ask locally** and show Gemma's streamed answer with page/entry references.
4. Expand **Context sent to Gemma**: it receives the question and retrieved text.
5. Optionally turn off **Use manual context** and repeat for a short comparison. Each question starts without conversation history.

Expected evidence includes Optyma Cooler p. 6, entry 2.6: inspect door seals and keep doors closed. These are possible causes and recommended checks, not a diagnosis.

## What runs where

| Component | Implementation |
| --- | --- |
| Question embeddings | `Xenova/multilingual-e5-base`, Transformers.js / ONNX Runtime Web, WASM |
| Retrieval | PGlite with pgvector inside a browser worker |
| Answer generation | `onnx-community/gemma-4-E2B-it-ONNX`, Transformers.js / ONNX Runtime Web, WebGPU (WASM fallback) |
| Document preparation | 13 short teaching paraphrases with precomputed E5 vectors shipped in `public/rag-index.json` |

The question is embedded at runtime. Document embeddings are already prepared; they are not computed anew on every question. The supplied index covers selected manual entries, not the entire manual. See [ATTRIBUTION.md](ATTRIBUTION.md).

No API key, Docker database, llama.cpp server, Mastra or cloud inference is needed. The first model download comes from Hugging Face; source links open the original online PDF. The preview server serves static application files only. The build includes an offline app shell, but a fully disconnected demonstration must be rehearsed separately on the presentation machine. Do not assume that a successful build proves offline inference.

## Checks and optional corpus rebuild

```sh
pnpm test
pnpm typecheck:pipeline
pnpm build
```

The shipped index is ready to use. Only after changing the corpus:

```sh
pnpm build:index
pnpm verify:recall
```

Those optional commands load the E5 model and may download it. The ordinary tests check corpus/vector consistency, cited context and isolation of the RAG-off prompt without loading models.

To reset the conversation, submit a new question; history is not retained. To fully reset the demo, stop the server with Ctrl+C and clear site data for localhost:4200 in the browser. Clearing site data also removes cached models and can require another download.

## Source

Selectively copied from `AI-DevCraft-2026/browser-rag/apps/browser-rag`, source repository `Soverius-AI/packt-agentic-frontends-workshop`, checkout HEAD `137e1d6cc383199b449953d44b6f70f8e3cce662`. Current tracked working files were reused. The original repository is unchanged. This folder contains only the standalone browser app, corpus/index, runtime preparation scripts and attribution; no model weights or local databases.

## Verification of this copy

14 October 2026: production build, pipeline TypeScript check and all three existing tests passed. The standalone app was opened successfully on port 4200. Model download, live retrieval/generation and disconnected operation have not been re-run for this copy; rehearse those in the presentation browser.
