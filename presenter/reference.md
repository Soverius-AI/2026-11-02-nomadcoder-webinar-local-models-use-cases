# Native browser models — presenter reference

Status: reference scripts and walkthrough. Browser execution and model lifecycle demonstrations have not yet been rehearsed.

## Prepare the presentation browser

### EXPLAIN: What is ready

This desk contains the workshop walkthrough and reference modules. The runnable browser-AI playground is at http://localhost:4413. Start it with `pnpm --dir examples/01-native-browser-models start` from the repository root. Syntax and desk navigation can be checked now; successful model calls, downloads and offline inference still require rehearsal.

### DO: Start this desk

From hands-on-local-llms, run the command below. Open http://localhost:4412. Node 24 is available on this machine; no package installation or API key is required.

```sh
node presenter/serve.mjs
```

### PREPARE: Use desktop Chrome

Use an eligible Chrome desktop profile and a secure top-level page (HTTPS or localhost). Confirm the actual version and API exposure. The core web Prompt API is documented as stable from Chrome 148; extension support starts at 138. Web sampling controls remain a separate experimental feature.

### PREPARE: Check hardware and storage

For Nano-backed APIs, Chrome documents 22 GB free storage, and either more than 4 GB VRAM or a CPU with at least 16 GB RAM and four cores. These are eligibility requirements, not the model file size. Use an unmetered connection for preparation. Translator and Language Detector have separate requirements.

### PREPARE: Check experimental proofreading

The Proofreader documentation currently describes a developer trial and the localhost flag chrome://flags/#proofreader-api. Its origin-trial dates are historical; do not assume an old trial token remains valid. Rehearse this API explicitly. Do not change browser flags automatically.

Official documentation checked 13 October 2026. https://developer.chrome.com/docs/ai/get-started https://developer.chrome.com/docs/ai/prompt-api https://developer.chrome.com/docs/ai/proofreader-api

## Which model does Chrome use?

### EXPLAIN: The browser owns model selection

Prompt API uses Gemini Nano. Chrome selects a suitable variant for the device. Task APIs may use additional adaptation weights; translation and language detection use specialist models. These API names are capabilities, not a catalogue of user-selectable checkpoints.

### DO: Inspect the installed model

Manually open chrome://on-device-internals. Show the installed-model information available in this Chrome build. Ordinary website JavaScript cannot query the exact Nano model version.

### EXPLAIN: Connect this to the next chapter

Native browser AI supplies the model and its lifecycle. Choosing an application-supplied checkpoint belongs in the following ONNX chapter.

Official documentation checked 13 October 2026. https://developer.chrome.com/docs/ai/get-started https://developer.chrome.com/docs/ai/understand-built-in-model-management

## Check availability

### OPEN: Read the capability checks

Open snippets/availability.js. Probe each requested API and configuration. Run inspectCapabilities() in the demo page; a Promise result is a capability report, not evidence that every model is loaded in RAM.

### EXPLAIN: Display honest readiness states

Distinguish unsupported API, unavailable configuration, downloadable, downloading, available, and active session ready. Only mark the session ready after create() resolves. Check the same languages and modalities that the demo will use.

### EXPLAIN: Avoid inferring download history

Translator deliberately masks whether some language pairs have already been downloaded until the site creates that pair. Do not treat downloadable as proof of a cold download or expose invented model/version labels.

Official documentation checked 13 October 2026. https://developer.chrome.com/docs/ai/prompt-api https://developer.chrome.com/docs/ai/translator-api

## Download and initialize

### OPEN: Prepare from a user click

Open snippets/conversation.js. The demo’s Prepare button calls prepareConversation(). Finish asynchronous capability checks before the click so creation begins while user activation is available.

### EXPLAIN: Explain first-use cost

Model resources may need downloading. Show preparation progress and wait for create() to resolve. Progress is an API signal; do not present it as exact byte accounting or proof that the model is resident in memory.

### DO: Show the actual preparation

During rehearsal, record the state before preparation, elapsed time, progress and final success or error. If the model is already installed, call this a warm preparation. Do not fake a download bar or remove an existing model merely to manufacture a cold start.

Official documentation checked 13 October 2026. https://developer.chrome.com/docs/ai/prompt-api https://developer.chrome.com/docs/ai/inform-users-of-model-download

## Persistence, repeat visits and offline use

### EXPLAIN: Separate three lifetimes

Downloaded model resources persist under Chrome’s management. A JavaScript session is a runtime object. Conversation history belongs to that session unless the app separately saves and restores it. Resetting a conversation is not uninstalling a model.

### DO: Repeat without a new model download

Prepare while online. Reload the demo at the same origin and profile, inspect availability, create a fresh session and send a new prompt. Expected: reuse of installed resources, subject to updates or eviction. Never equate create() with a mandatory new download.

### DO: Test offline inference

