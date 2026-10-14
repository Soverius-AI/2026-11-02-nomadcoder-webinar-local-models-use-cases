# Generic Client in Node.js

A minimal Node.js terminal chatbot using the `openai` package with a local llama.cpp server. It asks for input, prints the answer and repeats until you type `end`.

## Prerequisites

- Node.js 22.13+ within the 22.x release line, or Node.js 24+; and pnpm.
- A running llama.cpp server at `http://127.0.0.1:8888`, with a chat model exposed as `Gemma`. The workshop server already advertises this alias. Load the model before running the example.

If you need to start a separate server, use an existing chat-capable GGUF file with your installed llama.cpp:

```sh
llama-server -m /path/to/model.gguf --alias Gemma --host 127.0.0.1 --port 8888 -c 4096
```

Skip this command if the workshop server is already running. Inspect `http://127.0.0.1:8888/v1/models` to find its model IDs. The model name in the request must match an ID or alias exposed by that server.

## Prepare the workshop server

Our router has automatic model loading disabled. Use its model-management UI to load `Gemma`, or run the following once in Node.js from any directory (no packages needed):

```sh
node --input-type=module -e "const r = await fetch('http://127.0.0.1:8888/models/load', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'Gemma' }) }); console.log(r.status, await r.text());"
```

This starts loading asynchronously. Wait until `http://127.0.0.1:8888/v1/models` reports `Gemma` with `status.value` equal to `loaded`. A successful load request alone does not mean the model is ready. An unloaded model returns HTTP 400; a model still loading can return HTTP 503. A normal single-model `llama-server` instance loads its model during startup and does not need this router-specific step.

## Run

From the repository root:

```sh
cd examples/04-openai-sdk
pnpm install --frozen-lockfile
pnpm typecheck
pnpm start
```

At `You:`, enter a prompt and press Enter. After `Assistant:` prints the answer, the next `You:` prompt appears. Try “My name is Alex. Say hello briefly.” followed by “What is my name?”. Type `end` to exit; capitalization and surrounding spaces are ignored.

The messages array retains user and assistant turns for this process and sends them with each request. Restarting clears the conversation. This minimal example does not trim history: start a new chat when the model's context fills. It waits for each complete answer before accepting the next prompt.

## What to show while live coding

1. Import `OpenAI` from the `openai` package.
2. Set `baseURL` to the local server, including `/v1`.
3. Set `apiKey` to `local`: a placeholder for an unauthenticated local server, not an OpenAI account key.
4. Import `input` from `@inquirer/prompts` and type the empty `messages` array as `OpenAI.Chat.Completions.ChatCompletionMessageParam[]`.
5. Inside `while (true)`, await `input({ message: 'You:' })`; break when the user types `end`.
6. Append the user message, then send `model` and `messages` through `client.chat.completions.create()`.
7. Print the answer and append an assistant message so follow-ups have context.
Inquirer manages prompt setup and cleanup. Type `end` for a clean exit.

To use another local setup, edit the defaults in `index.mts` or set `LLAMA_BASE_URL`, `LLAMA_MODEL`, and, if your server requires authentication, `LLAMA_API_KEY`. The script deliberately uses separate local-server settings rather than your OpenAI account environment variables.

The SDK sends the request to the configured server. With the default address, inference stays on this machine. Installing packages requires network access; this script does not download model weights or call OpenAI's hosted API. llama.cpp owns model loading and storage.

A failed connection produces an error and exits with a nonzero status. Check the server address, model ID and server logs. The request has a two-minute timeout and no automatic retries. Responses are capped at 256 tokens; thinking-enabled models may need a higher limit or thinking disabled in their server configuration.

## Verification

The TypeScript version (`index.mts`) passes strict checking with `pnpm typecheck`. On 14 October 2026, `pnpm start` displayed the terminal prompt and `end` exited with status 0. No model inference was performed in this check. Node.js runs the TypeScript directly without a build step.

Inquirer 8.7.3 verified on 14 October 2026 in a terminal against a temporary local HTTP test server: visible input prompts, blank input, two turns with conversation history, and `end` exiting successfully without another model request. The API client remains the real OpenAI SDK; this check exercises terminal interaction rather than model inference.

The previous readline loop was checked on 14 October 2026 using the real SDK against a temporary local HTTP test server: two turns, user/assistant history, blank input, case-insensitive `end` without a request, HTTP errors and empty replies. Error cases closed the terminal and exited with status 1; `end` exited with status 0. Syntax and whitespace checks passed. This isolates the loop behavior; no model inference was performed in this check.

The earlier single-prompt version was verified on 14 October 2026 with Node.js 26.7.0 and OpenAI SDK 7.32.0 against the local llama.cpp server on port 8080, using its `Gemma` alias (Gemma 4 12B Q4_0). The prompt “Say hello in one short sentence.” returned “Hello!”. The unloaded/loading error paths also produced readable errors and a nonzero exit status. JavaScript syntax and repository whitespace checks passed. The test-loaded model was unloaded afterward to restore the initial state.

## References

- [OpenAI Node SDK](https://github.com/openai/openai-node)
- [llama.cpp server](https://github.com/ggml-org/llama.cpp/tree/master/tools/server)

- [Inquirer input prompts](https://github.com/SBoudrias/Inquirer.js#usage)
