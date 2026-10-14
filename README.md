# Hands-On Local LLMs

Workshop examples for Rainer Hahnekamp and Murat Sari.

This repository follows the practical use cases in the workshop. The native-browser example is saved as a live-coding checkpoint. Example 02 provides Gemma 4 E2B download and chat through ONNX in the browser; example 04 uses the OpenAI SDK with a local llama.cpp server. Example 03 reuses the AI engineering RAG Explorer, followed by a brief browser-local RAG demonstration in example 03A; example 05 reuses the AI DevCraft Mastra/CopilotKit/Jev application with its original hosted OpenRouter setup. Software development remains a planned scaffold. Rehearse real model loading on the workshop device.

| Order | Example | Demonstration |
| --- | --- | --- |
| 1 | [Native browser models](examples/01-native-browser-models/README.md) | Gemini Nano through browser-provided APIs |
| 2 | [ONNX in the browser](examples/02-onnx/README.md) | Application-managed inference, adapted from AI DevCraft |
| 3 | [RAG](examples/03-rag/README.md) | Retrieval and answers grounded in documents |
| 3A | [RAG: the big picture](examples/03a-rag-big-picture/README.md) | Brief closing demo: complete browser-local RAG from AI DevCraft |
| 4 | [Generic Client in Node.js](examples/04-openai-sdk/README.md) | Node.js → local llama.cpp server |
| 5 | [AG-UI](examples/05-ag-ui/README.md) | Mastra, CopilotKit and Jev using the original OpenRouter setup |
| 6 | [Software development](examples/06-software-development/README.md) | Benchmark methodology, sandbox/OpenShell harness and results |

The presentation starts with a recap/basics section, including quantization. Murat’s inference-engine and LoRA material follows these use cases and will be integrated when supplied.

## Working on an example

Each example will document its prerequisites, installation, startup, model preparation, demo steps and reset procedure. Model downloads may require an initial network connection. Any remaining external services must be documented explicitly.

Start the native-browser demo with `pnpm --dir examples/01-native-browser-models start`, then open http://localhost:4200. First install dependencies with `pnpm --dir examples/01-native-browser-models install --frozen-lockfile`. See its README for browser prerequisites and validation. Run the ONNX chat with `pnpm --dir examples/02-onnx install --frozen-lockfile`, then `pnpm --dir examples/02-onnx start`. Open http://localhost:4200. See its README for model size, caching and browser prerequisites. Examples 01, 02 and 03A use port 4200; run one at a time. Run the terminal example with `pnpm --dir examples/04-openai-sdk install --frozen-lockfile`, then `pnpm --dir examples/04-openai-sdk start`. It connects to llama.cpp on port 8080. See example 03 for the RAG Explorer on port 4342 and example 05 for AG-UI on port 4300 with Mastra Studio on 4211. Example 03A also uses port 4200: `pnpm --dir examples/03a-rag-big-picture install --frozen-lockfile`, `pnpm --dir examples/03a-rag-big-picture build`, then `pnpm --dir examples/03a-rag-big-picture preview`. Example 06 remains a scaffold.

See the [reuse plan](docs/reuse-plan.md) for existing source material and the [workshop outline](docs/workshop-outline.md) for the agreed order.

## Presenter desk

See [the presenter desk](presenter/README.md) for setup, model lifecycle, copyable native-browser JavaScript and the rehearsal sequence. Start it with `node presenter/serve.mjs` and open http://localhost:4412.
