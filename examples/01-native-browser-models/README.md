# Native browser models

An Angular 22 app for Chrome’s built-in AI with four standalone teaching components: Chat, Summarization, experimental Proofreading and Translation. The Translation component contains one German/Spanish selector. Each has a separate availability check using the same configuration as creation.

## Run

From the repository root, using a Node.js version supported by Angular 22 (Node 24.16 was used here):

```sh
cd examples/01-native-browser-models
pnpm install --frozen-lockfile
pnpm start
```

Open **http://localhost:4413** in desktop Chrome. The server binds only to this computer. Install dependencies once; no API key is needed. The presenter desk remains at http://localhost:4412.

## Walkthrough

1. Choose a capability. Selection and **Check again** only check availability; they never start a download.
2. **Model available**: create a session. **Download available**: explicitly download and prepare. **Downloading**: attach a session to the ongoing preparation to see its progress. **Unavailable** or **Not supported**: preparation remains disabled; read the explanation.
3. During preparation, a progress bar shows real `downloadprogress` events, or stays indeterminate until the browser reports progress. A session is ready only when `create()` resolves, even if the bar already reads 100%.
4. Try the selected use case. The app keeps the session for reuse while this page remains open. Chat requests share conversation context. Switching capabilities preserves their draft text and last result.
5. **Reset session** destroys the selected JavaScript session and checks availability again. It does not uninstall the downloaded model. Reloading the page also requires new sessions, but Chrome normally retains downloaded resources across visits.

Downloads require an initial network connection. Inference uses only the browser APIs: no hosted model endpoint or automatic cloud fallback. Chrome chooses and manages model resources, including translation packs; the app cannot enumerate or select model weights. Translator availability can mask installed packs, so `downloadable` does not prove a new network download will occur. Updates, storage pressure and browser policy can change availability. Offline inference does not automatically cache the app itself.

## Prerequisites and recovery

Use localhost or HTTPS on a supported desktop Chrome/device. Feature checks report the actual browser state. Nano-backed APIs have Chrome-specific hardware/storage requirements. Proofreading is experimental: on localhost enable `chrome://flags/#proofreader-api`, relaunch Chrome, then check again. The Prompt API and specialized APIs have different release/support requirements; consult the official sources below for the installed version.

Availability errors and download failures are displayed separately from an unavailable result. Retry a failed preparation explicitly. For an invalid/expired session, reset it and prepare again. The browser does not always expose why a capability is unavailable; the UI does not guess the cause.

## Validation

```sh
cd examples/01-native-browser-models
pnpm test --watch=false
pnpm build
```

Angular component and service tests use fake browser APIs to exercise state transitions, no-download checks, correct configuration, progress/ready distinction, retries, session reuse/reset, and results. These tests do not establish that real Chrome model downloads or inference work on the workshop device.

Browser check on 13 October 2026 (Codex preview browser): English → German changed from `downloadable` to a ready session and successfully translated the sample into “Bitte senden Sie die aktualisierten Workshop-Folien bis Donnerstagnachmittag.” Resetting its session then reported `available`. This verifies real preparation and inference, but does not establish whether a fresh pack was transferred or an existing pack reused. Chat and Summarization reported `unavailable`; Proofreader was not exposed. Spanish was selectable and reported `downloadable`; its preparation/inference was not tested. No browser console errors were observed. Cold-download progress is covered by the state tests, not a recorded live cold download. Rehearse all supported capabilities, including cold/warm start and offline inference, before presenting.

## Sources

Checked 13 October 2026: [Prompt API](https://developer.chrome.com/docs/ai/prompt-api), [Summarizer](https://developer.chrome.com/docs/ai/summarizer-api), [Proofreader](https://developer.chrome.com/docs/ai/proofreader-api), [Translator](https://developer.chrome.com/docs/ai/translator-api), [model management](https://developer.chrome.com/docs/ai/understand-built-in-model-management).

See [the presenter desk](../../presenter/README.md) for setup and rehearsal notes. Each teaching component owns its Signal Form and action. BrowserModels manages availability, preparation, session reuse, errors and native API calls; ModelPreparation renders the shared preparation UI. The earlier Angular experiments remain unchanged.

## Component map

- `src/app/chat/chat.ts` — prompt input and chat action.
- `src/app/summarization/summarization.ts` — summarization input and action.
- `src/app/proofreading/proofreading.ts` — proofreading input and action.
- `src/app/translation/translation.ts` — one translation unit, German/Spanish selection, separate results and sessions per language.
- `src/app/model-preparation/` — shared availability, progress and prepare/reset UI.
- `src/app/browser-models.ts` — signal-based state and browser model lifecycle.
- `src/app/browser-ai.ts` — browser API types, configurations and injection boundary for tests. The Chrome globals themselves, including `LanguageModel` and its create, prompt, and message types, come from `@types/dom-chromium-ai`. TypeScript’s DOM library does not declare them.

The presenter enables units manually in `src/app/app.ts`; there is no capability-switching UI. Downloads remain explicit user actions. This is a client-rendered, zoneless Angular app; it uses no server-side model inference.

Angular conversion validation (13 October 2026): production build and lifecycle/component tests pass. The live Angular UI correctly switched between German/Spanish availability; German session creation and translation succeeded. Chat/Summarization remain unavailable and Proofreader unsupported in the preview browser. An axe check covers all four unit views in JSDOM; color/focus appearance is inspected separately in the browser.

## Live coding

`src/app/app.ts` is the single entry point for enabling workshop units. Chat is initially enabled. To add the next unit, uncomment its entry in the component’s `imports` array and its element in the inline template. Comment out the previous unit if you want only one visible at a time. Angular updates the page as you save.

Each mounted unit checks availability and exposes preparation, progress and a “Check again” action itself. Translation keeps its German/Spanish selector within that unit. Unmounted components are not instantiated. Removing a component resets its local form/result; model sessions remain managed by the shared service until reset or page reload.
