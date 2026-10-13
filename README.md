# Hands-On Local LLMs

Workshop examples for Rainer Hahnekamp and Murat Sari.

This repository follows the practical use cases in the workshop. The native-browser example is implemented; the remaining examples are planned scaffolds. Real model downloads and inference still require rehearsal on the workshop browser.

| Order | Example | Demonstration |
| --- | --- | --- |
| 1 | [Native browser models](examples/01-native-browser-models/README.md) | Gemini Nano through browser-provided APIs |
| 2 | [ONNX in the browser](examples/02-onnx/README.md) | Application-managed inference, adapted from AI DevCraft |
| 3 | [RAG](examples/03-rag/README.md) | Retrieval and answers grounded in documents |
| 4 | [AG-UI](examples/04-ag-ui/README.md) | Local models integrated into an interactive application |
| 5 | [Software development](examples/05-software-development/README.md) | Benchmark methodology, sandbox/OpenShell harness and results |

The presentation starts with a recap/basics section, including quantization. Murat’s inference-engine and LoRA material follows these use cases and will be integrated when supplied.

## Working on an example

Each example will document its prerequisites, installation, startup, model preparation, demo steps and reset procedure. Model downloads may require an initial network connection. Any remaining external services must be documented explicitly.

Start the native-browser demo with `pnpm --dir examples/01-native-browser-models start`, then open http://localhost:4413. First install dependencies with `pnpm --dir examples/01-native-browser-models install --frozen-lockfile`. See its README for browser prerequisites and validation. The other examples are not runnable yet.

See the [reuse plan](docs/reuse-plan.md) for existing source material and the [workshop outline](docs/workshop-outline.md) for the agreed order.

## Presenter desk

See [the presenter desk](presenter/README.md) for setup, model lifecycle, copyable native-browser JavaScript and the rehearsal sequence. Start it with `node presenter/serve.mjs` and open http://localhost:4412.
