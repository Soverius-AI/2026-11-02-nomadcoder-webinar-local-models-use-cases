# ONNX code walkthrough

Use the prepared Angular demo. Open `download.ts` for the download, then `prompt.ts` for the prompt. The app connects them. Optional live coding is limited to the prompt or the generate call.

## ONNX in the browser

ONNX is a model format; ONNX Runtime Web executes the exported model. Transformers.js supplies the model-specific interface, tokenizer, chat template and generation loop on top of that runtime. In this example the chosen model is Gemma 4 E2B, exported to ONNX, and the execution device is WebGPU.

The Angular app stays on the main thread and connects two parts. `download.ts` fetches the tokenizer and weights and creates the ONNX session. `prompt.ts` turns the conversation into a prompt and streams the reply. Load posts a load request; Send posts the conversation. The worker calls the matching part and posts progress, decoded text chunks, ready, done and error messages back. WebGPU performs GPU work; a Web Worker is a separate JavaScript execution context, not a separate model server. The worker prevents this work from occupying the UI's JavaScript thread.

Point out the boundary: Hugging Face supplies model files during setup; prompt inference takes place in the browser. Local runtime assets come from /onnx/. A worker does not by itself make the app offline-capable.

Sources: https://huggingface.co/docs/transformers.js/guides/webgpu and the workshop worker implementation.

## Download and load Gemma

```js
const MODEL_ID = 'onnx-community/gemma-4-E2B-it-ONNX';

const tokenizer = await AutoTokenizer.from_pretrained(MODEL_ID);

const model = await Gemma4ForConditionalGeneration.from_pretrained(
  MODEL_ID,
  {
    dtype: 'q4f16',
    device: 'webgpu',
    progress_callback: progress,
  },
);
```

Explain the two objects separately: the tokenizer converts text into token IDs and back; the model performs inference. Both must match the model repository. from_pretrained loads existing resources, not training a model.

MODEL_ID is the same Gemma 4 E2B repository as the AI DevCraft chatbot. The model-specific class supplies its generation implementation. dtype selects the repository's q4f16 export; device selects WebGPU. These are separate decisions: model precision versus execution backend. q4f16 combines quantized weights with floating-point computation; it does not imply that every tensor is four bits.

The progress callback is explained on the next slide. Model file download and ONNX session initialization happen before the promise resolves. Enable chat only afterward. Keep the resulting objects and reuse them for later turns. `download.ts` uses ??= to avoid creating another instance and also reports tokenizer download progress.

AutoTokenizer, Gemma4ForConditionalGeneration, TextStreamer and env are imported from @huggingface/transformers in the existing worker. Keep that import in the prepared scaffold; these slides focus on the inference code. The application serves ONNX runtime assets from /onnx/ and uses env.allowLocalModels = false, which disables probing app-relative model paths; it does not mean cloud inference.

Source: https://huggingface.co/docs/transformers.js/guides/webgpu .

Source: examples/02-onnx/src/app/download.ts in the workshop repository. This is a teaching excerpt from the download part. The app starts it with a load message.

## Download progress and caching

```js
env.useBrowserCache = true;

function progress(info) {
  if (info.status !== 'progress') return;

  postMessage({
    type: 'file',
    file: info.file,
    percent: info.progress,
  });
}
```

Set env.useBrowserCache before loading the tokenizer and model. It enables reuse of downloaded resources through browser cache storage when supported; it is not a guarantee of permanent storage and is different from a model instance in RAM or GPU memory.

The callback receives events for individual files. Filter progress events before reading their fields. info.progress is a percentage for that file, not the total model and not Chrome Prompt API's fraction between zero and one. The complete worker also handles done events. A file at 100% does not mean model initialization is complete.

Rehearsal: load once, show the download progress, chat, reload the page, then load again. Cached resources may be reused, but initialization still occurs. New chat only clears chat messages; it leaves the loaded worker/model available. Reload recreates the worker and model instances.

Keep the exact origin: localhost:4200 and localhost:4415 have separate storage; 127.0.0.1 is also a different hostname. Browser eviction, manual deletion, changed resource URLs or model revisions can require fresh downloads. Cache API storage is not the same thing as requesting persistent storage. This app does not call navigator.storage.persist(), and enabling useBrowserCache does not grant persistence. Model caching also does not install an offline app shell.

Source: https://huggingface.co/docs/transformers.js/api/env .

Source: examples/02-onnx/src/app/download.ts in the workshop repository. This is a teaching excerpt from the download part. The app renders each file message while loading.

## Prepare the prompt

```js
const messages = [
  { role: 'user', content: 'Hi, who are you?' },
];

const inputs = tokenizer.apply_chat_template(messages, {
  add_generation_prompt: true,
  enable_thinking: false,
});
```

Explain that an instruction-tuned model expects its own chat format, including role markers and special tokens. apply_chat_template renders that format and, by default here, tokenizes it into the inputs required by generate. A plain English string is not yet the complete model input.

add_generation_prompt appends the model-specific assistant prefix so generation continues as the assistant. enable_thinking is a template variable supported by this Gemma export; it is not a universal ONNX option. `prompt.ts` passes it via the templateVariables object because the library's generic options type does not declare every model-specific template variable.

For a follow-up, pass the previous user and assistant messages along with the new user message. The example worker prepends its system instruction. The UI retains recent conversation turns in page memory; the model does not remember messages merely because its weights stay loaded. Distinguish conversation history from file caching.

Walk from messages to formatted prompt to token IDs, then point to ...inputs on the next slide. Source: installed Transformers.js 4.2.0 tokenizer implementation and the model's chat template.

Source: examples/02-onnx/src/app/prompt.ts in the workshop repository. This is a teaching excerpt from the prompt part. The app sends the conversation after the model is ready.

## Stream the answer

```js
const streamer = new TextStreamer(tokenizer, {
  skip_prompt: true,
  skip_special_tokens: true,
  callback_function: text => postMessage({ type: 'token', text }),
});

await model.generate({
  ...inputs,
  max_new_tokens: 256,
  do_sample: false,
  streamer,
});
```

Generate one token after another using the prepared inputs. max_new_tokens caps newly generated output, not the prompt or total context length. do_sample: false chooses greedy token selection instead of random sampling.

TextStreamer decodes token IDs incrementally. skip_prompt prevents the input prompt from being repeated in the displayed answer; skip_special_tokens hides formatting/control tokens. callback_function receives decoded text pieces, which do not necessarily correspond one-to-one with model tokens. The application's message type is called token, but the payload is decoded text.

The worker posts those pieces back to Angular, which appends them to its current reply. Inference remains in the browser; this is a local worker message, not a network request. After `runPrompt` resolves, the worker posts done; exceptions produce an error message and reset its busy flag.

Suggested live-coding boundary: leave the UI, worker creation, messages and loading code prepared. If typing anything, add only the messages array or the generate call, then explain the surrounding code. Demonstrate a short prompt and a follow-up, and show a cached reload. Do not spend the unit recreating Angular forms or progress UI.

Source: https://huggingface.co/docs/transformers.js/api/generation/streamers .

Source: examples/02-onnx/src/app/prompt.ts in the workshop repository. This is a teaching excerpt from the prompt part. The app appends each text piece to the current reply.

