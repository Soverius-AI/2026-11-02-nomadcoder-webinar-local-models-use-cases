import {
  AutoTokenizer,
  Gemma4ForConditionalGeneration,
  env,
  type PreTrainedModel,
  type PreTrainedTokenizer,
  type ProgressInfo,
} from '@huggingface/transformers';
import { MODEL_ID } from './protocol';

// ONNX runtime assets are served by this app; weights come from Hugging Face.
env.allowLocalModels = false;
env.useBrowserCache = true;
env.backends.onnx.wasm!.wasmPaths = '/onnx/';

export type FileProgress = { file: string; percent: number | null; done: boolean };

let tokenizer: PreTrainedTokenizer | undefined;
let model: PreTrainedModel | undefined;

export async function downloadModel(onFile: (progress: FileProgress) => void) {
  const progress = (info: ProgressInfo) => {
    if (!('file' in info)) return;
    onFile({
      file: info.file,
      percent: info.status === 'progress' ? info.progress : info.status === 'done' ? 100 : null,
      done: info.status === 'done',
    });
  };

  tokenizer ??= await AutoTokenizer.from_pretrained(MODEL_ID, { progress_callback: progress });
  model ??= await Gemma4ForConditionalGeneration.from_pretrained(MODEL_ID, {
    dtype: 'q4f16',
    device: 'webgpu',
    progress_callback: progress,
  });

  return { tokenizer, model };
}
