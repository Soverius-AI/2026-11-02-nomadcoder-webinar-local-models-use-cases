# ONNX in the browser

Example 02: download **Gemma 4 E2B**, then chat with streamed replies. This uses the same generation model, `q4f16` precision and Transformers.js 4.2.0 as the AI DevCraft chatbot: `onnx-community/gemma-4-E2B-it-ONNX`. It does not load an embedding model or use retrieval.

## Run

From the repository root:

```sh
cd examples/02-onnx
pnpm install --frozen-lockfile
pnpm start
```

Open **http://localhost:4200** in desktop Chrome with WebGPU support. No API key or model server is needed. The server binds to this computer only. Both Angular examples use port 4200; stop one before starting the other. The benchmark viewer remains on 4414.

## Demonstrate

1. Click **Download & load Gemma**. Opening the app alone does not download model weights.
2. Inspect the filename and progress for each file. The app waits for ONNX session creation before enabling chat; 100% download is not yet ready.
3. Send a short prompt, then a follow-up. Replies stream into the chat window.
4. **New chat** clears conversation history without unloading or redownloading the model.
5. Reload the page and load Gemma again to demonstrate reuse of cached files. The model still needs to be instantiated in memory.

The browser cache is scoped to the app origin. Keep using `localhost:4200`: switching to `127.0.0.1` or another port creates a different origin. Browser eviction, clearing site data, or model updates can require another download. To rehearse a fresh download, use a separate Chrome profile or remove this model's entries from the Transformers cache through DevTools > Application > Cache storage.

The app downloads tokenizer/configuration and ONNX weights from Hugging Face and its file CDN. ONNX runtime files are served locally from `public/onnx/`, generated from the installed dependency before startup/build. Prompts and generated text stay in the browser; no hosted inference or automatic cloud fallback is used. Model caching does not make the application itself an offline-installed app; keep the local server running.

## Code explanation

Use the [guided walkthrough](WALKTHROUGH.md) for the ONNX chapter. Open `download.ts`, then `prompt.ts`; the app connects those two parts. Optional live coding is limited to the prompt or generation call.

## Live-coding map

- `src/app/protocol.ts`: the single model ID and worker messages.
- `src/app/download.ts`: tokenizer and model download, file progress, and ONNX session creation.
- `src/app/prompt.ts`: chat template and streamed generation.
- `src/app/app.worker.ts`: calls download, then prompt, and posts the results.
- `src/app/app.ts`: the connection. Load starts the download; Send starts a prompt.
- `src/app/app.html`: download progress and chat UI.

Inference runs in a worker to keep the UI responsive. This example uses WebGPU only. AI DevCraft also had a WASM fallback; it is deliberately omitted here to avoid silently downloading a second precision when GPU loading fails. GPU or memory failures are shown explicitly. The demo sends the latest six completed turns plus the current prompt, limits each prompt to 2,000 characters and each reply to 256 tokens. Conversation history is kept only in page memory.

## Size

E2B denotes 2.3 billion effective parameters, with 5.1 billion including embedding tables. The model repository's four `q4f16` ONNX graphs plus data files total approximately **3.38 GB**, before tokenizer/configuration files. Runtime memory is higher and device dependent. These figures were checked on 14 October 2026.

## Validation

```sh
pnpm build
pnpm test:worker
pnpm test --watch=false
```

The worker regression checks exercise the real message handler with fake model calls: load then generate, follow-up prompts, load failures and generation failures. They prevent a completed request from leaving the worker permanently busy.

Tests use a fake worker to check explicit loading, download-versus-ready state, streamed chat, conversation history, retry handling and structural accessibility. They do not prove GPU inference or cache persistence; those require browser rehearsal. The accessibility test excludes contrast because jsdom cannot render it.

Browser verification on 14 October 2026: the real q4f16 model downloaded with per-file progress, reached Ready to chat, streamed “Hello Alex!” in response to a greeting prompt, and answered the follow-up “What is my name?” with “Your name is Alex.” Reloading the page and loading Gemma again also reached Ready to chat within seconds, consistent with cached-file reuse. This verifies real WebGPU inference and multi-turn context on the tested browser/device; it does not guarantee that browser storage will never be evicted.

## Sources and reuse

- [Gemma 4 E2B ONNX model and model card](https://huggingface.co/onnx-community/gemma-4-E2B-it-ONNX)
- [Quantized ONNX files](https://huggingface.co/onnx-community/gemma-4-E2B-it-ONNX/tree/main/onnx)
- [Transformers.js WebGPU guide](https://huggingface.co/docs/transformers.js/guides/webgpu)
- Adapted from the AI DevCraft browser RAG generation worker at `apps/browser-rag/src/app/domains/manual/data/workers/llm.worker.ts` in the separate AI DevCraft example. Its original files remain unchanged.
