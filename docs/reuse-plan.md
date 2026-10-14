# Existing source material

Read-only inspection on 13 October 2026. The browser sources were inspected on that date. RAG and AG-UI were selectively imported on 14 October 2026; their example READMEs document setup and source revisions.

## Browser examples

Source repository: https://github.com/Soverius-AI/packt-agentic-frontends-workshop

- `experiment/webmcp-nano-grid`: candidate for the native-browser-model example. Inspect the exact functionality before selecting material.
- `ai-devcraft/04-browser-rag`: AI DevCraft browser RAG source. Its presentation notes describe Transformers.js over ONNX Runtime Web, with separate embedding and generation workers. Use the relevant inference code for the ONNX chapter, The RAG chapter uses the AI engineering Explorer as its main exercise; example 03A reuses the browser app as a brief closing demonstration.

These branch names were observed in local checkouts. Their availability on the remote has not been verified.

## AG-UI

Same source repository, local branch `ai-devcraft/03-agentic-ui`.

The documented demonstration includes workflow activity, frontend tools and human-approved alarm proposals. Its current README describes OpenRouter-backed generation and Jev review. Example 05 preserves that hosted OpenRouter/Jev setup, as explicitly requested, while running the application and Studio locally.

## Software development

Source repository: https://github.com/Soverius-AI/local-models-for-coding-benchmark

Keep benchmark execution and authoritative result data there. Prepare a focused walkthrough here explaining the task, harness, sandbox/OpenShell setup, checks and results. Rainer confirmed that sandboxing belongs in the benchmark explanation. This scaffold does not verify the current harness or campaign status.

Select a verified campaign and revision before presenting results. Preserve incomplete and inconclusive outcomes and state what each measurement evaluates.

## RAG Explorer

Example 03 reuses `ai-engineering-presenter/workshop/explorer`, repository PDFs and deterministic chunking scripts. It has a separate Compose project and database, and connects to the existing local llama.cpp embedding endpoint. Its main walkthrough shows UMAP projection and cosine similarity in the original embedding space.
