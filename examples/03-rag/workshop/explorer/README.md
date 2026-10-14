> Workshop copy: start with [the example setup](../../README.md). This copy uses Explorer port 4342 and PostgreSQL port 5437.

# RAG Lab Explorer

A local workshop application: run editable Node scripts in Docker, then inspect their JSON output in the Explorer. PostgreSQL/pgvector holds the RAG practice corpus; the incident application keeps its existing SQLite database. Mastra is introduced in Unit 3, not required here.

## Start from the repository root

```sh
docker compose -f workshop/compose.yaml up -d explorer
```

Open http://localhost:4342. Accounts: `operator` and `maintenance`; default password for both: `workshop`. Passwords are hashed in memory, sessions use random tokens in HttpOnly/SameSite cookies, and sessions expire after 12 hours or a server restart. These are deliberately published local training credentials. The Compose ports bind to loopback. This is not a production identity service.

Docker Compose supplies PostgreSQL and the Explorer image. The same image runs the one-shot lab commands, with editable scripts mounted from the checkout and output written to `workshop/output`. No Node installation is needed for Unit 2. Build again after changing backend/UI/data files. Script/library edits are mounted into lab runs immediately.

Docker uses a configurable `RAG_LAB_SUBNET` (default `10.203.44.0/24`), because the development machine had exhausted Docker's automatic network pools. Change it if it conflicts with a participant's VPN/network. Use `docker compose -f workshop/compose.yaml down` to stop; the database volume remains.

## Core exercises

```sh
docker compose -f workshop/compose.yaml run --rm lab chunk --size 900 --overlap 100
docker compose -f workshop/compose.yaml run --rm lab chunk --size 450 --overlap 50 --out output/chunks-small.json
docker compose -f workshop/compose.yaml run --rm lab store
```

1. **Chunks:** start with the project PDF using `bash workshop/chunk-pdf.sh "workshop/corpus/reference-documents/optyma-cooler.pdf" --size 900 --overlap 100` (Git Bash on Windows), or `.\workshop\chunk-pdf.ps1 -Pdf ".\workshop\corpus\reference-documents\optyma-cooler.pdf" -Size 900 -Overlap 100` in PowerShell. Extraction runs automatically inside Docker. Then upload `chunks.json`, inspect text and automatic metadata, compare the smaller run. Sizes are characters, not tokens. The core exercise compares fixed-size chunks with overlap against whole-paragraph chunks. Semantic chunking is a planned optional bonus.
2. **Embeddings:** participants write `workshop/exercises/embed.mts`, using the OpenAI library directly to read their chunks, call the manually loaded embedding model and save the required artifact shape. See exercise 02.3 for the contract. Then upload `embeddings.json`, build a UMAP projection, click points, compare cosine neighbours. The map reduces to two dimensions; reported similarity uses all original dimensions. A fixed random seed makes a given run repeatable, not a scientific guarantee of cluster separation. At most 800 points are plotted; neighbour search uses all loaded vectors.
3. **PostgreSQL:** import the artifact in the UI or use `lab store`. Import atomically replaces the practice corpus. Use the console to INSERT, SELECT, inspect `vector_dims(embedding)` and compare vectors with `<=>` (cosine distance). Each console request has a separate restricted `lab_writer` connection; prepared protocol rejects multiple statements. The console is a local SQL playground, not an untrusted public SQL service.
4. **Retrieval:** ask “The cooling room is too warm. What should I do?” using vector search. Inspect the passages and SQL before generation. Compare keyword search with shorter terms such as “cooling”. PostgreSQL plain full-text queries combine terms; this is not BM25 or hybrid search. Exact search suits this small corpus; no HNSW/IVFFlat index is created.

The shared Explorer image contains no embedding-script solution or `lab embed` shortcut. Participants write their own script in 02.3; the completed script is available on `unit-3`.

## Sources and preparation

`data/prepared-corpus.json` includes six fictional company documents and selected, prepared excerpts from two Danfoss manuals. PDF extraction is instructor preparation, not a participant task. Optyma excerpts preserve the parent symptom and individual cause/action rows from PDF page 6; AK-RC excerpts are from PDF page 5. They are not full-manual ingestion. The original URLs and document identifiers are in `../corpus/sources.json` and each prepared manual record.

Both original manuals are included in `workshop/corpus/reference-documents/`. Compose mounts that directory read-only at `/pdfs` for the Explorer and lab container. The lab guide links directly to the project PDFs; no participant download is needed. Manufacturer provenance is recorded in `../corpus/sources.json`.

To use another PDF directly, pass its path to `workshop/chunk-pdf.sh` or `workshop/chunk-pdf.ps1`. They mount the selected file read-only and run the lab container without its database dependencies. The parser reads selectable text, creates page-based sections, and adds the original filename, page and document hash. Scanned PDFs need OCR first. Table reading order must be checked in the Explorer; no automatic semantic heading/table reconstruction is claimed. The Bash wrapper supports macOS/Linux and Windows Git Bash; the PowerShell wrapper is the native Windows entry point. A `.sh` file does not run directly in PowerShell. The input limit is 50 MB. Explicit `--out` / `-Out` paths are relative to the caller’s current directory (absolute paths also work); without that option, output stays at `workshop/output/chunks.json`. Direct Compose commands still use container paths, with `output/` mapped to `workshop/output/`.