Once preparation succeeds, use an offline environment verified to affect model-network access. A page-only DevTools offline switch is not sufficient proof that browser-component downloads are blocked. Send a fresh prompt, not a previously recorded response. This desk does not change network settings.

### EXPLAIN: Keep app loading separate

An already open page can run inference without downloading its JavaScript again. Reloading a hosted app offline needs app-shell caching. Native model storage is not the website’s Cache Storage or IndexedDB, and storage.persist() does not pin Chrome’s model.

### EXPLAIN: Explain updates and eviction

Chrome can update model resources or remove them under storage pressure, policy changes or loss of eligibility. Recheck readiness on later visits. Do not promise permanent retention or download exactly once forever.

### PREPARE: Keep a cold-start fallback

Rehearse on the actual presentation profile. If a cold-download demonstration is needed, capture a real first-use session in a separate eligible test profile before the workshop. Record observed behavior rather than assuming it must download.

Official documentation checked 13 October 2026. https://developer.chrome.com/docs/ai/understand-built-in-model-management https://developer.chrome.com/docs/ai/prompt-api https://developer.chrome.com/docs/ai/translator-api

## Conversation

### DO: Send the first prompt

Prepare the session, then call ask(text, onChunk). Append streaming chunks to the visible result and disable Run while a response is in progress.

### DO: Ask a follow-up

Reuse the same session for the second question. Explain that session context is separate from persisted model weights.

### DO: Reset the conversation

Call resetConversation(), prepare a new session with another click, then compare its context. Errors from an interrupted or evicted session should lead to an explicit retry, not an automatic hosted fallback.

Demo input: Suggest two names for a local-first note-taking app.

Expected: Two proposed names.

Demo input: Which of those two names is easier to pronounce, and why?

Expected: An answer referring to the preceding names.

Official documentation checked 13 October 2026. https://developer.chrome.com/docs/ai/prompt-api

## Summarization

### OPEN: Read the task-specific API

Open snippets/summarize.js. Bind prepareSummary() to a button; then pass plain text to summarize(). The options request a short key-point summary.

### DO: Compare input and result

Use the text below. Check whether the output preserves the decision, date and remaining work. A fluent summary is not evidence that every fact is correct.

Demo input: The team agreed to release the note-taking app on Friday. Search is complete, but offline export still needs testing. Mira will test export on Thursday. The team postponed calendar integration to the next release.

Expected: A short summary preserving Friday’s release, the export test and postponed calendar integration.

Official documentation checked 13 October 2026. https://developer.chrome.com/docs/ai/summarizer-api

## Proofreading

### PREPARE: Verify API exposure first

Use the explicit Proofreader capability result. This is an experimental demo. If unavailable, explain that limitation; a correction performed through Prompt API must be labelled as a separate implementation.

### OPEN: Inspect the corrections

Open snippets/proofread.js. Prepare from a user click, pass the sentence to proofread(), and inspect the returned correction data. Verify the exact result shape on the presentation browser before building the final renderer.

### DO: Compare original and corrected text

Show spelling and grammar changes while checking that the meaning stays intact. Do not promise correction explanations that the implementation does not expose.

Demo input: Yesterday we was testing the app and it work very good.

Expected: Grammar corrections while preserving the original meaning.

Official documentation checked 13 October 2026. https://developer.chrome.com/docs/ai/proofreader-api

## German and Spanish translation

### OPEN: Prepare the selected language pair

Open snippets/translate.js. Preflight en→de or en→es, then call prepareTranslation("de") or prepareTranslation("es") from a user click. Changing the target can require another language pack.

### DO: Translate into German, then Spanish

Translate the same English text into each language. Keep input and output visible, and inspect the preservation of the deadline.

### EXPLAIN: Separate language packs from sessions

The JavaScript map reuses active translator objects. Chrome manages the persisted translation resources. Translation is a specialist-model capability, not evidence that the same Nano session handles every task.

Demo input: Please send the updated workshop slides by Thursday afternoon.

Expected: A German or Spanish reminder retaining the Thursday-afternoon deadline.

Official documentation checked 13 October 2026. https://developer.chrome.com/docs/ai/translator-api

## Rehearsal and slide handoff

### PREPARE: Record what actually worked

For each capability, record Chrome version, OS/device, initial availability, configuration, preparation result, output and offline result. Syntax checking these scripts does not validate the browser APIs. Keep observed results separate from expected behavior.

### EXPLAIN: Required audience-slide points

The native-browser-model slides must explicitly cover setup, browser-selected models, first download, retained resources, repeat visits, session versus model lifetime, updates/eviction and offline inference versus offline app loading. These points are recorded here; the slide deck has not been expanded in this change.

### PREPARE: Keep the walkthrough focused

This desk currently covers native browser models only. ONNX, RAG, AG-UI, benchmarks, inference engines and LoRA will receive their own presenter sections as those examples are developed.

Official documentation checked 13 October 2026. https://developer.chrome.com/docs/ai/get-started https://developer.chrome.com/docs/ai/understand-built-in-model-management
