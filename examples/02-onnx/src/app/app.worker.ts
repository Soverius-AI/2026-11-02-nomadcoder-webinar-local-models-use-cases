/// <reference lib="webworker" />
import { PreTrainedModel, PreTrainedTokenizer } from '@huggingface/transformers';
import { downloadModel } from './download';
import { runPrompt } from './prompt';
import type { WorkerRequest, WorkerResponse } from './protocol';

let tokenizer: PreTrainedTokenizer | undefined;
let model: PreTrainedModel | undefined;
let busy = false;
const post = (message: WorkerResponse) => postMessage(message);

addEventListener('message', async ({ data }: MessageEvent<WorkerRequest>) => {
  if (busy) return;
  busy = true;

  try {
    switch (data.type) {
      case 'load': {
        ({ tokenizer, model } = await downloadModel((file) => post({ type: 'file', ...file })));
        // Download completion alone does not mean the inference session is ready.
        post({ type: 'ready' });
        break;
      }
      case 'generate':
        if (!model || !tokenizer) throw new Error('Load Gemma before sending a message.');
        await runPrompt(tokenizer, model, data.messages, (text) => post({ type: 'token', text }));
        post({ type: 'done' });
        break;
    }
  } catch (error) {
    post({ type: 'error', error: error instanceof Error ? error.message : String(error) });
  } finally {
    busy = false;
  }
});
