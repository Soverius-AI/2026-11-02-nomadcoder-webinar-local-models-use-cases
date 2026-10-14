import {
  TextStreamer,
  type PreTrainedModel,
  type PreTrainedTokenizer,
} from '@huggingface/transformers';
import type { ChatMessage } from './protocol';

export async function runPrompt(
  tokenizer: PreTrainedTokenizer,
  model: PreTrainedModel,
  messages: ChatMessage[],
  onText: (text: string) => void,
) {
  const templateVariables = { enable_thinking: false };
  const inputs = tokenizer.apply_chat_template(
    [
      { role: 'system', content: 'You are a helpful assistant. Keep your answers concise.' },
      ...messages,
    ],
    { add_generation_prompt: true, ...templateVariables },
  );
  const streamer = new TextStreamer(tokenizer, {
    skip_prompt: true,
    skip_special_tokens: true,
    callback_function: onText,
  });
  await model.generate({ ...inputs, max_new_tokens: 256, do_sample: false, streamer });
}