The prepared mixed corpus remains available with `lab chunk` and no `--pdf`. To extend that curated corpus, prepare sections in its JSON format and rebuild the image. The supplied chunker accepts `--sources DANFOSS-OPTYMA,DANFOSS-AKRC` or `all`. Its `--sources` filter applies only to the prepared corpus and cannot be combined with `--pdf`.

## Chunking strategies

The participant exercise covers `fixed` and `paragraph`; semantic chunking is a planned optional bonus and has no runnable command yet. Bookmark-based `structure` remains available in the tool but is outside the exercise.

Both PDF wrappers accept `--strategy paragraph --overlap 0` (PowerShell: `-Strategy paragraph -Overlap 0`) or `structure` instead of `paragraph`. The lab command accepts the same long options. Omitting overlap for these strategies defaults to zero; a nonzero overlap is rejected. Existing `section` and `fixed` modes retain their previous behavior.

Paragraph mode uses PDF.js line positions and spacing to join wrapped lines into paragraph blocks. It packs whole blocks to the character target and flags `oversized` chunks instead of cutting a paragraph. Structure mode additionally matches the PDF's embedded bookmarks to headings on their destination pages. It preserves the heading with each resulting chunk and exposes `headingPath`, `boundary`, `paragraphStart` and `paragraphEnd`. All modes keep page provenance. This is bookmark-based structure support, not arbitrary table/heading reconstruction.

Both included PDFs work with paragraph mode. AK-RC supports structure mode: 22 of 23 bookmarks match; its stale final bookmark is reported and page 22 remains unsectioned. Optyma has no bookmarks; structure mode fails explicitly. See [the measured results and semantic-chunking proposal](../instructor/CHUNKING.md).

## Model connections

The browser visualizes artifacts. All model calls happen in Node through OpenAI-compatible HTTP endpoints. Compose includes a separate, pinned llama-server image with a web UI and manual model loading. Start it with `docker compose -f workshop/compose.yaml up -d llama` and open http://127.0.0.1:8080. See [the model setup](../llama/README.md). The Explorer image itself contains no model weights.

Copy `.env.example` to the repository-root `.env` if one does not already exist, or export the variables before Compose. Never overwrite an existing environment file. Configure:

- `EMBED_BASE_URL`: default `http://llama:8080/v1`; `EMBED_MODEL`, `EMBED_SPACE_ID`, `DOCUMENT_PREFIX`, `QUERY_PREFIX`.
- `CHAT_BASE_URL`: default `http://llama:8080/v1`, `CHAT_MODEL`.
- `RERANK_BASE_URL`: default port 8082, `RERANK_MODEL`; llama.cpp `/v1/rerank` response contract.

The model server must listen on an interface reachable from Docker; host loopback-only binding may not be reachable. Restrict access with the host firewall when exposing an inference listener. Linux uses the Compose host-gateway mapping. Qualify the model/server combination on participants' hardware before delivery. Model aliases are placeholders, not downloaded models. Changing models or preprocessing requires a new `EMBED_SPACE_ID`, re-embedding and re-importing. The API rejects mismatched dimensions and stored configuration.

Unlike the older file pipeline, these bonus views retrieve afresh per request. Vector retrieval needs embeddings running alongside the requested reranking/chat endpoint; protected keyword retrieval needs only the latter. No fake vectors, scores or generated answers are substituted when a model is unavailable.

## Bonus views and security boundary

- **Reranking:** score and reorder the retrieved candidates with a real reranker, showing before/after. It cannot recover missing candidates.
- **Grounding:** send at most three passages and show the exact messages alongside the answer. Check citations manually. A marked injection can be added to evidence to test behaviour. Prompt instructions are not a security guarantee; generation has no action tools.
- **Relationships:** follow explicit links up to two hops. This is a small curated document graph, not automatic entity extraction/GraphRAG. It is an inspectable extension; expanded passages are not silently merged into the retrieval pipeline.
- **Security:** sign in under each account and compare permitted documents, keyword retrieval, graph expansion and downstream model context. Separate non-owner PostgreSQL roles enforce row-level policies before evidence leaves the backend. The backend derives the role from the session, never from a model argument or uploaded metadata. The protected demonstration is pre-seeded with trusted text and uses keyword retrieval; it does not yet have a protected vector index.

Local artifact inspection and the practice schema intentionally expose participants' own synthetic files. JSON role labels do not grant database access. The SQL role cannot access protected tables, alter policies or assume an administrative role. The laptop owner can still inspect distributed files and local container credentials. No real restricted company records belong in this workshop.

## Verification

```sh
npm ci --prefix workshop/explorer
npm test --prefix workshop/explorer
RUN_INTEGRATION=1 RUN_MODEL_CONTRACT=1 npm test --prefix workshop/explorer
```

The integration suite requires the running local containers and inserts and removes its own labelled test row in the practice table. It verifies login/session/origin checks, PostgreSQL role separation, graph permissions and SQL escape attempts. Unit tests cover chunk boundaries/metadata and malformed vector artifacts. These checks do not qualify model quality or prove prompt-injection resistance. Final model selection, memory sizing and a classroom timing rehearsal remain instructor gates.

The model-contract suite creates and drops its own temporary database. It uses explicitly synthetic HTTP responses to verify vector search, reranker response validation and grounded context, preserving the workshop practice corpus. It is not a live-model evaluation.

Embedding uploads contain `embedding.model` and `embedding.documentPrefix`. The Explorer supplies `spaceId` and `queryPrefix` from its own settings when importing and searching; participant scripts do not include them. Legacy uploads may still contain these fields, but the Explorer ignores them. Model and document-prefix mismatches are rejected before replacing the practice corpus.
