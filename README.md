# Hands-On Local LLMs

Workshop examples for Rainer Hahnekamp and Murat Sari.

This repository follows the practical use cases in the workshop. It is currently a scaffold: the examples below are planned, not runnable yet.

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

There is no shared install or start command yet. Choose the application structure as the first demo is implemented; do not imply that the planned examples already run.

See the [reuse plan](docs/reuse-plan.md) for existing source material and the [workshop outline](docs/workshop-outline.md) for the agreed order.
