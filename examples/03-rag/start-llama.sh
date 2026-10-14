#!/usr/bin/env bash
set -euo pipefail

exec llama-server \
  --hf-repo ggml-org/embeddinggemma-300M-GGUF:Q8_0 \
  --alias workshop-embed \
  --embeddings \
  --ctx-size 2048 \
  --batch-size 2048 \
  --ubatch-size 2048 \
  --host 127.0.0.1 \
  --port 8888
