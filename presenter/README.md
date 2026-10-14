# Workshop presenter desk

Run from the repository root:

```sh
node presenter/serve.mjs
```

Open http://localhost:4412. No dependency installation or API key is required. The server listens only on loopback and serves the desk, not the demo application.

The native-browser chapter includes setup, capability checks, preparation/downloads, persistence, model management, conversation, summarization, proofreading and German/Spanish translation. Each section has presenter actions, reference code, prompts, expected outcomes and recovery notes.

Use Previous/Next or the arrow keys. Code and prompts have copy buttons. The desk remembers your place using its own browser storage key. It never runs the model code or changes browser settings.

`guide.json` owns the walkthrough. `snippets/` owns the JavaScript; `build.mjs` reads these files into the displayed code when the server starts. Restart the server after editing. `reference.md` is the printable walkthrough and `sources.md` lists the official references. Keep the printable version aligned when editing the guide.

Status: the desk and JavaScript syntax are checked separately from model behavior. The snippets are reference ES modules, not commands to run in a terminal. The runnable demo is at http://localhost:4200; start it from the repository root with `pnpm --dir examples/01-native-browser-models start`. Model calls, hardware eligibility, download persistence and offline operation still need rehearsal in the presentation Chrome profile. Bind preparation to a user click and render errors visibly. The playground implements capability selection, availability checks, explicit preparation/download progress and four Angular unit components, with German and Spanish grouped under Translation.

The presenter interface is adapted from the AI DevCraft presenter desk; its original files are unchanged.

## Generic Client in Node.js

Between RAG and AG-UI, use the [Node.js terminal example](../examples/04-openai-sdk/README.md). The desk includes a dedicated live-coding step: keep the loop prepared and type only `client.chat.completions.create(...)`. Slide 41 shows the call in context. Its README covers local server setup and the model alias.

## ONNX code walkthrough

Use the [ONNX walkthrough](../examples/02-onnx/WALKTHROUGH.md) to explain the existing worker, model loading, caching, chat template and streaming.

## RAG and AG-UI

Use the [RAG walkthrough](../examples/03-rag/README.md) for PDF chunking, embedding-space visualization and vector retrieval. Use the [AG-UI walkthrough](../examples/05-ag-ui/README.md) for the AI DevCraft application and its Mastra Studio workflow. Generation and Jev in the latter use hosted OpenRouter, as requested.
